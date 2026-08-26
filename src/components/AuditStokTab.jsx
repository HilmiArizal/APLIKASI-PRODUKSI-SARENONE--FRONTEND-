import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardCheck, Calendar, DollarSign, Upload, Download, Save, CheckCircle, Trash2, Eye, X, FileText, Search, TrendingDown, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatNumber, STOCK_AWAL_JULI, getSkuSortIndex } from '../data/initialData';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { getAuditStokListApi, saveAuditStokApi, deleteAuditStokApi, deleteAuditStokByDateApi, deleteAuditStokBatchApi } from '../services/api';

export default function AuditStokTab({
  bahanBaku = [],
  utangList = [],
  riwayatProduksi = [],
  activeUser,
  onOpenPdfPreview
}) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthStr = todayStr.substring(0, 7); // e.g. "2026-08"

  // Target Date & Filter States
  const [targetTanggal, setTargetTanggal] = useState(todayStr);
  const [filterBulan, setFilterBulan] = useState(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Import Modal & Excel States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelRawJson, setExcelRawJson] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  // History & Detail Modal States
  const [auditList, setAuditList] = useState([]);
  const [selectedDetailAudit, setSelectedDetailAudit] = useState(null);

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

  // Get Receipts Specifically ON Target Date
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

    // 2. Internal Emulsion Production Yields
    const bSku = String(b.sku || b.kode || '').trim().toUpperCase();
    const bName = String(b.nama || '').trim().toLowerCase();
    const isEmulsiIsp = bSku === 'BB5' || bSku === 'EML-ISP' || bName.includes('emulsi isp');
    const isEmulsiTvp = bSku === 'BB55' || bSku === 'EML-TVP' || bName.includes('emulsi tvp');

    if (isEmulsiIsp || isEmulsiTvp) {
      (auditList || []).forEach(log => {
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

  // Get Production Consumptions Specifically ON Target Date
  const getConsumptionOnSpecificDate = (b, targetDateStr) => {
    if (!b || !targetDateStr) return 0;
    let total = 0;

    // 1. Kitchen Finished Goods Production Consumptions
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

    // 2. Consumptions of Raw Materials in Emulsion Manufacturing
    const bSku = String(b.sku || b.kode || '').trim().toUpperCase();
    const bName = String(b.nama || '').trim().toLowerCase();
    const isEmulsiItem = bSku === 'BB5' || bSku === 'BB55' || bSku === 'EML-ISP' || bSku === 'EML-TVP' || bName.includes('emulsi');

    if (!isEmulsiItem) {
      (auditList || []).forEach(log => {
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
          if (bSku === 'BB6' || bName.includes('marksoy') || bName.includes('isp')) total += 2 * batchNum;
          if (bSku === 'BB8' || (bName.includes('air') && bName.includes('es'))) total += 4 * batchNum;
          if (bSku === 'BB7' || bName.includes('minyak')) total + 4 * batchNum;
        } else if (detail.includes('tvp') || aksi.includes('tvp')) {
          if (bSku === 'BB54' || bName.includes('tvp')) total += 1 * batchNum;
        }
      });
    }

    return Math.round(total * 1000) / 1000;
  };

  // Get Day-by-Day Continuous Stock Timeline for Material b up to targetDateStr
  const getBahanDailyTimeline = (b, targetDateStr) => {
    if (!b) return { stokAwal: 0, penerimaan: 0, pemakaian: 0, stokAkhir: 0 };
    const targetDate = targetDateStr || todayStr;
    const bSku = String(b.sku || b.kode || '').trim().toUpperCase();

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

    if (!targetDate) return { stokAwal: currentStock, penerimaan: 0, pemakaian: 0, stokAkhir: currentStock };

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

    (auditList || []).forEach(log => {
      const rawDate = log.timestamp || log.tanggal || log.createdAt || '';
      const dStr = String(rawDate).substring(0, 10);
      if (dStr && dStr <= targetDate) dateSet.add(dStr);
    });

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

  const getBahanStokOnDate = (b, targetDateStr) => {
    return getBahanDailyTimeline(b, targetDateStr).stokAkhir;
  };

  // Fetch History Strictly From Backend Database
  useEffect(() => {
    async function loadAuditList() {
      try {
        const res = await getAuditStokListApi('');
        if (res && res.success && Array.isArray(res.data)) {
          setAuditList(res.data);
        } else {
          setAuditList([]);
        }
      } catch (err) {
        console.error('Gagal mengambil data dari database:', err);
        setAuditList([]);
      }
    }
    loadAuditList();
  }, []);

  // Reset Modal state on close
  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setExcelFile(null);
    setExcelRawJson([]);
    setIsUploading(false);
  };

  // Download Template Excel (.xlsx) WITHOUT "Stok Sistem saat ini" column as requested!
  const handleDownloadExcelTemplate = () => {
    const sortedMaterials = [...(bahanBaku || [])].sort((a, b) => getSkuSortIndex(a.sku || a.kode) - getSkuSortIndex(b.sku || b.kode));

    // TEMPLATE COLUMNS: Kode SKU | Nama Bahan Baku | Satuan | Stok Fisik Hasil Opname | Catatan Alasan
    const templateData = sortedMaterials.map(b => ({
      'Kode SKU': b.sku || b.kode || b.id || '',
      'Nama Bahan Baku': b.nama,
      'Satuan': b.satuan || 'kg',
      'Stok Fisik Hasil Opname': '', // Blank column for warehouse physical stock entry
      'Catatan Alasan': ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OpnameStokFisik');

    // Auto Column Widths
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 32 },
      { wch: 12 },
      { wch: 28 },
      { wch: 35 }
    ];

    XLSX.writeFile(workbook, `Template_Opname_Stok_Fisik.xlsx`);
  };

  // Handle File Selection & Parse Raw JSON
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExcelFile(file);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!data || data.length === 0) {
          setErrorMsg('⚠️ File Excel kosong atau format tidak sesuai!');
          setTimeout(() => setErrorMsg(''), 4500);
          return;
        }

        setExcelRawJson(data);
      } catch (err) {
        setErrorMsg(`❌ Gagal membaca file Excel: ${err.message}`);
        setTimeout(() => setErrorMsg(''), 4500);
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = null; // Reset file input
  };

  // DYNAMICALLY COMPUTE PREVIEW DATA BASED ON SELECTED targetTanggal AND EXCEL RAW JSON!
  const excelPreviewData = useMemo(() => {
    if (!excelRawJson || excelRawJson.length === 0) return [];

    return excelRawJson.map((row, idx) => {
      const skuCode = String(row['Kode SKU'] || row['SKU'] || row['Kode'] || '').trim();
      const namaBahan = String(row['Nama Bahan Baku'] || row['Nama Bahan'] || row['Nama'] || '').trim();
      const stokFisikVal = parseFloat(row['Stok Fisik Hasil Opname'] || row['Stok Fisik'] || row['Fisik'] || '0');
      const catatan = String(row['Catatan Alasan'] || row['Catatan'] || row['Keterangan'] || '').trim();

      // Find matching material in master data
      const match = (bahanBaku || []).find(b => {
        const bSku = String(b.sku || b.kode || b.id || '').trim().toLowerCase();
        const bNama = String(b.nama || '').trim().toLowerCase();
        if (skuCode && bSku === skuCode.toLowerCase()) return true;
        if (namaBahan && bNama === namaBahan.toLowerCase()) return true;
        return false;
      });

      // CALCULATE SYSTEM STOCK DYNAMICALLY AS OF SELECTED targetTanggal!
      const stokSistemOnDate = match ? getBahanStokOnDate(match, targetTanggal) : 0;
      const hargaSatuan = match ? Number(match.harga || 0) : 0;
      const satuan = match ? (match.satuan || 'kg') : String(row['Satuan'] || 'kg');

      const isFisikProvided = !isNaN(stokFisikVal) && (row['Stok Fisik Hasil Opname'] !== '' || row['Stok Fisik'] !== '' || row['Fisik'] !== '');

      // RULE: For vacumbag & sticker, if physical stock input/uploaded is 0 (or empty), treat as SAME AS SYSTEM STOCK!
      const rawNameLower = (match ? match.nama : namaBahan).toLowerCase();
      const isVacumbagOrSticker = rawNameLower.includes('vacum') ||
                                  rawNameLower.includes('vacuum') ||
                                  rawNameLower.includes('vaccum') ||
                                  rawNameLower.includes('vac') ||
                                  rawNameLower.includes('sticker') ||
                                  rawNameLower.includes('stiker');

      let finalStokFisik = isFisikProvided ? stokFisikVal : 0;
      let isSameAsSystem = false;

      if (isVacumbagOrSticker && (stokFisikVal === 0 || !isFisikProvided)) {
        finalStokFisik = stokSistemOnDate;
        isSameAsSystem = true;
      }

      const selisih = (isSameAsSystem) ? 0 : (isFisikProvided ? (finalStokFisik - stokSistemOnDate) : 0);
      const absSelisih = Math.abs(selisih);
      const susutPctVal = (stokSistemOnDate > 0 && !isSameAsSystem && isFisikProvided)
        ? Number(((absSelisih / stokSistemOnDate) * 100).toFixed(1))
        : 0;
      const nilaiSusut = Math.round(absSelisih * hargaSatuan);

      const finalKeterangan = catatan
        ? catatan
        : (isSameAsSystem ? '(Vacumbag/Sticker: Stok 0 dianggap sama dengan sistem)' : 'Import Excel Stok Fisik');

      return {
        rowNum: idx + 1,
        matched: !!match,
        bahanId: match ? (match.id || match._id) : null,
        skuCode: skuCode || (match ? match.sku : '-'),
        bahanNama: match ? match.nama : (namaBahan || `Baris ${idx + 1}`),
        satuan,
        stokSistem: stokSistemOnDate,
        stokFisik: finalStokFisik,
        isFisikProvided,
        selisihQty: Math.round(selisih * 100) / 100,
        susutPct: susutPctVal,
        hargaSatuan,
        nilaiSusutRp: nilaiSusut,
        keterangan: finalKeterangan
      };
    }).filter(r => r.isFisikProvided || r.matched);
  }, [excelRawJson, bahanBaku, targetTanggal, utangList, riwayatProduksi]);

  // Submit Batch Excel Records Directly to Backend Database
  const handleSaveExcelBatch = async () => {
    if (!excelPreviewData || excelPreviewData.length === 0) {
      setErrorMsg('⚠️ Tidak ada data stok fisik yang terbaca dari Excel!');
      setTimeout(() => setErrorMsg(''), 4500);
      return;
    }

    setIsUploading(true);
    const auditorName = activeUser?.name || 'Tim Opname Excel';

    const batchPayload = excelPreviewData.map(r => ({
      tanggal: targetTanggal,
      bahanId: r.bahanId ? String(r.bahanId) : null,
      bahanNama: r.bahanNama,
      satuan: r.satuan,
      stokSistem: r.stokSistem,
      stokFisik: r.stokFisik,
      selisihQty: r.selisihQty,
      susutPct: r.susutPct,
      hargaSatuan: r.hargaSatuan,
      nilaiSusutRp: r.nilaiSusutRp,
      keterangan: r.keterangan || 'Import Excel Stok Fisik',
      auditor: auditorName
    }));

    try {
      const res = await saveAuditStokApi(batchPayload);
      const targetDateToFilter = targetTanggal;

      // AUTOMATICALLY SYNC FILTER DATE TO TARGET DATE SO DATA IS IMMEDIATELY VISIBLE!
      setFilterTanggal(targetDateToFilter);
      if (targetDateToFilter && targetDateToFilter.length >= 7) {
        setFilterBulan(targetDateToFilter.substring(0, 7));
      }

      if (res && res.success) {
        // Fetch fresh records directly from MongoDB Atlas Database
        const freshRes = await getAuditStokListApi('');
        if (freshRes && freshRes.success && Array.isArray(freshRes.data)) {
          setAuditList(freshRes.data);
        } else if (res.data) {
          const newRecords = Array.isArray(res.data) ? res.data : [res.data];
          setAuditList(prev => [...newRecords, ...prev]);
        }

        setSuccessMsg(`🎉 Berhasil mengimport & menyimpan ${excelPreviewData.length} data stok fisik pertanggal ${targetDateToFilter} ke MongoDB Database Atlas!`);
        setTimeout(() => setSuccessMsg(''), 5000);

        handleCloseImportModal();
      } else {
        setErrorMsg(`❌ Gagal menyimpan ke Database MongoDB: ${res?.message || 'Server error'}`);
        setTimeout(() => setErrorMsg(''), 5000);
      }
    } catch (err) {
      setErrorMsg(`❌ Terjadi kesalahan saat menyimpan ke Database: ${err.message}`);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const [errorMsg, setErrorMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, bahanNama, dateStr }
  const [isDeleting, setIsDeleting] = useState(false);

  // Trigger Delete Confirmation Modal
  const promptDeleteAudit = (id, bahanNama, dateStr) => {
    setDeleteTarget({ id, bahanNama, dateStr });
  };

  // Execute Delete Audit Record
  const executeDeleteAudit = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await deleteAuditStokApi(deleteTarget.id);
      if (res && res.success) {
        setAuditList(prev => prev.filter(x => (x.id || x._id) !== deleteTarget.id));
        setSuccessMsg(`🗑️ Catatan stok fisik ${deleteTarget.bahanNama} (${deleteTarget.dateStr}) berhasil dihapus.`);
        setTimeout(() => setSuccessMsg(''), 3500);
        setDeleteTarget(null);
      } else {
        setErrorMsg(`❌ Gagal menghapus: ${res?.message || 'Server error'}`);
        setTimeout(() => setErrorMsg(''), 5000);
      }
    } catch (e) {
      setErrorMsg(`❌ Gagal terhubung ke server: ${e.message}`);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const [deleteAllDateTarget, setDeleteAllDateTarget] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Trigger Delete All Confirmation Modal
  const promptDeleteAllByDate = () => {
    if (!filterTanggal) {
      setErrorMsg('⚠️ Silakan pilih tanggal opname spesifik yang ingin dihapus terlebih dahulu!');
      setTimeout(() => setErrorMsg(''), 4500);
      return;
    }
    setDeleteAllDateTarget(filterTanggal);
  };

  // Execute Delete All Records for a Specific Date
  const executeDeleteAllByDate = async () => {
    if (!deleteAllDateTarget) return;

    setIsDeletingAll(true);
    try {
      const res = await deleteAuditStokByDateApi(deleteAllDateTarget);
      if (res && res.success) {
        setAuditList(prev => prev.filter(x => x.tanggal !== deleteAllDateTarget));
        setSuccessMsg(`🎉 Berhasil menghapus seluruh ${res.deletedCount || ''} catatan stok fisik pertanggal ${deleteAllDateTarget} dari database.`);
        setTimeout(() => setSuccessMsg(''), 4500);
        setDeleteAllDateTarget('');
      } else {
        setErrorMsg(`❌ Gagal menghapus massal: ${res?.message || 'Server error'}`);
        setTimeout(() => setErrorMsg(''), 5000);
      }
    } catch (e) {
      setErrorMsg(`❌ Terjadi kesalahan server: ${e.message}`);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const [filterMode, setFilterMode] = useState('tanggal'); // 'tanggal' | 'bulan'
  const [filterTanggal, setFilterTanggal] = useState(todayStr);

  // Sync targetTanggal to filterTanggal when targetTanggal changes
  const handleTargetTanggalChange = (newDate) => {
    setTargetTanggal(newDate);
    setFilterTanggal(newDate);
    if (newDate && newDate.length >= 7) {
      setFilterBulan(newDate.substring(0, 7));
    }
  };

  // Helper to extract or match Kode SKU for an audit item
  const getItemSku = (item) => {
    if (item.sku) return String(item.sku);
    if (item.kode) return String(item.kode);
    if (item.skuCode) return String(item.skuCode);

    // Look up in master data by ID or Name
    const match = (bahanBaku || []).find(b => {
      const bId = String(b.id || b._id || '');
      const bNama = String(b.nama || '').trim().toLowerCase();
      if (item.bahanId && bId === String(item.bahanId)) return true;
      if (item.bahanNama && bNama === String(item.bahanNama).trim().toLowerCase()) return true;
      return false;
    });

    return match ? String(match.sku || match.kode || match.id || '') : '';
  };

  // Displayed Audit List Filtered by Date/Month & Search Query (SORTED BY KODE SKU ALPHANUMERIC)
  const displayedAuditList = useMemo(() => {
    return (auditList || []).filter(item => {
      let matchDate = true;
      if (filterTanggal) {
        matchDate = (item.tanggal === filterTanggal);
      } else if (filterBulan) {
        matchDate = (item.tanggal || '').startsWith(filterBulan);
      }

      const q = searchQuery.toLowerCase();
      const skuVal = getItemSku(item).toLowerCase();
      const matchSearch = q ? (
        (item.bahanNama || '').toLowerCase().includes(q) ||
        skuVal.includes(q) ||
        (item.keterangan || '').toLowerCase().includes(q) ||
        (item.auditor || '').toLowerCase().includes(q)
      ) : true;

      return matchDate && matchSearch;
    }).sort((a, b) => {
      // 1. Primary Sort by Tanggal (if multiple dates shown)
      if (!filterTanggal) {
        const dateCompare = (b.tanggal || '').localeCompare(a.tanggal || '');
        if (dateCompare !== 0) return dateCompare;
      }

      // 2. Secondary/Main Sort by Kode SKU Alphanumeric Ascending (e.g. BB1, BB2, BB3 ... BB56)
      const codeA = getItemSku(a);
      const codeB = getItemSku(b);

      return getSkuSortIndex(codeA) - getSkuSortIndex(codeB);
    });
  }, [auditList, filterTanggal, filterBulan, searchQuery, bahanBaku]);

  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  const getItemKey = (item) => item ? (item._id || item.id) : null;

  // Toggle Select All Checkbox Handler
  const isAllSelected = useMemo(() => {
    if (!displayedAuditList || displayedAuditList.length === 0) return false;
    return displayedAuditList.every(item => {
      const key = getItemKey(item);
      return key && selectedItemIds.includes(key);
    });
  }, [displayedAuditList, selectedItemIds]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const displayedKeys = displayedAuditList.map(getItemKey).filter(Boolean);
      setSelectedItemIds(prev => prev.filter(id => !displayedKeys.includes(id)));
    } else {
      const displayedKeys = displayedAuditList.map(getItemKey).filter(Boolean);
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...displayedKeys])));
    }
  };

  const handleToggleSelectItem = (id) => {
    if (!id) return;
    setSelectedItemIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Execute Batch Delete Selected Records
  const executeBatchDelete = async () => {
    if (!selectedItemIds || selectedItemIds.length === 0) return;

    setIsBatchDeleting(true);
    try {
      const res = await deleteAuditStokBatchApi(selectedItemIds);
      if (res && res.success) {
        setAuditList(prev => prev.filter(x => !selectedItemIds.includes(x.id || x._id)));
        setSuccessMsg(`🎉 Berhasil menghapus ${res.deletedCount || selectedItemIds.length} data stok fisik terpilih dari database.`);
        setTimeout(() => setSuccessMsg(''), 4500);
        setSelectedItemIds([]);
        setShowBatchDeleteModal(false);
      } else {
        setErrorMsg(`❌ Gagal menghapus data terpilih: ${res?.message || 'Server error'}`);
        setTimeout(() => setErrorMsg(''), 5000);
      }
    } catch (e) {
      setErrorMsg(`❌ Terjadi kesalahan server: ${e.message}`);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // KPI Aggregates
  const totalAuditCount = displayedAuditList.length;
  const totalSusutQty = displayedAuditList.reduce((acc, item) => acc + (item.selisihQty < 0 ? Math.abs(item.selisihQty) : 0), 0);
  const totalNilaiKerugianRp = displayedAuditList.reduce((acc, item) => acc + (item.nilaiSusutRp || 0), 0);

  // PDF & Excel Exports
  const handleExportPDF = () => {
    const headers = ['Tanggal Opname', 'Bahan Baku', 'Stok Sistem (BOM)', 'Stok Fisik Import', 'Selisih (Susut)', 'Susut %', 'Nilai Kerugian (Rp)', 'Auditor'];
    const rows = displayedAuditList.map(a => [
      a.tanggal,
      a.bahanNama,
      `${a.stokSistem} ${a.satuan}`,
      `${a.stokFisik} ${a.satuan}`,
      `${a.selisihQty} ${a.satuan}`,
      `${a.susutPct || 0}%`,
      `Rp ${formatNumber(a.nilaiSusutRp || 0)}`,
      a.auditor || 'Auditor'
    ]);
    const config = {
      title: `Laporan Stok Fisik & Riwayat Selisih Opname`,
      subtitle: `Periode Bulan: ${filterBulan}. Total Rekam Opname: ${displayedAuditList.length} Item`,
      headers,
      rows,
      summaryText: `Total Susut: ${totalSusutQty.toFixed(2)} KG | Total Nilai Kerugian Susut: Rp ${formatNumber(totalNilaiKerugianRp)}`,
      filename: `Laporan_Stok_Fisik_Opname_${filterBulan}`
    };
    if (onOpenPdfPreview) {
      onOpenPdfPreview(config);
    } else {
      exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
    }
  };

  const handleExportExcelHistory = () => {
    const headers = ['Tanggal Opname', 'Nama Bahan Baku', 'Stok Sistem (BOM)', 'Stok Fisik', 'Selisih Qty', 'Susut (%)', 'Harga Satuan', 'Nilai Kerugian (Rp)', 'Keterangan', 'Auditor'];
    const rows = displayedAuditList.map(a => [
      a.tanggal,
      a.bahanNama,
      a.stokSistem,
      a.stokFisik,
      a.selisihQty,
      a.susutPct,
      a.hargaSatuan,
      a.nilaiSusutRp,
      a.keterangan,
      a.auditor
    ]);
    exportToExcel(`Riwayat_Stok_Fisik_Opname_${filterBulan}`, headers, rows);
  };

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      {/* SUCCESS TOAST BANNER */}
      {successMsg && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          padding: '0.9rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.25rem',
          fontWeight: 800,
          fontSize: '0.92rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <CheckCircle size={22} />
          <span style={{ flex: 1 }}>{successMsg}</span>
        </div>
      )}

      {/* ERROR TOAST BANNER */}
      {errorMsg && (
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          padding: '0.9rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.25rem',
          fontWeight: 800,
          fontSize: '0.92rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <X size={22} />
          <span style={{ flex: 1 }}>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg('')}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ===== KPI SUMMARY METRICS CARDS ===== */}
      <div className="stats-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Card 1: Total Items */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '5px solid #3b82f6', borderRadius: '12px', padding: '1.15rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#dbeafe', color: '#2563eb', padding: '0.65rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                Item Opname Fisik ({filterBulan})
              </span>
              <h3 style={{ color: '#2563eb', fontSize: '1.4rem', fontWeight: 900, margin: '0.2rem 0' }}>
                {totalAuditCount} Record
              </h3>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1d4ed8' }}>
                Stok BOM Sistem 100% Aman &amp; Utuh
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Akumulasi Susut (KG) */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '5px solid #f59e0b', borderRadius: '12px', padding: '1.15rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.65rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                Akumulasi Susut Fisik (KG)
              </span>
              <h3 style={{ color: '#d97706', fontSize: '1.4rem', fontWeight: 900, margin: '0.2rem 0' }}>
                {totalSusutQty.toFixed(2)} KG
              </h3>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#b45309' }}>
                Selisih Penimbangan Fisik Vs Sistem
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Kerugian Susut (Rp) */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '5px solid #e11d48', borderRadius: '12px', padding: '1.15rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#ffe4e6', color: '#e11d48', padding: '0.65rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                Total Nilai Kerugian Susut
              </span>
              <h3 style={{ color: '#e11d48', fontSize: '1.4rem', fontWeight: 900, margin: '0.2rem 0' }}>
                Rp {formatNumber(totalNilaiKerugianRp)}
              </h3>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#be123c' }}>
                Perhitungan Kerugian Fisik ({filterBulan})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ACTION CONTROL BAR: TARGET TANGGAL & SINGLE IMPORT EXCEL BUTTON ===== */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.15rem 1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.55rem', margin: 0 }}>
              <FileSpreadsheet size={22} style={{ color: '#10b981' }} /> Import Stok Fisik Opname Harian
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem', margin: 0 }}>
              Import file Excel hasil penimbangan stok fisik per tanggal tanpa mengubah stok sistem BOM.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {/* Target Date Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.83rem', fontWeight: 800, color: '#2563eb' }}>📅 Tanggal Opname:</span>
              <input
                type="date"
                min={getThreeMonthCutoffDate()}
                max={todayStr}
                style={{
                  background: '#f0f9ff',
                  border: '2px solid #2563eb',
                  borderRadius: '9px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                value={targetTanggal}
                onChange={(e) => handleTargetTanggalChange(e.target.value)}
              />
            </div>

            {/* SINGLE UNIFIED IMPORT EXCEL BUTTON */}
            <button
              type="button"
              className="btn"
              onClick={() => setIsImportModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                borderRadius: '10px',
                padding: '0.6rem 1.35rem',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                cursor: 'pointer'
              }}
            >
              <Upload size={18} />
              <span>Import Excel Stok Fisik</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== TABEL RIWAYAT SELISIH STOK FISIK PER TANGGAL ===== */}
      <div className="table-container mt-4" style={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', background: '#ffffff' }}>
        {/* Table Controls Header */}
        <div style={{ padding: '1.15rem 1.35rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '14px', borderTopRightRadius: '14px', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardCheck size={20} style={{ color: '#2563eb' }} /> Riwayat Selisih Stok Fisik Vs Sistem BOM
            </h3>

            {/* CLEAN DIRECT DATE PICKER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Calendar size={16} style={{ color: '#3b82f6' }} />
              {/* <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>Filter Tanggal Opname:</span> */}
              <input
                type="date"
                style={{
                  background: '#334155',
                  border: '2px solid #3b82f6',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  borderRadius: '9px',
                  padding: '0.35rem 0.75rem',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
                }}
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
              />

            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '180px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Cari bahan / auditor..."
                style={{
                  width: '100%',
                  padding: '0.35rem 0.65rem 0.35rem 2rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none'
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {selectedItemIds.length > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  padding: '0.38rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
                  cursor: 'pointer'
                }}
                onClick={() => setShowBatchDeleteModal(true)}
              >
                <Trash2 size={15} />
                <span>Hapus Semua ({selectedItemIds.length} Terpilih)</span>
              </button>
            )}

            {displayedAuditList.length > 0 && (
              <>
                <button className="btn btn-sm btn-outline" onClick={handleExportPDF} title="Cetak Laporan PDF Audit" style={{ fontWeight: 700 }}>
                  <FileText size={15} style={{ color: '#f59e0b' }} /> Cetak PDF
                </button>
                <button className="btn btn-sm btn-outline" onClick={handleExportExcelHistory} style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  Export Excel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Table Body */}
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '44px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#e11d48' }}
                  title="Pilih Semua / Batal Pilih Semua"
                />
              </th>
              <th>TANGGAL OPNAME</th>
              <th>KODE SKU</th>
              <th>NAMA BAHAN BAKU</th>
              <th>STOK SISTEM (BOM)</th>
              <th>STOK FISIK (HASIL IMPORT)</th>
              <th>SELISIH / SUSUT</th>
              <th>SUSUT (%)</th>
              <th>KERUGIAN SUSUT (RP)</th>
              <th>KETERANGAN / ALASAN</th>
              <th>AUDITOR</th>
              <th style={{ textAlign: 'center' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {displayedAuditList.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#64748b', marginBottom: '0.35rem' }}>
                    Belum ada riwayat stok fisik yang diimport untuk periode bulan {filterBulan}.
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    Silakan gunakan tombol <strong>"Import Excel Stok Fisik"</strong> di atas untuk mencatat stok fisik pertanggal.
                  </div>
                </td>
              </tr>
            ) : (
              displayedAuditList.map((a, idx) => {
                const isLossRow = a.selisihQty < 0;
                const skuCodeVal = getItemSku(a);
                const itemKey = getItemKey(a) || `item-${idx}`;
                const isSelected = selectedItemIds.includes(itemKey);

                return (
                  <tr key={itemKey || idx} style={{ background: isSelected ? '#fff1f2' : undefined }}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectItem(itemKey)}
                        style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#e11d48' }}
                      />
                    </td>
                    <td style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2563eb' }}>{a.tanggal}</td>
                    <td style={{ fontWeight: 800, color: '#475569', fontSize: '0.82rem' }}>{skuCodeVal || '-'}</td>
                    <td style={{ fontWeight: 900, color: '#0f172a' }}>{a.bahanNama}</td>
                    <td style={{ fontWeight: 700, color: '#475569' }}>{a.stokSistem} {a.satuan}</td>
                    <td style={{ fontWeight: 900, color: '#059669' }}>{a.stokFisik} {a.satuan}</td>
                    <td style={{ fontWeight: 900, color: isLossRow ? '#e11d48' : '#059669' }}>
                      {a.selisihQty > 0 ? `+${a.selisihQty}` : a.selisihQty} {a.satuan}
                    </td>
                    <td style={{ fontWeight: 800, color: isLossRow ? '#be123c' : '#047857' }}>
                      {a.susutPct ? `${a.susutPct}%` : '0%'}
                    </td>
                    <td style={{ fontWeight: 800, color: isLossRow ? '#e11d48' : '#1e293b' }}>
                      Rp {formatNumber(a.nilaiSusutRp || 0)}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.keterangan || '-'}
                    </td>
                    <td style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>{a.auditor || 'Auditor'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: '#2563eb',
                            borderColor: '#2563eb',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          onClick={() => setSelectedDetailAudit(a)}
                          title="Lihat Detail Opname"
                        >
                          <Eye size={14} /> Detail
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm text-rose"
                          style={{ padding: '0.3rem 0.5rem', border: '1px solid #f43f5e', borderRadius: '6px' }}
                          onClick={() => promptDeleteAudit(a.id || a._id, a.bahanNama, a.tanggal)}
                          title="Hapus Catatan Ini"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== MODAL IMPORT EXCEL STOK FISIK ===== */}
      {isImportModalOpen && createPortal(
        <div className="modal-overlay" onClick={handleCloseImportModal}>
          <div className="modal-card" style={{ maxWidth: '850px', width: '100%' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileSpreadsheet size={22} style={{ color: '#10b981' }} /> Import File Excel Stok Fisik Opname
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                  Perhitungan Selisih Berdasarkan Tanggal Yang Dipilih
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseImportModal}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '0.4rem', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              {/* STEP 1: TARGET DATE SELECTOR IN MODAL */}
              <div style={{ background: '#eff6ff', border: '1.5px solid #3b82f6', padding: '1rem 1.25rem', borderRadius: '14px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={18} /> Pilih Tanggal Opname Yang Ingin Di-Cek:
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#2563eb' }}>
                    Stok sistem BOM akan otomatis dihitung sesuai posisi tanggal ini secara akurat.
                  </p>
                </div>

                <input
                  type="date"
                  style={{
                    background: '#ffffff',
                    border: '2px solid #2563eb',
                    borderRadius: '9px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
                  }}
                  value={targetTanggal}
                  onChange={(e) => setTargetTanggal(e.target.value)}
                />
              </div>

              {/* STEP 2: DOWNLOAD TEMPLATE & FILE UPLOAD AREA */}
              <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', padding: '1.15rem', borderRadius: '14px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#065f46' }}>
                      📄 Download Format Template Excel (.xlsx)
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#047857' }}>
                      Gunakan template resmi tanpa kolom stok sistem (tinggal isi kolom Stok Fisik).
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn"
                    onClick={handleDownloadExcelTemplate}
                    style={{
                      background: '#ffffff',
                      color: '#0284c7',
                      border: '1.5px solid #0284c7',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      padding: '0.45rem 0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={16} /> Download Template Excel
                  </button>
                </div>

                {/* File Drop / Select Zone */}
                <div style={{ border: '2px dashed #10b981', background: '#ffffff', padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={32} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>
                      {excelFile ? `File Terpilih: ${excelFile.name}` : 'Pilih File Excel Hasil Penimbangan Opname (.xlsx / .csv)'}
                    </span>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      style={{
                        background: '#10b981',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        padding: '0.45rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        marginTop: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      {excelFile ? 'Ganti File Excel' : 'Pilih File Excel'}
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 3: PREVIEW TABLE WITH DYNAMIC STOK SISTEM ON TARGET DATE */}
              {excelPreviewData.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                      🔍 Hasil Perhitungan Selisih Pertanggal <span style={{ color: '#2563eb' }}>{targetTanggal}</span> ({excelPreviewData.length} Item)
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 800 }}>
                      Stok BOM Sistem 100% Utuh
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', maxHeight: '38vh' }}>
                    <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>NO</th>
                          <th>KODE SKU</th>
                          <th>NAMA BAHAN BAKU</th>
                          <th>STOK SISTEM ({targetTanggal})</th>
                          <th>STOK FISIK (EXCEL)</th>
                          <th>SELISIH QTY</th>
                          <th>SUSUT (%)</th>
                          <th>KERUGIAN (RP)</th>
                          <th>ALASAN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelPreviewData.map((r, i) => (
                          <tr key={i} style={{ background: r.selisihQty < 0 ? '#fff1f2' : undefined }}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: 800, color: '#64748b' }}>{r.skuCode}</td>
                            <td style={{ fontWeight: 900, color: '#0f172a' }}>{r.bahanNama}</td>
                            <td style={{ fontWeight: 700, color: '#2563eb' }}>{r.stokSistem} {r.satuan}</td>
                            <td style={{ fontWeight: 900, color: '#059669' }}>{r.stokFisik} {r.satuan}</td>
                            <td style={{ fontWeight: 900, color: r.selisihQty < 0 ? '#e11d48' : '#059669' }}>
                              {r.selisihQty > 0 ? `+${r.selisihQty}` : r.selisihQty} {r.satuan}
                            </td>
                            <td style={{ fontWeight: 800, color: r.selisihQty < 0 ? '#be123c' : '#047857' }}>
                              {r.susutPct}%
                            </td>
                            <td style={{ fontWeight: 800, color: r.selisihQty < 0 ? '#e11d48' : '#1e293b' }}>
                              Rp {formatNumber(r.nilaiSusutRp)}
                            </td>
                            <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{r.keterangan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCloseImportModal}
                style={{ fontWeight: 700 }}
              >
                Batal
              </button>

              <button
                type="button"
                className="btn"
                onClick={handleSaveExcelBatch}
                disabled={isUploading || excelPreviewData.length === 0}
                style={{
                  background: (isUploading || excelPreviewData.length === 0) ? '#cbd5e1' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  padding: '0.65rem 1.4rem',
                  borderRadius: '9px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: (isUploading || excelPreviewData.length === 0) ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)',
                  cursor: (isUploading || excelPreviewData.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                <Save size={18} />
                <span>{isUploading ? 'Mengimport ke Database...' : `Simpan ${excelPreviewData.length} Data ke Database`}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== MODAL DETAIL OPNAME STOK FISIK ===== */}
      {selectedDetailAudit && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedDetailAudit(null)}>
          <div className="modal-card" style={{ maxWidth: '650px', width: '100%' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header" style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ClipboardCheck size={22} style={{ color: '#2563eb' }} /> Detail Stok Fisik - {selectedDetailAudit.bahanNama}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                  Tanggal Opname: {selectedDetailAudit.tanggal}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailAudit(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '0.4rem', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Stok Sistem BOM</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', margin: '0.25rem 0 0 0' }}>
                    {selectedDetailAudit.stokSistem} {selectedDetailAudit.satuan}
                  </h3>
                </div>

                <div style={{ background: '#f0fdf4', border: '1.5px solid #10b981', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>Stok Fisik Opname</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', margin: '0.25rem 0 0 0' }}>
                    {selectedDetailAudit.stokFisik} {selectedDetailAudit.satuan}
                  </h3>
                </div>

                <div style={{ background: selectedDetailAudit.selisihQty < 0 ? '#fff1f2' : '#eff6ff', border: selectedDetailAudit.selisihQty < 0 ? '1.5px solid #f43f5e' : '1.5px solid #3b82f6', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: selectedDetailAudit.selisihQty < 0 ? '#be123c' : '#1d4ed8', textTransform: 'uppercase' }}>Selisih / Susut</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: selectedDetailAudit.selisihQty < 0 ? '#e11d48' : '#2563eb', margin: '0.25rem 0 0 0' }}>
                    {selectedDetailAudit.selisihQty} {selectedDetailAudit.satuan}
                  </h3>
                </div>
              </div>

              {/* Details Breakdown */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.15rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #cbd5e1' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Persentase Susut / Selisih:</span>
                    <strong style={{ color: selectedDetailAudit.selisihQty < 0 ? '#be123c' : '#059669' }}>{selectedDetailAudit.susutPct || 0}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #cbd5e1' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Estimasi Nilai Kerugian (Rp):</span>
                    <strong style={{ color: '#e11d48' }}>Rp {formatNumber(selectedDetailAudit.nilaiSusutRp || 0)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #cbd5e1' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Auditor / Pengupload:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedDetailAudit.auditor || 'Auditor'}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Catatan Alasan:</span>
                    <p style={{ margin: 0, padding: '0.5rem 0.75rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.84rem', color: '#334155' }}>
                      {selectedDetailAudit.keterangan || 'Tidak ada catatan.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontWeight: 800, padding: '0.5rem 1.25rem', borderRadius: '8px' }}
                onClick={() => setSelectedDetailAudit(null)}
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* ===== MODAL KONFIRMASI HAPUS CATATAN STOK FISIK ===== */}
      {deleteTarget && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" style={{ maxWidth: '460px', width: '100%' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header" style={{ background: '#fff1f2', borderBottom: '1px solid #fecdd3', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#e11d48', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={20} /> Konfirmasi Hapus Opname
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{ background: '#ffe4e6', border: 'none', borderRadius: '50%', padding: '0.35rem', cursor: 'pointer', color: '#e11d48' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '1.35rem', fontSize: '0.92rem', color: '#334155' }}>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus catatan stok fisik bahan baku <strong>{deleteTarget.bahanNama}</strong> pada tanggal <strong>{deleteTarget.dateStr}</strong>?
              </p>
              <p style={{ margin: '0.65rem 0 0 0', fontSize: '0.8rem', color: '#e11d48', fontWeight: 700 }}>
                ⚠️ Catatan yang dihapus dari database tidak dapat dikembalikan.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid #fecdd3', background: '#fff1f2', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeleteTarget(null)}
                style={{ fontWeight: 700, borderRadius: '8px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn"
                disabled={isDeleting}
                onClick={executeDeleteAudit}
                style={{
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  borderRadius: '8px',
                  padding: '0.55rem 1.2rem',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={16} />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== MODAL KONFIRMASI HAPUS SEMUA DATA PER TANGGAL ===== */}
      {deleteAllDateTarget && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteAllDateTarget('')}>
          <div className="modal-card" style={{ maxWidth: '480px', width: '100%' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header" style={{ background: '#fff1f2', borderBottom: '1px solid #fecdd3', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#e11d48', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={20} /> Hapus Semua Data Opname
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteAllDateTarget('')}
                style={{ background: '#ffe4e6', border: 'none', borderRadius: '50%', padding: '0.35rem', cursor: 'pointer', color: '#e11d48' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '1.35rem', fontSize: '0.92rem', color: '#334155' }}>
              <p style={{ margin: 0, lineHeight: 1.55 }}>
                Apakah Anda yakin ingin menghapus <strong>SELURUH {displayedAuditList.length} CATATAN STOK FISIK</strong> pada tanggal <strong>{deleteAllDateTarget}</strong> dari database?
              </p>
              <div style={{ marginTop: '0.85rem', background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.75rem', borderRadius: '10px', fontSize: '0.82rem', color: '#be123c', fontWeight: 700 }}>
                ⚠️ Perhatian: Seluruh data penimbangan opname pertanggal {deleteAllDateTarget} akan dihapus secara permanen dari Database.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid #fecdd3', background: '#fff1f2', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeleteAllDateTarget('')}
                style={{ fontWeight: 700, borderRadius: '8px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn"
                disabled={isDeletingAll}
                onClick={executeDeleteAllByDate}
                style={{
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  borderRadius: '8px',
                  padding: '0.55rem 1.25rem',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={16} />
                <span>{isDeletingAll ? 'Menghapus Semua Data...' : 'Ya, Hapus Semua Data Tanggal Ini'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== MODAL KONFIRMASI HAPUS BATCH (DATA TERPILIH) ===== */}
      {showBatchDeleteModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowBatchDeleteModal(false)}>
          <div className="modal-card" style={{ maxWidth: '480px', width: '100%' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header" style={{ background: '#fff1f2', borderBottom: '1px solid #fecdd3', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#e11d48', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={20} /> Konfirmasi Hapus Data Terpilih
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                style={{ background: '#ffe4e6', border: 'none', borderRadius: '50%', padding: '0.35rem', cursor: 'pointer', color: '#e11d48' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '1.35rem', fontSize: '0.92rem', color: '#334155' }}>
              <p style={{ margin: 0, lineHeight: 1.55 }}>
                Apakah Anda yakin ingin menghapus <strong>{selectedItemIds.length} CATATAN STOK FISIK</strong> yang Anda centang dari database?
              </p>
              <div style={{ marginTop: '0.85rem', background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.75rem', borderRadius: '10px', fontSize: '0.82rem', color: '#be123c', fontWeight: 700 }}>
                ⚠️ Perhatian: Catatan yang dihapus dari MongoDB Database Atlas tidak dapat dikembalikan lagi.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid #fecdd3', background: '#fff1f2', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowBatchDeleteModal(false)}
                style={{ fontWeight: 700, borderRadius: '8px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn"
                disabled={isBatchDeleting}
                onClick={executeBatchDelete}
                style={{
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  borderRadius: '8px',
                  padding: '0.55rem 1.25rem',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={16} />
                <span>{isBatchDeleting ? 'Menghapus Data...' : `Ya, Hapus ${selectedItemIds.length} Data`}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
