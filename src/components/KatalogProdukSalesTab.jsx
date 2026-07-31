import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, Edit3, Trash2, FileSpreadsheet, FileText, X, Eye, Boxes, DollarSign, Upload, Download, Tag, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
const STATUS_OPTIONS = ['Tersedia', 'Pre-Order', 'Stok Habis'];

export default function KatalogProdukSalesTab({
  produkSalesList = [],
  brandList = [],
  activeRoleView,
  activeUser,
  onCreateProdukSales,
  onUpdateProdukSales,
  onDeleteProdukSales,
  onCreateBrand,
  onUpdateBrand,
  onDeleteBrand,
  onOpenPdfPreview,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editData, setEditData] = useState(null);

  // Brand Manager Modal State
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editBrandData, setEditBrandData] = useState(null);
  const [brandForm, setBrandForm] = useState({ nama: '', deskripsi: '' });

  // Excel Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedRows, setImportedRows] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN'].includes(activeRoleView);

  const safeBrandList = useMemo(() => {
    if (!Array.isArray(brandList)) return [];
    return brandList
      .filter(Boolean)
      .map(b => typeof b === 'string' ? { id: b, nama: b, deskripsi: 'Daging olahan makanan beku' } : b)
      .filter(b => b && b.nama && !['Saren Bakery', 'Saren Frozen', 'Dapur Saren', 'Saren One Original'].includes(b.nama));
  }, [brandList]);

  const emptyForm = {
    sku: '',
    namaProduk: '',
    varian: '',
    gramasi: '',
    brand: safeBrandList[0]?.nama || 'SAREN ONE',
    hargaJual: 0,
    stokReady: 0,
    deskripsi: '',
    status: 'Tersedia'
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    return produkSalesList.filter(p => {
      const q = search.toLowerCase();
      const matchQ = !search || p.namaProduk?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.varian?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
      const matchB = !brandFilter || p.brand === brandFilter;
      return matchQ && matchB;
    });
  }, [produkSalesList, search, brandFilter]);

  const totalVarian = produkSalesList.length;
  const totalStokReady = useMemo(() => produkSalesList.reduce((s, p) => s + (Number(p.stokReady) || 0), 0), [produkSalesList]);
  const totalNilaiPersediaan = useMemo(() => produkSalesList.reduce((s, p) => s + ((Number(p.stokReady) || 0) * (Number(p.hargaJual) || 0)), 0), [produkSalesList]);

  // Product CRUD
  const openAdd = () => {
    setEditData(null);
    setForm({
      ...emptyForm,
      sku: 'SLS-' + String(Math.floor(100 + Math.random() * 900)),
      brand: brandList[0]?.nama || 'SAREN ONE'
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditData(p);
    setForm({
      sku: p.sku || '',
      namaProduk: p.namaProduk || '',
      varian: p.varian || '',
      gramasi: p.gramasi || '',
      brand: p.brand || (brandList[0]?.nama || 'SAREN ONE'),
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

  // Brand CRUD
  const handleOpenBrandModal = () => {
    setEditBrandData(null);
    setBrandForm({ nama: '', deskripsi: '' });
    setShowBrandModal(true);
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!brandForm.nama.trim()) {
      if (showAlert) showAlert('Nama brand wajib diisi!', 'error');
      return;
    }

    if (editBrandData && onUpdateBrand) {
      await onUpdateBrand(editBrandData.id || editBrandData._id, brandForm);
    } else if (onCreateBrand) {
      await onCreateBrand(brandForm);
    }
    setEditBrandData(null);
    setBrandForm({ nama: '', deskripsi: '' });
  };

  const handleEditBrand = (b) => {
    setEditBrandData(b);
    setBrandForm({ nama: b.nama || '', deskripsi: b.deskripsi || '' });
  };

  const handleDeleteBrandItem = async (b) => {
    if (!confirm(`Hapus brand "${b.nama}"?`)) return;
    if (onDeleteBrand) await onDeleteBrand(b.id || b._id);
  };

  // Export handlers
  const handleExportExcel = () => {
    const headers = ['SKU', 'Nama Produk', 'Brand', 'Varian', 'Gramasi / Ukuran', 'Harga Jual (Rp)', 'Stok Ready (Pcs)', 'Status'];
    const rows = filtered.map(p => [p.sku, p.namaProduk, p.brand || 'SAREN ONE', p.varian || '-', p.gramasi || '-', p.hargaJual, p.stokReady, p.status]);
    exportToExcel('Katalog_Produk_Penjualan', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['SKU', 'Nama Produk & Brand', 'Varian & Gramasi', 'Harga Jual', 'Stok Ready'];
    const rows = filtered.map(p => [p.sku, `${p.namaProduk}\nBrand: ${p.brand || 'SAREN ONE'}`, `${p.varian || '-'} (${p.gramasi || '-'})`, formatRp(p.hargaJual), `${p.stokReady} Pcs`]);
    const config = {
      title: 'Katalog Produk Penjualan & Brand',
      subtitle: `Daftar varian produk, brand, gramasi, dan stok siap jual Saren One.`,
      headers,
      rows,
      summaryText: `Total Produk: ${filtered.length} Varian | Total Stok Ready: ${filtered.reduce((a, b) => a + (b.stokReady || 0), 0)} Pcs`,
      filename: 'Katalog_Produk_Penjualan'
    };
    if (onOpenPdfPreview) onOpenPdfPreview(config);
    else exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
  };

  // Download Import Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Kode SKU': 'SLS-101',
        'Nama Produk': 'Sosis Sapi Premium',
        'Brand': 'SAREN ONE',
        'Varian Rasa': 'Original Smoked',
        'Gramasi / Ukuran': '500 gram (12 Pcs)',
        'Harga Jual (Rp)': 45000,
        'Stok Siap Jual': 100,
        'Status': 'Tersedia',
        'Deskripsi': 'Sosis daging sapi pilihan berkualitas tinggi.'
      },
      {
        'Kode SKU': 'SLS-102',
        'Nama Produk': 'Nugget Ayam Crispy',
        'Brand': 'EAT GOW',
        'Varian Rasa': 'Keju Crispy',
        'Gramasi / Ukuran': '250 gram',
        'Harga Jual (Rp)': 28000,
        'Stok Siap Jual': 80,
        'Status': 'Tersedia',
        'Deskripsi': 'Nugget ayam renyah isi keju lumer.'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Katalog');

    worksheet['!cols'] = [
      { wch: 12 }, { wch: 28 }, { wch: 20 }, { wch: 18 },
      { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 35 }
    ];

    XLSX.writeFile(workbook, 'Template_Import_Katalog_Produk_SarenOne.xlsx');
  };

  // Handle Excel File Upload & Parsing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson = XLSX.utils.sheet_to_json(ws);

        const parsed = rawJson.map((row, idx) => {
          const sku = row['Kode SKU'] || row['SKU'] || `SLS-${Math.floor(100 + Math.random() * 900)}`;
          const namaProduk = row['Nama Produk'] || row['Nama'] || '';
          const brand = row['Brand'] || 'SAREN ONE';
          const varian = row['Varian Rasa'] || row['Varian'] || '';
          const gramasi = row['Gramasi / Ukuran'] || row['Gramasi'] || '';
          const hargaJual = Number(row['Harga Jual (Rp)'] || row['Harga Jual'] || 0);
          const stokReady = Number(row['Stok Siap Jual'] || row['Stok'] || 0);
          const status = row['Status'] || 'Tersedia';
          const deskripsi = row['Deskripsi'] || '';

          const isValid = !!namaProduk && hargaJual > 0;

          return {
            id: `import_${idx}_${Date.now()}`,
            sku,
            namaProduk,
            brand,
            varian,
            gramasi,
            hargaJual,
            stokReady,
            status,
            deskripsi,
            isValid,
            errorMsg: !namaProduk ? 'Nama Produk kosong' : (hargaJual <= 0 ? 'Harga Jual 0' : '')
          };
        });

        setImportedRows(parsed);
        setShowImportModal(true);
      } catch (err) {
        if (showAlert) showAlert(`Gagal membaca file Excel: ${err.message}`, 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    const validRows = importedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      if (showAlert) showAlert('Tidak ada data produk valid untuk di-import!', 'warning');
      return;
    }

    setIsImporting(true);
    let count = 0;
    for (const r of validRows) {
      const payload = {
        sku: r.sku,
        namaProduk: r.namaProduk,
        brand: r.brand,
        varian: r.varian,
        gramasi: r.gramasi,
        hargaJual: r.hargaJual,
        stokReady: r.stokReady,
        status: r.status,
        deskripsi: r.deskripsi
      };
      if (onCreateProdukSales) {
        await onCreateProdukSales(payload);
        count++;
      }
    }
    setIsImporting(false);
    setShowImportModal(false);
    setImportedRows([]);
    if (showAlert) showAlert(`Berhasil meng-import ${count} produk baru ke katalog! 🎉`, 'success', 'Import Sukses!');
  };

  return (
    <div className="tab-container">
      {/* HEADER */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title"><Package size={24} /> Katalog Produk Penjualan</h2>
          <p className="tab-subtitle">Kelola katalog produk jual, brand / merek (SAREN ONE, EAT GOW, BEULEUM), harga, &amp; stok siap jual</p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => { setImportedRows([]); setShowImportModal(true); }} title="Import Produk & Download Template Excel">
              <Upload size={16} style={{ color: 'var(--cyan)' }} /> Import Excel
            </button>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Tambah Produk Jual
            </button>
          </div>
        )}
      </div>

      {/* STATS CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}><Package size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Varian Produk</p><h3 className="stat-value">{totalVarian}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Tag size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Brand Aktif</p><h3 className="stat-value">{brandList.length}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Boxes size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Stok Siap Jual</p><h3 className="stat-value">{totalStokReady} Pcs</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><DollarSign size={20} /></div>
          <div className="stat-info"><p className="stat-label">Nilai Persediaan Produk</p><h3 className="stat-value" style={{ fontSize: '1.05rem' }}>{formatRp(totalNilaiPersediaan)}</h3></div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Cari nama produk, brand, varian, atau SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="select-input" style={{ maxWidth: '180px' }}>
          <option value="">Semua Brand</option>
          {brandList.map(b => <option key={b.id || b.nama} value={b.nama}>{b.nama}</option>)}
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
          Belum ada produk penjualan.{canEdit && <span> Klik "+ Tambah Produk Jual" atau "Upload Excel" untuk menambahkan katalog.</span>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(p => (
            <div key={p.id || p._id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '1.25rem', border: '1px solid var(--border-color)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{p.sku}</span>
                  </div>
                  <span className="badge" style={{ background: p.status === 'Tersedia' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: p.status === 'Tersedia' ? '#10b981' : '#ef4444', border: `1px solid ${p.status === 'Tersedia' ? '#10b981' : '#ef4444'}` }}>
                    {p.status}
                  </span>
                </div>

                <h4 style={{ margin: '0.2rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.namaProduk}</h4>

                {/* Brand & Varian & Gramasi Badge Row */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.6rem 0' }}>
                  <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(245,158,11,0.3)' }}>🏷️ {p.brand || 'SAREN ONE'}</span>
                  {p.varian && <span style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 }}>✨ Varian: {p.varian}</span>}
                  {p.gramasi && <span style={{ background: 'var(--bg-secondary)', color: 'var(--emerald)', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 }}>⚖️ {p.gramasi}</span>}
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

      {/* MODAL 1: ADD / EDIT PRODUK FORM */}
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
                  <label className="form-label">Brand Produk *</label>
                  <select className="form-select" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}>
                    {brandList.map(b => <option key={b.id || b.nama} value={b.nama}>{b.nama}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Nama Produk Jual *</label>
                  <input className="form-input" value={form.namaProduk} onChange={e => setForm(f => ({ ...f, namaProduk: e.target.value }))} placeholder="Contoh: Sosis Sapi Premium, Nugget Ayam Crispy" />
                </div>
                <div className="form-group">
                  <label className="form-label">Varian Rasa / Jenis</label>
                  <input className="form-input" value={form.varian} onChange={e => setForm(f => ({ ...f, varian: e.target.value }))} placeholder="Contoh: Original Smoked, Keju Lumer" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gramasi / Ukuran Berat</label>
                  <input className="form-input" value={form.gramasi} onChange={e => setForm(f => ({ ...f, gramasi: e.target.value }))} placeholder="Contoh: 250 gram, 500 gram (12 Pcs)" />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga Jual per Pcs (Rp) *</label>
                  <input className="form-input" type="number" min={0} value={form.hargaJual} onChange={e => setForm(f => ({ ...f, hargaJual: e.target.value }))} placeholder="45000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Stok Siap Jual (Pcs)</label>
                  <input className="form-input" type="number" min={0} value={form.stokReady} onChange={e => setForm(f => ({ ...f, stokReady: e.target.value }))} placeholder="100" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Status Ketersediaan</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Deskripsi / Catatan Produk</label>
                  <textarea className="form-input" rows={3} value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} placeholder="Keterangan singkat varian produk..." />
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

      {/* MODAL 2: KELOLA BRAND MANAGER */}
      {showBrandModal && (
        <div className="modal-overlay" onClick={() => setShowBrandModal(false)}>
          <div className="modal-card modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Tag size={20} style={{ color: 'var(--amber)' }} /> Kelola Brand Produk</h3>
              <button className="modal-close" onClick={() => setShowBrandModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveBrand} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 12, marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                <h5 style={{ margin: '0 0 0.75rem', color: '#fff', fontSize: '0.95rem' }}>{editBrandData ? '✏️ Edit Brand' : '➕ Tambah Brand Baru'}</h5>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nama Brand *</label>
                    <input className="form-input" placeholder="Contoh: SAREN ONE, EAT GOW, BEULEUM..." value={brandForm.nama} onChange={e => setBrandForm(f => ({ ...f, nama: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deskripsi Keterangan</label>
                    <input className="form-input" placeholder="Daging olahan makanan beku..." value={brandForm.deskripsi} onChange={e => setBrandForm(f => ({ ...f, deskripsi: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {editBrandData && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditBrandData(null); setBrandForm({ nama: '', deskripsi: '' }); }}>Batal Edit</button>}
                  <button type="submit" className="btn btn-primary btn-sm"><Check size={14} /> {editBrandData ? 'Simpan Edit Brand' : 'Tambah Brand'}</button>
                </div>
              </form>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama Brand</th>
                      <th>Deskripsi</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandList.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>Belum ada data brand. Tambahkan brand baru di atas.</td></tr>
                    ) : (
                      brandList.map(b => (
                        <tr key={b.id || b._id}>
                          <td><strong style={{ color: 'var(--text-primary)' }}>🏷️ {b.nama}</strong></td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{b.deskripsi || '-'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button className="btn btn-sm btn-outline" onClick={() => handleEditBrand(b)} title="Edit Brand"><Edit3 size={14} /></button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteBrandItem(b)} title="Hapus Brand"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBrandModal(false)}>Selesai</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPORT EXCEL & TEMPLATE DOWNLOAD MODAL */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-card modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Upload size={20} style={{ color: 'var(--cyan)' }} /> Import Katalog Produk dari Excel</h3>
              <button className="modal-close" onClick={() => setShowImportModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {importedRows.length === 0 ? (
                <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <Download size={36} style={{ color: 'var(--emerald)', marginBottom: '0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem', color: '#fff' }}>1. Unduh Template Excel</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Gunakan format template resmi agar data nama produk, brand, harga, dan stok terisi dengan benar.
                    </p>
                    <button className="btn btn-outline" onClick={handleDownloadTemplate} style={{ marginTop: '0.75rem' }}>
                      <Download size={16} style={{ color: 'var(--emerald)' }} /> Download Template Excel (.xlsx)
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <Upload size={36} style={{ color: 'var(--cyan)', marginBottom: '0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem', color: '#fff' }}>2. Upload File Excel Yang Sudah Diisi</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Pilih file .xlsx, .xls, atau .csv dari komputer Anda.
                    </p>
                    <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                      <Upload size={16} /> Pilih File Excel...
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Total Produk Terbaca: <strong style={{ color: '#fff' }}>{importedRows.length}</strong> | Valid: <strong style={{ color: '#10b981' }}>{importedRows.filter(r => r.isValid).length}</strong>
                    </span>
                    <label className="btn btn-sm btn-outline" style={{ cursor: 'pointer' }}>
                      🔄 Pilih File Lain
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: '350px' }}>
                    <table className="table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>SKU</th>
                          <th>Nama Produk</th>
                          <th>Brand</th>
                          <th>Harga (Rp)</th>
                          <th>Stok Siap Jual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importedRows.map((r, i) => (
                          <tr key={i} style={{ opacity: r.isValid ? 1 : 0.6 }}>
                            <td>
                              {r.isValid ? (
                                <span className="badge badge-emerald">✓ Valid</span>
                              ) : (
                                <span className="badge badge-danger" title={r.errorMsg}><AlertCircle size={12} /> {r.errorMsg}</span>
                              )}
                            </td>
                            <td style={{ fontFamily: 'monospace' }}>{r.sku}</td>
                            <td><strong>{r.namaProduk}</strong></td>
                            <td>{r.brand}</td>
                            <td style={{ color: '#10b981', fontWeight: 600 }}>{formatRp(r.hargaJual)}</td>
                            <td>{r.stokReady} Pcs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowImportModal(false); setImportedRows([]); }}>Batal</button>
              {importedRows.length > 0 && (
                <button className="btn btn-primary" onClick={handleConfirmImport} disabled={isImporting || importedRows.filter(r => r.isValid).length === 0}>
                  <Check size={16} /> {isImporting ? 'Meng-import...' : `Konfirmasi Import (${importedRows.filter(r => r.isValid).length} Produk)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-card modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Produk — {showDetail.sku}</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {[
                ['Nama Produk', showDetail.namaProduk],
                ['Brand Produk', showDetail.brand || 'SAREN ONE'],
                ['Varian Rasa', showDetail.varian || '-'],
                ['Gramasi / Ukuran', showDetail.gramasi || '-'],
                ['Harga Jual', formatRp(showDetail.hargaJual)],
                ['Stok Siap Jual', `${showDetail.stokReady} Pcs`],
                ['Status', showDetail.status],
                ['Dibuat Oleh', showDetail.createdBy || '-']
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid var(--border-color)' }}>
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
