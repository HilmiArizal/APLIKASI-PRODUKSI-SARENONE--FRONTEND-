import React, { useState, useRef, useMemo } from 'react';
import { Package, Layers, MinusCircle, CheckCircle, Search, Calendar, History, Clock, ChevronLeft, ChevronRight, Sparkles, FileSpreadsheet, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatNumber, STOCK_AWAL_JULI, getBahanSatuan, getProdukKemasanMap, getDefaultPackagingForProduct } from '../data/initialData';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { ModernDatePicker } from './ModernDatePicker';
import { ModalPemakaianKemasan } from './Modals';

export default function PemakaianKemasanTab({
  bahanBaku = [],
  auditLog = [],
  hasilProduksi = [],
  utangList = [],
  activeRoleView,
  onUseKemasan,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBahanForModal, setSelectedBahanForModal] = useState(null);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthStr = todayStr.substring(0, 7); // e.g. "2026-08"

  const [selectedDateFilter, setSelectedDateFilter] = useState(todayStr);

  // Filter packaging materials
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

  // Synthesize dynamic packaging logs from hasilProduksi so records never appear empty
  const synthesizedHasilLogs = useMemo(() => {
    const logs = [];
    const kemasanMap = getProdukKemasanMap();

    (hasilProduksi || []).forEach((y, idx) => {
      const dateStr = y.tanggal || todayStr;
      const timeStr = y.timestamp || `${dateStr} 08:30`;
      const qty = parseFloat(y.jumlahPcs) || 0;
      const prodName = y.produkNama || 'Sosis Cocktail Merah 500g';

      const prodKey = y.produkId || y.kode || y.alias || y.produkNama;
      const rule = kemasanMap[prodKey] || kemasanMap[y.alias] || kemasanMap[y.kode] || getDefaultPackagingForProduct(y);

      const vacumName = rule.vacumbagNama || 'Vacumbag 20*25';
      const barcodeName = rule.stickerBarcodeNama || 'Sticker Barcode';
      const produkStickerName = rule.stickerProdukNama || 'Sticker Produk';

      logs.push({
        id: `AUTO-VAC-${y.id || idx}`,
        user: 'Tim Produksi',
        role: 'PRODUKSI',
        aksi: 'Pemakaian Kemasan',
        detail: `Pemakaian ${qty} pcs ${vacumName} - Otomatis via Hasil Produksi (${prodName})`,
        timestamp: timeStr
      });
      logs.push({
        id: `AUTO-BAR-${y.id || idx}`,
        user: 'Tim Produksi',
        role: 'PRODUKSI',
        aksi: 'Pemakaian Kemasan',
        detail: `Pemakaian ${qty} pcs ${barcodeName} - Otomatis via Hasil Produksi (${prodName})`,
        timestamp: timeStr
      });
      logs.push({
        id: `AUTO-PRD-${y.id || idx}`,
        user: 'Tim Produksi',
        role: 'PRODUKSI',
        aksi: 'Pemakaian Kemasan',
        detail: `Pemakaian ${qty} pcs ${produkStickerName} - Otomatis via Hasil Produksi (${prodName})`,
        timestamp: timeStr
      });
    });
    return logs;
  }, [hasilProduksi, todayStr]);

  // Combine raw auditLog and synthesized logs seamlessly
  const allKemasanLogs = useMemo(() => {
    const rawLogs = auditLog.filter(log => {
      const aksi = (log.aksi || '').toLowerCase();
      const detail = (log.detail || '').toLowerCase();
      return aksi.includes('kemasan') || detail.includes('pemakaian');
    });

    const combined = [...rawLogs];
    synthesizedHasilLogs.forEach(sLog => {
      const exists = combined.some(r => r.detail === sLog.detail && r.timestamp === sLog.timestamp);
      if (!exists) {
        combined.push(sLog);
      }
    });

    return combined.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [auditLog, synthesizedHasilLogs]);

  const canUse = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  // Robust log-to-material matcher
  const isLogMatchingMaterial = (logDetail, b) => {
    if (!logDetail || !b) return false;
    const detailLower = String(logDetail).toLowerCase();
    const bName = String(b.nama || '').trim().toLowerCase();
    const bSku = String(b.sku || b.kode || '').trim().toLowerCase();

    if (detailLower.includes(bName)) return true;
    if (bSku && detailLower.includes(bSku)) return true;

    // Dimension normalization (e.g. 20*25 vs 20x25 vs 25*30 vs 23*30)
    const normName = bName.replace(/[\*\s]/g, 'x');
    const normDetail = detailLower.replace(/[\*\s]/g, 'x');
    if (normDetail.includes(normName)) return true;

    // Cross-dimension aliases for 900g / 1000g vacumbag if registered as 25x30 / 23x30
    if (bName.includes('vacum')) {
      if ((bName.includes('23') || bName.includes('25')) && (bName.includes('30'))) {
        if ((detailLower.includes('23') || detailLower.includes('25')) && detailLower.includes('30')) return true;
      }
    }

    // Specific packaging category checks
    if (bName.includes('barcode') && detailLower.includes('barcode')) return true;
    if ((bName.includes('produk') || bName.includes('stiker produk') || bName.includes('sticker produk')) && detailLower.includes('sticker produk')) return true;

    return false;
  };

  // Get Day-by-Day Continuous Stock Timeline for Material b up to targetDateStr
  // Ensures Stok Awal(T) STRICTLY equals Stok Akhir(T-1) continuously across all dates
  const getPackagingDailyTimeline = (b, targetDateStr) => {
    if (!b) return { stokAwal: 0, penerimaan: 0, pemakaian: 0, stokAkhir: 0 };
    const targetDate = targetDateStr && targetDateStr.length === 10 ? targetDateStr : todayStr;
    const bSku = String(b.sku || b.kode || '').trim().toUpperCase();

    // Base Starting Stock (July 31st Ending / Beginning of Month)
    let currentStock = 0;
    const targetPeriode = targetDate ? targetDate.substring(0, 7) : currentMonthStr;
    const periodStokLocal = localStorage.getItem(`STOK_AWAL_${targetPeriode}_${bSku}`);
    const generalStokLocal = localStorage.getItem('STOK_AWAL_' + bSku);

    if (b.stokAwalMap && b.stokAwalMap[targetPeriode] !== undefined && b.stokAwalMap[targetPeriode] !== null && !isNaN(Number(b.stokAwalMap[targetPeriode]))) {
      currentStock = Number(b.stokAwalMap[targetPeriode]);
    } else if (periodStokLocal !== null && !isNaN(Number(periodStokLocal))) {
      currentStock = Number(periodStokLocal);
    } else if (b.stokAwal !== undefined && b.stokAwal !== null && !isNaN(Number(b.stokAwal)) && Number(b.stokAwal) > 0) {
      currentStock = Number(b.stokAwal);
    } else if (generalStokLocal !== null && !isNaN(Number(generalStokLocal))) {
      currentStock = Number(generalStokLocal);
    } else if (STOCK_AWAL_JULI[bSku] !== undefined) {
      currentStock = Number(STOCK_AWAL_JULI[bSku]);
    } else {
      currentStock = Number(b.stok) || 0;
    }

    if (!targetDate) {
      return { stokAwal: currentStock, penerimaan: 0, pemakaian: 0, stokAkhir: currentStock };
    }

    // Collect all transaction dates for material b
    const dateSet = new Set();
    dateSet.add(targetDate);
    dateSet.add('2026-08-01');

    // 1. PO / Suppliers Restock Dates
    (utangList || []).forEach(po => {
      const isMatch = (bSku && String(po.sku || po.kode || '').toUpperCase() === bSku) ||
        (Array.isArray(po.items) && po.items.some(it => isLogMatchingMaterial(it.nama || it.detail || it.bahanNama, b))) ||
        isLogMatchingMaterial(po.nama || po.detail || po.bahanNama, b);

      if (isMatch) {
        if (Array.isArray(po.riwayatPenerimaan) && po.riwayatPenerimaan.length > 0) {
          po.riwayatPenerimaan.forEach(r => {
            const rawDate = r.tanggal || po.tanggalPenerimaan || po.tanggalBeli || po.tanggal || r.createdAt || po.createdAt || '';
            const dStr = String(rawDate).substring(0, 10);
            if (dStr && dStr <= targetDate) dateSet.add(dStr);
          });
        } else {
          const rawDate = po.tanggalPenerimaan || po.tanggalBeli || po.tanggal || po.createdAt || '';
          const dStr = String(rawDate).substring(0, 10);
          if (dStr && dStr <= targetDate) dateSet.add(dStr);
        }
      }
    });

    // 2. Audit Log Receipt Dates (Stok Masuk / Restock In)
    (auditLog || []).forEach(log => {
      const aksi = String(log.aksi || '').toLowerCase();
      const detail = String(log.detail || '').toLowerCase();
      if (aksi.includes('stok masuk') || aksi.includes('restock') || aksi.includes('penerimaan') || detail.includes('stok masuk') || detail.includes('restock')) {
        if (isLogMatchingMaterial(log.detail || log.nama, b)) {
          const rawDate = log.timestamp || log.tanggal || log.createdAt || '';
          const dStr = String(rawDate).substring(0, 10);
          if (dStr && dStr <= targetDate) dateSet.add(dStr);
        }
      }
    });

    // 3. Yield / Packaging usage dates
    (allKemasanLogs || []).forEach(log => {
      const lDate = (log.timestamp || '').substring(0, 10);
      if (lDate && lDate <= targetDate) {
        if (isLogMatchingMaterial(log.detail, b)) {
          dateSet.add(lDate);
        }
      }
    });

    const sortedDates = Array.from(dateSet).sort();

    let runningStokAwal = currentStock;
    let runningPenerimaan = 0;
    let runningPemakaian = 0;
    let runningStokAkhir = currentStock;

    for (const d of sortedDates) {
      runningStokAwal = runningStokAkhir;
      let dayPenerimaan = 0;
      let dayPemakaian = 0;

      // Restock In (Penerimaan) on date d from utangList (PO Goods Receipts)
      (utangList || []).forEach(po => {
        const directMatch = (bSku && String(po.sku || po.kode || '').toUpperCase() === bSku) || isLogMatchingMaterial(po.nama || po.detail || po.bahanNama, b);
        let itemQtyOnDate = 0;

        if (Array.isArray(po.items) && po.items.length > 0) {
          po.items.forEach(it => {
            if (isLogMatchingMaterial(it.nama || it.detail || it.bahanNama, b)) {
              const rawDate = it.tanggal || it.tanggalPenerimaan || po.tanggalPenerimaan || po.tanggalBeli || po.tanggal || po.createdAt || '';
              const rDate = String(rawDate).substring(0, 10);
              if (rDate === d) {
                itemQtyOnDate += Number(it.jumlahDiterima || it.diterima || it.qty || it.jumlah || 0);
              }
            }
          });
        }

        if (itemQtyOnDate > 0) {
          dayPenerimaan += itemQtyOnDate;
        } else if (directMatch) {
          if (Array.isArray(po.riwayatPenerimaan) && po.riwayatPenerimaan.length > 0) {
            po.riwayatPenerimaan.forEach(r => {
              const rawDate = r.tanggal || po.tanggalPenerimaan || po.tanggalBeli || po.tanggal || r.createdAt || po.createdAt || '';
              const rDate = String(rawDate).substring(0, 10);
              if (rDate === d) {
                dayPenerimaan += Number(r.jumlah || r.diterima || 0);
              }
            });
          } else {
            const qty = Number(po.jumlahDiterima || po.jumlah || 0);
            if (qty > 0) {
              const rawDate = po.tanggalPenerimaan || po.tanggalBeli || po.tanggal || po.createdAt || '';
              const pDate = String(rawDate).substring(0, 10);
              if (pDate === d) {
                dayPenerimaan += qty;
              }
            }
          }
        }
      });

      // Restock In (Penerimaan) on date d from auditLog (Stok Masuk / Restock In)
      (auditLog || []).forEach(log => {
        const aksi = String(log.aksi || '').toLowerCase();
        const detail = String(log.detail || '').toLowerCase();
        const isRollback = aksi.includes('rollback') || aksi.includes('batal') || detail.includes('rollback') || detail.includes('membatalkan');
        if (isRollback) return;
        if (aksi.includes('stok masuk') || aksi.includes('restock') || aksi.includes('penerimaan') || detail.includes('stok masuk') || detail.includes('restock')) {
          const rawDate = log.timestamp || log.tanggal || log.createdAt || '';
          const logDate = String(rawDate).substring(0, 10);
          if (logDate === d && isLogMatchingMaterial(log.detail || log.nama, b)) {
            const match = String(log.detail || '').match(/(\+|\b)([0-9.]+)\s*(kg|pcs|pack|liter|l|g|pouch|roll|lembar)/i);
            if (match && match[2]) {
              dayPenerimaan += parseFloat(match[2]) || 0;
            } else if (log.jumlah || log.qty) {
              dayPenerimaan += parseFloat(log.jumlah || log.qty) || 0;
            }
          }
        }
      });

      // Usage (Pemakaian) on date d
      (allKemasanLogs || []).forEach(log => {
        const lDate = (log.timestamp || '').substring(0, 10);
        if (lDate === d && isLogMatchingMaterial(log.detail, b)) {
          const match = String(log.detail || '').match(/Pemakaian\s+([0-9.]+)/i);
          if (match && match[1]) {
            dayPemakaian += parseFloat(match[1]) || 0;
          }
        }
      });

      runningPenerimaan = dayPenerimaan;
      runningPemakaian = dayPemakaian;
      runningStokAkhir = Math.max(0, Math.round((runningStokAwal + dayPenerimaan - dayPemakaian) * 1000) / 1000);

      if (d === targetDate) {
        return {
          stokAwal: runningStokAwal,
          penerimaan: dayPenerimaan,
          pemakaian: dayPemakaian,
          stokAkhir: runningStokAkhir
        };
      }
    }

    return {
      stokAwal: runningStokAwal,
      penerimaan: runningPenerimaan,
      pemakaian: runningPemakaian,
      stokAkhir: runningStokAkhir
    };
  };

  // KPI Summary object for header cards
  const kpiSummary = useMemo(() => {
    const totalUsedDate = displayMaterials.reduce((acc, b) => {
      const { pemakaian } = getPackagingDailyTimeline(b, selectedDateFilter);
      return acc + pemakaian;
    }, 0);

    const totalStokSisa = displayMaterials.reduce((acc, b) => {
      const { stokAkhir } = getPackagingDailyTimeline(b, selectedDateFilter);
      return acc + stokAkhir;
    }, 0);

    return { totalUsedDate, totalStokSisa };
  }, [displayMaterials, selectedDateFilter, allKemasanLogs, utangList]);

  // Export handlers
  const handleExportExcel = () => {
    const exportData = displayMaterials.map((b, idx) => {
      const timeline = getPackagingDailyTimeline(b, selectedDateFilter);
      const bSatuan = getBahanSatuan(b);
      const isThin = timeline.stokAkhir <= b.minStok && timeline.stokAkhir > 0;
      const isEmpty = timeline.stokAkhir === 0;

      return {
        No: idx + 1,
        SKU: b.sku,
        'Nama Kemasan': b.nama,
        Kategori: b.kategori || 'Bahan Kemasan',
        'Stok Awal': `${formatNumber(timeline.stokAwal)} ${bSatuan}`,
        'Penerimaan': `${formatNumber(timeline.penerimaan)} ${bSatuan}`,
        'Pemakaian': `${formatNumber(timeline.pemakaian)} ${bSatuan}`,
        'Stok Akhir': `${formatNumber(timeline.stokAkhir)} ${bSatuan}`,
        Status: isEmpty ? 'Habis' : isThin ? 'Menipis' : 'Aman'
      };
    });

    exportToExcel(exportData, `Stok_Kemasan_${selectedDateFilter || 'Semua_Periode'}`);
  };

  const handleExportPDF = () => {
    const exportData = displayMaterials.map((b, idx) => {
      const timeline = getPackagingDailyTimeline(b, selectedDateFilter);
      const bSatuan = getBahanSatuan(b);
      const isThin = timeline.stokAkhir <= b.minStok && timeline.stokAkhir > 0;
      const isEmpty = timeline.stokAkhir === 0;

      return {
        No: idx + 1,
        SKU: b.sku,
        'Nama Kemasan': b.nama,
        'Stok Awal': `${formatNumber(timeline.stokAwal)} ${bSatuan}`,
        'Masuk': `${formatNumber(timeline.penerimaan)} ${bSatuan}`,
        'Keluar': `${formatNumber(timeline.pemakaian)} ${bSatuan}`,
        'Stok Akhir': `${formatNumber(timeline.stokAkhir)} ${bSatuan}`,
        Status: isEmpty ? 'Habis' : isThin ? 'Menipis' : 'Aman'
      };
    });

    exportToPDF(
      `Laporan Stok & Pemakaian Kemasan (${selectedDateFilter || 'Semua Periode'})`,
      ['No', 'SKU', 'Nama Kemasan', 'Stok Awal', 'Masuk', 'Keluar', 'Stok Akhir', 'Status'],
      exportData.map(d => Object.values(d)),
      `laporan_stok_kemasan_${selectedDateFilter || 'semua'}.pdf`
    );
  };

  return (
    <div className="tab-pane active">
      {/* ===== HEADER BANNER CARD ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 45%, #09132b 100%)',
        borderRadius: '12px',
        padding: '0.85rem 1.15rem',
        marginBottom: '0.75rem',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 6px 20px rgba(2, 132, 199, 0.25)',
        border: '1px solid rgba(56, 189, 248, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '280px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7dd3fc' }}>
              MUTASI STOK BAHAN KEMASAN
            </span>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0.1rem 0 0 0', color: '#ffffff' }}>
              Pemakaian berdasarkan hasil produksi
            </h2>
            <p style={{ fontSize: '0.76rem', margin: 0, color: '#e0f2fe' }}>
              Stok Awal(T) otomatis menyambung dari Stok Akhir(T-1) secara kontinu &amp; real-time.
            </p>
          </div>
        </div>

        {canUse && (
          <button
            type="button"
            className="btn btn-emerald"
            onClick={() => { setSelectedBahanForModal(null); setIsModalOpen(true); }}
            style={{ fontWeight: 800, height: '32px', fontSize: '0.78rem', padding: '0 0.75rem', borderRadius: '6px', boxShadow: '0 3px 10px rgba(16, 185, 129, 0.35)', marginLeft: 'auto', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <MinusCircle size={14} /> + Catat Pemakaian Manual
          </button>
        )}
      </div>

      {/* ===== KPI SUMMARY CARDS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(245, 158, 11, 0.25)', borderTop: '3.5px solid var(--amber)', borderRadius: '10px', padding: '0.75rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              PEMAKAIAN KEMASAN ({selectedDateFilter === todayStr ? 'HARI INI' : selectedDateFilter})
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} style={{ color: 'var(--amber)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {formatNumber(kpiSummary.totalUsedDate)} <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>pcs</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
            Total Pemakaian Hari Terpilih
          </span>
        </div>

        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(56, 189, 248, 0.25)', borderTop: '3.5px solid var(--cyan)', borderRadius: '10px', padding: '0.75rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              TOTAL STOK GUDANG KEMASAN
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} style={{ color: 'var(--cyan)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {formatNumber(kpiSummary.totalStokSisa)} <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>pcs</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
            Total Sisa Siap Pakai di Gudang
          </span>
        </div>

        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(16, 185, 129, 0.25)', borderTop: '3.5px solid var(--emerald)', borderRadius: '10px', padding: '0.75rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              JUMLAH VARIAN KEMASAN
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} style={{ color: 'var(--emerald)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {displayMaterials.length} <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>Item</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
            Vacumbag &amp; Sticker Terdaftar
          </span>
        </div>
      </div>

      {/* ===== TOOLBAR & CONTROL BAR ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ height: '32px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Cari SKU atau nama kemasan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: '0.78rem' }}
            />
          </div>

          <ModernDatePicker
            value={selectedDateFilter}
            onChange={(val) => setSelectedDateFilter(val)}
          />
        </div>
      </div>

      {/* ===== TABEL UTAMA PEMAKAIAN KEMASAN PER-TANGGAL ===== */}
      <div className="table-container" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
        <table className="custom-table" style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'center', width: '35px', whiteSpace: 'nowrap' }}>NO</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>SKU / KODE</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>NAMA BAHAN KEMASAN</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>KATEGORI</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>STOK AWAL</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>PENERIMAAN</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>PEMAKAIAN</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>STOK AKHIR</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'center', whiteSpace: 'nowrap' }}>STATUS</th>
              {canUse && <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'center', whiteSpace: 'nowrap' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {displayMaterials.length === 0 ? (
              <tr>
                <td colSpan={canUse ? 10 : 9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Tidak ada bahan kemasan yang sesuai.
                </td>
              </tr>
            ) : (
              displayMaterials.map((b, idx) => {
                const timeline = getPackagingDailyTimeline(b, selectedDateFilter);
                const bSatuan = getBahanSatuan(b);
                const isThin = timeline.stokAkhir <= b.minStok && timeline.stokAkhir > 0;
                const isEmpty = timeline.stokAkhir === 0;

                return (
                  <tr key={b.id || b._id || b.sku || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'center', color: '#64748b', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', fontWeight: 800, color: '#d97706', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                      {b.sku}
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', fontWeight: 800, color: '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                      {b.nama}
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px', display: 'inline-block' }}>
                        {b.kategori || 'Bahan Kemasan'}
                      </span>
                    </td>

                    {/* 1. Stok Awal (T) */}
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                      {formatNumber(timeline.stokAwal)} <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{bSatuan}</span>
                    </td>

                    {/* 2. Penerimaan (T) */}
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', fontWeight: 800, color: timeline.penerimaan > 0 ? '#0284c7' : '#94a3b8', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                      {timeline.penerimaan > 0 ? `+${formatNumber(timeline.penerimaan)}` : '0'} <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{bSatuan}</span>
                    </td>

                    {/* 3. Pemakaian (T) */}
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', fontWeight: 900, color: timeline.pemakaian > 0 ? '#d97706' : '#94a3b8', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                      {timeline.pemakaian > 0 ? `-${formatNumber(timeline.pemakaian)}` : '0'} <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{bSatuan}</span>
                    </td>

                    {/* 4. Stok Akhir (T) = Stok Awal + Penerimaan - Pemakaian */}
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', fontWeight: 900, color: isEmpty ? '#ef4444' : isThin ? '#d97706' : '#10b981', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {formatNumber(timeline.stokAkhir)} <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{bSatuan}</span>
                    </td>

                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {isEmpty ? (
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>🚨 HABIS</span>
                      ) : isThin ? (
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>⚠️ MENIPIS</span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>✓ AMAN</span>
                      )}
                    </td>
                    {canUse && (
                      <td style={{ padding: '0.32rem 0.55rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBahanForModal(b);
                            setIsModalOpen(true);
                          }}
                          style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            borderRadius: '5px',
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            padding: '0.15rem 0.45rem',
                            height: '24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <MinusCircle size={12} /> Input Manual
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

      {/* Modal Pemakaian Kemasan */}
      <ModalPemakaianKemasan
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUseKemasan={onUseKemasan}
        bahanList={bahanBaku}
        selectedBahan={selectedBahanForModal}
        totalVacumbagSuggestQty={0}
        showAlert={showAlert}
      />
    </div>
  );
}
