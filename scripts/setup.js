import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import readline from 'readline';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config();

async function runSetupVerification() {
  console.log('================================================================');
  console.log('       SKRIP VERIFIKASI & SETUP OTOMATIS SIPAB v2.0             ');
  console.log('================================================================\n');

  const checklist = [];

  // -------------------------------------------------------------------
  // 1. Cek Versi Node.js (Wajib >= v22 sesuai package.json engines)
  // -------------------------------------------------------------------
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  const isNodeValid = majorVersion >= 22;

  checklist.push({
    komponen: 'Versi Node.js',
    status: isNodeValid ? 'LULUS' : 'GAGAL',
    detail: `Terdeteksi: ${nodeVersion}`,
    saran: isNodeValid
      ? 'Versi Node.js memenuhi syarat (>= v22.0.0)'
      : 'Perbarui Node.js ke versi LTS terbaru (minimal v22.x) di https://nodejs.org'
  });

  // -------------------------------------------------------------------
  // 2. Cek Keberadaan File .env & Variabel Wajib (Tanpa Membocorkan Nilai)
  // -------------------------------------------------------------------
  const envPath = path.join(rootDir, '.env');
  const isEnvExists = fs.existsSync(envPath);

  if (!isEnvExists) {
    checklist.push({
      komponen: 'File Konfigurasi (.env)',
      status: 'GAGAL',
      detail: 'File .env tidak ditemukan',
      saran: 'Salin file .env.example menjadi .env (cp .env.example .env)'
    });
  } else {
    const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'SESSION_SECRET'];
    const missingVars = requiredVars.filter(v => !process.env[v] || process.env[v].trim() === '');

    const isVarsValid = missingVars.length === 0;
    checklist.push({
      komponen: 'Variabel Lingkungan (.env)',
      status: isVarsValid ? 'LULUS' : 'GAGAL',
      detail: isVarsValid ? 'Semua variabel wajib terisi' : `Variabel belum diisi: ${missingVars.join(', ')}`,
      saran: isVarsValid ? 'Konfigurasi environment lengkap' : 'Buka file .env dan lengkapi variabel yang masih kosong'
    });
  }

  // -------------------------------------------------------------------
  // 3. Uji Koneksi Basis Data MySQL / TiDB
  // -------------------------------------------------------------------
  let dbConnection = null;
  let isDbConnected = false;
  const rawDbHost = process.env.DB_HOST || '127.0.0.1';
  const cleanDbHost = rawDbHost.trim().toLowerCase();
  const isLocalHost = cleanDbHost === '127.0.0.1' || cleanDbHost === 'localhost';

  try {
    const isSSL = process.env.DB_SSL === 'true';
    dbConnection = await mysql.createConnection({
      host: cleanDbHost,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'peminjaman_alat',
      ssl: isSSL ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
    });

    const [rows] = await dbConnection.query('SELECT 1 as status');
    isDbConnected = rows && rows[0]?.status === 1;

    checklist.push({
      komponen: 'Koneksi Basis Data',
      status: 'LULUS',
      detail: `Terhubung ke ${cleanDbHost}:${process.env.DB_PORT || 3306}`,
      saran: 'Koneksi database berhasil dan stabil'
    });
  } catch (dbError) {
    checklist.push({
      komponen: 'Koneksi Basis Data',
      status: 'GAGAL',
      detail: `Gagal: ${dbError.code || dbError.message}`,
      saran: 'Pastikan server database sudah aktif dan kredensial di .env sudah sesuai'
    });
  }

  // -------------------------------------------------------------------
  // 4. Migrasi Skema Aman & Konfirmasi Host Non-Lokal
  // -------------------------------------------------------------------
  let isMigrationOk = false;
  let migrationSkippedByPrompt = false;

  if (dbConnection && isDbConnected) {
    // Keamanan Produksi: Jika host non-lokal (misal TiDB Cloud), minta konfirmasi eksplisit
    const isForce = process.argv.includes('--yes') || process.argv.includes('-y') || process.env.FORCE_MIGRATE === 'true';
    if (!isLocalHost && !isForce) {
      console.log(`\n⚠️ PERINGATAN KEAMANAN PRODUKSI:`);
      console.log(`Database target adalah HOST NON-LOKAL: [${cleanDbHost}]`);
      console.log(`Operasi migrasi akan menerapkan skema tabel pada host ini.`);

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const confirmation = await new Promise(resolve => {
        rl.question('Ketik "YA" untuk mengonfirmasi migrasi pada host non-lokal ini: ', answer => {
          rl.close();
          resolve(answer.trim());
        });
      });

      if (confirmation !== 'YA') {
        migrationSkippedByPrompt = true;
        console.log('Operasi migrasi dibatalkan pengguna. Skema tabel tidak disentuh.\n');
      }
    }

    if (migrationSkippedByPrompt) {
      checklist.push({
        komponen: 'Migrasi & Data Awal (Seed)',
        status: 'TIDAK DIUJI',
        detail: 'Dibatalkan pengguna (host non-lokal)',
        saran: 'Jalankan dengan konfirmasi "YA" atau flag --yes jika Anda ingin migrasi remote'
      });
      await dbConnection.end();
    } else {
      try {
        // Eksekusi skema tabel (schema.sql)
        const schemaSqlPath = path.join(rootDir, 'database', 'schema.sql');
        if (fs.existsSync(schemaSqlPath)) {
          const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
          const statements = schemaSql
            .replace(/--.*$/gm, '')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

          for (const statement of statements) {
            await dbConnection.query(statement);
          }

          // Idempotent migration: Ensure deleted_at column exists on barang table
          const [cols] = await dbConnection.query("SHOW COLUMNS FROM barang LIKE 'deleted_at'");
          if (!cols || cols.length === 0) {
            await dbConnection.query('ALTER TABLE barang ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL');
          }
        }

        // Keamanan Produksi: Data demo (seed-demo.sql) HANYA boleh jika NODE_ENV != production
        const isProduction = process.env.NODE_ENV === 'production';
        if (!isProduction) {
          const [usersCount] = await dbConnection.query('SELECT COUNT(*) as total FROM users');
          if (usersCount[0].total === 0) {
            const seedSqlPath = path.join(rootDir, 'database', 'seed-demo.sql');
            if (fs.existsSync(seedSqlPath)) {
              const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
              const seedStatements = seedSql
                .replace(/--.*$/gm, '')
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

              for (const stmt of seedStatements) {
                await dbConnection.query(stmt);
              }
            }
          }
        } else {
          console.log('[PRODUKSI] Data demo transaksi peminjaman dilewati demi integritas basis data produksi.');
        }

        // Pastikan tabel rate_limits tersedia
        await dbConnection.query(`
          CREATE TABLE IF NOT EXISTS rate_limits (
            key_id VARCHAR(191) PRIMARY KEY,
            attempts INT NOT NULL DEFAULT 1,
            last_attempt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            locked_until TIMESTAMP NULL DEFAULT NULL,
            INDEX idx_locked_until (locked_until)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        const [finalUsers] = await dbConnection.query('SELECT COUNT(*) as total FROM users');
        const [finalBarang] = await dbConnection.query('SELECT COUNT(*) as total FROM barang');

        isMigrationOk = true;
        checklist.push({
          komponen: 'Migrasi & Data Awal (Seed)',
          status: 'LULUS',
          detail: `Tabel siap (${finalUsers[0].total} pengguna, ${finalBarang[0].total} barang)`,
          saran: 'Struktur tabel dan data berhasil diverifikasi'
        });
      } catch (migError) {
        checklist.push({
          komponen: 'Migrasi & Data Awal (Seed)',
          status: 'GAGAL',
          detail: `Error migrasi: ${migError.message}`,
          saran: 'Periksa hak akses database Anda atau jalankan database/schema.sql secara manual'
        });
      } finally {
        await dbConnection.end();
      }
    }
  } else {
    checklist.push({
      komponen: 'Migrasi & Data Awal (Seed)',
      status: 'TIDAK DIUJI',
      detail: 'Tergantung koneksi database',
      saran: 'Selesaikan masalah koneksi basis data terlebih dahulu'
    });
  }

  // -------------------------------------------------------------------
  // 5. Uji Endpoint Kesehatan Sistem (/api/health)
  // -------------------------------------------------------------------
  if (isDbConnected && isMigrationOk) {
    try {
      const { default: app } = await import('../src/app.js');
      const server = http.createServer(app);
      await new Promise(resolve => server.listen(0, resolve));
      const port = server.address().port;

      const healthRes = await fetch(`http://127.0.0.1:${port}/api/health`);
      const healthData = await healthRes.json();
      await new Promise(resolve => server.close(resolve));

      const isHealthOk = healthRes.status === 200 && healthData.status === 'ok' && healthData.database === 'connected';

      checklist.push({
        komponen: 'Pemeriksaan Kesehatan (/api/health)',
        status: isHealthOk ? 'LULUS' : 'GAGAL',
        detail: isHealthOk ? 'HTTP 200 (database: connected)' : `Respon tidak sesuai: ${JSON.stringify(healthData)}`,
        saran: isHealthOk ? 'Aplikasi serverless Express siap melayani request' : 'Periksa konfigurasi pool database'
      });
    } catch (healthError) {
      checklist.push({
        komponen: 'Pemeriksaan Kesehatan (/api/health)',
        status: 'GAGAL',
        detail: `Error: ${healthError.message}`,
        saran: 'Periksa konfigurasi server di server.js dan src/app.js'
      });
    }
  } else {
    checklist.push({
      komponen: 'Pemeriksaan Kesehatan (/api/health)',
      status: 'TIDAK DIUJI',
      detail: 'Tergantung tahapan sebelumnya',
      saran: 'Selesaikan masalah koneksi atau migrasi database terlebih dahulu'
    });
  }

  // -------------------------------------------------------------------
  // 6. Cetak Ringkasan Hasil Pemeriksaan
  // -------------------------------------------------------------------
  console.log('HASIL RINGKASAN VERIFIKASI SISTEM:\n');
  console.table(checklist.map(item => ({
    'Komponen': item.komponen,
    'Status': item.status === 'LULUS' ? '✓ LULUS' : (item.status === 'GAGAL' ? '✗ GAGAL' : '- TIDAK DIUJI'),
    'Keterangan': item.detail,
    'Saran Perbaikan': item.saran
  })));

  const passedCount = checklist.filter(item => item.status === 'LULUS').length;
  const totalCount = checklist.length;
  const allPassed = passedCount === totalCount;

  console.log('\n================================================================');
  console.log(`Ringkasan: ${passedCount} dari ${totalCount} komponen verifikasi berstatus LULUS.`);
  if (allPassed) {
    console.log('Seluruh konfigurasi dasar dan koneksi sistem siap digunakan.');
    console.log('Jalankan server pengembangan dengan perintah: npm run dev');
  } else {
    console.log('Terdapat komponen yang belum lolos. Silakan periksa kolom "Saran Perbaikan".');
  }
  console.log('================================================================\n');

  setTimeout(() => process.exit(allPassed ? 0 : 1), 100);
}

runSetupVerification().catch(err => {
  console.error('Fatal setup error:', err);
  process.exit(1);
});
