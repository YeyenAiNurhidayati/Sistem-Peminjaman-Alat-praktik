import http from 'http';

async function testAuth() {
  console.log('--- Testing Auth & CSRF on Node.js Server ---');

  // Step 1: GET /auth/login
  const getLogin = await fetch('http://localhost:3000/auth/login');
  const cookie = getLogin.headers.get('set-cookie');
  const html = await getLogin.text();
  const csrfMatch = html.match(/name="_csrf" value="([a-f0-9]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : null;

  console.log('✓ Got login page, CSRF token:', csrfToken ? 'Extracted successfully' : 'FAILED');
  console.log('✓ Session Cookie:', cookie.split(';')[0]);

  // Step 2: POST /auth/register
  const regBody = new URLSearchParams({
    _csrf: csrfToken,
    nama: 'Siswa Baru Cyber',
    username: 'siswabaru',
    nisn: '202401888',
    kelas: '10B',
    password: 'Password#123',
    confirmPassword: 'Password#123'
  });

  const postReg = await fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    },
    body: regBody.toString(),
    redirect: 'manual'
  });

  console.log('✓ Register response status:', postReg.status, 'Location:', postReg.headers.get('location'));

  // Step 3: GET /auth/login after registration
  const getLogin2 = await fetch('http://localhost:3000/auth/login', {
    headers: { 'Cookie': cookie }
  });
  const html2 = await getLogin2.text();
  const csrfMatch2 = html2.match(/name="_csrf" value="([a-f0-9]+)"/);
  const csrfToken2 = csrfMatch2 ? csrfMatch2[1] : null;

  // Step 4: POST /auth/login with the new student
  const loginBody = new URLSearchParams({
    _csrf: csrfToken2,
    username: 'siswabaru',
    password: 'Password#123'
  });

  const postLogin = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    },
    body: loginBody.toString(),
    redirect: 'manual'
  });

  console.log('✓ Login response status:', postLogin.status, 'Location:', postLogin.headers.get('location'));
  const newCookie = postLogin.headers.get('set-cookie') || cookie;

  // Step 5: GET /dashboard with the authenticated session
  const getDash = await fetch('http://localhost:3000/dashboard', {
    headers: { 'Cookie': newCookie }
  });
  const dashHtml = await getDash.text();
  console.log('✓ Dashboard greeting test:', dashHtml.includes('Halo, <strong>Siswa Baru Cyber</strong> (siswa)!') ? 'PASSED' : 'FAILED');

  console.log('=== All Auth & Registration Tests Passed! ===');
}

testAuth().catch(err => {
  console.error('Test Auth Error:', err);
  process.exit(1);
});
