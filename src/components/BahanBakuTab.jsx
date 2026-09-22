import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit3, Trash2, FileText, Tag, Upload, Calendar, Info, Filter } from 'lucide-react';
import { formatNumber, STOCK_AWAL_JULI, HARGA_AWAL_JULI, getSkuSortIndex, getThreeMonthCutoffDate, getThreeMonthCutoffLabel, getBahanSatuan, getBahanKategori, getProdukKemasanMap, getDefaultPackagingForProduct } from '../data/initialData';
import { exportToExcel } from '../utils/exportUtils';
import ModalPreviewPdf from './ModalPreviewPdf';
import { ModalImportBahanExcel, ModalImportStokAwalExcel } from './Modals';
import { ModernDatePicker } from './ModernDatePicker';

export default function BahanBakuTab({
  bahanBaku = [],
  kategoriList = [],
  riwayatProduksi = [],
  utangList = [],
  auditLog = [],
  hasilProduksi = [],
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

  const isSuperAdmin = (activeRoleView === 'ADMIN');
  const canAddOrRestock = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  // Dynamic packaging logs synthesized from hasilProduksi
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

  // Combine raw auditLog and synthesized logs for packaging
  const allKemasanLogs = useMemo(() => {
    const rawLogs = (auditLog || []).filter(log => {
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

    return combined;
  }, [auditLog, synthesizedHasilLogs]);

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

    (allKemasanLogs || []).forEach(log => {
      const rawDate = log.timestamp || log.tanggal || log.createdAt || '';
      const dStr = String(rawDate).substring(0, 10);
      if (dStr && dStr <= targetDate && isLogMatchingMaterial(log.detail, b)) {
        dateSet.add(dStr);
      }
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
      const bSku = String(b.sku || b.kode || '').trim().toUpperCase();
      const directMatch = isBahanMatch(p, b) || isLogMatchingMaterial(p.nama || p.detail || p.bahanNama, b);
      let itemQtyOnDate = 0;

      if (Array.isArray(p.items) && p.items.length > 0) {
        p.items.forEach(it => {
          if (isBahanMatch(it, b) || isLogMatchingMaterial(it.nama || it.detail || it.bahanNama, b)) {
            const rawDate = it.tanggal || it.tanggalPenerimaan || p.tanggalPenerimaan || p.tanggalBeli || p.tanggal || p.createdAt || '';
            const rDate = String(rawDate).substring(0, 10);
            if (rDate === targetDateStr) {
              itemQtyOnDate += Number(it.jumlahDiterima || it.diterima || it.qty || it.jumlah || 0);
            }
          }
        });
      }

      if (itemQtyOnDate > 0) {
        total += itemQtyOnDate;
      } else if (directMatch) {
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
      }
    });

    // 2. Audit Log Receipts (Stok Masuk / Restock In)
    (auditLog || []).forEach(log => {
      const aksi = String(log.aksi || '').toLowerCase();
      const detail = String(log.detail || '').toLowerCase();
      const isRollback = aksi.includes('rollback') || aksi.includes('batal') || detail.includes('rollback') || detail.includes('membatalkan');
      if (isRollback) return;
      if (aksi.includes('stok masuk') || aksi.includes('restock') || aksi.includes('penerimaan') || detail.includes('stok masuk') || detail.includes('restock')) {
        const rawDate = log.timestamp || log.tanggal || log.createdAt || '';
        const logDate = String(rawDate).substring(0, 10);
        if (logDate === targetDateStr && (isBahanMatch(log, b) || isLogMatchingMaterial(log.detail || log.nama, b))) {
          const match = String(log.detail || '').match(/(\+|\b)([0-9.]+)\s*(kg|pcs|pack|liter|l|g|pouch|roll|lembar)/i);
          if (match && match[2]) {
            total += parseFloat(match[2]) || 0;
          } else if (log.jumlah || log.qty) {
            total += parseFloat(log.jumlah || log.qty) || 0;
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

    // 3. Packaging Material Consumptions (Vacumbag & Stickers from allKemasanLogs)
    const katLower = (b.kategori || '').toLowerCase();
    const isPackaging = katLower.includes('kemasan') || bName.includes('casing') || bName.includes('plastik') || bName.includes('pouch') || bName.includes('box') || bName.includes('label') || bName.includes('sticker') || bName.includes('stiker') || bName.includes('barcode') || bName.includes('vacum');

    if (isPackaging) {
      allKemasanLogs.forEach(log => {
        const rawDate = log.timestamp || log.tanggal || log.createdAt || '';
        const logDate = String(rawDate).substring(0, 10);
        if (logDate === targetDateStr && isLogMatchingMaterial(log.detail, b)) {
          const match = String(log.detail || '').match(/Pemakaian\s+([0-9.]+)/i);
          if (match && match[1]) {
            total += parseFloat(match[1]) || 0;
          }
        }
      });
    }

    return Math.round(total * 1000) / 1000;
  };

  const computedKategoriList = useMemo(() => {
    const set = new Set();
    bahanBaku.forEach(b => {
      set.add(getBahanKategori(b));
    });
    return Array.from(set).sort();
  }, [bahanBaku]);

  const filteredBahan = bahanBaku
    .filter(b => {
      const bKat = getBahanKategori(b);
      const matchQuery = b.nama.toLowerCase().includes(search.toLowerCase()) || b.sku.toLowerCase().includes(search.toLowerCase());
      const matchKat = !kategoriFilter || bKat === kategoriFilter;
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
      {/* <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
          <Info size={18} style={{ color: '#0284c7', flexShrink: 0 }} />
          <span>
            <strong>RETENSI PERSAAN BAHAN BAKU (MAKSIMAL 3 BULAN TERAKHIR):</strong> Akses persediaan dibatasi dari <strong>{getThreeMonthCutoffLabel()}</strong> s/d <strong>Hari Ini</strong>. Data &gt; 3 bulan dibersihkan otomatis demi efisiensi memori &amp; kecepatan sistem.
          </span>
        </div>
        <span className="badge badge-emerald" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
          🛡️ RETENSI 3 BULAN AKTIF
        </span>
      </div>      {/* ===== 1. TOP TOOLBAR: Modern Single Date Picker (Daily Per Tanggal) di KIRI ===== */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <ModernDatePicker
          value={filterTanggal}
          onChange={(val) => {
            if (val && val < cutoffDateStr) {
              if (showAlert) showAlert(`Akses stok dibatasi maksimal 3 Bulan Terakhir (${getThreeMonthCutoffLabel()}).`, 'warning', 'Batas Retensi 3 Bulan');
              setFilterTanggal(cutoffDateStr);
            } else {
              setFilterTanggal(val);
            }
          }}
          min={cutoffDateStr}
          max={todayStr}
          label="Stock"
        />

        {/* {filterTanggal !== todayStr && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setFilterTanggal(todayStr)}
            style={{ fontSize: '0.74rem', height: '32px', padding: '0 0.65rem' }}
          >
            Hari Ini
          </button>
        )} */}
      </div>

      {/* ===== 2. SECOND TOOLBAR: Search, Category, Combined Import, PDF, Tambah ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Modern Search Box */}
          <div className="search-box" style={{ maxWidth: '240px', height: '32px', padding: '0 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <Search size={14} style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Cari SKU atau Nama Bahan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: '0.76rem' }}
            />
          </div>

          {/* Modern Category Selector with Icon */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Tag size={13} style={{ position: 'absolute', left: '0.65rem', color: '#64748b', pointerEvents: 'none' }} />
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="select-input"
              style={{ height: '32px', paddingLeft: '1.85rem', paddingRight: '0.65rem', fontSize: '0.78rem', fontWeight: 600, borderRadius: '8px', border: '1px solid #cbd5e1', maxWidth: '180px' }}
            >
              <option value="">Semua Kategori</option>
              {computedKategoriList.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canAddOrRestock && (
            <button
              type="button"
              className="btn btn-outline btn-emerald"
              style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setIsImportExcelOpen(true)}
              title="Import Data Excel (Master Bahan & Stok Awal)"
            >
              <Upload size={14} style={{ color: 'var(--emerald)' }} /> Import Excel (Master &amp; Stok)
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline"
            style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.78rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={handleExportPDF}
            title="Preview & Cetak Laporan PDF"
          >
            <FileText size={14} style={{ color: 'var(--amber)' }} /> Cetak PDF
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ height: '32px', padding: '0 0.85rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={onOpenTambahBahan}
            >
              <Plus size={14} /> Tambah Bahan
            </button>
          )}
        </div>
      </div>

      <div className="table-container" style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        <table className="custom-table" style={{ width: '100%', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '0.45rem 0.5rem', fontSize: '0.72rem', letterSpacing: '0.03em', color: '#0f172a', fontWeight: 800 }}>SKU</th>
              <th style={{ padding: '0.45rem 0.5rem', fontSize: '0.72rem', letterSpacing: '0.03em', color: '#0f172a', fontWeight: 800 }}>NAMA BAHAN</th>
              <th style={{ padding: '0.45rem 0.5rem', fontSize: '0.72rem', letterSpacing: '0.03em', color: '#0f172a', fontWeight: 800 }}>KATEGORI</th>
              <th style={{ padding: '0.45rem 0.5rem', fontSize: '0.72rem', letterSpacing: '0.03em', color: '#0f172a', fontWeight: 800 }}>HARGA SATUAN</th>
              {filterTanggal && <th style={{ padding: '0.45rem 0.5rem', fontSize: '0.72rem', letterSpacing: '0.03em', color: '#0f172a', fontWeight: 800 }}>STOK AWAL</th>}
              {filterTanggal && <th style={{ padding: '0.45rem 0.5rem', fontSize: '0.72rem', letterSpacing: '0.03em', color: '#0f172a', fontWeight: 800 }}>PENERIMAAN (+)</th>}
              {filterTanggal && <th style={{ padding: '0.45rem 0.5rem', fontSize: '0.72rem', letterSpacing: '0.03em', color: '#0f172a', fontWeight: 800 }}>PEMAKAIAN (-)</th>}
              <th style={{ padding: '0.45rem 0.5rem', fontSize: '0.72rem', letterSpacing: '0.03em', color: '#0f172a', fontWeight: 800 }}>{filterTanggal ? 'STOK AKHIR' : 'STOK SAAT INI'}</th>
              <th style={{ padding: '0.45rem 0.5rem', fontSize: '0.72rem', letterSpacing: '0.03em', color: '#0f172a', fontWeight: 800 }}>STATUS</th>
              {isSuperAdmin && (
                <th style={{ padding: '0.45rem 0.65rem', fontSize: '0.72rem', letterSpacing: '0.03em', color: '#0f172a', fontWeight: 800, textAlign: 'right', position: 'sticky', right: 0, background: '#f8fafc', zIndex: 3, boxShadow: '-2px 0 5px rgba(0,0,0,0.04)' }}>
                  AKSI
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredBahan.length === 0 ? (
              <tr>
                <td colSpan={filterTanggal ? (isSuperAdmin ? 10 : 9) : (isSuperAdmin ? 7 : 6)} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
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
                  <tr key={b.id || b._id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.74rem' }}>
                    <td style={{ padding: '0.35rem 0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>{b.sku || '-'}</td>
                    <td style={{ padding: '0.35rem 0.5rem', fontWeight: 700, color: '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>{b.nama}</td>
                    <td style={{ padding: '0.35rem 0.5rem', whiteSpace: 'nowrap' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0f172a', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                        <Tag size={9} style={{ color: '#475569' }} /> {getBahanKategori(b)}
                      </span>
                    </td>
                    <td style={{ padding: '0.35rem 0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                      Rp {formatNumber(hargaVal)} <span style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 500 }}>/{bSatuan}</span>
                    </td>
                    
                    {filterTanggal && (
                      <td style={{ padding: '0.35rem 0.5rem', fontWeight: 700, color: '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                        {formatNumber(stokAwalVal)} <span style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>{bSatuan}</span>
                      </td>
                    )}

                    {filterTanggal && (
                      <td style={{ padding: '0.35rem 0.5rem', fontWeight: 700, color: rxVal > 0 ? '#059669' : '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                        {rxVal > 0 ? `+${formatNumber(rxVal)} ${bSatuan}` : '-'}
                      </td>
                    )}

                    {filterTanggal && (
                      <td style={{ padding: '0.35rem 0.5rem', fontWeight: 700, color: cxVal > 0 ? '#e11d48' : '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                        {cxVal > 0 ? `-${formatNumber(cxVal)} ${bSatuan}` : '-'}
                      </td>
                    )}

                    <td style={{ padding: '0.35rem 0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                      {formatNumber(stokVal)} <span style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>{bSatuan}</span>
                    </td>
                    <td style={{ padding: '0.35rem 0.5rem', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
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
                      <td style={{ padding: '0.3rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: isLow ? '#fef2f2' : '#ffffff', zIndex: 2, boxShadow: '-2px 0 5px rgba(0,0,0,0.04)' }}>
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
          onImportStokAwal={onImportStokAwalExcel}
          bahanBaku={bahanBaku}
          showAlert={showAlert}
        />
      )}
    </div>
  );
}
