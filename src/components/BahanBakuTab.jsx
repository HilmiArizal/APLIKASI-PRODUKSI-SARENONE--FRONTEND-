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
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [activeSubTab, setActiveSubTab] = useState('stok'); // 'stok' | 'opname-history'
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [isPreviewPdfOpen, setIsPreviewPdfOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);

  const isSuperAdmin = (activeRoleView === 'ADMIN');
  const canAddOrRestock = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

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
  }, [penerimaanList, riwayatProduksi, auditLog]);

  // Filter Stock Opname Logs by Selected Month & Search Query
  const filteredOpnameLogs = useMemo(() => {
    return unifiedStockOpnameLogs.filter(log => {
      const matchMonth = selectedMonth ? (log.dateStr && log.dateStr.startsWith(selectedMonth)) : true;
      const matchQuery = !search ||
        log.namaBahan.toLowerCase().includes(search.toLowerCase()) ||
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.detail.toLowerCase().includes(search.toLowerCase());
      return matchMonth && matchQuery;
    });
  }, [unifiedStockOpnameLogs, selectedMonth, search]);

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
      exportToExcel(`Riwayat_Stock_Opname_${selectedMonth || 'Semua'}`, headers, rows);
    } else {
      const headers = ['Kode SKU', 'Nama Bahan Baku', 'Kategori', 'Stok Saat Ini', 'Batas Minimum', 'Satuan', 'Status Persediaan'];
      const rows = filteredBahan.map(b => [
        b.sku,
        b.nama,
        b.kategori,
        b.stok,
        b.minStok,
        b.satuan,
        b.stok <= b.minStok ? 'Menipis / Restock' : 'Stok Safe'
      ]);
      exportToExcel('Stok_Bahan_Baku_Dapur', headers, rows);
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
        subtitle: `Menampilkan ${filteredOpnameLogs.length} rekam transaksi pergerakan stok (Periode: ${selectedMonth || 'Semua'}).`,
        headers,
        rows,
        summaryText: `Total Record Transaksi Stock Opname: ${filteredOpnameLogs.length} Log`,
        filename: `Riwayat_Stock_Opname_${selectedMonth || 'Semua'}`
      };
      if (onOpenPdfPreview) {
        onOpenPdfPreview(config);
      } else {
        setIsPreviewPdfOpen(true);
      }
    } else {
      const headers = ['SKU', 'Nama Bahan Baku', 'Kategori', 'Stok Saat Ini', 'Batas Min.', 'Status'];
      const rows = filteredBahan.map(b => [
        b.sku,
        b.nama,
        b.kategori,
        `${b.stok} ${b.satuan}`,
        `${b.minStok} ${b.satuan}`,
        b.stok <= b.minStok ? 'Menipis / Restock' : 'Stok Safe'
      ]);
      const config = {
        title: 'Laporan Inventaris Stok Bahan Baku Dapur',
        subtitle: `Menampilkan ${filteredBahan.length} bahan mentah pergerakan stok Saren One.`,
        headers,
        rows,
        summaryText: `Total Bahan Mentah: ${filteredBahan.length} Item`,
        filename: 'Stok_Bahan_Baku'
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

        {/* PERIODE BULAN FILTER BAR (STANDARISASI UTANG & PEMBELIAN) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={15} style={{ color: 'var(--amber)' }} /> Periode Bulan:
          </span>
          <input
            type="month"
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
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />

          {selectedMonth !== currentMonthStr && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setSelectedMonth(currentMonthStr)}
              title="Reset ke bulan berjalan"
              style={{ fontSize: '0.78rem' }}
            >
              Bulan Berjalan
            </button>
          )}

          {selectedMonth && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setSelectedMonth('')}
              title="Tampilkan semua periode"
              style={{ fontSize: '0.78rem' }}
            >
              Semua Periode
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
                <th>STOK SAAT INI</th>
                <th>BATAS MINIMUM</th>
                <th>STATUS STOK</th>
                {isSuperAdmin && <th style={{ textAlign: 'right' }}>AKSI</th>}
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
                filteredBahan.map(b => (
                  <tr key={b.id}>
                    <td><span className="badge badge-amber">{b.sku}</span></td>
                    <td style={{ fontWeight: 600 }}>{b.nama}</td>
                    <td><span className="badge badge-cyan">{b.kategori}</span></td>
                    <td style={{ fontWeight: 700, color: '#f8fafc' }}>
                      {formatNumber(b.stok)} {b.satuan}
                    </td>
                    <td className="text-muted">{formatNumber(b.minStok)} {b.satuan}</td>
                    <td>{getStatusBadge(b.stok, b.minStok)}</td>
                    {isSuperAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button className="btn btn-icon btn-sm" onClick={() => onOpenEditBahan(b)} title="Edit Bahan Baku">
                            <Edit3 size={15} />
                          </button>
                          <button className="btn btn-icon btn-sm btn-danger" onClick={() => onDeleteBahan(b.id)} title="Hapus Bahan Baku">
                            <Trash2 size={15} />
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
                    Belum ada riwayat stock opname / pergerakan stok pada periode {selectedMonth || 'ini'}.
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
