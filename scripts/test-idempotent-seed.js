import { execSync } from 'child_process';
import pool from '../src/config/database.js';

async function testIdempotentSeed() {
  console.log('=== PENGUJIAN IDEMPOTENSI SEED (db:seed) ===\n');

  // Ambil state awal
  const [usersBefore] = await pool.query("SELECT id, username, password FROM users WHERE username IN ('admin', 'guru', 'siswa') ORDER BY id ASC");
  const [barangBefore] = await pool.query("SELECT COUNT(*) as total FROM barang");
  const [peminjamanBefore] = await pool.query("SELECT COUNT(*) as total FROM peminjaman");

  console.log('1. Kredensial Awal Sebelum Eksekusi Seed:');
  usersBefore.forEach(u => {
    console.log(`   - [${u.username}] Hash: ${u.password}`);
  });
  console.log(`   Total Barang: ${barangBefore[0].total}, Total Peminjaman: ${peminjamanBefore[0].total}\n`);

  // Eksekusi seed pertama
  console.log('2. Menjalankan db:seed pertama (node scripts/seed.js)...');
  const out1 = execSync('node scripts/seed.js', { encoding: 'utf8' });
  console.log(out1.split('\n').filter(l => l.includes('✓')).join('\n'));

  const [usersAfter1] = await pool.query("SELECT id, username, password FROM users WHERE username IN ('admin', 'guru', 'siswa') ORDER BY id ASC");

  // Eksekusi seed kedua
  console.log('\n3. Menjalankan db:seed kedua (node scripts/seed.js)...');
  const out2 = execSync('node scripts/seed.js', { encoding: 'utf8' });
  console.log(out2.split('\n').filter(l => l.includes('✓')).join('\n'));

  const [usersAfter2] = await pool.query("SELECT id, username, password FROM users WHERE username IN ('admin', 'guru', 'siswa') ORDER BY id ASC");
  const [barangAfter2] = await pool.query("SELECT COUNT(*) as total FROM barang");
  const [peminjamanAfter2] = await pool.query("SELECT COUNT(*) as total FROM peminjaman");

  console.log('\n4. Verifikasi Hasil:');
  let isIdentical = true;
  for (let i = 0; i < usersBefore.length; i++) {
    const beforeHash = usersBefore[i].password;
    const after1Hash = usersAfter1[i].password;
    const after2Hash = usersAfter2[i].password;
    const userMatch = (beforeHash === after1Hash && after1Hash === after2Hash);
    if (!userMatch) isIdentical = false;
    console.log(`   - User [${usersBefore[i].username}]: ${userMatch ? '✓ IDENTIK' : '✗ BERUBAH'}`);
    console.log(`     Awal  : ${beforeHash}`);
    console.log(`     Seed 1: ${after1Hash}`);
    console.log(`     Seed 2: ${after2Hash}`);
  }

  const barangMatch = barangBefore[0].total === barangAfter2[0].total;
  const pinjamMatch = peminjamanBefore[0].total === peminjamanAfter2[0].total;
  console.log(`   - Jumlah Barang: ${barangMatch ? '✓ TETAP' : '✗ BERUBAH'} (${barangAfter2[0].total})`);
  console.log(`   - Jumlah Peminjaman: ${pinjamMatch ? '✓ TETAP' : '✗ BERUBAH'} (${peminjamanAfter2[0].total})`);

  if (isIdentical && barangMatch && pinjamMatch) {
    console.log('\n✓ BUKTI IDEMPOTENSI: db:seed dijalankan berulang kali TIDAK PERNAH menimpa password atau data yang ada.');
  } else {
    console.error('\n✗ PERINGATAN: Ada data yang berubah saat seed dijalankan berulang!');
    process.exit(1);
  }

  await pool.end();
}

testIdempotentSeed().catch(err => {
  console.error(err);
  process.exit(1);
});
