import React, { useState } from 'react';
import { Package, MinusCircle, CheckCircle, Search, FileText } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalPemakaianKemasan } from './Modals';

export default function PemakaianKemasanTab({
  bahanBaku = [],
  auditLog = [],
  activeRoleView,
  onUseKemasan,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBahanForModal, setSelectedBahanForModal] = useState(null);

  // Filter packaging materials (or all materials)
  const kemasanMaterials = bahanBaku.filter(b => {
    const kat = (b.kategori || '').toLowerCase();
    const name = (b.nama || '').toLowerCase();
    return kat.includes('kemasan') || name.includes('casing') || name.includes('plastik') || name.includes('pouch') || name.includes('box') || name.includes('label');
  });

  const displayMaterials = (kemasanMaterials.length > 0 ? kemasanMaterials : bahanBaku)
    .filter(b => b.nama.toLowerCase().includes(search.toLowerCase()) || b.sku.toLowerCase().includes(search.toLowerCase()));

  // Filter usage logs from auditLog
  const usageLogs = auditLog.filter(log =>
    (log.aksi || '').toLowerCase().includes('kemasan') ||
    (log.detail || '').toLowerCase().includes('pemakaian')
  );

  const canUse = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  return (
    <div className="tab-pane active">
      <div className="toolbar" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={22} style={{ color: 'var(--amber)' }} /> Pemakaian Bahan Kemasan
          </h2>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Kelola &amp; catat pemakaian Casing Sosis, Plastik Vacuum, Standing Pouch, Label Expired, dan Box Karton.
          </p>
        </div>

        {canUse && (
          <button className="btn btn-amber" onClick={() => setIsModalOpen(true)}>
            <MinusCircle size={16} /> Catat Pemakaian Kemasan
          </button>
        )}
      </div>

      {/* Grid of Packaging Materials Stock */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {displayMaterials.slice(0, 4).map(b => (
          <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <span className="badge badge-amber">{b.kategori || 'Bahan Kemasan'}</span>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.4rem', marginBottom: '0.2rem' }}>{b.nama}</h4>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>SKU: {b.sku}</span>
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: b.stok <= b.minStok ? 'var(--rose)' : 'var(--emerald)' }}>
                {formatNumber(b.stok)}
              </span>
              <span className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{b.satuan}</span>
            </div>
            {canUse && (
              <button
                className="btn btn-outline btn-sm mt-3"
                style={{ width: '100%' }}
                onClick={() => { setSelectedBahanForModal(b); setIsModalOpen(true); }}
              >
                <MinusCircle size={14} /> Catat Pemakaian
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Main Table for Packaging Material Stock */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Inventaris Persediaan Bahan Kemasan</h3>
          <div className="search-box" style={{ maxWidth: '280px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control search-input"
              placeholder="Cari SKU atau Nama Kemasan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>NAMA BAHAN KEMASAN</th>
              <th>KATEGORI</th>
              <th>STOK SAAT INI</th>
              <th>MIN. STOK</th>
              <th>STATUS</th>
              {canUse && <th style={{ textAlign: 'center' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {displayMaterials.length === 0 ? (
              <tr>
                <td colSpan={canUse ? 7 : 6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Belum ada bahan kemasan terdaftar. Silakan tambahkan bahan baku baru dengan kategori "Bahan Kemasan".
                </td>
              </tr>
            ) : (
              displayMaterials.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 700, color: 'var(--amber)' }}>{b.sku}</td>
                  <td style={{ fontWeight: 600 }}>{b.nama}</td>
                  <td><span className="badge badge-amber">{b.kategori}</span></td>
                  <td>
                    <strong style={{ fontSize: '1.05rem', color: b.stok <= b.minStok ? 'var(--rose)' : 'var(--emerald)' }}>
                      {formatNumber(b.stok)} {b.satuan}
                    </strong>
                  </td>
                  <td>{b.minStok} {b.satuan}</td>
                  <td>
                    {b.stok === 0 ? (
                      <span className="badge badge-rose">Habis (Restock!)</span>
                    ) : b.stok <= b.minStok ? (
                      <span className="badge badge-amber">Menipis</span>
                    ) : (
                      <span className="badge badge-emerald">Aman</span>
                    )}
                  </td>
                  {canUse && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => { setSelectedBahanForModal(b); setIsModalOpen(true); }}
                      >
                        <MinusCircle size={14} /> Pemakaian
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Pemakaian Kemasan */}
      <ModalPemakaianKemasan
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUseKemasan={onUseKemasan}
        bahanList={bahanBaku}
        showAlert={showAlert}
      />
    </div>
  );
}
