import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import pool from '../src/config/database.js';

dotenv.config();

async function runIdempotentSeed() {
  console.log('--- Menjalankan Inisialisasi Basis Data Aman & Idempoten (SIPAB) ---');

  const isProduction = process.env.NODE_ENV === 'production';
  const connection = await pool.getConnection();

  try {
    // -----------------------------------------------------------------
    // 1. Akun Inti: Admin, Guru, Siswa
    // -----------------------------------------------------------------
    // Kredensial diambil secara dinamis dari Environment Variables
    const adminPass = process.env.SEED_ADMIN_PASSWORD || (isProduction ? null : crypto.randomBytes(8).toString('hex'));
    const guruPass = process.env.SEED_GURU_PASSWORD || (isProduction ? null : crypto.randomBytes(8).toString('hex'));
    const siswaPass = process.env.SEED_SISWA_PASSWORD || (isProduction ? null : crypto.randomBytes(8).toString('hex'));

    if (isProduction && (!adminPass || !guruPass || !siswaPass)) {
      throw new Error(
        'Di lingkungan produksi, variabel SEED_ADMIN_PASSWORD, SEED_GURU_PASSWORD, dan SEED_SISWA_PASSWORD wajib ditentukan di environment variables!'
      );
    }

    const initialUsers = [
      {
        nama: 'Hendrik Administrator',
        username: 'admin',
        rawPass: adminPass,
        role: 'admin',
        nip: '198505112008011001',
        nisn: null,
        kelas: null
      },
      {
        nama: 'Pak Guru Mesin',
        username: 'guru',
        rawPass: guruPass,
        role: 'guru',
        nip: '197203151998021002',
        nisn: null,
        kelas: null
      },
      {
        nama: 'Siswa Teladan',
        username: 'siswa',
        rawPass: siswaPass,
        role: 'siswa',
        nip: null,
        nisn: '202401001',
        kelas: '12A'
      }
    ];

    console.log('\n[1/3] Memeriksa & Menginisialisasi Akun Pengguna...');
    for (const u of initialUsers) {
      // Cek apakah akun sudah ada (Idempoten: jangan pernah menimpa password yang sudah ada!)
      const [existing] = await connection.query('SELECT id, username FROM users WHERE username = ?', [u.username]);

      if (existing && existing.length > 0) {
        console.log(`  ✓ Akun '${u.username}' sudah ada (password tersimpan dipertahankan, tidak ditimpa).`);
      } else {
        const hash = await bcrypt.hash(u.rawPass, 10);
        await connection.query(`
          INSERT INTO users (nama, username, password, role, nip, nisn, kelas)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [u.nama, u.username, hash, u.role, u.nip, u.nisn, u.kelas]);
        console.log(`  ✓ Akun '${u.username}' baru berhasil dibuat menggunakan kredensial dari environment variable.`);
      }
    }

    // -----------------------------------------------------------------
    // 2. Data Master Barang Bengkel
    // -----------------------------------------------------------------
    console.log('\n[2/3] Memeriksa Data Master Alat Bengkel...');
    const defaultTools = [
      { nama: 'Kunci Inggris 10 inch', kategori: 'Hand Tools', stok: 10, kondisi: 'Baik', foto: 'kunci_pas.jpg' },
      { nama: 'Kunci Shock Set 24 pcs', kategori: 'SST', stok: 6, kondisi: 'Baik', foto: 'kunci_shock.jpg' },
      { nama: 'Obeng Plus 6 inch', kategori: 'Hand Tools', stok: 15, kondisi: 'Baik', foto: 'obeng.jpg' },
      { nama: 'Obeng Minus 5 inch', kategori: 'Hand Tools', stok: 12, kondisi: 'Baik', foto: 'obeng.jpg' },
      { nama: 'Dongkrak Buaya 2 Ton', kategori: 'Power Tools', stok: 4, kondisi: 'Baik', foto: 'bearing_puller.jpg' },
      { nama: 'Palu Besi 500 gram', kategori: 'Hand Tools', stok: 7, kondisi: 'Baik', foto: 'palu.jpg' },
      { nama: 'Tang Kombinasi 8 inch', kategori: 'Hand Tools', stok: 9, kondisi: 'Baik', foto: 'tang.jpg' },
      { nama: 'Bor Listrik Tangan 450W', kategori: 'Power Tools', stok: 2, kondisi: 'Baik', foto: 'bor_listrik.jpg' },
      { nama: 'Gerinda Tangan Listrik 4 inch', kategori: 'Power Tools', stok: 3, kondisi: 'Baik', foto: 'gerinda_listrik.jpg' },
      { nama: 'Kacamata Pelindung Safety', kategori: 'Hand Tools', stok: 25, kondisi: 'Baik', foto: 'clutch_aligning_tool.jpg' }
    ];

    for (const tool of defaultTools) {
      const [existingTool] = await connection.query('SELECT id FROM barang WHERE nama_barang = ?', [tool.nama]);
      if (!existingTool || existingTool.length === 0) {
        await connection.query(`
          INSERT INTO barang (nama_barang, kategori, stok, kondisi, foto)
          VALUES (?, ?, ?, ?, ?)
        `, [tool.nama, tool.kategori, tool.stok, tool.kondisi, tool.foto]);
      }
    }
    const [totalBarang] = await connection.query('SELECT COUNT(*) as total FROM barang');
    console.log(`  ✓ Data alat bengkel terverifikasi (Total: ${totalBarang[0].total} item).`);

    // -----------------------------------------------------------------
    // 3. Data Transaksi Demo (Hanya untuk Development, BUKAN Produksi!)
    // -----------------------------------------------------------------
    console.log('\n[3/3] Memeriksa Data Transaksi Peminjaman...');
    if (isProduction) {
      console.log('  ✓ [PRODUKSI] Melewati pembuatan transaksi demo. Basis data transaksi tetap bersih.');
    } else {
      const [peminjamanRows] = await connection.query('SELECT COUNT(*) as total FROM peminjaman');
      if (peminjamanRows[0].total === 0) {
        // Ambil user siswa dan barang untuk membuat 1 transaksi demo yang valid
        const [siswaUser] = await connection.query("SELECT id FROM users WHERE role = 'siswa' LIMIT 1");
        const [sampleBarang] = await connection.query('SELECT id FROM barang LIMIT 1');

        if (siswaUser.length > 0 && sampleBarang.length > 0) {
          await connection.query(`
            INSERT INTO peminjaman (id_user, nama_peminjam, id_barang, tgl_pinjam, status)
            VALUES (?, 'Siswa Teladan', ?, CURDATE(), 'pending')
          `, [siswaUser[0].id, sampleBarang[0].id]);
          console.log('  ✓ [DEVELOPMENT] 1 transaksi peminjaman contoh berstatus pending berhasil dibuat untuk pengujian.');
        }
      } else {
        console.log(`  ✓ Transaksi peminjaman sudah ada (${peminjamanRows[0].total} record), data dipertahankan.`);
      }
    }

    console.log('\n================================================================');
    console.log('✓ PROSES SEEDING BASIS DATA SELESAI SECARA AMAN DAN IDEMPOTEN.');
    console.log('================================================================\n');

  } catch (err) {
    console.error('✗ Seeding gagal:', err.message);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

runIdempotentSeed();
