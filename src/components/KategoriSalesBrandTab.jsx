import React, { useState, useMemo } from 'react';
import { Tag, Plus, Edit3, Trash2, Check, Search, X } from 'lucide-react';

export default function KategoriSalesBrandTab({
  brandList = [],
  activeRoleView,
  onCreateBrand,
  onUpdateBrand,
  onDeleteBrand,
  showAlert
}) {
  // Brand state
  const [searchBrand, setSearchBrand] = useState('');
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editBrandData, setEditBrandData] = useState(null);
  const [brandForm, setBrandForm] = useState({ nama: '', deskripsi: '' });

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'TIM_MARKETING', 'SALES', 'ADMIN'].includes(activeRoleView);

  // Safe normalized brand list
  const safeBrandList = useMemo(() => {
    if (!Array.isArray(brandList)) return [];
    return brandList
      .filter(Boolean)
      .map(b => typeof b === 'string' ? { id: b, nama: b, deskripsi: 'Daging olahan makanan beku' } : b)
      .filter(b => b && b.nama && !['Saren Bakery', 'Saren Frozen', 'Dapur Saren', 'Saren One Original'].includes(b.nama));
  }, [brandList]);

  // Filtered list
  const filteredBrand = useMemo(() => {
    const q = (searchBrand || '').toLowerCase();
    return safeBrandList.filter(b => {
      if (!b || !b.nama) return false;
      if (!q) return true;
      return b.nama.toLowerCase().includes(q) || (b.deskripsi && b.deskripsi.toLowerCase().includes(q));
    });
  }, [safeBrandList, searchBrand]);

  // Handlers Brand
  const openAddBrand = () => {
    setEditBrandData(null);
    setBrandForm({ nama: '', deskripsi: 'Daging olahan makanan beku' });
    setShowBrandModal(true);
  };

  const openEditBrand = (b) => {
    setEditBrandData(b);
    setBrandForm({ nama: b?.nama || '', deskripsi: b?.deskripsi || '' });
    setShowBrandModal(true);
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!brandForm.nama.trim()) { if (showAlert) showAlert('Nama brand wajib diisi!', 'error'); return; }

    if (editBrandData && onUpdateBrand) {
      await onUpdateBrand(editBrandData.id || editBrandData._id, brandForm);
    } else if (onCreateBrand) {
      await onCreateBrand(brandForm);
    }
    setShowBrandModal(false);
  };

  const handleDeleteBrand = async (b) => {
    if (!confirm(`Hapus brand "${b?.nama}"?`)) return;
    if (onDeleteBrand) await onDeleteBrand(b.id || b._id);
  };

  return (
    <div className="tab-container" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* TOOLBAR & SEARCH CARD */}
      <div style={{
        background: '#ffffff',
        padding: '0.65rem 0.85rem',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        marginBottom: '1rem',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <div className="search-box" style={{ flex: 1, minWidth: '240px', height: '36px' }}>
          <Search size={15} />
          <input
            placeholder="Cari nama brand / merek..."
            value={searchBrand}
            onChange={e => setSearchBrand(e.target.value)}
            style={{ fontSize: '0.8rem' }}
          />
        </div>

        {canEdit && (
          <button
            className="btn btn-emerald"
            onClick={openAddBrand}
            style={{
              height: '36px',
              fontSize: '0.78rem',
              fontWeight: 800,
              padding: '0 0.95rem',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Plus size={15} /> + Tambah Brand Produk
          </button>
        )}
      </div>

      {/* BRAND TABLE */}
      <div className="table-responsive" style={{ borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <table className="custom-table" style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap', width: '50px' }}>No</th>
              <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>NAMA BRAND / MERK PRODUK</th>
              <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>DESKRIPSI &amp; KETERANGAN</th>
              {canEdit && <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filteredBrand.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 4 : 3} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 600 }}>
                  Belum ada data brand. Klik "+ Tambah Brand Produk" untuk menambahkan.
                </td>
              </tr>
            ) : (
              filteredBrand.map((b, i) => (
                <tr key={b.id || b._id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.45rem 0.65rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{i + 1}</td>
                  <td style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontSize: '0.78rem', fontWeight: 800, padding: '0.12rem 0.55rem', borderRadius: '5px' }}>
                      🏷️ {b.nama}
                    </span>
                  </td>
                  <td style={{ padding: '0.45rem 0.65rem', color: '#475569', whiteSpace: 'nowrap' }}>{b.deskripsi || '-'}</td>
                  {canEdit && (
                    <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => openEditBrand(b)}
                          title="Edit Brand"
                          style={{ height: '28px', fontSize: '0.72rem', padding: '0 0.55rem', borderRadius: '6px', fontWeight: 700 }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteBrand(b)}
                          title="Hapus Brand"
                          style={{ height: '28px', fontSize: '0.72rem', padding: '0 0.55rem', borderRadius: '6px', fontWeight: 700 }}
                        >
                          <Trash2 size={13} /> Hapus
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL BRAND FORM */}
      {showBrandModal && (
        <div className="modal-overlay" onClick={() => setShowBrandModal(false)}>
          <div className="modal-card modal-sm" onClick={e => e.stopPropagation()} style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '0.85rem 1.15rem', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tag size={18} style={{ color: '#d97706' }} /> {editBrandData ? 'Edit Brand Merek' : 'Tambah Brand Merek'}
              </h3>
              <button className="modal-close" onClick={() => setShowBrandModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveBrand}>
              <div className="modal-body" style={{ padding: '1.15rem', background: '#ffffff' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Nama Brand Merek *</label>
                  <input className="form-input" placeholder="Contoh: SAREN ONE, EAT GOW, BEULEUM..." value={brandForm.nama} onChange={e => setBrandForm(f => ({ ...f, nama: e.target.value }))} required style={{ fontSize: '0.85rem' }} />
                </div>
                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Deskripsi Brand</label>
                  <textarea className="form-input" rows={3} placeholder="Daging olahan makanan beku..." value={brandForm.deskripsi} onChange={e => setBrandForm(f => ({ ...f, deskripsi: e.target.value }))} style={{ fontSize: '0.85rem' }} />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '0.75rem 1.15rem', background: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBrandModal(false)}>Batal</button>
                <button type="submit" className="btn btn-emerald"><Check size={16} /> {editBrandData ? 'Simpan Edit' : 'Tambah Brand'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
