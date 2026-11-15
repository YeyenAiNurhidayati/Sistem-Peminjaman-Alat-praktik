import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';

async function migratePasswords() {
  console.log('--- One-time Password Migration: Hashing Plaintext Passwords ---');
  const [users] = await pool.query('SELECT id, username, password FROM users');

  let migratedCount = 0;
  for (const user of users) {
    const isHashed = user.password && (
      user.password.startsWith('$2a$') ||
      user.password.startsWith('$2b$') ||
      user.password.startsWith('$2y$')
    );

    if (!isHashed) {
      const hash = await bcrypt.hash(user.password, 10);
      await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hash, user.id]);
      console.log(`✓ Upgraded password for user: ${user.username}`);
      migratedCount++;
    }
  }

  console.log(`✓ Password migration complete. Total updated: ${migratedCount}`);
  await pool.end();
}

migratePasswords().catch(err => {
  console.error('Password migration error:', err);
  process.exit(1);
});
