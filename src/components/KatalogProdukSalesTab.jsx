import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, Edit3, Trash2, Tag, FileSpreadsheet, FileText, X, Eye, Layers, Scale, DollarSign, Boxes } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
const STATUS_OPTIONS = ['Tersedia', 'Pre-Order', 'Stok Habis'];

export default function KatalogProdukSalesTab({
  produkSalesList = [],
  kategoriList = [],
  activeRoleView,
  activeUser,
  onCreateProdukSales,
  onUpdateProdukSales,
  onDeleteProdukSales,
  onOpenPdfPreview,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editData, setEditData] = useState(null);

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN'].includes(activeRoleView);

  const emptyForm = {
    sku: '',
    namaProduk: '',
    varian: '',
    gramasi: '',
    kategori: 'Roti Manis',
    hargaJual: 0,
    stokReady: 0,
    deskripsi: '',
    status: 'Tersedia'
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    return produkSalesList.filter(p => {
      const q = search.toLowerCase();
      const matchQ = !search || p.namaProduk?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.varian?.toLowerCase().includes(q);
      const matchK = !kategoriFilter || p.kategori === kategoriFilter;
      return matchQ && matchK;
    });
  }, [produkSalesList, search, kategoriFilter]);

  const totalVarian = produkSalesList.length;
  const totalStokReady = useMemo(() => produkSalesList.reduce((s, p) => s + (Number(p.stokReady) || 0), 0), [produkSalesList]);
  const totalNilaiPersediaan = useMemo(() => produkSalesList.reduce((s, p) => s + ((Number(p.stokReady) || 0) * (Number(p.hargaJual) || 0)), 0), [produkSalesList]);

  const openAdd = () => {
    setEditData(null);
    setForm({ ...emptyForm, sku: 'SLS-' + String(Math.floor(100 + Math.random() * 900)) });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditData(p);
    setForm({
      sku: p.sku || '',
      namaProduk: p.namaProduk || '',
      varian: p.varian || '',
      gramasi: p.gramasi || '',
      kategori: p.kategori || 'Roti Manis',
      hargaJual: p.hargaJual || 0,
      stokReady: p.stokReady || 0,
      deskripsi: p.deskripsi || '',
      status: p.status || 'Tersedia'
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.namaProduk.trim()) { showAlert('Nama produk wajib diisi!', 'error'); return; }
    if (!form.hargaJual || form.hargaJual <= 0) { showAlert('Harga jual harus lebih dari 0!', 'error'); return; }

    if (editData) {
      await onUpdateProdukSales(editData.id || editData._id, form);
    } else {
      await onCreateProdukSales(form);
    }
    setShowModal(false);
  };

  const handleDelete = async (p) => {
    if (!confirm(`Hapus produk "${p.namaProduk}" (${p.varian || 'Default'}) dari katalog?`)) return;
    await onDeleteProdukSales(p.id || p._id);
  };

  const handleExportExcel = () => {
    const headers = ['SKU', 'Nama Produk', 'Varian', 'Gramasi / Ukuran', 'Kategori', 'Harga Jual (Rp)', 'Stok Ready (Pcs)', 'Status'];
    const rows = filtered.map(p => [p.sku, p.namaProduk, p.varian || '-', p.gramasi || '-', p.kategori, p.hargaJual, p.stokReady, p.status]);
    exportToExcel('Katalog_Produk_Penjualan', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['SKU', 'Nama Produk', 'Varian & Gramasi', 'Kategori', 'Harga Jual', 'Stok Ready'];
    const rows = filtered.map(p => [p.sku, p.namaProduk, `${p.varian || '-'} (${p.gramasi || '-'})`, p.kategori, formatRp(p.hargaJual), `${p.stokReady} Pcs`]);
    const config = {
      title: 'Katalog Produk Penjualan & Varian',
      subtitle: `Daftar varian produk, gramasi, dan stok siap jual Saren One.`,
      headers,
      rows,
      summaryText: `Total Produk: ${filtered.length} Varian | Total Stok Ready: ${filtered.reduce((a, b) => a + (b.stokReady || 0), 0)} Pcs`,
      filename: 'Katalog_Produk_Penjualan'
    };
    if (onOpenPdfPreview) onOpenPdfPreview(config);
    else exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
  };

  return (
    <div className="tab-container">
      {/* HEADER */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title"><Package size={24} /> Katalog Produk Penjualan</h2>
          <p className="tab-subtitle">Kelola katalog produk jual, varian rasa, gramasi, harga, & stok siap jual</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Tambah Produk Jual
          </button>
        )}
      </div>

      {/* STATS CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}><Package size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Varian Produk</p><h3 className="stat-value">{totalVarian}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Boxes size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Stok Siap Jual</p><h3 className="stat-value">{totalStokReady} Pcs</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><DollarSign size={20} /></div>
          <div className="stat-info"><p className="stat-label">Nilai Persediaan Produk</p><h3 className="stat-value" style={{ fontSize: '1.05rem' }}>{formatRp(totalNilaiPersediaan)}</h3></div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Cari nama produk, varian, atau SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select value={kategoriFilter} onChange={e => setKategoriFilter(e.target.value)} className="select-input" style={{ maxWidth: '190px' }}>
          <option value="">Semua Kategori</option>
          {kategoriList.map(k => <option key={k.id || k.nama} value={k.nama}>{k.nama}</option>)}
        </select>

        <div className="toolbar-actions">
          <button className="btn btn-outline" onClick={handleExportExcel}><FileSpreadsheet size={16} style={{ color: 'var(--emerald)' }} /> Excel</button>
          <button className="btn btn-outline" onClick={handleExportPDF}><FileText size={16} style={{ color: 'var(--amber)' }} /> Cetak PDF</button>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 14, border: '2px dashed var(--border-color)' }}>
          <Package size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} /><br />
          Belum ada produk penjualan.{canEdit && <span> Klik "+ Tambah Produk Jual" untuk menambahkan katalog.</span>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(p => (
            <div key={p.id || p._id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '1.25rem', border: '1px solid var(--border-color)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{p.sku}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>• {p.kategori}</span>
                  </div>
                  <span className="badge" style={{ background: p.status === 'Tersedia' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: p.status === 'Tersedia' ? '#10b981' : '#ef4444', border: `1px solid ${p.status === 'Tersedia' ? '#10b981' : '#ef4444'}` }}>
                    {p.status}
                  </span>
                </div>

                <h4 style={{ margin: '0.2rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.namaProduk}</h4>

                {/* Varian & Gramasi Badge Row */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.6rem 0' }}>
                  {p.varian && <span style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 }}>✨ Varian: {p.varian}</span>}
                  {p.gramasi && <span style={{ background: 'var(--bg-secondary)', color: 'var(--emerald)', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 }}><Scale size={12} style={{ display: 'inline', marginRight: 3 }} />{p.gramasi}</span>}
                </div>

                {p.deskripsi && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.4rem 0 0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.deskripsi}</p>}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 10, margin: '0.6rem 0 0.8rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Harga Jual</span>
                    <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>{formatRp(p.hargaJual)}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Stok Siap Jual</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{p.stokReady} Pcs</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowDetail(p)}><Eye size={14} /> Detail</button>
                  {canEdit && (
                    <>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}><Edit3 size={14} /> Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Package size={20} style={{ color: 'var(--accent-primary)' }} /> {editData ? 'Edit Produk Katalog Jual' : 'Tambah Produk Jual Baru'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Kode SKU *</label>
                  <input className="form-input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Contoh: SLS-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori Produk *</label>
                  <select className="form-select" value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}>
                    <option value="Roti Manis">Roti Manis</option>
                    <option value="Kue & Cake">Kue & Cake</option>
                    <option value="Pastry & Danish">Pastry & Danish</option>
                    <option value="Roti Tawar">Roti Tawar</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Nama Produk Jual *</label>
                  <input className="form-input" value={form.namaProduk} onChange={e => setForm(f => ({ ...f, namaProduk: e.target.value }))} placeholder="Contoh: Roti Keju Spesial, Croissant Butter" />
                </div>
                <div className="form-group">
                  <label className="form-label">Varian Rasa / Jenis</label>
                  <input className="form-input" value={form.varian} onChange={e => setForm(f => ({ ...f, varian: e.target.value }))} placeholder="Contoh: Keju Cheddar, Cokelat Lumer, Matcha" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gramasi / Ukuran Berat</label>
                  <input className="form-input" value={form.gramasi} onChange={e => setForm(f => ({ ...f, gramasi: e.target.value }))} placeholder="Contoh: 250 gram, 500 gram, 12 Pcs/Box" />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga Jual per Pcs (Rp) *</label>
                  <input className="form-input" type="number" min={0} value={form.hargaJual} onChange={e => setForm(f => ({ ...f, hargaJual: e.target.value }))} placeholder="18000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Stok Siap Jual (Pcs)</label>
                  <input className="form-input" type="number" min={0} value={form.stokReady} onChange={e => setForm(f => ({ ...f, stokReady: e.target.value }))} placeholder="50" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status Ketersediaan</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Deskripsi / Catatan Produk</label>
                  <textarea className="form-input" rows={2} value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} placeholder="Keterangan singkat varian produk..." style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editData ? 'Simpan Perubahan' : 'Tambah Produk'}</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-container" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Produk — {showDetail.sku}</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {[['Nama Produk', showDetail.namaProduk], ['Varian', showDetail.varian || '-'], ['Gramasi / Ukuran', showDetail.gramasi || '-'], ['Kategori', showDetail.kategori], ['Harga Jual', formatRp(showDetail.hargaJual)], ['Stok Siap Jual', `${showDetail.stokReady} Pcs`], ['Status', showDetail.status], ['Dibuat Oleh', showDetail.createdBy || '-']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              {showDetail.deskripsi && <div style={{ marginTop: '0.8rem', padding: '0.7rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>📝 {showDetail.deskripsi}</div>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
