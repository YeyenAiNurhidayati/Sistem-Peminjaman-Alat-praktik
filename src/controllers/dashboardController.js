import pool from '../config/database.js';

export const showDashboard = async (req, res) => {
  try {
    const role = req.session.role;
    const userId = req.session.user_id;
    const namaUser = req.session.nama || 'Pengguna';

    // 1. Get User Profile Photo
    const [userRows] = await pool.execute('SELECT foto_profil, nama FROM users WHERE id = ? LIMIT 1', [userId]);
    const userData = userRows && userRows.length > 0 ? userRows[0] : {};
    let fotoProfil = userData.foto_profil || '';

    let profilePicUrl = '';
    if (fotoProfil && (fotoProfil.startsWith('http://') || fotoProfil.startsWith('https://') || fotoProfil.startsWith('/assets/'))) {
      profilePicUrl = fotoProfil;
    } else if (fotoProfil && fotoProfil !== 'default.png') {
      profilePicUrl = `/assets/uploads/profil/${fotoProfil}`;
    } else {
      profilePicUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(namaUser)}&background=random`;
    }

    // 2. Global Tool Statistics
    const [totalAlatRows] = await pool.query('SELECT COUNT(*) as total FROM barang');
    const [alatTersediaRows] = await pool.query('SELECT COUNT(*) as total FROM barang WHERE stok > 0');
    const [peminjamanAktifRows] = await pool.query("SELECT COUNT(*) as total FROM peminjaman WHERE status IN ('pending', 'disetujui')");
    const [totalKembaliRows] = await pool.query("SELECT COUNT(*) as total FROM peminjaman WHERE status = 'kembali'");

    const totalAlat = totalAlatRows[0]?.total || 0;
    const alatTersedia = alatTersediaRows[0]?.total || 0;
    const peminjamanAktif = peminjamanAktifRows[0]?.total || 0;
    const totalKembali = totalKembaliRows[0]?.total || 0;

    // 3. Role-specific Statistics
    let myLoans = 0;
    let pendingApprovals = 0;
    let recentActivities = [];

    if (role === 'siswa') {
      const [myLoanRows] = await pool.execute(
        "SELECT COUNT(*) as total FROM peminjaman WHERE id_user = ? AND status IN ('pending', 'disetujui')",
        [userId]
      );
      myLoans = myLoanRows[0]?.total || 0;
    }

    if (role === 'guru' || role === 'admin') {
      const [pendingRows] = await pool.query("SELECT COUNT(*) as total FROM peminjaman WHERE status = 'pending'");
      pendingApprovals = pendingRows[0]?.total || 0;

      const [recentRows] = await pool.query(`
        SELECT p.*, b.nama_barang, COALESCE(p.nama_peminjam, u.nama) as nama_peminjam
        FROM peminjaman p
        JOIN barang b ON p.id_barang = b.id
        JOIN users u ON p.id_user = u.id
        ORDER BY p.tgl_pinjam DESC, p.id DESC
        LIMIT 5
      `);
      recentActivities = recentRows || [];
    }

    res.render('dashboard', {
      title: 'Dashboard | Peminjaman Alat Bengkel',
      active: 'dashboard',
      profilePicUrl,
      totalAlat,
      alatTersedia,
      peminjamanAktif,
      totalKembali,
      myLoans,
      pendingApprovals,
      recentActivities
    });

  } catch (error) {
    console.error('Dashboard controller error:', error);
    res.status(500).send('Terjadi kesalahan saat memuat dashboard.');
  }
};

export default {
  showDashboard
};
