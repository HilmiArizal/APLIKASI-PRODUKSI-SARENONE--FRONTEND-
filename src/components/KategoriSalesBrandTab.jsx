import React, { useState } from 'react';
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

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'TIM_MARKETING'].includes(activeRoleView);

  // Filtered list
  const filteredBrand = brandList.filter(b => !searchBrand || b.nama?.toLowerCase().includes(searchBrand.toLowerCase()) || b.deskripsi?.toLowerCase().includes(searchBrand.toLowerCase()));

  // Handlers Brand
  const openAddBrand = () => {
    setEditBrandData(null);
    setBrandForm({ nama: '', deskripsi: 'Daging olahan makanan beku' });
    setShowBrandModal(true);
  };

  const openEditBrand = (b) => {
    setEditBrandData(b);
    setBrandForm({ nama: b.nama || '', deskripsi: b.deskripsi || '' });
    setShowBrandModal(true);
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!brandForm.nama.trim()) { showAlert('Nama brand wajib diisi!', 'error'); return; }

    if (editBrandData) {
      await onUpdateBrand(editBrandData.id || editBrandData._id, brandForm);
    } else {
      await onCreateBrand(brandForm);
    }
    setShowBrandModal(false);
  };

  const handleDeleteBrand = async (b) => {
    if (!confirm(`Hapus brand "${b.nama}"?`)) return;
    await onDeleteBrand(b.id || b._id);
  };

  return (
    <div className="tab-container">
      {/* HEADER */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title"><Tag size={24} /> Kelola Brand / Merk Produk</h2>
          <p className="tab-subtitle">Master data brand &amp; merk produk (SAREN ONE, EAT GOW, BEULEUM)</p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Cari nama brand / merek..." value={searchBrand} onChange={e => setSearchBrand(e.target.value)} />
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAddBrand}>
            <Plus size={16} /> Tambah Brand Produk
          </button>
        )}
      </div>

      {/* BRAND TABLE */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Brand / Merk</th>
              <th>Deskripsi &amp; Keterangan</th>
              {canEdit && <th style={{ textAlign: 'right' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filteredBrand.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 4 : 3} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  Belum ada data brand. Klik "+ Tambah Brand Produk" untuk menambahkan.
                </td>
              </tr>
            ) : (
              filteredBrand.map((b, i) => (
                <tr key={b.id || b._id || i}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td><strong style={{ color: '#f59e0b', fontSize: '0.95rem' }}>🏷️ {b.nama}</strong></td>
                  <td style={{ color: 'var(--text-muted)' }}>{b.deskripsi || '-'}</td>
                  {canEdit && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEditBrand(b)} title="Edit Brand"><Edit3 size={14} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteBrand(b)} title="Hapus Brand"><Trash2 size={14} /></button>
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
          <div className="modal-card modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Tag size={20} style={{ color: 'var(--amber)' }} /> {editBrandData ? 'Edit Brand Merek' : 'Tambah Brand Merek'}</h3>
              <button className="modal-close" onClick={() => setShowBrandModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveBrand}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Brand Merek *</label>
                  <input className="form-input" placeholder="Contoh: SAREN ONE, EAT GOW, BEULEUM..." value={brandForm.nama} onChange={e => setBrandForm(f => ({ ...f, nama: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">Deskripsi Brand</label>
                  <textarea className="form-input" rows={3} placeholder="Daging olahan makanan beku..." value={brandForm.deskripsi} onChange={e => setBrandForm(f => ({ ...f, deskripsi: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBrandModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary"><Check size={16} /> {editBrandData ? 'Simpan Edit' : 'Tambah Brand'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
