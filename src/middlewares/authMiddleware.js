import pool from '../config/database.js';

export function cekLogin(req, res, next) {
  if (req.session && req.session.login && req.session.user_id) {
    return next();
  }
  if (req.xhr || req.headers['accept']?.includes('application/json') || req.path.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Sesi Anda telah berakhir, silakan login kembali.'
    });
  }
  return res.redirect('/auth/login');
}

export function cekRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.session || !req.session.login) {
      return res.redirect('/auth/login');
    }

    const userRole = req.session.role;
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    if (req.xhr || req.headers['accept']?.includes('application/json') || req.path.startsWith('/api/')) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini.'
      });
    }

    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head><title>403 - Akses Ditolak</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h2>Akses Ditolak (403 Forbidden)</h2>
        <p>Role Anda (${userRole}) tidak memiliki izin untuk mengakses halaman ini.</p>
        <a href="/dashboard">Kembali ke Dashboard</a>
      </body>
      </html>
    `);
  };
}

export async function withPendingCount(req, res, next) {
  try {
    if (req.session && req.session.login && ['admin', 'guru'].includes(req.session.role)) {
      const [rows] = await pool.query("SELECT COUNT(*) as total FROM peminjaman WHERE status = 'menunggu_pengembalian'");
      res.locals.countPending = rows[0]?.total || 0;
    } else {
      res.locals.countPending = 0;
    }
  } catch (err) {
    res.locals.countPending = 0;
  }
  next();
}

export default { cekLogin, cekRole, withPendingCount };
