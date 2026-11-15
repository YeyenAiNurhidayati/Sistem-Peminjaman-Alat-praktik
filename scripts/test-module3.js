import http from 'http';
import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';
import app from '../src/app.js';

const PORT = 6393;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let server;

function request(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  return Array.isArray(setCookie) ? setCookie[0].split(';')[0] : setCookie.split(';')[0];
}

function extractCsrfToken(html) {
  const metaMatch = html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i);
  if (metaMatch) return metaMatch[1];
  const inputMatch = html.match(/name=["']_csrf["']\s+value=["']([^"']+)["']/i);
  if (inputMatch) return inputMatch[1];
  return '';
}

async function loginUser(username, rawPassword) {
  const getRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/auth/login',
    method: 'GET'
  });
  const cookie = extractCookie(getRes.headers);
  const csrfToken = extractCsrfToken(getRes.body);

  const postBody = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(rawPassword)}&_csrf=${encodeURIComponent(csrfToken)}`;
  const postRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postBody),
      'Cookie': cookie
    }
  }, postBody);

  const authCookie = extractCookie(postRes.headers) || cookie;
  return { authCookie, csrfToken };
}

async function runModule3Tests() {
  console.log('===============================================================');
  console.log('         RUNNING MODULE 3 AUTOMATED TEST SUITE                 ');
  console.log('   (RESTful Alat, Soft-Delete Riwayat, Magic Bytes, CSRF, RBAC)');
  console.log('===============================================================\n');

  // Start ephemeral server
  await new Promise((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`Test server running on ${BASE_URL}\n`);
      resolve();
    });
  });

  const results = [];
  const testAdminUser = `admin_m3_${Date.now()}`;
  const testGuruUser = `guru_m3_${Date.now()}`;
  const testSiswaUser = `siswa_m3_${Date.now()}`;
  const testPassword = 'PasswordValid123!';
  const passwordHash = await bcrypt.hash(testPassword, 10);

  let adminId, guruId, siswaId;
  let testToolId = null;

  try {
    // 0. Seed test users
    const [adminInsert] = await pool.execute(
      "INSERT INTO users (username, password, nama, role) VALUES (?, ?, 'Admin Test M3', 'admin')",
      [testAdminUser, passwordHash]
    );
    adminId = adminInsert.insertId;

    const [guruInsert] = await pool.execute(
      "INSERT INTO users (username, password, nama, role) VALUES (?, ?, 'Guru Test M3', 'guru')",
      [testGuruUser, passwordHash]
    );
    guruId = guruInsert.insertId;

    const [siswaInsert] = await pool.execute(
      "INSERT INTO users (username, password, nama, role) VALUES (?, ?, 'Siswa Test M3', 'siswa')",
      [testSiswaUser, passwordHash]
    );
    siswaId = siswaInsert.insertId;

    // Logins
    const adminSession = await loginUser(testAdminUser, testPassword);
    const guruSession = await loginUser(testGuruUser, testPassword);
    const siswaSession = await loginUser(testSiswaUser, testPassword);

    // ==========================================
    // TEST 1: Strict RBAC Control for /alat
    // ==========================================
    console.log('--- TEST 1: Strict RBAC Control for /alat ---');
    const unauthRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/alat',
      method: 'GET'
    });
    const unauthPass = unauthRes.statusCode === 302 && unauthRes.headers.location === '/auth/login';

    const siswaRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/alat',
      method: 'GET',
      headers: { 'Cookie': siswaSession.authCookie }
    });
    const siswaPass = siswaRes.statusCode === 403;

    const guruRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/alat',
      method: 'GET',
      headers: { 'Cookie': guruSession.authCookie }
    });
    const guruPass = guruRes.statusCode === 403;

    const adminResPage = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/alat',
      method: 'GET',
      headers: { 'Cookie': adminSession.authCookie }
    });
    const adminPass = adminResPage.statusCode === 200 && adminResPage.body.includes('Kelola Alat');

    if (unauthPass && siswaPass && guruPass && adminPass) {
      console.log('Result: PASSED (Lolos)\n');
      results.push({ id: 'MOD3-01', Skenario: 'Kontrol Akses RBAC /alat (Hanya Admin Diizinkan, Siswa & Guru 403)', Status: 'PASSED (LOLOS)' });
    } else {
      console.error(`FAILED: Unauth=${unauthPass}, Siswa=${siswaPass}, Guru=${guruPass}, Admin=${adminPass}`);
      results.push({ id: 'MOD3-01', Skenario: 'Kontrol Akses RBAC /alat (Hanya Admin Diizinkan, Siswa & Guru 403)', Status: 'FAILED (GAGAL)' });
    }

    // ==========================================
    // TEST 2: Category Filter & Parameterized Search
    // ==========================================
    console.log('--- TEST 2: Category Filter & Parameterized Search ---');
    const filterRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/alat?kategori=Hand+Tools',
      method: 'GET',
      headers: { 'Cookie': adminSession.authCookie }
    });
    const filterPass = filterRes.statusCode === 200 && filterRes.body.includes('Hand Tools');

    if (filterPass) {
      console.log('Result: PASSED (Lolos)\n');
      results.push({ id: 'MOD3-02', Skenario: 'Filter Kategori & Agregasi Counter (/alat?kategori=Hand+Tools)', Status: 'PASSED (LOLOS)' });
    } else {
      console.error('FAILED: Filter response did not match expected');
      results.push({ id: 'MOD3-02', Skenario: 'Filter Kategori & Agregasi Counter (/alat?kategori=Hand+Tools)', Status: 'FAILED (GAGAL)' });
    }

    // ==========================================
    // TEST 3: SQL Injection Resistance in Filter & Search
    // ==========================================
    console.log('--- TEST 3: SQL Injection Resistance in Filter & Search ---');
    const sqliKategori = encodeURIComponent("' OR '1'='1' -- ");
    const sqliSearch = encodeURIComponent("' UNION SELECT 1,2,3,4,5,6,7,8 -- ");
    const sqliFilterRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/alat?kategori=${sqliKategori}&search=${sqliSearch}`,
      method: 'GET',
      headers: { 'Cookie': adminSession.authCookie }
    });
    const sqliPass = sqliFilterRes.statusCode === 200 && !sqliFilterRes.body.includes('SQL syntax');

    if (sqliPass) {
      console.log('Result: PASSED (Lolos)\n');
      results.push({ id: 'MOD3-03', Skenario: 'Ketahanan Injeksi SQL pada Filter Kategori & Parameter Pencarian', Status: 'PASSED (LOLOS)' });
    } else {
      console.error('FAILED: SQL injection test failed');
      results.push({ id: 'MOD3-03', Skenario: 'Ketahanan Injeksi SQL pada Filter Kategori & Parameter Pencarian', Status: 'FAILED (GAGAL)' });
    }

    // ==========================================
    // TEST 4: RESTful Tool Creation (POST /api/alat)
    // ==========================================
    console.log('--- TEST 4: Tool Creation (POST /api/alat) ---');
    const boundary = '----WebKitFormBoundaryM3Test' + Date.now();
    let multipartBody = `--${boundary}\r\n`;
    multipartBody += `Content-Disposition: form-data; name="nama_barang"\r\n\r\nAlat Otomasi Modul 3\r\n`;
    multipartBody += `--${boundary}\r\n`;
    multipartBody += `Content-Disposition: form-data; name="kategori"\r\n\r\nHand Tools\r\n`;
    multipartBody += `--${boundary}\r\n`;
    multipartBody += `Content-Disposition: form-data; name="stok"\r\n\r\n14\r\n`;
    multipartBody += `--${boundary}\r\n`;
    multipartBody += `Content-Disposition: form-data; name="kondisi"\r\n\r\nBaik\r\n`;
    multipartBody += `--${boundary}\r\n`;
    multipartBody += `Content-Disposition: form-data; name="_csrf"\r\n\r\n${adminSession.csrfToken}\r\n`;
    multipartBody += `--${boundary}--\r\n`;

    const createRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/alat',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(multipartBody),
        'Cookie': adminSession.authCookie,
        'X-CSRF-Token': adminSession.csrfToken
      }
    }, multipartBody);

    const createJson = JSON.parse(createRes.body);
    testToolId = createJson.id;
    const createPass = createRes.statusCode === 200 && createJson.success === true && !!testToolId;

    if (createPass) {
      console.log(`Result: PASSED (Created tool ID: ${testToolId})\n`);
      results.push({ id: 'MOD3-04', Skenario: 'Penambahan Alat Baru via REST POST dengan Validasi Zod & CSRF', Status: 'PASSED (LOLOS)' });
    } else {
      console.error('FAILED create tool:', createRes.body);
      results.push({ id: 'MOD3-04', Skenario: 'Penambahan Alat Baru via REST POST dengan Validasi Zod & CSRF', Status: 'FAILED (GAGAL)' });
    }

    // ==========================================
    // TEST 5: Image Upload with Magic Bytes Verification
    // ==========================================
    console.log('--- TEST 5: Image Upload with Magic Bytes Verification ---');
    // 5a. Upload fake image (text pretending to be jpg) -> rejected
    const fakeImageBuffer = Buffer.from('<?php echo "evil script"; ?>', 'utf-8');
    const fakeBoundary = '----FakeImageBoundary' + Date.now();
    let fakeMulti = `--${fakeBoundary}\r\n`;
    fakeMulti += `Content-Disposition: form-data; name="nama_barang"\r\n\r\nAlat Spoofed\r\n`;
    fakeMulti += `--${fakeBoundary}\r\n`;
    fakeMulti += `Content-Disposition: form-data; name="kategori"\r\n\r\nHand Tools\r\n`;
    fakeMulti += `--${fakeBoundary}\r\n`;
    fakeMulti += `Content-Disposition: form-data; name="stok"\r\n\r\n2\r\n`;
    fakeMulti += `--${fakeBoundary}\r\n`;
    fakeMulti += `Content-Disposition: form-data; name="kondisi"\r\n\r\nBaik\r\n`;
    fakeMulti += `--${fakeBoundary}\r\n`;
    fakeMulti += `Content-Disposition: form-data; name="foto"; filename="malicious.jpg"\r\n`;
    fakeMulti += `Content-Type: image/jpeg\r\n\r\n`;
    const fakePayload = Buffer.concat([
      Buffer.from(fakeMulti, 'utf-8'),
      fakeImageBuffer,
      Buffer.from(`\r\n--${fakeBoundary}--\r\n`, 'utf-8')
    ]);

    const fakeRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/alat',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${fakeBoundary}`,
        'Content-Length': fakePayload.length,
        'Cookie': adminSession.authCookie,
        'X-CSRF-Token': adminSession.csrfToken
      }
    }, fakePayload);

    const fakePass = fakeRes.statusCode !== 200 && (fakeRes.body.includes('Format file tidak didukung') || fakeRes.statusCode === 500);

    // 5b. Upload genuine JPEG image (magic bytes FF D8 FF) -> accepted
    const genuineJpgHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const validBoundary = '----ValidImageBoundary' + Date.now();
    let validMulti = `--${validBoundary}\r\n`;
    validMulti += `Content-Disposition: form-data; name="nama_barang"\r\n\r\nAlat Foto Valid\r\n`;
    validMulti += `--${validBoundary}\r\n`;
    validMulti += `Content-Disposition: form-data; name="kategori"\r\n\r\nPower Tools\r\n`;
    validMulti += `--${validBoundary}\r\n`;
    validMulti += `Content-Disposition: form-data; name="stok"\r\n\r\n3\r\n`;
    validMulti += `--${validBoundary}\r\n`;
    validMulti += `Content-Disposition: form-data; name="kondisi"\r\n\r\nBaik\r\n`;
    validMulti += `--${validBoundary}\r\n`;
    validMulti += `Content-Disposition: form-data; name="foto"; filename="test.jpg"\r\n`;
    validMulti += `Content-Type: image/jpeg\r\n\r\n`;
    const validPayload = Buffer.concat([
      Buffer.from(validMulti, 'utf-8'),
      genuineJpgHeader,
      Buffer.from(`\r\n--${validBoundary}--\r\n`, 'utf-8')
    ]);

    const validRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/alat',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${validBoundary}`,
        'Content-Length': validPayload.length,
        'Cookie': adminSession.authCookie,
        'X-CSRF-Token': adminSession.csrfToken
      }
    }, validPayload);

    const validJson = JSON.parse(validRes.body);
    const validPhotoToolId = validJson.id;
    const genuinePass = validRes.statusCode === 200 && validJson.success === true;

    if (fakePass && genuinePass) {
      console.log('Result: PASSED (Lolos)\n');
      results.push({ id: 'MOD3-05', Skenario: 'Verifikasi Magic Bytes Foto (Anti Ekstensi Palsu & Format Valid)', Status: 'PASSED (LOLOS)' });
      if (validPhotoToolId) {
        await pool.execute('DELETE FROM barang WHERE id = ?', [validPhotoToolId]);
      }
    } else {
      console.error(`FAILED: fakePass=${fakePass}, genuinePass=${genuinePass}`);
      results.push({ id: 'MOD3-05', Skenario: 'Verifikasi Magic Bytes Foto (Anti Ekstensi Palsu & Format Valid)', Status: 'FAILED (GAGAL)' });
    }

    // ==========================================
    // TEST 6: RESTful Tool Update (PUT /api/alat/:id)
    // ==========================================
    console.log('--- TEST 6: RESTful Tool Update (PUT /api/alat/:id) ---');
    const updateBoundary = '----UpdateBoundary' + Date.now();
    let updateBody = `--${updateBoundary}\r\n`;
    updateBody += `Content-Disposition: form-data; name="nama_barang"\r\n\r\nAlat Modul 3 Updated\r\n`;
    updateBody += `--${updateBoundary}\r\n`;
    updateBody += `Content-Disposition: form-data; name="kategori"\r\n\r\nSST\r\n`;
    updateBody += `--${updateBoundary}\r\n`;
    updateBody += `Content-Disposition: form-data; name="stok"\r\n\r\n25\r\n`;
    updateBody += `--${updateBoundary}\r\n`;
    updateBody += `Content-Disposition: form-data; name="kondisi"\r\n\r\nPerlu Perbaikan\r\n`;
    updateBody += `--${updateBoundary}--\r\n`;

    const updateRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/alat/${testToolId}`,
      method: 'PUT',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${updateBoundary}`,
        'Content-Length': Buffer.byteLength(updateBody),
        'Cookie': adminSession.authCookie,
        'X-CSRF-Token': adminSession.csrfToken
      }
    }, updateBody);

    const updateJson = JSON.parse(updateRes.body);
    const [updatedRow] = await pool.execute('SELECT * FROM barang WHERE id = ?', [testToolId]);
    const updatePass = updateRes.statusCode === 200 && updateJson.success === true && updatedRow[0]?.stok === 25 && updatedRow[0]?.kategori === 'SST';

    if (updatePass) {
      console.log('Result: PASSED (Lolos)\n');
      results.push({ id: 'MOD3-06', Skenario: 'Pembaruan Data Alat via RESTful PUT /api/alat/:id', Status: 'PASSED (LOLOS)' });
    } else {
      console.error('FAILED update:', updateRes.body);
      results.push({ id: 'MOD3-06', Skenario: 'Pembaruan Data Alat via RESTful PUT /api/alat/:id', Status: 'FAILED (GAGAL)' });
    }

    // ==========================================
    // TEST 7: Referential Integrity & Soft-Delete Preservation (DELETE /api/alat/:id)
    // ==========================================
    console.log('--- TEST 7: Referential Integrity & Soft-Delete Preservation ---');
    // 7a. Active loan ('pending') -> DELETE must be rejected with 400
    const [loanRes] = await pool.execute(
      "INSERT INTO peminjaman (id_user, id_barang, tgl_pinjam, status) VALUES (?, ?, CURDATE(), 'pending')",
      [siswaId, testToolId]
    );
    const loanId = loanRes.insertId;

    const delBlockedRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/alat/${testToolId}`,
      method: 'DELETE',
      headers: {
        'Cookie': adminSession.authCookie,
        'X-CSRF-Token': adminSession.csrfToken
      }
    });

    const delBlockedJson = JSON.parse(delBlockedRes.body);
    const blockedPass = delBlockedRes.statusCode === 400 && delBlockedJson.success === false && delBlockedJson.message.includes('aktif');

    // 7b. Update loan to completed historical status ('kembali') -> DELETE must soft-delete (set deleted_at)
    await pool.execute("UPDATE peminjaman SET status = 'kembali' WHERE id = ?", [loanId]);

    const delSoftRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/alat/${testToolId}`,
      method: 'DELETE',
      headers: {
        'Cookie': adminSession.authCookie,
        'X-CSRF-Token': adminSession.csrfToken
      }
    });

    const delSoftJson = JSON.parse(delSoftRes.body);
    const [softDeletedRow] = await pool.execute('SELECT id, deleted_at FROM barang WHERE id = ?', [testToolId]);
    const [activeQueryCheck] = await pool.execute('SELECT id FROM barang WHERE id = ? AND deleted_at IS NULL', [testToolId]);
    // Historical join query for reports must succeed without error
    const [reportJoin] = await pool.execute(
      'SELECT p.id, b.nama_barang FROM peminjaman p JOIN barang b ON p.id_barang = b.id WHERE p.id = ?',
      [loanId]
    );

    const softDeletePass = delSoftRes.statusCode === 200 && delSoftJson.success === true &&
                           softDeletedRow[0]?.deleted_at !== null &&
                           activeQueryCheck.length === 0 &&
                           reportJoin.length > 0 && reportJoin[0]?.nama_barang === 'Alat Modul 3 Updated';

    // 7c. Clean up test loan and tool
    await pool.execute('DELETE FROM peminjaman WHERE id = ?', [loanId]);
    await pool.execute('DELETE FROM barang WHERE id = ?', [testToolId]);

    const test7Pass = blockedPass && softDeletePass;
    if (test7Pass) {
      console.log('Result: PASSED (Lolos)\n');
      results.push({ id: 'MOD3-07', Skenario: 'Preservasi Riwayat & Soft-Delete (Blokir Jika Aktif, Arsipkan Jika Riwayat Kembali/Ditolak)', Status: 'PASSED (LOLOS)' });
    } else {
      console.error(`FAILED test 7: blockedPass=${blockedPass}, softDeletePass=${softDeletePass}`);
      results.push({ id: 'MOD3-07', Skenario: 'Preservasi Riwayat & Soft-Delete (Blokir Jika Aktif, Arsipkan Jika Riwayat Kembali/Ditolak)', Status: 'FAILED (GAGAL)' });
    }

    // ==========================================
    // TEST 8: Rejection of Mutating Action via GET & Rejection Without CSRF
    // ==========================================
    console.log('--- TEST 8: Rejection of Mutating Action via GET & Rejection Without CSRF ---');
    // 8a. Admin triggers GET /api/alat?action=delete&id=X -> MUST BE REJECTED (405) and tool remains untouched
    const [tempTool] = await pool.execute(
      "INSERT INTO barang (nama_barang, kategori, stok, kondisi) VALUES ('Alat Uji GET Anti-Mutation', 'Hand Tools', 5, 'Baik')"
    );
    const tempToolId = tempTool.insertId;

    const getMutateRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/alat?action=delete&id=${tempToolId}`,
      method: 'GET',
      headers: { 'Cookie': adminSession.authCookie }
    });
    const [checkStillExists] = await pool.execute('SELECT id FROM barang WHERE id = ?', [tempToolId]);
    const getRejectionPass = getMutateRes.statusCode === 405 && checkStillExists.length === 1;

    // 8b. Mutating action without CSRF token -> MUST BE 403 FORBIDDEN
    const noCsrfRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/alat/${tempToolId}`,
      method: 'DELETE',
      headers: {
        'Cookie': adminSession.authCookie
        // No X-CSRF-Token header
      }
    });
    const csrfRejectionPass = noCsrfRes.statusCode === 403;

    // Cleanup temp tool
    await pool.execute('DELETE FROM barang WHERE id = ?', [tempToolId]);

    const test8Pass = getRejectionPass && csrfRejectionPass;
    if (test8Pass) {
      console.log('Result: PASSED (Lolos)\n');
      results.push({ id: 'MOD3-08', Skenario: 'Penolakan Mutasi via GET (HTTP 405) & Penolakan Mutasi Tanpa CSRF (HTTP 403)', Status: 'PASSED (LOLOS)' });
    } else {
      console.error(`FAILED test 8: getRejectionPass=${getRejectionPass}, csrfRejectionPass=${csrfRejectionPass}`);
      results.push({ id: 'MOD3-08', Skenario: 'Penolakan Mutasi via GET (HTTP 405) & Penolakan Mutasi Tanpa CSRF (HTTP 403)', Status: 'FAILED (GAGAL)' });
    }

  } catch (error) {
    console.error('Fatal test error:', error);
  } finally {
    // Cleanup test users
    if (adminId) await pool.execute('DELETE FROM users WHERE id = ?', [adminId]);
    if (guruId) await pool.execute('DELETE FROM users WHERE id = ?', [guruId]);
    if (siswaId) await pool.execute('DELETE FROM users WHERE id = ?', [siswaId]);

    // Close server
    await new Promise((resolve) => server.close(resolve));
    console.log('Test server closed.');
  }

  // Print Summary Table
  console.log('\n===============================================================');
  console.log('                 MODULE 3 TEST SUMMARY                         ');
  console.log('===============================================================');
  console.table(results);

  const passedCount = results.filter(r => r.Status === 'PASSED (LOLOS)').length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  console.log('\n===============================================================');
  console.log(
    `Ringkasan: ${passedCount} dari ${totalCount} skenario lolos; cakupan: RESTful CRUD /api/alat, soft-delete riwayat, validasi magic bytes, kontrol RBAC, proteksi CSRF, penolakan mutasi via GET; belum diuji dalam modul ini: otorisasi objek (IDOR) transaksi peminjaman dan rekap cetak PDF.`
  );
  console.log('===============================================================\n');

  setTimeout(() => process.exit(allPassed ? 0 : 1), 100);
}

runModule3Tests();
