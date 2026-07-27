export const DEFAULT_USERS = [
  // SUPER ADMIN (UTAMA) - USERNAME: admin, PASSWORD: admin
  {
    id: 'u1',
    username: 'admin',
    email: 'admin@sarenone.com',
    pass: 'admin',
    name: 'Super Admin Saren One',
    role: 'ADMIN',
    status: 'VERIFIED',
    provider: 'local',
    createdAt: '2026-07-20 08:00'
  },
  
  // SAMPEL AKUN ANTREAN VERIFIKASI (PENDING ACC SUPER ADMIN)
  {
    id: 'u2',
    username: 'budibaker',
    email: 'budi.baker@gmail.com',
    pass: '123456',
    name: 'Budi Kurniawan (Gmail)',
    role: 'PENDING',
    requestedRole: 'PRODUK',
    status: 'PENDING',
    provider: 'google',
    catatan: 'Pengajuan akun Staf Dapur & Produksi Roti',
    createdAt: '2026-07-24 08:30'
  },
  {
    id: 'u3',
    username: 'sitigudang',
    email: 'siti.gudang@gmail.com',
    pass: '123456',
    name: 'Siti Rahma (Gmail)',
    role: 'PENDING',
    requestedRole: 'BAHAN_BAKU',
    status: 'PENDING',
    provider: 'google',
    catatan: 'Pengajuan akun Staf Penerimaan Bahan Baku',
    createdAt: '2026-07-24 09:00'
  },
  {
    id: 'u4',
    username: 'dani.bahan',
    email: 'dani.bahan@sarenone.com',
    pass: '123456',
    name: 'Dani Ramadhan',
    role: 'PENDING',
    requestedRole: 'BAHAN_BAKU',
    status: 'PENDING',
    provider: 'local',
    catatan: 'Pendaftaran Manual Staf Gudang Bahan',
    createdAt: '2026-07-24 10:15'
  }
];

export const INITIAL_KATEGORI_PRODUK = [
  { id: 'kat_1', nama: 'Roti Manis', deskripsi: 'Aneka olahan roti manis isi keju, cokelat, dan selai', createdAt: '2026-07-20 08:00' },
  { id: 'kat_2', nama: 'Kue & Cake', deskripsi: 'Aneka kue bolu, brownies, dan kue tart ulang tahun', createdAt: '2026-07-20 08:00' },
  { id: 'kat_3', nama: 'Pastry & Danish', deskripsi: 'Aneka olahan pastry renyah, butter croissant, dan puff', createdAt: '2026-07-20 08:00' },
  { id: 'kat_4', nama: 'Minuman & Kopi', deskripsi: 'Aneka olahan minuman kopi susu dan teh manis', createdAt: '2026-07-20 08:00' },
  { id: 'kat_1785136691552', nama: 'Sosis & Bakso Olahan', deskripsi: 'Olahan sosis sapi dan bakso', createdAt: '2026-07-27T07:18:11.552Z' }
];

export const INITIAL_KATEGORI_BAHAN = [
  { id: 'kat_bhn_1', nama: 'Bahan Utama', deskripsi: 'Tepung, gandum, beras, dan bahan dasar adonan utama', createdAt: '2026-07-20 08:00' },
  { id: 'kat_bhn_2', nama: 'Pemanis & Perasa', deskripsi: 'Gula, garaman, vanila, pengempuk, dan perasa makanan', createdAt: '2026-07-20 08:00' },
  { id: 'kat_bhn_3', nama: 'Toping & Isian', deskripsi: 'Keju, cokelat compound, kismis, meses, dan selai buah', createdAt: '2026-07-20 08:00' },
  { id: 'kat_bhn_4', nama: 'Olahan Susu & Lemak', deskripsi: 'Mentega, margarin, butter, susu cair, dan whipped cream', createdAt: '2026-07-20 08:00' },
  { id: 'kat_bhn_5', nama: 'Kemasan & Lainnya', deskripsi: 'Box dus roti, kantong plastik, stiker label, dan mika', createdAt: '2026-07-20 08:00' },
  { id: 'kat_bhn_1785136691669', nama: 'Bumbu & Rempah', deskripsi: 'Aneka bawang, merica, dan pala', createdAt: '2026-07-27T07:18:11.669Z' }
];

