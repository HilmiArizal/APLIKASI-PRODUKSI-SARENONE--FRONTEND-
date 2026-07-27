import React from 'react';
import { Boxes, PackageCheck, AlertCircle, ChefHat, Activity, Sparkles, PlusCircle, Factory, ArrowDownLeft } from 'lucide-react';
import { formatNumber } from '../data/initialData';

export default function DashboardTab({
  bahanBaku = [],
  produk = [],
  riwayatProduksi = [],
  auditLog = [],
  activeRoleView,
  onNavigate,
  onOpenModalTambahBahan,
  onOpenModalProduksi,
  onOpenModalStokMasuk,
  onSwitchTab
}) {
  const totalBahan = bahanBaku.length;
  const nilaiBahan = bahanBaku.reduce((acc, b) => acc + (b.stok * b.harga), 0);

  const totalProdukStok = produk.reduce((acc, p) => acc + p.stok, 0);
  const nilaiProduk = produk.reduce((acc, p) => acc + (p.stok * p.harga), 0);

  const lowStockList = bahanBaku.filter(b => b.stok <= b.minStok);

  // Calculate Today's Production sum accurately from riwayatProduksi for today's date
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayBatches = (riwayatProduksi || []).filter(r => r.timestamp && r.timestamp.startsWith(todayStr));
  const todayProduksiCount = todayBatches.reduce((acc, r) => acc + (Number(r.jumlahPcs) || 0), 0);

  const getAksiBadgeStyle = (aksi) => {
    if (aksi.includes('Restock') || aksi.includes('Masuk')) return 'status-safe';
    if (aksi.includes('Produksi')) return 'status-warning';
    if (aksi.includes('Hapus') || aksi.includes('Keluar')) return 'status-danger';
    return 'status-safe';
  };

  return (
    <div className="tab-pane active">
      <div className="stats-grid">
        <div className="stat-card border-cyan">
          <div className="stat-icon icon-cyan"><Boxes size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">Total Jenis Bahan Baku</span>
            <h3 className="stat-value">{totalBahan} Jenis</h3>
            <span className="stat-desc text-cyan">Persediaan Bahan Mentah</span>
          </div>
        </div>

        {/* <div className="stat-card border-emerald">
          <div className="stat-icon icon-emerald"><PackageCheck size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">Total Stok Produk Jadi</span>
            <h3 className="stat-value">{totalProdukStok} Batch</h3>
            <span className="stat-desc text-emerald">Produk Siap Distribusi</span>
          </div>
        </div> */}

        <div className="stat-card border-amber">
          <div className="stat-icon icon-amber"><AlertCircle size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">Bahan Baku Menipis</span>
            <h3 className="stat-value">{lowStockList.length} Items</h3>
            <span className="stat-desc text-amber">Membutuhkan Restock</span>
          </div>
        </div>

        <div className="stat-card border-indigo">
          <div className="stat-icon icon-indigo"><ChefHat size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">Produksi Hari Ini ({todayStr})</span>
            <h3 className="stat-value">{todayProduksiCount} Batch</h3>
            <span className="stat-desc text-indigo">Sesi Produksi Batch Hari Ini</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="card card-table">
          <div className="card-header">
            <h3><Activity size={18} /> Aktivitas Transaksi Terakhir</h3>
            <button className="btn btn-sm btn-outline" onClick={() => onSwitchTab('audit-log')}>Lihat Semua</button>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Peran / User</th>
                  <th>Tipe Aksi</th>
                  <th>Rincian Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.slice(0, 5).map((l, idx) => (
                  <tr key={l.id || idx}>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{l.timestamp}</td>
                    <td>
                      <strong>{l.user}</strong> <span className="role-badge" style={{ fontSize: '0.65rem' }}>{l.role}</span>
                    </td>
                    <td><span className={`status-badge ${getAksiBadgeStyle(l.aksi)}`}>{l.aksi}</span></td>
                    <td>{l.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
