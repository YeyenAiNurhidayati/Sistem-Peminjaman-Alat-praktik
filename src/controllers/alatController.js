import { z } from 'zod';
import pool from '../config/database.js';
import logAudit from '../utils/auditLogger.js';
import storageAdapter from '../utils/storageAdapter.js';

const toolSchema = z.object({
  nama_barang: z.string().trim().min(2, 'Nama alat minimal 2 karakter').max(100, 'Nama alat maksimal 100 karakter'),
  kategori: z.enum(['Hand Tools', 'Power Tools', 'SST'], {
    errorMap: () => ({ message: 'Kategori harus dipilih antara Hand Tools, Power Tools, atau SST' })
  }),
  stok: z.coerce.number().int('Stok harus berupa bilangan bulat').min(0, 'Stok minimal 0'),
  kondisi: z.enum(['Baik', 'Rusak', 'Perlu Perbaikan'], {
    errorMap: () => ({ message: 'Kondisi harus dipilih antara Baik, Rusak, atau Perlu Perbaikan' })
  })
});

const isApiOrAjax = (req) => {
  return (
    req.xhr ||
    req.headers['accept']?.includes('application/json') ||
    req.baseUrl?.startsWith('/api') ||
    req.originalUrl?.includes('/api/') ||
    req.path?.startsWith('/api')
  );
};

/**
 * Helper to extract uploaded file from multer request
 */
function getUploadedFile(req) {
  if (req.file) return req.file;
  if (req.files) {
    if (req.files['foto'] && req.files['foto'][0]) return req.files['foto'][0];
    if (req.files['gambar'] && req.files['gambar'][0]) return req.files['gambar'][0];
  }
  return null;
}

/**
 * GET /alat
 * List all active workshop tools (where deleted_at IS NULL)
 */
