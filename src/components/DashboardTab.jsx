import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Boxes, PackageCheck, AlertCircle, ChefHat, Activity, Sparkles, PlusCircle, Factory, ArrowDownLeft, Calendar, Search, X, FileSpreadsheet, FileText, Eye, ArrowRight, Wallet, TrendingUp, TrendingDown, Layers, DollarSign, ArrowUpRight, Package } from 'lucide-react';
import { formatNumber, STOCK_AWAL_JULI, HARGA_AWAL_JULI } from '../data/initialData';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function DashboardTab({
  bahanBaku = [],
  produk = [],
  riwayatProduksi = [],
  hasilProduksi = [],
  savedHppList = [],
  utangList = [],
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
  const [activeChartModal, setActiveChartModal] = useState(null); // 'stokAwal', 'penerimaan', 'pemakaian', 'stokAkhir', 'hasilProduksi'
  const isModalRincianOpen = activeChartModal === 'pemakaian';
  const setIsModalRincianOpen = (open) => setActiveChartModal(open ? 'pemakaian' : null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [filterTanggal, setFilterTanggal] = useState('');
  const [searchRekap, setSearchRekap] = useState('');

  const lowStockList = bahanBaku.filter(b => b.stok <= b.minStok);

  // Calculate Today's Production sum accurately from riwayatProduksi for today's date
  const todayBatches = (riwayatProduksi || []).filter(r => r.timestamp && r.timestamp.startsWith(todayStr));
  const todayProduksiCount = todayBatches.reduce((acc, r) => acc + (Number(r.jumlahPcs) || 0), 0);

  // Helper for matching materials & calculating exact unit price on target date (HPP Kalkulator Logic)
  const isBahanMatch = useCallback((item, b) => {
    if (!item || !b) return false;
    const bNm = String(b.nama || b.bahanNama || '').trim().toLowerCase();
    const bId = String(b.id || b._id || b.bahanId || '').trim().toLowerCase();
    const bSku = String(b.sku || b.kode || '').trim().toLowerCase();

    const itemNm = String(item.bahanNama || item.nama || item.namaBahan || '').trim().toLowerCase();
    const itemId = String(item.bahanId || item.id || '').trim().toLowerCase();
    const itemSku = String(item.sku || item.kode || '').trim().toLowerCase();

    if (bSku && itemSku && bSku === itemSku) return true;
    if (bId && itemId && bId === itemId) return true;
    if (bNm && itemNm && bNm === itemNm) return true;
    return false;
  }, []);

  const getBahanHargaOnDate = useCallback((bObj, targetDateStr) => {
    if (!bObj) return 0;
    const master = (bahanBaku || []).find(m => isBahanMatch(m, bObj)) || bObj;
    const bSku = String(master.sku || master.kode || bObj.sku || bObj.kode || '').trim().toUpperCase();

    let initialPrice = 0;
    if (master.hargaAwal !== undefined && master.hargaAwal !== null && Number(master.hargaAwal) > 0) {
      initialPrice = Number(master.hargaAwal);
    } else if (HARGA_AWAL_JULI[bSku] !== undefined && Number(HARGA_AWAL_JULI[bSku]) > 0) {
      initialPrice = Number(HARGA_AWAL_JULI[bSku]);
    } else {
      initialPrice = Number(master.hargaBeli || master.harga || bObj.hargaSatuan || bObj.harga || 0);
    }

    const validReceipts = [];
    (utangList || []).forEach(inv => {
      if (!isBahanMatch(inv, master)) return;
      const price = Number(inv.hargaSatuan || inv.harga || 0);
      if (price <= 0) return;

      if (Array.isArray(inv.riwayatPenerimaan) && inv.riwayatPenerimaan.length > 0) {
        inv.riwayatPenerimaan.forEach(r => {
          const rawDate = r.tanggal || inv.tanggalPenerimaan || inv.tanggalBeli || r.createdAt || inv.createdAt || '';
          const rDate = String(rawDate).substring(0, 10);
          if (rDate && (!targetDateStr || rDate <= targetDateStr)) {
            validReceipts.push({ tanggal: rDate, harga: price });
          }
        });
      } else if (Number(inv.jumlahDiterima || inv.jumlah || 0) > 0) {
        const rawDate = inv.tanggalPenerimaan || inv.tanggalBeli || inv.tanggal || inv.createdAt || '';
        const pDate = String(rawDate).substring(0, 10);
        if (pDate && (!targetDateStr || pDate <= targetDateStr)) {
          validReceipts.push({ tanggal: pDate, harga: price });
        }
      }
    });

    if (validReceipts.length > 0) {
      validReceipts.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      return validReceipts[0].harga;
    }
    return initialPrice;
  }, [bahanBaku, utangList, isBahanMatch]);

  const getProductBaseKey = (name, dateStr) => {
    const s = String(name || '').trim().toLowerCase();
    let base = s;
    if (s.includes('scm') || s.includes('cocktail merah')) base = 'scm';
    else if (s.includes('rcs') || s.includes('red cocktail')) base = 'rcs';
    else if (s.includes('bs') || s.includes('sosis bakso')) base = 'bs';
    else if (s.includes('blp') || s.includes('lembu')) base = 'blp';
    return `${dateStr}_${base}`;
  };

  // ===== FINANCIAL SUMMARY CALCULATIONS (IN RUPIAH BASED ON HPP FORMULAS) =====
  const financialSummary = useMemo(() => {
    let totalStokAwalRp = 0;

    // Helper map for HPP price per material SKU / name
    const hppPriceMap = {};

    (bahanBaku || []).forEach(b => {
      const bSku = String(b.sku || b.kode || '').trim().toUpperCase();

      // 1. Stok Awal & Harga Awal
      let stokAwalVal = 0;
      const localStokAwal = localStorage.getItem('STOK_AWAL_' + bSku);
      if (b.stokAwal !== undefined && b.stokAwal !== null && Number(b.stokAwal) >= 0) {
        stokAwalVal = Number(b.stokAwal);
      } else if (localStokAwal !== null && Number(localStokAwal) >= 0) {
        stokAwalVal = Number(localStokAwal);
      } else if (STOCK_AWAL_JULI[bSku] !== undefined) {
        stokAwalVal = Number(STOCK_AWAL_JULI[bSku]);
      } else {
        stokAwalVal = Number(b.stok || 0);
      }

      let hargaAwalVal = 0;
      const localHargaAwal = localStorage.getItem('HARGA_AWAL_' + bSku);
      if (b.hargaAwal !== undefined && b.hargaAwal !== null && Number(b.hargaAwal) > 0) {
        hargaAwalVal = Number(b.hargaAwal);
      } else if (localHargaAwal !== null && Number(localHargaAwal) > 0) {
        hargaAwalVal = Number(localHargaAwal);
      } else if (HARGA_AWAL_JULI[bSku] !== undefined && Number(HARGA_AWAL_JULI[bSku]) > 0) {
        hargaAwalVal = Number(HARGA_AWAL_JULI[bSku]);
      } else {
        hargaAwalVal = Number(b.harga || 0);
      }

      hppPriceMap[bSku] = hargaAwalVal;
      if (b.id) hppPriceMap[String(b.id)] = hargaAwalVal;
      if (b.nama) hppPriceMap[String(b.nama).toLowerCase()] = hargaAwalVal;

      totalStokAwalRp += (stokAwalVal * hargaAwalVal);
    });

    // 2. Total Penerimaan (Rp)
    let totalPenerimaanRp = 0;
    (utangList || []).forEach(inv => {
      if (Array.isArray(inv.riwayatPenerimaan) && inv.riwayatPenerimaan.length > 0) {
        inv.riwayatPenerimaan.forEach(r => {
          const rDate = (r.tanggal || inv.tanggalPenerimaan || inv.tanggalBeli || r.createdAt || '').substring(0, 7);
          if (!selectedMonth || rDate === selectedMonth) {
            totalPenerimaanRp += Number(r.subtotal || (Number(r.jumlah || 0) * Number(inv.hargaSatuan || 0)));
          }
        });
      } else if (Number(inv.jumlahDiterima || 0) > 0) {
        const pDate = (inv.tanggalPenerimaan || inv.tanggalBeli || inv.createdAt || '').substring(0, 7);
        if (!selectedMonth || pDate === selectedMonth) {
          totalPenerimaanRp += Number(inv.subtotal || (Number(inv.jumlahDiterima || 0) * Number(inv.hargaSatuan || 0)));
        }
      }
    });

    // 3. Total Pemakaian Bahan Baku & Kemasan (Rp) - EXACT SUM OF (BIAYA BAHAN BAKU + KEMASAN) IN SELECTED MONTH
    let totalPemakaianRp = 0;
    const processedBatchIds = new Set();
    const processedBatchKeys = new Set();

    // A. Saved HPP Formula Records (stored in savedHppList or localStorage 'SAREN_SAVED_HPP_LIST')
    let hppListLocal = [];
    try {
      const rawHpp = localStorage.getItem('SAREN_SAVED_HPP_LIST');
      if (rawHpp) hppListLocal = JSON.parse(rawHpp);
    } catch (e) {}

    const combinedHppList = Array.isArray(savedHppList) && savedHppList.length > 0 ? savedHppList : hppListLocal;
    (combinedHppList || []).forEach(rec => {
      const recMonth = (rec.tanggal || rec.createdAt || '').substring(0, 7);
      const fullDate = (rec.tanggal || rec.createdAt || '').substring(0, 10);
      if (!selectedMonth || recMonth === selectedMonth) {
        if (rec.id) processedBatchIds.add(rec.id);
        const batchKey = getProductBaseKey(rec.produkNama, fullDate);
        processedBatchKeys.add(batchKey);

        let baseCost = 0;
        if (Number(rec.totalBiayaBahan) > 0) {
          baseCost = Number(rec.totalBiayaBahan);
        } else if (Array.isArray(rec.bahanDetails)) {
          rec.bahanDetails.forEach(b => {
            const qty = Number(b.jumlah || 0);
            const unitPrice = Number(b.hargaSatuan || 0);
            baseCost += (qty * unitPrice);
          });
        }

        // Add Total Packaging Cost (biayaKemasan per pcs * hasilKg yield)
        const packUnitCost = Number(rec.biayaKemasan || 0);
        const yieldKg = Number(rec.hasilKg || 0);
        const packTotalCost = packUnitCost * yieldKg;

        totalPemakaianRp += (baseCost + packTotalCost);
      }
    });

    // B. Production Batch Executions (riwayatProduksi)
    (riwayatProduksi || []).forEach(r => {
      const rDate = (r.timestamp || r.tanggal || r.createdAt || '').substring(0, 7);
      const fullDateStr = (r.timestamp || r.tanggal || r.createdAt || '').substring(0, 10);
      if (!selectedMonth || rDate === selectedMonth) {
        const prodName = r.produkNama || r.alias || r.kode || 'Produksi Batch';
        const batchKey = getProductBaseKey(prodName, fullDateStr);
        if ((r.id && processedBatchIds.has(r.id)) || processedBatchKeys.has(batchKey)) return; // Avoid double counting if already in savedHppList
        if (r.id) processedBatchIds.add(r.id);
        processedBatchKeys.add(batchKey);

        let batchCost = 0;
        const materials = (r.pemotonganBahan && Array.isArray(r.pemotonganBahan) && r.pemotonganBahan.length > 0)
          ? r.pemotonganBahan
          : (r.bahanDigunakan && Array.isArray(r.bahanDigunakan) ? r.bahanDigunakan : []);

        if (materials.length > 0) {
          materials.forEach(b => {
            const qty = Number(b.jumlah || b.qty || 0);
            let unitPrice = Number(b.hargaSatuan || b.harga || 0);
            if (unitPrice <= 0) unitPrice = getBahanHargaOnDate(b, fullDateStr);
            batchCost += (qty * unitPrice);
          });
        } else if (Number(r.totalBiayaBahan) > 0) {
          batchCost = Number(r.totalBiayaBahan);
        }

        // Add Total Packaging Cost if recorded
        const packUnitCost = Number(r.biayaKemasan || 0);
        const yieldKg = Number(r.hasilKg || r.totalHasilKg || 0);
        const packTotalCost = packUnitCost * yieldKg;

        totalPemakaianRp += (batchCost + packTotalCost);
      }
    });

    // 4. Total Hasil Produksi (Rp) - DYNAMICALLY SYNCED WITH SAVED HPP PER PACK
    let totalHasilProduksiRp = 0;
    const yieldSource = (hasilProduksi && hasilProduksi.length > 0) ? hasilProduksi : riwayatProduksi;
    (yieldSource || []).forEach(y => {
      const yDateStr = (y.timestamp || y.tanggal || '').substring(0, 7);
      if (!selectedMonth || yDateStr === selectedMonth) {
        const qty = Number(y.jumlahPcs || y.pcs || 0);

        // Dynamic HPP Unit lookup from savedHppList
        const fullDate = (y.tanggal || y.timestamp || '').substring(0, 10);
        const itemAlias = String(y.alias || y.kode || '').trim().toUpperCase();
        const itemName = String(y.produkNama || '').trim().toLowerCase();

        const matchedLog = (savedHppList || []).find(log => {
          const logDate = String(log.tanggal || '').substring(0, 10);
          const dateMatch = !fullDate || !logDate || logDate === fullDate;
          if (!dateMatch) return false;

          const logProd = String(log.produkNama || '').trim().toLowerCase();
          return logProd && (
            itemName.includes(logProd) ||
            logProd.includes(itemName) ||
            itemAlias.toLowerCase().includes(logProd) ||
            logProd.includes(itemAlias.toLowerCase()) ||
            (itemAlias.startsWith('RCS') && logProd.includes('rcs')) ||
            (itemAlias.startsWith('SCM') && logProd.includes('scm')) ||
            (itemAlias.startsWith('BS') && logProd.includes('bs')) ||
            (itemAlias.startsWith('BLP') && logProd.includes('blp'))
          );
        }) || (savedHppList || []).find(log => {
          const logProd = String(log.produkNama || '').trim().toLowerCase();
          return logProd && (
            itemName.includes(logProd) ||
            logProd.includes(itemName) ||
            itemAlias.toLowerCase().includes(logProd) ||
            logProd.includes(itemAlias.toLowerCase()) ||
            (itemAlias.startsWith('RCS') && logProd.includes('rcs')) ||
            (itemAlias.startsWith('SCM') && logProd.includes('scm')) ||
            (itemAlias.startsWith('BS') && logProd.includes('bs')) ||
            (itemAlias.startsWith('BLP') && logProd.includes('blp'))
          );
        });

        let unitPrice = 0;
        if (matchedLog) {
          if (itemAlias.includes('250') || itemName.includes('250')) {
            if (matchedLog.hpp250g && Number(matchedLog.hpp250g) > 0) unitPrice = Number(matchedLog.hpp250g);
          } else if (itemAlias.includes('300') || itemName.includes('300')) {
            if (matchedLog.hpp250g && Number(matchedLog.hpp250g) > 0) unitPrice = Math.round(Number(matchedLog.hpp250g) * 1.2);
          } else if (itemAlias.includes('500') || itemName.includes('500')) {
            if (matchedLog.hpp500g && Number(matchedLog.hpp500g) > 0) unitPrice = Number(matchedLog.hpp500g);
          } else if (itemAlias.includes('900') || itemName.includes('900')) {
            if (matchedLog.hpp900g && Number(matchedLog.hpp900g) > 0) unitPrice = Number(matchedLog.hpp900g);
          } else if (itemAlias.includes('1000') || itemAlias.includes('1KG') || itemName.includes('1000') || itemName.includes('1kg')) {
            const val1kg = matchedLog.hpp1000g || matchedLog.hpp1kg || matchedLog.hpp1Kg;
            if (val1kg && Number(val1kg) > 0) unitPrice = Number(val1kg);
          }
        }

        if (unitPrice <= 0) {
          unitPrice = Number(y.hppPerPack || y.harga || 0);
        }

        totalHasilProduksiRp += (qty * unitPrice);
      }
    });

    // 5. Total Stok Akhir Bahan Baku (Rp) = Stok Awal (Rp) + Penerimaan (Rp) - Pemakaian (Rp)
    const totalStokAkhirRp = Math.max(0, totalStokAwalRp + totalPenerimaanRp - totalPemakaianRp);

    return {
      totalStokAwalRp: Math.round(totalStokAwalRp),
      totalPenerimaanRp: Math.round(totalPenerimaanRp),
      totalPemakaianRp: Math.round(totalPemakaianRp),
      totalHasilProduksiRp: Math.round(totalHasilProduksiRp),
      totalStokAkhirRp: Math.round(totalStokAkhirRp)
    };
  }, [bahanBaku, utangList, riwayatProduksi, hasilProduksi, savedHppList, auditLog, selectedMonth]);

  // Detailed daily breakdown for Pemakaian (-)
  const rincianPemakaianPerTanggal = useMemo(() => {
    const list = [];
    const processedIds = new Set();
    const processedKeys = new Set();

    let hppListLocal = [];
    try {
      const rawHpp = localStorage.getItem('SAREN_SAVED_HPP_LIST');
      if (rawHpp) hppListLocal = JSON.parse(rawHpp);
    } catch (e) {}

    const combinedHppList = Array.isArray(savedHppList) && savedHppList.length > 0 ? savedHppList : hppListLocal;

    (combinedHppList || []).forEach(rec => {
      const recMonth = (rec.tanggal || rec.createdAt || '').substring(0, 7);
      if (!selectedMonth || recMonth === selectedMonth) {
        if (rec.id) processedIds.add(rec.id);
        const tgl = (rec.tanggal || rec.createdAt || '').substring(0, 10);
        const produk = rec.produkNama || 'Bahan Olahan';
        const batchKey = getProductBaseKey(produk, tgl);
        processedKeys.add(batchKey);

        let baseCost = 0;
        if (Number(rec.totalBiayaBahan) > 0) {
          baseCost = Number(rec.totalBiayaBahan);
        } else if (Array.isArray(rec.bahanDetails)) {
          rec.bahanDetails.forEach(b => {
            baseCost += (Number(b.jumlah || 0) * Number(b.hargaSatuan || 0));
          });
        }
        const packUnit = Number(rec.biayaKemasan || 0);
        const yieldKg = Number(rec.hasilKg || 0);
        const packTotal = packUnit * yieldKg;
        const totalPlusPack = baseCost + packTotal;

        list.push({
          id: rec.id || `hpp_${tgl}_${produk}`,
          tanggal: tgl,
          produkNama: produk,
          biayaBahanBaku: baseCost,
          yieldKg: yieldKg,
          biayaKemasanPerPcs: packUnit,
          totalKemasan: packTotal,
          totalBiayaPlusKemasan: totalPlusPack,
          sumber: 'HPP Kalkulator Tersimpan'
        });
      }
    });

    (riwayatProduksi || []).forEach(r => {
      const rMonth = (r.timestamp || r.tanggal || r.createdAt || '').substring(0, 7);
      const fullDateStr = (r.timestamp || r.tanggal || r.createdAt || '').substring(0, 10);
      if (!selectedMonth || rMonth === selectedMonth) {
        const prodName = r.produkNama || r.alias || r.kode || 'Produksi Batch';
        const batchKey = getProductBaseKey(prodName, fullDateStr);
        if ((r.id && processedIds.has(r.id)) || processedKeys.has(batchKey)) return;
        if (r.id) processedIds.add(r.id);
        processedKeys.add(batchKey);

        let batchCost = 0;
        const materials = (r.pemotonganBahan && Array.isArray(r.pemotonganBahan) && r.pemotonganBahan.length > 0)
          ? r.pemotonganBahan
          : (r.bahanDigunakan && Array.isArray(r.bahanDigunakan) ? r.bahanDigunakan : []);

        if (materials.length > 0) {
          materials.forEach(b => {
            const qty = Number(b.jumlah || b.qty || 0);
            let unitPrice = Number(b.hargaSatuan || b.harga || 0);
            if (unitPrice <= 0) unitPrice = getBahanHargaOnDate(b, fullDateStr);
            batchCost += (qty * unitPrice);
          });
        } else if (Number(r.totalBiayaBahan) > 0) {
          batchCost = Number(r.totalBiayaBahan);
        }

        const packUnit = Number(r.biayaKemasan || 0);
        const yieldKg = Number(r.hasilKg || r.totalHasilKg || 0);
        const packTotal = packUnit * yieldKg;
        const totalPlusPack = batchCost + packTotal;

        list.push({
          id: r.id || `rw_${fullDateStr}_${prodName}`,
          tanggal: fullDateStr,
          produkNama: prodName,
          biayaBahanBaku: batchCost,
          yieldKg: yieldKg,
          biayaKemasanPerPcs: packUnit,
          totalKemasan: packTotal,
          totalBiayaPlusKemasan: totalPlusPack,
          sumber: 'Riwayat Produksi'
        });
      }
    });

    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [savedHppList, riwayatProduksi, selectedMonth, getBahanHargaOnDate]);

  // Detailed Breakdown for 1. Stok Awal
  const rincianStokAwal = useMemo(() => {
    return (bahanBaku || []).map(b => {
      const bSku = String(b.sku || b.kode || '').trim().toUpperCase();

      let stokAwalVal = 0;
      const localStokAwal = localStorage.getItem('STOK_AWAL_' + bSku);
      if (b.stokAwal !== undefined && b.stokAwal !== null && Number(b.stokAwal) >= 0) {
        stokAwalVal = Number(b.stokAwal);
      } else if (localStokAwal !== null && Number(localStokAwal) >= 0) {
        stokAwalVal = Number(localStokAwal);
      } else if (STOCK_AWAL_JULI[bSku] !== undefined) {
        stokAwalVal = Number(STOCK_AWAL_JULI[bSku]);
      } else {
        stokAwalVal = Number(b.stok || 0);
      }

      let hargaAwalVal = 0;
      const localHargaAwal = localStorage.getItem('HARGA_AWAL_' + bSku);
      if (b.hargaAwal !== undefined && b.hargaAwal !== null && Number(b.hargaAwal) > 0) {
        hargaAwalVal = Number(b.hargaAwal);
      } else if (localHargaAwal !== null && Number(localHargaAwal) > 0) {
        hargaAwalVal = Number(localHargaAwal);
      } else if (HARGA_AWAL_JULI[bSku] !== undefined && Number(HARGA_AWAL_JULI[bSku]) > 0) {
        hargaAwalVal = Number(HARGA_AWAL_JULI[bSku]);
      } else {
        hargaAwalVal = Number(b.harga || 0);
      }

      const totalNilai = stokAwalVal * hargaAwalVal;

      return {
        id: b.id || b._id || bSku,
        sku: bSku || '-',
        nama: b.nama || b.bahanNama || 'Bahan Baku',
        stokAwal: stokAwalVal,
        satuan: b.satuan || 'kg',
        hargaAwal: hargaAwalVal,
        totalNilai
      };
    }).sort((a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true, sensitivity: 'base' }));
  }, [bahanBaku]);

  // Detailed Breakdown for 2. Penerimaan (+)
  const rincianPenerimaan = useMemo(() => {
    const list = [];
    (utangList || []).forEach(inv => {
      const supplierName = inv.namaSupplier || inv.supplier || inv.noFaktur || 'Pembelian';
      const bNama = inv.bahanNama || inv.nama || 'Bahan Baku';
      const hargaSat = Number(inv.hargaSatuan || inv.harga || 0);

      if (Array.isArray(inv.riwayatPenerimaan) && inv.riwayatPenerimaan.length > 0) {
        inv.riwayatPenerimaan.forEach((r, idx) => {
          const rawDate = r.tanggal || inv.tanggalPenerimaan || inv.tanggalBeli || r.createdAt || inv.createdAt || '';
          const rMonth = String(rawDate).substring(0, 7);
          if (!selectedMonth || rMonth === selectedMonth) {
            const qty = Number(r.jumlah || 0);
            const subtotal = Number(r.subtotal || (qty * hargaSat));
            list.push({
              id: `${inv.id || inv._id}_rec_${idx}`,
              tanggal: String(rawDate).substring(0, 10),
              supplier: supplierName,
              namaBahan: bNama,
              jumlahDiterima: qty,
              satuan: inv.satuan || 'kg',
              hargaSatuan: hargaSat,
              subtotal
            });
          }
        });
      } else if (Number(inv.jumlahDiterima || 0) > 0) {
        const rawDate = inv.tanggalPenerimaan || inv.tanggalBeli || inv.tanggal || inv.createdAt || '';
        const pMonth = String(rawDate).substring(0, 7);
        if (!selectedMonth || pMonth === selectedMonth) {
          const qty = Number(inv.jumlahDiterima || 0);
          const subtotal = Number(inv.subtotal || (qty * hargaSat));
          list.push({
            id: inv.id || inv._id || `rec_${Math.random()}`,
            tanggal: String(rawDate).substring(0, 10),
            supplier: supplierName,
            namaBahan: bNama,
            jumlahDiterima: qty,
            satuan: inv.satuan || 'kg',
            hargaSatuan: hargaSat,
            subtotal
          });
        }
      }
    });
    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [utangList, selectedMonth]);

  // Detailed Breakdown for 4. Stok Akhir
  const rincianStokAkhir = useMemo(() => {
    return (bahanBaku || []).map(b => {
      const bSku = String(b.sku || b.kode || '').trim().toUpperCase();

      let stokAwalVal = 0;
      const localStokAwal = localStorage.getItem('STOK_AWAL_' + bSku);
      if (b.stokAwal !== undefined && b.stokAwal !== null && Number(b.stokAwal) >= 0) {
        stokAwalVal = Number(b.stokAwal);
      } else if (localStokAwal !== null && Number(localStokAwal) >= 0) {
        stokAwalVal = Number(localStokAwal);
      } else if (STOCK_AWAL_JULI[bSku] !== undefined) {
        stokAwalVal = Number(STOCK_AWAL_JULI[bSku]);
      } else {
        stokAwalVal = Number(b.stok || 0);
      }

      let hargaAwalVal = 0;
      const localHargaAwal = localStorage.getItem('HARGA_AWAL_' + bSku);
      if (b.hargaAwal !== undefined && b.hargaAwal !== null && Number(b.hargaAwal) > 0) {
        hargaAwalVal = Number(b.hargaAwal);
      } else if (localHargaAwal !== null && Number(localHargaAwal) > 0) {
        hargaAwalVal = Number(localHargaAwal);
      } else if (HARGA_AWAL_JULI[bSku] !== undefined && Number(HARGA_AWAL_JULI[bSku]) > 0) {
        hargaAwalVal = Number(HARGA_AWAL_JULI[bSku]);
      } else {
        hargaAwalVal = Number(b.harga || 0);
      }

      let totalMasuk = 0;
      (utangList || []).forEach(inv => {
        if (isBahanMatch(inv, b)) {
          if (Array.isArray(inv.riwayatPenerimaan) && inv.riwayatPenerimaan.length > 0) {
            inv.riwayatPenerimaan.forEach(r => {
              const rMonth = String(r.tanggal || inv.tanggalPenerimaan || '').substring(0, 7);
              if (!selectedMonth || rMonth === selectedMonth) {
                totalMasuk += Number(r.jumlah || 0);
              }
            });
          } else if (Number(inv.jumlahDiterima || 0) > 0) {
            const pMonth = String(inv.tanggalPenerimaan || inv.tanggalBeli || '').substring(0, 7);
            if (!selectedMonth || pMonth === selectedMonth) {
              totalMasuk += Number(inv.jumlahDiterima || 0);
            }
          }
        }
      });

      let totalKeluar = 0;
      (riwayatProduksi || []).forEach(r => {
        const rMonth = String(r.timestamp || r.tanggal || '').substring(0, 7);
        if (!selectedMonth || rMonth === selectedMonth) {
          const materials = (r.pemotonganBahan && Array.isArray(r.pemotonganBahan) && r.pemotonganBahan.length > 0)
            ? r.pemotonganBahan
            : (r.bahanDigunakan && Array.isArray(r.bahanDigunakan) ? r.bahanDigunakan : []);

          materials.forEach(mat => {
            if (isBahanMatch(mat, b)) {
              totalKeluar += Number(mat.jumlah || mat.qty || 0);
            }
          });
        }
      });

      const currentQty = Math.max(0, stokAwalVal + totalMasuk - totalKeluar);
      const unitPrice = getBahanHargaOnDate(b, todayStr) || hargaAwalVal;
      const totalNilai = currentQty * unitPrice;

      return {
        id: b.id || b._id || bSku,
        sku: bSku || '-',
        nama: b.nama || b.bahanNama || 'Bahan Baku',
        stokAwal: stokAwalVal,
        penerimaan: totalMasuk,
        pemakaian: totalKeluar,
        stokAkhir: currentQty,
        satuan: b.satuan || 'kg',
        hargaSatuan: unitPrice,
        totalNilai
      };
    }).sort((a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true, sensitivity: 'base' }));
  }, [bahanBaku, utangList, riwayatProduksi, selectedMonth, isBahanMatch, getBahanHargaOnDate, todayStr]);

  // Detailed Breakdown for 5. Hasil Produksi
  const rincianHasilProduksi = useMemo(() => {
    const yieldSource = (hasilProduksi && hasilProduksi.length > 0) ? hasilProduksi : riwayatProduksi;
    const list = [];

    (yieldSource || []).forEach((y, idx) => {
      const yDateStr = (y.timestamp || y.tanggal || '').substring(0, 7);
      if (!selectedMonth || yDateStr === selectedMonth) {
        const qtyPcs = Number(y.jumlahPcs || y.pcs || 0);
        const fullDate = (y.tanggal || y.timestamp || '').substring(0, 10);
        const itemAlias = String(y.alias || y.kode || '').trim().toUpperCase();
        const itemName = String(y.produkNama || 'Hasil Produksi').trim();

        const matchedLog = (savedHppList || []).find(log => {
          const logDate = String(log.tanggal || '').substring(0, 10);
          const dateMatch = !fullDate || !logDate || logDate === fullDate;
          if (!dateMatch) return false;

          const logProd = String(log.produkNama || '').trim().toLowerCase();
          const targetNm = itemName.toLowerCase();
          return logProd && (targetNm.includes(logProd) || logProd.includes(targetNm));
        }) || (savedHppList || []).find(log => {
          const logProd = String(log.produkNama || '').trim().toLowerCase();
          const targetNm = itemName.toLowerCase();
          return logProd && (targetNm.includes(logProd) || logProd.includes(targetNm));
        });

        let unitPrice = 0;
        if (matchedLog) {
          if (itemAlias.includes('250') || itemName.includes('250')) {
            if (matchedLog.hpp250g && Number(matchedLog.hpp250g) > 0) unitPrice = Number(matchedLog.hpp250g);
          } else if (itemAlias.includes('300') || itemName.includes('300')) {
            if (matchedLog.hpp250g && Number(matchedLog.hpp250g) > 0) unitPrice = Math.round(Number(matchedLog.hpp250g) * 1.2);
          } else if (itemAlias.includes('500') || itemName.includes('500')) {
            if (matchedLog.hpp500g && Number(matchedLog.hpp500g) > 0) unitPrice = Number(matchedLog.hpp500g);
          } else if (itemAlias.includes('900') || itemName.includes('900')) {
            if (matchedLog.hpp900g && Number(matchedLog.hpp900g) > 0) unitPrice = Number(matchedLog.hpp900g);
          } else if (itemAlias.includes('1000') || itemAlias.includes('1KG') || itemName.includes('1000') || itemName.includes('1kg')) {
            const val1kg = matchedLog.hpp1000g || matchedLog.hpp1kg || matchedLog.hpp1Kg;
            if (val1kg && Number(val1kg) > 0) unitPrice = Number(val1kg);
          }
        }

        if (unitPrice <= 0) {
          unitPrice = Number(y.hppPerPack || y.harga || 0);
        }

        const totalNilai = qtyPcs * unitPrice;

        list.push({
          id: y.id || y._id || `yield_${idx}`,
          tanggal: fullDate,
          alias: itemAlias || 'PROD',
          produkNama: itemName,
          jumlahPcs: qtyPcs,
          hppPerPack: unitPrice,
          totalNilai
        });
      }
    });

    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [hasilProduksi, riwayatProduksi, savedHppList, selectedMonth]);

  const financialChartData = useMemo(() => [
    {
      type: 'stokAwal',
      title: 'Stok Awal',
      shortLabel: 'Stok Awal',
      subtitle: 'Harga Awal Bulan',
      val: financialSummary.totalStokAwalRp,
      color: '#0284c7',
      borderColor: '#bae6fd',
      lightBg: '#f0f9ff',
      gradient: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
      glow: '0 4px 12px rgba(2, 132, 199, 0.3)'
    },
    {
      type: 'penerimaan',
      title: 'Penerimaan (+)',
      shortLabel: 'Penerimaan',
      subtitle: 'Bahan Masuk',
      val: financialSummary.totalPenerimaanRp,
      color: '#059669',
      borderColor: '#a7f3d0',
      lightBg: '#ecfdf5',
      gradient: 'linear-gradient(180deg, #34d399 0%, #059669 100%)',
      glow: '0 4px 12px rgba(5, 150, 105, 0.3)'
    },
    {
      type: 'pemakaian',
      title: 'Pemakaian (-)',
      shortLabel: 'Pemakaian',
      subtitle: 'Pemakaian Dapur',
      val: financialSummary.totalPemakaianRp,
      color: '#d97706',
      borderColor: '#fde68a',
      lightBg: '#fffbeb',
      gradient: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
      glow: '0 4px 12px rgba(217, 119, 6, 0.3)'
    },
    {
      type: 'stokAkhir',
      title: 'Stok Akhir',
      shortLabel: 'Stok Akhir',
      subtitle: 'Harga Akhir Saat Ini',
      val: financialSummary.totalStokAkhirRp,
      color: '#0891b2',
      borderColor: '#a5f3fc',
      lightBg: '#ecfeff',
      gradient: 'linear-gradient(180deg, #22d3ee 0%, #0891b2 100%)',
      glow: '0 4px 12px rgba(8, 145, 178, 0.3)'
    },
    {
      type: 'hasilProduksi',
      title: 'Hasil Produksi',
      shortLabel: 'Hasil Produksi',
      subtitle: 'Nilai Olahan Sosis',
      val: financialSummary.totalHasilProduksiRp,
      color: '#7c3aed',
      borderColor: '#ddd6fe',
      lightBg: '#f5f3ff',
      gradient: 'linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)',
      glow: '0 4px 12px rgba(124, 58, 237, 0.3)'
    }
  ], [financialSummary]);

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

  const datePickerStyle = {
    background: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    color: '#f8fafc',
    borderRadius: '8px',
    padding: '0.35rem 0.65rem',
    fontSize: '0.78rem',
    fontWeight: '600',
    outline: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    cursor: 'pointer'
  };

  return (
    <div className="tab-pane active" style={{ color: '#1e293b' }}>
      {/* Modal Rincian Pemakaian & Biaya Produksi Per Tanggal */}
      {isModalRincianOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-card modal-card-lg" style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '94vw',
            maxWidth: '1180px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
            border: '1px solid #cbd5e1',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.15rem 1.5rem', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderBottom: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.1rem', margin: 0, color: '#92400e', fontWeight: 900 }}>
                  <Package size={22} style={{ color: '#d97706' }} /> Rincian Pemakaian &amp; Biaya Produksi Per Tanggal ({selectedMonth || 'Semua'})
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 700, marginTop: '0.2rem', display: 'block' }}>
                  Total Akumulasi: <strong style={{ color: '#d97706', fontSize: '0.95rem' }}>Rp {formatNumber(financialSummary.totalPemakaianRp)}</strong> (Bahan Baku + Kemasan &amp; Stiker)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalRincianOpen(false)}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #fcd34d',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '1.1rem 1.25rem' }}>
              <div className="table-responsive" style={{
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                maxHeight: '58vh',
                overflowY: 'auto',
                overflowX: 'auto'
              }}>
                <table className="custom-table" style={{ width: '100%', fontSize: '0.73rem', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr style={{ background: '#f8fafc', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>No</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Tanggal</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Nama Produk Batch</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Biaya Bahan Baku</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Yield (KG)</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Biaya Kemasan/Pcs</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Total Plastik &amp; Stiker</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', background: '#fef3c7', color: '#92400e', fontWeight: 900, whiteSpace: 'nowrap' }}>Total Biaya + Kemasan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rincianPemakaianPerTanggal.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">
                          Belum ada rincian pemakaian/produksi untuk periode {selectedMonth || 'ini'}.
                        </td>
                      </tr>
                    ) : (
                      rincianPemakaianPerTanggal.map((item, idx) => (
                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 800, color: '#334155', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.tanggal}</td>
                          <td style={{ fontWeight: 900, color: '#0f172a', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>
                            {item.produkNama}
                            <span style={{ fontSize: '0.62rem', color: '#64748b', display: 'inline-block', marginLeft: '0.4rem', fontWeight: 600 }}>({item.sumber})</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#d97706', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(item.biayaBahanBaku)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.yieldKg} KG</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#4f46e5', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(item.biayaKemasanPerPcs)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#4338ca', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(item.totalKemasan)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 900, color: '#7c3aed', background: '#f5f3ff', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>
                            Rp {formatNumber(item.totalBiayaPlusKemasan)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {rincianPemakaianPerTanggal.length > 0 && (
                    <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                      <tr style={{ background: '#f8fafc', fontWeight: 900, color: '#0f172a', borderTop: '2px solid #cbd5e1', boxShadow: '0 -2px 6px rgba(0,0,0,0.04)' }}>
                        <td colSpan={3} style={{ textAlign: 'right', padding: '0.55rem 0.65rem', color: '#475569', whiteSpace: 'nowrap', background: '#f8fafc' }}>TOTAL AKUMULASI BULAN {selectedMonth || ''}:</td>
                        <td style={{ textAlign: 'right', color: '#d97706', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap', background: '#f8fafc' }}>Rp {formatNumber(rincianPemakaianPerTanggal.reduce((a, b) => a + b.biayaBahanBaku, 0))}</td>
                        <td style={{ textAlign: 'right', color: '#059669', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap', background: '#f8fafc' }}>{rincianPemakaianPerTanggal.reduce((a, b) => a + b.yieldKg, 0).toFixed(1)} KG</td>
                        <td style={{ textAlign: 'center', color: '#64748b', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap', background: '#f8fafc' }}>-</td>
                        <td style={{ textAlign: 'right', color: '#4338ca', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap', background: '#f8fafc' }}>Rp {formatNumber(rincianPemakaianPerTanggal.reduce((a, b) => a + b.totalKemasan, 0))}</td>
                        <td style={{ textAlign: 'right', color: '#6d28d9', fontSize: '0.9rem', background: '#ede9fe', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap' }}>
                          Rp {formatNumber(financialSummary.totalPemakaianRp)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
            <div style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsModalRincianOpen(false)}
                style={{ fontWeight: 800, padding: '0.5rem 1.35rem', borderRadius: '8px' }}
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 1. Modal Rincian Stok Awal */}
      {activeChartModal === 'stokAwal' && createPortal(
        <div className="modal-overlay">
          <div className="modal-card modal-card-lg" style={{ background: '#ffffff', borderRadius: '20px', width: '94vw', maxWidth: '1180px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <div style={{ padding: '1.15rem 1.5rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderBottom: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.1rem', margin: 0, color: '#0369a1', fontWeight: 900 }}>
                  <Boxes size={22} style={{ color: '#0284c7' }} /> Rincian Stok Awal Bahan Baku (Awal Bulan)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, marginTop: '0.2rem', display: 'block' }}>
                  Total Akumulasi Stok Awal: <strong style={{ color: '#0369a1', fontSize: '0.95rem' }}>Rp {formatNumber(financialSummary.totalStokAwalRp)}</strong>
                </span>
              </div>
              <button type="button" onClick={() => setActiveChartModal(null)} style={{ background: '#ffffff', border: '1.5px solid #bae6fd', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.1rem 1.25rem' }}>
              <div className="table-responsive" style={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', maxHeight: '58vh', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', fontSize: '0.73rem', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr style={{ background: '#f8fafc', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>No</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Kode / SKU</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Nama Bahan Baku</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Stok Awal</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'center', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Satuan</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Harga Awal / Satuan (Rp)</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', background: '#e0f2fe', color: '#0369a1', fontWeight: 900, whiteSpace: 'nowrap' }}>Total Nilai Stok Awal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rincianStokAwal.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 800, color: '#0284c7', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.sku}</td>
                        <td style={{ fontWeight: 900, color: '#0f172a', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.nama}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0369a1', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{formatNumber(item.stokAwal)}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.satuan}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#475569', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(item.hargaAwal)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 900, color: '#0284c7', background: '#f0f9ff', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(item.totalNilai)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                    <tr style={{ background: '#f8fafc', fontWeight: 900, color: '#0f172a', borderTop: '2px solid #cbd5e1' }}>
                      <td colSpan={3} style={{ textAlign: 'right', padding: '0.55rem 0.65rem', color: '#475569', whiteSpace: 'nowrap', background: '#f8fafc' }}>TOTAL AKUMULASI STOK AWAL:</td>
                      <td style={{ textAlign: 'right', color: '#0369a1', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap', background: '#f8fafc' }}>{rincianStokAwal.reduce((a, b) => a + b.stokAwal, 0).toFixed(1)}</td>
                      <td style={{ textAlign: 'center', color: '#64748b', background: '#f8fafc' }}>-</td>
                      <td style={{ textAlign: 'center', color: '#64748b', background: '#f8fafc' }}>-</td>
                      <td style={{ textAlign: 'right', color: '#0284c7', fontSize: '0.9rem', background: '#e0f2fe', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(financialSummary.totalStokAwalRp)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button type="button" className="btn btn-primary" onClick={() => setActiveChartModal(null)} style={{ fontWeight: 800, padding: '0.5rem 1.35rem', borderRadius: '8px' }}>Tutup Rincian</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. Modal Rincian Penerimaan (+) */}
      {activeChartModal === 'penerimaan' && createPortal(
        <div className="modal-overlay">
          <div className="modal-card modal-card-lg" style={{ background: '#ffffff', borderRadius: '20px', width: '94vw', maxWidth: '1180px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <div style={{ padding: '1.15rem 1.5rem', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.1rem', margin: 0, color: '#065f46', fontWeight: 900 }}>
                  <ArrowDownLeft size={22} style={{ color: '#059669' }} /> Rincian Penerimaan Bahan Baku (+) ({selectedMonth || 'Semua'})
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, marginTop: '0.2rem', display: 'block' }}>
                  Total Akumulasi Penerimaan: <strong style={{ color: '#059669', fontSize: '0.95rem' }}>Rp {formatNumber(financialSummary.totalPenerimaanRp)}</strong>
                </span>
              </div>
              <button type="button" onClick={() => setActiveChartModal(null)} style={{ background: '#ffffff', border: '1.5px solid #a7f3d0', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.1rem 1.25rem' }}>
              <div className="table-responsive" style={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', maxHeight: '58vh', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', fontSize: '0.73rem', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr style={{ background: '#f8fafc', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>No</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Tanggal Terima</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Supplier / No. Faktur</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Nama Bahan Baku</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Jumlah Diterima</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'center', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Satuan</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Harga Satuan (Rp)</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', background: '#d1fae5', color: '#065f46', fontWeight: 900, whiteSpace: 'nowrap' }}>Subtotal Penerimaan (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rincianPenerimaan.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">Belum ada rincian penerimaan untuk periode {selectedMonth || 'ini'}.</td></tr>
                    ) : (
                      rincianPenerimaan.map((item, idx) => (
                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 800, color: '#334155', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.tanggal}</td>
                          <td style={{ fontWeight: 800, color: '#059669', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.supplier}</td>
                          <td style={{ fontWeight: 900, color: '#0f172a', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.namaBahan}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#047857', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{formatNumber(item.jumlahDiterima)}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.satuan}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#475569', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(item.hargaSatuan)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 900, color: '#059669', background: '#ecfdf5', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(item.subtotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {rincianPenerimaan.length > 0 && (
                    <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                      <tr style={{ background: '#f8fafc', fontWeight: 900, color: '#0f172a', borderTop: '2px solid #cbd5e1' }}>
                        <td colSpan={4} style={{ textAlign: 'right', padding: '0.55rem 0.65rem', color: '#475569', whiteSpace: 'nowrap', background: '#f8fafc' }}>TOTAL AKUMULASI PENERIMAAN:</td>
                        <td style={{ textAlign: 'right', color: '#047857', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap', background: '#f8fafc' }}>{rincianPenerimaan.reduce((a, b) => a + b.jumlahDiterima, 0).toFixed(1)}</td>
                        <td style={{ textAlign: 'center', color: '#64748b', background: '#f8fafc' }}>-</td>
                        <td style={{ textAlign: 'center', color: '#64748b', background: '#f8fafc' }}>-</td>
                        <td style={{ textAlign: 'right', color: '#059669', fontSize: '0.9rem', background: '#d1fae5', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(financialSummary.totalPenerimaanRp)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
            <div style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button type="button" className="btn btn-primary" onClick={() => setActiveChartModal(null)} style={{ fontWeight: 800, padding: '0.5rem 1.35rem', borderRadius: '8px' }}>Tutup Rincian</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 4. Modal Rincian Stok Akhir */}
      {activeChartModal === 'stokAkhir' && createPortal(
        <div className="modal-overlay">
          <div className="modal-card modal-card-lg" style={{ background: '#ffffff', borderRadius: '20px', width: '94vw', maxWidth: '1180px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <div style={{ padding: '1.15rem 1.5rem', background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', borderBottom: '1px solid #a5f3fc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.1rem', margin: 0, color: '#155e75', fontWeight: 900 }}>
                  <Layers size={22} style={{ color: '#0891b2' }} /> Rincian Stok Akhir Bahan Baku (Saat Ini)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#0e7490', fontWeight: 700, marginTop: '0.2rem', display: 'block' }}>
                  Total Akumulasi Nilai Stok Akhir: <strong style={{ color: '#0891b2', fontSize: '0.95rem' }}>Rp {formatNumber(financialSummary.totalStokAkhirRp)}</strong> (Stok Awal + Masuk - Keluar)
                </span>
              </div>
              <button type="button" onClick={() => setActiveChartModal(null)} style={{ background: '#ffffff', border: '1.5px solid #a5f3fc', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.1rem 1.25rem' }}>
              <div className="table-responsive" style={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', maxHeight: '58vh', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', fontSize: '0.73rem', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr style={{ background: '#f8fafc', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>No</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Kode / SKU</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Nama Bahan Baku</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Stok Awal</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Masuk (+)</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Keluar (-)</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 900, whiteSpace: 'nowrap', background: '#e0f2fe', color: '#0369a1' }}>Stok Akhir</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Harga Satuan (Rp)</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', background: '#cffafe', color: '#155e75', fontWeight: 900, whiteSpace: 'nowrap' }}>Nilai Stok Akhir (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rincianStokAkhir.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 800, color: '#0891b2', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.sku}</td>
                        <td style={{ fontWeight: 900, color: '#0f172a', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.nama}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#64748b', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{formatNumber(item.stokAwal)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>+{formatNumber(item.penerimaan)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#d97706', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>-{formatNumber(item.pemakaian)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 900, color: '#0369a1', background: '#f0f9ff', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{formatNumber(item.stokAkhir)} {item.satuan}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#475569', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(item.hargaSatuan)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 900, color: '#0891b2', background: '#ecfeff', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(item.totalNilai)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                    <tr style={{ background: '#f8fafc', fontWeight: 900, color: '#0f172a', borderTop: '2px solid #cbd5e1' }}>
                      <td colSpan={6} style={{ textAlign: 'right', padding: '0.55rem 0.65rem', color: '#475569', whiteSpace: 'nowrap', background: '#f8fafc' }}>TOTAL AKUMULASI STOK AKHIR:</td>
                      <td style={{ textAlign: 'right', color: '#0369a1', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap', background: '#f0f9ff' }}>{rincianStokAkhir.reduce((a, b) => a + b.stokAkhir, 0).toFixed(1)}</td>
                      <td style={{ textAlign: 'center', color: '#64748b', background: '#f8fafc' }}>-</td>
                      <td style={{ textAlign: 'right', color: '#0891b2', fontSize: '0.9rem', background: '#cffafe', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(financialSummary.totalStokAkhirRp)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button type="button" className="btn btn-primary" onClick={() => setActiveChartModal(null)} style={{ fontWeight: 800, padding: '0.5rem 1.35rem', borderRadius: '8px' }}>Tutup Rincian</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 5. Modal Rincian Hasil Produksi */}
      {activeChartModal === 'hasilProduksi' && createPortal(
        <div className="modal-overlay">
          <div className="modal-card modal-card-lg" style={{ background: '#ffffff', borderRadius: '20px', width: '94vw', maxWidth: '1180px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <div style={{ padding: '1.15rem 1.5rem', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderBottom: '1px solid #ddd6fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.1rem', margin: 0, color: '#5b21b6', fontWeight: 900 }}>
                  <Factory size={22} style={{ color: '#7c3aed' }} /> Rincian Hasil Produksi Olahan Sosis ({selectedMonth || 'Semua'})
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#6d28d9', fontWeight: 700, marginTop: '0.2rem', display: 'block' }}>
                  Total Akumulasi Hasil Produksi: <strong style={{ color: '#7c3aed', fontSize: '0.95rem' }}>Rp {formatNumber(financialSummary.totalHasilProduksiRp)}</strong> (Total Yield Packs x HPP Unit)
                </span>
              </div>
              <button type="button" onClick={() => setActiveChartModal(null)} style={{ background: '#ffffff', border: '1.5px solid #ddd6fe', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.1rem 1.25rem' }}>
              <div className="table-responsive" style={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', maxHeight: '58vh', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', fontSize: '0.73rem', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr style={{ background: '#f8fafc', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>No</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Tanggal Produksi</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Kode / Alias</th>
                      <th style={{ padding: '0.55rem 0.6rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Nama Produk Olahan</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>Hasil Yield (Pcs/Pack)</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', background: '#f8fafc' }}>HPP / Pack (Rp)</th>
                      <th style={{ padding: '0.55rem 0.6rem', textAlign: 'right', background: '#ede9fe', color: '#5b21b6', fontWeight: 900, whiteSpace: 'nowrap' }}>Total Nilai Hasil Produksi (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rincianHasilProduksi.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">Belum ada rincian hasil produksi untuk periode {selectedMonth || 'ini'}.</td></tr>
                    ) : (
                      rincianHasilProduksi.map((item, idx) => (
                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 800, color: '#334155', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.tanggal}</td>
                          <td style={{ fontWeight: 800, color: '#7c3aed', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.alias}</td>
                          <td style={{ fontWeight: 900, color: '#0f172a', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{item.produkNama}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#6d28d9', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{formatNumber(item.jumlahPcs)} Pcs</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#475569', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(item.hppPerPack)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 900, color: '#7c3aed', background: '#f5f3ff', padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(item.totalNilai)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {rincianHasilProduksi.length > 0 && (
                    <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                      <tr style={{ background: '#f8fafc', fontWeight: 900, color: '#0f172a', borderTop: '2px solid #cbd5e1' }}>
                        <td colSpan={4} style={{ textAlign: 'right', padding: '0.55rem 0.65rem', color: '#475569', whiteSpace: 'nowrap', background: '#f8fafc' }}>TOTAL AKUMULASI HASIL PRODUKSI:</td>
                        <td style={{ textAlign: 'right', color: '#6d28d9', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap', background: '#f8fafc' }}>{formatNumber(rincianHasilProduksi.reduce((a, b) => a + b.jumlahPcs, 0))} Pcs</td>
                        <td style={{ textAlign: 'center', color: '#64748b', background: '#f8fafc' }}>-</td>
                        <td style={{ textAlign: 'right', color: '#7c3aed', fontSize: '0.9rem', background: '#ede9fe', padding: '0.55rem 0.65rem', whiteSpace: 'nowrap' }}>Rp {formatNumber(financialSummary.totalHasilProduksiRp)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
            <div style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button type="button" className="btn btn-primary" onClick={() => setActiveChartModal(null)} style={{ fontWeight: 800, padding: '0.5rem 1.35rem', borderRadius: '8px' }}>Tutup Rincian</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Rekapitulasi Total Produksi Per Tanggal */}
      {isModalRekapOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '820px', width: '95%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '0.75rem 1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', margin: 0 }}>
                <Calendar size={18} style={{ color: 'var(--indigo)' }} /> Rekapitulasi Total Produksi Per Tanggal
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsModalRekapOpen(false)}><X size={16} /></button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#475569', display: 'block', marginBottom: '0.2rem', fontWeight: 700 }}>Pilih Bulan</label>
                  <input
                    type="month"
                    style={datePickerStyle}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '0.7rem', color: '#475569', display: 'block', marginBottom: '0.2rem', fontWeight: 700 }}>Cari Produk</label>
                  <div className="search-box" style={{ height: '32px' }}>
                    <Search size={14} />
                    <input type="text" placeholder="Misal: RCS, BS..." value={searchRekap} onChange={(e) => setSearchRekap(e.target.value)} style={{ fontSize: '0.76rem' }} />
                  </div>
                </div>

                {selectedMonth !== currentMonthStr && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setSelectedMonth(currentMonthStr)}
                    style={{ fontSize: '0.74rem', height: '32px' }}
                  >
                    Bulan Berjalan
                  </button>
                )}

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn btn-sm btn-outline" onClick={handleExportExcelRekap} style={{ fontSize: '0.74rem', height: '32px' }}>
                    <FileSpreadsheet size={14} style={{ color: 'var(--emerald)' }} /> Excel
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={handleExportPdfRekap} style={{ fontSize: '0.74rem', height: '32px' }}>
                    <FileText size={14} style={{ color: 'var(--amber)' }} /> Cetak PDF
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="custom-table" style={{ width: '100%', fontSize: '0.74rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ width: '22%', padding: '0.45rem 0.65rem' }}>TANGGAL PRODUKSI</th>
                      <th style={{ width: '25%', padding: '0.45rem 0.65rem' }}>TOTAL BATCH</th>
                      <th style={{ width: '53%', padding: '0.45rem 0.65rem' }}>RINCIAN PRODUK DILAKUKAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRekap.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                          Tidak ada data produksi untuk periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredRekap.map(g => {
                        const isToday = g.tanggal === todayStr;
                        return (
                          <tr key={g.tanggal} style={{ background: isToday ? 'rgba(99, 102, 241, 0.06)' : 'transparent', borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ verticalAlign: 'middle', padding: '0.4rem 0.65rem' }}>
                              <strong style={{ fontSize: '0.8rem', color: isToday ? '#2563eb' : '#0f172a' }}>{g.tanggal}</strong>
                              {isToday && <span className="badge badge-cyan" style={{ marginLeft: '0.4rem', fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>HARI INI</span>}
                            </td>
                            <td style={{ verticalAlign: 'middle', padding: '0.4rem 0.65rem' }}>
                              <strong style={{ fontSize: '0.85rem', color: '#059669' }}>{g.totalBatch} Batch</strong>
                              <span className="text-muted" style={{ display: 'block', fontSize: '0.68rem' }}>({g.totalTransaksi} Sesi Transaksi)</span>
                            </td>
                            <td style={{ verticalAlign: 'middle', padding: '0.4rem 0.65rem' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                                {Object.entries(g.produkMap).map(([p, qty], pIdx) => (
                                  <span
                                    key={pIdx}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      background: '#fef3c7',
                                      border: '1px solid #fde68a',
                                      color: '#92400e',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: '6px'
                                    }}
                                  >
                                    <span>{p}:</span>
                                    <strong style={{ color: '#78350f' }}>{qty} Batch</strong>
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

            <div className="modal-footer" style={{ padding: '0.65rem 1rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalRekapOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== HERO WELCOME BANNER (VIBRANT OCEAN GRADIENT THEME) ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 45%, #09132b 100%)',
        borderRadius: '12px',
        padding: '0.95rem 1.25rem',
        marginBottom: '1rem',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 6px 20px rgba(2, 132, 199, 0.25)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 260px' }}>
          <h2 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '0.2px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            Hai, HS Team 👋 <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff', padding: '0.15rem 0.55rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(4px)' }}>DASHBOARD EXECUTIVE FINANCIAL</span>
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#e2e8f0', margin: '0.25rem 0 0 0', fontWeight: 500, opacity: 0.95 }}>
            Ringkasan akumulasi nilai rupiah stok awal, penerimaan, pemakaian, hasil produksi &amp; stok akhir real-time.
          </p>
        </div>
        <button
          className="btn btn-emerald"
          onClick={onOpenModalProduksi}
          style={{
            fontWeight: 800,
            fontSize: '0.78rem',
            padding: '0 0.85rem',
            height: '32px',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
            marginLeft: 'auto',
            flexShrink: 0
          }}
        >
          <PlusCircle size={14} /> Mulai Produksi
        </button>
      </div>

      {/* ===== EXECUTIVE FINANCIAL CHART PANEL (MODERN BAR & COMPARISON) ===== */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '14px',
        padding: '1.15rem 1.25rem',
        marginBottom: '1rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header Title & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.2px' }}>
              <Activity size={18} style={{ color: '#0284c7' }} /> Grafik Ringkasan Keuangan Persediaan &amp; Hasil Produksi (Rupiah)
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0 0', fontWeight: 500 }}>
              Perbandingan komparatif nilai Rupiah Stok Awal, Penerimaan, Pemakaian, Hasil Produksi &amp; Stok Akhir.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* <button
              className="btn btn-sm btn-outline"
              onClick={() => setIsModalRincianOpen(true)}
              style={{
                fontSize: '0.74rem',
                background: '#fffbeb',
                borderColor: '#fcd34d',
                color: '#b45309',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '8px',
                padding: '0.3rem 0.65rem'
              }}
            >
              <Search size={13} /> Rincian Pemakaian Per Tanggal
            </button> */}
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '0.25rem 0.65rem', borderRadius: '8px', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} /> Periode: {selectedMonth || 'Semua'}
            </span>
          </div>
        </div>

        {/* MODERN FINANCIAL COMPARISON BAR CHART CONTAINER (RESPONSIVE TOUCH SCROLLABLE) */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem 1rem 1rem 1rem',
          marginBottom: '1rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justify: 'space-around',
            height: '340px',
            gap: '1rem',
            paddingBottom: '0.85rem',
            borderBottom: '2px dashed #cbd5e1',
            minWidth: '580px'
          }}>
            {financialChartData.map((item, idx) => {
              const maxFinancialVal = Math.max(
                financialSummary.totalStokAwalRp,
                financialSummary.totalPenerimaanRp,
                financialSummary.totalPemakaianRp,
                financialSummary.totalHasilProduksiRp,
                financialSummary.totalStokAkhirRp,
                1
              );
              const heightPct = Math.max(16, Math.round((item.val / maxFinancialVal) * 100));

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', minWidth: '95px', position: 'relative' }}>
                  
                  {/* Floating Nominal Value Badge on Top */}
                  <div
                    onClick={() => setActiveChartModal(item.type)}
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 900,
                      color: item.color,
                      background: '#ffffff',
                      border: `1.5px solid ${item.borderColor}`,
                      padding: '0.22rem 0.55rem',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      marginBottom: '0.6rem',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                    title={`Klik untuk melihat Rincian ${item.title}`}
                  >
                    Rp {formatNumber(item.val)}
                  </div>

                  {/* Gradient Filled Bar */}
                  <div
                    onClick={() => setActiveChartModal(item.type)}
                    style={{
                      width: '100%',
                      maxWidth: '64px',
                      height: `${heightPct}%`,
                      background: item.gradient,
                      borderRadius: '10px 10px 0 0',
                      boxShadow: item.glow,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    title={`${item.title}: Rp ${formatNumber(item.val)} (Klik untuk melihat Rincian)`}
                  />

                  {/* Label Bar Underneath */}
                  <div
                    onClick={() => setActiveChartModal(item.type)}
                    style={{ marginTop: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
                    title={`Klik untuk melihat Rincian ${item.title}`}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', marginTop: '0.15rem' }}>
                      {item.subtitle}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* HIGH-TECH FINANCIAL PILL SUMMARY LEGEND (RESPONSIVE WRAP) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
          {financialChartData.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setActiveChartModal(item.type)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: item.lightBg,
                border: `1px solid ${item.borderColor}`,
                borderRadius: '8px',
                padding: '0.35rem 0.75rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'transform 0.15s ease'
              }}
              title={`Klik untuk melihat Rincian ${item.title}`}
            >
              <div style={{ width: '9px', height: '9px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginRight: '0.15rem' }}>{item.shortLabel}:</span>
              <strong style={{ fontSize: '0.78rem', fontWeight: 900, color: item.color }}>
                Rp {formatNumber(item.val)}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 3 OPERATIONAL STAT CARDS (COMPACT SIZE) ===== */}
      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        {/* <div
          className="stat-card border-cyan"
          style={{ cursor: 'pointer', padding: '0.75rem 0.9rem' }}
          onClick={onOpenModalProduksi}
          title="Klik untuk membuat batch produksi baru & potong stok bahan otomatis"
        >
          <div className="stat-icon icon-cyan" style={{ width: '38px', height: '38px' }}><Factory size={20} /></div>
          <div className="stat-details">
            <span className="stat-title" style={{ fontSize: '0.74rem' }}>Eksekusi Batch Produksi</span>
            <h3 className="stat-value" style={{ fontSize: '1.05rem', color: '#0284c7', margin: '0.1rem 0' }}>+ Batch Produksi</h3>
            <span className="stat-desc text-cyan" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem' }}>
              Otomatis Potong Stok Bahan <ArrowRight size={12} />
            </span>
          </div>
        </div> */}
{/* 
        <div
          className="stat-card border-amber"
          style={{ cursor: 'pointer', padding: '0.75rem 0.9rem' }}
          onClick={() => onSwitchTab ? onSwitchTab('bahan-baku') : onNavigate && onNavigate('bahan-baku')}
          title="Klik untuk membuka tab Stok Bahan Baku"
        >
          <div className="stat-icon icon-amber" style={{ width: '38px', height: '38px' }}><AlertCircle size={20} /></div>
          <div className="stat-details">
            <span className="stat-title" style={{ fontSize: '0.74rem' }}>Bahan Baku Menipis</span>
            <h3 className="stat-value" style={{ color: '#d97706', fontSize: '1.05rem', margin: '0.1rem 0' }}>{lowStockList.length} Items</h3>
            <span className="stat-desc text-amber" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem' }}>
              Membutuhkan Restock <ArrowRight size={12} />
            </span>
          </div>
        </div> */}

        {/* <div className="stat-card border-indigo" style={{ padding: '0.75rem 0.9rem' }}>
          <div className="stat-icon icon-indigo" style={{ width: '38px', height: '38px' }}><ChefHat size={20} /></div>
          <div className="stat-details" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span className="stat-title" style={{ fontSize: '0.74rem' }}>Produksi Hari Ini ({todayStr})</span>
                <h3 className="stat-value" style={{ color: '#7c3aed', fontSize: '1.05rem', margin: '0.1rem 0' }}>{todayProduksiCount} Batch</h3>
                <span className="stat-desc text-indigo" style={{ fontSize: '0.68rem' }}>Sesi Produksi Batch Hari Ini</span>
              </div>
              <button
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem', borderColor: '#7c3aed', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.3rem', height: '30px' }}
                onClick={() => setIsModalRekapOpen(true)}
                title="Lihat rekapitulasi total produksi per tanggal secara detail"
              >
                <Calendar size={13} /> Detail Per Tanggal
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
