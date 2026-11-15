import PDFDocument from 'pdfkit';
import pool from '../config/database.js';

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

/**
 * Membangun klausa WHERE dan parameter SQL secara aman dari query params
 */
function buildLaporanQuery(queryParams) {
  const conditions = [];
  const params = [];

  const { tgl_mulai, tgl_selesai, status, id_barang, peminjam } = queryParams;

  if (tgl_mulai) {
    conditions.push('p.tgl_pinjam >= ?');
    params.push(tgl_mulai);
  }

  if (tgl_selesai) {
    conditions.push('p.tgl_pinjam <= ?');
    params.push(tgl_selesai);
  }

  if (status && ['pending', 'disetujui', 'ditolak', 'menunggu_pengembalian', 'kembali'].includes(status)) {
    conditions.push('p.status = ?');
    params.push(status);
  }

  if (id_barang && !isNaN(Number(id_barang))) {
    conditions.push('p.id_barang = ?');
    params.push(Number(id_barang));
  }

  if (peminjam && peminjam.trim().length > 0) {
    conditions.push('(u.nama LIKE ? OR p.nama_peminjam LIKE ?)');
    const term = `%${peminjam.trim()}%`;
    params.push(term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

/**
 * Sanitasi cell CSV dari CSV / Formula Injection
 * Karakter berbahaya di awal cell (=, +, -, @, \t, \r) di-prefix dengan kutip satu (')
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // Jika karakter pertama adalah formula trigger
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes jika memuat koma, kutip, atau newline
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * 1. Tampilkan Halaman Laporan Tabular (GET /laporan)
 */
export async function getLaporanPage(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit || '25', 10)));
    const offset = (page - 1) * limit;

    const { whereClause, params } = buildLaporanQuery(req.query);

    // Hitung total baris
    const [countRows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM peminjaman p
      JOIN barang b ON p.id_barang = b.id
      JOIN users u ON p.id_user = u.id
      ${whereClause}
    `, params);

    const totalRows = countRows[0]?.total || 0;
    const totalPages = Math.ceil(totalRows / limit);

    // Ambil data halaman ini
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        u.nama as nama_peminjam,
        b.nama_barang,
        p.tgl_pinjam,
        p.tgl_kembali,
        p.status
      FROM peminjaman p
      JOIN barang b ON p.id_barang = b.id
      JOIN users u ON p.id_user = u.id
      ${whereClause}
      ORDER BY p.tgl_pinjam DESC, p.id DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Query string untuk filter pagination & export
    const qObj = { ...req.query };
    delete qObj.page;
    delete qObj.limit;
    const queryString = new URLSearchParams(qObj).toString();

    await logAudit(req, 'lihat_laporan', `Guru/Admin melihat halaman laporan peminjaman (Filter: ${whereClause || 'Semua'})`);

    return res.render('laporan/index', {
      title: 'Laporan Peminjaman Alat',
      active: 'laporan',
      data: rows,
      filters: req.query,
      queryString,
      pagination: {
        currentPage: page,
        totalPages,
        limit,
        totalRows
      },
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    console.error('Error getLaporanPage:', error);
    return res.status(500).send('Terjadi kesalahan saat memuat laporan peminjaman.');
  }
}

/**
 * 2. Ekspor Laporan ke Format CSV Spreadsheet (GET /laporan/cetak/csv)
 * Dilengkapi UTF-8 BOM dan Proteksi Formula Injection
 */
export async function exportCsv(req, res) {
  try {
    const MAX_EXPORT = 1000;
    const { whereClause, params } = buildLaporanQuery(req.query);

    const [rows] = await pool.query(`
      SELECT 
        u.nama as nama_peminjam,
        b.nama_barang,
        p.tgl_pinjam,
        p.tgl_kembali,
        p.status
      FROM peminjaman p
      JOIN barang b ON p.id_barang = b.id
      JOIN users u ON p.id_user = u.id
      ${whereClause}
      ORDER BY p.tgl_pinjam DESC, p.id DESC
      LIMIT ?
    `, [...params, MAX_EXPORT]);

    const filename = `laporan_peminjaman_${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Konten CSV
    let csvContent = '';

    // Header baris
    csvContent += ['No', 'Nama Peminjam', 'Barang', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status'].join(',') + '\r\n';

    // Isi baris
    rows.forEach((r, idx) => {
      const rowData = [
        sanitizeCsvCell(idx + 1),
        sanitizeCsvCell(r.nama_peminjam),
        sanitizeCsvCell(r.nama_barang),
        sanitizeCsvCell(r.tgl_pinjam ? new Date(r.tgl_pinjam).toISOString().split('T')[0] : '-'),
        sanitizeCsvCell(r.tgl_kembali ? new Date(r.tgl_kembali).toISOString().split('T')[0] : '-'),
        sanitizeCsvCell(r.status)
      ];
      csvContent += rowData.join(',') + '\r\n';
    });

    // Kirim UTF-8 BOM eksplisit (0xEF, 0xBB, 0xBF) disusul konten CSV
    const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
    const finalBuffer = Buffer.concat([bomBuffer, Buffer.from(csvContent, 'utf8')]);

    await logAudit(req, 'ekspor_csv_laporan', `Guru/Admin mengekspor laporan peminjaman ke format CSV (${rows.length} baris)`);
    return res.status(200).send(finalBuffer);
  } catch (error) {
    console.error('Error exportCsv:', error);
    return res.status(500).send('Gagal mengekspor laporan ke format CSV: ' + error.message);
  }
}

/**
 * 3. Ekspor Laporan ke Format PDF Landscape A4 (GET /laporan/cetak/pdf)
 * Tata letak profesional seragam dengan sampel cetak SMKN 5 Kuningan
 */
export async function exportPdf(req, res) {
  try {
    const MAX_EXPORT = 500;
    const { whereClause, params } = buildLaporanQuery(req.query);

    const [rows] = await pool.query(`
      SELECT 
        u.nama as nama_peminjam,
        b.nama_barang,
        p.tgl_pinjam,
        p.tgl_kembali,
        p.status
      FROM peminjaman p
      JOIN barang b ON p.id_barang = b.id
      JOIN users u ON p.id_user = u.id
      ${whereClause}
      ORDER BY p.tgl_pinjam DESC, p.id DESC
      LIMIT ?
    `, [...params, MAX_EXPORT]);

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
      info: {
        Title: 'Laporan Peminjaman Alat Bengkel',
        Author: 'SIPAB SMKN 5 Kuningan'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="laporan_peminjaman.pdf"');

    doc.pipe(res);

    // KOP SURAT
    doc.fontSize(14).font('Helvetica-Bold').text('SISTEM INFORMASI PEMINJAMAN ALAT BENGKEL (SIPAB)', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text('SMK NEGERI 5 KUNINGAN - PROGRAM KEAHLIAN TEKNIK KENDARAAN RINGAN', { align: 'center' });
    doc.fontSize(9).font('Helvetica-Oblique').text('Jl. Raya Cirendang - Cigugur, Kuningan, Jawa Barat 45518', { align: 'center' });
    doc.moveDown(0.5);

    // Garis Kop Surat
    doc.strokeColor('#000000').lineWidth(1.5)
       .moveTo(40, doc.y)
       .lineTo(802, doc.y)
       .stroke();
    doc.moveDown(1);

    // JUDUL DOKUMEN
    doc.fontSize(12).font('Helvetica-Bold').text('LAPORAN REKAPITULASI PEMINJAMAN ALAT', { align: 'center' });
    doc.fontSize(9).font('Helvetica').text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB`, { align: 'center' });
    doc.moveDown(1);

    // HEADER TABEL
    const startX = 40;
    let startY = doc.y;
    const colWidths = [35, 180, 200, 110, 110, 87];
    const colTitles = ['No', 'Nama Peminjam', 'Barang Bengkel', 'Tgl Pinjam', 'Tgl Kembali', 'Status'];

    // Header Background
    doc.rect(startX, startY, 722, 20).fill('#EEEEEE');
    doc.strokeColor('#000000').lineWidth(0.8).rect(startX, startY, 722, 20).stroke();

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
    let curX = startX;
    colTitles.forEach((title, i) => {
      doc.text(title, curX + 4, startY + 5, { width: colWidths[i] - 8, align: i === 0 ? 'center' : 'left' });
      curX += colWidths[i];
    });

    startY += 20;
    doc.font('Helvetica').fontSize(8.5);

    // BARIS DATA
    rows.forEach((r, idx) => {
      // Cek apakah halaman penuh
      if (startY > 480) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 });
        startY = 40;
        // Gambar ulang header di halaman baru
        doc.rect(startX, startY, 722, 20).fill('#EEEEEE');
        doc.strokeColor('#000000').lineWidth(0.8).rect(startX, startY, 722, 20).stroke();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
        let hX = startX;
        colTitles.forEach((t, i) => {
          doc.text(t, hX + 4, startY + 5, { width: colWidths[i] - 8, align: i === 0 ? 'center' : 'left' });
          hX += colWidths[i];
        });
        startY += 20;
        doc.font('Helvetica').fontSize(8.5);
      }

      // Baris Border & Background striping
      if (idx % 2 === 1) {
        doc.rect(startX, startY, 722, 18).fill('#FBFBFB');
      }
      doc.strokeColor('#CCCCCC').lineWidth(0.5).rect(startX, startY, 722, 18).stroke();

      const tglPinjam = r.tgl_pinjam ? new Date(r.tgl_pinjam).toISOString().split('T')[0] : '-';
      const tglKembali = r.tgl_kembali ? new Date(r.tgl_kembali).toISOString().split('T')[0] : '-';

      doc.fillColor('#000000');
      let dX = startX;
      doc.text(String(idx + 1), dX + 4, startY + 4, { width: colWidths[0] - 8, align: 'center' });
      dX += colWidths[0];
      doc.text(r.nama_peminjam, dX + 4, startY + 4, { width: colWidths[1] - 8, ellipsis: true });
      dX += colWidths[1];
      doc.text(r.nama_barang, dX + 4, startY + 4, { width: colWidths[2] - 8, ellipsis: true });
      dX += colWidths[2];
      doc.text(tglPinjam, dX + 4, startY + 4, { width: colWidths[3] - 8 });
      dX += colWidths[3];
      doc.text(tglKembali, dX + 4, startY + 4, { width: colWidths[4] - 8 });
      dX += colWidths[4];
      doc.text(r.status.toUpperCase(), dX + 4, startY + 4, { width: colWidths[5] - 8 });

      startY += 18;
    });

    // TANDA TANGAN SECTION (Di kanan bawah)
    if (startY > 440) {
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 });
      startY = 40;
    }

    const ttdY = startY + 25;
    const ttdX = 560;
    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    doc.text(`Kuningan, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, ttdX, ttdY, { width: 200, align: 'center' });
    doc.text('Mengetahui,', ttdX, ttdY + 14, { width: 200, align: 'center' });
    doc.text('Koordinator Bengkel TKR', ttdX, ttdY + 28, { width: 200, align: 'center' });

    doc.font('Helvetica-Bold').text('( Hendriawan, S.Pd. )', ttdX, ttdY + 85, { width: 200, align: 'center' });
    doc.font('Helvetica').fontSize(8).text('NIP. 19780520 199903 2 001', ttdX, ttdY + 98, { width: 200, align: 'center' });

    doc.end();
    await logAudit(req, 'ekspor_pdf_laporan', `Guru/Admin mengekspor laporan peminjaman ke format PDF (${rows.length} baris)`);
  } catch (error) {
    console.error('Error exportPdf:', error);
    return res.status(500).send('Gagal membuat dokumen PDF laporan: ' + error.message);
  }
}

export default {
  getLaporanPage,
  exportCsv,
  exportPdf,
  sanitizeCsvCell
};
