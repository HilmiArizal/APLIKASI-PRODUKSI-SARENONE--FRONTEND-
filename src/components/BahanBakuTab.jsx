import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2, FileText, Tag, Upload, Calendar, Info } from 'lucide-react';
import { formatNumber, STOCK_AWAL_JULI, HARGA_AWAL_JULI, getSkuSortIndex, getThreeMonthCutoffDate, getThreeMonthCutoffLabel, getBahanSatuan } from '../data/initialData';
import { exportToExcel } from '../utils/exportUtils';
import ModalPreviewPdf from './ModalPreviewPdf';
import { ModalImportBahanExcel, ModalImportStokAwalExcel } from './Modals';

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
  onImportStokAwalExcel,
  showAlert
}) {
  const todayStr = new Date().toISOString().substring(0, 10);
  const cutoffDateStr = getThreeMonthCutoffDate();
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [filterTanggal, setFilterTanggal] = useState(todayStr);
  const [isPreviewPdfOpen, setIsPreviewPdfOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);
  const [isImportStokAwalOpen, setIsImportStokAwalOpen] = useState(false);

  const isSuperAdmin = (activeRoleView === 'ADMIN');
  const canAddOrRestock = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  // Robust Material Match Helper
  const isBahanMatch = (item, b) => {
    if (!item || !b) return false;
    const bNm = String(b.nama || '').trim().toLowerCase();
    const bId = String(b.id || b._id || '').trim().toLowerCase();
    const bSku = String(b.sku || b.kode || '').trim().toLowerCase();

    const itemNm = String(item.bahanNama || item.nama || '').trim().toLowerCase();
    const itemId = String(item.bahanId || item.id || '').trim().toLowerCase();
    const itemSku = String(item.sku || item.kode || '').trim().toLowerCase();

    if (bSku && itemSku && bSku === itemSku) return true;
    if (bId && itemId && bId === itemId) return true;
    if (bNm && itemNm && bNm === itemNm) return true;
    return false;
  };

  // Get Day-by-Day Continuous Stock Timeline for Material b up to targetDateStr
  // Ensures Stok Awal(T) STRICTLY equals Stok Akhir(T-1) continuously across all dates
  const getBahanDailyTimeline = (b, targetDateStr) => {
    if (!b) return { stokAwal: 0, penerimaan: 0, pemakaian: 0, stokAkhir: 0 };
    const targetDate = targetDateStr || todayStr;
    const bSku = String(b.sku || b.kode || '').trim().toUpperCase();

    // Base Starting Stock (July 31st Ending / Beginning of Month)
    let currentStock = 0;
    const targetPeriode = targetDate ? targetDate.substring(0, 7) : '2026-08';
    const periodStokLocal = localStorage.getItem(`STOK_AWAL_${targetPeriode}_${bSku}`);
    const generalStokLocal = localStorage.getItem('STOK_AWAL_' + bSku);

    if (b.stokAwalMap && b.stokAwalMap[targetPeriode] !== undefined && b.stokAwalMap[targetPeriode] !== null && !isNaN(Number(b.stokAwalMap[targetPeriode]))) {
      currentStock = Number(b.stokAwalMap[targetPeriode]);
    } else if (periodStokLocal !== null && !isNaN(Number(periodStokLocal))) {
      currentStock = Number(periodStokLocal);
    } else if (b.stokAwal !== undefined && b.stokAwal !== null && !isNaN(Number(b.stokAwal))) {
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

    // Collect all transaction dates for material b from utangList, riwayatProduksi, and auditLog
    const dateSet = new Set();
    dateSet.add(targetDate);
    dateSet.add('2026-08-01');

    (utangList || []).forEach(p => {
      if (!isBahanMatch(p, b)) return;
      if (Array.isArray(p.riwayatPenerimaan) && p.riwayatPenerimaan.length > 0) {
        p.riwayatPenerimaan.forEach(r => {
          const rawDate = r.tanggal || p.tanggalPenerimaan || p.tanggalBeli || p.tanggal || r.createdAt || p.createdAt || '';
          const dStr = String(rawDate).substring(0, 10);
          if (dStr && dStr <= targetDate) dateSet.add(dStr);
        });
      } else {
        const rawDate = p.tanggalPenerimaan || p.tanggalBeli || p.tanggal || p.createdAt || '';
        const dStr = String(rawDate).substring(0, 10);
        if (dStr && dStr <= targetDate) dateSet.add(dStr);
      }
    });

    (riwayatProduksi || []).forEach(r => {
      const rawDate = r.tanggal || r.timestamp || r.createdAt || '';
      const dStr = String(rawDate).substring(0, 10);
      if (dStr && dStr <= targetDate) dateSet.add(dStr);
    });

    (auditLog || []).forEach(log => {
      const rawDate = log.timestamp || log.tanggal || log.createdAt || '';
      const dStr = String(rawDate).substring(0, 10);
      if (dStr && dStr <= targetDate) dateSet.add(dStr);
    });

    // Sort all dates chronologically
    const sortedDates = Array.from(dateSet).sort();

    let targetStokAwal = currentStock;
    let targetPenerimaan = 0;
    let targetPemakaian = 0;
    let targetStokAkhir = currentStock;

    for (const dStr of sortedDates) {
      const dayStokAwal = currentStock;
      const dayRx = getReceiptOnSpecificDate(b, dStr);
      const dayCx = getConsumptionOnSpecificDate(b, dStr);
      const dayStokAkhir = Math.round(Math.max(0, dayStokAwal + dayRx - dayCx) * 1000) / 1000;

      if (dStr === targetDate) {
        targetStokAwal = dayStokAwal;
        targetPenerimaan = dayRx;
        targetPemakaian = dayCx;
        targetStokAkhir = dayStokAkhir;
      }

      currentStock = dayStokAkhir;
    }

    return {
      stokAwal: targetStokAwal,
      penerimaan: targetPenerimaan,
      pemakaian: targetPemakaian,
      stokAkhir: targetStokAkhir
    };
  };

  // Calculate Stock Awal (Beginning Stock at the start of target date = Ending Stock of previous date)
  const getStokAwalOnDate = (b, targetDateStr) => {
    return getBahanDailyTimeline(b, targetDateStr).stokAwal;
  };

  // Calculate Stock Position per Specific Target Date:
  const getBahanStokOnDate = (b, targetDateStr) => {
    return getBahanDailyTimeline(b, targetDateStr).stokAkhir;
  };

  // Get Receipts (Supplier PO Receipts + Emulsion Production Yields) Specifically ON Target Date
  const getReceiptOnSpecificDate = (b, targetDateStr) => {
    if (!b || !targetDateStr) return 0;
    let total = 0;

    // 1. Supplier PO Goods Receipts
    (utangList || []).forEach(p => {
      if (!isBahanMatch(p, b)) return;

      if (Array.isArray(p.riwayatPenerimaan) && p.riwayatPenerimaan.length > 0) {
        p.riwayatPenerimaan.forEach(r => {
          const rawDate = r.tanggal || p.tanggalPenerimaan || p.tanggalBeli || p.tanggal || r.createdAt || p.createdAt || '';
          const rDate = String(rawDate).substring(0, 10);
          if (rDate === targetDateStr) {
            total += Number(r.jumlah || r.diterima || 0);
          }
        });
      } else {
        const qty = Number(p.jumlahDiterima || p.jumlah || 0);
        if (qty > 0) {
          const rawDate = p.tanggalPenerimaan || p.tanggalBeli || p.tanggal || p.createdAt || '';
          const pDate = String(rawDate).substring(0, 10);
          if (pDate === targetDateStr) {
            total += qty;
          }
        }
      }
    });

    // 2. Internal Emulsion Production Yields (for Emulsi ISP BB5 & Emulsi TVP BB55)
    const bSku = String(b.sku || b.kode || '').trim().toUpperCase();
    const bName = String(b.nama || '').trim().toLowerCase();
    const isEmulsiIsp = bSku === 'BB5' || bSku === 'EML-ISP' || bName.includes('emulsi isp');
    const isEmulsiTvp = bSku === 'BB55' || bSku === 'EML-TVP' || bName.includes('emulsi tvp');

    if (isEmulsiIsp || isEmulsiTvp) {
      (auditLog || []).forEach(log => {
        const aksi = String(log.aksi || '').toLowerCase();
        const detail = String(log.detail || '').toLowerCase();
        const isRollback = aksi.includes('rollback') || aksi.includes('batal') || detail.includes('rollback') || detail.includes('membatalkan');
        if (isRollback) return;
        if (!aksi.includes('emulsi') && !detail.includes('emulsi')) return;

        const rawDate = log.timestamp || log.tanggal || log.createdAt || '';
        const logDate = String(rawDate).substring(0, 10);
        if (logDate !== targetDateStr) return;

        if (isEmulsiIsp && (detail.includes('isp') || aksi.includes('isp'))) {
          let yieldQty = log.yieldQty || 0;
          if (!yieldQty) {
            const matchYield = detail.match(/menghasilkan\s*\+(\d+(?:\.\d+)?)\s*kg/i);
            if (matchYield) yieldQty = parseFloat(matchYield[1]);
          }
          if (!yieldQty) {
            const matchBatch = detail.match(/memproses\s*(\d+)\s*batch/i);
            const batchNum = matchBatch ? parseInt(matchBatch[1], 10) : 1;
            yieldQty = 20 * batchNum;
          }
          total += yieldQty;
        } else if (isEmulsiTvp && (detail.includes('tvp') || aksi.includes('tvp'))) {
          let yieldQty = log.yieldQty || 0;
          if (!yieldQty) {
            const matchYield = detail.match(/menghasilkan\s*\+(\d+(?:\.\d+)?)\s*kg/i);
            if (matchYield) yieldQty = parseFloat(matchYield[1]);
          }
          if (!yieldQty) {
            const matchBatch = detail.match(/memproses\s*(\d+)\s*batch/i);
            const batchNum = matchBatch ? parseInt(matchBatch[1], 10) : 1;
            yieldQty = 4 * batchNum;
          }
          total += yieldQty;
        }
      });
    }

    return Math.round(total * 1000) / 1000;
  };

  // Get Production Consumptions (Kitchen Finished Goods Batches based strictly on BOM + Emulsion Manufacturing Raw Materials)
  const getConsumptionOnSpecificDate = (b, targetDateStr) => {
    if (!b || !targetDateStr) return 0;
    let total = 0;

    // 1. Kitchen Finished Goods Production Consumptions (Strictly based on BOM deductions in riwayatProduksi!)
    (riwayatProduksi || []).forEach(r => {
      const rawDate = r.tanggal || r.timestamp || r.createdAt || '';
      const rDate = String(rawDate).substring(0, 10);
      if (rDate === targetDateStr) {
        const items = (Array.isArray(r.pemotonganBahan) && r.pemotonganBahan.length > 0)
          ? r.pemotonganBahan
          : (Array.isArray(r.bahanDigunakan) ? r.bahanDigunakan : []);

        items.forEach(item => {
          if (isBahanMatch(item, b)) {
            total += Number(item.jumlah || item.qty || 0);
          }
        });
      }
    });

    // 2. Consumptions of Raw Materials in Emulsion Manufacturing (Marksoy, Air Es, Minyak, TVP)
    // NOTE: This ONLY applies to raw materials used to make emulsion, NOT to Emulsi ISP/TVP items!
    const bSku = String(b.sku || b.kode || '').trim().toUpperCase();
    const bName = String(b.nama || '').trim().toLowerCase();
    const isEmulsiItem = bSku === 'BB5' || bSku === 'BB55' || bSku === 'EML-ISP' || bSku === 'EML-TVP' || bName.includes('emulsi');

    if (!isEmulsiItem) {
      (auditLog || []).forEach(log => {
        const aksi = String(log.aksi || '').toLowerCase();
        const detail = String(log.detail || '').toLowerCase();
        const isRollback = aksi.includes('rollback') || aksi.includes('batal') || detail.includes('rollback') || detail.includes('membatalkan');
        if (isRollback) return;
        if (!aksi.includes('emulsi') && !detail.includes('emulsi')) return;

        const rawDate = log.timestamp || log.tanggal || log.createdAt || '';
        const logDate = String(rawDate).substring(0, 10);
        if (logDate !== targetDateStr) return;

        const matchBatch = detail.match(/memproses\s*(\d+)\s*batch/i);
        const batchNum = matchBatch ? parseInt(matchBatch[1], 10) : 1;

        if (detail.includes('isp') || aksi.includes('isp')) {
          // Marksoy (BB6): 2 kg / batch
          if (bSku === 'BB6' || bName.includes('marksoy') || bName.includes('isp')) {
            total += 2 * batchNum;
          }
          // Air Es (BB8): 4 kg / batch
          if (bSku === 'BB8' || (bName.includes('air') && bName.includes('es'))) {
            total += 4 * batchNum;
          }
          // Minyak (BB7): 4 pouch / batch
          if (bSku === 'BB7' || bName.includes('minyak')) {
            total += 4 * batchNum;
          }
        } else if (detail.includes('tvp') || aksi.includes('tvp')) {
          // TVP (BB54): 1 kg / batch
          if (bSku === 'BB54' || bName.includes('tvp')) {
            total += 1 * batchNum;
          }
        }
      });
    }

    return Math.round(total * 1000) / 1000;
  };

  const filteredBahan = bahanBaku
    .filter(b => {
      const matchQuery = b.nama.toLowerCase().includes(search.toLowerCase()) || b.sku.toLowerCase().includes(search.toLowerCase());
      const matchKat = !kategoriFilter || b.kategori === kategoriFilter;
      return matchQuery && matchKat;
    })
    .sort((a, b) => getSkuSortIndex(a.sku) - getSkuSortIndex(b.sku));

  const getBahanHargaOnDate = (b, targetDateStr) => {
    if (!b) return 0;
    const bSku = String(b.sku || b.kode || '').trim().toUpperCase();

    // 1. Initial Price (H. AWAL)
    let initialPrice = 0;
    const localHargaAwal = localStorage.getItem('HARGA_AWAL_' + bSku);
    if (b.hargaAwal !== undefined && b.hargaAwal !== null && Number(b.hargaAwal) > 0) {
      initialPrice = Number(b.hargaAwal);
    } else if (localHargaAwal !== null && Number(localHargaAwal) > 0) {
      initialPrice = Number(localHargaAwal);
    } else if (HARGA_AWAL_JULI[bSku] !== undefined && Number(HARGA_AWAL_JULI[bSku]) > 0) {
      initialPrice = Number(HARGA_AWAL_JULI[bSku]);
    } else {
      initialPrice = Number(b.hargaBeli || b.harga || 0);
    }

    if (Array.isArray(b.riwayatHarga) && b.riwayatHarga.length > 0) {
      const pastPrices = b.riwayatHarga
        .filter(r => (!targetDateStr || (r.tanggal && r.tanggal.substring(0, 10) <= targetDateStr)) && Number(r.harga) > 0)
        .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
      if (pastPrices.length > 0) {
        return Number(pastPrices[0].harga);
      }
    }

    const validReceipts = [];
    (utangList || []).forEach(inv => {
      const isMatch = isBahanMatch(inv, b);
      if (!isMatch) return;

      if (Array.isArray(inv.riwayatPenerimaan) && inv.riwayatPenerimaan.length > 0) {
        inv.riwayatPenerimaan.forEach(r => {
          const rDate = (r.tanggal || inv.tanggalPenerimaan || inv.tanggalBeli || r.createdAt || '').substring(0, 10);
          if (rDate && (!targetDateStr || rDate <= targetDateStr) && Number(inv.hargaSatuan) > 0) {
            validReceipts.push({ tanggal: rDate, harga: Number(inv.hargaSatuan) });
          }
        });
      } else if (Number(inv.jumlahDiterima || 0) > 0) {
        const pDate = (inv.tanggalPenerimaan || inv.tanggalBeli || inv.createdAt || '').substring(0, 10);
        if (pDate && (!targetDateStr || pDate <= targetDateStr) && Number(inv.hargaSatuan) > 0) {
          validReceipts.push({ tanggal: pDate, harga: Number(inv.hargaSatuan) });
        }
      }
    });

    if (validReceipts.length > 0) {
      validReceipts.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      return validReceipts[0].harga;
    }

    return initialPrice;
  };

  const handleExportPDF = () => {
    const headers = filterTanggal
      ? ['SKU', 'Nama Bahan Baku', 'Kategori', `Harga (${filterTanggal})`, `Stok Awal (${filterTanggal})`, `Penerimaan (${filterTanggal})`, `Pemakaian (${filterTanggal})`, `Stok Akhir (${filterTanggal})`, 'Status']
      : ['SKU', 'Nama Bahan Baku', 'Kategori', 'Harga Terakhir', 'Stok Saat Ini', 'Batas Minimum', 'Status'];

    const rows = filteredBahan.map(b => {
      const stokAwalVal = getStokAwalOnDate(b, filterTanggal);
      const stokVal = getBahanStokOnDate(b, filterTanggal);
      const hargaVal = getBahanHargaOnDate(b, filterTanggal);
      const rxVal = getReceiptOnSpecificDate(b, filterTanggal);
      const cxVal = getConsumptionOnSpecificDate(b, filterTanggal);
      const isLow = stokVal <= b.minStok;

      if (filterTanggal) {
        return [
          b.sku,
          b.nama,
          b.kategori,
          `Rp ${formatNumber(hargaVal)}`,
          `${stokAwalVal} ${b.satuan}`,
          rxVal > 0 ? `+${rxVal} ${b.satuan}` : '0',
          cxVal > 0 ? `-${cxVal} ${b.satuan}` : '0',
          `${stokVal} ${b.satuan}`,
          isLow ? 'Restock!' : 'Safe'
        ];
      }

      return [
        b.sku,
        b.nama,
        b.kategori,
        `Rp ${formatNumber(hargaVal)}`,
        `${stokVal} ${b.satuan}`,
        `${b.minStok} ${b.satuan}`,
        isLow ? 'Restock!' : 'Safe'
      ];
    });

    const config = {
      title: 'Laporan Stok & Persediaan Dapur Bahan Baku',
      subtitle: filterTanggal ? `Posisi Persediaan per Tanggal: ${filterTanggal}` : `Tanggal Cetak: ${todayStr}`,
      headers,
      rows,
      summaryText: `Total Jenis Bahan: ${filteredBahan.length} Item`,
      filename: `Stok_Bahan_Baku_${filterTanggal || todayStr}`
    };

    if (onOpenPdfPreview) {
      onOpenPdfPreview(config);
    } else {
      exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
    }
  };

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      {/* ===== 3 MONTHS RETENTION NOTICE BANNER ===== */}
      <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
          <Info size={18} style={{ color: '#0284c7', flexShrink: 0 }} />
          <span>
            <strong>RETENSI PERSAAN BAHAN BAKU (MAKSIMAL 3 BULAN TERAKHIR):</strong> Akses persediaan dibatasi dari <strong>{getThreeMonthCutoffLabel()}</strong> s/d <strong>Hari Ini</strong>. Data &gt; 3 bulan dibersihkan otomatis demi efisiensi memori &amp; kecepatan sistem.
          </span>
        </div>
        <span className="badge badge-emerald" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
          🛡️ RETENSI 3 BULAN AKTIF
        </span>
      </div>

      {/* ===== HEADER BAR & FILTER TANGGAL ===== */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
            <Calendar size={16} style={{ color: '#2563eb' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Filter Tanggal Position:</span>
            <input
              type="date"
              min={cutoffDateStr}
              max={todayStr}
              value={filterTanggal}
              onChange={(e) => {
                const val = e.target.value;
                if (val && val < cutoffDateStr) {
                  if (showAlert) showAlert(`Akses stok dibatasi maksimal 3 Bulan Terakhir (${getThreeMonthCutoffLabel()}).`, 'warning', 'Batas Retensi 3 Bulan');
                  setFilterTanggal(cutoffDateStr);
                } else {
                  setFilterTanggal(val);
                }
              }}
              style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
            />
          </div>

          {filterTanggal !== todayStr && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setFilterTanggal(todayStr)}
              style={{ fontSize: '0.78rem' }}
            >
              Hari Ini
            </button>
          )}

          {filterTanggal && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setFilterTanggal('')}
              style={{ fontSize: '0.78rem' }}
            >
              Semua Tanggal
            </button>
          )}
        </div>
      </div>

      {/* ===== DATE POSITION SUMMARY BANNER ===== */}
      {filterTanggal && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          marginTop: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderLeft: '4px solid #38bdf8',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.12)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Calendar size={20} style={{ color: '#38bdf8' }} />
            <div>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.3px' }}>
                POSISI &amp; PERGERAKAN STOK TANGGAL: <span style={{ color: '#38bdf8' }}>{filterTanggal}</span>
              </span>
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
            Rumus: <span style={{ color: '#e2e8f0' }}>Stok Awal</span> + <span style={{ color: '#34d399' }}>Penerimaan (+)</span> - <span style={{ color: '#fb7185' }}>Pemakaian (-)</span> = <span style={{ color: '#38bdf8', fontWeight: 800 }}>Stok Akhir</span>
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="search-box" style={{ maxWidth: '320px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Cari SKU atau Nama Bahan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

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

        <div className="toolbar-actions">
          {canAddOrRestock && (
            <>
              <button className="btn btn-outline btn-emerald" onClick={() => setIsImportExcelOpen(true)} title="Import Master Bahan Baku Masal dari File Excel">
                <Upload size={16} style={{ color: 'var(--emerald)' }} /> Import Master Excel
              </button>

              <button
                className="btn btn-outline"
                onClick={() => setIsImportStokAwalOpen(true)}
                title="Import Stok Awal Bulan Manual (Khusus Super Admin Bahan Baku)"
                style={{ borderColor: '#10b981', color: '#047857', fontWeight: 700, background: '#ecfdf5' }}
              >
                <Calendar size={16} style={{ color: '#10b981' }} /> Import Stok Awal
              </button>
            </>
          )}

          <button className="btn btn-outline" onClick={handleExportPDF} title="Preview & Cetak Laporan PDF">
            <FileText size={16} style={{ color: 'var(--amber)' }} /> Cetak PDF
          </button>

          {isSuperAdmin && (
            <button className="btn btn-primary" onClick={onOpenTambahBahan}>
              <Plus size={16} /> Tambah Bahan
            </button>
          )}
        </div>
      </div>

      <div className="table-container mt-3" style={{ overflowX: 'auto' }}>
        <table className="custom-table" style={{ width: '100%', whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem' }}>SKU</th>
              <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem' }}>NAMA BAHAN</th>
              <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem' }}>KATEGORI</th>
              <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem' }}>HARGA SATUAN</th>
              {filterTanggal && <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem', color: '#475569', background: '#f8fafc' }}>STOK AWAL</th>}
              {filterTanggal && <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem', color: '#059669', background: '#ecfdf5' }}>PENERIMAAN (+)</th>}
              {filterTanggal && <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem', color: '#e11d48', background: '#fff1f2' }}>PEMAKAIAN (-)</th>}
              <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem' }}>{filterTanggal ? 'STOK AKHIR' : 'STOK SAAT INI'}</th>
              <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem' }}>BATAS MIN</th>
              <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem' }}>STATUS</th>
              {isSuperAdmin && <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem', textAlign: 'right' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filteredBahan.length === 0 ? (
              <tr>
                <td colSpan={filterTanggal ? (isSuperAdmin ? 11 : 10) : (isSuperAdmin ? 8 : 7)} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Tidak ada data bahan baku dapur yang sesuai.
                </td>
              </tr>
            ) : (
              filteredBahan.map((b, idx) => {
                const stokAwalVal = getStokAwalOnDate(b, filterTanggal);
                const stokVal = getBahanStokOnDate(b, filterTanggal);
                const hargaVal = getBahanHargaOnDate(b, filterTanggal);
                const rxVal = getReceiptOnSpecificDate(b, filterTanggal);
                const cxVal = getConsumptionOnSpecificDate(b, filterTanggal);
                const isLow = stokVal <= b.minStok;
                const bSatuan = getBahanSatuan(b);

                return (
                  <tr key={b.id || b._id} style={{ borderBottom: '1px solid #e2e8f0', background: isLow ? '#fef2f2' : undefined }}>
                    <td style={{ padding: '0.45rem 0.6rem', fontWeight: 800, color: '#f59e0b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{b.sku || '-'}</td>
                    <td style={{ padding: '0.45rem 0.6rem', fontWeight: 700, color: '#0f172a', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{b.nama}</td>
                    <td style={{ padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Tag size={10} /> {b.kategori}
                      </span>
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', fontWeight: 800, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      Rp {formatNumber(hargaVal)} <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>/{bSatuan}</span>
                    </td>
                    
                    {filterTanggal && (
                      <td style={{ padding: '0.45rem 0.6rem', fontWeight: 800, color: '#475569', background: '#f8fafc', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {formatNumber(stokAwalVal)} <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{bSatuan}</span>
                      </td>
                    )}

                    {filterTanggal && (
                      <td style={{ padding: '0.45rem 0.6rem', fontWeight: 800, color: rxVal > 0 ? '#059669' : '#94a3b8', background: rxVal > 0 ? '#ecfdf5' : undefined, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {rxVal > 0 ? `+${formatNumber(rxVal)} ${bSatuan}` : '-'}
                      </td>
                    )}

                    {filterTanggal && (
                      <td style={{ padding: '0.45rem 0.6rem', fontWeight: 800, color: cxVal > 0 ? '#e11d48' : '#94a3b8', background: cxVal > 0 ? '#fff1f2' : undefined, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {cxVal > 0 ? `-${formatNumber(cxVal)} ${bSatuan}` : '-'}
                      </td>
                    )}

                    <td style={{ padding: '0.45rem 0.6rem', fontWeight: 800, color: '#2563eb', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {formatNumber(stokVal)} <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{bSatuan}</span>
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatNumber(b.minStok)} {bSatuan}</td>
                    <td style={{ padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                          background: isLow ? '#fee2e2' : '#dcfce7',
                          color: isLow ? '#991b1b' : '#166534',
                          border: isLow ? '1px solid #fca5a5' : '1px solid #86efac'
                        }}
                      >
                        {isLow ? 'Restock!' : 'Stok Safe'}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem' }}>
                          <button className="btn btn-sm btn-icon btn-outline" style={{ width: '26px', height: '26px', padding: 0 }} onClick={() => onOpenEditBahan(b)} title="Edit Material">
                            <Edit3 size={12} />
                          </button>
                          <button className="btn btn-sm btn-icon btn-danger" style={{ width: '26px', height: '26px', padding: 0 }} onClick={() => onDeleteBahan(b.id || b._id)} title="Hapus Material">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isImportExcelOpen && (
        <ModalImportBahanExcel
          isOpen={isImportExcelOpen}
          onClose={() => setIsImportExcelOpen(false)}
          onImport={onImportExcelBahan}
          showAlert={showAlert}
        />
      )}

      {isImportStokAwalOpen && (
        <ModalImportStokAwalExcel
          isOpen={isImportStokAwalOpen}
          onClose={() => setIsImportStokAwalOpen(false)}
          onImportStokAwal={onImportStokAwalExcel}
          bahanBaku={bahanBaku}
          showAlert={showAlert}
        />
      )}
    </div>
  );
}
