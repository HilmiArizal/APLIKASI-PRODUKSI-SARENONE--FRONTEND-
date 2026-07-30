import React from 'react';
import { Eye, Menu, KeyRound } from 'lucide-react';

export default function Topbar({ activeUser, activeRoleView, onChangeRoleView, activeTab, onOpenMobileSidebar, onOpenChangePassword }) {
  const titles = {
    'dashboard': { title: 'Dashboard Ringkasan', sub: 'Pantau kesehatan persediaan dan statistik produksi secara real-time.' },
    'bahan-baku': { title: 'Manajemen Stok Bahan Baku', sub: 'Kelola inventaris bahan mentah, pemasokan supplier, dan peringatan stok.' },
    'produk': { title: 'Katalog & Pemrosesan Produksi', sub: 'Kelola stok produk jadi dan jalankan batch produksi otomatis.' },
    'resep': { title: 'Manajemen Resep & BOM', sub: 'Konfigurasi formula kebutuhan bahan baku untuk setiap produk.' },
    'riwayat-produksi': { title: 'Riwayat Batch Produksi', sub: 'Jurnal rekam jejak hasil olahan dapur & detail konsumsi pemotongan bahan baku.' },
    'kategori': { title: 'Manajemen Kategori Produk & Bahan Baku', sub: 'Kelola pengelompokan jenis produk jadi dan kategori stok bahan baku dapur.' },
    'user-approval': { title: 'Verifikasi User & Akses Peran', sub: 'Modul persetujuan pendaftaran & manajemen hak akses peran pengguna.' },
    'audit-log': { title: 'Jurnal Transaksi & Audit Log', sub: 'Riwayat pencatatan lengkap aktivitas pergerakan stok.' },
    'utang-supplier': { title: 'Utang Supplier & Pembelian Bahan Baku', sub: 'Kelola faktur tagihan supplier, pembayaran cicilan, dan tempo utang.' },
    'penerimaan-bahan': { title: 'Penerimaan Bahan Baku & Verifikasi Gudang', sub: 'Konfirmasi kedatangan fisik barang baku supplier & update stok fisik gudang secara otomatis.' },
    'supplier': { title: 'Master Data Supplier & Vendor', sub: 'Kelola daftar perusahaan pemasok bahan baku, kemasan, dan bumbu (Khusus Super Admin).' }
  };

  const current = titles[activeTab] || titles['dashboard'];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-toggle" onClick={onOpenMobileSidebar} aria-label="Open Menu">
          <Menu size={22} />
        </button>
        <div className="topbar-title">
          <h2>{current.title}</h2>
          <p className="text-muted">{current.sub}</p>
        </div>
      </div>

      <div className="topbar-actions">
        {activeUser?.role === 'ADMIN' && (
          <div className="admin-role-switcher">
            <label><Eye size={14} /> Peran:</label>
            <select
              value={activeRoleView}
              onChange={(e) => onChangeRoleView(e.target.value)}
            >
              <option value="ADMIN">Super Admin</option>
              <option value="BAHAN_BAKU">Tim Produksi</option>
              <option value="PEMBELIAN">Tim Pembelian</option>
            </select>
          </div>
        )}

        <button className="btn btn-outline btn-icon" title="Ubah Kata Sandi Akun" onClick={onOpenChangePassword}>
          <KeyRound size={16} style={{ color: 'var(--amber)' }} /> <span className="btn-text-hide-mobile">Ubah Password</span>
        </button>
      </div>
    </header>
  );
}
