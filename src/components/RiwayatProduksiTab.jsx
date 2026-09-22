import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, FileSpreadsheet, FileText, Trash2, Eye, Boxes, X, Calendar, RotateCcw, Clock, Factory, Layers } from 'lucide-react';
import { ModernMonthPicker } from './ModernDatePicker';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const formatMonthLabel = (ymStr) => {
  if (!ymStr || ymStr === 'semua') return 'Semua Periode (All Time)';
  const [year, month] = ymStr.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const idx = parseInt(month, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${monthNames[idx]} ${year}`;
  }
  return ymStr;
};

export default function RiwayatProduksiTab({ riwayatProduksi = [], activeRoleView, onOpenPdfPreview, onDeleteHistory }) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedBatchDetail, setSelectedBatchDetail] = useState(null);
  const [selectedRollbackBatch, setSelectedRollbackBatch] = useState(null);
  const isSuperAdmin = activeRoleView === 'ALL' || activeRoleView === 'ADMIN' || activeRoleView === 'ADMIN_PRODUK' || (activeRoleView && String(activeRoleView).includes('ADMIN'));

  const filtered = (riwayatProduksi || []).filter(h => {
    const rawDate = h.timestamp || h.tanggal || h.createdAt || '';
    const matchMonth = selectedMonth === 'semua' || (selectedMonth ? rawDate.startsWith(selectedMonth) : true);
    const s = search.toLowerCase();
    const matchSearch =
      (h.produkNama || '').toLowerCase().includes(s) ||
      (h.id || '').toLowerCase().includes(s);
    return matchMonth && matchSearch;
  });

  const handleExportExcel = () => {
    const headers = ['ID Batch', 'Waktu Olah Dapur', 'Nama Produk Jadi', 'Jumlah Batch', 'Rincian Pemotongan Bahan Baku'];
    const rows = filtered.map(h => [
      h.id,
      h.timestamp,
      h.produkNama,
      h.jumlahPcs,
      (h.pemotonganBahan || []).map(b => `${b.bahanNama}: -${b.jumlah} ${b.satuan}`).join(' | ')
    ]);
    exportToExcel('Riwayat_Batch_Produksi_Dapur', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['ID Batch', 'Waktu Olah', 'Produk Olahan', 'Jumlah Batch', 'Konsumsi Pemotongan Bahan'];
    const rows = filtered.map(h => [
      h.id,
      h.timestamp,
      h.produkNama,
      `${h.jumlahPcs} Batch`,
      (h.pemotonganBahan || []).map(b => `${b.bahanNama} (-${b.jumlah} ${b.satuan})`).join(', ')
    ]);
    const config = {
      title: 'Jurnal Rekam Jejak Batch Produksi Dapur',
      subtitle: `Menampilkan ${filtered.length} riwayat hasil pemrosesan roti & konsumsi stok bahan baku (Periode: ${formatMonthLabel(selectedMonth)}).`,
      headers,
      rows,
      summaryText: `Total Sesi Batch: ${filtered.length} | Total Hasil Yield: ${filtered.reduce((acc, curr) => acc + (Number(curr.jumlahPcs) || 0), 0)} Batch`,
      filename: 'Jurnal_Batch_Produksi'
    };
    if (onOpenPdfPreview) {
      onOpenPdfPreview(config);
    } else {
      exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
    }
  };

  return (
    <div className="tab-pane active">
      {/* 1. PALING ATAS: Executive Summary Stat Cards Perbulan (Identik dengan Tab Pembelian & Bahan Baku) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {/* Total Yield Produksi (Batch) */}
        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(16, 185, 129, 0.25)', borderTop: '3.5px solid var(--emerald)', borderRadius: '10px', padding: '0.75rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Hasil Produksi (Batch)</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Factory size={16} style={{ color: 'var(--emerald)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {filtered.reduce((acc, curr) => acc + (Number(curr.jumlahPcs) || 0), 0)} <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>Batch</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem', display: 'block' }}>
            Hasil olah dapur: {formatMonthLabel(selectedMonth)}
          </span>
        </div>

        {/* Total Sesi Olah Dapur */}
        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(56, 189, 248, 0.25)', borderTop: '3.5px solid var(--cyan)', borderRadius: '10px', padding: '0.75rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Sesi Transaksi Batch</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} style={{ color: 'var(--cyan)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {filtered.length} <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>Sesi</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem', display: 'block' }}>
            Frekuensi pemrosesan: {formatMonthLabel(selectedMonth)}
          </span>
        </div>

        {/* Total Pemotongan Bahan Baku */}
        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(99, 102, 241, 0.25)', borderTop: '3.5px solid #6366f1', borderRadius: '10px', padding: '0.75rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Resep Bahan Terpotong</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={16} style={{ color: '#818cf8' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {filtered.reduce((acc, curr) => acc + (curr.pemotonganBahan || []).length, 0)} <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700 }}>Item</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem', display: 'block' }}>
            Konsumsi persediaan: {formatMonthLabel(selectedMonth)}
          </span>
        </div>
      </div>

      {/* 2. DIBAWAHNYA: Header Toolbar (Modern Month Picker di Kiri & Search/Export di Kanan) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {/* Left (Position Start): Modern Custom Month Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <ModernMonthPicker
            value={selectedMonth}
            onChange={(val) => setSelectedMonth(val)}
            allowAll={true}
          />
        </div>

        {/* Right (Position End): Search Input & Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <div className="search-box" style={{ height: '32px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Cari riwayat (misal: RCS, BS dll)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: '0.78rem' }}
            />
          </div>
          <button className="btn btn-sm btn-outline" onClick={handleExportExcel} style={{ fontSize: '0.75rem', height: '32px', fontWeight: 800 }}>
            <FileSpreadsheet size={14} style={{ color: 'var(--emerald)' }} /> Excel
          </button>
          <button className="btn btn-sm btn-outline" onClick={handleExportPDF} style={{ fontSize: '0.75rem', height: '32px', fontWeight: 800 }}>
            <FileText size={14} style={{ color: 'var(--amber)' }} /> Cetak PDF
          </button>
        </div>
      </div>

      {/* 3. TABLE CONTAINER (BERSIH, RAPIH & MATCHING 100% DENGAN TAB PEMBELIAN!) */}
      <div className="table-container">
        <div style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
              Jurnal Rekam Jejak Batch Produksi Dapur
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #bae6fd' }}>
              {filtered.length} Transaksi Terfilter
            </span>
          </div>
        </div>

        <table className="custom-table" style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>ID BATCH</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>WAKTU OLAH DAPUR</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>PRODUK OLAHAN</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>JUMLAH BATCH</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>PEMOTONGAN STOK BAHAN BAKU</th>
              {isSuperAdmin && <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Belum ada riwayat batch produksi olahan dapur untuk {formatMonthLabel(selectedMonth)}.
                </td>
              </tr>
            ) : (
              filtered.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px' }}>
                      {h.id}
                    </span>
                  </td>
                  <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>{h.timestamp}</span>
                  </td>
                  <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.74rem' }}>{h.produkNama}</span>
                  </td>
                  <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                    <strong style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 900 }}>{h.jumlahPcs} Batch</strong>
                  </td>
                  <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedBatchDetail(h)}
                      style={{
                        background: '#f0f9ff',
                        color: '#0284c7',
                        border: '1px solid #bae6fd',
                        borderRadius: '5px',
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.45rem',
                        height: '24px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Klik untuk melihat rincian pemotongan bahan baku"
                    >
                      <Eye size={12} style={{ color: '#0284c7' }} /> Lihat Bahan ({(h.pemotonganBahan || []).length} Item)
                    </button>
                  </td>
                  {isSuperAdmin && (
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedRollbackBatch(h)}
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
                        title="Batalkan Batch Ini & Kembalikan Stok Bahan Baku (Khusus Super Admin)"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Pemotongan Bahan Baku */}
      {selectedBatchDetail && createPortal(
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div className="modal-card" style={{
            maxWidth: '580px',
            width: '90%',
            maxHeight: '90vh',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            margin: 'auto'
          }}>
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '1.15rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.4rem 0.55rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Boxes size={20} style={{ color: 'var(--amber)' }} />
                </div>
                <span>Detail Pemotongan Bahan Baku</span>
              </h3>
              <button className="btn btn-outline btn-sm" style={{ padding: '0.3rem 0.5rem', borderRadius: '8px' }} onClick={() => setSelectedBatchDetail(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto' }}>
              {/* Product Info Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(6, 182, 212, 0.06) 100%)',
                padding: '1rem 1.15rem',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                marginBottom: '1.25rem',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      {selectedBatchDetail.id}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {selectedBatchDetail.timestamp}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1f2d3d' }}>
                    {selectedBatchDetail.produkNama}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{
                    background: 'var(--emerald)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    padding: '0.4rem 0.85rem',
                    borderRadius: '20px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    display: 'inline-block'
                  }}>
                    {selectedBatchDetail.jumlahPcs} Batch
                  </span>
                </div>
              </div>

              {/* Table Container */}
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.85rem', margin: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
                      <tr>
                        <th style={{ width: '50px', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>NO</th>
                        <th style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>NAMA BAHAN BAKU</th>
                        <th style={{ textAlign: 'right', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>JUMLAH TERPOTONG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedBatchDetail.pemotonganBahan || []).map((b, idx) => (
                        <tr key={idx} style={{ transition: 'background-color 0.15s ease' }}>
                          <td style={{ width: '50px', textAlign: 'center' }}>
                            <span style={{
                              background: 'rgba(0, 0, 0, 0.05)',
                              color: 'var(--text-muted)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '10px'
                            }}>
                              {idx + 1}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: '#1f2d3d' }}>
                            {b.bahanNama}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{
                              background: 'rgba(244, 63, 94, 0.08)',
                              color: '#e11d48',
                              border: '1px solid rgba(244, 63, 94, 0.2)',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              padding: '0.25rem 0.65rem',
                              borderRadius: '20px',
                              display: 'inline-block'
                            }}>
                              -{b.jumlah} {b.satuan}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                Total <strong>{(selectedBatchDetail.pemotonganBahan || []).length}</strong> jenis bahan baku terpotong dari gudang.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '0.45rem 1.25rem', borderRadius: '8px', fontWeight: 700 }} onClick={() => setSelectedBatchDetail(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Rollback Batch Produksi Custom Dialog */}
      <ModalRollbackProduksi
        isOpen={Boolean(selectedRollbackBatch)}
        onClose={() => setSelectedRollbackBatch(null)}
        batchItem={selectedRollbackBatch}
        onConfirmRollback={onDeleteHistory}
      />
    </div>
  );
}

function ModalRollbackProduksi({ isOpen, onClose, batchItem, onConfirmRollback }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !batchItem) return null;

  const items = batchItem.pemotonganBahan || [];

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirmRollback(batchItem.id);
    setIsSubmitting(false);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: '600px' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <h3 style={{ color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
            <RotateCcw size={20} /> Konfirmasi Rollback Batch Produksi
          </h3>
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={isSubmitting}><X size={16} /></button>
        </div>

        <div className="modal-body" style={{ paddingTop: '1.15rem' }}>
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--rose)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', marginBottom: '1.25rem', color: 'var(--rose)', fontSize: '0.85rem' }}>
            ⚠️ <strong>Tindakan Pembatalan / Rollback:</strong> Membatalkan batch produksi ini akan mengembalikan seluruh stok bahan baku/emulsi yang terpotong ke gudang dan mengurangi stok produk jadi.
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="badge badge-cyan" style={{ fontWeight: 700 }}>
                {batchItem.id}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <Clock size={12} style={{ marginRight: '0.25rem' }} /> {batchItem.timestamp}
              </span>
            </div>

            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1f2d3d', marginBottom: '0.35rem' }}>
              {batchItem.produkNama}
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--emerald)', fontWeight: 700 }}>
              Jumlah Olahan: {batchItem.jumlahPcs} Batch
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald)', marginBottom: '0.65rem' }}>
              🔄 Efek Pengembalian Stok Otomatis ({items.length} Bahan Mentah &amp; Emulsi):
            </h4>
            <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '0.35rem' }}>
              <ul style={{ fontSize: '0.82rem', margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {items.map((b, idx) => (
                  <li key={idx}>
                    <strong>+ {b.jumlah} {b.satuan} {b.bahanNama}</strong> dikembalikan ke Stok Gudang.
                  </li>
                ))}
                <li style={{ color: 'var(--rose)', fontWeight: 700, marginTop: '0.35rem' }}>
                  <strong>- {batchItem.jumlahPcs} Batch Produk Jadi {batchItem.produkNama}</strong> dikurangi dari persediaan.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Memproses Rollback...' : <><RotateCcw size={15} style={{ marginRight: '0.35rem' }} /> Ya, Batalkan Batch &amp; Kembalikan Stok</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
