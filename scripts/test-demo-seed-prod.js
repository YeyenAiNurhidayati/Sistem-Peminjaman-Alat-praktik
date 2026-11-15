import { execSync } from 'child_process';
import fs from 'fs';

async function testDemoSeedProd() {
  console.log('=== PENGUJIAN PENOLAKAN SEED-DEMO PADA NODE_ENV=production ===\n');

  const envBefore = fs.readFileSync('.env', 'utf8');

  console.log('1. Menjalankan node scripts/seed.js dengan NODE_ENV=production (tanpa SEED_*_PASSWORD)...');
  try {
    execSync('node scripts/seed.js', {
      env: { ...process.env, NODE_ENV: 'production' },
      encoding: 'utf8'
    });
  } catch (err) {
    console.log('   Hasil:', err.stdout ? err.stdout.trim() : '', err.stderr ? err.stderr.trim() : '');
  }

  console.log('\n2. Menjalankan node scripts/seed.js dengan NODE_ENV=production + Kredensial Produksi...');
  try {
    const outSeed = execSync('node scripts/seed.js', {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        SEED_ADMIN_PASSWORD: 'SuperAdminProduction2026!',
        SEED_GURU_PASSWORD: 'SuperGuruProduction2026!',
        SEED_SISWA_PASSWORD: 'SuperSiswaProduction2026!'
      },
      encoding: 'utf8'
    });
    const lines = outSeed.split('\n').filter(l => l.includes('[PRODUKSI]') || l.includes('Akun'));
    console.log('  ', lines.join('\n   '));
  } catch (err) {
    console.log('   Error:', err.stdout || err.message);
  }

  console.log('\n3. Menjalankan node scripts/setup.js --yes dengan NODE_ENV=production...');
  try {
    const outSetup = execSync('node scripts/setup.js --yes', {
      env: { ...process.env, NODE_ENV: 'production' },
      encoding: 'utf8'
    });
    const relevantLines = outSetup.split('\n').filter(l => 
      l.includes('[PRODUKSI]') || l.includes('Migrasi & Data Awal') || l.includes('Ringkasan')
    );
    console.log('  ', relevantLines.join('\n   '));
  } catch (err) {
    console.log('   Output:', err.stdout || err.message);
  }

  const envAfter = fs.readFileSync('.env', 'utf8');
  const isEnvUnchanged = (envBefore === envAfter);

  console.log(`\n4. Verifikasi File .env: ${isEnvUnchanged ? '✓ UTUH DAN TIDAK BERUBAH' : '✗ BERUBAH'}`);
  if (!isEnvUnchanged) {
    console.error('File .env termodifikasi!');
    process.exit(1);
  }
}

testDemoSeedProd();
