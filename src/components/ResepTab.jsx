import React, { useState } from 'react';
import { Plus, Trash2, BookOpen, Edit3, Upload, FileSpreadsheet, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const sortedProduk = [...produk].sort((a, b) => (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' }));
  const [selectedProdukId, setSelectedProdukId] = useState(sortedProduk[0]?.id || '');
  const canEdit = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  const filteredProduk = sortedProduk.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (p.sku && p.sku.toLowerCase().includes(q)) || (p.nama && p.nama.toLowerCase().includes(q));
  });

  const getRecipeForProduk = (p) => {
    if (!p || !resep) return [];
    if (resep[p.id]) return resep[p.id];
    if (p.sku && resep[p.sku]) return resep[p.sku];
    if (p._id && resep[p._id]) return resep[p._id];

    const pId = String(p.id || '').trim().toLowerCase();
    const pSku = String(p.sku || '').trim().toLowerCase();
    const pMongoId = String(p._id || '').trim().toLowerCase();

    for (let key of Object.keys(resep)) {
      const k = key.trim().toLowerCase();
      if (k && (k === pId || k === pSku || k === pMongoId)) {
        return resep[key] || [];
      }
    }
    return [];
  };

  const getBahanItem = (bId) => {
    if (!bId) return null;
    const s = String(bId).trim().toLowerCase();
    return bahanBaku.find(x =>
      String(x.id || '').trim().toLowerCase() === s ||
      String(x.sku || '').trim().toLowerCase() === s ||
      String(x._id || '').trim().toLowerCase() === s ||
      String(x.nama || '').trim().toLowerCase() === s
    );
  };

  const selectedProduk = sortedProduk.find(p => p.id === selectedProdukId) || sortedProduk[0];
  const currentFormula = selectedProduk ? getRecipeForProduk(selectedProduk) : [];
  const sortedFormula = [...currentFormula].sort((a, b) => {
    const bA = getBahanItem(a.bahanId);
    const bB = getBahanItem(b.bahanId);
    return (bA?.sku || '').localeCompare(bB?.sku || '', undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '0.75rem', alignItems: 'start' }}>
        {/* Left Side: Select Product SKU List */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
          {/* Search Input Box */}
          <div className="search-box mb-2" style={{ height: '32px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Cari SKU / Nama Produk..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.78rem' }}
            />
          </div>

          {/* Scrollable Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.2rem' }}>
            {filteredProduk.length === 0 ? (
              <div style={{ padding: '1.25rem 0.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                Produk tidak ditemukan.
              </div>
            ) : (
              filteredProduk.map(p => {
                const isSelected = p.id === (selectedProduk?.id);
                const itemsCount = getRecipeForProduk(p).length;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProdukId(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #7dd3fc' : '1px solid #f1f5f9',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      color: isSelected ? '#0284c7' : '#0f172a',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: isSelected ? '#0369a1' : '#64748b' }}>{p.sku}</div>
                      <div style={{ fontWeight: 800, fontSize: '0.78rem', color: isSelected ? '#0f172a' : '#334155' }}>{p.nama}</div>
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: isSelected ? '#e0f2fe' : '#f8fafc',
                      color: isSelected ? '#0284c7' : '#64748b',
                      border: isSelected ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                      whiteSpace: 'nowrap'
                    }}>
                      {itemsCount} Bahan
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Recipe BOM Details */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.85rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
          {selectedProduk ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px' }}>
                    {selectedProduk.sku}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0 0 0' }}>Formulasi Resep (BOM): {selectedProduk.nama}</h3>
                  <p style={{ fontSize: '0.74rem', color: '#64748b', margin: 0 }}>Kebutuhan takaran bahan baku presisi per 1 batch.</p>
                </div>

                {canEdit && (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => setIsImportExcelOpen(true)} title="Import Formulasi Resep (BOM) Masal dari File Excel" style={{ fontSize: '0.75rem', height: '32px', fontWeight: 800 }}>
                      <Upload size={14} style={{ color: 'var(--amber)' }} /> Import Resep (BOM)
                    </button>
                    <button className="btn btn-sm btn-emerald" onClick={() => onOpenTambahResepItem(selectedProduk.id)} style={{ fontSize: '0.78rem', height: '32px', fontWeight: 800, padding: '0 0.75rem', borderRadius: '6px', boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Plus size={14} /> + Tambah Takaran Bahan
                    </button>
                  </div>
                )}
              </div>

              {/* Table Ingredients */}
              <div className="table-container" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <table className="custom-table" style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'center', width: '35px', whiteSpace: 'nowrap' }}>NO</th>
                      <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>NAMA BAHAN BAKU</th>
                      <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>TAKARAN PER 1 BATCH</th>
                      {canEdit && <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFormula.length === 0 ? (
                      <tr>
                        <td colSpan={canEdit ? 4 : 3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                          Belum ada formula resep bahan baku untuk produk ini.
                        </td>
                      </tr>
                    ) : (
                      sortedFormula.map((item, idx) => {
                        const b = getBahanItem(item.bahanId);
                        const displayTakaran = Number(Math.round(parseFloat(item.takaran || 0) + 'e6') + 'e-6');

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.32rem 0.55rem', textAlign: 'center', color: '#64748b', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{idx + 1}</td>
                            <td style={{ padding: '0.32rem 0.55rem', fontWeight: 800, color: '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>{b ? b.nama : 'Bahan tidak ditemukan'}</td>
                            <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                              <strong style={{ color: '#0284c7', fontWeight: 900 }}>{displayTakaran}</strong> <span style={{ color: '#64748b', fontWeight: 600 }}>{b?.satuan || 'satuan'}</span>
                            </td>
                            {canEdit && (
                              <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    style={{
                                      background: '#f0f9ff',
                                      color: '#0284c7',
                                      border: '1px solid #bae6fd',
                                      borderRadius: '5px',
                                      width: '24px',
                                      height: '24px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onClick={() => onOpenEditResepItem(selectedProduk.id, item)}
                                    title="Edit Takaran Resep"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    style={{
                                      background: '#fef2f2',
                                      color: '#ef4444',
                                      border: '1px solid #fecaca',
                                      borderRadius: '5px',
                                      width: '24px',
                                      height: '24px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onClick={() => onDeleteResepItem(selectedProduk.id, idx)}
                                    title="Hapus Takaran Resep"
                                  >
                                    <Trash2 size={12} />
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
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.85rem' }}>
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
