import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:8080/Projek_P.Web-Native';
const OUT_DIR = path.resolve('docs/screenshots-baseline');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 667, isMobile: true }
];

async function capture() {
  console.log('--- Launching Chrome for Comprehensive Baseline Capture ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  async function take(label) {
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile || false });
      await new Promise(r => setTimeout(r, 600)); // wait for layout/animations
      const filename = `${label}_${vp.name}.png`;
      const filepath = path.join(OUT_DIR, filename);
      await page.screenshot({ path: filepath, fullPage: false });
      console.log(`Saved: ${filename}`);
    }
  }

  async function doLogin(username, password) {
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await page.goto(`${BASE_URL}/auth/login.php`, { waitUntil: 'domcontentloaded' });
    
    await page.evaluate((u, p) => {
      document.getElementById('username').value = u;
      document.getElementById('password').value = p;
      document.getElementById('loginForm').submit();
    }, username, password);

    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    console.log(`✓ Logged in as: ${username}`);
  }

  // 1. Login Page
  console.log('Capturing Login Page...');
  await page.goto(`${BASE_URL}/auth/login.php`, { waitUntil: 'domcontentloaded' });
  await take('01_login');

  // 2. Admin Flow
  console.log('Capturing Admin Flow...');
  await doLogin('admin', process.env.SEED_ADMIN_PASSWORD || 'admin');
  
  await page.goto(`${BASE_URL}/dashboard.php`, { waitUntil: 'domcontentloaded' });
  await take('02_dashboard_admin');

  await page.goto(`${BASE_URL}/alat/index.php`, { waitUntil: 'domcontentloaded' });
  await take('03_alat_admin');

  // Modal: Tambah Alat
  await page.evaluate(() => {
    if (typeof openModal === 'function') openModal();
  });
  await new Promise(r => setTimeout(r, 500));
  await take('03a_modal_tambah_alat');

  // Modal: Edit Alat
  await page.evaluate(() => {
    if (typeof editData === 'function') editData(1);
  });
  await new Promise(r => setTimeout(r, 1000));
  await take('03b_modal_edit_alat');

  // Standalone Edit Alat Page
  await page.goto(`${BASE_URL}/alat/edit.php?id=1`, { waitUntil: 'domcontentloaded' });
  await take('03c_alat_edit_page');

  // Users Page
  await page.goto(`${BASE_URL}/users/index.php`, { waitUntil: 'domcontentloaded' });
  await take('04_users_admin');

  // Users: Tambah User Page
  await page.goto(`${BASE_URL}/users/tambah.php`, { waitUntil: 'domcontentloaded' });
  await take('04a_users_tambah_page');

  // Users: Edit User Page
  await page.goto(`${BASE_URL}/users/edit.php?id=3`, { waitUntil: 'domcontentloaded' });
  await take('04b_users_edit_page');

  // Peminjaman Admin Page
  await page.goto(`${BASE_URL}/peminjaman/index.php`, { waitUntil: 'domcontentloaded' });
  await take('05_peminjaman_admin');

  // 3. Guru Flow
  console.log('Capturing Guru Flow...');
  await doLogin('guru', process.env.SEED_GURU_PASSWORD || 'guru');

  await page.goto(`${BASE_URL}/dashboard.php`, { waitUntil: 'domcontentloaded' });
  await take('06_dashboard_guru');

  await page.goto(`${BASE_URL}/peminjaman/review_kembali.php`, { waitUntil: 'domcontentloaded' });
  await take('07_review_kembali_guru');

  // Modal: Lihat Bukti Foto
  const hasBuktiBtn = await page.$('button[data-bs-target^="#buktiModal"]');
  if (hasBuktiBtn) {
    await hasBuktiBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await take('07a_modal_bukti_foto');
    // Close modal
    await page.evaluate(() => {
      const activeModal = document.querySelector('.modal.show');
      if (activeModal) bootstrap.Modal.getInstance(activeModal)?.hide();
    });
    await new Promise(r => setTimeout(r, 400));
  }

  // Dialog: Tolak Pengembalian (SweetAlert textarea prompt)
  await page.evaluate(() => {
    if (typeof tolakKembali === 'function') tolakKembali(4, 'Obeng Plus 6 inch');
  });
  await new Promise(r => setTimeout(r, 600));
  await take('07b_dialog_tolak_pengembalian');

  // Dialog: Terima Pengembalian (SweetAlert confirm)
  await page.evaluate(() => {
    Swal.close();
    if (typeof accKembali === 'function') accKembali(4, 'Obeng Plus 6 inch');
  });
  await new Promise(r => setTimeout(r, 600));
  await take('07c_dialog_terima_pengembalian');

  // Laporan Guru Page
  await page.goto(`${BASE_URL}/laporan/index.php`, { waitUntil: 'domcontentloaded' });
  await take('08_laporan_guru');

  // 4. Siswa Flow
  console.log('Capturing Siswa Flow...');
  await doLogin('siswa', process.env.SEED_SISWA_PASSWORD || 'siswa');

  await page.goto(`${BASE_URL}/dashboard.php`, { waitUntil: 'domcontentloaded' });
  await take('09_dashboard_siswa');

  await page.goto(`${BASE_URL}/peminjaman/index.php`, { waitUntil: 'domcontentloaded' });
  await take('10_peminjaman_siswa');

  // Modal: Ajukan Peminjaman (Katalog Grid)
  await page.evaluate(() => {
    if (typeof openModalPinjam === 'function') openModalPinjam();
  });
  await new Promise(r => setTimeout(r, 600));
  await take('10a_modal_ajukan_peminjaman');

  // Form: Ajukan Pengembalian (kembali.php)
  await page.goto(`${BASE_URL}/peminjaman/kembali.php?id=2`, { waitUntil: 'domcontentloaded' });
  await take('10b_peminjaman_kembali_page');

  // Riwayat Siswa Page
  await page.goto(`${BASE_URL}/riwayat/index.php`, { waitUntil: 'domcontentloaded' });
  await take('11_riwayat_siswa');

  // Profil Siswa Page
  await page.goto(`${BASE_URL}/profil/index.php`, { waitUntil: 'domcontentloaded' });
  await take('12_profil_siswa');

  await browser.close();
  console.log('=== All comprehensive baseline screenshots captured successfully! ===');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
