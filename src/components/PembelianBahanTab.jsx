import React, { useState } from 'react';
import { ShoppingCart, Plus, Search, Calendar, CheckCircle, AlertTriangle, CreditCard, Building2 } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalTambahUtangSupplier, ModalKelolaSupplier } from './Modals';

export default function PembelianBahanTab({
  utangList = [],
  bahanBaku = [],
  suppliersList = [],
  activeRoleView,
  onCreateUtang,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  showAlert
}) {
  const [isTambahOpen, setIsTambahOpen] = useState(false);
  const [isKelolaSupplierOpen, setIsKelolaSupplierOpen] = useState(false);
  const [search, setSearch] = useState('');

  const canManage = (activeRoleView === 'ADMIN' || activeRoleView === 'PEMBELIAN');

  // Only show recent purchases (last 30 days or all)
  const filtered = utangList.filter(item => {
    const s = search.toLowerCase();
    return (item.supplier || '').toLowerCase().includes(s) ||
           (item.noFaktur || '').toLowerCase().includes(s) ||
           (item.bahanNama || '').toLowerCase().includes(s);
  });

  // Metrics
  const totalFaktur = utangList.length;
  const totalTagihanAll = utangList.reduce((acc, x) => acc + (x.totalTagihan || 0), 0);
  const totalBelumLunas = utangList.filter(x => x.status !== 'LUNAS').length;

  return (
    <div className="tab-pane active">
      {/* Header */}
      <div className="toolbar" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={22} style={{ color: 'var(--primary)' }} /> Pembelian Bahan Baku
          </h2>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Catat transaksi pembelian bahan baku dari supplier — setiap faktur pembelian dicatat sebagai tagihan utang.
          </p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setIsTambahOpen(true)}>
            <Plus size={16} /> Tambah Faktur Pembelian
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Total Transaksi Faktur</span>
            <CreditCard size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
            {totalFaktur} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Faktur</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tercatat dari supplier</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--amber)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Total Nilai Pembelian</span>
            <ShoppingCart size={18} style={{ color: 'var(--amber)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--amber)', marginTop: '0.5rem' }}>
            Rp {formatNumber(totalTagihanAll)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Akumulasi semua faktur</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--rose)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Faktur Belum Lunas</span>
            <AlertTriangle size={18} style={{ color: 'var(--rose)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--rose)', marginTop: '0.5rem' }}>
            {totalBelumLunas}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Masih ada sisa utang</span>
        </div>
      </div>

      {/* Riwayat Faktur Table */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Riwayat Faktur Pembelian</h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Daftar semua transaksi pembelian bahan baku yang telah dicatat.</span>
          </div>
          <div className="search-box" style={{ maxWidth: '280px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari Faktur, Supplier, Bahan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>NO FAKTUR & SUPPLIER</th>
              <th>BAHAN BAKU DIBELI</th>
              <th>JUMLAH</th>
              <th>HARGA SATUAN</th>
              <th>TOTAL TAGIHAN</th>
              <th>TGL BELI</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">
                  {canManage ? (
                    <div>
                      <ShoppingCart size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                      <div>Belum ada faktur pembelian. Klik <strong>"+ Tambah Faktur Pembelian"</strong> untuk mulai mencatat.</div>
                    </div>
                  ) : 'Belum ada catatan pembelian.'}
                </td>
              </tr>
            ) : (
              filtered.map(item => {
                const isLunas = item.status === 'LUNAS' || item.sisaUtang === 0;
                return (
                  <tr key={item.id || item._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.noFaktur}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{item.supplier}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.bahanNama}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>{item.satuan}</div>
                    </td>
                    <td><strong>{formatNumber(item.jumlah)} {item.satuan}</strong></td>
                    <td>Rp {formatNumber(item.hargaSatuan)}</td>
                    <td><strong style={{ color: 'var(--amber)' }}>Rp {formatNumber(item.totalTagihan)}</strong></td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>📅 {item.tanggalBeli}</div>
                    </td>
                    <td>
                      {isLunas ? (
                        <span className="badge badge-emerald">✓ LUNAS</span>
                      ) : item.jumlahDibayar > 0 ? (
                        <span className="badge badge-amber">CICILAN</span>
                      ) : (
                        <span className="badge badge-rose">BELUM LUNAS</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ModalTambahUtangSupplier
        isOpen={isTambahOpen}
        onClose={() => setIsTambahOpen(false)}
        bahanList={bahanBaku}
        suppliersList={suppliersList}
        onSubmit={onCreateUtang}
        onOpenKelolaSupplier={() => setIsKelolaSupplierOpen(true)}
        showAlert={showAlert}
      />

      <ModalKelolaSupplier
        isOpen={isKelolaSupplierOpen}
        onClose={() => setIsKelolaSupplierOpen(false)}
        suppliersList={suppliersList}
        onCreateSupplier={onCreateSupplier}
        onUpdateSupplier={onUpdateSupplier}
        onDeleteSupplier={onDeleteSupplier}
        showAlert={showAlert}
      />
    </div>
  );
}
