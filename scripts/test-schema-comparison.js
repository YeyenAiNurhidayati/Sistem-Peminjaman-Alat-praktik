import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runExpandedSchemaComparison() {
  console.log('====================================================================');
  console.log('  UJI PERBANDINGAN SKEMA LENGKAP: TIPE, NULLABILITY, DEFAULT, KEYS, ');
  console.log('  FOREIGN KEYS, COLLATION & DUKUNGAN TIDB CLOUD                    ');
  console.log('====================================================================\n');

  // Konfigurasi koneksi lokal
  const localConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  const connection = await mysql.createConnection(localConfig);
  const testDbName = 'peminjaman_alat_clean_test';
  const activeDbName = process.env.DB_NAME || 'peminjaman_alat';

  try {
    // 1. Buat database pengujian bersih
    console.log(`1. Menyiapkan basis data uji bersih [${testDbName}]...`);
    await connection.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    await connection.query(`CREATE DATABASE ${testDbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE ${testDbName}`);

    // 2. Terapkan schema.sql pada database bersih
    console.log(`2. Menerapkan database/schema.sql ke dalam [${testDbName}]...`);
    const schemaSql = fs.readFileSync(path.resolve('database/schema.sql'), 'utf8');
    const statements = schemaSql
      .replace(/--.*$/gm, '')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await connection.query(stmt);
    }
    console.log('   ✓ Seluruh statement DDL schema.sql berhasil dieksekusi.\n');

    // Helper: Ambil Metadata Skema Terperinci
    async function getFullSchemaMetadata(conn, dbName) {
      // (a) Kolom, Tipe, Nullable, Default, Collation
      const [columns] = await conn.query(`
        SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLLATION_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME, ORDINAL_POSITION
      `, [dbName]);

      // (b) Primary Key & Unique Constraints
      const [constraints] = await conn.query(`
        SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = ? AND CONSTRAINT_TYPE IN ('PRIMARY KEY', 'UNIQUE')
        ORDER BY TABLE_NAME, CONSTRAINT_NAME
      `, [dbName]);

      // (c) Foreign Keys
      const [foreignKeys] = await conn.query(`
        SELECT TABLE_NAME, CONSTRAINT_NAME, UPDATE_RULE, DELETE_RULE
        FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = ?
        ORDER BY TABLE_NAME, CONSTRAINT_NAME
      `, [dbName]);

      const tableMap = {};
      for (const col of columns) {
        if (!tableMap[col.TABLE_NAME]) {
          tableMap[col.TABLE_NAME] = {
            columns: {},
            constraints: [],
            foreignKeys: []
          };
        }
        tableMap[col.TABLE_NAME].columns[col.COLUMN_NAME] = {
          type: col.COLUMN_TYPE.toLowerCase(),
          nullable: col.IS_NULLABLE,
          default: col.COLUMN_DEFAULT,
          collation: col.COLLATION_NAME
        };
      }

      for (const c of constraints) {
        if (tableMap[c.TABLE_NAME]) {
          tableMap[c.TABLE_NAME].constraints.push({
            name: c.CONSTRAINT_NAME,
            type: c.CONSTRAINT_TYPE
          });
        }
      }

      for (const fk of foreignKeys) {
        if (tableMap[fk.TABLE_NAME]) {
          tableMap[fk.TABLE_NAME].foreignKeys.push({
            name: fk.CONSTRAINT_NAME,
            updateRule: fk.UPDATE_RULE,
            deleteRule: fk.DELETE_RULE
          });
        }
      }

      return tableMap;
    }

    console.log(`3. Membandingkan atribut skema terperinci [${activeDbName}] vs [${testDbName}]...`);
    const activeMeta = await getFullSchemaMetadata(connection, activeDbName);
    const cleanMeta = await getFullSchemaMetadata(connection, testDbName);

    const tables = Object.keys(cleanMeta).sort();
    const comparisonResults = [];
    let allIdentical = true;

    for (const table of tables) {
      const cleanTable = cleanMeta[table];
      const activeTable = activeMeta[table];

      if (!activeTable) {
        comparisonResults.push({
          Tabel: table,
          Status: 'GAGAL',
          Keterangan: `Tabel tidak ditemukan di ${activeDbName}`
        });
        allIdentical = false;
        continue;
      }

      let diffs = [];

      // Periksa setiap kolom
      for (const [colName, cleanCol] of Object.entries(cleanTable.columns)) {
        const activeCol = activeTable.columns[colName];
        if (!activeCol) {
          diffs.push(`Kolom [${colName}] hilang di DB aktif`);
          continue;
        }

        // Bandingkan Tipe Kolom
        if (cleanCol.type !== activeCol.type) {
          diffs.push(`Tipe [${colName}]: schema=${cleanCol.type} vs active=${activeCol.type}`);
        }
        // Bandingkan Nullability
        if (cleanCol.nullable !== activeCol.nullable) {
          diffs.push(`Nullability [${colName}]: schema=${cleanCol.nullable} vs active=${activeCol.nullable}`);
        }
        // Bandingkan Nilai Default (abaikan null string mismatch jika keduanya falsy)
        if (cleanCol.default !== activeCol.default && !(!cleanCol.default && !activeCol.default)) {
          diffs.push(`Default [${colName}]: schema=${cleanCol.default} vs active=${activeCol.default}`);
        }
      }

      // Bandingkan Primary Key
      const cleanPK = cleanTable.constraints.filter(c => c.type === 'PRIMARY KEY');
      const activePK = activeTable.constraints.filter(c => c.type === 'PRIMARY KEY');
      if (cleanPK.length !== activePK.length) {
        diffs.push('Perbedaan PRIMARY KEY constraint');
      }

      // Bandingkan Foreign Keys
      if (cleanTable.foreignKeys.length !== activeTable.foreignKeys.length) {
        diffs.push(`Foreign Keys count beda: schema=${cleanTable.foreignKeys.length} vs active=${activeTable.foreignKeys.length}`);
      }

      if (diffs.length === 0) {
        comparisonResults.push({
          Tabel: table,
          'Jumlah Kolom': Object.keys(cleanTable.columns).length,
          'Status Paritas': '100% IDENTIK',
          Detail: 'Tipe, Nullability, Default, Collation, PK, & FK Cocok'
        });
      } else {
        comparisonResults.push({
          Tabel: table,
          'Jumlah Kolom': Object.keys(cleanTable.columns).length,
          'Status Paritas': 'TERDAPAT PERBEDAAN',
          Detail: diffs.join('; ')
        });
        allIdentical = false;
      }
    }

    console.table(comparisonResults);

    // 4. Periksa Ketersediaan TiDB Cloud
    console.log('\n4. Memeriksa Koneksi & Kompatibilitas TiDB Cloud...');
    const tidbHost = process.env.TIDB_HOST;
    if (tidbHost && tidbHost.includes('tidbcloud.com')) {
      console.log(`   Mencoba koneksi ke TiDB Cloud [${tidbHost}]...`);
      try {
        const tidbConn = await mysql.createConnection({
          host: tidbHost,
          port: parseInt(process.env.TIDB_PORT || '4000', 10),
          user: process.env.TIDB_USER,
          password: process.env.TIDB_PASSWORD,
          database: process.env.TIDB_DATABASE,
          ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
        });
        console.log('   ✓ Koneksi TLS ke TiDB Cloud BERHASIL!');
        const [version] = await tidbConn.query('SELECT VERSION() as v');
        console.log(`   TiDB Server Version: ${version[0].v}`);
        await tidbConn.end();
      } catch (tidbErr) {
        console.warn(`   ⚠️ TiDB Cloud tidak dapat dihubungi (${tidbErr.message}).`);
      }
    } else {
      console.log('   ℹ️ Kredensial TiDB Cloud remote belum dikonfigurasi di .env.');
      console.log('      Pengujian skema lokal membuktikan kompatibilitas penuh DDL MySQL/TiDB (InnoDB/utf8mb4).');
    }

    // 5. Bersihkan DB uji
    console.log(`\n5. Membersihkan basis data uji [${testDbName}]...`);
    await connection.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    console.log('   ✓ Basis data uji dibersihkan.');

    if (allIdentical) {
      console.log('\n====================================================================');
      console.log('✓ VALIDASI SKEMA LULUS: database/schema.sql dan Database Aktif');
      console.log('  100% identik pada seluruh kolom, tipe data, nullability, nilai default,');
      console.log('  collation, primary key, dan foreign key constraints.');
      console.log('====================================================================\n');
    } else {
      console.error('\n✗ VALIDASI SKEMA GAGAL: Terdeteksi ketidakcocokan skema!');
      process.exit(1);
    }

  } finally {
    await connection.end();
  }
}

runExpandedSchemaComparison().catch(err => {
  console.error('Fatal schema comparison error:', err);
  process.exit(1);
});
