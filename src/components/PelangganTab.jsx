import React, { useState, useMemo } from 'react';
import { Users, Plus, Search, Edit3, Trash2, Phone, MapPin, Tag, Check, X, Building2, AlertTriangle, ShieldCheck, CreditCard, Star } from 'lucide-react';

const TIPE_PELANGGAN = ['Retail', 'Reseller', 'Distributor', 'Agent', 'Outlet'];
const KATEGORI_CUSTOMER = ['Top Market', 'Umum'];
const SISTEM_PEMBAYARAN = ['COD', 'CBD', 'Tempo'];

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

export default function PelangganTab({
  pelangganList = [],
  activeRoleView,
  onCreatePelanggan,
  onUpdatePelanggan,
  onDeletePelanggan,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [sistemBayarFilter, setSistemBayarFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({
    kode: '',
    nama: '',
    noHp: '',
    alamat: '',
    tipe: 'Retail',
    kategoriCustomer: 'Umum',
    sistemPembayaran: 'COD',
    totalPiutang: 0,
    catatan: ''
  });

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'TIM_MARKETING'].includes(activeRoleView);

  const filtered = useMemo(() => {
    return (pelangganList || []).filter(p => {
      if (!p) return false;
      const q = search.toLowerCase();
      const matchQ = !search || p.nama?.toLowerCase().includes(q) || p.kode?.toLowerCase().includes(q) || p.noHp?.toLowerCase().includes(q) || p.alamat?.toLowerCase().includes(q);
      const matchK = !kategoriFilter || p.kategoriCustomer === kategoriFilter;
      const matchS = !sistemBayarFilter || p.sistemPembayaran === sistemBayarFilter;
      return matchQ && matchK && matchS;
    });
  }, [pelangganList, search, kategoriFilter, sistemBayarFilter]);

  const openAdd = () => {
    setEditData(null);
    const nextCode = `C${(pelangganList || []).length + 1}`;
    setForm({
      kode: nextCode,
      nama: '',
      noHp: '',
      alamat: '',
      tipe: 'Retail',
      kategoriCustomer: 'Umum',
      sistemPembayaran: 'COD',
      totalPiutang: 0,
      catatan: ''
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditData(p);
    setForm({
      kode: p.kode || '',
      nama: p.nama || '',
      noHp: p.noHp || '',
      alamat: p.alamat || '',
      tipe: p.tipe || 'Retail',
      kategoriCustomer: p.kategoriCustomer || 'Umum',
      sistemPembayaran: p.sistemPembayaran || 'COD',
      totalPiutang: p.totalPiutang || 0,
      catatan: p.catatan || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      if (showAlert) showAlert('Nama pelanggan wajib diisi!', 'error', 'Peringatan');
      return;
    }

    if (editData && onUpdatePelanggan) {
      await onUpdatePelanggan(editData.id || editData._id, form);
    } else if (onCreatePelanggan) {
      await onCreatePelanggan(form);
    }
    setShowModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const targetName = deleteTarget.nama;
    const targetId = deleteTarget.id || deleteTarget._id;
    setDeleteTarget(null);

    if (onDeletePelanggan) {
      await onDeletePelanggan(targetId);
      if (showAlert) {
        showAlert(`Pelanggan "${targetName}" telah berhasil dihapus dari sistem! 🗑️`, 'info', 'Hapus Pelanggan');
      }
    }
  };

  return (
    <div className="tab-container">
      {/* HEADER */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title"><Users size={24} /> Kelola Pelanggan / Customer</h2>
          <p className="tab-subtitle">Master data pelanggan, Kode (C1, C2...), Kategori (Top Market vs Umum), Sistem Bayar (COD, CBD, Tempo)</p>
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
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Star size={20} /></div>
          <div className="stat-info"><p className="stat-label">Customer Top Market</p><h3 className="stat-value">{pelangganList.filter(p => p.kategoriCustomer === 'Top Market').length}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><CreditCard size={20} /></div>
          <div className="stat-info"><p className="stat-label">Sistem Tempo Kredit</p><h3 className="stat-value">{pelangganList.filter(p => p.sistemPembayaran === 'Tempo').length}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}><Building2 size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Piutang Aktif</p><h3 className="stat-value" style={{ fontSize: '1rem', color: '#ef4444' }}>{formatRp(pelangganList.reduce((s, p) => s + (Number(p.totalPiutang) || 0), 0))}</h3></div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Cari Kode C1, nama pelanggan, no HP, atau alamat..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select value={kategoriFilter} onChange={e => setKategoriFilter(e.target.value)} className="select-input" style={{ maxWidth: '170px' }}>
          <option value="">Semua Kategori</option>
          {KATEGORI_CUSTOMER.map(k => <option key={k} value={k}>{k}</option>)}
        </select>

        <select value={sistemBayarFilter} onChange={e => setSistemBayarFilter(e.target.value)} className="select-input" style={{ maxWidth: '170px' }}>
          <option value="">Semua Sistem Bayar</option>
          {SISTEM_PEMBAYARAN.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* TABLE */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Pelanggan</th>
              <th>Kategori Customer</th>
              <th>Sistem Bayar</th>
              <th>WhatsApp / HP</th>
              <th>Alamat Lengkap</th>
              <th>Sisa Piutang</th>
              {canEdit && <th style={{ textAlign: 'right' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Belum ada data pelanggan. Klik "+ Tambah Pelanggan" di atas untuk menambahkan pelanggan baru.
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr key={p.id || p._id || i}>
                  <td><strong style={{ color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: '1rem' }}>{p.kode || `C${i+1}`}</strong></td>
                  <td>
                    <strong style={{ fontSize: '0.98rem', color: '#fff' }}>{p.nama}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tipe: {p.tipe || 'Retail'}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: p.kategoriCustomer === 'Top Market' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.08)', color: p.kategoriCustomer === 'Top Market' ? '#f59e0b' : 'var(--text-muted)', border: `1px solid ${p.kategoriCustomer === 'Top Market' ? '#f59e0b' : 'var(--border-color)'}` }}>
                      {p.kategoriCustomer === 'Top Market' ? '⭐ Top Market' : 'Umum'}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: p.sistemPembayaran === 'Tempo' ? 'rgba(239,68,68,0.15)' : (p.sistemPembayaran === 'CBD' ? 'rgba(14,165,233,0.15)' : 'rgba(16,185,129,0.15)'), color: p.sistemPembayaran === 'Tempo' ? '#ef4444' : (p.sistemPembayaran === 'CBD' ? '#0ea5e9' : '#10b981') }}>
                      {p.sistemPembayaran || 'COD'}
                    </span>
                  </td>
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
                    <strong style={{ color: (Number(p.totalPiutang) || 0) > 0 ? '#ef4444' : '#10b981', fontSize: '0.92rem' }}>
                      {formatRp(p.totalPiutang)}
                    </strong>
                  </td>
                  {canEdit && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)} title="Edit Pelanggan"><Edit3 size={14} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(p)} title="Hapus Pelanggan"><Trash2 size={14} /></button>
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
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div className="modal-header" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} style={{ color: 'var(--accent-primary)' }} /> {editData ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Kode Pelanggan *</label>
                    <input className="form-input" style={{ fontFamily: 'monospace', fontWeight: 700 }} placeholder="C1, C2..." value={form.kode} onChange={e => setForm(f => ({ ...f, kode: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kategori Customer *</label>
                    <select className="form-select" value={form.kategoriCustomer} onChange={e => setForm(f => ({ ...f, kategoriCustomer: e.target.value }))}>
                      {KATEGORI_CUSTOMER.map(k => <option key={k} value={k}>{k === 'Top Market' ? '⭐ Top Market (Harga Modal Khusus)' : 'Umum (Harga Modal Standard)'}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">Nama Pelanggan / Toko / Outlet *</label>
                  <input className="form-input" placeholder="Contoh: Rajawali Sosis Baso, Toko Berkah..." value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} required />
                </div>

                <div className="form-grid" style={{ marginTop: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Sistem Pembayaran</label>
                    <select className="form-select" value={form.sistemPembayaran} onChange={e => setForm(f => ({ ...f, sistemPembayaran: e.target.value }))}>
                      <option value="COD">COD (Cash On Delivery)</option>
                      <option value="CBD">CBD (Cash Before Delivery)</option>
                      <option value="Tempo">Tempo (Kredit Piutang)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipe Kemitraan</label>
                    <select className="form-select" value={form.tipe} onChange={e => setForm(f => ({ ...f, tipe: e.target.value }))}>
                      {TIPE_PELANGGAN.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">No. WhatsApp / HP</label>
                  <input className="form-input" placeholder="Contoh: 081234567890" value={form.noHp} onChange={e => setForm(f => ({ ...f, noHp: e.target.value }))} />
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">Alamat Lengkap Pengiriman</label>
                  <textarea className="form-input" rows={2} placeholder="Jl. Rajawali Barat No. 45..." value={form.alamat} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} />
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">Catatan Pelanggan</label>
                  <input className="form-input" placeholder="Catatan diskon khusus, jadwal kirim..." value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, padding: '0.6rem 1.2rem' }}>
                  <Check size={16} /> {editData ? 'Simpan Edit Pelanggan' : 'Simpan Pelanggan Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PELANGGAN */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card modal-sm" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', width: '90%', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: '#fff' }}>Hapus Data Pelanggan?</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0 0 1.25rem', lineHeight: 1.4 }}>
              Apakah Anda yakin ingin menghapus pelanggan <strong style={{ color: '#fff' }}>"{deleteTarget.nama}" ({deleteTarget.kode})</strong>?
            </p>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" style={{ minWidth: '100px' }} onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="btn btn-danger" style={{ minWidth: '130px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }} onClick={handleConfirmDelete}>
                <Trash2 size={16} /> Ya, Hapus Pelanggan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
