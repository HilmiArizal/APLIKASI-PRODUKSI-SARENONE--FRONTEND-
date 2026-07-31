export const DEFAULT_USERS = [
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
  {
    id: 'u_admin_produk',
    username: 'admin_produk',
    email: 'admin_produk@sarenone.com',
    pass: 'Adminproduk@123',
    name: 'Super Admin Produk',
    role: 'ADMIN_PRODUK',
    status: 'VERIFIED',
    provider: 'local',
    createdAt: '2026-07-30 00:00'
  }
];

export const INITIAL_KATEGORI_PRODUK = [
  { id: 'kat_1', nama: 'SAREN ONE', deskripsi: 'Daging olahan makanan beku' },
  { id: 'kat_2', nama: 'EAT GOW', deskripsi: 'Daging olahan makanan beku' },
  { id: 'kat_3', nama: 'BEULEUM', deskripsi: 'Daging olahan makanan beku' }
];
export const INITIAL_KATEGORI_BAHAN = [];
export const INITIAL_BAHAN_BAKU = [];
export const INITIAL_PRODUK = [];
export const INITIAL_RESEP = {};
export const INITIAL_AUDIT_LOG = [];
export const INITIAL_RIWAYAT_PRODUKSI = [];

export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}
