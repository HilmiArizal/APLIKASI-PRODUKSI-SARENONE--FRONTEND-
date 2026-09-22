import React, { useState, useMemo } from 'react';
import { Search, Plus, FileSpreadsheet, FileText, Trash2, Edit3, Calendar, PackageCheck, Download, Info, CheckCircle2, Layers } from 'lucide-react';
import { formatNumber, INITIAL_PRODUK_MASTER } from '../data/initialData';
import { ModernMonthPicker } from './ModernDatePicker';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { ModalCatatHasilProduksi, ModalImportHasilProduksiExcel, ModalMappingKemasanProduk } from './Modals';

export default function HasilProduksiTab({
  hasilProduksi = [],
  produkList = [],
  bahanBaku = [],
  savedHppList = [],
  riwayatProduksi = [],
  activeRoleView,
  isReadOnlyMode = false,
  onSaveHasilProduksi,
  onImportHasilProduksi,
  onDeleteHasilProduksi,
  onSaveMapping,
  onOpenPdfPreview,
  showAlert
}) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthStr = todayStr.substring(0, 7); // e.g. "2026-08"

  const [search, setSearch] = useState('');
  const [filterBulan, setFilterBulan] = useState(currentMonthStr);
  const [isModalInputOpen, setIsModalInputOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalMappingOpen, setIsModalMappingOpen] = useState(false);

  const canManage = !isReadOnlyMode && ['ADMIN', 'BAHAN_BAKU', 'PRODUKSI'].includes(activeRoleView);

  // Master product list with full item names
  const allProducts = INITIAL_PRODUK_MASTER;

  const calculateSyncedHppUnit = (item) => {
    if (!item) return 0;

    const targetDate = item.tanggal ? String(item.tanggal).substring(0, 10) : (item.timestamp ? String(item.timestamp).substring(0, 10) : '');
    const itemAlias = String(item.alias || item.kode || '').trim().toUpperCase();
    const itemName = String(item.produkNama || '').trim().toLowerCase();

    // 1. Prioritize savedHppList exact date & product match
    const matchedHppLog = (savedHppList || []).find(log => {
      const logDate = String(log.tanggal || '').substring(0, 10);
      const dateMatch = !targetDate || !logDate || logDate === targetDate;
      if (!dateMatch) return false;

      const logProd = String(log.produkNama || '').trim().toLowerCase();
      return logProd && (
        itemName.includes(logProd) ||
        logProd.includes(itemName) ||
        itemAlias.toLowerCase().includes(logProd) ||
        logProd.includes(itemAlias.toLowerCase()) ||
        (itemAlias.startsWith('RCS') && logProd.includes('rcs')) ||
        (itemAlias.startsWith('SCM') && logProd.includes('scm')) ||
        (itemAlias.startsWith('BS') && logProd.includes('bs')) ||
        (itemAlias.startsWith('BLP') && logProd.includes('blp'))
      );
    }) || (savedHppList || []).find(log => {
      const logProd = String(log.produkNama || '').trim().toLowerCase();
      return logProd && (
        itemName.includes(logProd) ||
        logProd.includes(itemName) ||
        itemAlias.toLowerCase().includes(logProd) ||
        logProd.includes(itemAlias.toLowerCase()) ||
        (itemAlias.startsWith('RCS') && logProd.includes('rcs')) ||
        (itemAlias.startsWith('SCM') && logProd.includes('scm')) ||
        (itemAlias.startsWith('BS') && logProd.includes('bs')) ||
        (itemAlias.startsWith('BLP') && logProd.includes('blp'))
      );
    });

    if (matchedHppLog) {
      if (itemAlias.includes('250') || itemName.includes('250')) {
        if (matchedHppLog.hpp250g && Number(matchedHppLog.hpp250g) > 0) return Number(matchedHppLog.hpp250g);
      }
      if (itemAlias.includes('300') || itemName.includes('300')) {
        if (matchedHppLog.hpp250g && Number(matchedHppLog.hpp250g) > 0) return Math.round(Number(matchedHppLog.hpp250g) * 1.2);
      }
      if (itemAlias.includes('500') || itemName.includes('500')) {
        if (matchedHppLog.hpp500g && Number(matchedHppLog.hpp500g) > 0) return Number(matchedHppLog.hpp500g);
      }
      if (itemAlias.includes('900') || itemName.includes('900')) {
        if (matchedHppLog.hpp900g && Number(matchedHppLog.hpp900g) > 0) return Number(matchedHppLog.hpp900g);
      }
      if (itemAlias.includes('1000') || itemAlias.includes('1KG') || itemName.includes('1000') || itemName.includes('1kg')) {
        const val1kg = matchedHppLog.hpp1000g || matchedHppLog.hpp1kg || matchedHppLog.hpp1Kg;
        if (val1kg && Number(val1kg) > 0) return Number(val1kg);
      }
      if (matchedHppLog.hppPerKgWaste && Number(matchedHppLog.hppPerKgWaste) > 0) {
        if (itemAlias.includes('250')) return Math.round(Number(matchedHppLog.hppPerKgWaste) * 0.25);
        if (itemAlias.includes('300')) return Math.round(Number(matchedHppLog.hppPerKgWaste) * 0.30);
        if (itemAlias.includes('500')) return Math.round(Number(matchedHppLog.hppPerKgWaste) * 0.50);
        if (itemAlias.includes('900')) return Math.round(Number(matchedHppLog.hppPerKgWaste) * 0.90);
        if (itemAlias.includes('1000') || itemAlias.includes('1KG')) return Math.round(Number(matchedHppLog.hppPerKgWaste) * 1.00);
      }
    }

    if (item.hppPerPack && item.hppPerPack > 0 && item.hppPerPack !== item.harga) {
      return item.hppPerPack;
    }

    return Number(item.harga || 0);
  };

  const normalizeDateStr = (str) => {
    if (!str) return '';
    const s = String(str).trim();
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    if (s.includes('-')) {
      const parts = s.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return s.substring(0, 10);
  };

  // Filtered yield entries for active month & search query
  const filteredYieldList = useMemo(() => {
    return (hasilProduksi || []).filter(item => {
      const itemDateNorm = normalizeDateStr(item.tanggal);
      const matchMonth = filterBulan ? itemDateNorm.startsWith(filterBulan) : true;
      const matchSearch =
        String(item.produkNama || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.alias || item.kode || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.catatan || '').toLowerCase().includes(search.toLowerCase());
      return matchMonth && matchSearch;
    }).sort((a, b) => (b.timestamp || b.tanggal || '').localeCompare(a.timestamp || a.tanggal || ''));
  }, [hasilProduksi, filterBulan, search]);

  const handleSaveWrapper = async (newEntry) => {
    if (onSaveHasilProduksi) {
      await onSaveHasilProduksi(newEntry);
    }
    if (newEntry && newEntry.tanggal) {
      const entryMonth = normalizeDateStr(newEntry.tanggal).substring(0, 7);
      setFilterBulan(entryMonth);
    }
  };

  // Compute daily metrics
  const totalYieldPcs = useMemo(() => {
    return filteredYieldList.reduce((acc, curr) => acc + (parseFloat(curr.jumlahPcs) || 0), 0);
  }, [filteredYieldList]);

  const uniqueVariantCount = useMemo(() => {
    const set = new Set(filteredYieldList.map(item => item.alias || item.produkNama));
    return set.size;
  }, [filteredYieldList]);

  const totalYieldValue = useMemo(() => {
    return filteredYieldList.reduce((acc, item) => {
      const qty = parseFloat(item.jumlahPcs) || 0;
      const hppUnit = calculateSyncedHppUnit(item);
      return acc + (qty * hppUnit);
    }, 0);
  }, [filteredYieldList, savedHppList]);

  // Handle Export Excel
  const handleExportExcel = () => {
    const headers = ['No', 'ID Transaksi', 'Tanggal', 'Kode Alias', 'Nama Produk Jadi', 'Brand', 'Jumlah Hasil (Pack/Pcs)', 'Catatan / Shift'];
    const rows = filteredYieldList.map((item, idx) => [
      idx + 1,
      item.id || '-',
      item.tanggal || '-',
      item.alias || item.kode || '-',
      item.produkNama || '-',
      item.brand || '-',
      item.jumlahPcs,
      item.catatan || '-'
    ]);
    exportToExcel(`Laporan_Hasil_Produksi_${filterTanggal || 'Semua'}`, headers, rows);
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    const headers = ['Tanggal', 'Kode Alias', 'Nama Produk Jadi', 'Hasil Produksi', 'Catatan / Shift'];
    const rows = filteredYieldList.map(item => [
      item.tanggal || '-',
      item.alias || item.kode || '-',
      item.produkNama || '-',
      `${formatNumber(item.jumlahPcs)} ${item.satuan || 'pack'}`,
      item.catatan || '-'
    ]);
    const config = {
      title: 'Jurnal Output Hasil Produksi Barang Jadi',
      subtitle: `Catatan Hasil Penimbangan & Pembungkusan Produk Jadi (Periode Position: ${filterTanggal || 'Semua Tanggal'}).`,
      headers,
      rows,
      summaryText: `Total Output: ${formatNumber(totalYieldPcs)} Pack/Pcs | Variants: ${uniqueVariantCount} Jenis Produk | Est. Nilai: Rp ${formatNumber(totalYieldValue)}`,
      filename: `Jurnal_Hasil_Produksi_${filterTanggal || 'Semua'}`
    };
    if (onOpenPdfPreview) {
      onOpenPdfPreview(config);
    } else {
      exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
    }
  };

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      {/* ===== HEADER BANNER ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 45%, #09132b 100%)',
        color: '#ffffff',
        padding: '0.85rem 1.15rem',
        borderRadius: '12px',
        marginBottom: '0.75rem',
        boxShadow: '0 6px 20px rgba(2, 132, 199, 0.25)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#ffffff' }}>
            <PackageCheck size={20} style={{ color: '#38bdf8' }} /> {isReadOnlyMode ? 'Penerimaan Pembelian Produk' : 'Pencatatan Hasil Produksi'}
          </h2>
          <p style={{ fontSize: '0.76rem', margin: '0.2rem 0 0 0', opacity: 0.95, color: '#e2e8f0' }}>
            {isReadOnlyMode ? 'Daftar penerimaan produk jadi hasil olahan produksi tim Dapur & Bahan Baku.' : 'Catat hasil akhir pembungkusan sosis & produk beku harian. Sisa stok kemasan otomatis berkurang sesuai pemetaan.'}
          </p>
        </div>

        {canManage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn"
              onClick={() => setIsModalMappingOpen(true)}
              style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800, border: '1px solid #fde68a', height: '32px', fontSize: '0.78rem', padding: '0 0.75rem', borderRadius: '6px' }}
              title="Atur jenis vacumbag & stiker per produk"
            >
              ⚙️ Pemetaan Kemasan
            </button>
            <button
              type="button"
              className="btn btn-emerald"
              onClick={() => {
                setEditingItem(null);
                setIsModalInputOpen(true);
              }}
              style={{ fontWeight: 800, height: '32px', fontSize: '0.78rem', padding: '0 0.75rem', borderRadius: '6px', boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} /> + Catat Hasil Produksi
            </button>
          </div>
        )}
      </div>

      {/* ===== KPI SUMMARY METRICS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(56, 189, 248, 0.25)', borderTop: '3.5px solid var(--cyan)', borderRadius: '10px', padding: '0.75rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Total Output ({filterBulan === currentMonthStr ? 'Bulan Ini' : (filterBulan || 'Semua Month')})
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageCheck size={16} style={{ color: 'var(--cyan)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {formatNumber(totalYieldPcs)} <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>Pack/Pcs</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem', display: 'block' }}>
            Hasil Akhir Dapur &amp; Pembungkusan
          </span>
        </div>

        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(16, 185, 129, 0.25)', borderTop: '3.5px solid var(--emerald)', borderRadius: '10px', padding: '0.75rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Jumlah Variasi Produk
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} style={{ color: 'var(--emerald)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {uniqueVariantCount} <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>Varian Item</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem', display: 'block' }}>
            Termasuk Kode Alias &amp; Nama Lengkap
          </span>
        </div>

        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(168, 85, 247, 0.25)', borderTop: '3.5px solid #a855f7', borderRadius: '10px', padding: '0.75rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Estimasi Nilai Hasil Produksi
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} style={{ color: '#c084fc' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            Rp {formatNumber(totalYieldValue)}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem', display: 'block' }}>
            Berdasarkan HPP Master Sosis
          </span>
        </div>
      </div>

      {/* ===== TOOLBAR & CONTROL BAR ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ height: '32px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Cari kode alias (RCS, FS, BS)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: '0.78rem' }}
            />
          </div>

          <ModernMonthPicker
            value={filterBulan}
            onChange={(val) => setFilterBulan(val === 'semua' ? '' : val)}
            allowAll={true}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
          <button className="btn btn-sm btn-outline" onClick={handleExportExcel} style={{ fontSize: '0.75rem', height: '32px', fontWeight: 800 }}>
            <FileSpreadsheet size={14} style={{ color: 'var(--emerald)' }} /> Excel
          </button>
          <button className="btn btn-sm btn-outline" onClick={handleExportPDF} style={{ fontSize: '0.75rem', height: '32px', fontWeight: 800 }}>
            <FileText size={14} style={{ color: 'var(--amber)' }} /> PDF
          </button>
        </div>
      </div>

      {/* ===== JURNAL TABEL HASIL PRODUKSI ===== */}
      <div className="table-container" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <table className="custom-table" style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'center', width: '35px', whiteSpace: 'nowrap' }}>NO</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>TANGGAL</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>KODE ALIAS</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>NAMA PRODUK JADI</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>BRAND</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>HASIL PRODUKSI</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>HPP / PACK</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>TOTAL HPP MODAL</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>CATATAN / SHIFT</th>
              {canManage && <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filteredYieldList.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 10 : 9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <Info size={28} style={{ color: '#0284c7', marginBottom: '0.35rem' }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                    {filterBulan ? `Belum ada catatan hasil produksi untuk periode bulan ${filterBulan}.` : 'Belum ada catatan hasil produksi.'}
                  </p>

                  {(hasilProduksi || []).length > 0 ? (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#0369a1', fontWeight: 600 }}>
                        💡 Terdapat <strong>{(hasilProduksi || []).length} data hasil produksi</strong> yang tersimpan pada bulan lain!
                      </p>
                      <button
                        type="button"
                        className="btn btn-amber"
                        onClick={() => setFilterBulan('')}
                        style={{ fontWeight: 800, padding: '0.4rem 0.85rem', fontSize: '0.75rem', boxShadow: '0 3px 10px rgba(217, 119, 6, 0.2)', border: 'none' }}
                      >
                        📋 Tampilkan Semua Bulan ({(hasilProduksi || []).length} Data Catatan)
                      </button>
                    </div>
                  ) : (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                      Klik tombol <strong>"+ Catat Hasil Produksi"</strong> di pojok kanan atas untuk menambah data baru.
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              filteredYieldList.map((item, idx) => {
                const qty = parseFloat(item.jumlahPcs) || 0;
                const hppUnit = calculateSyncedHppUnit(item);
                const totalHppItem = qty * hppUnit;

                return (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'center', color: '#64748b', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td style={{ padding: '0.32rem 0.55rem', fontWeight: 600, color: '#64748b', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                      {item.tanggal || '-'}
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px' }}>
                        {item.alias || item.kode || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', fontWeight: 800, color: '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                      {item.produkNama || '-'}
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                        {item.brand || 'SAREN ONE'}
                      </span>
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', fontWeight: 900, color: '#059669', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      +{formatNumber(qty)} <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{item.satuan || 'pack'}</span>
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                      Rp {formatNumber(hppUnit)}
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', fontWeight: 900, color: '#7c3aed', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                      Rp {formatNumber(totalHppItem)}
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', color: '#64748b', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                      {item.catatan || '-'}
                    </td>
                    {canManage && (
                      <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            style={{
                              background: '#f0f9ff',
                              color: '#0284c7',
                              border: '1px solid #bae6fd',
                              borderRadius: '5px',
                              width: '24px',
                              height: '24px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalInputOpen(true);
                            }}
                            title="Edit Catatan Hasil Produksi"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            type="button"
                            style={{
                              background: '#fef2f2',
                              color: '#ef4444',
                              border: '1px solid #fecaca',
                              borderRadius: '5px',
                              width: '24px',
                              height: '24px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => {
                              if (onDeleteHasilProduksi) onDeleteHasilProduksi(item.id);
                            }}
                            title="Hapus Catatan Hasil Produksi"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== MODAL FORMS ===== */}
      <ModalCatatHasilProduksi
        isOpen={isModalInputOpen}
        onClose={() => {
          setIsModalInputOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveWrapper}
        editingItem={editingItem}
        produkList={allProducts}
        showAlert={showAlert}
      />

      <ModalMappingKemasanProduk
        isOpen={isModalMappingOpen}
        onClose={() => setIsModalMappingOpen(false)}
        onSaveMapping={onSaveMapping}
        bahanBaku={bahanBaku}
        showAlert={showAlert}
      />
    </div>
  );
}