export const listAlat = async (req, res) => {
  try {
    const { kategori, search } = req.query;

    let query = 'SELECT * FROM barang WHERE deleted_at IS NULL';
    const params = [];

    if (kategori && kategori !== 'Semua' && ['Hand Tools', 'Power Tools', 'SST'].includes(kategori)) {
      query += ' AND kategori = ?';
      params.push(kategori);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ' AND (nama_barang LIKE ? OR kategori LIKE ? OR kondisi LIKE ?)';
      const searchParam = `%${search.trim()}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY id DESC';

    const [alat] = await pool.execute(query, params);

    // Aggregate category counts for active items
    const [counts] = await pool.execute(`
      SELECT 
        COUNT(*) as total_all,
        SUM(CASE WHEN kategori = 'Hand Tools' THEN 1 ELSE 0 END) as total_hand,
        SUM(CASE WHEN kategori = 'Power Tools' THEN 1 ELSE 0 END) as total_power,
        SUM(CASE WHEN kategori = 'SST' THEN 1 ELSE 0 END) as total_sst
      FROM barang
      WHERE deleted_at IS NULL
    `);

    res.render('alat/index', {
      title: 'Kelola Alat | Peminjaman Alat Bengkel',
      active: 'alat',
      alat,
      selectedKategori: kategori || 'Semua',
      searchQuery: search || '',
      categoryCounts: counts[0] || { total_all: 0, total_hand: 0, total_power: 0, total_sst: 0 },
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (error) {
    console.error('List alat error:', error);
    res.status(500).send('Terjadi kesalahan saat memuat data alat.');
  }
};

/**
 * GET /api/alat
 * Return list of active tools as JSON
 */
export const getAllAlat = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM barang WHERE deleted_at IS NULL ORDER BY id DESC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get all alat error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data alat.' });
  }
};

/**
 * GET /api/alat/:id or /alat/detail/:id
 * Return single tool data as JSON
 */
export const getAlatById = async (req, res) => {
  try {
    const toolId = req.params.id || req.query.id;
    if (!toolId) {
      return res.status(400).json({ success: false, message: 'ID alat diperlukan.' });
    }

    const [rows] = await pool.execute('SELECT * FROM barang WHERE id = ? AND deleted_at IS NULL LIMIT 1', [toolId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Alat tidak ditemukan.' });
    }

    return res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Get alat error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan basis data.' });
  }
};

/**
 * GET /alat/edit/:id
 * Standalone edit page for pixel parity with legacy edit.php
 */
export const showEditPage = async (req, res) => {
  try {
    const toolId = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM barang WHERE id = ? AND deleted_at IS NULL LIMIT 1', [toolId]);

    if (!rows || rows.length === 0) {
      return res.redirect('/alat?error=' + encodeURIComponent('Alat tidak ditemukan.'));
    }

    res.render('alat/edit', {
      title: 'Edit Alat | Peminjaman Alat Bengkel',
      active: 'alat',
      data: rows[0],
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (error) {
    console.error('Show edit page error:', error);
    res.status(500).send('Terjadi kesalahan saat memuat halaman edit alat.');
  }
};

/**
 * POST /api/alat or POST /alat
 * Create new tool (RESTful POST)
 */
export const createAlat = async (req, res) => {
  const isAjax = isApiOrAjax(req);

  try {
    const parseResult = toolSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || parseResult.error.errors?.[0]?.message || 'Input tidak valid';
      if (isAjax) return res.status(400).json({ success: false, message: errorMsg });
      return res.redirect(`/alat?error=${encodeURIComponent(errorMsg)}`);
    }

    const { nama_barang, kategori, stok, kondisi } = parseResult.data;

    let foto = null;
    const uploadedFile = getUploadedFile(req);
    if (uploadedFile) {
      foto = await storageAdapter.uploadImage(uploadedFile.buffer, uploadedFile.mimetype, 'barang');
    }

    const [result] = await pool.execute(
      'INSERT INTO barang (nama_barang, kategori, stok, kondisi, foto) VALUES (?, ?, ?, ?, ?)',
      [nama_barang, kategori, stok, kondisi, foto]
    );

    await logAudit(
      req,
      'ALAT_CREATED',
      `Menambahkan alat: ${nama_barang} (ID: ${result.insertId}, Kategori: ${kategori}, Stok: ${stok})`
    );

    if (isAjax) {
      return res.json({ success: true, message: 'Data berhasil ditambahkan!', id: result.insertId });
    }
    return res.redirect('/alat?success=' + encodeURIComponent('Data berhasil ditambahkan!'));
  } catch (error) {
    console.error('Create alat error:', error);
    const msg = error.message || 'Gagal menambahkan alat.';
    if (isAjax) return res.status(500).json({ success: false, message: msg });
    return res.redirect(`/alat?error=${encodeURIComponent(msg)}`);
  }
};

/**
 * PUT /api/alat/:id or POST /alat/edit/:id
 * Update existing tool (RESTful PUT)
 */
export const updateAlat = async (req, res) => {
  const isAjax = isApiOrAjax(req);
  const toolId = req.params.id || req.body.id;

  try {
    if (!toolId) {
      if (isAjax) return res.status(400).json({ success: false, message: 'ID alat wajib diisi.' });
      return res.redirect('/alat?error=' + encodeURIComponent('ID alat wajib diisi.'));
    }

    const [existing] = await pool.execute('SELECT * FROM barang WHERE id = ? AND deleted_at IS NULL LIMIT 1', [toolId]);
    if (!existing || existing.length === 0) {
      if (isAjax) return res.status(404).json({ success: false, message: 'Alat tidak ditemukan.' });
      return res.redirect('/alat?error=' + encodeURIComponent('Alat tidak ditemukan.'));
    }

    const parseResult = toolSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || parseResult.error.errors?.[0]?.message || 'Input tidak valid';
      if (isAjax) return res.status(400).json({ success: false, message: errorMsg });
      return res.redirect(`/alat?error=${encodeURIComponent(errorMsg)}`);
    }

    const { nama_barang, kategori, stok, kondisi } = parseResult.data;

    let foto = existing[0].foto;
    const uploadedFile = getUploadedFile(req);
    if (uploadedFile) {
      foto = await storageAdapter.uploadImage(uploadedFile.buffer, uploadedFile.mimetype, 'barang');
    }

    await pool.execute(
      'UPDATE barang SET nama_barang = ?, kategori = ?, stok = ?, kondisi = ?, foto = ? WHERE id = ?',
      [nama_barang, kategori, stok, kondisi, foto, toolId]
    );

    await logAudit(
      req,
      'ALAT_UPDATED',
      `Mengubah alat ID ${toolId}: ${nama_barang} (Kategori: ${kategori}, Stok: ${stok}, Kondisi: ${kondisi})`
    );

    if (isAjax) {
      return res.json({ success: true, message: 'Data berhasil diupdate!' });
    }
    return res.redirect('/alat?success=' + encodeURIComponent('Data berhasil diupdate!'));
  } catch (error) {
    console.error('Update alat error:', error);
    const msg = error.message || 'Gagal mengupdate alat.';
    if (isAjax) return res.status(500).json({ success: false, message: msg });
    return res.redirect(`/alat?error=${encodeURIComponent(msg)}`);
  }
};

/**
 * DELETE /api/alat/:id or POST /alat/hapus/:id
 * Delete tool (RESTful DELETE)
 * Preserves historical data integrity:
 * - If active loans exist: REJECT with friendly 400 error
 * - If completed historical loans exist (kembali / ditolak): SOFT-DELETE (set deleted_at = NOW())
 *   so reports and past logs remain 100% queryable with zero data loss or 500 errors.
 * - If no loans exist: HARD-DELETE from database.
 */
export const deleteAlat = async (req, res) => {
  const isAjax = isApiOrAjax(req);
  const toolId = req.params.id || req.body.id;

  try {
    if (!toolId) {
      if (isAjax) return res.status(400).json({ success: false, message: 'ID alat wajib diisi.' });
      return res.redirect('/alat?error=' + encodeURIComponent('ID alat wajib diisi.'));
    }

    const [existing] = await pool.execute('SELECT * FROM barang WHERE id = ? AND deleted_at IS NULL LIMIT 1', [toolId]);
    if (!existing || existing.length === 0) {
      if (isAjax) return res.status(404).json({ success: false, message: 'Alat tidak ditemukan.' });
      return res.redirect('/alat?error=' + encodeURIComponent('Alat tidak ditemukan.'));
    }

    // 1. Check for ACTIVE loans (pending, disetujui, menunggu_pengembalian)
    const [activeLoans] = await pool.execute(
      "SELECT id FROM peminjaman WHERE id_barang = ? AND status IN ('pending', 'disetujui', 'menunggu_pengembalian') LIMIT 1",
      [toolId]
    );
    if (activeLoans && activeLoans.length > 0) {
      const errorMsg = 'Alat tidak dapat dihapus karena masih ada transaksi peminjaman aktif!';
      if (isAjax) return res.status(400).json({ success: false, message: errorMsg });
      return res.redirect(`/alat?error=${encodeURIComponent(errorMsg)}`);
    }

    // 2. Check for COMPLETED historical loans (kembali, ditolak)
    const [historyLoans] = await pool.execute(
      "SELECT id FROM peminjaman WHERE id_barang = ? LIMIT 1",
      [toolId]
    );

    if (historyLoans && historyLoans.length > 0) {
      // Soft-delete: preserve history for reports and audit trails
      await pool.execute('UPDATE barang SET deleted_at = NOW() WHERE id = ?', [toolId]);
      await logAudit(
        req,
        'ALAT_ARCHIVED',
        `Mengarsipkan alat berriwayat: ${existing[0].nama_barang} (ID: ${toolId})`
      );

      const msg = 'Data alat berhasil diarsipkan karena memiliki riwayat peminjaman sebelumnya (riwayat laporan tetap terjaga).';
      if (isAjax) return res.json({ success: true, message: msg, archived: true });
      return res.redirect('/alat?success=' + encodeURIComponent(msg));
    }

    // 3. No loans ever recorded: Safe to hard-delete
    await pool.execute('DELETE FROM barang WHERE id = ?', [toolId]);
    await logAudit(
      req,
      'ALAT_DELETED',
      `Menghapus permanen alat: ${existing[0].nama_barang} (ID: ${toolId})`
    );

    if (isAjax) {
      return res.json({ success: true, message: 'Data berhasil dihapus!' });
    }
    return res.redirect('/alat?success=' + encodeURIComponent('Data berhasil dihapus!'));
  } catch (error) {
    console.error('Delete alat error:', error);
    const msg = error.message || 'Gagal menghapus data alat.';
    if (isAjax) return res.status(500).json({ success: false, message: msg });
    return res.redirect(`/alat?error=${encodeURIComponent(msg)}`);
  }
};

export default {
  listAlat,
  getAllAlat,
  getAlatById,
  showEditPage,
  createAlat,
  updateAlat,
  deleteAlat
};
