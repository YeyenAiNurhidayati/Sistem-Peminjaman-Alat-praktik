import fs from 'fs';
import path from 'path';
import pool from '../src/config/database.js';

async function migrate() {
  console.log('--- Running Database Migration (SIPAB) ---');
  const schemaPath = path.resolve('database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Split SQL commands by semicolon (ignoring comments and empty lines)
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const connection = await pool.getConnection();
  try {
    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log('✓ Migration completed successfully: All tables created/verified.');
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

migrate();
