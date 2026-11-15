import pool from '../src/config/database.js';
import app from '../src/app.js';
import http from 'http';
import bcrypt from 'bcryptjs';
import { validateImageMagicBytes } from '../src/utils/storageAdapter.js';

async function runModule2Tests() {
  console.log('===============================================================');
  console.log('         RUNNING MODULE 2 AUTOMATED TEST SUITE                 ');
  console.log('===============================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running on ${baseUrl}\n`);

  const results = [];

  try {
    // -----------------------------------------------------------------
    // Helper: Login as a specific user and get cookies + session
    // -----------------------------------------------------------------
    async function loginAs(username, password) {
      const getLogin = await fetch(`${baseUrl}/auth/login`);
      let cookie = getLogin.headers.get('set-cookie').split(';')[0];
      const html = await getLogin.text();
      const csrf = html.match(/name="_csrf"\s+value="([^"]+)"/)[1];

      const body = new URLSearchParams();
      body.append('username', username);
      body.append('password', password);
      body.append('_csrf', csrf);

      const postRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie },
        body: body.toString(),
        redirect: 'manual'
      });

      const newCookie = postRes.headers.get('set-cookie');
      if (newCookie) {
        cookie = newCookie.split(';')[0];
      }
      return { cookie, location: postRes.headers.get('location') };
    }

    // -----------------------------------------------------------------
    // Ephemeral Test Users Setup
    // -----------------------------------------------------------------
    const testAdminUser = 'test_mod2_admin';
    const testSiswaUser = 'test_mod2_siswa';
    const testAdminPass = 'AdminPassSecure999!';
    const testSiswaPass = 'SiswaPassSecure888!';

    const adminHash = await bcrypt.hash(testAdminPass, 10);
    const siswaHash = await bcrypt.hash(testSiswaPass, 10);

    await pool.execute('DELETE FROM users WHERE username IN (?, ?)', [testAdminUser, testSiswaUser]);
    await pool.execute(
      'INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)',
      ['Test Administrator', testAdminUser, adminHash, 'admin']
    );
    await pool.execute(
      'INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)',
      ['Test Siswa Teladan', testSiswaUser, siswaHash, 'siswa']
    );

    // -----------------------------------------------------------------
    // TEST 1: Dashboard for Admin/Guru
    // -----------------------------------------------------------------
    console.log('--- TEST 1: Dashboard Rendering (Admin / Guru) ---');
    const adminSession = await loginAs(testAdminUser, testAdminPass);
    const resAdminDash = await fetch(`${baseUrl}/dashboard`, {
      headers: { 'Cookie': adminSession.cookie }
    });
    const adminDashHtml = await resAdminDash.text();

    const hasAdminStats = adminDashHtml.includes('Total Alat') &&
                         adminDashHtml.includes('Sedang Dipinjam') &&
                         adminDashHtml.includes('Aktivitas Terbaru') &&
                         adminDashHtml.includes('Administrator');

    results.push({
      id: 'MOD2-01',
      scenario: 'Dashboard Rendering untuk Role Admin/Guru (Global Stats & Aktivitas Terbaru)',
      expected: 'Status 200, menampilkan Total Alat, Sedang Dipinjam, Menunggu Setuju, Aktivitas Terbaru',
      actual: hasAdminStats ? 'Statistik global dan tabel aktivitas berhasil dirender' : 'Elemen dashboard admin tidak lengkap',
      passed: hasAdminStats
    });
    console.log(`Result: ${hasAdminStats ? 'PASSED (Lolos)' : 'FAILED'}`);

    // -----------------------------------------------------------------
    // TEST 2: Dashboard for Siswa
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: Dashboard Rendering (Siswa) ---');
    const siswaSession = await loginAs(testSiswaUser, testSiswaPass);
    const resSiswaDash = await fetch(`${baseUrl}/dashboard`, {
      headers: { 'Cookie': siswaSession.cookie }
    });
    const siswaDashHtml = await resSiswaDash.text();

    const hasSiswaStats = siswaDashHtml.includes('Pinjaman Aktif') &&
                         siswaDashHtml.includes('Aksi Cepat') &&
                         siswaDashHtml.includes('Ajukan Peminjaman') &&
                         !siswaDashHtml.includes('Aktivitas Terbaru'); // Student cannot see global activity list

    results.push({
      id: 'MOD2-02',
      scenario: 'Dashboard Rendering untuk Role Siswa (Statistik Personal & Aksi Cepat)',
      expected: 'Status 200, menampilkan Pinjaman Aktif, Aksi Cepat, tanpa Aktivitas Terbaru global',
      actual: hasSiswaStats ? 'Statistik personal dan tombol aksi cepat siswa berhasil dirender' : 'Elemen dashboard siswa tidak lengkap',
      passed: hasSiswaStats
    });
    console.log(`Result: ${hasSiswaStats ? 'PASSED (Lolos)' : 'FAILED'}`);

    // -----------------------------------------------------------------
    // TEST 3: Profil Saya Page (GET /profil)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: Tampilan Profil Saya (GET /profil) ---');
    const resProfil = await fetch(`${baseUrl}/profil`, {
      headers: { 'Cookie': siswaSession.cookie }
    });
    const profilHtml = await resProfil.text();
    const hasProfilElements = profilHtml.includes('Profil Saya') &&
                             profilHtml.includes('Foto Profil') &&
                             profilHtml.includes('Ganti Kata Sandi') &&
                             profilHtml.includes('Kata Sandi Lama');

    results.push({
      id: 'MOD2-03',
      scenario: 'Tampilan Form Profil Saya (GET /profil)',
      expected: 'Status 200, menampilkan form profil, input foto, dan field kata sandi lama',
      actual: hasProfilElements ? 'Form profil dan elemen keamanan kata sandi lama berhasil dirender' : 'Elemen form profil tidak lengkap',
      passed: hasProfilElements
    });
    console.log(`Result: ${hasProfilElements ? 'PASSED (Lolos)' : 'FAILED'}`);

    // Helper: get fresh CSRF for profile POST
    const profilCsrfMatch = profilHtml.match(/name="_csrf"\s+value="([^"]+)"/);
    const profilCsrf = profilCsrfMatch[1];

    // -----------------------------------------------------------------
    // TEST 4: Anti-IDOR Verification on Profil POST
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: Verifikasi Anti-IDOR pada Pembaruan Profil ---');
    // Siswa (ID 3) attempts to submit a profile update attempting to modify ID 1 (Admin)
    const [adminBefore] = await pool.query('SELECT nama FROM users WHERE id = 1');

    const idorBody = new URLSearchParams();
    idorBody.append('_csrf', profilCsrf);
    idorBody.append('id', '1'); // MALICIOUS IDOR ATTEMPT TO OVERWRITE ADMIN
    idorBody.append('nama', 'Attacker Renamed Me');

    await fetch(`${baseUrl}/profil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': siswaSession.cookie },
      body: idorBody.toString(),
      redirect: 'manual'
    });

    const [adminAfter] = await pool.query('SELECT nama FROM users WHERE id = 1');
    const isAntiIdorWorking = adminAfter[0].nama === adminBefore[0].nama;

    results.push({
      id: 'MOD2-04',
      scenario: 'Proteksi IDOR pada Pembaruan Profil (Mencegah Modifikasi Akun Lain)',
      expected: 'Input ID dari body diabaikan; server hanya memperbarui user_id dari sesi',
      actual: isAntiIdorWorking ? 'Akun admin (ID 1) TIDAK terpengaruh oleh POST siswa' : 'RENTAN: Akun admin terubah',
      passed: isAntiIdorWorking
    });
    console.log(`Result: ${isAntiIdorWorking ? 'PASSED (Lolos)' : 'FAILED'}`);

    // -----------------------------------------------------------------
    // TEST 5: Password Change Requires Valid Old Password
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: Validasi Kata Sandi Lama Saat Ganti Password ---');
    // 5a. Attempt changing password without old_password
    const noOldBody = new URLSearchParams();
    noOldBody.append('_csrf', profilCsrf);
    noOldBody.append('nama', 'Siswa Test');
    noOldBody.append('password', 'NewSecurePassword123!');

    const resNoOld = await fetch(`${baseUrl}/profil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': siswaSession.cookie },
      body: noOldBody.toString()
    });
    const noOldHtml = await resNoOld.text();
    const rejectedNoOld = noOldHtml.includes('kata sandi lama wajib dimasukkan');

    // 5b. Attempt changing password with wrong old_password
    const wrongOldBody = new URLSearchParams();
    wrongOldBody.append('_csrf', profilCsrf);
    wrongOldBody.append('nama', 'Siswa Test');
    wrongOldBody.append('old_password', 'WrongOldPassword!');
    wrongOldBody.append('password', 'NewSecurePassword123!');

    const resWrongOld = await fetch(`${baseUrl}/profil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': siswaSession.cookie },
      body: wrongOldBody.toString()
    });
    const wrongOldHtml = await resWrongOld.text();
    const rejectedWrongOld = wrongOldHtml.includes('Kata sandi lama yang Anda masukkan tidak sesuai');

    const passChangeVerified = rejectedNoOld && rejectedWrongOld;
    results.push({
      id: 'MOD2-05',
      scenario: 'Kewajiban Verifikasi Kata Sandi Lama Saat Mengubah Password',
      expected: 'Permintaan tanpa kata sandi lama atau dengan kata sandi lama salah DITOLAK',
      actual: passChangeVerified ? 'Validasi kata sandi lama berhasil menolak input palsu' : 'Validasi gagal',
      passed: passChangeVerified
    });
    console.log(`Result: ${passChangeVerified ? 'PASSED (Lolos)' : 'FAILED'}`);

    // -----------------------------------------------------------------
    // TEST 6: Storage Adapter Magic Bytes Validation
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: Validasi Magic Bytes File Upload ---');
    // 6a. Valid JPEG buffer: FF D8 FF E0 ...
    const validJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const validJpegCheck = validateImageMagicBytes(validJpegBuffer);

    // 6b. Valid PNG buffer: 89 50 4E 47 0D 0A 1A 0A
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
    const validPngCheck = validateImageMagicBytes(validPngBuffer);

    // 6c. Spoofed file: text/php shell disguised as jpg: "<?php echo 'hacked'; ?>"
    const spoofedBuffer = Buffer.from("<?php echo 'hacked'; ?>\r\nGIF89a", 'utf8');
    const spoofedCheck = validateImageMagicBytes(spoofedBuffer);

    const magicBytesPassed = validJpegCheck.valid && validPngCheck.valid && !spoofedCheck.valid;
    results.push({
      id: 'MOD2-06',
      scenario: 'Pemeriksaan Magic Bytes File Upload (Anti-Extension Spoofing)',
      expected: 'Header biner file diverifikasi; file teks/skrip dengan ekstensi gambar ditolak',
      actual: magicBytesPassed ? 'Valid JPG/PNG diterima, spoofed file biner ditolak' : 'Pemeriksaan magic bytes gagal',
      passed: magicBytesPassed
    });
    console.log(`Result: ${magicBytesPassed ? 'PASSED (Lolos)' : 'FAILED'}`);

    // Clean up ephemeral test users
    await pool.execute('DELETE FROM users WHERE username IN (?, ?)', [testAdminUser, testSiswaUser]);

  } finally {
    server.close();
    await pool.end();
  }

  console.log('\n===============================================================');
  console.log('                 MODULE 2 TEST SUMMARY                         ');
  console.log('===============================================================');
  console.table(results.map(r => ({
    ID: r.id,
    Skenario: r.scenario,
    Status: r.passed ? 'PASSED (LOLOS)' : 'FAILED'
  })));

  const allPassed = results.every(r => r.passed);
  if (allPassed) {
    console.log('\nRingkasan: 6 dari 6 skenario lolos; cakupan: rendering dashboard role siswa/admin, profil anti-IDOR, verifikasi password lama, dan magic bytes upload; belum diuji: otorisasi peminjaman dan rekap cetak.\n');
    process.exit(0);
  } else {
    console.error('Ada pengujian Modul 2 yang gagal!');
    process.exit(1);
  }
}

runModule2Tests().catch(err => {
  console.error('Module 2 tests fatal error:', err);
  process.exit(1);
});
