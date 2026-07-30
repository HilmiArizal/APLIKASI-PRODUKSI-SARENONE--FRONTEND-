import React, { useState } from 'react';
import { Package, MinusCircle, CheckCircle, Search, Calendar, History, Clock } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalPemakaianKemasan } from './Modals';

export default function PemakaianKemasanTab({
  bahanBaku = [],
  auditLog = [],
  activeRoleView,
  onUseKemasan,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBahanForModal, setSelectedBahanForModal] = useState(null);

  // Today Date string in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateFilter, setSelectedDateFilter] = useState(todayStr);

  // Filter packaging materials (or all materials)
  const kemasanMaterials = bahanBaku.filter(b => {
    const kat = (b.kategori || '').toLowerCase();
    const name = (b.nama || '').toLowerCase();
    return kat.includes('kemasan') || name.includes('casing') || name.includes('plastik') || name.includes('pouch') || name.includes('box') || name.includes('label');
  });

  const displayMaterials = (kemasanMaterials.length > 0 ? kemasanMaterials : bahanBaku)
    .filter(b => b.nama.toLowerCase().includes(search.toLowerCase()) || b.sku.toLowerCase().includes(search.toLowerCase()));

  // Filter packaging usage logs from auditLog
  const allKemasanLogs = auditLog.filter(log => {
    const aksi = (log.aksi || '').toLowerCase();
    const detail = (log.detail || '').toLowerCase();
    return aksi.includes('kemasan') || detail.includes('pemakaian');
  });

  // Filter logs for today
  const todayLogs = allKemasanLogs.filter(log => (log.timestamp || '').startsWith(todayStr));

  // Filter logs for selected date filter (or all if filter is empty)
  const filteredHistoryLogs = allKemasanLogs.filter(log => {
    if (!selectedDateFilter) return true;
    return (log.timestamp || '').startsWith(selectedDateFilter);
  });

  const canUse = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  // Calculate total used quantity for a specific material on the target date
  const getItemDateUsage = (bahanItem, targetDate) => {
    if (!targetDate || !bahanItem) return 0;
    const dateLogs = allKemasanLogs.filter(log =>
      (log.timestamp || '').startsWith(targetDate) &&
      (log.detail || '').toLowerCase().includes((bahanItem.nama || '').toLowerCase())
    );

    let totalUsed = 0;
    dateLogs.forEach(log => {
      const match = (log.detail || '').match(/Pemakaian\s+([0-9.]+)/i) || (log.detail || '').match(/-([0-9.]+)/);
      if (match && match[1]) {
        totalUsed += parseFloat(match[1]) || 0;
      }
    });
    return totalUsed;
  };

  return (
    <div className="tab-pane active">
      <div className="toolbar" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={22} style={{ color: 'var(--amber)' }} /> Pemakaian Bahan Kemasan
          </h2>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Kelola &amp; catat pemakaian Casing Sosis, Plastik Vacuum, Standing Pouch, Label Expired, dan Box Karton.
          </p>
        </div>

        {canUse && (
          <button className="btn btn-amber" onClick={() => setIsModalOpen(true)}>
            <MinusCircle size={16} /> Catat Pemakaian Kemasan
          </button>
        )}
      </div>

      {/* Grid of Packaging Materials Stock & Direct Date Usage Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {displayMaterials.map(b => {
          const usedToday = getItemDateUsage(b, todayStr);
          const usedSelected = selectedDateFilter ? getItemDateUsage(b, selectedDateFilter) : usedToday;

          return (
            <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="badge badge-amber">{b.kategori || 'Bahan Kemasan'}</span>
                {usedToday > 0 && (
                  <span className="badge badge-rose" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                    🔻 -{formatNumber(usedToday)} {b.satuan}
                  </span>
                )}
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.4rem', marginBottom: '0.2rem' }}>{b.nama}</h4>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>SKU: {b.sku}</span>

              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: b.stok <= b.minStok ? 'var(--rose)' : 'var(--emerald)' }}>
                    {formatNumber(b.stok)}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.satuan} (Sisa)</span>
                </div>

                <div style={{ fontSize: '0.78rem', color: usedSelected > 0 ? 'var(--rose)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                  <span>🔻 Terpakai ({selectedDateFilter === todayStr ? 'Hari Ini' : (selectedDateFilter || 'Hari Ini')}):</span>
                  <strong>{formatNumber(usedSelected)} {b.satuan}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table for Packaging Material Stock */}
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Inventaris Persediaan Bahan Kemasan</h3>
          <div className="search-box" style={{ maxWidth: '280px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control search-input"
              placeholder="Cari SKU atau Nama Kemasan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>NAMA BAHAN KEMASAN</th>
              <th>KATEGORI</th>
              <th>STOK SAAT INI</th>
              <th>MIN. STOK</th>
              <th>STATUS</th>
              {canUse && <th style={{ textAlign: 'center' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {displayMaterials.length === 0 ? (
              <tr>
                <td colSpan={canUse ? 7 : 6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Belum ada bahan kemasan terdaftar. Silakan tambahkan bahan baku baru dengan kategori "Bahan Kemasan".
                </td>
              </tr>
            ) : (
              displayMaterials.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 700, color: 'var(--amber)' }}>{b.sku}</td>
                  <td style={{ fontWeight: 600 }}>{b.nama}</td>
                  <td><span className="badge badge-amber">{b.kategori}</span></td>
                  <td>
                    <strong style={{ fontSize: '1.05rem', color: b.stok <= b.minStok ? 'var(--rose)' : 'var(--emerald)' }}>
                      {formatNumber(b.stok)} {b.satuan}
                    </strong>
                  </td>
                  <td>{b.minStok} {b.satuan}</td>
                  <td>
                    {b.stok === 0 ? (
                      <span className="badge badge-rose">Habis (Restock!)</span>
                    ) : b.stok <= b.minStok ? (
                      <span className="badge badge-amber">Menipis</span>
                    ) : (
                      <span className="badge badge-emerald">Aman</span>
                    )}
                  </td>
                  {canUse && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => { setSelectedBahanForModal(b); setIsModalOpen(true); }}
                      >
                        <MinusCircle size={14} /> Pemakaian
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Riwayat & Log Pemakaian Kemasan Per Tanggal */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} style={{ color: 'var(--amber)' }} /> Riwayat &amp; Log Pemakaian Kemasan Per Tanggal
            </h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
              Menampilkan {filteredHistoryLogs.length} transaksi pemakaian kemasan.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter Tanggal:</label>
            <input
              type="date"
              className="form-control"
              style={{ width: '160px', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
            />
            <button
              className={`btn btn-sm ${selectedDateFilter === todayStr ? 'btn-amber' : 'btn-outline'}`}
              onClick={() => setSelectedDateFilter(todayStr)}
            >
              Hari Ini
            </button>
            <button
              className={`btn btn-sm ${!selectedDateFilter ? 'btn-amber' : 'btn-outline'}`}
              onClick={() => setSelectedDateFilter('')}
            >
              Semua Tanggal
            </button>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>WAKTU / TANGGAL</th>
              <th>HARI</th>
              <th>RINCIAN PEMAKAIAN KEMASAN</th>
              <th>OPERATOR</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistoryLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  {selectedDateFilter ? `Tidak ada riwayat pemakaian kemasan pada tanggal ${selectedDateFilter}.` : 'Belum ada riwayat pemakaian kemasan.'}
                </td>
              </tr>
            ) : (
              filteredHistoryLogs.map(log => {
                const isToday = (log.timestamp || '').startsWith(todayStr);
                return (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 700, color: 'var(--amber)' }}>
                      <Clock size={13} style={{ marginRight: '0.35rem' }} />
                      {log.timestamp}
                    </td>
                    <td>
                      <span className="badge badge-outline" style={{ fontSize: '0.72rem' }}>
                        {log.timestamp ? log.timestamp.split(' ')[0] : '-'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.detail}</td>
                    <td>
                      <strong>{log.user}</strong> <span className="text-muted">({log.role})</span>
                    </td>
                    <td>
                      {isToday ? (
                        <span className="badge badge-emerald" style={{ fontWeight: 700 }}>✓ HARI INI</span>
                      ) : (
                        <span className="badge badge-outline">Lampau</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Pemakaian Kemasan */}
      <ModalPemakaianKemasan
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUseKemasan={onUseKemasan}
        bahanList={bahanBaku}
        showAlert={showAlert}
      />
    </div>
  );
}
