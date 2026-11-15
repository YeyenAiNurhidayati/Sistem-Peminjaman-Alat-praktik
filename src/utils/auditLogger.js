import pool from '../config/database.js';

export async function logAudit(req, action, details = null, customUserId = null, customUsername = null) {
  try {
    const userId = customUserId || (req?.session?.user_id) || null;
    const username = customUsername || (req?.session?.user) || null;
    const ipAddress = req?.ip || req?.socket?.remoteAddress || null;
    const userAgent = req?.headers['user-agent']?.substring(0, 255) || null;

    const sql = `
      INSERT INTO audit_logs (user_id, username, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.execute(sql, [userId, username, action, details, ipAddress, userAgent]);
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}

export default logAudit;
