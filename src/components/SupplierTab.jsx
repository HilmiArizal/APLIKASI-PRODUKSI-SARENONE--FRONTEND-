import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit3, Trash2, Search, Phone, MapPin, FileText, CheckCircle, Store, X, Tag } from 'lucide-react';

export default function SupplierTab({
  suppliersList = [],
  activeRoleView,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [alamat, setAlamat] = useState('');
  const [catatan, setCatatan] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = (activeRoleView === 'ADMIN');

  useEffect(() => {
    if (!editingId) {
      const nextNum = suppliersList.length + 1;
      setKode('S' + nextNum);
    }
  }, [suppliersList.length, editingId]);

  const filteredList = suppliersList.filter(s => {
    const q = search.toLowerCase();
    return (s.kode || '').toLowerCase().includes(q) ||
           (s.nama || '').toLowerCase().includes(q) ||
           (s.kontak || '').toLowerCase().includes(q) ||
           (s.alamat || '').toLowerCase().includes(q) ||
           (s.catatan || '').toLowerCase().includes(q);
  });

  const resetForm = () => {
    const nextNum = suppliersList.length + 1;
    setKode('S' + nextNum);
    setNama('');
    setKontak('');
    setAlamat('');
    setCatatan('');
    setEditingId(null);
    setIsSubmitting(false);
  };

  const handleEditClick = (s) => {
    setEditingId(s.id || s._id);
    setKode(s.kode || '');
    setNama(s.nama || '');
    setKontak(s.kontak || '');
    setAlamat(s.alamat || '');
    setCatatan(s.catatan || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim()) {
      if (showAlert) showAlert('Nama supplier wajib diisi.', 'error', 'Validasi Gagal');
      return;
    }

    const cleanKode = (kode || '').trim().toUpperCase() || ('S' + (suppliersList.length + 1));

    setIsSubmitting(true);
    if (editingId) {
      await onUpdateSupplier(editingId, { kode: cleanKode, nama: nama.trim(), kontak, alamat, catatan });
    } else {
      await onCreateSupplier({ kode: cleanKode, nama: nama.trim(), kontak, alamat, catatan });
    }
    setIsSubmitting(false);
    resetForm();
  };

  const handleDelete = (s) => {
    if (showAlert) {
      showAlert(
        `Hapus supplier [${s.kode || 'SUP'}] "${s.nama}" dari master data?`,
        'danger',
        'Hapus Supplier',
        () => onDeleteSupplier(s.id || s._id),
        true,
        'Hapus',
        'Batal'
      );
    } else {
      onDeleteSupplier(s.id || s._id);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="tab-pane active" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3 className="text-rose">🔒 Akses Dibatasi</h3>
        <p className="text-muted">Menu Kelola Master Data Supplier hanya dapat diakses oleh Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      {/* Input / Edit Form Card */}
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: editingId ? '4px solid #0284c7' : '4px solid #10b981', borderRadius: '10px', padding: '0.65rem 0.85rem', marginBottom: '0.75rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: editingId ? '#0284c7' : '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {editingId ? <Edit3 size={16} /> : <Plus size={16} />}
            {editingId ? `Edit Supplier [${kode}]: "${nama}"` : 'Form Tambah Supplier Baru'}
          </h3>
          {editingId && (
            <button type="button" className="btn btn-outline btn-sm" onClick={resetForm} style={{ height: '24px', fontSize: '0.68rem', fontWeight: 700, padding: '0 0.45rem', borderRadius: '5px' }}>
              <X size={12} /> Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Kode Supplier / Vendor *</label>
              <input
                type="text"
                className="form-control"
                placeholder="S1"
                value={kode}
                onChange={e => setKode(e.target.value)}
                required
                style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, color: '#0369a1', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '0 0.6rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Nama Perusahaan / Supplier *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Misal: PT Marksoy Indonesia"
                value={nama}
                onChange={e => setNama(e.target.value)}
                required
                style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.6rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>No HP Sales / Kontak</label>
              <input
                type="text"
                className="form-control"
                placeholder="0812-xxxx-xxxx"
                value={kontak}
                onChange={e => setKontak(e.target.value)}
                style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.6rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Alamat Kota / Wilayah</label>
              <input
                type="text"
                className="form-control"
                placeholder="Jakarta / Bandung"
                value={alamat}
                onChange={e => setAlamat(e.target.value)}
                style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.6rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'flex-end', marginTop: '0.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Catatan / Keterangan</label>
              <input
                type="text"
                className="form-control"
                placeholder="Misal: Pemasok tepung ISP &amp; Marksoy"
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.6rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.75rem' }}>
                  Batal
                </button>
              )}
              <button
                type="submit"
                className={`btn ${editingId ? 'btn-cyan' : 'btn-emerald'}`}
                style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.85rem', borderRadius: '6px', boxShadow: editingId ? '0 3px 10px rgba(14, 165, 233, 0.3)' : '0 3px 10px rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : (editingId ? 'Simpan Edit' : '+ Simpan Supplier Baru')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Supplier List Table Card */}
      <div className="table-container" style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Daftar Supplier Terdaftar ({filteredList.length})</h3>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Master data supplier beserta Kode unik dalam dropdown pencatatan pembelian.</span>
          </div>

          <div className="search-box" style={{ height: '32px', maxWidth: '280px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Cari Kode, Supplier, Kota..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: '0.78rem' }}
            />
          </div>
        </div>

        <table className="custom-table" style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>KODE</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>NAMA SUPPLIER / VENDOR</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>KONTAK SALES</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>ALAMAT KOTA</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>CATATAN PRODUK</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'center', whiteSpace: 'nowrap' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Belum ada data supplier. Silakan masukkan supplier pertama Anda via form di atas (Dimulai dari Kode S1).
                </td>
              </tr>
            ) : (
              filteredList.map(s => (
                <tr key={s.id || s._id || s.nama} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px', display: 'inline-block' }}>
                      {s.kode || 'SUP'}
                    </span>
                  </td>
                  <td style={{ padding: '0.32rem 0.55rem', fontWeight: 800, color: '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                    {s.nama}
                  </td>
                  <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', color: '#0f172a', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Phone size={12} style={{ color: '#10b981' }} />
                      {s.kontak || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', color: '#0f172a', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} style={{ color: '#f59e0b' }} />
                      {s.alamat || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {s.catatan || '-'}
                  </td>
                  <td style={{ padding: '0.32rem 0.55rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                      <button
                        type="button"
                        style={{
                          background: '#f0f9ff',
                          color: '#0284c7',
                          border: '1px solid #bae6fd',
                          borderRadius: '5px',
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          padding: '0 0.45rem',
                          height: '24px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="Edit Supplier"
                        onClick={() => handleEditClick(s)}
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        style={{
                          background: '#fef2f2',
                          color: '#ef4444',
                          border: '1px solid #fecaca',
                          borderRadius: '5px',
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          padding: '0 0.45rem',
                          height: '24px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="Hapus Supplier"
                        onClick={() => handleDelete(s)}
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
