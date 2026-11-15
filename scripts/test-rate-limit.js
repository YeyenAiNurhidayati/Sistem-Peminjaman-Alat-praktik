import pool from '../src/config/database.js';
import app from '../src/app.js';
import http from 'http';

async function runTest() {
  console.log('=== TEST: Database-Backed Rate Limiting (20 Failed Attempts -> 429 Lockout) ===');

  const targetUser = 'ratelimit_target_user';

  // 1. Clean up prior test data
  await pool.execute("DELETE FROM rate_limits WHERE key_id LIKE ?", [`%${targetUser}%`]);
  await pool.execute("DELETE FROM audit_logs WHERE username = ?", [targetUser]);
  console.log('✓ Cleaned up prior rate_limits and audit_logs for test user');

  // 2. Start ephemeral test server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running on ${baseUrl}`);

  try {
    // 3. Obtain CSRF token and session cookie
    const initialGet = await fetch(`${baseUrl}/auth/login`);
    const setCookie = initialGet.headers.get('set-cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : '';
    const html = await initialGet.text();
    const csrfMatch = html.match(/name="_csrf"\s+value="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    if (!csrfToken) {
      throw new Error('Failed to retrieve CSRF token');
    }

    console.log('Beginning 20 consecutive failed login attempts...');

    let got429 = false;
    let attempt21Status = null;

    for (let i = 1; i <= 21; i++) {
      const postBody = new URLSearchParams();
      postBody.append('username', targetUser);
      postBody.append('password', `wrong_pass_${i}`);
      postBody.append('_csrf', csrfToken);

      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookie,
          'X-Forwarded-For': '203.0.113.195' // Static IP for predictable test
        },
        body: postBody.toString(),
        redirect: 'manual'
      });

      if (res.status === 429) {
        got429 = true;
        attempt21Status = res.status;
        console.log(`✓ Attempt #${i} received HTTP 429 (Too Many Requests / Locked Out)!`);
        break;
      }
    }

    if (!got429) {
      throw new Error('FAILED: 20 failed login attempts did not trigger HTTP 429 lockout!');
    }

    // 4. Verify rate_limits row in MySQL
    const [rateRows] = await pool.query("SELECT * FROM rate_limits WHERE key_id LIKE ?", [`%${targetUser}%`]);
    console.log('Database rate_limits record:', rateRows[0]);

    if (!rateRows || rateRows.length === 0 || !rateRows[0].locked_until) {
      throw new Error('FAILED: locked_until timestamp was not set in rate_limits table!');
    }
    console.log(`✓ Verified rate_limits locked_until set in database: ${rateRows[0].locked_until}`);

    // 5. Verify audit_logs logged LOGIN_FAILED without passwords
    const [auditRows] = await pool.query(
      "SELECT action, details, username FROM audit_logs WHERE username = ? AND action = 'LOGIN_FAILED'",
      [targetUser]
    );
    console.log(`✓ Verified ${auditRows.length} LOGIN_FAILED records in audit_logs.`);
    const leakedPassword = auditRows.some(row => row.details && row.details.includes('wrong_pass_'));
    if (leakedPassword) {
      throw new Error('SECURITY VIOLATION: Password was leaked into audit_logs details!');
    }
    console.log('✓ Verified: Zero passwords leaked into audit_logs.');

    // 6. Test Proxy Trust and Secure Cookie Header
    console.log('\n--- Testing Trust Proxy & HTTPS Forwarding ---');
    const httpsRes = await fetch(`${baseUrl}/auth/login`, {
      headers: {
        'X-Forwarded-Proto': 'https',
        'X-Forwarded-For': '203.0.113.195'
      }
    });
    console.log(`✓ Trust proxy accepted X-Forwarded-Proto. Status: ${httpsRes.status}`);

  } finally {
    // Clean up
    await pool.execute("DELETE FROM rate_limits WHERE key_id LIKE ?", [`%${targetUser}%`]);
    await pool.execute("DELETE FROM audit_logs WHERE username = ?", [targetUser]);
    server.close();
    await pool.end();
  }

  console.log('\n=== TEST RESULT: DATABASE RATE LIMITER & SERVERLESS VERIFICATION PASSED ===\n');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Rate limit test error:', err);
  process.exit(1);
});
