import React, { useState, useMemo } from 'react';
import { ShoppingBag, Plus, Trash2, Edit3, Search, X, Eye, TrendingUp, DollarSign, Package, Users } from 'lucide-react';

const METODE_PEMBAYARAN = ['Tunai', 'Transfer Bank', 'QRIS', 'Kartu Debit', 'Kartu Kredit', 'COD'];
const STATUS_PEMBAYARAN = ['Lunas', 'Cicilan', 'Pending', 'Dibatalkan'];

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
const formatDate = (d) => {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};

export default function PenjualanTab({ penjualanList = [], activeRoleView, activeUser, onCreatePenjualan, onUpdatePenjualan, onDeletePenjualan, showAlert }) {
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editData, setEditData] = useState(null);

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN'].includes(activeRoleView);

  const emptyForm = { namaPelanggan: '', teleponPelanggan: '', alamatPelanggan: '', items: [{ namaProduk: '', qty: 1, hargaSatuan: 0, subtotal: 0 }], diskon: 0, metodePembayaran: 'Tunai', statusPembayaran: 'Lunas', catatan: '' };
  const [form, setForm] = useState(emptyForm);

  const totalPenjualan = useMemo(() => penjualanList.reduce((s, p) => s + (p.totalBersih || 0), 0), [penjualanList]);
  const totalTransaksi = penjualanList.length;
  const lunas = penjualanList.filter(p => p.statusPembayaran === 'Lunas').length;
  const pelangganUnik = new Set(penjualanList.map(p => p.namaPelanggan)).size;

  const filtered = useMemo(() => {
    return penjualanList.filter(p => {
      const matchQ = !searchQ || p.namaPelanggan?.toLowerCase().includes(searchQ.toLowerCase()) || p.noFaktur?.toLowerCase().includes(searchQ.toLowerCase());
      const matchStatus = filterStatus === 'Semua' || p.statusPembayaran === filterStatus;
      return matchQ && matchStatus;
    });
  }, [penjualanList, searchQ, filterStatus]);

  const calcItems = (items) => {
    return items.map(it => ({ ...it, subtotal: (Number(it.qty) || 0) * (Number(it.hargaSatuan) || 0) }));
  };
  const totalHarga = form.items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const totalBersih = Math.max(0, totalHarga - (Number(form.diskon) || 0));

  const openAdd = () => { setEditData(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p) => {
    setEditData(p);
    setForm({ namaPelanggan: p.namaPelanggan, teleponPelanggan: p.teleponPelanggan || '', alamatPelanggan: p.alamatPelanggan || '', items: p.items?.length ? p.items : emptyForm.items, diskon: p.diskon || 0, metodePembayaran: p.metodePembayaran || 'Tunai', statusPembayaran: p.statusPembayaran || 'Lunas', catatan: p.catatan || '' });
    setShowModal(true);
  };

  const handleItemChange = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    items[idx].subtotal = (Number(items[idx].qty) || 0) * (Number(items[idx].hargaSatuan) || 0);
    setForm(f => ({ ...f, items }));
  };
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { namaProduk: '', qty: 1, hargaSatuan: 0, subtotal: 0 }] }));
  const removeItem = (idx) => { if (form.items.length === 1) return; setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) })); };

  const handleSubmit = async () => {
    if (!form.namaPelanggan.trim()) { showAlert('Nama pelanggan wajib diisi!', 'error'); return; }
    if (!form.items.some(it => it.namaProduk)) { showAlert('Minimal 1 produk harus diisi!', 'error'); return; }
    const payload = { ...form, items: calcItems(form.items), totalHarga, totalBersih };
    if (editData) {
      await onUpdatePenjualan(editData.id || editData._id, payload);
    } else {
      await onCreatePenjualan(payload);
    }
    setShowModal(false);
  };

  const handleDelete = async (p) => {
    if (!confirm(`Hapus penjualan ${p.noFaktur} ke ${p.namaPelanggan}?`)) return;
    await onDeletePenjualan(p.id || p._id);
  };

  const statusColor = { 'Lunas': '#10b981', 'Cicilan': '#f59e0b', 'Pending': '#6366f1', 'Dibatalkan': '#ef4444' };

  return (
    <div className="tab-container">
      {/* HEADER */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title"><ShoppingBag size={24} /> Data Penjualan</h2>
          <p className="tab-subtitle">Catat & pantau semua transaksi penjualan produk</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Catat Penjualan
          </button>
        )}
      </div>

      {/* SUMMARY CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}><DollarSign size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Omzet</p><h3 className="stat-value" style={{ fontSize: '1.1rem' }}>{formatRp(totalPenjualan)}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><TrendingUp size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Transaksi</p><h3 className="stat-value">{totalTransaksi}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Package size={20} /></div>
          <div className="stat-info"><p className="stat-label">Transaksi Lunas</p><h3 className="stat-value">{lunas}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><Users size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Pelanggan</p><h3 className="stat-value">{pelangganUnik}</h3></div>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="filter-row" style={{ marginBottom: '1rem' }}>
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input className="search-input" placeholder="Cari pelanggan / no. faktur..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 140 }}>
          <option value="Semua">Semua Status</option>
          {STATUS_PEMBAYARAN.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>No. Faktur</th>
              <th>Tanggal</th>
              <th>Pelanggan</th>
              <th>Total Item</th>
              <th>Total Bersih</th>
              <th>Metode</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data penjualan. {canEdit && 'Klik "+ Catat Penjualan" untuk memulai.'}</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id || p._id}>
                <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)' }}>{p.noFaktur}</span></td>
                <td>{formatDate(p.tanggal || p.createdAt)}</td>
                <td><div style={{ fontWeight: 600 }}>{p.namaPelanggan}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.teleponPelanggan}</div></td>
                <td><span className="badge badge-gray">{p.items?.length || 0} item</span></td>
                <td style={{ fontWeight: 700, color: '#10b981' }}>{formatRp(p.totalBersih)}</td>
                <td>{p.metodePembayaran}</td>
                <td><span className="badge" style={{ background: statusColor[p.statusPembayaran] || '#6b7280', color: '#fff' }}>{p.statusPembayaran}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowDetail(p)} title="Detail"><Eye size={14} /></button>
                    {canEdit && <><button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)} title="Edit"><Edit3 size={14} /></button><button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)} title="Hapus"><Trash2 size={14} /></button></>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editData ? 'Edit Penjualan' : 'Catat Penjualan Baru'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nama Pelanggan *</label>
                  <input className="form-input" value={form.namaPelanggan} onChange={e => setForm(f => ({ ...f, namaPelanggan: e.target.value }))} placeholder="Nama pelanggan" />
                </div>
                <div className="form-group">
                  <label className="form-label">No. Telepon</label>
                  <input className="form-input" value={form.teleponPelanggan} onChange={e => setForm(f => ({ ...f, teleponPelanggan: e.target.value }))} placeholder="08xx-xxxx-xxxx" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Alamat Pelanggan</label>
                  <input className="form-input" value={form.alamatPelanggan} onChange={e => setForm(f => ({ ...f, alamatPelanggan: e.target.value }))} placeholder="Alamat pengiriman (opsional)" />
                </div>
              </div>

              <div style={{ margin: '1rem 0 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>📦 Item Produk</div>
              {form.items.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <input className="form-input" value={it.namaProduk} onChange={e => handleItemChange(idx, 'namaProduk', e.target.value)} placeholder="Nama produk" />
                  <input className="form-input" type="number" min={1} value={it.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} placeholder="Qty" />
                  <input className="form-input" type="number" min={0} value={it.hargaSatuan} onChange={e => handleItemChange(idx, 'hargaSatuan', e.target.value)} placeholder="Harga satuan" />
                  <div style={{ fontWeight: 600, color: '#10b981', fontSize: '0.9rem' }}>{formatRp(it.subtotal)}</div>
                  <button className="btn btn-sm btn-danger" onClick={() => removeItem(idx)} disabled={form.items.length === 1}><X size={12} /></button>
                </div>
              ))}
              <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={addItem}><Plus size={14} /> Tambah Item</button>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Diskon (Rp)</label>
                  <input className="form-input" type="number" min={0} value={form.diskon} onChange={e => setForm(f => ({ ...f, diskon: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Metode Pembayaran</label>
                  <select className="form-select" value={form.metodePembayaran} onChange={e => setForm(f => ({ ...f, metodePembayaran: e.target.value }))}>
                    {METODE_PEMBAYARAN.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status Pembayaran</label>
                  <select className="form-select" value={form.statusPembayaran} onChange={e => setForm(f => ({ ...f, statusPembayaran: e.target.value }))}>
                    {STATUS_PEMBAYARAN.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Catatan</label>
                  <input className="form-input" value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Catatan tambahan (opsional)" />
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: 'var(--text-muted)' }}><span>Subtotal:</span><span>{formatRp(totalHarga)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: '#ef4444' }}><span>Diskon:</span><span>- {formatRp(form.diskon)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: '#10b981', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}><span>Total Bersih:</span><span>{formatRp(totalBersih)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editData ? 'Simpan Perubahan' : 'Catat Penjualan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-container" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Penjualan — {showDetail.noFaktur}</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {[['Pelanggan', showDetail.namaPelanggan], ['Telepon', showDetail.teleponPelanggan || '-'], ['Alamat', showDetail.alamatPelanggan || '-'], ['Tanggal', formatDate(showDetail.tanggal || showDetail.createdAt)], ['Metode Bayar', showDetail.metodePembayaran], ['Status', showDetail.statusPembayaran], ['Dicatat oleh', showDetail.createdBy || '-']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', fontWeight: 600 }}>Item Produk:</div>
              <table className="data-table" style={{ marginTop: '0.5rem' }}>
                <thead><tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {(showDetail.items || []).map((it, i) => (
                    <tr key={i}><td>{it.namaProduk}</td><td>{it.qty}</td><td>{formatRp(it.hargaSatuan)}</td><td>{formatRp(it.subtotal)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>{formatRp(showDetail.totalHarga)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}><span>Diskon:</span><span>- {formatRp(showDetail.diskon)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: '#10b981' }}><span>Total Bersih:</span><span>{formatRp(showDetail.totalBersih)}</span></div>
              </div>
              {showDetail.catatan && <div style={{ marginTop: '0.8rem', padding: '0.7rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>📝 {showDetail.catatan}</div>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
