import React, { useState, useMemo } from 'react';
import { ShoppingBag, Plus, Trash2, Edit3, Search, X, Eye, TrendingUp, DollarSign, Package, Users } from 'lucide-react';

const METODE_PEMBAYARAN = ['Tunai', 'Transfer Bank', 'QRIS', 'Kartu Debit', 'Kartu Kredit', 'COD'];
const STATUS_PEMBAYARAN = ['Lunas', 'Cicilan', 'Pending', 'Dibatalkan'];

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
const formatDate = (d) => {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};

export default function PenjualanTab({
  penjualanList = [],
  pelangganList = [],
  produkSalesList = [],
  activeRoleView,
  activeUser,
  onCreatePenjualan,
  onUpdatePenjualan,
  onDeletePenjualan,
  showAlert
}) {
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [filterMonth, setFilterMonth] = useState(currentMonthKey);

  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editData, setEditData] = useState(null);

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN'].includes(activeRoleView);

  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    monthsSet.add(currentMonthKey);
    penjualanList.forEach(p => {
      const t = p.tanggal || p.createdAt;
      if (t) {
        try {
          const d = new Date(t);
          if (!isNaN(d.getTime())) {
            monthsSet.add(d.toISOString().slice(0, 7));
          }
        } catch { /* ignore */ }
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [penjualanList, currentMonthKey]);

  const formatMonthName = (monthKey) => {
    if (!monthKey || monthKey === 'Semua') return 'Semua Bulan';
    try {
      const [year, month] = monthKey.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch {
      return monthKey;
    }
  };

  const emptyForm = {
    pelangganId: '',
    namaPelanggan: '',
    teleponPelanggan: '',
    alamatPelanggan: '',
    items: [{ produkId: '', namaProduk: '', sku: '', brand: '', hargaPabrik: 0, qty: 1, hargaSatuan: 0, subtotal: 0 }],
    diskon: 0,
    metodePembayaran: 'Tunai',
    statusPembayaran: 'Lunas',
    catatan: ''
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    return penjualanList.filter(p => {
      const matchQ = !searchQ || p.namaPelanggan?.toLowerCase().includes(searchQ.toLowerCase()) || p.noFaktur?.toLowerCase().includes(searchQ.toLowerCase());
      const matchStatus = filterStatus === 'Semua' || p.statusPembayaran === filterStatus;
      
      let matchMonth = true;
      if (filterMonth && filterMonth !== 'Semua') {
        const itemDate = p.tanggal || p.createdAt;
        if (itemDate) {
          try {
            const itemKey = new Date(itemDate).toISOString().slice(0, 7);
            matchMonth = itemKey === filterMonth;
          } catch { matchMonth = true; }
        }
      }
      return matchQ && matchStatus && matchMonth;
    });
  }, [penjualanList, searchQ, filterStatus, filterMonth]);

  const totalPenjualan = useMemo(() => filtered.reduce((s, p) => s + (p.totalBersih || 0), 0), [filtered]);
  const totalTransaksi = filtered.length;
  const lunas = filtered.filter(p => p.statusPembayaran === 'Lunas').length;
  const pelangganUnik = new Set(filtered.map(p => p.namaPelanggan)).size;

  const calcItems = (items) => {
    return items.map(it => ({ ...it, subtotal: (Number(it.qty) || 0) * (Number(it.hargaSatuan) || 0) }));
  };
  const totalHarga = form.items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const totalBersih = Math.max(0, totalHarga - (Number(form.diskon) || 0));

  const openAdd = () => { setEditData(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p) => {
    setEditData(p);
    setForm({
      pelangganId: p.pelangganId || '',
      namaPelanggan: p.namaPelanggan || '',
      teleponPelanggan: p.teleponPelanggan || '',
      alamatPelanggan: p.alamatPelanggan || '',
      items: p.items?.length ? p.items : emptyForm.items,
      diskon: p.diskon || 0,
      metodePembayaran: p.metodePembayaran || 'Tunai',
      statusPembayaran: p.statusPembayaran || 'Lunas',
      catatan: p.catatan || ''
    });
    setShowModal(true);
  };

  // Handle Customer Selection Dropdown
  const handleSelectCustomer = (e) => {
    const custId = e.target.value;
    if (!custId) {
      setForm(f => ({ ...f, pelangganId: '', namaPelanggan: '', teleponPelanggan: '', alamatPelanggan: '' }));
      return;
    }
    const found = pelangganList.find(c => (c.id || c._id) === custId);
    if (found) {
      setForm(f => ({
        ...f,
        pelangganId: custId,
        namaPelanggan: found.nama,
        teleponPelanggan: found.noHp || '',
        alamatPelanggan: found.alamat || ''
      }));
    }
  };

  // Handle Product Selection Dropdown per Item Row
  const handleSelectProduct = (idx, prodId) => {
    const items = [...form.items];
    const foundProd = produkSalesList.find(p => (p.id || p._id) === prodId);

    if (foundProd) {
      items[idx] = {
        ...items[idx],
        produkId: prodId,
        namaProduk: foundProd.namaProduk,
        sku: foundProd.sku || '',
        brand: foundProd.brand || '',
        hargaPabrik: foundProd.hargaPabrik || 0,
        hargaSatuan: foundProd.hargaJual || foundProd.hargaPabrik || 0, // default suggestion, can be edited manually!
        subtotal: (Number(items[idx].qty) || 1) * (Number(foundProd.hargaJual || foundProd.hargaPabrik) || 0)
      };
    } else {
      items[idx] = {
        ...items[idx],
        produkId: '',
        namaProduk: prodId, // manual custom name if typed
        hargaPabrik: 0
      };
    }
    setForm(f => ({ ...f, items }));
  };

  const handleItemChange = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    items[idx].subtotal = (Number(items[idx].qty) || 0) * (Number(items[idx].hargaSatuan) || 0);
    setForm(f => ({ ...f, items }));
  };

  const addItem = () => setForm(f => ({
    ...f,
    items: [...f.items, { produkId: '', namaProduk: '', sku: '', brand: '', hargaPabrik: 0, qty: 1, hargaSatuan: 0, subtotal: 0 }]
  }));

  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    if (!form.namaPelanggan.trim()) { showAlert('Nama pelanggan wajib diisi/dipilih!', 'error'); return; }
    if (!form.items.some(it => it.namaProduk)) { showAlert('Minimal 1 produk harus diisi/dipilih!', 'error'); return; }
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
          <h2 className="tab-title"><ShoppingBag size={24} /> Data Penjualan Produk</h2>
          <p className="tab-subtitle">Catat transaksi penjualan, pilih dari pelanggan &amp; stok produk, serta kelola tagihan</p>
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
      <div className="filter-row" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input className="search-input" placeholder="Cari pelanggan / no. faktur..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>

        <select className="form-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ maxWidth: 190, fontWeight: 600 }}>
          <option value="Semua">🗓️ Semua Bulan</option>
          {availableMonths.map(m => (
            <option key={m} value={m}>🗓️ {formatMonthName(m)}</option>
          ))}
        </select>

        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 150 }}>
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
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Belum ada transaksi penjualan. Klik "+ Catat Penjualan" untuk mencatat.
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id || p._id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)' }}>{p.noFaktur || '-'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{formatDate(p.tanggal || p.createdAt)}</td>
                  <td><strong>{p.namaPelanggan}</strong></td>
                  <td>{p.items?.length || 0} Item</td>
                  <td><strong style={{ color: '#10b981' }}>{formatRp(p.totalBersih)}</strong></td>
                  <td><span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{p.metodePembayaran || 'Tunai'}</span></td>
                  <td><span className="badge" style={{ background: `${statusColor[p.statusPembayaran] || '#10b981'}20`, color: statusColor[p.statusPembayaran] || '#10b981', border: `1px solid ${statusColor[p.statusPembayaran] || '#10b981'}` }}>{p.statusPembayaran}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setShowDetail(p)}><Eye size={14} /></button>
                      {canEdit && (
                        <>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}><Edit3 size={14} /></button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CATAT PENJUALAN */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><ShoppingBag size={20} style={{ color: 'var(--accent-primary)' }} /> {editData ? 'Edit Catatan Penjualan' : 'Catat Transaksi Penjualan Baru'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {/* PELANGGAN SELECTION */}
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Pilih Pelanggan / Customer *</label>
                  <select className="form-select" value={form.pelangganId} onChange={handleSelectCustomer}>
                    <option value="">-- Pilih Pelanggan Terdaftar --</option>
                    {pelangganList.map(c => (
                      <option key={c.id || c._id} value={c.id || c._id}>
                        👤 {c.nama} ({c.tipe || 'Retail'}) {c.noHp ? `- ${c.noHp}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Pelanggan (Manual / Edit) *</label>
                  <input className="form-input" value={form.namaPelanggan} onChange={e => setForm(f => ({ ...f, namaPelanggan: e.target.value }))} placeholder="Nama Pelanggan / Toko..." required />
                </div>
                <div className="form-group">
                  <label className="form-label">No. Telepon / WA</label>
                  <input className="form-input" value={form.teleponPelanggan} onChange={e => setForm(f => ({ ...f, teleponPelanggan: e.target.value }))} placeholder="08xx-xxxx-xxxx" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Alamat Pengiriman</label>
                  <input className="form-input" value={form.alamatPelanggan} onChange={e => setForm(f => ({ ...f, alamatPelanggan: e.target.value }))} placeholder="Alamat pengiriman..." />
                </div>
              </div>

              {/* PRODUCT ITEM SELECTION */}
              <div style={{ margin: '1.25rem 0 0.5rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📦 Item Produk Penjualan</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>* Pilihan otomatis dari Stok Produk</span>
              </div>

              {form.items.map((it, idx) => {
                const currentProd = produkSalesList.find(p => (p.id || p._id) === it.produkId || p.namaProduk === it.namaProduk);

                return (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 10, marginBottom: '0.6rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr auto', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Nama Produk *</label>
                        <select className="form-select" value={it.produkId || ''} onChange={e => handleSelectProduct(idx, e.target.value)}>
                          <option value="">-- Pilih dari Stok Produk --</option>
                          {produkSalesList.map(p => (
                            <option key={p.id || p._id} value={p.id || p._id}>
                              📦 {p.namaProduk} [{p.brand || 'SAREN ONE'}] (Stok: {p.stokReady || 0} Pcs)
                            </option>
                          ))}
                        </select>
                        {currentProd && (
                          <div style={{ fontSize: '0.73rem', color: 'var(--cyan)', marginTop: '3px' }}>
                            <span>Harga Pabrik (Modal): {formatRp(currentProd.hargaPabrik)}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Qty (Pcs) *</label>
                        <input className="form-input" type="number" min={1} value={it.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} placeholder="Qty" />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Harga Jual / Pcs (Rp) *</label>
                        <input className="form-input" type="number" min={0} value={it.hargaSatuan} onChange={e => handleItemChange(idx, 'hargaSatuan', e.target.value)} placeholder="Harga jual" />
                      </div>

                      <div style={{ paddingTop: '1.4rem' }}>
                        <button className="btn btn-sm btn-danger" onClick={() => removeItem(idx)} disabled={form.items.length === 1} title="Hapus Item"><X size={14} /></button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subtotal Item:</span>
                      <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>{formatRp(it.subtotal)}</strong>
                    </div>
                  </div>
                );
              })}

              <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }} onClick={addItem}><Plus size={14} /> Tambah Baris Produk</button>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Diskon Potongan (Rp)</label>
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
                  <label className="form-label">Catatan Transaksi</label>
                  <input className="form-input" value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Catatan tambahan (opsional)" />
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: 'var(--text-muted)' }}><span>Subtotal Harga:</span><span>{formatRp(totalHarga)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: '#ef4444' }}><span>Diskon:</span><span>- {formatRp(form.diskon)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: '#10b981', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}><span>Total Penjualan Bersih:</span><span>{formatRp(totalBersih)}</span></div>
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
                {[
                  ['Pelanggan', showDetail.namaPelanggan],
                  ['Telepon', showDetail.teleponPelanggan || '-'],
                  ['Alamat', showDetail.alamatPelanggan || '-'],
                  ['Tanggal', formatDate(showDetail.tanggal || showDetail.createdAt)],
                  ['Metode Bayar', showDetail.metodePembayaran],
                  ['Status', showDetail.statusPembayaran],
                  ['Dicatat oleh', showDetail.createdBy || '-']
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', fontWeight: 600 }}>Item Produk:</div>
              <table className="data-table" style={{ marginTop: '0.5rem' }}>
                <thead><tr><th>Produk</th><th>Qty</th><th>Harga Jual</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {(showDetail.items || []).map((it, i) => (
                    <tr key={i}><td>{it.namaProduk}</td><td>{it.qty} Pcs</td><td>{formatRp(it.hargaSatuan)}</td><td>{formatRp(it.subtotal)}</td></tr>
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
