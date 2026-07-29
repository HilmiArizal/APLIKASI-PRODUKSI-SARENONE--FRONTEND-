import React, { useState } from 'react';
import { Plus, Trash2, BookOpen, Edit3, Upload, FileSpreadsheet } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalImportResepExcel } from './Modals';

export default function ResepTab({
  produk,
  bahanBaku,
  resep,
  activeRoleView,
  onOpenTambahResepItem,
  onOpenEditResepItem,
  onDeleteResepItem,
  onImportExcelResep,
  showAlert
}) {
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);
  const sortedProduk = [...produk].sort((a, b) => (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' }));
  const [selectedProdukId, setSelectedProdukId] = useState(sortedProduk[0]?.id || '');
  const canEdit = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  const selectedProduk = sortedProduk.find(p => p.id === selectedProdukId) || sortedProduk[0];
  const currentFormula = selectedProduk ? (resep[selectedProduk.id] || []) : [];
  const sortedFormula = [...currentFormula].sort((a, b) => {
    const bA = bahanBaku.find(x => x.id === a.bahanId);
    const bB = bahanBaku.find(x => x.id === b.bahanId);
    return (bA?.sku || '').localeCompare(bB?.sku || '', undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="tab-pane active">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
        {/* Left Side: Select Product */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} style={{ color: 'var(--primary)' }} /> Pilih Produk Jadi
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sortedProduk.map(p => {
              const isSelected = p.id === (selectedProduk?.id);
              const itemsCount = (resep[p.id] || []).length;

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProdukId(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span className="badge badge-cyan">{selectedProduk.sku}</span>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.25rem' }}>Formulasi Resep (BOM): {selectedProduk.nama}</h3>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>Kebutuhan takaran bahan baku presisi per 1 batch.</p>
                </div>

                {canEdit && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline btn-amber" onClick={() => setIsImportExcelOpen(true)} title="Import Formulasi Resep (BOM) Masal dari File Excel">
                      <Upload size={16} style={{ color: 'var(--amber)' }} /> Import Resep (BOM)
                    </button>
                    <button className="btn btn-primary" onClick={() => onOpenTambahResepItem(selectedProduk.id)}>
                      <Plus size={16} /> Tambah Takaran Bahan
                    </button>
                  </div>
                )}
              </div>

              {/* Table Ingredients */}
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>NO</th>
                    <th>NAMA BAHAN BAKU</th>
                    <th>TAKARAN PER 1 BATCH</th>
                    {canEdit && <th style={{ textAlign: 'right' }}>AKSI</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedFormula.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 4 : 3} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                        Belum ada formula resep bahan baku untuk produk ini.
                      </td>
                    </tr>
                  ) : (
                    sortedFormula.map((item, idx) => {
                      const b = bahanBaku.find(x => x.id === item.bahanId);

                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{b ? b.nama : 'Bahan tidak ditemukan'}</td>
                          <td>
                            <strong style={{ color: 'var(--primary)' }}>{item.takaran}</strong> {b?.satuan || 'satuan'}
                          </td>
                          {canEdit && (
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-sm btn-outline" onClick={() => onOpenEditResepItem(selectedProduk.id, item)} title="Edit Takaran Resep">
                                  <Edit3 size={14} />
                                </button>
                                <button className="btn btn-sm btn-outline btn-danger" onClick={() => onDeleteResepItem(selectedProduk.id, idx)} title="Hapus Takaran Resep">
                                  <Trash2 size={14} />
                                </button>
                              </div>
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

      <ModalImportResepExcel
        isOpen={isImportExcelOpen}
        onClose={() => setIsImportExcelOpen(false)}
        onImport={onImportExcelResep}
        showAlert={showAlert}
      />
    </div>
  );
}
