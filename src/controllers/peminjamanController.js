import pool from '../config/database.js';
import storageAdapter from '../utils/storageAdapter.js';
import logAudit from '../utils/auditLogger.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

// Skema validasi Zod
const ajukanPinjamSchema = z.object({
  id_barang: z.coerce.number().int().positive({ message: 'Barang yang dipilih tidak valid' }),
  nama_peminjam: z.string().trim().min(2, { message: 'Nama peminjam minimal 2 karakter' }).max(100).optional()
});

const catatanKembaliSchema = z.object({
  catatan_pengembalian: z.string().trim().max(1000, { message: 'Catatan pengembalian maksimal 1000 karakter' }).optional()
});

const reviewKembaliSchema = z.object({
  action: z.enum(['acc_kembali', 'tolak_kembali'], { message: 'Aksi review tidak valid' }),
  catatan_penolakan: z.string().trim().max(1000, { message: 'Catatan penolakan maksimal 1000 karakter' }).optional()
});

/**
 * 1. Tampilkan Halaman Daftar Peminjaman (GET /peminjaman)
 */
export async function listPeminjaman(req, res) {
  try {
    const role = req.session.role;
    const sessionUserId = Number(req.session.user_id);
    const filterStatus = req.query.status || '';

    let query = '';
    let params = [];

    if (role === 'siswa') {
      // Siswa: HANYA melihat data peminjaman miliknya sendiri
      query = `
        SELECT p.*, b.nama_barang, b.foto as foto_barang, COALESCE(p.nama_peminjam, u.nama) as nama_peminjam
        FROM peminjaman p
        JOIN barang b ON p.id_barang = b.id
        LEFT JOIN users u ON p.id_user = u.id
        WHERE p.id_user = ?
        ORDER BY p.tgl_pinjam DESC, p.id DESC
      `;
      params = [sessionUserId];
    } else {
      // Guru / Admin: Melihat seluruh peminjaman
      if (filterStatus) {
        query = `
          SELECT p.*, b.nama_barang, b.foto as foto_barang, COALESCE(p.nama_peminjam, u.nama) as nama_peminjam
          FROM peminjaman p
          JOIN barang b ON p.id_barang = b.id
          LEFT JOIN users u ON p.id_user = u.id
          WHERE p.status = ?
          ORDER BY p.tgl_pinjam DESC, p.id DESC
        `;
        params = [filterStatus];
      } else {
        query = `
          SELECT p.*, b.nama_barang, b.foto as foto_barang, COALESCE(p.nama_peminjam, u.nama) as nama_peminjam
          FROM peminjaman p
          JOIN barang b ON p.id_barang = b.id
          LEFT JOIN users u ON p.id_user = u.id
          ORDER BY p.tgl_pinjam DESC, p.id DESC
        `;
        params = [];
      }
    }

    const [peminjaman] = await pool.query(query, params);

    // Ambil daftar barang yang tersedia untuk modal ajukan pinjam
    const [barangTersedia] = await pool.query(`
      SELECT id, nama_barang, kategori, stok, kondisi, foto
      FROM barang
      WHERE deleted_at IS NULL AND stok > 0
      ORDER BY nama_barang ASC
    `);

    // Ambil nama user default untuk form
    const [userData] = await pool.query('SELECT nama FROM users WHERE id = ?', [sessionUserId]);
    const defaultNama = userData[0]?.nama || req.session.user || '';

    return res.render('peminjaman/index', {
      title: 'Data Peminjaman',
      active: 'peminjaman',
      peminjaman,
      barang: barangTersedia,
      default_nama: defaultNama,
      filterStatus,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    console.error('Error listPeminjaman:', error);
    return res.status(500).send('Terjadi kesalahan pada server saat memuat data peminjaman.');
  }
}

/**
 * 2. Ajukan Peminjaman oleh Siswa (POST /peminjaman/ajukan)
 * Semantik PHP: Stok TIDAK dikurangi saat pending, hanya dicatat transaksi peminjaman.
 */
export async function ajukanPinjam(req, res) {
  const isJson = req.xhr || req.headers['accept']?.includes('application/json') || req.is('json');

  try {
    const role = req.session.role;
    if (role !== 'siswa') {
      const msg = 'Hanya siswa yang diizinkan untuk mengajukan peminjaman!';
      if (isJson) return res.status(403).json({ success: false, message: msg });
      return res.status(403).send(msg);
    }

    const validation = ajukanPinjamSchema.safeParse(req.body);
    if (!validation.success) {
      const msg = validation.error.issues[0]?.message || 'Data pengajuan tidak valid';
      if (isJson) return res.status(400).json({ success: false, message: msg });
      return res.status(400).send(msg);
    }

    const { id_barang, nama_peminjam } = validation.data;
    const sessionUserId = Number(req.session.user_id);
    const sessionNama = req.session.nama || req.session.user || 'Siswa';
    const peminjamFinal = (nama_peminjam && nama_peminjam.trim().length > 0) ? nama_peminjam.trim() : sessionNama;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Cek ketersediaan barang (harus aktif dan stok > 0)
      const [barangRows] = await connection.query(`
        SELECT id, nama_barang, stok, deleted_at
        FROM barang
        WHERE id = ? FOR UPDATE
      `, [id_barang]);

      if (!barangRows || barangRows.length === 0 || barangRows[0].deleted_at !== null) {
        await connection.rollback();
        const msg = 'Barang yang dipilih tidak ditemukan atau telah diarsipkan!';
        if (isJson) return res.status(404).json({ success: false, message: msg });
        return res.status(404).send(msg);
      }

      if (barangRows[0].stok <= 0) {
        await connection.rollback();
        const msg = 'Stok barang habis!';
        if (isJson) return res.status(400).json({ success: false, message: msg });
        return res.status(400).send(msg);
      }

      // Simpan peminjaman dengan status 'pending'
      const [insertResult] = await connection.query(`
        INSERT INTO peminjaman (id_user, nama_peminjam, id_barang, tgl_pinjam, status)
        VALUES (?, ?, ?, CURDATE(), 'pending')
      `, [sessionUserId, peminjamFinal, id_barang]);

      const newLoanId = insertResult.insertId;

      // Catat juga ke detail_peminjaman untuk kompatibilitas skema multi-item
      await connection.query(`
        INSERT INTO detail_peminjaman (id_peminjaman, id_barang, jumlah)
        VALUES (?, ?, 1)
      `, [newLoanId, id_barang]);

      await connection.commit();

      // Audit log
      await logAudit(
        req,
        'ajukan_peminjaman',
        `Siswa mengajukan pinjaman alat [ID: ${id_barang}, "${barangRows[0].nama_barang}"] (Peminjaman ID: ${newLoanId})`
      );

      const successMsg = 'Pengajuan peminjaman berhasil! Menunggu persetujuan Guru.';
      if (isJson) {
        return res.status(201).json({ success: true, message: successMsg, loanId: newLoanId });
      }
      return res.redirect('/peminjaman');
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error ajukanPinjam:', error);
    const errMsg = 'Gagal mengajukan peminjaman: ' + error.message;
    if (isJson) return res.status(500).json({ success: false, message: errMsg });
    return res.status(500).send(errMsg);
  }
}

/**
 * 3. Persetujuan Peminjaman oleh Guru/Admin (POST /peminjaman/acc/:id)
 * State machine: pending -> disetujui
 * Transaksi atomik & conditional update stok: stok = stok - 1 WHERE id = ? AND stok >= 1
 */
export async function accPinjam(req, res) {
  const isJson = req.xhr || req.headers['accept']?.includes('application/json') || req.is('json');
  const loanId = Number(req.params.id || req.body.id);

  if (!loanId || isNaN(loanId) || loanId <= 0) {
    const msg = 'ID peminjaman tidak valid!';
    if (isJson) return res.status(400).json({ success: false, message: msg });
    return res.status(400).send(msg);
  }

  // Handle retry untuk potensi deadlock / write-conflict
  let retries = 3;
  while (retries > 0) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Kunci data peminjaman dengan status asal 'pending'
      const [loanRows] = await connection.query(`
        SELECT id, id_barang, id_user, status
        FROM peminjaman
        WHERE id = ? FOR UPDATE
      `, [loanId]);

      if (!loanRows || loanRows.length === 0) {
        await connection.rollback();
        const msg = 'Data peminjaman tidak ditemukan!';
        if (isJson) return res.status(404).json({ success: false, message: msg });
        return res.status(404).send(msg);
      }

      const loan = loanRows[0];
      if (loan.status !== 'pending') {
        await connection.rollback();
        const msg = `Peminjaman tidak valid untuk disetujui (status saat ini: "${loan.status}").`;
        if (isJson) return res.status(409).json({ success: false, message: msg });
        return res.status(409).send(msg);
      }

      // Conditional UPDATE stok (anti-race condition)
      const [stockUpdate] = await connection.query(`
        UPDATE barang
        SET stok = stok - 1
        WHERE id = ? AND stok >= 1 AND deleted_at IS NULL
      `, [loan.id_barang]);

      if (stockUpdate.affectedRows === 0) {
        await connection.rollback();
        const msg = 'Stok barang tidak mencukupi untuk disetujui!';
        if (isJson) return res.status(400).json({ success: false, message: msg });
        return res.status(400).send(msg);
      }

      // State transition ketat: pending -> disetujui
      const [loanUpdate] = await connection.query(`
        UPDATE peminjaman
        SET status = 'disetujui'
        WHERE id = ? AND status = 'pending'
      `, [loanId]);

      if (loanUpdate.affectedRows === 0) {
        await connection.rollback();
        const msg = 'Gagal memperbarui status peminjaman (status telah berubah oleh proses lain).';
        if (isJson) return res.status(409).json({ success: false, message: msg });
        return res.status(409).send(msg);
      }

      await connection.commit();

      await logAudit(
        req,
        'acc_peminjaman',
        `Peminjaman ID: ${loanId} disetujui oleh [${req.session.user}], stok berkurang 1`
      );

      const successMsg = 'Peminjaman disetujui!';
      if (isJson) return res.status(200).json({ success: true, message: successMsg });
      return res.redirect('/peminjaman');
    } catch (err) {
      await connection.rollback();
      // Error code deadlock: 1213 / ER_LOCK_DEADLOCK
      if ((err.code === 'ER_LOCK_DEADLOCK' || err.errno === 1213) && retries > 1) {
        retries--;
        await new Promise(r => setTimeout(r, 50));
        continue;
      }
      console.error('Error accPinjam:', err);
      const errMsg = 'Terjadi kesalahan sistem saat menyetujui peminjaman: ' + err.message;
      if (isJson) return res.status(500).json({ success: false, message: errMsg });
      return res.status(500).send(errMsg);
    } finally {
      connection.release();
    }
  }
}

