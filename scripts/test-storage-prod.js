import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadImage } from '../src/utils/storageAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function testStorageProductionPolicy() {
  console.log('===============================================================');
  console.log('         TEST: PRODUCTION STORAGE ADAPTER VERIFICATION         ');
  console.log('===============================================================\n');

  // Genuine JPEG header
  const validJpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x00, 0x00]);

  const originalEnv = process.env.NODE_ENV;
  const originalToken = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    // 1. Simulate Production without Vercel Blob token
    process.env.NODE_ENV = 'production';
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const filesBefore = fs.existsSync(path.join(rootDir, 'public', 'assets', 'uploads', 'profil'))
      ? fs.readdirSync(path.join(rootDir, 'public', 'assets', 'uploads', 'profil'))
      : [];

    let rejectedAsExpected = false;
    let caughtMessage = '';

    try {
      await uploadImage(validJpeg, 'image/jpeg', 'profil');
    } catch (err) {
      rejectedAsExpected = true;
      caughtMessage = err.message;
    }

    const filesAfter = fs.existsSync(path.join(rootDir, 'public', 'assets', 'uploads', 'profil'))
      ? fs.readdirSync(path.join(rootDir, 'public', 'assets', 'uploads', 'profil'))
      : [];

    const noFileWritten = filesBefore.length === filesAfter.length;
    const isProdPass = rejectedAsExpected &&
                       caughtMessage.includes('BLOB_READ_WRITE_TOKEN') &&
                       noFileWritten;

    console.log(`[Prod Test] Rejection triggered: ${rejectedAsExpected}`);
    console.log(`[Prod Test] Error message: "${caughtMessage}"`);
    console.log(`[Prod Test] Zero files written to local disk in prod: ${noFileWritten}`);

    if (isProdPass) {
      console.log('\n✓ PASSED: In NODE_ENV=production without Blob token, upload is strictly rejected and never writes locally.\n');
    } else {
      console.error('\n❌ FAILED: Production storage policy violation!\n');
      process.exit(1);
    }

    // 2. Simulate Non-Production (Development) fallback
    process.env.NODE_ENV = 'development';
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const devResultUrl = await uploadImage(validJpeg, 'image/jpeg', 'profil');
    const isDevPass = devResultUrl.startsWith('/assets/uploads/profil/');
    console.log(`[Dev Test] Result URL: ${devResultUrl}`);

    // Cleanup dev test file
    if (isDevPass) {
      const cleanPath = path.join(rootDir, 'public', devResultUrl);
      if (fs.existsSync(cleanPath)) fs.unlinkSync(cleanPath);
      console.log('✓ PASSED: In NODE_ENV=development, local adapter works as expected.\n');
    } else {
      console.error('❌ FAILED: Development fallback failed!\n');
      process.exit(1);
    }

  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalToken) {
      process.env.BLOB_READ_WRITE_TOKEN = originalToken;
    } else {
      delete process.env.BLOB_READ_WRITE_TOKEN;
    }
  }

  console.log('===============================================================');
  console.log('Ringkasan: 2 dari 2 skenario storage lolos; upload produksi wajib Vercel Blob dan adaptor lokal terisolasi di non-produksi.');
  console.log('===============================================================\n');
}

testStorageProductionPolicy();
