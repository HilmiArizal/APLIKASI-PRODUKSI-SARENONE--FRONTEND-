import React, { useState, useMemo } from 'react';
import { Users, Plus, Search, Edit3, Trash2, Phone, MapPin, Tag, Check, X, Building2 } from 'lucide-react';

const TIPE_PELANGGAN = ['Retail', 'Reseller', 'Distributor', 'Agent', 'Outlet'];

export default function PelangganTab({
  pelangganList = [],
  activeRoleView,
  onCreatePelanggan,
  onUpdatePelanggan,
  onDeletePelanggan,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [tipeFilter, setTipeFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({
    nama: '',
    noHp: '',
    alamat: '',
    tipe: 'Retail',
    catatan: ''
  });

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'TIM_MARKETING'].includes(activeRoleView);

  const filtered = useMemo(() => {
    return pelangganList.filter(p => {
      const q = search.toLowerCase();
      const matchQ = !search || p.nama?.toLowerCase().includes(q) || p.noHp?.toLowerCase().includes(q) || p.alamat?.toLowerCase().includes(q);
      const matchT = !tipeFilter || p.tipe === tipeFilter;
      return matchQ && matchT;
    });
  }, [pelangganList, search, tipeFilter]);

  const openAdd = () => {
    setEditData(null);
    setForm({ nama: '', noHp: '', alamat: '', tipe: 'Retail', catatan: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditData(p);
    setForm({
      nama: p.nama || '',
      noHp: p.noHp || '',
      alamat: p.alamat || '',
      tipe: p.tipe || 'Retail',
      catatan: p.catatan || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim()) { if (showAlert) showAlert('Nama pelanggan wajib diisi!', 'error'); return; }

    if (editData && onUpdatePelanggan) {
      await onUpdatePelanggan(editData.id || editData._id, form);
    } else if (onCreatePelanggan) {
      await onCreatePelanggan(form);
    }
    setShowModal(false);
  };

  const handleDelete = async (p) => {
    if (!confirm(`Hapus pelanggan "${p.nama}"?`)) return;
    if (onDeletePelanggan) await onDeletePelanggan(p.id || p._id);
  };

  return (
    <div className="tab-container">
      {/* HEADER */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title"><Users size={24} /> Kelola Pelanggan / Customer</h2>
          <p className="tab-subtitle">Master data pelanggan, kontak WA/HP, alamat pengiriman, &amp; tipe kemitraan</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Tambah Pelanggan
          </button>
        )}
      </div>

      {/* STATS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}><Users size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Pelanggan</p><h3 className="stat-value">{pelangganList.length}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><Building2 size={20} /></div>
          <div className="stat-info"><p className="stat-label">Distributor &amp; Agen</p><h3 className="stat-value">{pelangganList.filter(p => ['Distributor', 'Agent'].includes(p.tipe)).length}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Tag size={20} /></div>
          <div className="stat-info"><p className="stat-label">Reseller Mitra</p><h3 className="stat-value">{pelangganList.filter(p => p.tipe === 'Reseller').length}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Users size={20} /></div>
          <div className="stat-info"><p className="stat-label">Konsumen Retail</p><h3 className="stat-value">{pelangganList.filter(p => p.tipe === 'Retail' || !p.tipe).length}</h3></div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Cari nama pelanggan, no HP, atau alamat..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select value={tipeFilter} onChange={e => setTipeFilter(e.target.value)} className="select-input" style={{ maxWidth: '170px' }}>
          <option value="">Semua Tipe</option>
          {TIPE_PELANGGAN.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* TABLE */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Pelanggan</th>
              <th>No. WhatsApp / HP</th>
              <th>Alamat Pengiriman</th>
              <th>Tipe Kemitraan</th>
              <th>Catatan</th>
              {canEdit && <th style={{ textAlign: 'right' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Belum ada data pelanggan. Klik "+ Tambah Pelanggan" untuk menambahkan.
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr key={p.id || p._id || i}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td><strong style={{ fontSize: '0.98rem', color: '#fff' }}>{p.nama}</strong></td>
                  <td>
                    {p.noHp ? (
                      <a href={`https://wa.me/${p.noHp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                        <Phone size={13} /> {p.noHp}
                      </a>
                    ) : '-'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {p.alamat ? <span><MapPin size={12} style={{ color: 'var(--cyan)' }} /> {p.alamat}</span> : '-'}
                  </td>
                  <td>
                    <span className="badge" style={{ background: p.tipe === 'Distributor' ? 'rgba(99,102,241,0.15)' : (p.tipe === 'Reseller' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'), color: p.tipe === 'Distributor' ? '#818cf8' : (p.tipe === 'Reseller' ? '#f59e0b' : '#10b981') }}>
                      {p.tipe || 'Retail'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{p.catatan || '-'}</td>
                  {canEdit && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)} title="Edit Pelanggan"><Edit3 size={14} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)} title="Hapus Pelanggan"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM PELANGGAN */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Users size={20} style={{ color: 'var(--accent-primary)' }} /> {editData ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Pelanggan / Toko / Outlet *</label>
                  <input className="form-input" placeholder="Contoh: Toko Berkah Frozen, Resto Sate..." value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">No. WhatsApp / HP</label>
                  <input className="form-input" placeholder="Contoh: 081234567890" value={form.noHp} onChange={e => setForm(f => ({ ...f, noHp: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">Tipe Kemitraan Pelanggan</label>
                  <select className="form-select" value={form.tipe} onChange={e => setForm(f => ({ ...f, tipe: e.target.value }))}>
                    {TIPE_PELANGGAN.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">Alamat Lengkap Pengiriman</label>
                  <textarea className="form-input" rows={2} placeholder="Jl. Raya Bandung No. 12..." value={form.alamat} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">Catatan Pelanggan</label>
                  <input className="form-input" placeholder="Catatan diskon khusus, jadwal kirim..." value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary"><Check size={16} /> {editData ? 'Simpan Edit' : 'Tambah Pelanggan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
