import React, { useState } from 'react';
import { Search, History, FileSpreadsheet, FileText, Calendar, Trash2 } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function AuditLogTab({ auditLog, activeRoleView, onOpenPdfPreview, onDeleteLog, onClearAllLogs }) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const isSuperAdmin = (activeRoleView === 'ADMIN');

  const filtered = auditLog.filter(log => {
    const matchMonth = selectedMonth ? (log.timestamp && log.timestamp.startsWith(selectedMonth)) : true;
    const matchSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.aksi.toLowerCase().includes(search.toLowerCase()) ||
      log.detail.toLowerCase().includes(search.toLowerCase());
    return matchMonth && matchSearch;
  });

  const getRoleBadge = (role) => {
    if (role === 'ADMIN' || role === 'ADMIN_PRODUK') return <span className="badge badge-amber">Super Admin</span>;
    if (role === 'BAHAN_BAKU') return <span className="badge badge-cyan">Tim Bahan Baku</span>;
    if (role === 'TIM_PENJUALAN' || role === 'SALES') return <span className="badge badge-emerald">Tim Sales</span>;
    if (role === 'TIM_MARKETING') return <span className="badge badge-indigo">Tim Marketing</span>;
    return <span className="badge badge-indigo">{role}</span>;
  };

  const handleExportExcel = () => {
    const headers = ['ID Log', 'Waktu Transaksi', 'Pengguna', 'Peran / Role', 'Aksi', 'Detail Lengkap Transaksi'];
    const rows = filtered.map(l => [
      l.id,
      l.timestamp,
      l.user,
      l.role === 'ADMIN' ? 'Super Admin' : 'Tim Bahan Baku',
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
      `${l.user} (${l.role === 'ADMIN' ? 'Super Admin' : 'Tim Bahan Baku'})`,
      l.aksi,
      l.detail
    ]);
    const config = {
      title: 'Laporan Jurnal Transaksi & Audit Log System',
      subtitle: `Menampilkan ${filtered.length} rekam jejak aktivitas operasional Saren One (Periode: ${selectedMonth || 'Semua'}).`,
      headers,
      rows,
      summaryText: `Total Catatan Transaksi: ${filtered.length} Log`,
      filename: 'Jurnal_Audit_Log'
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
            placeholder="Cari log transaksi (misal: Restock, Produksi, Tim Bahan Baku)..."
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
          {isSuperAdmin && auditLog.length > 0 && (
            <button
              className="btn btn-outline btn-danger"
              onClick={onClearAllLogs}
              title="Bersihkan Semua Catatan Audit Log"
              style={{ fontSize: '0.82rem' }}
            >
              <Trash2 size={15} /> Bersihkan All Log
            </button>
          )}
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
              {isSuperAdmin && <th style={{ textAlign: 'right' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Belum ada jurnal transaksi log pada periode ini.
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id}>
                  <td><span className="badge badge-cyan">{log.id}</span></td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>{log.timestamp}</td>
                  <td style={{ fontWeight: 600 }}>{log.user}</td>
                  <td>{getRoleBadge(log.role)}</td>
                  <td><span className="badge badge-emerald"><History size={12} /> {log.aksi}</span></td>
                  <td style={{ fontSize: '0.82rem' }}>{log.detail}</td>
                  {isSuperAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-outline btn-danger"
                        onClick={() => onDeleteLog && onDeleteLog(log._id || log.id)}
                        title="Hapus Catatan Log Transaksi Ini"
                      >
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
    </div>
  );
}
