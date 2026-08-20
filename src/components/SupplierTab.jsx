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
    <div className="tab-pane active" style={{ paddingTop: '0.5rem' }}>
      {/* Header Banner */}
      {/* <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Building2 size={22} style={{ color: 'var(--amber)' }} /> Master Data Supplier &amp; Vendor
            </h2>
            <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.25rem', marginBottom: 0 }}>
              Kelola kode supplier dan daftar perusahaan pemasok bahan baku, kemasan, dan bumbu (Akses Khusus Super Admin).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: 'var(--bg-darker)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store size={16} style={{ color: 'var(--amber)' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{suppliersList.length} Vendor Terdaftar</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Input / Edit Form Card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: editingId ? '4px solid var(--cyan)' : '4px solid var(--emerald)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: editingId ? 'var(--cyan)' : 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
            {editingId ? `Edit Supplier [${kode}]: "${nama}"` : 'Form Tambah Supplier Baru'}
          </h3>
          {editingId && (
            <button className="btn btn-outline btn-sm" onClick={resetForm}>
              <X size={14} /> Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Kode Supplier / Vendor *</label>
              <input
                type="text"
                className="form-control"
                placeholder="S1"
                value={kode}
                onChange={e => setKode(e.target.value)}
                required
                style={{ fontWeight: 800, color: 'var(--cyan)', letterSpacing: '0.5px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nama Perusahaan / Supplier *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Misal: PT Marksoy Indonesia"
                value={nama}
                onChange={e => setNama(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>No HP Sales / Kontak</label>
              <input
                type="text"
                className="form-control"
                placeholder="0812-xxxx-xxxx"
                value={kontak}
                onChange={e => setKontak(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Alamat Kota / Wilayah</label>
              <input
                type="text"
                className="form-control"
                placeholder="Jakarta / Bandung"
                value={alamat}
                onChange={e => setAlamat(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end', marginTop: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Catatan / Keterangan</label>
              <input
                type="text"
                className="form-control"
                placeholder="Misal: Pemasok tepung ISP &amp; Marksoy"
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Batal
                </button>
              )}
              <button
                type="submit"
                className={`btn ${editingId ? 'btn-cyan' : 'btn-emerald'}`}
                style={{ padding: '0.55rem 1.5rem', fontWeight: 700 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : (editingId ? 'Simpan Edit' : '+ Simpan Supplier Baru')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Supplier List Table Card */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Daftar Supplier Terdaftar ({filteredList.length})</h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Master data supplier beserta Kode unik dalam dropdown pencatatan pembelian.</span>
          </div>

          <div className="search-box" style={{ maxWidth: '280px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari Kode, Supplier, Kota..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>KODE</th>
              <th>NAMA SUPPLIER / VENDOR</th>
              <th>KONTAK SALES</th>
              <th>ALAMAT KOTA</th>
              <th>CATATAN PRODUK</th>
              <th style={{ textAlign: 'center' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">
                  Belum ada data supplier. Silakan masukkan supplier pertama Anda via form di atas (Dimulai dari Kode S1).
                </td>
              </tr>
            ) : (
              filteredList.map(s => (
                <tr key={s.id || s._id || s.nama}>
                  <td>
                    <span className="badge badge-cyan" style={{ fontWeight: 800 }}>{s.kode || 'SUP'}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: '#1f2d3d', fontSize: '0.95rem' }}>{s.nama}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Phone size={14} style={{ color: 'var(--emerald)' }} />
                      {s.kontak || '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={14} style={{ color: 'var(--amber)' }} />
                      {s.alamat || '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.78rem' }} className="text-muted">{s.catatan || '-'}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                      <button className="btn btn-sm btn-outline" title="Edit Supplier" onClick={() => handleEditClick(s)}>
                        <Edit3 size={14} /> Edit
                      </button>
                      <button className="btn btn-sm btn-outline btn-danger" title="Hapus Supplier" onClick={() => handleDelete(s)}>
                        <Trash2 size={14} /> Hapus
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
