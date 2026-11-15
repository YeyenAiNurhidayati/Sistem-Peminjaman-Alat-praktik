import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import sessionMiddleware from './config/session.js';
import pool from './config/database.js';
import csrfProtection from './middlewares/csrfMiddleware.js';
import { cekLogin, withPendingCount } from './middlewares/authMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import profilRoutes from './routes/profilRoutes.js';
import alatRoutes from './routes/alatRoutes.js';
import apiAlatRoutes from './routes/apiAlatRoutes.js';
import peminjamanRoutes from './routes/peminjamanRoutes.js';
import apiPeminjamanRoutes from './routes/apiPeminjamanRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import laporanRoutes from './routes/laporanRoutes.js';
import peminjamanController from './controllers/peminjamanController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();

// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Trust proxy (required for serverless Vercel & rate limiting / secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// Security Headers with strict Content Security Policy for approved CDNs
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // required for page inline scripts & DataTables in views
        "https://cdn.jsdelivr.net",
        "https://code.jquery.com",
        "https://cdn.datatables.net"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // required for Mazer & Bootstrap inline style attributes
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        "https://cdn.datatables.net"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
        "data:"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://ui-avatars.com",
        "https://res.cloudinary.com",
        "https://*.public.blob.vercel-storage.com"
      ],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Body Parsing & Cookies
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));
app.use(cookieParser());

// Static Files (for local development; served by Vercel edge in production)
app.use(express.static(path.join(rootDir, 'public')));
app.use('/assets', express.static(path.join(rootDir, 'public', 'assets')));

// Database Session Middleware
app.use(sessionMiddleware);

// CSRF Protection Middleware
app.use(csrfProtection);

// Global view variables
app.use((req, res, next) => {
  res.locals.user = req.session ? req.session.user : null;
  res.locals.role = req.session ? req.session.role : null;
  res.locals.nama = req.session ? req.session.nama : null;
  res.locals.userId = req.session ? req.session.user_id : null;
  res.locals.isLoggedIn = !!(req.session && req.session.login);
  res.locals.active = '';
  res.locals.countPending = 0;
  next();
});

// Healthcheck Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as status');
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: rows && rows[0]?.status === 1 ? 'connected' : 'unknown',
      node_version: process.version,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Application Routes
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/profil', profilRoutes);
app.use('/alat', alatRoutes);
app.use('/api/alat', apiAlatRoutes);
app.use('/peminjaman', peminjamanRoutes);
app.use('/api/peminjaman', apiPeminjamanRoutes);
app.use('/users', usersRoutes);
app.use('/laporan', laporanRoutes);
app.use('/Projek_P.Web-Native/api/peminjaman.php', apiPeminjamanRoutes);
app.use('/api/peminjaman.php', apiPeminjamanRoutes);

// Riwayat Routes
app.get('/riwayat', cekLogin, withPendingCount, peminjamanController.getRiwayat);
app.get('/riwayat.php', (req, res) => res.redirect('/riwayat'));
app.get('/riwayat/index.php', (req, res) => res.redirect('/riwayat'));

// Compatibility shortcuts
app.get('/login', (req, res) => res.redirect('/auth/login'));
app.get('/register', (req, res) => res.redirect('/auth/register'));
app.get('/logout', (req, res) => res.redirect('/auth/logout'));
app.get('/auth/login.php', (req, res) => res.redirect('/auth/login'));
app.get('/auth/logout.php', (req, res) => res.redirect('/auth/logout'));
app.get('/dashboard.php', (req, res) => res.redirect('/dashboard'));
app.get('/profil.php', (req, res) => res.redirect('/profil'));
app.get('/profil/index.php', (req, res) => res.redirect('/profil'));
app.get('/peminjaman.php', (req, res) => res.redirect('/peminjaman'));
app.get('/users.php', (req, res) => res.redirect('/users'));
app.get('/users/index.php', (req, res) => res.redirect('/users'));
app.get('/laporan.php', (req, res) => res.redirect('/laporan'));

// Root Route
app.get('/', (req, res) => {
  if (req.session && req.session.login) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/auth/login');
});

export default app;