/**
 * 4. Penolakan Peminjaman oleh Guru/Admin (POST /peminjaman/tolak/:id)
 * State machine: pending -> ditolak
 */
export async function tolakPinjam(req, res) {
  const isJson = req.xhr || req.headers['accept']?.includes('application/json') || req.is('json');
  const loanId = Number(req.params.id || req.body.id);
  const catatanPenolakan = req.body.catatan_penolakan ? String(req.body.catatan_penolakan).trim() : null;

  if (!loanId || isNaN(loanId) || loanId <= 0) {
    const msg = 'ID peminjaman tidak valid!';
    if (isJson) return res.status(400).json({ success: false, message: msg });
    return res.status(400).send(msg);
  }

  try {
    const [loanUpdate] = await pool.query(`
      UPDATE peminjaman
      SET status = 'ditolak', catatan_penolakan = ?
      WHERE id = ? AND status = 'pending'
    `, [catatanPenolakan, loanId]);

    if (loanUpdate.affectedRows === 0) {
      const msg = 'Gagal menolak peminjaman: data tidak ditemukan atau status bukan "pending"!';
      if (isJson) return res.status(409).json({ success: false, message: msg });
      return res.status(409).send(msg);
    }

    await logAudit(
      req,
      'tolak_peminjaman',
      `Peminjaman ID: ${loanId} ditolak oleh [${req.session.user}]`
    );

    const successMsg = 'Peminjaman ditolak';
    if (isJson) return res.status(200).json({ success: true, message: successMsg });
    return res.redirect('/peminjaman');
  } catch (error) {
    console.error('Error tolakPinjam:', error);
    const errMsg = 'Terjadi kesalahan sistem saat menolak peminjaman.';
    if (isJson) return res.status(500).json({ success: false, message: errMsg });
    return res.status(500).send(errMsg);
  }
}

