import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'peminjaman_alat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

// Enable SSL if configured (Required for TiDB Cloud Starter)
if (process.env.DB_SSL === 'true' || process.env.TIDB_ENABLE_SSL === 'true') {
  dbConfig.ssl = {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  };
}

export const pool = mysql.createPool(dbConfig);

export async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

export default pool;
