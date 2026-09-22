import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Users, Plus, Search, Edit3, Trash2, Phone, MapPin, Tag, Check, X, Building2, AlertTriangle, CreditCard, Star, Download, Upload, FileText, AlertCircle } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { ModernFilterSelect } from './ModernDatePicker';

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

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'TIM_MARKETING', 'SALES'].includes(activeRoleView);

  const uniquePelangganList = useMemo(() => {
    const map = new Map();
    (pelangganList || []).forEach(p => {
      if (!p) return;
      const key = p.id || p._id || p.kode || p.nama;
      if (!map.has(key)) {
        map.set(key, p);
      }
    });
    return Array.from(map.values());
  }, [pelangganList]);

  const filtered = useMemo(() => {
    const res = uniquePelangganList.filter(p => {
      if (!p) return false;
      const q = search.toLowerCase();
      const matchQ = !search || p.nama?.toLowerCase().includes(q) || p.kode?.toLowerCase().includes(q) || p.noHp?.toLowerCase().includes(q) || p.alamat?.toLowerCase().includes(q);
      const matchK = !kategoriFilter || p.kategoriCustomer === kategoriFilter || (kategoriFilter === 'Top Market' && p.kategoriCustomer === 'TM');
      const matchS = !sistemBayarFilter || p.sistemPembayaran === sistemBayarFilter;
      return matchQ && matchK && matchS;
    });

    // Urutkan dari Kode Terkecil (Contoh: C1, C2, C3 ... C80, C81, C82)
    return res.sort((a, b) => {
      const getNum = (str) => {
        if (!str) return 999999;
        const match = String(str).match(/\d+/);
        return match ? parseInt(match[0], 10) : 999999;
      };
      const numA = getNum(a.kode);
      const numB = getNum(b.kode);
      if (numA !== numB) return numA - numB;
      return String(a.kode || '').localeCompare(String(b.kode || ''));
    });
  }, [uniquePelangganList, search, kategoriFilter, sistemBayarFilter]);

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

  // Download Excel Import Template (5 Kolom Sederhana)
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Kode Pelanggan': 'C1',
        'Nama Pelanggan': 'Rajawali Sosis Baso',
        'Kategori Customer': 'Top Market',
        'No WhatsApp': '081234567890',
        'Alamat Lengkap Pengiriman': 'Jl. Rajawali Barat No. 45, Bandung'
      },
      {
        'Kode Pelanggan': 'C2',
        'Nama Pelanggan': 'Toko Berkah Frozen',
        'Kategori Customer': 'Umum',
        'No WhatsApp': '089876543210',
        'Alamat Lengkap Pengiriman': 'Jl. Soekarno Hatta No. 102, Bandung'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Pelanggan');

    worksheet['!cols'] = [
      { wch: 16 }, { wch: 28 }, { wch: 20 }, { wch: 20 }, { wch: 40 }
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

        // Helper Title Case untuk merapikan teks CAPSLOCK menjadi Kapital Huruf Pertama Per Kata
        const toTitleCase = (str) => {
          if (!str || typeof str !== 'string') return '';
          return str
            .toLowerCase()
            .split(' ')
            .map(word => {
              if (!word) return '';
              // Jaga kata singkatan umum seperti RSB, TSB, DLL atau angka/simbol tetap rapi
              if (word.length <= 3 && !['dan', 'atau', 'ke', 'di'].includes(word)) {
                return word.toUpperCase();
              }
              return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
        };

        const parsed = rawJson.map((row, idx) => {
          const kode = String(row['Kode Pelanggan'] || row['Kode'] || `C${pelangganList.length + idx + 1}`).trim().toUpperCase();
          const rawNama = row['Nama Pelanggan / Toko'] || row['Nama Pelanggan'] || row['Nama Toko'] || row['Nama'] || '';
          const nama = toTitleCase(String(rawNama).trim());
          
          let rawKat = String(row['Kategori Customer'] || row['Kategori Pelanggan'] || row['Kategori'] || '').trim();
          let kategoriCustomer = 'Umum';
          if (rawKat) {
            const katLower = rawKat.toLowerCase();
            if (katLower === 'tm' || katLower.includes('top') || katLower.includes('star') || katLower.includes('khusus') || katLower.includes('vip')) {
              kategoriCustomer = 'TM';
            } else if (katLower.includes('umum') || katLower.includes('regular') || katLower.includes('standar')) {
              kategoriCustomer = 'Umum';
            } else {
              kategoriCustomer = toTitleCase(rawKat);
            }
          }

          let sistemPembayaran = row['Sistem Pembayaran'] || row['Sistem Bayar'] || 'COD';
          if (!['COD', 'CBD', 'Tempo'].includes(sistemPembayaran)) sistemPembayaran = 'COD';

          const noHp = String(row['No. WhatsApp / HP'] || row['No HP'] || row['Telepon'] || row['No WhatsApp'] || '');
          const tipe = row['Tipe Kemitraan'] || row['Tipe'] || 'Retail';
          const rawAlamat = row['Alamat Lengkap Pengiriman'] || row['Alamat'] || '';
          const alamat = toTitleCase(String(rawAlamat).trim());
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

  const handleClearAllPelanggan = async () => {
    if (!uniquePelangganList.length) return alert('Tidak ada data pelanggan untuk dihapus.');
    if (!window.confirm(`⚠️ PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SELURUH (${uniquePelangganList.length}) DATA PELANGGAN dari database? Tindakan ini tidak dapat dibatalkan!`)) return;

    if (onDeletePelanggan) {
      for (const p of uniquePelangganList) {
        const id = p.id || p._id;
        if (id) await onDeletePelanggan(id, true);
      }
      if (showAlert) showAlert('Seluruh data pelanggan telah berhasil dikosongkan! 🗑️', 'info', 'Kosongkan Data');
    }
  };

  return (
    <div className="tab-container" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* STATS CARDS RAMPING CLEAN WHITE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #6366f1', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>TOTAL PELANGGAN</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={15} style={{ color: '#4f46e5' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {uniquePelangganList.length} <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 800 }}>Mitra</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #d97706', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>CUSTOMER TOP MARKET</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={15} style={{ color: '#d97706' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#92400e', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {uniquePelangganList.filter(p => p.kategoriCustomer === 'Top Market' || p.kategoriCustomer === 'TM').length} <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 800 }}>Toko</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #0284c7', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>SISTEM TEMPO KREDIT</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={15} style={{ color: '#0284c7' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0369a1', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {uniquePelangganList.filter(p => p.sistemPembayaran === 'Tempo').length} <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 800 }}>Mitra</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #ef4444', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>TOTAL PIUTANG AKTIF</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={15} style={{ color: '#ef4444' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#dc2626', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {formatRp(uniquePelangganList.reduce((s, p) => s + (Number(p.totalPiutang) || 0), 0))}
          </div>
        </div>
      </div>

      {/* TOOLBAR & FILTER CARD */}
      <div style={{
        background: '#ffffff',
        padding: '0.65rem 0.85rem',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        marginBottom: '1rem',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '220px', height: '36px' }}>
            <Search size={15} />
            <input
              placeholder="Cari Kode C1, nama pelanggan, no HP, atau alamat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: '0.8rem' }}
            />
          </div>

          <ModernFilterSelect
            value={kategoriFilter}
            onChange={setKategoriFilter}
            options={KATEGORI_CUSTOMER}
            placeholder="Semua Kategori"
            icon={Star}
            maxWidth="160px"
          />

          <ModernFilterSelect
            value={sistemBayarFilter}
            onChange={setSistemBayarFilter}
            options={SISTEM_PEMBAYARAN}
            placeholder="Semua Sistem Bayar"
            icon={CreditCard}
            maxWidth="170px"
          />
        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button
              className="btn btn-outline-danger"
              onClick={handleClearAllPelanggan}
              title="Hapus Seluruh Data Pelanggan / Customer"
              style={{
                height: '36px',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0 0.85rem',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Trash2 size={15} /> Kosongkan Data
            </button>

            <button
              className="btn btn-emerald"
              onClick={openAdd}
              style={{
                height: '36px',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0 0.95rem',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Plus size={15} /> + Tambah Pelanggan
            </button>
          </div>
        )}
      </div>

      {/* TABLE */}
      {/* TABLE CLEAN WHITE RAMPING */}
      <div className="table-responsive" style={{ borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <table className="custom-table" style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #cbd5e1', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              <th style={{ padding: '0.45rem 0.55rem', whiteSpace: 'nowrap', width: '55px' }}>KODE</th>
              <th style={{ padding: '0.45rem 0.55rem', whiteSpace: 'nowrap' }}>NAMA PELANGGAN</th>
              <th style={{ padding: '0.45rem 0.55rem', whiteSpace: 'nowrap' }}>KATEGORI CUSTOMER</th>
              <th style={{ padding: '0.45rem 0.55rem', whiteSpace: 'nowrap' }}>WHATSAPP / HP</th>
              <th style={{ padding: '0.45rem 0.55rem', whiteSpace: 'nowrap' }}>ALAMAT LENGKAP</th>
              {canEdit && <th style={{ padding: '0.45rem 0.55rem', textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 6 : 5} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem' }}>
                  Belum ada data pelanggan. Klik "+ Tambah Pelanggan" atau "Import Excel" di atas untuk menambahkan pelanggan baru.
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr key={p.id || p._id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.35rem 0.55rem', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {p.kode || `C${i+1}`}
                    </span>
                  </td>
                  <td style={{ padding: '0.35rem 0.55rem', whiteSpace: 'nowrap' }}>
                    <strong style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 800 }}>{p.nama}</strong>
                  </td>
                  <td style={{ padding: '0.35rem 0.55rem', whiteSpace: 'nowrap' }}>
                    {p.kategoriCustomer === 'Top Market' || p.kategoriCustomer === 'TM' ? (
                      <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontSize: '0.68rem', fontWeight: 800, padding: '0.08rem 0.4rem', borderRadius: '4px' }}>
                        ⭐ {p.kategoriCustomer}
                      </span>
                    ) : (
                      <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: '0.68rem', fontWeight: 700, padding: '0.08rem 0.4rem', borderRadius: '4px' }}>
                        {p.kategoriCustomer || 'Umum'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.35rem 0.55rem', whiteSpace: 'nowrap' }}>
                    {p.noHp ? (
                      <a href={`https://wa.me/${p.noHp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontSize: '0.74rem' }}>
                        <Phone size={11} /> {p.noHp}
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '0.35rem 0.55rem', color: '#475569', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                    {p.alamat ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><MapPin size={11} style={{ color: '#0284c7', flexShrink: 0 }} /> {p.alamat}</span> : <span style={{ color: '#94a3b8' }}>-</span>}
                  </td>
                  {canEdit && (
                    <td style={{ padding: '0.35rem 0.55rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => openEdit(p)}
                          title="Edit Pelanggan"
                          style={{ height: '25px', fontSize: '0.68rem', padding: '0 0.45rem', borderRadius: '5px', fontWeight: 700 }}
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteTarget(p)}
                          title="Hapus Pelanggan"
                          style={{ height: '25px', fontSize: '0.68rem', padding: '0 0.45rem', borderRadius: '5px', fontWeight: 700 }}
                        >
                          <Trash2 size={11} /> Hapus
                        </button>
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
                      Gunakan format 5 kolom sederhana: <strong>Kode Pelanggan</strong> (C1, C2), <strong>Nama Pelanggan</strong>, <strong>Kategori Customer</strong> (Top Market/Umum), <strong>No WhatsApp</strong>, dan <strong>Alamat Lengkap Pengiriman</strong>.
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
                          <th>Kategori Customer</th>
                          <th>No. WhatsApp</th>
                          <th>Alamat Lengkap Pengiriman</th>
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
                            <td>{r.noHp || '-'}</td>
                            <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{r.alamat || '-'}</td>
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
            <div className="modal-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} style={{ color: 'var(--accent-primary)' }} /> {editData ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!editData && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => { setShowModal(false); setShowImportModal(true); }}
                    style={{ height: '30px', fontSize: '0.72rem', fontWeight: 700, padding: '0 0.65rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Upload size={13} style={{ color: '#0284c7' }} /> Import Excel
                  </button>
                )}
                <button className="modal-close" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem' }}><X size={18} /></button>
              </div>
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

                {!editData && (
                  <div style={{ marginTop: '1.2rem', padding: '0.75rem 0.9rem', borderRadius: '10px', background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155' }}>Punya banyak data pelanggan sekaligus?</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Upload file Excel (.xlsx) untuk menambahkan otomatis.</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => { setShowModal(false); setShowImportModal(true); }}
                      style={{ height: '30px', fontSize: '0.72rem', fontWeight: 800, padding: '0 0.75rem', borderRadius: '6px', whiteSpace: 'nowrap' }}
                    >
                      <Upload size={13} style={{ color: '#0284c7' }} /> Import Excel
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" style={{ height: '34px', fontSize: '0.78rem', fontWeight: 700, padding: '0 0.85rem', borderRadius: '7px' }} onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-emerald" style={{ height: '34px', fontSize: '0.78rem', fontWeight: 800, padding: '0 1rem', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Check size={15} /> {editData ? 'Simpan Edit' : 'Simpan Pelanggan'}
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