/**
 * 5. Form Pengajuan Pengembalian oleh Siswa (GET /peminjaman/kembali/:id)
 * Anti-IDOR: Siswa hanya dapat membuka form untuk pinjaman miliknya sendiri berstatus 'disetujui'
 */
export async function getFormKembali(req, res) {
  try {
    const role = req.session.role;
    if (role !== 'siswa') {
      return res.status(403).send('Halaman ini khusus untuk siswa!');
    }

    const loanId = Number(req.params.id);
    const sessionUserId = Number(req.session.user_id);

    if (!loanId || isNaN(loanId) || loanId <= 0) {
      return res.status(400).send('ID peminjaman tidak valid!');
    }

    const [rows] = await pool.query(`
      SELECT p.*, b.nama_barang, b.foto as foto_barang, u.nama as nama_user
      FROM peminjaman p
      JOIN barang b ON p.id_barang = b.id
      JOIN users u ON p.id_user = u.id
      WHERE p.id = ?
    `, [loanId]);

    if (!rows || rows.length === 0) {
      return res.status(404).send('Peminjaman tidak ditemukan!');
    }

    const data = rows[0];

    // Anti-IDOR: periksa kepemilikan numerik
    if (Number(data.id_user) !== sessionUserId) {
      return res.status(403).send('Akses Ditolak: Anda tidak memiliki akses terhadap peminjaman siswa lain!');
    }

    if (data.status !== 'disetujui') {
      return res.status(400).send('Hanya peminjaman yang disetujui yang bisa diajukan pengembalian!');
    }

    return res.render('peminjaman/kembali', {
      title: 'Ajukan Pengembalian Barang',
      active: 'peminjaman',
      data,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    console.error('Error getFormKembali:', error);
    return res.status(500).send('Terjadi kesalahan saat memuat form pengembalian.');
  }
}

/**
 * 6. Pengajuan Pengembalian oleh Siswa (POST /peminjaman/kembali/:id)
 * Anti-IDOR: Siswa wajib pemilik peminjaman.
 * Upload bukti dengan magic bytes & batas 4MB melalui storageAdapter.
 * State machine: disetujui -> menunggu_pengembalian
 */
export async function ajukanKembali(req, res) {
  const isJson = req.xhr || req.headers['accept']?.includes('application/json') || req.is('json');
  const loanId = Number(req.params.id || req.body.id);
  const sessionUserId = Number(req.session.user_id);

  if (!loanId || isNaN(loanId) || loanId <= 0) {
    const msg = 'ID peminjaman tidak valid!';
    if (isJson) return res.status(400).json({ success: false, message: msg });
    return res.status(400).send(msg);
  }

  try {
    const role = req.session.role;
    if (role !== 'siswa') {
      const msg = 'Hanya siswa yang diizinkan untuk mengajukan pengembalian!';
      if (isJson) return res.status(403).json({ success: false, message: msg });
      return res.status(403).send(msg);
    }

    // Ambil data peminjaman untuk verifikasi anti-IDOR
    const [loanRows] = await pool.query(`
      SELECT id, id_user, status, id_barang
      FROM peminjaman
      WHERE id = ?
    `, [loanId]);

    if (!loanRows || loanRows.length === 0) {
      const msg = 'Peminjaman tidak valid atau tidak ditemukan!';
      if (isJson) return res.status(404).json({ success: false, message: msg });
      return res.status(404).send(msg);
    }

    const loan = loanRows[0];

    // Anti-IDOR Check (Perbandingan numerik ketat)
    if (Number(loan.id_user) !== sessionUserId) {
      const msg = 'Akses Ditolak: Anda tidak dapat mengajukan pengembalian untuk data peminjaman siswa lain!';
      if (isJson) return res.status(403).json({ success: false, message: msg });
      return res.status(403).send(msg);
    }

    if (loan.status !== 'disetujui') {
      const msg = `Peminjaman tidak valid untuk dikembalikan (status saat ini: "${loan.status}").`;
      if (isJson) return res.status(409).json({ success: false, message: msg });
      return res.status(409).send(msg);
    }

    // Validasi file bukti pengembalian
    if (!req.file || !req.file.buffer) {
      const msg = 'Foto bukti pengembalian wajib diunggah!';
      if (isJson) return res.status(400).json({ success: false, message: msg });
      return res.status(400).send(msg);
    }

    // Upload via storageAdapter (Magic Bytes, Max 4MB, Cryptographic Random Name)
    let buktiKembaliPath = '';
    try {
      buktiKembaliPath = await storageAdapter.uploadImage(
        req.file.buffer,
        req.file.mimetype,
        'bukti_kembali'
      );
    } catch (uploadError) {
      if (isJson) return res.status(400).json({ success: false, message: uploadError.message });
      return res.status(400).send(uploadError.message);
    }

    const catatan = req.body.catatan_pengembalian ? String(req.body.catatan_pengembalian).trim() : '';

    // State transition ketat: disetujui -> menunggu_pengembalian
    const [updateResult] = await pool.query(`
      UPDATE peminjaman
      SET status = 'menunggu_pengembalian', bukti_kembali = ?, catatan_pengembalian = ?
      WHERE id = ? AND id_user = ? AND status = 'disetujui'
    `, [path.basename(buktiKembaliPath), catatan, loanId, sessionUserId]);

    if (updateResult.affectedRows === 0) {
      const msg = 'Gagal memperbarui status pengembalian (status peminjaman telah berubah).';
      if (isJson) return res.status(409).json({ success: false, message: msg });
      return res.status(409).send(msg);
    }

    await logAudit(
      req,
      'ajukan_pengembalian',
      `Siswa [ID: ${sessionUserId}] mengajukan pengembalian Peminjaman ID: ${loanId} dengan bukti foto [${path.basename(buktiKembaliPath)}]`
    );

    const successMsg = 'Pengajuan pengembalian berhasil! Menunggu review dan verifikasi Guru.';
    if (isJson) return res.status(200).json({ success: true, message: successMsg });
    return res.redirect('/peminjaman');
  } catch (error) {
    console.error('Error ajukanKembali:', error);
    const errMsg = 'Gagal memproses pengembalian: ' + error.message;
    if (isJson) return res.status(500).json({ success: false, message: errMsg });
    return res.status(500).send(errMsg);
  }
}

/**
 * 7. Tampilkan Daftar Pengembalian Menunggu Review Guru/Admin (GET /peminjaman/review)
 */
export async function listReviewKembali(req, res) {
  try {
    const [result] = await pool.query(`
      SELECT p.*, b.nama_barang, u.nama as nama_peminjam, u.nisn, u.nip
      FROM peminjaman p
      JOIN barang b ON p.id_barang = b.id
      JOIN users u ON p.id_user = u.id
      WHERE p.status = 'menunggu_pengembalian'
      ORDER BY p.tgl_pinjam DESC, p.id DESC
    `);

    const [countMenungguRows] = await pool.query("SELECT COUNT(*) as total FROM peminjaman WHERE status = 'menunggu_pengembalian'");
    const [countKembaliRows] = await pool.query("SELECT COUNT(*) as total FROM peminjaman WHERE status = 'kembali'");

    return res.render('peminjaman/review_kembali', {
      title: 'Review Pengembalian Barang',
      active: 'review_kembali',
      data: result,
      count_menunggu: countMenungguRows[0]?.total || 0,
      count_sudah_kembali: countKembaliRows[0]?.total || 0,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    console.error('Error listReviewKembali:', error);
    return res.status(500).send('Terjadi kesalahan saat memuat halaman review pengembalian.');
  }
}

/**
 * 8. Eksekusi Review Pengembalian oleh Guru/Admin (POST /peminjaman/review/:id)
 * Action: 'acc_kembali' -> stok + 1, status = 'kembali', tgl_kembali = CURDATE()
 * Action: 'tolak_kembali' -> status = 'disetujui', catatan_penolakan, stok tetap
 */
export async function reviewKembali(req, res) {
  const isJson = req.xhr || req.headers['accept']?.includes('application/json') || req.is('json');
  const loanId = Number(req.params.id || req.body.id);

  if (!loanId || isNaN(loanId) || loanId <= 0) {
    const msg = 'ID peminjaman tidak valid!';
    if (isJson) return res.status(400).json({ success: false, message: msg });
    return res.status(400).send(msg);
  }

  const validation = reviewKembaliSchema.safeParse(req.body);
  if (!validation.success) {
    const msg = validation.error.issues[0]?.message || 'Parameter review tidak valid';
    if (isJson) return res.status(400).json({ success: false, message: msg });
    return res.status(400).send(msg);
  }

  const { action, catatan_penolakan } = validation.data;

  let retries = 3;
  while (retries > 0) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Kunci data peminjaman
      const [loanRows] = await connection.query(`
        SELECT id, id_barang, id_user, status
        FROM peminjaman
        WHERE id = ? FOR UPDATE
      `, [loanId]);

      if (!loanRows || loanRows.length === 0) {
        await connection.rollback();
        const msg = 'Data peminjaman tidak ditemukan!';
        if (isJson) return res.status(404).json({ success: false, message: msg });
        return res.status(404).send(msg);
      }

      const loan = loanRows[0];
      if (loan.status !== 'menunggu_pengembalian') {
        await connection.rollback();
        const msg = `Peminjaman tidak valid untuk direview (status saat ini: "${loan.status}").`;
        if (isJson) return res.status(409).json({ success: false, message: msg });
        return res.status(409).send(msg);
      }

      if (action === 'acc_kembali') {
        // Restorasi stok barang: stok = stok + 1
        const [stockUpdate] = await connection.query(`
          UPDATE barang
          SET stok = stok + 1
          WHERE id = ?
        `, [loan.id_barang]);

        if (stockUpdate.affectedRows === 0) {
          await connection.rollback();
          const msg = 'Gagal merestorasi stok alat!';
          if (isJson) return res.status(400).json({ success: false, message: msg });
          return res.status(400).send(msg);
        }

        // State transition: menunggu_pengembalian -> kembali
        const [loanUpdate] = await connection.query(`
          UPDATE peminjaman
          SET status = 'kembali', tgl_kembali = CURDATE()
          WHERE id = ? AND status = 'menunggu_pengembalian'
        `, [loanId]);

        if (loanUpdate.affectedRows === 0) {
          await connection.rollback();
          const msg = 'Gagal memperbarui status pengembalian (terjadi konflik status).';
          if (isJson) return res.status(409).json({ success: false, message: msg });
          return res.status(409).send(msg);
        }

        await connection.commit();

        await logAudit(
          req,
          'acc_pengembalian',
          `Pengembalian Peminjaman ID: ${loanId} disetujui oleh [${req.session.user}], stok dipulihkan +1`
        );

        const successMsg = 'Pengembalian barang berhasil diterima dan stok alat telah dipulihkan!';
        if (isJson) return res.status(200).json({ success: true, message: successMsg });
        return res.redirect('/peminjaman/review');

      } else if (action === 'tolak_kembali') {
        // State transition: menunggu_pengembalian -> disetujui (siswa ajukan ulang)
        const [loanUpdate] = await connection.query(`
          UPDATE peminjaman
          SET status = 'disetujui', catatan_penolakan = ?
          WHERE id = ? AND status = 'menunggu_pengembalian'
        `, [catatan_penolakan || 'Bukti pengembalian ditolak oleh guru/admin', loanId]);

        if (loanUpdate.affectedRows === 0) {
          await connection.rollback();
          const msg = 'Gagal menolak pengembalian (terjadi konflik status).';
          if (isJson) return res.status(409).json({ success: false, message: msg });
          return res.status(409).send(msg);
        }

        await connection.commit();

        await logAudit(
          req,
          'tolak_pengembalian',
          `Pengembalian Peminjaman ID: ${loanId} ditolak oleh [${req.session.user}]`
        );

        const successMsg = 'Pengembalian ditolak. Status peminjaman dikembalikan ke "disetujui".';
        if (isJson) return res.status(200).json({ success: true, message: successMsg });
        return res.redirect('/peminjaman/review');
      }
    } catch (err) {
      await connection.rollback();
      if ((err.code === 'ER_LOCK_DEADLOCK' || err.errno === 1213) && retries > 1) {
        retries--;
        await new Promise(r => setTimeout(r, 50));
        continue;
      }
      console.error('Error reviewKembali:', err);
      const errMsg = 'Terjadi kesalahan sistem saat memproses review pengembalian: ' + err.message;
      if (isJson) return res.status(500).json({ success: false, message: errMsg });
      return res.status(500).send(errMsg);
    } finally {
      connection.release();
    }
  }
}

/**
 * 9. Halaman Riwayat Peminjaman Siswa (GET /riwayat)
 */
export async function getRiwayat(req, res) {
  try {
    const role = req.session.role;
    const sessionUserId = Number(req.session.user_id);

    let query = '';
    let params = [];

    if (role === 'siswa') {
      // Siswa hanya melihat riwayat miliknya sendiri yang sudah 'kembali'
      query = `
        SELECT p.*, b.nama_barang, u.nama as nama_peminjam
        FROM peminjaman p
        JOIN barang b ON p.id_barang = b.id
        JOIN users u ON p.id_user = u.id
        WHERE p.id_user = ? AND p.status = 'kembali'
        ORDER BY p.tgl_pinjam DESC, p.id DESC
      `;
      params = [sessionUserId];
    } else {
      // Guru / Admin melihat seluruh riwayat
      query = `
        SELECT p.*, b.nama_barang, u.nama as nama_peminjam
        FROM peminjaman p
        JOIN barang b ON p.id_barang = b.id
        JOIN users u ON p.id_user = u.id
        WHERE p.status = 'kembali'
        ORDER BY p.tgl_pinjam DESC, p.id DESC
      `;
      params = [];
    }

    const [riwayat] = await pool.query(query, params);

    return res.render('riwayat/index', {
      title: 'Riwayat Peminjaman',
      active: 'riwayat',
      riwayat,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    console.error('Error getRiwayat:', error);
    return res.status(500).send('Terjadi kesalahan saat memuat riwayat peminjaman.');
  }
}

/**
 * 10. Akses Bukti Foto Terlindungi (GET /peminjaman/bukti/:filename)
 * Anti-IDOR: Guru/Admin dapat melihat semua foto bukti.
 * Siswa HANYA dapat melihat bukti foto milik transaksi peminjamannya sendiri!
 */
export async function getBuktiFoto(req, res) {
  try {
    // 0. Autentikasi Wajib: Mencegah akses publik tanpa login
    if (!req.session || !req.session.login) {
      return res.status(401).send('Akses Ditolak: Anda harus login terlebih dahulu untuk mengakses bukti foto!');
    }

    const filename = path.basename(req.params.filename);
    const role = req.session.role;
    const sessionUserId = Number(req.session.user_id);

    // Cari kepemilikan file di basis data
    const [rows] = await pool.query('SELECT id_user FROM peminjaman WHERE bukti_kembali = ? LIMIT 1', [filename]);
    if (!rows || rows.length === 0) {
      return res.status(404).send('Foto bukti tidak ditemukan dalam basis data.');
    }

    // Anti-IDOR Check
    if (role === 'siswa' && Number(rows[0].id_user) !== sessionUserId) {
      return res.status(403).send('Akses Ditolak: Anda tidak memiliki izin untuk melihat bukti foto milik siswa lain!');
    }

    // 1. Cek penyimpanan lokal
    const filePath = path.join(rootDir, 'public', 'assets', 'uploads', 'bukti_kembali', filename);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // 2. Jika di cloud / Vercel Blob (Private Mode)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { get } = await import('@vercel/blob');
        const blobData = await get(`bukti_kembali/${filename}`, { access: 'private' });
        if (blobData && blobData.stream) {
          res.setHeader('Content-Type', blobData.blob.contentType || 'image/jpeg');
          res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
          const { Readable } = await import('stream');
          return Readable.fromWeb(blobData.stream).pipe(res);
        }
      } catch (blobErr) {
        console.error('Gagal mengambil private blob bukti:', blobErr.message);
      }
    }

    return res.status(404).send('Berkas foto fisik tidak ditemukan.');
  } catch (error) {
    console.error('Error getBuktiFoto:', error);
    return res.status(500).send('Terjadi kesalahan saat mengambil berkas bukti.');
  }
}

/**
 * 11. Legacy Dispatcher Endpoint (POST /api/peminjaman)
 * Meniru perilaku API legacy dengan pengamanan ketat RBAC, CSRF, Anti-IDOR, dan State Machine
 */
export async function legacyPeminjamanApi(req, res) {
  const action = req.body.action || req.query.action;

  switch (action) {
    case 'create':
      return ajukanPinjam(req, res);
    case 'acc':
      return accPinjam(req, res);
    case 'tolak':
      return tolakPinjam(req, res);
    case 'acc_kembali':
    case 'tolak_kembali':
      return reviewKembali(req, res);
    default:
      return res.status(400).json({ success: false, message: 'Invalid action parameter' });
  }
}

export default {
  listPeminjaman,
  ajukanPinjam,
  accPinjam,
  tolakPinjam,
  getFormKembali,
  ajukanKembali,
  listReviewKembali,
  reviewKembali,
  getRiwayat,
  getBuktiFoto,
  legacyPeminjamanApi
};