export const INITIAL_BAHAN_BAKU = [
  { id: 'b1', sku: 'BHN-001', nama: 'Tepung Terigu Cakra', kategori: 'Bahan Utama', stok: 45.5, minStok: 15.0, satuan: 'kg', harga: 13500 },
  { id: 'b2', sku: 'BHN-002', nama: 'Gula Pasir Premium', kategori: 'Pemanis & Perasa', stok: 28.0, minStok: 10.0, satuan: 'kg', harga: 17500 },
  { id: 'b3', sku: 'BHN-003', nama: 'Keju Cheddar Olahan', kategori: 'Toping & Isian', stok: 3.5, minStok: 5.0, satuan: 'kg', harga: 85000 },
  { id: 'b4', sku: 'BHN-004', nama: 'Mentega Butter Anchor', kategori: 'Olahan Susu & Lemak', stok: 12.0, minStok: 5.0, satuan: 'kg', harga: 68000 },
  { id: 'b5', sku: 'BHN-005', nama: 'Cokelat Compound Dark', kategori: 'Toping & Isian', stok: 18.0, minStok: 6.0, satuan: 'kg', harga: 54000 },
  { id: 'b6', sku: 'BHN-006', nama: 'Dus Box Roti Saren One', kategori: 'Kemasan & Lainnya', stok: 180, minStok: 50, satuan: 'pcs', harga: 1200 }
];

export const INITIAL_PRODUK = [
  { id: 'p1', sku: 'PRD-001', nama: 'Roti Keju Spesial', kategori: 'Roti Manis', stok: 35, harga: 16000 },
  { id: 'p2', sku: 'PRD-002', nama: 'Brownies Cokelat Lumer', kategori: 'Kue & Cake', stok: 18, harga: 48000 },
  { id: 'p3', sku: 'PRD-003', nama: 'Croissant Butter Original', kategori: 'Pastry & Danish', stok: 24, harga: 22000 }
];

export const INITIAL_RESEP = {
  'p1': [
    { bahanId: 'b1', takaran: 0.08 },
    { bahanId: 'b2', takaran: 0.02 },
    { bahanId: 'b3', takaran: 0.03 },
    { bahanId: 'b4', takaran: 0.02 },
    { bahanId: 'b6', takaran: 1 }
  ],
  'p2': [
    { bahanId: 'b1', takaran: 0.12 },
    { bahanId: 'b2', takaran: 0.08 },
    { bahanId: 'b5', takaran: 0.10 },
    { bahanId: 'b4', takaran: 0.05 }
  ],
  'p3': [
    { bahanId: 'b1', takaran: 0.10 },
    { bahanId: 'b4', takaran: 0.06 },
    { bahanId: 'b2', takaran: 0.01 }
  ]
};

export const INITIAL_AUDIT_LOG = [
  { id: 'LOG-101', timestamp: '2026-07-24 07:30', user: 'Tim Bahan Baku', role: 'BAHAN_BAKU', aksi: 'Stok Masuk', detail: 'Restock Tepung Terigu +20.0 kg (Supplier PT Boga Utama)' },
  { id: 'LOG-102', timestamp: '2026-07-24 08:15', user: 'Tim Produk', role: 'PRODUK', aksi: 'Produksi Batch', detail: 'Produksi 25 Pcs Roti Keju Spesial (Batch #PRD-2026-01). Stok bahan baku otomatis dipotong.' }
];

export const INITIAL_RIWAYAT_PRODUKSI = [
  {
    id: 'BATCH-2026-001',
    timestamp: '2026-07-24 08:15',
    produkId: 'p1',
    produkNama: 'Roti Keju Spesial',
    jumlahPcs: 25,
    operator: 'Tim Produk',
    pemotonganBahan: [
      { bahanNama: 'Tepung Terigu Cakra', jumlah: 2.0, satuan: 'kg' },
      { bahanNama: 'Gula Pasir Premium', jumlah: 0.5, satuan: 'kg' },
      { bahanNama: 'Keju Cheddar Olahan', jumlah: 0.75, satuan: 'kg' },
      { bahanNama: 'Mentega Butter Anchor', jumlah: 0.5, satuan: 'kg' },
      { bahanNama: 'Dus Box Roti Saren One', jumlah: 25, satuan: 'pcs' }
    ]
  },
  {
    id: 'BATCH-2026-002',
    timestamp: '2026-07-24 06:45',
    produkId: 'p2',
    produkNama: 'Brownies Cokelat Lumer',
    jumlahPcs: 10,
    operator: 'Tim Produk',
    pemotonganBahan: [
      { bahanNama: 'Tepung Terigu Cakra', jumlah: 1.2, satuan: 'kg' },
      { bahanNama: 'Gula Pasir Premium', jumlah: 0.8, satuan: 'kg' },
      { bahanNama: 'Cokelat Compound Dark', jumlah: 1.0, satuan: 'kg' },
      { bahanNama: 'Mentega Butter Anchor', jumlah: 0.5, satuan: 'kg' }
    ]
  }
];

export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}
