import crypto from 'crypto';

export function csrfProtection(req, res, next) {
  // Ensure session exists
  if (!req.session) {
    return next();
  }

  // Generate CSRF token if not already present
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Make CSRF token available to all views
  res.locals.csrfToken = req.session.csrfToken;

  // Safe HTTP methods that do not modify state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exclude healthcheck
  if (req.path === '/api/health') {
    return next();
  }

  // Check token from form body or headers
  const token = req.body?._csrf || req.headers['x-csrf-token'] || req.headers['csrf-token'];

  if (!token || token !== req.session.csrfToken) {
    if (req.xhr || req.headers['accept']?.includes('application/json') || req.path.startsWith('/api/')) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired CSRF token. Please refresh the page.'
      });
    }
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head><title>403 Forbidden - CSRF Protection</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h2>403 - Invalid CSRF Token</h2>
        <p>Sesi keamanan Anda telah kedaluwarsa atau token tidak valid. Silakan kembali dan muat ulang halaman.</p>
        <a href="javascript:history.back()">Kembali ke Halaman Sebelumnya</a>
      </body>
      </html>
    `);
  }

  next();
}

export default csrfProtection;
