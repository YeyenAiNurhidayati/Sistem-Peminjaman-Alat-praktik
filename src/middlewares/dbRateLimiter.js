import pool from '../config/database.js';
import logAudit from '../utils/auditLogger.js';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout
const MAX_LOGIN_ATTEMPTS = 20; // 20 failed attempts triggers lockout
const MAX_REGISTER_ATTEMPTS = 15; // 15 registrations per window per IP

/**
 * Extracts client IP securely using Express normalized req.ip
 * (backed by app.set('trust proxy', 1)).
 * Never trusts raw unverified client-supplied headers directly.
 */
export function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Key identifiers for dual-layer rate limiting
 */
export function getUserRateLimitKey(username = '') {
  const cleanUser = username.trim().toLowerCase();
  const key = `login:user:${cleanUser || 'anon'}`;
  return key.length > 190 ? key.substring(0, 190) : key;
}

export function getIpRateLimitKey(req) {
  const ip = getClientIp(req);
  const key = `login:ip:${ip}`;
  return key.length > 190 ? key.substring(0, 190) : key;
}

export function getRegisterKey(req) {
  const ip = getClientIp(req);
  const key = `register:${ip}`;
  return key.length > 190 ? key.substring(0, 190) : key;
}

/**
 * Middleware to check if login is currently locked out
 * Evaluates both target account key and source IP key
 */
export async function checkLoginRateLimit(req, res, next) {
  try {
    const rawUsername = (req.body && req.body.username) || '';
    const userKey = getUserRateLimitKey(rawUsername);
    const ipKey = getIpRateLimitKey(req);

    const [rows] = await pool.execute(
      'SELECT key_id, attempts, last_attempt, locked_until FROM rate_limits WHERE key_id IN (?, ?)',
      [userKey, ipKey]
    );

    if (rows && rows.length > 0) {
      const now = new Date();

      for (const record of rows) {
        // Check if locked
        if (record.locked_until && new Date(record.locked_until) > now) {
          return res.status(429).send(`
            <!DOCTYPE html>
            <html>
            <head><title>429 Terlalu Banyak Percobaan</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h2>429 - Terlalu Banyak Percobaan Masuk</h2>
              <p>Terlalu banyak percobaan autentikasi yang gagal untuk akun atau IP ini. Akun dikunci sementara demi alasan keamanan.</p>
              <p>Silakan tunggu 15 menit sebelum mencoba kembali.</p>
              <a href="/auth/login">Kembali ke Halaman Login</a>
            </body>
            </html>
          `);
        }

        // Check if window has expired without lock
        const lastAttempt = new Date(record.last_attempt);
        if (now.getTime() - lastAttempt.getTime() > WINDOW_MS && record.attempts >= MAX_LOGIN_ATTEMPTS) {
          await pool.execute('DELETE FROM rate_limits WHERE key_id = ?', [record.key_id]);
        }
      }
    }

    next();
  } catch (err) {
    console.error('Rate limiter check error:', err);
    // Fail open to avoid blocking valid traffic on transient DB issues
    next();
  }
}

/**
 * Records a failed login attempt in the database
 */
export async function recordLoginFailure(req, username) {
  try {
    const userKey = getUserRateLimitKey(username);
    const now = new Date();

    const [rows] = await pool.execute(
      'SELECT attempts, last_attempt, locked_until FROM rate_limits WHERE key_id = ?',
      [userKey]
    );

    let attempts = 1;
    let lockedUntil = null;

    if (rows && rows.length > 0) {
      const record = rows[0];
      const lastAttempt = new Date(record.last_attempt);

      if (now.getTime() - lastAttempt.getTime() > WINDOW_MS) {
        attempts = 1;
      } else {
        attempts = record.attempts + 1;
      }

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(now.getTime() + LOCKOUT_MS);
      }

      await pool.execute(
        'UPDATE rate_limits SET attempts = ?, last_attempt = NOW(), locked_until = ? WHERE key_id = ?',
        [attempts, lockedUntil, userKey]
      );
    } else {
      await pool.execute(
        'INSERT INTO rate_limits (key_id, attempts, last_attempt, locked_until) VALUES (?, 1, NOW(), NULL)',
        [userKey]
      );
    }

    // Log LOGIN_FAILED to audit_logs without logging password
    await logAudit(req, 'LOGIN_FAILED', `Failed attempt #${attempts} for username: ${username}`, null, username);

    return { attempts, isLocked: attempts >= MAX_LOGIN_ATTEMPTS };
  } catch (err) {
    console.error('Record login failure error:', err);
  }
}

/**
 * Clears rate limit record on successful login
 */
export async function clearLoginRateLimit(req, username) {
  try {
    const userKey = getUserRateLimitKey(username);
    await pool.execute('DELETE FROM rate_limits WHERE key_id = ?', [userKey]);
  } catch (err) {
    console.error('Clear rate limit error:', err);
  }
}

/**
 * Rate limiter for student public registration
 */
export async function checkRegisterRateLimit(req, res, next) {
  try {
    const key = getRegisterKey(req);
    const now = new Date();

    const [rows] = await pool.execute(
      'SELECT attempts, last_attempt FROM rate_limits WHERE key_id = ?',
      [key]
    );

    if (rows && rows.length > 0) {
      const record = rows[0];
      const lastAttempt = new Date(record.last_attempt);

      if (now.getTime() - lastAttempt.getTime() < WINDOW_MS) {
        if (record.attempts >= MAX_REGISTER_ATTEMPTS) {
          return res.status(429).render('auth/register', {
            title: 'Registrasi Siswa | Peminjaman Alat Bengkel',
            error: 'Terlalu banyak permintaan registrasi dari IP ini. Silakan coba kembali 15 menit lagi.',
            old: req.body
          });
        }
      } else {
        // Reset expired window
        await pool.execute('DELETE FROM rate_limits WHERE key_id = ?', [key]);
      }
    }

    next();
  } catch (err) {
    console.error('Register rate limiter error:', err);
    next();
  }
}

/**
 * Records a successful or attempted registration
 */
export async function recordRegisterAttempt(req) {
  try {
    const key = getRegisterKey(req);
    const [rows] = await pool.execute(
      'SELECT attempts, last_attempt FROM rate_limits WHERE key_id = ?',
      [key]
    );

    if (rows && rows.length > 0) {
      await pool.execute(
        'UPDATE rate_limits SET attempts = attempts + 1, last_attempt = NOW() WHERE key_id = ?',
        [key]
      );
    } else {
      await pool.execute(
        'INSERT INTO rate_limits (key_id, attempts, last_attempt, locked_until) VALUES (?, 1, NOW(), NULL)',
        [key]
      );
    }
  } catch (err) {
    console.error('Record register attempt error:', err);
  }
}

export default {
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginRateLimit,
  checkRegisterRateLimit,
  recordRegisterAttempt
};
