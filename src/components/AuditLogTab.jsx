import React, { useState } from 'react';
import { Search, History, FileSpreadsheet, FileText, Trash2 } from 'lucide-react';
import { ModernMonthPicker } from './ModernDatePicker';
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
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      <div className="toolbar" style={{ marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ height: '32px', maxWidth: '320px', flex: 1 }}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Cari log transaksi (misal: Restock, Produksi, Tim Bahan Baku)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '0.78rem' }}
          />
        </div>

        {/* Month Selector Filter Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <ModernMonthPicker
            value={selectedMonth}
            onChange={(val) => setSelectedMonth(val)}
            allowAll={false}
          />
        </div>

        <div className="toolbar-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {isSuperAdmin && auditLog.length > 0 && (
            <button
              type="button"
              onClick={onClearAllLogs}
              title="Bersihkan Semua Catatan Audit Log"
              style={{
                height: '32px',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0 0.75rem',
                borderRadius: '6px',
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fecaca',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={13} /> Bersihkan All Log
            </button>
          )}
          <button
            type="button"
            onClick={handleExportExcel}
            title="Export Audit Log ke Excel (.csv)"
            style={{
              height: '32px',
              fontSize: '0.78rem',
              fontWeight: 800,
              padding: '0 0.75rem',
              borderRadius: '6px',
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={13} style={{ color: '#059669' }} /> Excel
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            title="Cetak Audit Log PDF"
            style={{
              height: '32px',
              fontSize: '0.78rem',
              fontWeight: 800,
              padding: '0 0.75rem',
              borderRadius: '6px',
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
          >
            <FileText size={13} style={{ color: '#b45309' }} /> Cetak PDF
          </button>
        </div>
      </div>

      <div className="table-container" style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
        <table className="custom-table" style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>ID LOG</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>WAKTU TRANSAKSI</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>PENGGUNA</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>PERAN / ROLE</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>AKSI</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569' }}>DETAIL LENGKAP TRANSAKSI</th>
              {isSuperAdmin && <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'center', whiteSpace: 'nowrap' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Belum ada jurnal transaksi log pada periode ini.
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px', display: 'inline-block' }}>
                      {log.id}
                    </span>
                  </td>
                  <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', color: '#475569', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                  <td style={{ padding: '0.32rem 0.55rem', fontWeight: 800, color: '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>{log.user}</td>
                  <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>{getRoleBadge(log.role)}</td>
                  <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#d1fae5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <History size={11} /> {log.aksi}
                    </span>
                  </td>
                  <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', color: '#334155', lineHeight: 1.3 }}>{log.detail}</td>
                  {isSuperAdmin && (
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        style={{
                          background: '#fef2f2',
                          color: '#ef4444',
                          border: '1px solid #fecaca',
                          borderRadius: '5px',
                          width: '24px',
                          height: '24px',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => onDeleteLog && onDeleteLog(log._id || log.id)}
                        title="Hapus Catatan Log Transaksi Ini"
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
    </div>
  );
}
