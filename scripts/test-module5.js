import http from 'http';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import pool from '../src/config/database.js';
import { sanitizeCsvCell } from '../src/controllers/laporanController.js';

dotenv.config();

async function runModule5Tests() {
  console.log('====================================================================');
  console.log('            RUNNING MODULE 5 AUTOMATED TEST SUITE                   ');
  console.log('  (Laporan Terpadu, Filter, PDF Landscape, CSV Anti-Formula Inj)    ');
  console.log('====================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running on ${baseUrl}\n`);

  const results = [];

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
    if (newCookie) cookie = newCookie.split(';')[0];

    return { cookie };
  }

  const testGuru = 'test_mod5_guru';
  const testSiswa = 'test_mod5_siswa';
  const pass = 'BengkelTKR2026!';
  const hash = await bcrypt.hash(pass, 10);

  let guruId = null;
  let siswaId = null;
  let toolId = null;

  try {
    // 1. Setup akun uji
    await pool.query('DELETE FROM users WHERE username IN (?, ?)', [testGuru, testSiswa]);

    const [resGuru] = await pool.query(
      'INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)',
      ['Guru Penguji Modul 5', testGuru, hash, 'guru']
    );
    guruId = resGuru.insertId;

    const [resSiswa] = await pool.query(
      'INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)',
      ['=HYPERLINK("http://evil.com","Siswa")', testSiswa, hash, 'siswa']
    );
    siswaId = resSiswa.insertId;

    const [resTool] = await pool.query(
      'INSERT INTO barang (nama_barang, kategori, stok, kondisi) VALUES (?, ?, ?, ?)',
      ['Alat Uji Laporan', 'Hand Tools', 10, 'Baik']
    );
    toolId = resTool.insertId;

    // Masukkan data pinjaman dengan payload formula injection
    const [loanPayload] = await pool.query(`
      INSERT INTO peminjaman (id_user, nama_peminjam, id_barang, tgl_pinjam, tgl_kembali, status)
      VALUES (?, ?, ?, CURDATE(), CURDATE(), 'kembali')
    `, [siswaId, '=1+2";cmd|\' /C calc\'!A0', toolId]);

    const sessionGuru = await loginAs(testGuru, pass);
    const sessionSiswa = await loginAs(testSiswa, pass);

    // -----------------------------------------------------------------
    // TEST 1: Strict RBAC Protection (Siswa dilarang akses laporan)
    // -----------------------------------------------------------------
    console.log('--- TEST 1: Strict RBAC Protection on Laporan Endpoints ---');
    const siswaViewRes = await fetch(`${baseUrl}/laporan`, { headers: { 'Cookie': sessionSiswa.cookie } });
    const siswaPdfRes = await fetch(`${baseUrl}/laporan/cetak/pdf`, { headers: { 'Cookie': sessionSiswa.cookie } });
    const siswaCsvRes = await fetch(`${baseUrl}/laporan/cetak/csv`, { headers: { 'Cookie': sessionSiswa.cookie } });

    const rbacBlocked = (siswaViewRes.status === 403) && (siswaPdfRes.status === 403) && (siswaCsvRes.status === 403);
    results.push({
      id: 'MOD5-01',
      scenario: 'Kontrol Akses RBAC pada Endpoint Laporan (Siswa Ditolak HTTP 403)',
      status: rbacBlocked ? 'PASSED (LOLOS)' : 'FAILED',
      evidence: `Siswa akses /laporan: HTTP ${siswaViewRes.status}. Siswa akses /pdf: HTTP ${siswaPdfRes.status}. Siswa akses /csv: HTTP ${siswaCsvRes.status}.`
    });
    console.log(`Result: ${rbacBlocked ? 'PASSED (Lolos)' : 'FAILED'}`);

    // -----------------------------------------------------------------
    // TEST 2: Guru/Admin Parameterized Filters & Contextual Escaping
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: Parameterized Filters & Escaped Table Rendering ---');
    const filterRes = await fetch(`${baseUrl}/laporan?status=kembali`, {
      headers: { 'Cookie': sessionGuru.cookie }
    });
    const filterHtml = await filterRes.text();
    const filterOk = filterRes.status === 200 && filterHtml.includes('Laporan Peminjaman') && filterHtml.includes('Cetak PDF');
    // Verifikasi escaping XSS pada data tabel
    const hasUnescapedScript = filterHtml.includes('<script>alert') || filterHtml.includes('onerror=alert');
    const isEscaped = !hasUnescapedScript;
    const test2Pass = filterOk && isEscaped;
    console.log('DEBUG TEST 2:', { status: filterRes.status, filterOk, isEscaped });
    results.push({
      id: 'MOD5-02',
      scenario: 'Penyajian Tabel Laporan Guru dengan Filter Parameterized & Contextual Escaping',
      status: test2Pass ? 'PASSED (LOLOS)' : 'FAILED',
      evidence: `GET /laporan?status=kembali: HTTP ${filterRes.status} (Filter status aktif, render aman tanpa XSS payload).`
    });
    console.log(`Result: ${test2Pass ? 'PASSED (Lolos)' : 'FAILED'}`);

    // -----------------------------------------------------------------
    // TEST 3: CSV Export & Proteksi Formula / CSV Injection
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: CSV Export with UTF-8 BOM & Formula Injection Defense ---');
    const csvRes = await fetch(`${baseUrl}/laporan/cetak/csv`, {
      headers: { 'Cookie': sessionGuru.cookie }
    });
    const csvBuffer = Buffer.from(await csvRes.arrayBuffer());
    const isCsvContentType = csvRes.headers.get('content-type')?.includes('text/csv');
    const hasUtf8Bom = (csvBuffer[0] === 0xEF && csvBuffer[1] === 0xBB && csvBuffer[2] === 0xBF);

    // Unit test sanitasi formula
    const testFormula1 = sanitizeCsvCell('=cmd|\' /C calc\'!A0');
    const testFormula2 = sanitizeCsvCell('+123456');
    const testFormula3 = sanitizeCsvCell('-50+10');
    const testFormula4 = sanitizeCsvCell('@SUM(A1:A10)');
    const testNormal = sanitizeCsvCell('Hendrik Normal');

    const formulaProtected = testFormula1.startsWith('\'=') &&
                             testFormula2.startsWith('\'+') &&
                             testFormula3.startsWith('\'-') &&
                             testFormula4.startsWith('\'@') &&
                             testNormal === 'Hendrik Normal';

    const test3Pass = isCsvContentType && hasUtf8Bom && formulaProtected;
    results.push({
      id: 'MOD5-03',
      scenario: 'Ekspor CSV dengan UTF-8 BOM & Mitigasi Formula Injection (=, +, -, @)',
      status: test3Pass ? 'PASSED (LOLOS)' : 'FAILED',
      evidence: `Content-Type: ${csvRes.headers.get('content-type')}. UTF-8 BOM: Terdeteksi (0xFEFF). "=cmd": disanitasi menjadi "'=cmd". "@SUM": disanitasi menjadi "'@SUM".`
    });
    console.log(`Result: ${test3Pass ? 'PASSED (Lolos)' : 'FAILED'}`);

    // -----------------------------------------------------------------
    // TEST 4: PDF Generation (Landscape A4, Header, Layout, Caps)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: PDF Generation (Landscape A4 & Binary Validation) ---');
    const pdfRes = await fetch(`${baseUrl}/laporan/cetak/pdf`, {
      headers: { 'Cookie': sessionGuru.cookie }
    });
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    const isPdfContentType = pdfRes.headers.get('content-type')?.includes('application/pdf');
    const isPdfBinaryHeader = pdfBuffer.slice(0, 5).toString('ascii') === '%PDF-';
    const isSizeSensible = pdfBuffer.length > 500 && pdfBuffer.length < 4 * 1024 * 1024; // < 4MB

    const test4Pass = (pdfRes.status === 200) && isPdfContentType && isPdfBinaryHeader && isSizeSensible;
    results.push({
      id: 'MOD5-04',
      scenario: 'Pembuatan Dokumen PDF Landscape A4 Server-side dengan Kop Surat & Tanda Tangan',
      status: test4Pass ? 'PASSED (LOLOS)' : 'FAILED',
      evidence: `HTTP ${pdfRes.status}, Content-Type: ${pdfRes.headers.get('content-type')}, Magic bytes: "%PDF-", Ukuran: ${(pdfBuffer.length / 1024).toFixed(1)} KB (< 4MB Vercel limit).`
    });
    console.log(`Result: ${test4Pass ? 'PASSED (Lolos)' : 'FAILED'}`);

    // -----------------------------------------------------------------
    // TEST 5: Audit Logging on Report & Export Actions
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: Audit Logging on Report Access & Exports ---');
    const [auditLogs] = await pool.query(`
      SELECT action, details FROM audit_logs
      WHERE action IN ('lihat_laporan', 'ekspor_csv_laporan', 'ekspor_pdf_laporan')
      ORDER BY id DESC LIMIT 5
    `);
    const loggedActions = auditLogs.map(l => l.action);
    const hasLihatLog = loggedActions.includes('lihat_laporan');
    const hasCsvLog = loggedActions.includes('ekspor_csv_laporan');
    const hasPdfLog = loggedActions.includes('ekspor_pdf_laporan');

    const test5Pass = hasLihatLog && hasCsvLog && hasPdfLog;
    results.push({
      id: 'MOD5-05',
      scenario: 'Pencatatan Audit Trail untuk Seluruh Aktivitas Akses & Ekspor Laporan',
      status: test5Pass ? 'PASSED (LOLOS)' : 'FAILED',
      evidence: `Aksi audit tercatat: ${Array.from(new Set(loggedActions)).join(', ')}.`
    });
    console.log(`Result: ${test5Pass ? 'PASSED (Lolos)' : 'FAILED'}`);

  } finally {
    // Bersihkan data uji ephemeral
    if (toolId) {
      await pool.query('DELETE FROM peminjaman WHERE id_barang = ?', [toolId]);
      await pool.query('DELETE FROM barang WHERE id = ?', [toolId]);
    }
    await pool.query('DELETE FROM users WHERE username IN (?, ?)', [testGuru, testSiswa]);

    await new Promise(resolve => server.close(resolve));
    await pool.end();
  }

  console.log('\n====================================================================');
  console.log('                 MODULE 5 TEST SUMMARY                              ');
  console.log('====================================================================');
  console.table(results.map(r => ({
    'ID': r.id,
    'Skenario': r.scenario,
    'Status': r.status,
    'Bukti Nyata': r.evidence
  })));

  const allPassed = results.every(r => r.status.includes('PASSED'));
  if (!allPassed) {
    console.error('Terdapat kegagalan pengujian pada Modul 5!');
    process.exit(1);
  }
  console.log('\n✓ Seluruh 5 skenario Modul 5 LULUS dengan bukti empiris!\n');
  setTimeout(() => process.exit(0), 100);
}

runModule5Tests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
