import bcrypt from 'bcryptjs';
import { z } from 'zod';
import pool from '../config/database.js';
import logAudit from '../utils/auditLogger.js';
import storageAdapter from '../utils/storageAdapter.js';
import { validatePasswordPolicy } from '../utils/passwordPolicy.js';

const profileSchema = z.object({
  nama: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter').max(100, 'Nama maksimal 100 karakter'),
  old_password: z.string().optional(),
  password: z.string().optional(),
  confirm_password: z.string().optional()
});

export const showProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;

    // Strict Anti-IDOR: Always query exclusively with req.session.user_id
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!rows || rows.length === 0) {
      return res.redirect('/auth/logout');
    }

    const user = rows[0];

    let profilePhotoUrl = '';
    if (user.foto_profil && (user.foto_profil.startsWith('http://') || user.foto_profil.startsWith('https://') || user.foto_profil.startsWith('/assets/'))) {
      profilePhotoUrl = user.foto_profil;
    } else if (user.foto_profil && user.foto_profil !== 'default.png') {
      profilePhotoUrl = `/assets/uploads/profil/${user.foto_profil}`;
    } else {
      profilePhotoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&background=random`;
    }

    res.render('profil/index', {
      title: 'Profil Saya | Peminjaman Alat Bengkel',
      active: 'profil',
      user,
      profilePhotoUrl,
      error: null,
      success: req.query.success === '1' ? 'Profil berhasil diperbarui!' : null
    });

  } catch (error) {
    console.error('Show profile error:', error);
    res.status(500).send('Terjadi kesalahan saat memuat halaman profil.');
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.session.user_id;

  try {
    // 1. Fetch current user from database
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!rows || rows.length === 0) {
      return res.redirect('/auth/logout');
    }
    const currentUser = rows[0];

    // Helper for rendering with error
    const renderWithError = (errorMsg) => {
      let photoUrl = '';
      if (currentUser.foto_profil && (currentUser.foto_profil.startsWith('http://') || currentUser.foto_profil.startsWith('https://') || currentUser.foto_profil.startsWith('/assets/'))) {
        photoUrl = currentUser.foto_profil;
      } else if (currentUser.foto_profil && currentUser.foto_profil !== 'default.png') {
        photoUrl = `/assets/uploads/profil/${currentUser.foto_profil}`;
      } else {
        photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nama)}&background=random`;
      }

      return res.render('profil/index', {
        title: 'Profil Saya | Peminjaman Alat Bengkel',
        active: 'profil',
        user: { ...currentUser, nama: req.body.nama || currentUser.nama },
        profilePhotoUrl: photoUrl,
        error: errorMsg,
        success: null
      });
    };

    // 2. Validate basic input fields
    const parseResult = profileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return renderWithError(parseResult.error.errors[0]?.message || 'Input tidak valid');
    }

    const { nama, old_password, password, confirm_password } = parseResult.data;

    // 3. Handle Password Change (Strict Cybersecurity Requirement)
    let finalHashedPassword = currentUser.password;
    const isChangingPassword = password && password.trim().length > 0;

    if (isChangingPassword) {
      // Must provide old_password
      if (!old_password || old_password.trim().length === 0) {
        return renderWithError('Untuk mengganti kata sandi, kata sandi lama wajib dimasukkan!');
      }

      // Verify old_password with bcrypt
      const isOldMatch = await bcrypt.compare(old_password, currentUser.password);
      if (!isOldMatch) {
        return renderWithError('Kata sandi lama yang Anda masukkan tidak sesuai!');
      }

      // Validate new password rules using cybersecurity policy
      const policyResult = validatePasswordPolicy(password, currentUser.username);
      if (!policyResult.valid) {
        return renderWithError(policyResult.message);
      }

      // If confirm password provided, must match
      if (confirm_password && password !== confirm_password) {
        return renderWithError('Konfirmasi kata sandi baru tidak cocok!');
      }

      // Hash new password
      finalHashedPassword = await bcrypt.hash(password, 10);
    }

    // 4. Handle Photo Upload via Storage Adapter
    let finalFotoProfil = currentUser.foto_profil;
    if (req.file) {
      try {
        const uploadedUrl = await storageAdapter.uploadImage(req.file.buffer, req.file.mimetype, 'profil');
        
        // Clean up previous photo if existing
        if (currentUser.foto_profil) {
          await storageAdapter.deleteImage(currentUser.foto_profil, 'profil');
        }

        finalFotoProfil = uploadedUrl;
      } catch (uploadError) {
        return renderWithError(uploadError.message);
      }
    }

    // 5. Update Database Record (Anti-IDOR: WHERE id = userId from session)
    await pool.execute(`
      UPDATE users 
      SET nama = ?, password = ?, foto_profil = ?, updated_at = NOW() 
      WHERE id = ?
    `, [nama, finalHashedPassword, finalFotoProfil, userId]);

    // Update session state
    req.session.nama = nama;

    await logAudit(
      req,
      'PROFILE_UPDATED',
      `Profile updated by ${req.session.user}${isChangingPassword ? ' (password changed)' : ''}${req.file ? ' (photo changed)' : ''}`,
      userId,
      req.session.user
    );

    return res.redirect('/profil?success=1');

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).send('Terjadi kesalahan saat memperbarui profil.');
  }
};

export default {
  showProfile,
  updateProfile
};
