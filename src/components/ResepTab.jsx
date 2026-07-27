import React, { useState } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { formatNumber } from '../data/initialData';

export default function ResepTab({
  produk,
  bahanBaku,
  resep,
  activeRoleView,
  onOpenTambahResepItem,
  onDeleteResepItem
}) {
  const [selectedProdukId, setSelectedProdukId] = useState(produk[0]?.id || '');
  const canEdit = (activeRoleView === 'ADMIN' || activeRoleView === 'PRODUK' || activeRoleView === 'BAHAN_BAKU');

  const selectedProduk = produk.find(p => p.id === selectedProdukId) || produk[0];
  const currentFormula = selectedProduk ? (resep[selectedProduk.id] || []) : [];

  // Estimate Production Cost
  const estimasiModalPerPcs = currentFormula.reduce((acc, item) => {
    const b = bahanBaku.find(x => x.id === item.bahanId);
    if (!b) return acc;
    return acc + (b.harga * item.takaran);
  }, 0);

  return (
    <div className="tab-pane active">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
        {/* Left Side: Select Product */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} style={{ color: 'var(--primary)' }} /> Pilih Produk Jadi
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {produk.map(p => {
              const isSelected = p.id === (selectedProduk?.id);
              const itemsCount = (resep[p.id] || []).length;

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProdukId(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>{p.sku}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.nama}</div>
                  </div>
                  <span className="badge badge-amber">{itemsCount} Bahan</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Recipe BOM Details */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          {selectedProduk ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                  <span className="badge badge-cyan">{selectedProduk.sku}</span>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.25rem' }}>Formulasi Resep (BOM): {selectedProduk.nama}</h3>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>Kebutuhan takaran bahan baku presisi per 1 pcs produksi roti.</p>
                </div>

                {canEdit && (
                  <button className="btn btn-primary" onClick={() => onOpenTambahResepItem(selectedProduk.id)}>
                    <Plus size={16} /> Tambah Takaran Bahan
                  </button>
                )}
              </div>

              {/* Cost Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Harga Jual Produk</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--emerald)' }}>Rp {formatNumber(selectedProduk.harga)}</div>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Est. Modal Bahan (HPP)</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--amber)' }}>Rp {formatNumber(Math.round(estimasiModalPerPcs))}</div>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Est. Margin Kotor</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cyan)' }}>
                    Rp {formatNumber(Math.max(0, selectedProduk.harga - Math.round(estimasiModalPerPcs)))}
                  </div>
                </div>
              </div>

              {/* Table Ingredients */}
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>NO</th>
                    <th>NAMA BAHAN BAKU</th>
                    <th>TAKARAN PER 1 PCS</th>
                    <th>HARGA SATUAN BAHAN</th>
                    <th>EST. HPP (RP)</th>
                    {canEdit && <th style={{ textAlign: 'right' }}>AKSI</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentFormula.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                        Belum ada formula resep bahan baku untuk produk ini.
                      </td>
                    </tr>
                  ) : (
                    currentFormula.map((item, idx) => {
                      const b = bahanBaku.find(x => x.id === item.bahanId);
                      const cost = b ? (b.harga * item.takaran) : 0;

                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{b ? b.nama : 'Bahan tidak ditemukan'}</td>
                          <td>
                            <strong style={{ color: 'var(--primary)' }}>{item.takaran}</strong> {b?.satuan || 'satuan'}
                          </td>
                          <td className="text-muted">Rp {b ? formatNumber(b.harga) : 0} / {b?.satuan}</td>
                          <td style={{ fontWeight: 700, color: 'var(--amber)' }}>Rp {formatNumber(Math.round(cost))}</td>
                          {canEdit && (
                            <td style={{ textAlign: 'right' }}>
                              <button className="btn btn-sm btn-outline btn-danger" onClick={() => onDeleteResepItem(selectedProduk.id, idx)}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }} className="text-muted">
              Pilih produk di sebelah kiri untuk mengonfigurasi resep BOM.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
