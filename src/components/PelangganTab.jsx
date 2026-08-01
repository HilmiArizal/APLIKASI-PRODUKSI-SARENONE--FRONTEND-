import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Users, Plus, Search, Edit3, Trash2, Phone, MapPin, Tag, Check, X, Building2, AlertTriangle, CreditCard, Star, Download, Upload, FileText, AlertCircle } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

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
  onBulkCreatePelanggan,
  onOpenPdfPreview,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [sistemBayarFilter, setSistemBayarFilter] = useState('');

  // Modal Form State
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

  // Modal Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Modal Import Excel State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedRows, setImportedRows] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

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

  // Export Excel
  const handleExportExcel = () => {
    const headers = ['Kode', 'Nama Pelanggan / Toko', 'Kategori Customer', 'Sistem Pembayaran', 'WhatsApp / HP', 'Tipe', 'Alamat Pengiriman', 'Total Piutang (Rp)', 'Catatan'];
    const rows = filtered.map(p => [
      p.kode || '-',
      p.nama,
      p.kategoriCustomer || 'Umum',
      p.sistemPembayaran || 'COD',
      p.noHp || '-',
      p.tipe || 'Retail',
      p.alamat || '-',
      p.totalPiutang || 0,
      p.catatan || '-'
    ]);
    exportToExcel('Data_Pelanggan_Customer_SarenOne', headers, rows);
  };

  // Export PDF
  const handleExportPDF = () => {
    const headers = ['Kode', 'Nama & Toko', 'Kategori', 'Sistem Bayar', 'Kontak HP', 'Alamat Pengiriman', 'Piutang'];
    const rows = filtered.map(p => [
      p.kode || '-',
      `${p.nama}\n(${p.tipe || 'Retail'})`,
      p.kategoriCustomer || 'Umum',
      p.sistemPembayaran || 'COD',
      p.noHp || '-',
      p.alamat || '-',
      formatRp(p.totalPiutang)
    ]);
    const config = {
      title: 'Master Data Pelanggan & Customer Saren One',
      subtitle: `Daftar pelanggan, kategori, sistem bayar, dan status piutang aktif.`,
      headers,
      rows,
      summaryText: `Total Pelanggan: ${filtered.length} | Total Piutang Aktif: ${formatRp(filtered.reduce((s, p) => s + (p.totalPiutang || 0), 0))}`,
      filename: 'Data_Pelanggan_Customer_SarenOne'
    };
    if (onOpenPdfPreview) onOpenPdfPreview(config);
    else exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
  };

  // Download Excel Import Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Kode Pelanggan': 'C1',
        'Nama Pelanggan / Toko': 'Rajawali Sosis Baso',
        'Kategori Customer': 'Top Market',
        'Sistem Pembayaran': 'Tempo',
        'No. WhatsApp / HP': '081234567890',
        'Tipe Kemitraan': 'Distributor',
        'Alamat Lengkap Pengiriman': 'Jl. Rajawali Barat No. 45, Bandung',
        'Total Piutang (Rp)': 0,
        'Catatan': 'Mitra utama agen wilayah Bandung'
      },
      {
        'Kode Pelanggan': 'C2',
        'Nama Pelanggan / Toko': 'Toko Berkah Frozen',
        'Kategori Customer': 'Umum',
        'Sistem Pembayaran': 'COD',
        'No. WhatsApp / HP': '089876543210',
        'Tipe Kemitraan': 'Retail',
        'Alamat Lengkap Pengiriman': 'Jl. Soekarno Hatta No. 102, Bandung',
        'Total Piutang (Rp)': 0,
        'Catatan': 'Pengiriman hari Selasa dan Jumat'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Pelanggan');

    worksheet['!cols'] = [
      { wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 16 }, { wch: 35 }, { wch: 18 }, { wch: 30 }
    ];

    XLSX.writeFile(workbook, 'Template_Import_Pelanggan_SarenOne.xlsx');
  };

  // Handle Excel Upload & Parsing
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
          const kode = row['Kode Pelanggan'] || row['Kode'] || `C${pelangganList.length + idx + 1}`;
          const nama = row['Nama Pelanggan / Toko'] || row['Nama Pelanggan'] || row['Nama Toko'] || row['Nama'] || '';
          
          let kategoriCustomer = row['Kategori Customer'] || row['Kategori'] || 'Umum';
          if (!['Top Market', 'Umum'].includes(kategoriCustomer)) kategoriCustomer = 'Umum';

          let sistemPembayaran = row['Sistem Pembayaran'] || row['Sistem Bayar'] || 'COD';
          if (!['COD', 'CBD', 'Tempo'].includes(sistemPembayaran)) sistemPembayaran = 'COD';

          const noHp = String(row['No. WhatsApp / HP'] || row['No HP'] || row['Telepon'] || '');
          const tipe = row['Tipe Kemitraan'] || row['Tipe'] || 'Retail';
          const alamat = row['Alamat Lengkap Pengiriman'] || row['Alamat'] || '';
          const totalPiutang = Number(row['Total Piutang (Rp)'] || row['Total Piutang'] || row['Piutang'] || 0);
          const catatan = row['Catatan'] || '';

          const isValid = !!nama.trim();

          return {
            id: `import_${idx}_${Date.now()}`,
            kode,
            nama,
            kategoriCustomer,
            sistemPembayaran,
            noHp,
            tipe,
            alamat,
            totalPiutang,
            catatan,
            isValid,
            errorMsg: !nama.trim() ? 'Nama Pelanggan kosong' : ''
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

  // Confirm Excel Import
  const handleConfirmImport = async () => {
    const validRows = importedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      if (showAlert) showAlert('Tidak ada data pelanggan valid untuk di-import!', 'warning');
      return;
    }

    setIsImporting(true);
    try {
      if (onBulkCreatePelanggan) {
        await onBulkCreatePelanggan(validRows);
      } else {
        for (const r of validRows) {
          if (onCreatePelanggan) {
            await onCreatePelanggan({
              kode: r.kode,
              nama: r.nama,
              kategoriCustomer: r.kategoriCustomer,
              sistemPembayaran: r.sistemPembayaran,
              noHp: r.noHp,
              tipe: r.tipe,
              alamat: r.alamat,
              totalPiutang: r.totalPiutang,
              catatan: r.catatan
            });
          }
        }
      }

      if (showAlert) {
        showAlert(`Berhasil meng-import ${validRows.length} data pelanggan baru! 🎉`, 'success', 'Import Berhasil');
      }
      setShowImportModal(false);
      setImportedRows([]);
    } catch (err) {
      if (showAlert) showAlert(`Gagal meng-import data pelanggan: ${err.message}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

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
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel} title="Export ke Excel">
            <Download size={16} style={{ color: 'var(--emerald)' }} /> Excel
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} title="Export ke PDF">
            <FileText size={16} style={{ color: '#ef4444' }} /> PDF
          </button>
          {canEdit && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
                <Upload size={16} style={{ color: 'var(--cyan)' }} /> Import Excel
              </button>
              <button className="btn btn-primary" onClick={openAdd}>
                <Plus size={16} /> Tambah Pelanggan
              </button>
            </>
          )}
        </div>
      </div>

      {/* STATS SUMMARY */}
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
                  Belum ada data pelanggan. Klik "+ Tambah Pelanggan" atau "Import Excel" di atas untuk menambahkan pelanggan baru.
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

      {/* MODAL 1: IMPORT EXCEL PELANGGAN */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => { setShowImportModal(false); setImportedRows([]); }}>
          <div className="modal-card modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3><Upload size={20} style={{ color: 'var(--cyan)' }} /> Import Data Pelanggan / Customer Excel</h3>
              <button className="modal-close" onClick={() => { setShowImportModal(false); setImportedRows([]); }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {importedRows.length === 0 ? (
                <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <Download size={36} style={{ color: 'var(--emerald)', marginBottom: '0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem', color: '#fff' }}>1. Unduh Template Excel Pelanggan</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Gunakan format template resmi agar data Kode (C1, C2), Nama Toko, Kategori (Top Market/Umum), dan Sistem Bayar (COD/CBD/Tempo) terisi dengan benar.
                    </p>
                    <button className="btn btn-outline" onClick={handleDownloadTemplate} style={{ marginTop: '0.75rem' }}>
                      <Download size={16} style={{ color: 'var(--emerald)' }} /> Download Template Excel Pelanggan (.xlsx)
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
                      Total Pelanggan Terbaca: <strong style={{ color: '#fff' }}>{importedRows.length}</strong> | Valid: <strong style={{ color: '#10b981' }}>{importedRows.filter(r => r.isValid).length}</strong>
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
                          <th>Kode</th>
                          <th>Nama Pelanggan</th>
                          <th>Kategori</th>
                          <th>Sistem Bayar</th>
                          <th>No. WhatsApp</th>
                          <th>Tipe</th>
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
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)' }}>{r.kode}</td>
                            <td><strong>{r.nama}</strong></td>
                            <td><span className="badge">{r.kategoriCustomer}</span></td>
                            <td><span className="badge">{r.sistemPembayaran}</span></td>
                            <td>{r.noHp || '-'}</td>
                            <td>{r.tipe}</td>
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
                  <Check size={16} /> {isImporting ? 'Meng-import Data...' : `Import ${importedRows.filter(r => r.isValid).length} Pelanggan`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT PELANGGAN FORM */}
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

      {/* MODAL 3: KONFIRMASI HAPUS PELANGGAN */}
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
