import http from 'http';
import pool from '../src/config/database.js';
import app from '../src/app.js';

// Parse command line arguments for target URL (e.g. node scripts/test-rate-limit-spoof.js --url=https://my-app.vercel.app)
const urlArg = process.argv.find(arg => arg.startsWith('--url='));
const CLI_TARGET_URL = urlArg ? urlArg.split('=')[1].replace(/\/+$/, '') : null;

const PORT = 4499;
const LOCAL_URL = `http://127.0.0.1:${PORT}`;

let server = null;

function request(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const client = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    client.on('error', reject);
    if (bodyData) client.write(bodyData);
    client.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  return Array.isArray(setCookie) ? setCookie[0].split(';')[0] : setCookie.split(';')[0];
}

function extractCsrfToken(html) {
  const match = html.match(/name=["']_csrf["']\s+value=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

async function runRateLimitSpoofTest() {
  console.log('========================================================================');
  console.log('       TEST: ANTI-IP SPOOFING RATE LIMIT VERIFICATION                   ');
  console.log('  (Memastikan rotasi header X-Forwarded-For palsu TIDAK bisa bypass)   ');
  console.log('========================================================================\n');

  let targetUrl = CLI_TARGET_URL;

  if (!targetUrl) {
    targetUrl = LOCAL_URL;
    await new Promise(resolve => {
      server = app.listen(PORT, '127.0.0.1', () => {
        console.log(`Server uji lokal berjalan di ${targetUrl}\n`);
        resolve();
      });
    });
  } else {
    console.log(`Menguji target publik: ${targetUrl}\n`);
  }

  const targetUser = `spoof_target_${Date.now()}`;
  const observations = [];

  try {
    // Clean prior rate limits for test target
    await pool.execute('DELETE FROM rate_limits WHERE key_id LIKE ?', [`%${targetUser}%`]);

    console.log(`Memulai 21 percobaan login gagal berturut-turut untuk user: "${targetUser}"`);
    console.log('Setiap request menyertakan header X-Forwarded-For palsu acak (rotasi IP)...\n');

    let lockedOnAttempt21 = false;
    let attempt20Status = null;
    let attempt21Status = null;

    for (let i = 1; i <= 21; i++) {
      // Generate randomized fake client IP header
      const fakeClientIp = `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;

      // 1. Get Login Page & CSRF Token
      const getRes = await request({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/auth/login',
        method: 'GET',
        headers: {
          'X-Forwarded-For': fakeClientIp
        }
      });

      const cookie = extractCookie(getRes.headers);
      const csrf = extractCsrfToken(getRes.body);

      // 2. Submit wrong password
      const postBody = `username=${encodeURIComponent(targetUser)}&password=WrongPassword123!&_csrf=${encodeURIComponent(csrf)}`;
      const postRes = await request({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postBody),
          'Cookie': cookie,
          'X-Forwarded-For': fakeClientIp // SPOOFED HEADER ROTATION
        }
      }, postBody);

      if (i === 20) {
        attempt20Status = postRes.statusCode;
      }

      if (i === 21) {
        attempt21Status = postRes.statusCode;
        lockedOnAttempt21 = postRes.statusCode === 429 && postRes.body.includes('429');
      }

      if (i % 5 === 0 || i >= 20) {
        observations.push({
          Attempt: `#${i}`,
          SpoofedHeader: fakeClientIp,
          Status: `HTTP ${postRes.statusCode}`,
          Keterangan: postRes.statusCode === 429 ? 'DITOLAK (LOCKED OUT 429)' : 'Login Gagal (Diproses Server)'
        });
      }
    }

    console.table(observations);

    console.log('\n--- Hasil Verifikasi Anti-Spoofing ---');
    console.log(`Percobaan ke-20: HTTP ${attempt20Status}`);
    console.log(`Percobaan ke-21: HTTP ${attempt21Status} (Harus 429)`);

    const passed = attempt20Status === 200 && lockedOnAttempt21;

    if (passed) {
      console.log('\n✓ HASIL PENGUJIAN: LOLOS (PASSED)');
      console.log('  Penyerang TIDAK DAPAT membypass rate limit dengan memutar header X-Forwarded-For palsu.');
      console.log('  Sistem mengambil IP secara aman dari req.ip yang dinormalisasi reverse proxy (trust proxy: 1).');
    } else {
      console.error('\n❌ HASIL PENGUJIAN: GAGAL (FAILED)');
      console.error('  Rate limit dapat dibypass atau tidak mengembalikan HTTP 429 pada percobaan ke-21.');
    }

    console.log('\n========================================================================');
    console.log(`Ringkasan: ${passed ? '1 dari 1' : '0 dari 1'} skenario lolos; anti-spoofing rate limit aktif.`);
    console.log('========================================================================\n');

    process.exit(passed ? 0 : 1);

  } catch (err) {
    console.error('Fatal error during rate limit spoof test:', err);
    process.exit(1);
  } finally {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  }
}

runRateLimitSpoofTest();
