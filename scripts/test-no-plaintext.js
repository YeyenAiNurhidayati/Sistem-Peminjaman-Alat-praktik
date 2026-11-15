import pool from '../src/config/database.js';
import app from '../src/app.js';
import http from 'http';
import bcrypt from 'bcryptjs';

async function runTest() {
  console.log('=== TEST: Strict Bcrypt-Only Verification (No Plaintext Allowed) ===');

  const testUsername = 'test_security_user';
  const rawPlaintext = 'InsecurePassword123!';

  // Clean up if previous run left test user
  await pool.execute("DELETE FROM users WHERE username = ?", [testUsername]);

  // Insert test user with RAW PLAINTEXT password in database
  await pool.execute(`
    INSERT INTO users (nama, username, password, role)
    VALUES (?, ?, ?, ?)
  `, ['Test Security Plaintext', testUsername, rawPlaintext, 'siswa']);

  console.log(`✓ Inserted test user '${testUsername}' with PLAINTEXT password directly in DB.`);

  // Start ephemeral test server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server listening on ${baseUrl}`);

  try {
    // 1. Fetch login page to get CSRF token and session cookie
    const getRes = await fetch(`${baseUrl}/auth/login`);
    const setCookie = getRes.headers.get('set-cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : '';
    const html = await getRes.text();
    const csrfMatch = html.match(/name="_csrf"\s+value="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    if (!csrfToken) {
      throw new Error('Could not extract CSRF token from login page');
    }

    // 2. Attempt login with the matching plaintext password
    const postBody = new URLSearchParams();
    postBody.append('username', testUsername);
    postBody.append('password', rawPlaintext);
    postBody.append('_csrf', csrfToken);

    const postRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie
      },
      body: postBody.toString(),
      redirect: 'manual'
    });

    const postText = await postRes.text();

    // 3. Assert login strictly FAILS (status 200 re-rendering login with error, not redirecting to /dashboard)
    const isRedirectToDashboard = postRes.headers.get('location') === '/dashboard';
    const isPasswordError = postText.includes('Password salah!');

    if (!isRedirectToDashboard && isPasswordError) {
      console.log('✓ PASSED: Login with plaintext password was strictly REJECTED by bcrypt.compare!');
    } else {
      throw new Error(`SECURITY VIOLATION: Login with plaintext password was accepted or gave unexpected status: ${postRes.status}`);
    }

    // 4. Now upgrade test user to proper bcrypt hash
    const properHash = await bcrypt.hash(rawPlaintext, 10);
    await pool.execute("UPDATE users SET password = ? WHERE username = ?", [properHash, testUsername]);
    console.log(`✓ Upgraded test user '${testUsername}' to proper bcrypt hash: ${properHash.substring(0, 15)}...`);

    // 5. Attempt login again with valid credentials
    const getRes2 = await fetch(`${baseUrl}/auth/login`);
    const cookie2 = getRes2.headers.get('set-cookie').split(';')[0];
    const html2 = await getRes2.text();
    const csrfToken2 = html2.match(/name="_csrf"\s+value="([^"]+)"/)[1];

    const postBody2 = new URLSearchParams();
    postBody2.append('username', testUsername);
    postBody2.append('password', rawPlaintext);
    postBody2.append('_csrf', csrfToken2);

    const postRes2 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie2
      },
      body: postBody2.toString(),
      redirect: 'manual'
    });

    const isDashboardRedirect = postRes2.headers.get('location') === '/dashboard';
    if (isDashboardRedirect) {
      console.log('✓ PASSED: Login with valid bcrypt hash SUCCEEDED and redirected to /dashboard');
    } else {
      throw new Error(`Login with valid bcrypt hash failed to redirect to /dashboard. Status: ${postRes2.status}`);
    }

  } finally {
    // Clean up test user
    await pool.execute("DELETE FROM users WHERE username = ?", [testUsername]);
    console.log(`✓ Cleaned up test user '${testUsername}' from database.`);
    server.close();
    await pool.end();
  }

  console.log('=== TEST RESULT: STRICT BCRYPT VERIFICATION 100% VERIFIED ===\n');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
