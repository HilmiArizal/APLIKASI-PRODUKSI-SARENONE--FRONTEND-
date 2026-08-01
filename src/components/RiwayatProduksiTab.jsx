import React, { useState } from 'react';
import { Search, FileSpreadsheet, FileText, Trash2, Eye, Boxes, X, Calendar } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function RiwayatProduksiTab({ riwayatProduksi, activeRoleView, onOpenPdfPreview, onDeleteHistory }) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedBatchDetail, setSelectedBatchDetail] = useState(null);
  const isSuperAdmin = (activeRoleView === 'ADMIN');

  const filtered = riwayatProduksi.filter(h => {
    const matchMonth = selectedMonth ? (h.timestamp && h.timestamp.startsWith(selectedMonth)) : true;
    const matchSearch =
      h.produkNama.toLowerCase().includes(search.toLowerCase()) ||
      h.id.toLowerCase().includes(search.toLowerCase());
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
      subtitle: `Menampilkan ${filtered.length} riwayat hasil pemrosesan roti & konsumsi stok bahan baku (Periode: ${selectedMonth || 'Semua'}).`,
      headers,
      rows,
      summaryText: `Total Batch Diproses: ${filtered.length} | Total Hasil Batch: ${filtered.reduce((acc, curr) => acc + curr.jumlahPcs, 0)} Batch`,
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
      <div className="toolbar" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Cari riwayat (misal: RCS, BS dll)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Month Selector Filter Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={14} style={{ color: 'var(--indigo)' }} /> Periode Bulan:
          </span>
          <input
            type="month"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
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
            >
              Bulan Berjalan
            </button>
          )}
        </div>

        <div className="toolbar-actions" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-outline" onClick={handleExportExcel} title="Export Jurnal ke Excel (.csv)">
            <FileSpreadsheet size={16} style={{ color: 'var(--emerald)' }} /> Excel
          </button>
          <button className="btn btn-outline" onClick={handleExportPDF} title="Cetak Jurnal PDF">
            <FileText size={16} style={{ color: 'var(--amber)' }} /> Cetak PDF
          </button>
        </div>
      </div>

      <div className="table-container mt-4">
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID BATCH</th>
              <th>WAKTU OLAH DAPUR</th>
              <th>PRODUK OLAHAN</th>
              <th>JUMLAH BATCH</th>
              <th>PEMOTONGAN STOK BAHAN BAKU</th>
              {isSuperAdmin && <th style={{ textAlign: 'right' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Belum ada riwayat batch produksi olahan dapur.
                </td>
              </tr>
            ) : (
              filtered.map(h => (
                <tr key={h.id}>
                  <td><span className="badge badge-cyan">{h.id}</span></td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>{h.timestamp}</td>
                  <td style={{ fontWeight: 700 }}>{h.produkNama}</td>
                  <td>
                    <strong style={{ fontSize: '1rem', color: 'var(--emerald)' }}>{h.jumlahPcs} Batch</strong>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => setSelectedBatchDetail(h)} title="Klik untuk melihat rincian pemotongan bahan baku">
                      <Eye size={14} style={{ color: 'var(--cyan)' }} /> Lihat Bahan ({(h.pemotonganBahan || []).length} Item)
                    </button>
                  </td>
                  {isSuperAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-sm btn-outline btn-danger" onClick={() => onDeleteHistory && onDeleteHistory(h.id)} title="Hapus Catatan Riwayat Batch">
                        <Trash2 size={14} />
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
      {selectedBatchDetail && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Boxes size={18} style={{ color: 'var(--amber)' }} /> Detail Pemotongan Bahan Baku
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedBatchDetail(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>{selectedBatchDetail.id}</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '0.25rem' }}>{selectedBatchDetail.produkNama}</div>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Waktu Olah: {selectedBatchDetail.timestamp}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '0.85rem' }}>{selectedBatchDetail.jumlahPcs} Batch</span>
                </div>
              </div>

              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>NO</th>
                    <th>NAMA BAHAN BAKU</th>
                    <th style={{ textAlign: 'right' }}>JUMLAH TERPOTONG</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedBatchDetail.pemotonganBahan || []).map((b, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{b.bahanNama}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--rose)' }}>
                        -{b.jumlah} {b.satuan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedBatchDetail(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
