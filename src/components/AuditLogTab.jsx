import React, { useState } from 'react';
import { Search, History, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function AuditLogTab({ auditLog }) {
  const [search, setSearch] = useState('');

  const filtered = auditLog.filter(log =>
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.aksi.toLowerCase().includes(search.toLowerCase()) ||
    log.detail.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportExcel = () => {
    const headers = ['ID Log', 'Waktu Transaksi', 'Pengguna', 'Peran / Role', 'Aksi', 'Detail Lengkap Transaksi'];
    const rows = filtered.map(l => [
      l.id,
      l.timestamp,
      l.user,
      l.role,
      l.aksi,
      l.detail
    ]);
    exportToExcel('Jurnal_Audit_Log_SarenOne', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['ID Log', 'Waktu', 'Pengguna', 'Aksi', 'Detail Catatan Transaksi'];
    const rows = filtered.map(l => [
      l.id,
      l.timestamp,
      `${l.user} (${l.role})`,
      l.aksi,
      l.detail
    ]);
    exportToPDF(
      'Laporan Jurnal Transaksi & Audit Log System',
      `Menampilkan ${filtered.length} rekam jejak aktivitas operasional Saren One.`,
      headers,
      rows,
      `Total Catatan Transaksi: ${filtered.length} Log`
    );
  };

  return (
    <div className="tab-pane active">
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Cari log transaksi (misal: Restock, Produksi, Tim Produk)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <button className="btn btn-outline" onClick={handleExportExcel} title="Export Audit Log ke Excel (.csv)">
            <FileSpreadsheet size={16} style={{ color: 'var(--emerald)' }} /> Excel
          </button>
          <button className="btn btn-outline" onClick={handleExportPDF} title="Cetak Audit Log PDF">
            <FileText size={16} style={{ color: 'var(--amber)' }} /> Cetak PDF
          </button>
        </div>
      </div>

      <div className="table-container mt-4">
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID LOG</th>
              <th>WAKTU TRANSAKSI</th>
              <th>PENGGUNA</th>
              <th>PERAN / ROLE</th>
              <th>AKSI</th>
              <th>DETAIL LENGKAP TRANSAKSI</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Belum ada jurnal transaksi log.
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id}>
                  <td><span className="badge badge-cyan">{log.id}</span></td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>{log.timestamp}</td>
                  <td style={{ fontWeight: 600 }}>{log.user}</td>
                  <td><span className="badge badge-amber">{log.role}</span></td>
                  <td><span className="badge badge-emerald"><History size={12} /> {log.aksi}</span></td>
                  <td style={{ fontSize: '0.82rem' }}>{log.detail}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
