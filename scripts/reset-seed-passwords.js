import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pool from '../src/config/database.js';
import { validatePasswordPolicy } from '../src/utils/passwordPolicy.js';

dotenv.config();

async function resetSeedPasswords() {
  console.log('=== SKRIP RESET KREDENSIAL AKUN SEED (DEV ONLY) ===\n');

  const isProduction = process.env.NODE_ENV === 'production';
  const hasForceFlag = process.argv.includes('--yes') || process.argv.includes('-y');

  if (isProduction && !hasForceFlag) {
    console.error('✗ PENOLAKAN KEAMANAN: Skrip ini dilarang berjalan pada lingkungan NODE_ENV=production tanpa flag eksplisit --yes!');
    process.exit(1);
  }

  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'SuperBengkel#2026!';
  const guruPass = process.env.SEED_GURU_PASSWORD || 'PengawasPraktik#2026!';
  const siswaPass = process.env.SEED_SISWA_PASSWORD || 'TeknikOtomotif#2026!';

  const accounts = [
    { username: 'admin', rawPass: adminPass },
    { username: 'guru', rawPass: guruPass },
    { username: 'siswa', rawPass: siswaPass }
  ];

  for (const acc of accounts) {
    const val = validatePasswordPolicy(acc.rawPass, acc.username);
    if (!val.valid) {
      console.error(`✗ Password untuk akun [${acc.username}] tidak memenuhi kebijakan keamanan: ${val.message}`);
      process.exit(1);
    }
  }

  const connection = await pool.getConnection();
  try {
    console.log('Mengatur ulang hash password untuk akun inti (admin, guru, siswa)...');
    for (const acc of accounts) {
      const newHash = await bcrypt.hash(acc.rawPass, 10);
      const [res] = await connection.query(
        'UPDATE users SET password = ? WHERE username = ?',
        [newHash, acc.username]
      );
      if (res.affectedRows > 0) {
        console.log(`  ✓ Akun [${acc.username}] berhasil diperbarui dengan hash baru.`);
      } else {
        console.log(`  ⚠️ Akun [${acc.username}] tidak ditemukan di database.`);
      }
    }
    console.log('\n✓ Berhasil mereset seluruh kredensial akun seed ke password kuat yang memenuhi kebijakan keamanan (>=10 karakter).');
  } catch (err) {
    console.error('✗ Gagal mereset kredensial:', err.message);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

resetSeedPasswords();
