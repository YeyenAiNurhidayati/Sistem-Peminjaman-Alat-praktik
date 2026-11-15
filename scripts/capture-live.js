import puppeteer from 'puppeteer-core';
import fs from 'fs';
import https from 'https';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureLive() {
  console.log('--- Capturing Live Vercel App ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Login Page
  await page.goto('https://sistem-peminjaman-alat-praktik.vercel.app/auth/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/screenshots-node/live_01_login.png' });

  // 2. Register Page
  await page.goto('https://sistem-peminjaman-alat-praktik.vercel.app/auth/register', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/screenshots-node/live_01b_register.png' });

  // 3. Do Login as Admin
  await page.goto('https://sistem-peminjaman-alat-praktik.vercel.app/auth/login', { waitUntil: 'networkidle0' });
  await page.type('input[name="username"]', 'admin');
  await page.type('input[name="password"]', 'password');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);
  await page.screenshot({ path: 'docs/screenshots-node/live_02_dashboard_admin.png' });

  // 4. Manajemen Alat
  await page.goto('https://sistem-peminjaman-alat-praktik.vercel.app/alat', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/screenshots-node/live_03_alat_admin.png' });

  // 5. Laporan Terpadu
  await page.goto('https://sistem-peminjaman-alat-praktik.vercel.app/laporan', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/screenshots-node/live_08_laporan.png' });

  await browser.close();
  console.log('✓ All live screenshots captured successfully.');
}

captureLive().catch(err => {
  console.error('Error capturing live:', err);
  process.exit(1);
});
