import React, { useState } from 'react';
import { Building2, Plus, Edit3, Trash2, Search, Phone, MapPin, FileText, CheckCircle, Store } from 'lucide-react';

export default function SupplierTab({
  suppliersList = [],
  activeRoleView,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [alamat, setAlamat] = useState('');
  const [catatan, setCatatan] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = (activeRoleView === 'ADMIN');

  const filteredList = suppliersList.filter(s => {
    const q = search.toLowerCase();
    return (s.nama || '').toLowerCase().includes(q) ||
           (s.kontak || '').toLowerCase().includes(q) ||
           (s.alamat || '').toLowerCase().includes(q) ||
           (s.catatan || '').toLowerCase().includes(q);
  });

  const resetForm = () => {
    setNama('');
    setKontak('');
    setAlamat('');
    setCatatan('');
    setEditingId(null);
    setIsSubmitting(false);
  };

  const handleEditClick = (s) => {
    setEditingId(s.id || s._id);
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

    setIsSubmitting(true);
    if (editingId) {
      await onUpdateSupplier(editingId, { nama: nama.trim(), kontak, alamat, catatan });
    } else {
      await onCreateSupplier({ nama: nama.trim(), kontak, alamat, catatan });
    }
    setIsSubmitting(false);
    resetForm();
  };

  const handleDelete = (s) => {
    if (showAlert) {
      showAlert(
        `Hapus supplier "${s.nama}" dari master data?`,
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
    <div className="tab-pane active">
      {/* Header */}
      <div className="toolbar" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={22} style={{ color: 'var(--amber)' }} /> Master Data Supplier &amp; Vendor
          </h2>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Kelola daftar nama perusahaan pemasok bahan baku, kemasan, dan bumbu dapur (Akses Khusus Super Admin).
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--amber)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Total Supplier Terdaftar</span>
            <Store size={18} style={{ color: 'var(--amber)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--amber)', marginTop: '0.5rem' }}>
            {suppliersList.length} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Vendor</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tersedia untuk opsi pencatatan utang</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--emerald)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Status Master Data</span>
            <CheckCircle size={18} style={{ color: 'var(--emerald)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)', marginTop: '0.5rem' }}>
            AKTIF
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sinkronisasi ke MongoDB &amp; JSON</span>
        </div>
      </div>

      {/* Grid Layout: Form Left/Top + Table Right/Bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form Container */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: editingId ? 'var(--cyan)' : 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
            {editingId ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nama Perusahaan / Supplier *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Misal: PT Marksoy Indonesia"
                value={nama}
                onChange={e => setNama(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>No HP Sales / Kontak</label>
              <input
                type="text"
                className="form-control"
                placeholder="0812-xxxx-xxxx"
                value={kontak}
                onChange={e => setKontak(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Alamat Kota / Wilayah</label>
              <input
                type="text"
                className="form-control"
                placeholder="Jakarta / Bandung"
                value={alamat}
                onChange={e => setAlamat(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Catatan / Keterangan</label>
              <input
                type="text"
                className="form-control"
                placeholder="Misal: Pemasok tepung ISP"
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              {editingId && (
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={resetForm}>
                  Batal
                </button>
              )}
              <button
                type="submit"
                className={`btn ${editingId ? 'btn-cyan' : 'btn-emerald'}`}
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : (editingId ? 'Simpan Edit' : '+ Tambah Supplier')}
              </button>
            </div>
          </form>
        </div>

        {/* Table Container */}
        <div className="table-container">
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Daftar Supplier ({suppliersList.length})</h3>
              <span className="text-muted" style={{ fontSize: '0.78rem' }}>Master data supplier yang tersedia di dropdown pembelian.</span>
            </div>

            <div className="search-box" style={{ maxWidth: '260px' }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Cari Supplier..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>NAMA SUPPLIER</th>
                <th>KONTAK</th>
                <th>ALAMAT</th>
                <th>CATATAN</th>
                <th style={{ textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">
                    Tidak ada supplier yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map(s => (
                  <tr key={s.id || s._id || s.nama}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{s.nama}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Phone size={13} style={{ color: 'var(--emerald)' }} />
                        {s.kontak || '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={13} style={{ color: 'var(--amber)' }} />
                        {s.alamat || '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.78rem' }} className="text-muted">{s.catatan || '-'}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="btn-group">
                        <button className="btn btn-sm btn-outline" title="Edit Supplier" onClick={() => handleEditClick(s)}>
                          <Edit3 size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline btn-danger" title="Hapus Supplier" onClick={() => handleDelete(s)}>
                          <Trash2 size={14} />
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
    </div>
  );
}
