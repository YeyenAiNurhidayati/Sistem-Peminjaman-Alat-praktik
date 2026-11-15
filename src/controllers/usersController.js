import bcrypt from 'bcryptjs';
import path from 'path';
import pool from '../config/database.js';
import { validatePasswordPolicy } from '../utils/passwordPolicy.js';
import { uploadImage, deleteImage } from '../utils/storageAdapter.js';

async function logAudit(req, action, details) {
  try {
    const userId = req.session ? req.session.user_id : null;
    const username = req.session ? req.session.user?.username : 'system';
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || null;
    const ua = req.headers['user-agent'] || null;

    await pool.query(
      'INSERT INTO audit_logs (user_id, username, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, action, details, ip, ua]
    );
  } catch (err) {
    console.error('Audit log error (non-fatal):', err.message);
  }
}

export async function listUsers(req, res) {
  try {
    const [users] = await pool.query('SELECT * FROM users ORDER BY id DESC');
    return res.render('users/index', {
      title: 'Manajemen Pengguna',
      active: 'users',
      users,
      userId: req.session.user_id,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    console.error('Error listUsers:', error);
    return res.status(500).send('Terjadi kesalahan saat memuat data pengguna.');
  }
}

export async function showTambah(req, res) {
  return res.render('users/tambah', {
    title: 'Tambah Pengguna Baru',
    active: 'users',
    csrfToken: req.csrfToken ? req.csrfToken() : ''
  });
}

export async function createUser(req, res) {
  try {
    const { nama, username, password, role, nip, nisn, kelas } = req.body;

    if (!nama || !username || !password || !role) {
      return res.status(400).send('Semua kolom wajib diisi!');
    }

    if (!['admin', 'guru', 'siswa'].includes(role)) {
      return res.status(400).send('Role tidak valid!');
    }

    const val = validatePasswordPolicy(password, username);
    if (!val.valid) {
      return res.status(400).send(`Password tidak memenuhi kebijakan: ${val.message}`);
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).send('Username sudah digunakan!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let fotoName = null;
    if (req.file && req.file.buffer) {
      const uploadRes = await uploadImage(req.file.buffer, req.file.mimetype, 'profil');
      fotoName = path.basename(uploadRes);
    }

    await pool.query(
      'INSERT INTO users (nama, username, password, role, foto_profil, nip, nisn, kelas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nama, username, hashedPassword, role, fotoName, nip || null, nisn || null, kelas || null]
    );

    await logAudit(req, 'tambah_user', `Admin menambah pengguna baru [${username}] dengan role [${role}]`);
    return res.redirect('/users');
  } catch (error) {
    console.error('Error createUser:', error);
    return res.status(500).send('Terjadi kesalahan saat menambahkan pengguna: ' + error.message);
  }
}

export async function showEdit(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.redirect('/users');

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.redirect('/users');
    }

    return res.render('users/edit', {
      title: 'Edit Pengguna',
      active: 'users',
      data: rows[0],
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    console.error('Error showEdit:', error);
    return res.status(500).send('Terjadi kesalahan saat memuat form edit pengguna.');
  }
}

export async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.redirect('/users');

    const { nama, password, role, nip, nisn, kelas, foto_lama } = req.body;

    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (!userRows || userRows.length === 0) {
      return res.redirect('/users');
    }
    const user = userRows[0];

    let updatePasswordSql = '';
    let params = [nama, role, nip || null, nisn || null, kelas || null];

    if (password && password.trim().length > 0) {
      const val = validatePasswordPolicy(password, user.username);
      if (!val.valid) {
        return res.status(400).send(`Password baru tidak memenuhi kebijakan: ${val.message}`);
      }
      const newHash = await bcrypt.hash(password, 10);
      updatePasswordSql = ', password = ?';
      params.push(newHash);
    }

    let fotoName = foto_lama || user.foto_profil;
    if (req.file && req.file.buffer) {
      const uploadRes = await uploadImage(req.file.buffer, req.file.mimetype, 'profil');
      fotoName = path.basename(uploadRes);
      if (foto_lama) await deleteImage(foto_lama, 'profil');
    }
    params.push(fotoName);
    params.push(id);

    await pool.query(
      `UPDATE users SET nama = ?, role = ?, nip = ?, nisn = ?, kelas = ? ${updatePasswordSql}, foto_profil = ? WHERE id = ?`,
      params
    );

    await logAudit(req, 'edit_user', `Admin memperbarui pengguna [ID: ${id}, Username: ${user.username}]`);
    return res.redirect('/users');
  } catch (error) {
    console.error('Error updateUser:', error);
    return res.status(500).send('Terjadi kesalahan saat memperbarui pengguna: ' + error.message);
  }
}

export async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.redirect('/users');

    if (id === Number(req.session.user_id) || id === 1) {
      return res.status(400).send('Dilarang menghapus akun sendiri atau akun administrator utama!');
    }

    const [userRows] = await pool.query('SELECT username FROM users WHERE id = ?', [id]);
    const username = userRows[0]?.username || id;

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    await logAudit(req, 'hapus_user', `Admin menghapus pengguna [ID: ${id}, Username: ${username}]`);
    return res.redirect('/users');
  } catch (error) {
    console.error('Error deleteUser:', error);
    return res.status(500).send('Terjadi kesalahan saat menghapus pengguna.');
  }
}

export default {
  listUsers,
  showTambah,
  createUser,
  showEdit,
  updateUser,
  deleteUser
};
