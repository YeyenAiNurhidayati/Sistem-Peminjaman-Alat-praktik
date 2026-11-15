import http from 'http';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import pool from '../src/config/database.js';

dotenv.config();

// =====================================================================
// KONFIGURASI TARGET BASIS DATA & VALIDASI KEAMANAN REMOTE HOST
// =====================================================================
const args = process.argv.slice(2);
function getArg(key, defaultVal) {
  const idx = args.indexOf(`--${key}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return defaultVal;
}

const targetHost = getArg('host', process.env.TIDB_HOST || process.env.DB_HOST || '127.0.0.1');
const targetPort = parseInt(getArg('port', process.env.TIDB_PORT || process.env.DB_PORT || '3306'), 10);
const targetUser = getArg('user', process.env.TIDB_USER || process.env.DB_USER || 'root');
const targetPassword = getArg('password', process.env.TIDB_PASSWORD || process.env.DB_PASSWORD || '');
const targetDb = getArg('database', process.env.TIDB_DATABASE || process.env.DB_NAME || 'peminjaman_alat');

console.log('====================================================================');
console.log('       SUITE PENGUJIAN KONKURENSI GANDA & PERLINDUNGAN BASIS DATA   ');
console.log('====================================================================\n');
console.log(`Target Host     : ${targetHost}:${targetPort}`);
console.log(`Target Database : ${targetDb}`);
console.log(`Target User     : ${targetUser}\n`);

// Safety Check: Database remote wajib berakhiran '_test'
const isLocalHost = ['127.0.0.1', 'localhost', '::1', '127.0.0.2', '0.0.0.0'].includes(targetHost.toLowerCase());

if (!isLocalHost) {
  if (!targetDb.endsWith('_test')) {
    console.error('====================================================================');
    console.error('⚠️  PERINGATAN KERAS KEAMANAN (SAFETY GUARD ACTIVATED)');
    console.error('====================================================================');
    console.error(`Host target [${targetHost}] terdeteksi sebagai basis data REMOTE/CLOUD.`);
    console.error(`Nama database [${targetDb}] TIDAK berakhiran "_test".`);
    console.error('Skrip uji konkurensi menolak dijalankan untuk mencegah kerusakan, race condition,');
    console.error('atau kontaminasi data pada lingkungan produksi/staging!');
    console.error('Gunakan nama database khusus tes (contoh: "sipab_test" atau "peminjaman_alat_test").');
    console.error('====================================================================\n');
    process.exit(1);
  } else {
    console.log('✓ Validasi Remote Host: Database berakhiran "_test" terverifikasi aman untuk pengujian.\n');
  }
} else {
  console.log('✓ Host Lokal Terdeteksi: Pengujian aman dijalankan pada lingkungan lokal.\n');
}

// =====================================================================
// RUNNER UTAMA PENGUJIAN
// =====================================================================
async function runConcurrencyTests() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Ephemeral Test Server berjalan pada ${baseUrl}\n`);

  const results = [];
  const testGuruUser = 'guru_konkuren_test';
  const pass = 'BengkelTKR2026!';
  const hash = await bcrypt.hash(pass, 10);

  let guruId = null;
  const studentIds = [];
  let tool1Id = null;
  let tool2Id = null;

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

    const pageRes = await fetch(`${baseUrl}/peminjaman`, { headers: { 'Cookie': cookie } });
    const pageHtml = await pageRes.text();
    const activeCsrfMatch = pageHtml.match(/name="_csrf"\s+id="csrfToken"\s+value="([^"]+)"/) ||
                           pageHtml.match(/name="_csrf"\s+value="([^"]+)"/);
    const activeCsrf = activeCsrfMatch ? activeCsrfMatch[1] : csrf;

    return { cookie, csrf: activeCsrf };
  }

  try {
    // 1. Inisialisasi Akun Guru & 15 Akun Siswa Unik
    console.log('1. Mempersiapkan akun pengujian (1 Guru + 15 Siswa Unik)...');
    await pool.query('DELETE FROM users WHERE username LIKE "siswa_konkuren_%" OR username = ?', [testGuruUser]);

    const [resGuru] = await pool.query(
      'INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)',
      ['Guru Pembina Konkurensi', testGuruUser, hash, 'guru']
    );
    guruId = resGuru.insertId;

    for (let i = 1; i <= 15; i++) {
      const uName = `siswa_konkuren_${i}`;
      const [resSiswa] = await pool.query(
        'INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)',
        [`Siswa Uji #${i}`, uName, hash, 'siswa']
      );
      studentIds.push(resSiswa.insertId);
    }

    const sessionGuru = await loginAs(testGuruUser, pass);

    // =====================================================================
    // SKENARIO A: 1 Alat Stok=1 Diperebutkan 15 Siswa Berbeda Secara Paralel
    // =====================================================================
    console.log('\n--------------------------------------------------------------------');
    console.log('SKENARIO A: 1 Alat Stok=1 Diperebutkan 15 Siswa Berbeda Serentak');
    console.log('--------------------------------------------------------------------');
    
    // Buat alat uji dengan stok persis = 1
    const [resTool1] = await pool.query(
      'INSERT INTO barang (nama_barang, kategori, stok, kondisi) VALUES (?, ?, 1, ?)',
      ['Mesin Las Inverter Khusus Uji A', 'Power Tools', 'Baik']
    );
    tool1Id = resTool1.insertId;

    // Buat 15 pengajuan pinjam terpisah untuk masing-masing dari 15 siswa
    const pendingLoansA = [];
    for (let i = 0; i < 15; i++) {
      const [p] = await pool.query(
        'INSERT INTO peminjaman (id_user, nama_peminjam, id_barang, tgl_pinjam, status) VALUES (?, ?, ?, CURDATE(), "pending")',
        [studentIds[i], `Siswa Uji #${i+1}`, tool1Id]
      );
      pendingLoansA.push(p.insertId);
    }

    console.log(`-> Dibuat 15 pengajuan pinjaman pending untuk alat ID ${tool1Id} (Stok: 1).`);
    console.log('-> Meluncurkan 15 request approval (POST /api/peminjaman/:id/acc) paralel serentak...');

    const startA = Date.now();
    const promisesA = pendingLoansA.map(id => {
      return fetch(`${baseUrl}/api/peminjaman/${id}/acc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionGuru.cookie,
          'X-CSRF-Token': sessionGuru.csrf
        }
      }).then(async res => ({
        id,
        status: res.status,
        body: await res.json()
      })).catch(err => ({ id, status: 500, error: err.message }));
    });

    const responsesA = await Promise.all(promisesA);
    const durationA = Date.now() - startA;

    const countSuccessA = responsesA.filter(r => r.status === 200).length;
    const countFailedA = responsesA.filter(r => r.status === 400 || r.status === 409).length;

    const [finalStockA] = await pool.query('SELECT stok FROM barang WHERE id = ?', [tool1Id]);
    const currentStockA = finalStockA[0].stok;

    const [approvedLoansA] = await pool.query(
      'SELECT id, nama_peminjam FROM peminjaman WHERE id_barang = ? AND status = "disetujui"',
      [tool1Id]
    );

    const isScenarioAPass = (countSuccessA === 1) &&
                            (countFailedA === 14) &&
                            (currentStockA === 0) &&
                            (approvedLoansA.length === 1);

    results.push({
      id: 'CONC-01',
      skenario: '1 Alat Stok=1 Diperebutkan 15 Siswa Berbeda Serentak',
      hasil_nyata: isScenarioAPass ? 'Tepat 1 Disetujui, 14 Ditolak, Stok Akhir=0' : 'GAGAL / Terjadi Race Condition',
      status: isScenarioAPass ? 'PASSED (LOLOS)' : 'FAILED',
      bukti: `15 Parallel Requests (${durationA}ms): 200 OK=${countSuccessA}, 400/409 Gagal=${countFailedA}. Stok DB: ${currentStockA} (tidak pernah negatif). Approved: ID ${approvedLoansA[0]?.id || 'nihil'}.`
    });
    console.log(`Hasil Skenario A: ${isScenarioAPass ? 'PASSED (LOLOS)' : 'FAILED'}`);
    console.log(`-> Berhasil: ${countSuccessA}, Ditolak: ${countFailedA}, Stok Akhir: ${currentStockA}`);

    // =====================================================================
    // SKENARIO B: 1 ID Peminjaman yang Sama di-ACC 15 Kali Secara Paralel
    // =====================================================================
    console.log('\n--------------------------------------------------------------------');
    console.log('SKENARIO B: 1 ID Peminjaman yang Sama di-ACC 15 Kali Serentak (Replay)');
    console.log('--------------------------------------------------------------------');

    // Buat alat uji dengan stok awal = 5
    const initialStockB = 5;
    const [resTool2] = await pool.query(
      'INSERT INTO barang (nama_barang, kategori, stok, kondisi) VALUES (?, ?, ?, ?)',
      ['Kunci Torsi Digital Khusus Uji B', 'Measuring Tools', initialStockB, 'Baik']
    );
    tool2Id = resTool2.insertId;

    // Buat TEPAT 1 transaksi peminjaman pending
    const [resLoanB] = await pool.query(
      'INSERT INTO peminjaman (id_user, nama_peminjam, id_barang, tgl_pinjam, status) VALUES (?, "Siswa Target Tunggal", ?, CURDATE(), "pending")',
      [studentIds[0], tool2Id]
    );
    const targetLoanIdB = resLoanB.insertId;

    console.log(`-> Dibuat 1 transaksi peminjaman pending (ID: ${targetLoanIdB}) pada alat ID ${tool2Id} (Stok: ${initialStockB}).`);
    console.log('-> Meluncurkan 15 request approval ke ID yang sama secara paralel serentak...');

    const startB = Date.now();
    const promisesB = Array.from({ length: 15 }).map((_, idx) => {
      return fetch(`${baseUrl}/api/peminjaman/${targetLoanIdB}/acc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionGuru.cookie,
          'X-CSRF-Token': sessionGuru.csrf
        }
      }).then(async res => ({
        reqIndex: idx + 1,
        status: res.status,
        body: await res.json()
      })).catch(err => ({ reqIndex: idx + 1, status: 500, error: err.message }));
    });

    const responsesB = await Promise.all(promisesB);
    const durationB = Date.now() - startB;

    const countSuccessB = responsesB.filter(r => r.status === 200).length;
    const countConflictB = responsesB.filter(r => r.status === 409).length;

    const [finalStockB] = await pool.query('SELECT stok FROM barang WHERE id = ?', [tool2Id]);
    const currentStockB = finalStockB[0].stok;

    // Harapan: Tepat 1 berhasil (200), 14 ditolak (409 Conflict), stok berkurang tepat 1 (dari 5 menjadi 4)
    const isScenarioBPass = (countSuccessB === 1) &&
                            (countConflictB === 14) &&
                            (currentStockB === initialStockB - 1);

    results.push({
      id: 'CONC-02',
      skenario: '1 ID Peminjaman Sama di-ACC 15 Kali Serentak (Anti-Double Decrement)',
      hasil_nyata: isScenarioBPass ? 'Tepat 1 Disetujui, 14 Ditolak (409 Conflict), Stok Berkurang Tepat 1' : 'GAGAL / Double Mutation',
      status: isScenarioBPass ? 'PASSED (LOLOS)' : 'FAILED',
      bukti: `15 Parallel Requests (${durationB}ms): 200 OK=${countSuccessB}, 409 Conflict=${countConflictB}. Stok Awal: ${initialStockB} -> Stok Akhir: ${currentStockB} (berkurang tepat 1, bukan 15).`
    });
    console.log(`Hasil Skenario B: ${isScenarioBPass ? 'PASSED (LOLOS)' : 'FAILED'}`);
    console.log(`-> Berhasil: ${countSuccessB}, Ditolak (409): ${countConflictB}, Stok Awal: ${initialStockB} -> Stok Akhir: ${currentStockB}`);

  } finally {
    // Pembersihan data ephemeral
    console.log('\nMembersihkan data pengujian...');
    if (tool1Id) {
      await pool.query('DELETE FROM peminjaman WHERE id_barang = ?', [tool1Id]);
      await pool.query('DELETE FROM barang WHERE id = ?', [tool1Id]);
    }
    if (tool2Id) {
      await pool.query('DELETE FROM peminjaman WHERE id_barang = ?', [tool2Id]);
      await pool.query('DELETE FROM barang WHERE id = ?', [tool2Id]);
    }
    await pool.query('DELETE FROM users WHERE username LIKE "siswa_konkuren_%" OR username = ?', [testGuruUser]);

    await new Promise(resolve => server.close(resolve));
    await pool.end();
  }

  console.log('\n====================================================================');
  console.log('              RINGKASAN HASIL PENGUJIAN KONKURENSI GANDA             ');
  console.log('====================================================================');
  console.table(results.map(r => ({
    'ID': r.id,
    'Skenario': r.skenario,
    'Status': r.status,
    'Bukti Nyata': r.bukti
  })));

  const allPassed = results.every(r => r.status.includes('PASSED'));
  if (!allPassed) {
    console.error('\n✗ Terdapat kegagalan dalam pengujian konkurensi!');
    process.exit(1);
  }
  console.log('\n✓ Seluruh pengujian konkurensi ganda (Skenario A & B) LULUS dengan bukti empiris!');
  setTimeout(() => process.exit(0), 100);
}

runConcurrencyTests().catch(err => {
  console.error('Fatal concurrency test error:', err);
  process.exit(1);
});
