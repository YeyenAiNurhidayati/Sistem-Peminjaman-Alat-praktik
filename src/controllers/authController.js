import bcrypt from 'bcryptjs';
import { z } from 'zod';
import pool from '../config/database.js';
import logAudit from '../utils/auditLogger.js';
import { recordLoginFailure, clearLoginRateLimit } from '../middlewares/dbRateLimiter.js';
import { validatePasswordPolicy } from '../utils/passwordPolicy.js';

// Input Validation Schemas with Zod
const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi')
});

const registerSchema = z.object({
  nama: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter').max(100, 'Nama terlalu panjang'),
  username: z.string().trim().min(3, 'Username minimal 3 karakter').max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berupa huruf, angka, dan garis bawah (_)'),
  password: z.string().min(1, 'Password wajib diisi'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  nisn: z.string().trim().optional(),
  kelas: z.string().trim().optional()
}).superRefine((data, ctx) => {
  const policy = validatePasswordPolicy(data.password, data.username);
  if (!policy.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: policy.message,
      path: ['password']
    });
  }
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Konfirmasi password tidak cocok dengan password',
      path: ['confirmPassword']
    });
  }
});

export const showLogin = (req, res) => {
  if (req.session && req.session.login) {
    return res.redirect('/dashboard');
  }

  const registered = req.query.registered === '1';
  res.render('auth/login', {
    title: 'Login | Peminjaman Alat Bengkel',
    error: null,
    success: registered ? 'Registrasi akun berhasil! Silakan masuk dengan akun Anda.' : null,
    oldUsername: ''
  });
};

export const processLogin = async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Input tidak valid';
      return res.render('auth/login', {
        title: 'Login | Peminjaman Alat Bengkel',
        error: errorMsg,
        success: null,
        oldUsername: req.body.username || ''
      });
    }

    const { username, password } = parseResult.data;

    // Parameterized Query to prevent SQL Injection
    const [users] = await pool.execute('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);

    if (!users || users.length === 0) {
      await recordLoginFailure(req, username);
      return res.render('auth/login', {
        title: 'Login | Peminjaman Alat Bengkel',
        error: 'Username tidak ditemukan!',
        success: null,
        oldUsername: username
      });
    }

    const user = users[0];
    // Pure bcrypt verification only (Cybersecurity requirement: zero plaintext fallback)
    const isMatch = await bcrypt.compare(password, user.password || '');

    if (!isMatch) {
      await recordLoginFailure(req, user.username);
      return res.render('auth/login', {
        title: 'Login | Peminjaman Alat Bengkel',
        error: 'Password salah!',
        success: null,
        oldUsername: username
      });
    }

    // Clear rate limit tracking on successful authentication
    await clearLoginRateLimit(req, user.username);

    // Session Regeneration to prevent Session Fixation attacks
    const csrfToken = req.session.csrfToken;
    req.session.regenerate(async (err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).send('Session initialization failed');
      }

      req.session.login = true;
      req.session.user_id = user.id;
      req.session.user = user.username;
      req.session.nama = user.nama;
      req.session.role = user.role;
      req.session.csrfToken = csrfToken; // preserve CSRF token

      await logAudit(req, 'LOGIN_SUCCESS', `Role: ${user.role}`, user.id, user.username);
      return res.redirect('/dashboard');
    });

  } catch (error) {
    console.error('Login process error:', error);
    return res.render('auth/login', {
      title: 'Login | Peminjaman Alat Bengkel',
      error: 'Terjadi kesalahan sistem saat proses masuk. Silakan coba beberapa saat lagi.',
      success: null,
      oldUsername: req.body.username || ''
    });
  }
};

export const showRegister = (req, res) => {
  if (req.session && req.session.login) {
    return res.redirect('/dashboard');
  }

  res.render('auth/register', {
    title: 'Registrasi Siswa | Peminjaman Alat Bengkel',
    error: null,
    old: {}
  });
};

export const processRegister = async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Input tidak valid';
      return res.render('auth/register', {
        title: 'Registrasi Siswa | Peminjaman Alat Bengkel',
        error: errorMsg,
        old: req.body
      });
    }

    const { nama, username, password, nisn, kelas } = parseResult.data;

    // Check if username already taken
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    if (existing && existing.length > 0) {
      return res.render('auth/register', {
        title: 'Registrasi Siswa | Peminjaman Alat Bengkel',
        error: 'Username sudah digunakan! Silakan gunakan username lain.',
        old: req.body
      });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Rule B.4: Server strictly enforces role = 'siswa', never from user input
    const role = 'siswa';
    const cleanNisn = nisn && nisn.length > 0 ? nisn : null;
    const cleanKelas = kelas && kelas.length > 0 ? kelas : null;

    const [result] = await pool.execute(`
      INSERT INTO users (nama, username, password, role, nisn, kelas)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nama, username, hashedPassword, role, cleanNisn, cleanKelas]);

    await logAudit(req, 'REGISTER_SISWA', `New student registered: ${username}`, result.insertId, username);

    return res.redirect('/auth/login?registered=1');

  } catch (error) {
    console.error('Registration error:', error);
    return res.render('auth/register', {
      title: 'Registrasi Siswa | Peminjaman Alat Bengkel',
      error: 'Gagal melakukan pendaftaran akun. Silakan coba kembali.',
      old: req.body
    });
  }
};

export const logout = async (req, res) => {
  if (req.session) {
    await logAudit(req, 'LOGOUT', 'User logged out');
    req.session.destroy((err) => {
      res.clearCookie('sipab_session');
      return res.redirect('/auth/login');
    });
  } else {
    return res.redirect('/auth/login');
  }
};

export default {
  showLogin,
  processLogin,
  showRegister,
  processRegister,
  logout
};
