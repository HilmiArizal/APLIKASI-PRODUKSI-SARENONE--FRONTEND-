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
  }
];

export const INITIAL_KATEGORI_PRODUK = [];
export const INITIAL_KATEGORI_BAHAN = [];
export const INITIAL_BAHAN_BAKU = [];
export const INITIAL_PRODUK = [];
export const INITIAL_RESEP = {};
export const INITIAL_AUDIT_LOG = [];
export const INITIAL_RIWAYAT_PRODUKSI = [];

export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}
