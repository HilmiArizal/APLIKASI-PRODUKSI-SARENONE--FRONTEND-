import React, { useState, useRef } from 'react';
import { Package, MinusCircle, CheckCircle, Search, Calendar, History, Clock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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

  const carouselRef = useRef(null);

  // Today Date string in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateFilter, setSelectedDateFilter] = useState(todayStr);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Filter packaging materials (or all materials)
  const kemasanMaterials = bahanBaku.filter(b => {
    const kat = (b.kategori || '').toLowerCase();
    const name = (b.nama || '').toLowerCase();
    return kat.includes('kemasan') || name.includes('casing') || name.includes('plastik') || name.includes('pouch') || name.includes('box') || name.includes('label') || name.includes('sticker') || name.includes('stiker') || name.includes('barcode') || name.includes('vacum');
  });

  const rawMaterials = (kemasanMaterials.length > 0 ? kemasanMaterials : bahanBaku)
    .filter(b => b.nama.toLowerCase().includes(search.toLowerCase()) || b.sku.toLowerCase().includes(search.toLowerCase()));

  // Sort so that Sticker Barcode & Sticker Produk are ALWAYS at the VERY BOTTOM
  const displayMaterials = [...rawMaterials].sort((a, b) => {
    const nameA = (a.nama || '').toLowerCase();
    const nameB = (b.nama || '').toLowerCase();
    const isASticker = nameA.includes('sticker') || nameA.includes('stiker') || nameA.includes('label');
    const isBSticker = nameB.includes('sticker') || nameB.includes('stiker') || nameB.includes('label');

    if (isASticker && !isBSticker) return 1;
    if (!isASticker && isBSticker) return -1;
    return (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' });
  });

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

  // Calculate total Vacumbag used on target date (or today)
  const targetDateForVacum = selectedDateFilter || todayStr;
  const vacumbagItems = bahanBaku.filter(b => (b.nama || '').toLowerCase().includes('vacum'));
  const totalVacumbagUsedToday = vacumbagItems.reduce((acc, b) => acc + getItemDateUsage(b, targetDateForVacum), 0);

  return (
    <div className="tab-pane active">
      <div className="toolbar" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={22} style={{ color: 'var(--amber)' }} /> Pemakaian Bahan Kemasan
          </h2>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Kelola &amp; catat pemakaian Casing Sosis, Plastik Vacuum, Standing Pouch, Sticker Barcode &amp; Sticker Produk, dan Box Karton.
          </p>
        </div>

        {canUse && (
          <button className="btn btn-amber" onClick={() => { setSelectedBahanForModal(null); setIsModalOpen(true); }}>
            <MinusCircle size={16} /> Catat Pemakaian Kemasan
          </button>
        )}
      </div>

      {/* Auto Calculator Widget Card for Sticker Barcode & Sticker Produk based on Daily Vacumbag Usage */}
      <div style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.14), rgba(251, 191, 36, 0.09))', border: '1px solid rgba(249, 115, 22, 0.35)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary)', color: '#fff', padding: '0.85rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚡ Auto-Kalkulator Sticker ({selectedDateFilter === todayStr ? 'Hari Ini' : (selectedDateFilter || 'Semua Tanggal')})
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Total Pemakaian Vacumbag: <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{formatNumber(totalVacumbagUsedToday)} pcs</strong>. Membutuhkan presisi <strong style={{ color: '#fff' }}>{formatNumber(totalVacumbagUsedToday)} pcs Sticker Barcode</strong> &amp; <strong style={{ color: '#fff' }}>{formatNumber(totalVacumbagUsedToday)} pcs Sticker Produk</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Header & Controls for Carousel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          📦 Kartu Ringkasan Kemasan ({displayMaterials.length} Item)
        </span>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => scrollCarousel('left')}
            title="Geser Kiri Carousel"
            style={{ padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => scrollCarousel('right')}
            title="Geser Kanan Carousel"
            style={{ padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Overview Cards Carousel (1 Row Horizontal Scrollable) */}
      <div
        ref={carouselRef}
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(250px, 1fr)',
          gap: '1rem',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          paddingBottom: '0.5rem',
          marginBottom: '1.75rem',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {displayMaterials.map(b => {
          const isStokThin = b.stok <= b.minStok && b.stok > 0;
          const isStokEmpty = b.stok === 0;

          // Compute usage metrics for selected date
          const dateUsedQty = getItemDateUsage(b, selectedDateFilter);
          const todayUsedQty = getItemDateUsage(b, todayStr);

          return (
            <div
              key={b.id || b._id || b.sku}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                minWidth: '240px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge badge-amber">Bahan Kemasan</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginTop: '0.5rem', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={b.nama}>
                  {b.nama}
                </h3>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>SKU: {b.sku}</span>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: isStokEmpty ? 'var(--rose)' : isStokThin ? 'var(--amber)' : 'var(--emerald)' }}>
                    {formatNumber(b.stok)}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{b.satuan} (Sisa)</span>
                </div>

                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: dateUsedQty > 0 ? 'var(--rose)' : 'var(--text-muted)' }}>
                  🔻 Terpakai ({selectedDateFilter === todayStr ? 'Hari Ini' : (selectedDateFilter || 'Semua')}): <strong>{formatNumber(dateUsedQty)} {b.satuan}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table: Bahan Kemasan Inventory & Today Usage */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Inventaris Persediaan Bahan Kemasan</h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Menampilkan stok sisa kemasan sosis &amp; plastik vacuum.</span>
          </div>

          <div className="search-box" style={{ maxWidth: '300px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari SKU atau Nama Kemasan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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
                  Tidak ada bahan kemasan yang ditemukan.
                </td>
              </tr>
            ) : (
              displayMaterials.map(b => {
                const isThin = b.stok <= b.minStok && b.stok > 0;
                const isEmpty = b.stok === 0;

                return (
                  <tr key={b.id || b._id || b.sku}>
                    <td style={{ fontWeight: 700, color: 'var(--amber)' }}>{b.sku}</td>
                    <td style={{ fontWeight: 600 }}>{b.nama}</td>
                    <td><span className="badge badge-amber">{b.kategori || 'Bahan Kemasan'}</span></td>
                    <td style={{ fontWeight: 700, fontSize: '1rem', color: isEmpty ? 'var(--rose)' : isThin ? 'var(--amber)' : 'var(--emerald)' }}>
                      {formatNumber(b.stok)} {b.satuan}
                    </td>
                    <td>{formatNumber(b.minStok)} {b.satuan}</td>
                    <td>
                      {isEmpty ? (
                        <span className="badge badge-danger">Habis (Restock!)</span>
                      ) : isThin ? (
                        <span className="badge badge-amber">Stok Menipis</span>
                      ) : (
                        <span className="badge badge-emerald">Aman</span>
                      )}
                    </td>
                    {canUse && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setSelectedBahanForModal(b);
                            setIsModalOpen(true);
                          }}
                          style={{ fontSize: '0.75rem' }}
                        >
                          <MinusCircle size={14} /> Pemakaian
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Usage History Log Table with Date Filter */}
      <div className="table-container" style={{ marginTop: '2rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} style={{ color: 'var(--amber)' }} /> Riwayat &amp; Log Pemakaian Kemasan Per-Tanggal
            </h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
              Menampilkan {filteredHistoryLogs.length} transaksi pemakaian bahan kemasan.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              <th>TRANSAKSI PEMAKAIAN KEMASAN</th>
              <th>OPERATOR</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistoryLogs.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
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
        selectedBahan={selectedBahanForModal}
        totalVacumbagSuggestQty={totalVacumbagUsedToday}
        showAlert={showAlert}
      />
    </div>
  );
}
