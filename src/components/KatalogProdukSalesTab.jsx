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

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'SALES'].includes(activeRoleView);

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
    gramasi: '',
    brand: safeBrandList[0]?.nama || 'SAREN ONE',
    hargaPabrik: 0,
    hargaTopMarket: 0,
    hargaUmum: 0,
    stokReady: 0,
    deskripsi: '',
    status: 'Tersedia'
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    return produkSalesList
      .filter(p => {
        const q = search.toLowerCase();
        const matchQ = !search || p.namaProduk?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
        const matchB = !brandFilter || p.brand === brandFilter;
        return matchQ && matchB;
      })
      .sort((a, b) => {
        const skuA = a.sku || '';
        const skuB = b.sku || '';
        return skuA.localeCompare(skuB, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [produkSalesList, search, brandFilter]);

  const totalProduk = produkSalesList.length;
  const totalStokReady = useMemo(() => produkSalesList.reduce((s, p) => s + (Number(p.stokReady) || 0), 0), [produkSalesList]);
  const totalNilaiPersediaanPabrik = useMemo(() => produkSalesList.reduce((s, p) => s + ((Number(p.stokReady) || 0) * (Number(p.hargaPabrik || p.hargaUmum) || 0)), 0), [produkSalesList]);

  // Product CRUD
  const openAdd = () => {
    setEditData(null);
    setForm({
      ...emptyForm,
      sku: '',
      brand: brandList[0]?.nama || 'SAREN ONE'
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditData(p);
    setForm({
      sku: p.sku || '',
      namaProduk: p.namaProduk || '',
      gramasi: p.gramasi || '',
      brand: p.brand || (brandList[0]?.nama || 'SAREN ONE'),
      hargaPabrik: p.hargaPabrik || 0,
      hargaTopMarket: p.hargaTopMarket || p.hargaPabrik || 0,
      hargaUmum: p.hargaUmum || p.hargaPabrik || 0,
      stokReady: p.stokReady || 0,
      deskripsi: p.deskripsi || '',
      status: p.status || 'Tersedia'
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.namaProduk.trim()) { showAlert('Nama produk wajib diisi!', 'error'); return; }
    if ((!form.hargaTopMarket || Number(form.hargaTopMarket) <= 0) && (!form.hargaUmum || Number(form.hargaUmum) <= 0)) {
      showAlert('Mohon isi harga modal Top Market atau Umum!', 'error');
      return;
    }
    const payload = {
      ...form,
      hargaPabrik: form.hargaUmum || form.hargaTopMarket || 0
    };

    if (editData) {
      await onUpdateProdukSales(editData.id || editData._id, payload);
    } else {
      await onCreateProdukSales(payload);
    }
    setShowModal(false);
  };

  const handleDelete = async (p) => {
    if (!confirm(`Hapus produk "${p.namaProduk}" dari katalog?`)) return;
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

  // Handle Clear / Delete All Products
  const handleDeleteAllProducts = async () => {
    if (produkSalesList.length === 0) {
      if (showAlert) showAlert('Katalog produk sudah kosong.', 'info');
      return;
    }

    if (!confirm(`⚠️ PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA (${produkSalesList.length}) PRODUK di katalog ini?\nTindakan ini tidak dapat dibatalkan!`)) {
      return;
    }

    let count = 0;
    for (const p of produkSalesList) {
      if (onDeleteProdukSales) {
        await onDeleteProdukSales(p.id || p._id, true);
        count++;
      }
    }

    if (showAlert) showAlert(`Berhasil menghapus semua (${count}) produk katalog!`, 'success', 'Katalog Bersih!');
  };

  // Export handlers
  const handleExportExcel = () => {
    const headers = ['SKU', 'Nama Produk', 'Brand', 'Gramasi / Ukuran', 'Harga Modal Top Market (Rp)', 'Harga Modal Umum (Rp)', 'Stok Ready (Pcs)', 'Status'];
    const rows = filtered.map(p => [
      p.sku,
      p.namaProduk,
      p.brand || 'SAREN ONE',
      p.gramasi || '-',
      p.hargaTopMarket || p.hargaPabrik || 0,
      p.hargaUmum || p.hargaPabrik || 0,
      p.stokReady,
      p.status
    ]);
    exportToExcel('Katalog_Produk_Penjualan', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['SKU', 'Nama Produk & Brand', 'Gramasi', 'Modal Top Market', 'Modal Umum', 'Stok Ready'];
    const rows = filtered.map(p => [
      p.sku,
      `${p.namaProduk}\nBrand: ${p.brand || 'SAREN ONE'}`,
      p.gramasi || '-',
      formatRp(p.hargaTopMarket || p.hargaPabrik),
      formatRp(p.hargaUmum || p.hargaPabrik),
      `${p.stokReady} Pcs`
    ]);
    const config = {
      title: 'Katalog Produk Penjualan & Brand',
      subtitle: `Daftar produk, brand, harga modal Top Market, harga modal Umum, dan stok siap jual.`,
      headers,
      rows,
      summaryText: `Total Produk: ${filtered.length} | Total Stok Ready: ${filtered.reduce((a, b) => a + (b.stokReady || 0), 0)} Pcs`,
      filename: 'Katalog_Produk_Penjualan'
    };
    if (onOpenPdfPreview) onOpenPdfPreview(config);
    else exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
  };

  // Download Import Template (Simplified: Kode SKU, Nama Produk, Brand, Gramasi, Harga Modal)
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Kode SKU': 'P1',
        'Nama Produk': 'Red Cocktail Sausage 250g',
        'Brand': 'SAREN ONE',
        'Gramasi / Ukuran': '250',
        'Harga Modal (Rp)': 35000
      },
      {
        'Kode SKU': 'P2',
        'Nama Produk': 'Red Cocktail Sausage 500g',
        'Brand': 'SAREN ONE',
        'Gramasi / Ukuran': '500',
        'Harga Modal (Rp)': 22000
      },
      {
        'Kode SKU': 'P3',
        'Nama Produk': 'Red Cocktail Sausage 900g',
        'Brand': 'SAREN ONE',
        'Gramasi / Ukuran': '900',
        'Harga Modal (Rp)': 46000
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Katalog');

    worksheet['!cols'] = [
      { wch: 14 }, { wch: 32 }, { wch: 20 }, { wch: 20 }, { wch: 22 }
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
          const keys = Object.keys(row);
          const getVal = (possibleKeys) => {
            for (const pk of possibleKeys) {
              const matchedKey = keys.find(k => k.trim().toLowerCase() === pk.toLowerCase());
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && row[matchedKey] !== '') {
                return row[matchedKey];
              }
            }
            return null;
          };

          const parseNumber = (val) => {
            if (val === null || val === undefined) return 0;
            if (typeof val === 'number') return val;
            const str = String(val).replace(/[^0-9.]/g, '');
            return Number(str) || 0;
          };

          const sku = String(getVal(['Kode SKU', 'Kode', 'SKU']) || `P${idx + 1}`).trim();
          const namaProduk = String(getVal(['Nama Produk', 'Nama']) || '').trim();
          const brand = String(getVal(['Brand']) || 'SAREN ONE').trim();
          const gramasi = String(getVal(['Gramasi / Ukuran', 'Gramasi / Ukuran Berat', 'Gramasi']) || '').trim();

          const rawModalVal = getVal([
            'Harga Modal (Rp)',
            'Harga Modal',
            'Harga Modal Top Market (Rp)',
            'Harga Modal Top Market',
            'Harga Modal Umum (Rp)',
            'Harga Modal Umum',
            'Harga Pabrik (Rp)',
            'Harga Pabrik',
            'Modal'
          ]);

          const hargaModalRaw = parseNumber(rawModalVal);

          const hargaModal = hargaModalRaw;
          const hargaTopMarket = hargaModalRaw;
          const hargaUmum = hargaModalRaw;
          const stokReady = parseNumber(getVal(['Stok Siap Jual', 'Stok Ready', 'Stok']));
          const status = String(getVal(['Status']) || 'Tersedia').trim();
          const deskripsi = String(getVal(['Deskripsi']) || '').trim();

          const isValid = !!namaProduk;

          return {
            id: `import_${idx}_${Date.now()}`,
            sku,
            namaProduk,
            brand,
            gramasi,
            hargaTopMarket,
            hargaUmum,
            hargaPabrik: hargaModalRaw,
            stokReady,
            status,
            deskripsi,
            isValid,
            errorMsg: !namaProduk ? 'Nama Produk kosong' : ''
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

    // 1. Bersihkan / Hapus semua produk lama agar katalog ter-replace total sesuai file Excel baru
    for (const oldProd of produkSalesList) {
      if (onDeleteProdukSales) {
        await onDeleteProdukSales(oldProd.id || oldProd._id, true);
      }
    }

    // 2. Insert produk baru dari Excel
    let createdCount = 0;
    for (const r of validRows) {
      const payload = {
        sku: r.sku,
        namaProduk: r.namaProduk,
        brand: r.brand,
        gramasi: r.gramasi,
        hargaModal: r.hargaModal,
        hargaTopMarket: r.hargaModal,
        hargaUmum: r.hargaModal,
        hargaPabrik: r.hargaModal,
        stokReady: r.stokReady,
        status: r.status,
        deskripsi: r.deskripsi
      };
      if (onCreateProdukSales) {
        await onCreateProdukSales(payload, true);
        createdCount++;
      }
    }

    setIsImporting(false);
    setShowImportModal(false);
    setImportedRows([]);

    if (showAlert) showAlert(`Katalog berhasil diperbarui total! (${createdCount} produk dari file Excel baru). Produk lama telah dibersihkan. 🎉`, 'success', 'Import & Replace Berhasil!');
  };

  return (
    <div className="tab-container">
      {/* STATS CARDS (COMPACT & RESPONSIVE RAPI) */}
      {/* STATS CARDS (LAYOUT 2 BARIS: JUDUL DI BARIS 1, LOGO + ANGKA DI BARIS 2) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
        {/* Card 1: Total Item Produk */}
        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(56, 189, 248, 0.25)', borderTop: '3.5px solid var(--cyan)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            TOTAL ITEM PRODUK
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={14} style={{ color: 'var(--cyan)' }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
              {totalProduk} <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8' }}>Varian</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Brand Aktif */}
        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(245, 158, 11, 0.25)', borderTop: '3.5px solid var(--amber)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            TOTAL BRAND AKTIF
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Tag size={14} style={{ color: 'var(--amber)' }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
              {brandList.length} <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f59e0b' }}>Brand</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Stok Siap Jual */}
        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(16, 185, 129, 0.25)', borderTop: '3.5px solid var(--emerald)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            TOTAL STOK SIAP JUAL
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Boxes size={14} style={{ color: 'var(--emerald)' }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
              {totalStokReady} <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#34d399' }}>Pcs</span>
            </div>
          </div>
        </div>

        {/* Card 4: Nilai Persediaan Modal */}
        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(14, 165, 233, 0.25)', borderTop: '3.5px solid #0ea5e9', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            NILAI PERSEDIAAN MODAL
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DollarSign size={14} style={{ color: '#38bdf8' }} />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
              {formatRp(totalNilaiPersediaanPabrik)}
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR UTAMA */}
      <div className="toolbar" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px', height: '36px' }}>
            <Search size={16} />
            <input placeholder="Cari nama produk, brand, atau SKU..." value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: '0.8rem' }} />
          </div>

          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="select-input" style={{ maxWidth: '160px', height: '36px', fontSize: '0.8rem' }}>
            <option value="">🏷️ Semua Brand</option>
            {brandList.map(b => <option key={b.id || b.nama} value={b.nama}>{b.nama}</option>)}
          </select>
        </div>

        <div className="toolbar-actions" style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {canEdit && (
            <button className="btn btn-emerald" onClick={openAdd} style={{ height: '36px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.95rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={15} /> + Tambah Produk
            </button>
          )}

          {canEdit && produkSalesList.length > 0 && (
            <button
              className="btn"
              onClick={handleDeleteAllProducts}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                fontWeight: 800,
                fontSize: '0.78rem',
                height: '36px',
                borderRadius: '8px',
                padding: '0 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title="Hapus seluruh produk katalog saat ini"
            >
              <Trash2 size={15} /> Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 14, border: '2px dashed var(--border-color)' }}>
          <Package size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} /><br />
          Belum ada produk penjualan.{canEdit && <span> Klik "+ Tambah Produk Jual" atau "Import Excel" untuk menambahkan katalog.</span>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
          {filtered.map(p => (
            <div key={p.id || p._id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '0.85rem 0.95rem', border: '1px solid var(--border-color)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '0.1rem 0.45rem', borderRadius: 4 }}>
                    {p.sku}
                  </span>
                  <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: p.status === 'Tersedia' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: p.status === 'Tersedia' ? '#10b981' : '#ef4444', border: `1px solid ${p.status === 'Tersedia' ? '#10b981' : '#ef4444'}` }}>
                    {p.status}
                  </span>
                </div>

                <h4 style={{ margin: '0.2rem 0', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.4em' }}>
                  {p.namaProduk}
                </h4>

                {/* Brand & Gramasi Badge Row */}
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', margin: '0.45rem 0 0.5rem' }}>
                  <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '1px 6px', borderRadius: 5, fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(245,158,11,0.25)' }}>🏷️ {p.brand || 'SAREN ONE'}</span>
                  {p.gramasi && <span style={{ background: 'var(--bg-secondary)', color: 'var(--emerald)', padding: '1px 6px', borderRadius: 5, fontSize: '0.7rem', fontWeight: 700 }}>⚖️ {p.gramasi}</span>}
                </div>
              </div>

              <div>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 0.65rem', borderRadius: 8, margin: '0.35rem 0 0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>🏷️ Modal:</span>
                    <strong style={{ color: '#0ea5e9', fontSize: '0.9rem', fontWeight: 900 }}>{formatRp(p.hargaModal || p.hargaUmum || p.hargaTopMarket || p.hargaPabrik)}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.55rem' }}>
                  <button className="btn btn-sm btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }} onClick={() => setShowDetail(p)}><Eye size={12} /> Detail</button>
                  {canEdit && (
                    <>
                      <button className="btn btn-sm btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }} onClick={() => openEdit(p)}><Edit3 size={12} /> Edit</button>
                      <button className="btn btn-sm btn-danger" style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem' }} onClick={() => handleDelete(p)}><Trash2 size={12} /></button>
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
              <h3><Package size={20} style={{ color: 'var(--accent-primary)' }} /> {editData ? 'Edit Produk Katalog' : 'Tambah Produk Baru'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {!editData && (
                <div style={{ background: '#f0f9ff', padding: '0.85rem 1rem', borderRadius: 10, marginBottom: '1.25rem', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Upload size={15} /> Punya banyak produk di file Excel?
                    </h5>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#0284c7' }}>
                      Upload sekaligus katalog produk secara otomatis menggunakan file Excel.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setShowModal(false);
                      setImportedRows([]);
                      setShowImportModal(true);
                    }}
                    style={{ background: '#0284c7', color: '#ffffff', fontWeight: 800, fontSize: '0.78rem', padding: '0.4rem 0.85rem', borderRadius: '7px', border: 'none', cursor: 'pointer' }}
                  >
                    📊 Import dari Excel
                  </button>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Kode SKU *</label>
                  <input className="form-input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Contoh: P1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Brand Produk *</label>
                  <select className="form-select" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}>
                    {brandList.map(b => <option key={b.id || b.nama} value={b.nama}>{b.nama}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Nama Produk *</label>
                  <input className="form-input" value={form.namaProduk} onChange={e => setForm(f => ({ ...f, namaProduk: e.target.value }))} placeholder="Contoh: Red Cocktail Sausage 250g" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gramasi / Ukuran</label>
                  <input className="form-input" value={form.gramasi} onChange={e => setForm(f => ({ ...f, gramasi: e.target.value }))} placeholder="Contoh: 250, 500, 900" />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga Modal (Rp) *</label>
                  <input className="form-input" type="number" min={0} value={form.hargaModal || form.hargaUmum || form.hargaTopMarket} onChange={e => setForm(f => ({ ...f, hargaModal: e.target.value, hargaUmum: e.target.value, hargaTopMarket: e.target.value, hargaPabrik: e.target.value }))} placeholder="35000" required />
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
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ width: '92%', maxWidth: '1000px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div className="modal-header" style={{ padding: '1.1rem 1.35rem', borderBottom: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={19} style={{ color: '#0284c7' }} /> Import Katalog Produk dari Excel
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                title="Tutup Modal"
              >
                <X size={17} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem' }}>
              {importedRows.length === 0 ? (
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <Download size={36} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontWeight: 800 }}>1. Unduh Template Excel</h4>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                      Gunakan format template resmi berisi kolom <strong>Kode SKU, Nama Produk, Brand, Gramasi, Harga Modal (Rp)</strong>.
                    </p>
                    <button className="btn btn-outline" onClick={handleDownloadTemplate} style={{ marginTop: '0.75rem', fontWeight: 700, borderRadius: '8px' }}>
                      <Download size={15} style={{ color: '#10b981' }} /> Download Template Excel (.xlsx)
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                    <Upload size={36} style={{ color: '#0284c7', marginBottom: '0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontWeight: 800 }}>2. Upload File Excel Yang Sudah Diisi</h4>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                      Pilih file .xlsx, .xls, atau .csv dari komputer Anda.
                    </p>
                    <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px', fontWeight: 800 }}>
                      <Upload size={15} /> Pilih File Excel...
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <div className="table-responsive" style={{ maxHeight: '420px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <table className="custom-table" style={{ width: '100%', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#475569' }}>
                          <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>Status</th>
                          <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>SKU</th>
                          <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>Nama Produk</th>
                          <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>Brand</th>
                          <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>Gramasi</th>
                          <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap', textAlign: 'right' }}>Harga Modal (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importedRows.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', opacity: r.isValid ? 1 : 0.65 }}>
                            <td style={{ padding: '0.4rem 0.65rem', whiteSpace: 'nowrap' }}>
                              {r.isValid ? (
                                <span style={{ background: '#d1fae5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.7rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '4px' }}>✓ Valid</span>
                              ) : (
                                <span style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontSize: '0.7rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '4px' }} title={r.errorMsg}>
                                  <AlertCircle size={11} /> {r.errorMsg}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.4rem 0.65rem', fontFamily: 'monospace', fontWeight: 800, color: '#0284c7', whiteSpace: 'nowrap' }}>{r.sku}</td>
                            <td style={{ padding: '0.4rem 0.65rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>{r.namaProduk}</td>
                            <td style={{ padding: '0.4rem 0.65rem', whiteSpace: 'nowrap' }}>
                              <span style={{ background: '#fffbebf', color: '#d97706', border: '1px solid #fde68a', fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                {r.brand || 'SAREN ONE'}
                              </span>
                            </td>
                            <td style={{ padding: '0.4rem 0.65rem', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' }}>{r.gramasi || '-'}</td>
                            <td style={{ padding: '0.4rem 0.65rem', textAlign: 'right', fontWeight: 900, color: '#059669', whiteSpace: 'nowrap' }}>
                              {formatRp(r.hargaModal || r.hargaPabrik || r.hargaTopMarket || r.hargaUmum)}
                            </td>
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
                ['Gramasi / Ukuran', showDetail.gramasi || '-'],
                ['Modal Top Market', formatRp(showDetail.hargaTopMarket || showDetail.hargaPabrik)],
                ['Modal Umum', formatRp(showDetail.hargaUmum || showDetail.hargaPabrik)],
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
