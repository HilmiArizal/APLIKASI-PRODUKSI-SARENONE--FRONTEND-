import React, { useState, useMemo } from 'react';
import { Search, Plus, ArrowDownLeft, Edit3, Trash2, FileText, FileSpreadsheet, Tag, Upload, Package, Calendar, History, ClipboardCheck, ArrowUpRight, CheckCircle } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { exportToExcel } from '../utils/exportUtils';
import ModalPreviewPdf from './ModalPreviewPdf';
import { ModalImportBahanExcel } from './Modals';

export default function BahanBakuTab({
  bahanBaku = [],
  kategoriList = [],
  riwayatProduksi = [],
  utangList = [],
  auditLog = [],
  activeRoleView,
  onOpenTambahBahan,
  onOpenEditBahan,
  onOpenStokMasuk,
  onOpenPemakaianKemasan,
  onDeleteBahan,
  onOpenKelolaKategoriBahan,
  onOpenPdfPreview,
  onImportExcelBahan,
  showAlert
}) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [activeSubTab, setActiveSubTab] = useState('stok'); // 'stok' | 'opname-history'
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [filterTanggal, setFilterTanggal] = useState(todayStr);
  const [isPreviewPdfOpen, setIsPreviewPdfOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);

  // Stock Opname Audit Modal States
  const [selectedOpnameBahan, setSelectedOpnameBahan] = useState(null);
  const [stokFisikInput, setStokFisikInput] = useState('');
  const [catatanOpname, setCatatanOpname] = useState('');

  const isSuperAdmin = (activeRoleView === 'ADMIN');
  const canAddOrRestock = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  // Calculate Historical Stock per Specific Date
  const getBahanStokOnDate = (b, targetDateStr) => {
    if (!targetDateStr || targetDateStr === todayStr) return Number(b.stok) || 0;

    let currentStok = Number(b.stok) || 0;
    const bNameLower = String(b.nama || '').trim().toLowerCase();
    const bId = String(b.id || b._id || '');

    // 1. Rollback receipts/restocks after target date (Subtract received qty after target date)
    (utangList || []).forEach(p => {
      const pDate = (p.tanggalPenerimaan || p.tanggalBeli || p.tanggal || '').substring(0, 10);
      if (pDate > targetDateStr) {
        if (p.riwayatPenerimaan && Array.isArray(p.riwayatPenerimaan)) {
          p.riwayatPenerimaan.forEach(r => {
            const rDate = (r.tanggal || r.createdAt || pDate).substring(0, 10);
            if (rDate > targetDateStr) {
              const itemNm = String(r.namaBahan || p.bahanNama || '').trim().toLowerCase();
              if (itemNm === bNameLower || p.sku === b.sku) {
                currentStok -= Number(r.jumlah || r.diterima || 0);
              }
            }
          });
        } else if (Number(p.jumlahDiterima || 0) > 0) {
          const itemNm = String(p.bahanNama || '').trim().toLowerCase();
          if (itemNm === bNameLower || p.sku === b.sku) {
            currentStok -= Number(p.jumlahDiterima || 0);
          }
        }
      }
    });

    // 2. Rollback production usage after target date (Add back consumed qty after target date)
    (riwayatProduksi || []).forEach(r => {
      const rDate = (r.timestamp || r.tanggal || '').substring(0, 10);
      if (rDate > targetDateStr) {
        if (r.bahanDigunakan && Array.isArray(r.bahanDigunakan)) {
          r.bahanDigunakan.forEach(item => {
            const itemNm = String(item.bahanNama || item.nama || '').trim().toLowerCase();
            if (itemNm === bNameLower || item.bahanId === bId) {
              currentStok += Number(item.jumlah || 0);
            }
          });
        }
      }
    });

    return Math.max(0, currentStok);
  };

  // Open Stock Opname Adjustment Modal for a specific material on target date
  const handleOpenOpnameModal = (b) => {
    const stokSistem = getBahanStokOnDate(b, filterTanggal);
    setSelectedOpnameBahan({ ...b, stokSistem });
    setStokFisikInput(String(stokSistem));
    setCatatanOpname('');
  };

  // Save Stock Opname Adjustment
  const handleSaveOpname = async () => {
    if (!selectedOpnameBahan) return;

    const stokSistem = selectedOpnameBahan.stokSistem;
    const stokFisik = Number(stokFisikInput);
    if (isNaN(stokFisik) || stokFisik < 0) {
      showAlert('Masukkan jumlah stok fisik hasil opname yang valid (minimal 0)!', 'error', 'Opname Gagal');
      return;
    }

    const selisih = stokFisik - stokSistem;
    const dateLabel = filterTanggal || todayStr;
    const newRealStok = Math.max(0, (selectedOpnameBahan.stok || 0) + selisih);

    try {
      if (onOpenEditBahan) {
        const updatedItem = {
          ...selectedOpnameBahan,
          stok: newRealStok,
          catatanOpname: catatanOpname ? `[Opname ${dateLabel}]: ${catatanOpname}` : `[Opname ${dateLabel}] Penyesuaian fisik (${selisih >= 0 ? '+' : ''}${selisih})`
        };
        await onOpenEditBahan(updatedItem);
      }

      showAlert(
        `✅ Stock Opname "${selectedOpnameBahan.nama}" tanggal ${dateLabel} berhasil disesuaikan! (Sistem: ${stokSistem} -> Fisik: ${stokFisik}, Selisih: ${selisih >= 0 ? '+' : ''}${selisih} ${selectedOpnameBahan.satuan})`,
        'success',
        'Stock Opname Disesuaikan!'
      );
      setSelectedOpnameBahan(null);
    } catch (err) {
      showAlert('Gagal menyimpan penyesuaian opname: ' + err.message, 'error', 'Gagal Opname');
    }
  };

  // ===== UNIFIED RIWAYAT STOCK OPNAME & PERGERAKAN STOK PER TANGGAL =====
  const unifiedStockOpnameLogs = useMemo(() => {
    const logs = [];

    // 1. Receipts / Restock (+ Stok Masuk) from utangList
    (utangList || []).forEach(p => {
      if (p.riwayatPenerimaan && Array.isArray(p.riwayatPenerimaan)) {
        p.riwayatPenerimaan.forEach(r => {
          const timestamp = r.tanggal || r.createdAt || p.tanggalBeli || '';
          const dateStr = timestamp.substring(0, 10);
          logs.push({
            id: `penerimaan_${p._id || p.id}_${r.id || Math.random()}`,
            timestamp,
            dateStr,
            tipe: 'STOK_MASUK',
            namaBahan: r.namaBahan || p.bahanNama || 'Bahan Baku',
            sku: p.sku || '-',
            jumlah: Number(r.jumlah || r.diterima || 0),
            satuan: r.satuan || p.satuan || 'pcs',
            user: r.penerima || r.user || 'Tim Bahan Baku',
            detail: `Penerimaan Pembelian Faktur #${p.noFaktur || '-'} (${p.supplier || 'Supplier'})`
          });
        });
      } else if (Number(p.jumlahDiterima || 0) > 0) {
        const timestamp = p.tanggalPenerimaan || p.tanggalBeli || p.createdAt || '';
        const dateStr = timestamp.substring(0, 10);
        logs.push({
          id: `penerimaan_${p._id || p.id}`,
          timestamp,
          dateStr,
          tipe: 'STOK_MASUK',
          namaBahan: p.bahanNama || 'Bahan Baku',
          sku: p.sku || '-',
          jumlah: Number(p.jumlahDiterima || 0),
          satuan: p.satuan || 'pcs',
          user: p.penerima || p.user || 'Tim Bahan Baku',
          detail: `Penerimaan Pembelian Faktur #${p.noFaktur || '-'} (${p.supplier || 'Supplier'})`
        });
      }
    });

    // 2. Production Usage (- Pemakaian Dapur)
    (riwayatProduksi || []).forEach(r => {
      const timestamp = r.timestamp || r.tanggal || r.createdAt || '';
      const dateStr = timestamp.substring(0, 10);
      if (r.bahanDigunakan && Array.isArray(r.bahanDigunakan)) {
        r.bahanDigunakan.forEach(item => {
          const qty = Number(item.jumlah || 0);
          if (qty > 0) {
            logs.push({
              id: `produksi_${r.id || r._id}_${item.bahanId || item.bahanNama}`,
              timestamp,
              dateStr,
              tipe: 'PEMAKAIAN',
              namaBahan: item.bahanNama || item.nama || 'Bahan Baku',
              sku: item.sku || '-',
              jumlah: qty,
              satuan: item.satuan || 'kg',
              user: r.operator || r.user || 'Tim Produksi',
              detail: `Pemakaian Produksi Batch Olahan: ${r.produkNama || 'Saren One'} (${r.jumlahPcs || 1} Batch)`
            });
          }
        });
      }
    });

    // 3. Stock Opname & Manual Stock Adjustments from Audit Log
    (auditLog || []).forEach(l => {
      const detailStr = l.detail || '';
      if (detailStr.includes('Stok') || detailStr.includes('Stock') || l.aksi.includes('Bahan')) {
        const timestamp = l.timestamp || '';
        const dateStr = timestamp.substring(0, 10);
        logs.push({
          id: `audit_${l.id}`,
          timestamp,
          dateStr,
          tipe: l.aksi.includes('Restock') ? 'STOK_MASUK' : 'OPNAME',
          namaBahan: detailStr.match(/bahan baku ([^di]+)/i)?.[1]?.trim() || 'Bahan Baku',
          sku: '-',
          jumlah: 0,
          satuan: '-',
          user: l.user || 'Admin',
          detail: l.detail
        });
      }
    });

    return logs.sort((a, b) => (b.timestamp || b.dateStr).localeCompare(a.timestamp || a.dateStr));
  }, [utangList, riwayatProduksi, auditLog]);

  // Filter Stock Opname Logs by Selected Daily Date & Search Query
  const filteredOpnameLogs = useMemo(() => {
    return unifiedStockOpnameLogs.filter(log => {
      const matchDate = filterTanggal ? (log.dateStr === filterTanggal || (log.dateStr && log.dateStr.startsWith(filterTanggal))) : true;
      const matchQuery = !search ||
        log.namaBahan.toLowerCase().includes(search.toLowerCase()) ||
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.detail.toLowerCase().includes(search.toLowerCase());
      return matchDate && matchQuery;
    });
  }, [unifiedStockOpnameLogs, filterTanggal, search]);

  const filteredBahan = bahanBaku
    .filter(b => {
      const matchQuery = b.nama.toLowerCase().includes(search.toLowerCase()) || b.sku.toLowerCase().includes(search.toLowerCase());
      const matchKat = !kategoriFilter || b.kategori === kategoriFilter;
      return matchQuery && matchKat;
    })
    .sort((a, b) => (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' }));

  const getStatusBadge = (stok, minStok) => {
    if (stok === 0) {
      return <span className="badge badge-rose">Habis (Restock!)</span>;
    }
    if (stok <= minStok) {
      return <span className="badge badge-amber">Menipis (Restock!)</span>;
    }
    return <span className="badge badge-emerald">Stok Safe</span>;
  };

  const handleExportExcel = () => {
    if (activeSubTab === 'opname-history') {
      const headers = ['Waktu / Tanggal', 'Tipe Pergerakan', 'Nama Bahan', 'SKU', 'Jumlah', 'Satuan', 'Petugas / User', 'Detail Keterangan'];
      const rows = filteredOpnameLogs.map(l => [
        l.timestamp,
        l.tipe === 'STOK_MASUK' ? 'Stok Masuk' : (l.tipe === 'PEMAKAIAN' ? 'Pemakaian Dapur' : 'Penyesuaian Opname'),
        l.namaBahan,
        l.sku,
        l.jumlah,
        l.satuan,
        l.user,
        l.detail
      ]);
      exportToExcel(`Riwayat_Stock_Opname_${filterTanggal || 'Semua'}`, headers, rows);
    } else {
      const headers = ['Kode SKU', 'Nama Bahan Baku', 'Kategori', filterTanggal ? `Stok Tgl (${filterTanggal})` : 'Stok Saat Ini', 'Batas Minimum', 'Satuan', 'Status Persediaan'];
      const rows = filteredBahan.map(b => {
        const stokVal = getBahanStokOnDate(b, filterTanggal);
        return [
          b.sku,
          b.nama,
          b.kategori,
          stokVal,
          b.minStok,
          b.satuan,
          stokVal <= b.minStok ? 'Menipis / Restock' : 'Stok Safe'
        ];
      });
      exportToExcel(`Stok_Bahan_Baku_${filterTanggal || 'Saat_Ini'}`, headers, rows);
    }
  };

  const handleExportPDF = () => {
    if (activeSubTab === 'opname-history') {
      const headers = ['Waktu', 'Tipe', 'Nama Bahan Baku', 'Jumlah', 'Petugas', 'Detail Operasional'];
      const rows = filteredOpnameLogs.map(l => [
        l.timestamp,
        l.tipe === 'STOK_MASUK' ? 'Masuk' : (l.tipe === 'PEMAKAIAN' ? 'Pemakaian' : 'Opname'),
        l.namaBahan,
        l.jumlah > 0 ? `${l.jumlah} ${l.satuan}` : '-',
        l.user,
        l.detail
      ]);
      const config = {
        title: 'Laporan Riwayat Stock Opname & Pergerakan Per Tanggal',
        subtitle: `Menampilkan ${filteredOpnameLogs.length} rekam transaksi pergerakan stok (Periode: ${filterTanggal || 'Semua'}).`,
        headers,
        rows,
        summaryText: `Total Record Transaksi Stock Opname: ${filteredOpnameLogs.length} Log`,
        filename: `Riwayat_Stock_Opname_${filterTanggal || 'Semua'}`
      };
      if (onOpenPdfPreview) {
        onOpenPdfPreview(config);
      } else {
        setIsPreviewPdfOpen(true);
      }
    } else {
      const headers = ['SKU', 'Nama Bahan Baku', 'Kategori', filterTanggal ? `Stok (${filterTanggal})` : 'Stok Saat Ini', 'Batas Min.', 'Status'];
      const rows = filteredBahan.map(b => {
        const stokVal = getBahanStokOnDate(b, filterTanggal);
        return [
          b.sku,
          b.nama,
          b.kategori,
          `${stokVal} ${b.satuan}`,
          `${b.minStok} ${b.satuan}`,
          stokVal <= b.minStok ? 'Menipis / Restock' : 'Stok Safe'
        ];
      });
      const config = {
        title: 'Laporan Inventaris Stok Bahan Baku Dapur',
        subtitle: `Menampilkan posisi stok per tanggal (${filterTanggal || 'Hari Ini'}) - Total ${filteredBahan.length} item bahan mentah Saren One.`,
        headers,
        rows,
        summaryText: `Total Bahan Mentah: ${filteredBahan.length} Item`,
        filename: `Stok_Bahan_Baku_${filterTanggal || 'Saat_Ini'}`
      };
      if (onOpenPdfPreview) {
        onOpenPdfPreview(config);
      } else {
        setIsPreviewPdfOpen(true);
      }
    }
  };

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* ===== HEADER & SUB-TAB SWITCHER ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Sub-Tab Navigation Toggle Buttons */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setActiveSubTab('stok')}
            style={{
              background: activeSubTab === 'stok' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
              color: activeSubTab === 'stok' ? '#0f172a' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.45rem 1rem',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
              boxShadow: activeSubTab === 'stok' ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none'
            }}
          >
            <Package size={16} /> Daftar Stok Persediaan ({bahanBaku.length})
          </button>
          <button
            onClick={() => setActiveSubTab('opname-history')}
            style={{
              background: activeSubTab === 'opname-history' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent',
              color: activeSubTab === 'opname-history' ? '#0f172a' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.45rem 1rem',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
              boxShadow: activeSubTab === 'opname-history' ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none'
            }}
          >
            <ClipboardCheck size={16} /> Riwayat Stock Opname ({filteredOpnameLogs.length})
          </button>
        </div>

        {/* PERIODE TANGGAL FILTER BAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={15} style={{ color: 'var(--amber)' }} /> Filter Audit Tanggal:
          </span>
          <input
            type="date"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#f8fafc',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer'
            }}
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
          />

          {filterTanggal !== todayStr && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setFilterTanggal(todayStr)}
              title="Reset ke tanggal hari ini"
              style={{ fontSize: '0.78rem' }}
            >
              Hari Ini
            </button>
          )}

          {filterTanggal && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setFilterTanggal('')}
              title="Tampilkan semua riwayat tanggal"
              style={{ fontSize: '0.78rem' }}
            >
              Semua Tanggal
            </button>
          )}
        </div>
      </div>

      {/* ===== SEARCH & ACTIONS TOOLBAR ===== */}
      <div className="toolbar">
        <div className="search-box" style={{ maxWidth: '320px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder={activeSubTab === 'opname-history' ? "Cari riwayat opname (Nama bahan, user...)" : "Cari SKU atau Nama Bahan..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {activeSubTab === 'stok' && (
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="select-input"
            style={{ maxWidth: '190px' }}
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map(k => (
              <option key={k.id} value={k.nama}>{k.nama}</option>
            ))}
          </select>
        )}

        <div className="toolbar-actions">
          {isSuperAdmin && activeSubTab === 'stok' && (
            <button className="btn btn-outline" onClick={onOpenKelolaKategoriBahan} title="Kelola Kategori Bahan Baku">
              <Tag size={16} style={{ color: 'var(--amber)' }} /> Kategori
            </button>
          )}

          {canAddOrRestock && activeSubTab === 'stok' && (
            <button className="btn btn-outline btn-emerald" onClick={() => setIsImportExcelOpen(true)} title="Import Bahan Baku Masal dari File Excel">
              <Upload size={16} style={{ color: 'var(--emerald)' }} /> Import Excel
            </button>
          )}

          <button className="btn btn-outline" onClick={handleExportPDF} title="Preview & Cetak Laporan PDF">
            <FileText size={16} style={{ color: 'var(--amber)' }} /> Cetak PDF
          </button>

          {isSuperAdmin && activeSubTab === 'stok' && (
            <button className="btn btn-primary" onClick={onOpenTambahBahan}>
              <Plus size={16} /> Tambah Bahan
            </button>
          )}
        </div>
      </div>

      {/* ===== SUB-TAB 1: DAFTAR STOK PERSEDIAAN ===== */}
      {activeSubTab === 'stok' && (
        <div className="table-container mt-4">
          <table className="custom-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>NAMA BAHAN BAKU</th>
                <th>KATEGORI</th>
                <th>{filterTanggal ? `STOK TANGGAL (${filterTanggal})` : 'STOK SAAT INI'}</th>
                <th>BATAS MINIMUM</th>
                <th>STATUS STOK</th>
                {isSuperAdmin && <th style={{ textAlign: 'right' }}>AKSI AUDIT &amp; EDIT</th>}
              </tr>
            </thead>
            <tbody>
              {filteredBahan.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                    Tidak ada data bahan baku dapur yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredBahan.map(b => {
                  const stokVal = getBahanStokOnDate(b, filterTanggal);
                  return (
                    <tr key={b.id}>
                      <td><span className="badge badge-amber">{b.sku}</span></td>
                      <td style={{ fontWeight: 600 }}>{b.nama}</td>
                      <td><span className="badge badge-cyan">{b.kategori}</span></td>
                      <td style={{ fontWeight: 700, color: filterTanggal ? 'var(--amber)' : '#f8fafc' }}>
                        {formatNumber(stokVal)} {b.satuan}
                      </td>
                      <td className="text-muted">{formatNumber(b.minStok)} {b.satuan}</td>
                      <td>{getStatusBadge(stokVal, b.minStok)}</td>
                      {isSuperAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              className="btn btn-sm btn-outline"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderColor: 'rgba(245,158,11,0.5)', color: 'var(--amber)', fontWeight: 700 }}
                              onClick={() => handleOpenOpnameModal(b)}
                              title={`Lakukan Stock Opname & Penyesuaian Fisik untuk Tanggal ${filterTanggal || todayStr}`}
                            >
                              <ClipboardCheck size={14} /> Opname
                            </button>
                            <button className="btn btn-icon btn-sm" onClick={() => onOpenEditBahan(b)} title="Edit Master Bahan">
                              <Edit3 size={15} />
                            </button>
                            <button className="btn btn-icon btn-sm btn-danger" onClick={() => onDeleteBahan(b.id)} title="Hapus Bahan Baku">
                              <Trash2 size={15} />
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
      )}

      {/* ===== SUB-TAB 2: RIWAYAT STOCK OPNAME & PERGERAKAN PER TANGGAL ===== */}
      {activeSubTab === 'opname-history' && (
        <div className="table-container mt-4">
          <table className="custom-table">
            <thead>
              <tr>
                <th>WAKTU &amp; TANGGAL</th>
                <th>TIPE PERGERAKAN</th>
                <th>NAMA BAHAN BAKU</th>
                <th>JUMLAH PERGERAKAN</th>
                <th>PETUGAS / USER</th>
                <th>DETAIL OPERASIONAL</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpnameLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                    Belum ada riwayat stock opname / pergerakan stok pada periode {filterTanggal || 'ini'}.
                  </td>
                </tr>
              ) : (
                filteredOpnameLogs.map(l => (
                  <tr key={l.id}>
                    <td className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{l.timestamp || l.dateStr}</td>
                    <td>
                      {l.tipe === 'STOK_MASUK' && (
                        <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ArrowDownLeft size={13} /> Stok Masuk / Restock
                        </span>
                      )}
                      {l.tipe === 'PEMAKAIAN' && (
                        <span className="badge badge-rose" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ArrowUpRight size={13} /> Pemakaian Dapur
                        </span>
                      )}
                      {l.tipe === 'OPNAME' && (
                        <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ClipboardCheck size={13} /> Penyesuaian Opname
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{l.namaBahan}</td>
                    <td style={{ fontWeight: 800, color: l.tipe === 'STOK_MASUK' ? 'var(--emerald)' : (l.tipe === 'PEMAKAIAN' ? 'var(--rose)' : 'var(--cyan)') }}>
                      {l.tipe === 'STOK_MASUK' ? `+${formatNumber(l.jumlah)} ${l.satuan}` : (l.tipe === 'PEMAKAIAN' ? `-${formatNumber(l.jumlah)} ${l.satuan}` : '-')}
                    </td>
                    <td><strong style={{ fontSize: '0.82rem' }}>{l.user}</strong></td>
                    <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{l.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== MODAL PENYESUAIAN STOCK OPNAME AUDITING ===== */}
      {selectedOpnameBahan && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', zIndex: 9999 }}>
          <div className="modal-content" style={{ background: '#0f172a', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <ClipboardCheck size={20} /> Penyesuaian Stock Opname (Auditing)
              </h3>
              <button className="btn btn-icon btn-sm" onClick={() => setSelectedOpnameBahan(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Target Info Card */}
            <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span className="text-muted">Nama Bahan Baku:</span>
                <strong style={{ color: '#f8fafc' }}>{selectedOpnameBahan.sku} - {selectedOpnameBahan.nama}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span className="text-muted">Tanggal Audit Opname:</span>
                <span className="badge badge-amber" style={{ fontSize: '0.78rem' }}>📅 {filterTanggal || todayStr}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Stok Sistem Terhitung:</span>
                <strong style={{ color: 'var(--cyan)' }}>{formatNumber(selectedOpnameBahan.stokSistem)} {selectedOpnameBahan.satuan}</strong>
              </div>
            </div>

            {/* Inputs */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem', display: 'block' }}>
                Stok Fisik Hasil Opname GUDANG ({selectedOpnameBahan.satuan}):
              </label>
              <input
                type="number"
                step="any"
                className="form-control"
                style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid var(--amber)', color: '#f8fafc', fontSize: '1.05rem', fontWeight: 800, padding: '0.65rem 0.85rem', borderRadius: '8px' }}
                value={stokFisikInput}
                onChange={(e) => setStokFisikInput(e.target.value)}
                placeholder="Masukkan jumlah fisik hasil hitung..."
              />
            </div>

            {/* Auto Diff Calculation Badge */}
            {stokFisikInput !== '' && !isNaN(Number(stokFisikInput)) && (
              <div style={{ marginBottom: '1.25rem' }}>
                {Number(stokFisikInput) === selectedOpnameBahan.stokSistem ? (
                  <div className="badge badge-emerald" style={{ width: '100%', padding: '0.55rem', justifyContent: 'center', fontSize: '0.82rem' }}>
                    ✓ Stok Sesuai (Selisih 0 {selectedOpnameBahan.satuan})
                  </div>
                ) : Number(stokFisikInput) < selectedOpnameBahan.stokSistem ? (
                  <div className="badge badge-rose" style={{ width: '100%', padding: '0.55rem', justifyContent: 'center', fontSize: '0.82rem' }}>
                    ⚠️ Selisih Kurang: -{formatNumber(selectedOpnameBahan.stokSistem - Number(stokFisikInput))} {selectedOpnameBahan.satuan}
                  </div>
                ) : (
                  <div className="badge badge-cyan" style={{ width: '100%', padding: '0.55rem', justifyContent: 'center', fontSize: '0.82rem' }}>
                    📈 Selisih Lebih: +{formatNumber(Number(stokFisikInput) - selectedOpnameBahan.stokSistem)} {selectedOpnameBahan.satuan}
                  </div>
                )}
              </div>
            )}

            {/* Reason Notes Input */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem', display: 'block' }}>
                Catatan / Alasan Penyesuaian Opname:
              </label>
              <textarea
                className="form-control"
                rows={3}
                style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.82rem', padding: '0.6rem 0.85rem', borderRadius: '8px' }}
                value={catatanOpname}
                onChange={(e) => setCatatanOpname(e.target.value)}
                placeholder="Contoh: Penyusutan fisik saat penyimpanan gudang / Hasil hitung ulang tim opname"
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setSelectedOpnameBahan(null)}>Batal</button>
              <button className="btn btn-amber" onClick={handleSaveOpname} style={{ fontWeight: 800 }}>
                <CheckCircle size={16} /> Simpan Penyesuaian Opname
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel & PDF Modals */}
      {isImportExcelOpen && (
        <ModalImportBahanExcel
          isOpen={isImportExcelOpen}
          onClose={() => setIsImportExcelOpen(false)}
          onImport={onImportExcelBahan}
          showAlert={showAlert}
        />
      )}
    </div>
  );
}
