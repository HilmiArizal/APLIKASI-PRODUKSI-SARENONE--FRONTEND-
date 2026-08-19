import React, { useState, useMemo } from 'react';
import { Boxes, PackageCheck, AlertCircle, ChefHat, Activity, Sparkles, PlusCircle, Factory, ArrowDownLeft, Calendar, Search, X, FileSpreadsheet, FileText, Eye, ArrowRight } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function DashboardTab({
  bahanBaku = [],
  produk = [],
  riwayatProduksi = [],
  auditLog = [],
  activeRoleView,
  onNavigate,
  onOpenModalTambahBahan,
  onOpenModalProduksi,
  onOpenModalStokMasuk,
  onOpenPdfPreview,
  onSwitchTab
}) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [isModalRekapOpen, setIsModalRekapOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [filterTanggal, setFilterTanggal] = useState('');
  const [searchRekap, setSearchRekap] = useState('');

  const totalBahan = bahanBaku.length;
  const nilaiBahan = bahanBaku.reduce((acc, b) => acc + (b.stok * b.harga), 0);

  const totalProdukStok = produk.reduce((acc, p) => acc + p.stok, 0);
  const nilaiProduk = produk.reduce((acc, p) => acc + (p.stok * p.harga), 0);

  const lowStockList = bahanBaku.filter(b => b.stok <= b.minStok);

  // Calculate Today's Production sum accurately from riwayatProduksi for today's date
  const todayBatches = (riwayatProduksi || []).filter(r => r.timestamp && r.timestamp.startsWith(todayStr));
  const todayProduksiCount = todayBatches.reduce((acc, r) => acc + (Number(r.jumlahPcs) || 0), 0);

  // Group riwayatProduksi by Date (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    const map = {};
    (riwayatProduksi || []).forEach(r => {
      if (!r.timestamp) return;
      const dateKey = r.timestamp.substring(0, 10);
      if (!map[dateKey]) {
        map[dateKey] = {
          tanggal: dateKey,
          totalBatch: 0,
          totalTransaksi: 0,
          produkMap: {}
        };
      }

      const g = map[dateKey];
      const batchQty = Number(r.jumlahPcs) || 0;
      g.totalBatch += batchQty;
      g.totalTransaksi += 1;

      const pName = r.produkNama || 'Produk';
      g.produkMap[pName] = (g.produkMap[pName] || 0) + batchQty;
    });

    return Object.values(map).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [riwayatProduksi]);

  // ===== GRAFIK STOK VS PEMAKAIAN BAHAN BAKU PER HARI (BULAN BERJALAN SAJA) =====
  const dailyStockUsageChartData = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    const daysInCurrentMonth = [];
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const dd = String(day).padStart(2, '0');
      const mm = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      const dayLabel = `${dd}/${mm}`;
      daysInCurrentMonth.push({ dateStr, dayLabel, dayNum: day });
    }

    const totalCurrentStockQty = (bahanBaku || []).reduce((sum, b) => sum + (Number(b.stok) || 0), 0);

    const chartData = daysInCurrentMonth.map(({ dateStr, dayLabel, dayNum }) => {
      let dailyUsageQty = 0;
      (riwayatProduksi || []).forEach(r => {
        const rDate = (r.timestamp || r.tanggal || '').substring(0, 10);
        if (rDate === dateStr) {
          if (r.bahanDigunakan && Array.isArray(r.bahanDigunakan)) {
            r.bahanDigunakan.forEach(b => {
              dailyUsageQty += Number(b.jumlah || 0);
            });
          } else {
            dailyUsageQty += Number(r.jumlahPcs || 1) * 2;
          }
        }
      });

      return {
        dateStr,
        dayLabel,
        dayNum,
        stockQty: totalCurrentStockQty,
        usageQty: Math.round(dailyUsageQty * 10) / 10,
        isToday: dateStr === todayStr
      };
    });

    const maxStock = Math.max(...chartData.map(d => d.stockQty), 100);
    const maxUsage = Math.max(...chartData.map(d => d.usageQty), 10);
    const maxVal = Math.max(maxStock, maxUsage * 2);
    const currentMonthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return { chartData, maxVal, totalCurrentStockQty, currentMonthName };
  }, [bahanBaku, riwayatProduksi, todayStr, now]);

  // Default: Filter by current running month (selectedMonth) plus search filter
  const filteredRekap = groupedByDate.filter(g => {
    const matchMonth = selectedMonth ? g.tanggal.startsWith(selectedMonth) : true;
    const matchSearch = !searchRekap ||
      g.tanggal.includes(searchRekap) ||
      Object.keys(g.produkMap).some(p => p.toLowerCase().includes(searchRekap.toLowerCase()));
    return matchMonth && matchSearch;
  });

  const handleExportExcelRekap = () => {
    const headers = ['Tanggal Produksi', 'Total Batch Produksi', 'Sesi Transaksi', 'Rincian Produk Olahan'];
    const rows = filteredRekap.map(g => [
      g.tanggal,
      g.totalBatch,
      g.totalTransaksi,
      Object.entries(g.produkMap).map(([p, qty]) => `${p} (${qty} Batch)`).join(', ')
    ]);
    exportToExcel('Rekap_Total_Produksi_Per_Tanggal', headers, rows);
  };

  const handleExportPdfRekap = () => {
    const headers = ['Tanggal Produksi', 'Total Batch', 'Sesi Transaksi', 'Rincian Produk Olahan'];
    const rows = filteredRekap.map(g => [
      g.tanggal,
      `${g.totalBatch} Batch`,
      `${g.totalTransaksi} Sesi`,
      Object.entries(g.produkMap).map(([p, qty]) => `${p} (${qty} Batch)`).join(', ')
    ]);
    const config = {
      title: 'Laporan Rekap Total Produksi Per Tanggal',
      subtitle: `Rekapitulasi total hasil produksi batch per tanggal (Bulan: ${selectedMonth || 'Semua'}).`,
      headers,
      rows,
      summaryText: `Total Hari Terrekam: ${filteredRekap.length} Hari | Akumulasi Produksi: ${filteredRekap.reduce((acc, curr) => acc + curr.totalBatch, 0)} Batch`,
      filename: 'Rekap_Produksi_Per_Tanggal'
    };

    if (onOpenPdfPreview) {
      onOpenPdfPreview(config);
    } else {
      exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
    }
  };

  const getAksiBadgeStyle = (aksi) => {
    if (aksi.includes('Restock') || aksi.includes('Masuk')) return 'status-safe';
    if (aksi.includes('Produksi')) return 'status-warning';
    if (aksi.includes('Hapus') || aksi.includes('Keluar')) return 'status-danger';
    return 'status-safe';
  };

  const datePickerStyle = {
    background: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    color: '#f8fafc',
    borderRadius: '8px',
    padding: '0.45rem 0.85rem',
    fontSize: '0.82rem',
    fontWeight: '600',
    outline: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    cursor: 'pointer'
  };

  return (
    <div className="tab-pane active">
      {/* Modal Rekapitulasi Total Produksi Per Tanggal */}
      {isModalRekapOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '820px', width: '95%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} style={{ color: 'var(--indigo)' }} /> Rekapitulasi Total Produksi Per Tanggal
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsModalRekapOpen(false)}><X size={16} /></button>
            </div>
            
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem' }}>
              {/* Controls Toolbar dengan Style Date Picker Modern */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Pilih Bulan</label>
                  <input
                    type="month"
                    style={datePickerStyle}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                </div>
                
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Cari Produk</label>
                  <div className="search-box">
                    <Search size={14} />
                    <input type="text" placeholder="Misal: RCS, BS..." value={searchRekap} onChange={(e) => setSearchRekap(e.target.value)} />
                  </div>
                </div>

                {selectedMonth !== currentMonthStr && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setSelectedMonth(currentMonthStr)}
                    title="Kembali ke bulan berjalan"
                  >
                    Bulan Berjalan
                  </button>
                )}

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn btn-sm btn-outline" onClick={handleExportExcelRekap} title="Export ke Excel (.csv)">
                    <FileSpreadsheet size={15} style={{ color: 'var(--emerald)' }} /> Excel
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={handleExportPdfRekap} title="Cetak / Preview Rekap PDF">
                    <FileText size={15} style={{ color: 'var(--amber)' }} /> Cetak PDF
                  </button>
                </div>
              </div>

              {/* Status Header Informasi */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Menampilkan rekapitulasi data bulan: <strong style={{ color: 'var(--cyan)' }}>{selectedMonth || 'Semua Bulan'}</strong>
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '0.78rem' }}>
                  Total: {filteredRekap.reduce((acc, curr) => acc + curr.totalBatch, 0)} Batch
                </span>
              </div>

              {/* Table Rekap 3 Kolom Bersih & Rapi */}
              <div className="table-responsive">
                <table className="custom-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '22%', paddingLeft: '1rem' }}>TANGGAL PRODUKSI</th>
                      <th style={{ width: '25%' }}>TOTAL BATCH</th>
                      <th style={{ width: '53%' }}>RINCIAN PRODUK DILAKUKAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRekap.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">
                          Tidak ada data produksi untuk periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredRekap.map(g => {
                        const isToday = g.tanggal === todayStr;
                        return (
                          <tr key={g.tanggal} style={{ background: isToday ? 'rgba(99, 102, 241, 0.06)' : 'transparent' }}>
                            <td style={{ verticalAlign: 'middle', paddingLeft: '1rem' }}>
                              <strong style={{ fontSize: '0.92rem', color: isToday ? '#818cf8' : 'var(--text-main)' }}>{g.tanggal}</strong>
                              {isToday && <span className="badge badge-cyan" style={{ marginLeft: '0.5rem', fontSize: '0.62rem', padding: '0.15rem 0.45rem' }}>HARI INI</span>}
                            </td>
                            <td style={{ verticalAlign: 'middle' }}>
                              <strong style={{ fontSize: '1rem', color: 'var(--emerald)' }}>{g.totalBatch} Batch</strong>
                              <span className="text-muted" style={{ display: 'block', fontSize: '0.72rem' }}>({g.totalTransaksi} Sesi Transaksi)</span>
                            </td>
                            <td style={{ verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
                                {Object.entries(g.produkMap).map(([p, qty], pIdx) => (
                                  <span
                                    key={pIdx}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      background: 'rgba(245, 158, 11, 0.12)',
                                      border: '1px solid rgba(245, 158, 11, 0.35)',
                                      color: '#fbbf24',
                                      fontSize: '0.78rem',
                                      fontWeight: '600',
                                      padding: '0.22rem 0.6rem',
                                      borderRadius: '6px'
                                    }}
                                  >
                                    <span>{p}:</span>
                                    <strong style={{ color: '#ffffff', background: 'rgba(245, 158, 11, 0.3)', padding: '0.05rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                      {qty} Batch
                                    </strong>
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalRekapOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="stats-grid">
        <div
          className="stat-card border-cyan"
          style={{ cursor: 'pointer' }}
          onClick={onOpenModalProduksi}
          title="Klik untuk membuat batch produksi baru & potong stok bahan otomatis"
        >
          <div className="stat-icon icon-cyan"><Factory size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">Eksekusi Batch Produksi</span>
            <h3 className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--cyan)' }}>+ Batch Produksi</h3>
            <span className="stat-desc text-cyan" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Otomatis Potong Stok Bahan <ArrowRight size={12} />
            </span>
          </div>
        </div>

        <div
          className="stat-card border-amber"
          style={{ cursor: 'pointer' }}
          onClick={() => onSwitchTab ? onSwitchTab('bahan-baku') : onNavigate && onNavigate('bahan-baku')}
          title="Klik untuk membuka tab Stok Bahan Baku"
        >
          <div className="stat-icon icon-amber"><AlertCircle size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">Bahan Baku Menipis</span>
            <h3 className="stat-value">{lowStockList.length} Items</h3>
            <span className="stat-desc text-amber" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Membutuhkan Restock <ArrowRight size={12} />
            </span>
          </div>
        </div>

        <div className="stat-card border-indigo">
          <div className="stat-icon icon-indigo"><ChefHat size={24} /></div>
          <div className="stat-details" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span className="stat-title">Produksi Hari Ini ({todayStr})</span>
                <h3 className="stat-value">{todayProduksiCount} Batch</h3>
                <span className="stat-desc text-indigo">Sesi Produksi Batch Hari Ini</span>
              </div>
              <button
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', borderColor: 'rgba(99, 102, 241, 0.5)', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setIsModalRekapOpen(true)}
                title="Lihat rekapitulasi total produksi per tanggal secara detail"
              >
                <Calendar size={14} /> Detail Per Tanggal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== GRAFIK STOK VS PEMAKAIAN BAHAN BAKU PER HARI SECTION ===== */}
      <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Activity size={20} style={{ color: 'var(--cyan)' }} /> Grafik Stok vs Pemakaian Bahan Baku (Bulan Berjalan: {dailyStockUsageChartData.currentMonthName})
            </h3>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.2rem', margin: 0 }}>
              Perbandingan total persediaan stok bahan baku gudang dengan tingkat pemakaian olahan dapur per hari di bulan berjalan.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', fontWeight: 700 }}>
              <span style={{ width: 12, height: 12, background: 'var(--cyan)', borderRadius: '3px', display: 'inline-block' }}></span> Total Stok Bahan Baku
            </span>
            <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f43f5e', fontWeight: 700 }}>
              <span style={{ width: 12, height: 12, background: 'var(--rose)', borderRadius: '3px', display: 'inline-block' }}></span> Pemakaian Dapur / Hari
            </span>
          </div>
        </div>

        {/* DUAL BAR CHART GRAPH (FULL 30 DAYS / 1 BULAN SCROLLABLE) */}
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem 1rem 1rem 1rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '220px', minWidth: '950px', gap: '0.35rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            {dailyStockUsageChartData.chartData.map(item => {
              const stockHeight = item.stockQty > 0 ? Math.max(15, Math.round((item.stockQty / dailyStockUsageChartData.maxVal) * 100)) : 8;
              const usageHeight = item.usageQty > 0 ? Math.max(15, Math.round((item.usageQty / (dailyStockUsageChartData.maxVal / 2)) * 100)) : 8;

              return (
                <div key={item.dateStr} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', minWidth: '26px' }}>
                  {/* Bars Container */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', width: '100%', justifyContent: 'center', height: '85%' }}>
                    {/* Stock Bar */}
                    <div
                      style={{
                        width: '45%',
                        maxWidth: '14px',
                        height: `${stockHeight}%`,
                        background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
                        borderRadius: '3px 3px 0 0',
                        boxShadow: item.isToday ? '0 0 10px rgba(56, 189, 248, 0.5)' : 'none',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      title={`Tgl ${item.dayLabel}: Total Stok ${formatNumber(item.stockQty)} Items`}
                    />
                    {/* Usage Bar */}
                    <div
                      style={{
                        width: '45%',
                        maxWidth: '14px',
                        height: `${usageHeight}%`,
                        background: item.usageQty > 0 ? 'linear-gradient(180deg, #f43f5e 0%, #be123c 100%)' : 'rgba(148, 163, 184, 0.2)',
                        borderRadius: '3px 3px 0 0',
                        boxShadow: item.usageQty > 0 ? '0 0 10px rgba(244, 63, 94, 0.5)' : 'none',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      title={`Tgl ${item.dayLabel}: Pemakaian Dapur ${formatNumber(item.usageQty)} Qty`}
                    />
                  </div>

                  {/* Date Label X-Axis */}
                  <div style={{ fontSize: '0.68rem', fontWeight: item.isToday ? 800 : 500, color: item.isToday ? 'var(--cyan)' : 'var(--text-muted)', marginTop: '0.5rem', whiteSpace: 'nowrap' }}>
                    {item.dayLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
