import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, Calculator, Calendar, DollarSign, Package, FileText, ShoppingCart, Scale, ShieldAlert, Filter, Save, CheckCircle, Trash2, Eye, X } from 'lucide-react';
import { formatNumber, HARGA_AWAL_JULI } from '../data/initialData';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { ModernMonthPicker, ModernDatePicker } from './ModernDatePicker';
import { getHppListApi, saveHppApi, deleteHppApi } from '../services/api';

export default function HppKalkulatorTab({
  riwayatProduksi = [],
  utangList = [],
  bahanBaku = [],
  produk = [],
  activeRoleView,
  onOpenPdfPreview
}) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [filterTanggal, setFilterTanggal] = useState(todayStr);
  const [selectedProdukNama, setSelectedProdukNama] = useState('');
  const [manualHasilKgInput, setManualHasilKgInput] = useState('');
  const [manualHpp1Kg, setManualHpp1Kg] = useState('0');
  const [biayaKemasanPerPack, setBiayaKemasanPerPack] = useState(''); // Default empty input
  const [customGramInput, setCustomGramInput] = useState('350');
  const [marginErrorPct, setMarginErrorPct] = useState('8'); // Default 8% Margin Error / Wastage

  // Persistence State for Saved HPP Records (Directly from MongoDB Database)
  const [savedHppList, setSavedHppList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [selectedDetailHpp, setSelectedDetailHpp] = useState(null);
  const [showAllSavedDates, setShowAllSavedDates] = useState(true); // Default show all saved history!

  // Fetch Saved HPP Records DIRECTLY FROM BACKEND SERVER on mount
  useEffect(() => {
    async function loadSavedHpp() {
      try {
        const res = await getHppListApi();
        if (res && res.success && Array.isArray(res.data)) {
          setSavedHppList(res.data);
        }
      } catch (e) {
        console.error('Gagal mengambil data HPP dari Backend MongoDB:', e);
      }
    }
    loadSavedHpp();
  }, []);

  // Material Match Helper
  const isBahanMatch = (item, b) => {
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
  };

  // Get Unit Price for material on target date based on physical receipts or initial H. AWAL price
  const getBahanHargaOnDate = (bObj, targetDateStr) => {
    if (!bObj) return 0;
    
    // Find master material definition in bahanBaku list if bObj is partial
    const master = (bahanBaku || []).find(m => isBahanMatch(m, bObj)) || bObj;
    const bSku = String(master.sku || master.kode || bObj.sku || bObj.kode || '').trim().toUpperCase();

    // 1. Initial Price (H. AWAL)
    let initialPrice = 0;
    if (master.hargaAwal !== undefined && master.hargaAwal !== null && Number(master.hargaAwal) > 0) {
      initialPrice = Number(master.hargaAwal);
    } else if (HARGA_AWAL_JULI[bSku] !== undefined && Number(HARGA_AWAL_JULI[bSku]) > 0) {
      initialPrice = Number(HARGA_AWAL_JULI[bSku]);
    } else {
      initialPrice = Number(master.hargaBeli || master.harga || bObj.hargaSatuan || bObj.harga || 0);
    }

    // 2. Search utangList for physical receipt events ON OR BEFORE targetDateStr
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
  };

  // Available Product Names List ON THE SELECTED DATE ONLY
  const availableProdukList = useMemo(() => {
    const batchesOnDate = (riwayatProduksi || []).filter(r => {
      const timestamp = r.timestamp || r.tanggal || r.createdAt || '';
      const dateStr = timestamp.substring(0, 10);
      return filterTanggal ? (dateStr === filterTanggal || dateStr.startsWith(filterTanggal)) : true;
    });

    const productsOnDate = batchesOnDate.map(r => r.produkNama).filter(Boolean);
    const uniqueList = Array.from(new Set(productsOnDate)).sort();
    return uniqueList;
  }, [riwayatProduksi, filterTanggal]);

  // Check if there is already a saved HPP record for this date & product in database
  const savedRecordForCurrentSelection = useMemo(() => {
    if (!filterTanggal || !selectedProdukNama) return null;
    return (savedHppList || []).find(rec => rec.tanggal === filterTanggal && rec.produkNama === selectedProdukNama);
  }, [savedHppList, filterTanggal, selectedProdukNama]);

  // Auto fill yield & packaging cost inputs if saved records exist in DB for target date, otherwise reset
  useEffect(() => {
    if (savedRecordForCurrentSelection) {
      setManualHasilKgInput(savedRecordForCurrentSelection.hasilKg ? String(savedRecordForCurrentSelection.hasilKg) : '');
      setBiayaKemasanPerPack(savedRecordForCurrentSelection.biayaKemasan !== undefined && savedRecordForCurrentSelection.biayaKemasan !== null ? String(savedRecordForCurrentSelection.biayaKemasan) : '');
      setMarginErrorPct(savedRecordForCurrentSelection.marginPct !== undefined ? String(savedRecordForCurrentSelection.marginPct) : '8');
    } else {
      setManualHasilKgInput('');
      setBiayaKemasanPerPack('');
      setMarginErrorPct('8');
    }
  }, [savedRecordForCurrentSelection, filterTanggal, selectedProdukNama]);

  // Calculate HPP for Production Batches
  const productionHppList = useMemo(() => {
    return (riwayatProduksi || []).map(r => {
      const timestamp = r.timestamp || r.tanggal || r.createdAt || '';
      const dateStr = timestamp.substring(0, 10);

      let totalBiayaBahan = 0;
      const bahanDetails = [];
      const materials = (r.pemotonganBahan && Array.isArray(r.pemotonganBahan) && r.pemotonganBahan.length > 0)
        ? r.pemotonganBahan
        : (r.bahanDigunakan && Array.isArray(r.bahanDigunakan) ? r.bahanDigunakan : []);

      materials.forEach(b => {
        const bNama = b.bahanNama || b.nama || 'Bahan';
        const qty = Number(b.jumlah || 0);
        const hargaSatuan = getBahanHargaOnDate(b, dateStr);
        const subtotal = qty * hargaSatuan;
        totalBiayaBahan += subtotal;

        bahanDetails.push({
          nama: bNama,
          jumlah: qty,
          satuan: b.satuan || 'kg',
          hargaSatuan,
          subtotal
        });
      });

      return {
        id: r.id || r._id,
        timestamp,
        dateStr,
        produkNama: r.produkNama || 'Hasil Produksi Dapur',
        totalBiayaBahan: Math.round(totalBiayaBahan),
        bahanDetails,
        operator: r.operator || r.user || 'Tim Produksi'
      };
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [riwayatProduksi, utangList, bahanBaku]);

  // Filtered Production HPP by Target Date AND Selected Product Item
  const filteredProductionHpp = useMemo(() => {
    return productionHppList.filter(item => {
      const matchDate = filterTanggal ? (item.dateStr === filterTanggal || item.dateStr.startsWith(filterTanggal)) : true;
      const matchProduct = selectedProdukNama ? (item.produkNama.toLowerCase().includes(selectedProdukNama.toLowerCase())) : true;
      return matchDate && matchProduct;
    });
  }, [productionHppList, filterTanggal, selectedProdukNama]);

  const [selectedMonth, setSelectedMonth] = useState(todayStr.substring(0, 7)); // Default YYYY-MM (e.g. 2026-08)

  // Sync filterTanggal with selectedMonth if user picks a date outside current month
  useEffect(() => {
    if (filterTanggal && filterTanggal.substring(0, 7) !== selectedMonth) {
      setSelectedMonth(filterTanggal.substring(0, 7));
    }
  }, [filterTanggal]);

  // DISPLAYED SAVED HPP RECORDS FOR THE BOTTOM TABLE (FILTERED BY SELECTED MONTH!)
  const displayedSavedHppList = useMemo(() => {
    let list = savedHppList || [];
    if (selectedMonth) {
      list = list.filter(item => (item.tanggal || '').startsWith(selectedMonth));
    }
    if (selectedProdukNama) {
      list = list.filter(item => item.produkNama && item.produkNama.toLowerCase().includes(selectedProdukNama.toLowerCase()));
    }
    return [...list].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [savedHppList, selectedMonth, selectedProdukNama]);

  // Summary Metrics for Selected Date & Product
  const totalBiayaHppPeriode = filteredProductionHpp.reduce((acc, x) => acc + x.totalBiayaBahan, 0);

  // Effective Hasil Produksi (KG) - AUTO POPULATES SAVED TOTAL KG FOR DATE OR USER INPUT
  const effectiveHasilKg = useMemo(() => {
    if (manualHasilKgInput !== '' && !isNaN(Number(manualHasilKgInput)) && Number(manualHasilKgInput) > 0) {
      return Number(manualHasilKgInput);
    }
    if (filterTanggal) {
      const recs = (savedHppList || []).filter(r => r.tanggal === filterTanggal && (!selectedProdukNama || r.produkNama === selectedProdukNama));
      if (recs.length > 0) {
        const sumKg = recs.reduce((acc, r) => acc + Number(r.hasilKg || 0), 0);
        if (sumKg > 0) return sumKg;
      }
    }
    return 0;
  }, [manualHasilKgInput, filterTanggal, selectedProdukNama, savedHppList]);

  // Calculated Base HPP Per 1 KG (Netto) based on User Input KG
  const currentActiveHpp1Kg = useMemo(() => {
    if (totalBiayaHppPeriode > 0 && effectiveHasilKg > 0) {
      return Math.round(totalBiayaHppPeriode / effectiveHasilKg);
    }
    return Number(manualHpp1Kg) || 0;
  }, [totalBiayaHppPeriode, effectiveHasilKg, manualHpp1Kg]);

  // Margin Error & Packaging Parameters
  const packCost = Number(biayaKemasanPerPack) || 0;
  const marginPct = Math.max(0, Number(marginErrorPct) || 0);
  const customGrams = Math.max(1, Number(customGramInput) || 350);

  // Margin Error Nominal Addition for 1 KG (Nominal Waste Rp)
  const marginErrorNominal1Kg = Math.round(currentActiveHpp1Kg * (marginPct / 100));
  const hpp1KgWithWaste = currentActiveHpp1Kg + marginErrorNominal1Kg;
  const hpp1KgWithWasteAndPack = currentActiveHpp1Kg > 0 ? (hpp1KgWithWaste + packCost) : 0;

  // Breakdown Calculations for Packaging Sizes: Netto + Margin Error Nominal + Packaging Cost
  const hpp250gNetto = currentActiveHpp1Kg > 0 ? Math.round(currentActiveHpp1Kg * 0.25) : 0;
  const hpp250gWasteNominal = Math.round(hpp250gNetto * (marginPct / 100));
  const hpp250gWaste = hpp250gNetto > 0 ? (hpp250gNetto + hpp250gWasteNominal + packCost) : 0;

  const hpp500gNetto = currentActiveHpp1Kg > 0 ? Math.round(currentActiveHpp1Kg * 0.50) : 0;
  const hpp500gWasteNominal = Math.round(hpp500gNetto * (marginPct / 100));
  const hpp500gWaste = hpp500gNetto > 0 ? (hpp500gNetto + hpp500gWasteNominal + packCost) : 0;

  const hpp900gNetto = currentActiveHpp1Kg > 0 ? Math.round(currentActiveHpp1Kg * 0.90) : 0;
  const hpp900gWasteNominal = Math.round(hpp900gNetto * (marginPct / 100));
  const hpp900gWaste = hpp900gNetto > 0 ? (hpp900gNetto + hpp900gWasteNominal + packCost) : 0;

  const hpp1000gNetto = currentActiveHpp1Kg > 0 ? Math.round(currentActiveHpp1Kg * 1.00) : 0;
  const hpp1000gWasteNominal = Math.round(hpp1000gNetto * (marginPct / 100));
  const hpp1000gWaste = hpp1000gNetto > 0 ? (hpp1000gNetto + hpp1000gWasteNominal + packCost) : 0;

  const hppCustomNetto = currentActiveHpp1Kg > 0 ? Math.round(currentActiveHpp1Kg * (customGrams / 1000)) : 0;
  const hppCustomWasteNominal = Math.round(hppCustomNetto * (marginPct / 100));
  const hppCustomWaste = hppCustomNetto > 0 ? (hppCustomNetto + hppCustomWasteNominal + packCost) : 0;

  // PUSH HPP RECORD DIRECTLY TO BACKEND & MONGODB ATLAS DATABASE
  const handleSaveHpp = async () => {
    if (!filterTanggal) {
      alert('⚠️ Pilih tanggal terlebih dahulu!');
      return;
    }
    if (!selectedProdukNama) {
      alert('⚠️ Silakan pilih Item Produk Olahan Dapur (misal: RCS/SCM) terlebih dahulu sebelum menyimpan!');
      return;
    }
    if (effectiveHasilKg <= 0) {
      alert('⚠️ Masukkan Jumlah Hasil Produksi (KG) terlebih dahulu sebelum menyimpan!');
      return;
    }

    const targetProd = selectedProdukNama;
    setIsSaving(true);

    const payload = {
      tanggal: filterTanggal,
      produkNama: targetProd,
      totalBiayaBahan: totalBiayaHppPeriode,
      hasilKg: effectiveHasilKg,
      hppPerKgNetto: currentActiveHpp1Kg,
      hppPerKgWaste: hpp1KgWithWasteAndPack,
      marginPct,
      biayaKemasan: packCost,
      hpp250g: hpp250gWaste,
      hpp500g: hpp500gWaste,
      hpp900g: hpp900gWaste,
      hpp1000g: hpp1000gWaste
    };

    try {
      const res = await saveHppApi(payload);
      if (res && res.success) {
        // Direct Database update in state
        const updatedList = [res.data, ...savedHppList.filter(x => !(x.tanggal === filterTanggal && x.produkNama === targetProd))];
        setSavedHppList(updatedList);
        setSaveSuccessMsg(`✅ Data HPP ${targetProd} (${filterTanggal}) Berhasil Disimpan Permanen Ke Database!`);
        setTimeout(() => setSaveSuccessMsg(''), 4500);
      } else {
        alert(`❌ Gagal menyimpan ke Database Server: ${res?.message || 'Server error'}`);
      }
    } catch (err) {
      alert(`❌ Gagal terhubung ke Backend Database Server: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // DELETE SAVED HPP RECORD DIRECTLY FROM BACKEND & MONGODB DATABASE
  const handleDeleteHpp = async (recordId, targetProd, targetDate) => {
    if (!window.confirm(`Hapus data HPP tersimpan ${targetProd} untuk tanggal ${targetDate}?`)) return;

    try {
      const res = await deleteHppApi(recordId);
      if (res && res.success) {
        const updatedList = savedHppList.filter(x => x.id !== recordId && x._id !== recordId);
        setSavedHppList(updatedList);
        setSaveSuccessMsg(`🗑️ Data HPP ${targetProd} (${targetDate}) Berhasil Dihapus dari Database.`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        alert(`❌ Gagal menghapus dari Database Server: ${res?.message || 'Server Error'}`);
      }
    } catch (e) {
      alert(`❌ Gagal terhubung ke Backend Server: ${e.message}`);
    }
  };

  // Export PDF Laporan
  const handleExportPDF = () => {
    const headers = ['Tanggal', 'Hasil Produksi', 'Jumlah Olahan (KG)', 'Total Biaya Bahan Mentah', 'HPP Per 1 KG (Netto)', 'HPP 1 KG (+ Waste 8% + Kemasan)'];
    const rows = displayedSavedHppList.map(l => [
      l.tanggal,
      l.produkNama,
      `${l.hasilKg} KG`,
      `Rp ${formatNumber(l.totalBiayaBahan)}`,
      `Rp ${formatNumber(l.hppPerKgNetto)} / kg`,
      `Rp ${formatNumber(l.hppPerKgWaste)} / kg`
    ]);
    const config = {
      title: 'Laporan Perhitungan HPP Produksi Tersimpan',
      subtitle: `Laporan HPP tersimpan ${selectedProdukNama ? `Item: ${selectedProdukNama}` : 'Semua Produk'} tanggal ${filterTanggal || 'Semua'}.`,
      headers,
      rows,
      summaryText: `Total Record Tersimpan: ${displayedSavedHppList.length} Item`,
      filename: `Laporan_HPP_Tersimpan_${selectedProdukNama || 'Semua'}_${filterTanggal || 'Saat_Ini'}`
    };
    if (onOpenPdfPreview) {
      onOpenPdfPreview(config);
    } else {
      exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
    }
  };

  const handleExportExcel = () => {
    const headers = ['Tanggal', 'Produk Olahan', 'Hasil Produksi (KG)', 'Total Biaya Bahan Mentah', 'Biaya Kemasan', 'HPP Netto 1 KG', 'HPP 1 KG (+ Waste 8% + Kemasan)', 'HPP Kemasan 250G', 'HPP Kemasan 500G', 'HPP Kemasan 900G'];
    const rows = displayedSavedHppList.map(l => [
      l.tanggal,
      l.produkNama,
      l.hasilKg,
      l.totalBiayaBahan,
      l.biayaKemasan || packCost,
      l.hppPerKgNetto,
      l.hppPerKgWaste,
      l.hpp250g,
      l.hpp500g,
      l.hpp900g
    ]);
    exportToExcel(`HPP_Tersimpan_${selectedProdukNama || 'Semua'}_${filterTanggal || 'Semua'}`, headers, rows);
  };

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      {/* SUCCESS NOTIFICATION TOAST BANNER */}
      {saveSuccessMsg && (
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
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ===== HEADER & FILTER BAR WITH SIMPAN DATA HPP BUTTON ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.55rem', margin: 0 }}>
            <TrendingUp size={24} style={{ color: '#f59e0b' }} /> HPP Produksi Harian &amp; Kalkulator Konversi Kemasan
          </h2>
          <p style={{ fontSize: '0.83rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>
            Hitung HPP = Total Biaya Bahan Mentah / KG Hasil Olahan + Margin Error {marginPct}% + Biaya Kemasan &amp; Stiker.
          </p>
        </div> */}

        {/* Date, Product Filter & SIMPAN DATA HPP BUTTON (MATCHING PEMBELIAN TAB STYLING!) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Modern Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ModernDatePicker
              value={filterTanggal}
              onChange={(val) => {
                setFilterTanggal(val);
                setManualHasilKgInput('');
              }}
            />
          </div>

          {/* Select Product Item Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Filter size={14} style={{ color: 'var(--cyan)' }} />
            </span>
            <select
              className="select-input"
              style={{
                background: selectedProdukNama ? '#f0f9ff' : '#ffffff',
                border: selectedProdukNama ? '1px solid #7dd3fc' : '1px solid #cbd5e1',
                color: '#0f172a',
                borderRadius: '6px',
                padding: '0 0.6rem',
                height: '32px',
                fontSize: '0.78rem',
                fontWeight: 700,
                outline: 'none',
                maxWidth: '220px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
              value={selectedProdukNama}
              onChange={(e) => {
                setSelectedProdukNama(e.target.value);
                setManualHasilKgInput('');
              }}
            >
              <option value="">
                {availableProdukList.length > 0 ? `-- Pilih Item Produk (${availableProdukList.length} Item) --` : '-- Tidak Ada Produksi --'}
              </option>
              {availableProdukList.map((pName, idx) => (
                <option key={idx} value={pName}>
                  {pName}
                </option>
              ))}
            </select>
          </div>

          {/* SIMPAN DATA HPP BUTTON (MATCHING PEMBELIAN TAB BUTTONS!) */}
          <button
            type="button"
            className="btn"
            onClick={handleSaveHpp}
            disabled={isSaving || !filterTanggal || !selectedProdukNama || effectiveHasilKg <= 0}
            style={{
              marginLeft: 'auto',
              background: (effectiveHasilKg <= 0 || !selectedProdukNama)
                ? '#f1f5f9'
                : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: (effectiveHasilKg <= 0 || !selectedProdukNama) ? '#94a3b8' : '#ffffff',
              padding: '0 0.85rem',
              height: '32px',
              fontWeight: 800,
              fontSize: '0.78rem',
              borderRadius: '6px',
              border: (effectiveHasilKg <= 0 || !selectedProdukNama) ? '1px solid #cbd5e1' : 'none',
              cursor: (effectiveHasilKg <= 0 || !selectedProdukNama) ? 'not-allowed' : 'pointer',
              boxShadow: (effectiveHasilKg <= 0 || !selectedProdukNama) ? 'none' : '0 3px 10px rgba(16, 185, 129, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Save size={13} />
            <span>
              {isSaving
                ? 'Menyimpan...'
                : (!selectedProdukNama
                    ? '⚠️ Pilih Item Produk Dulu'
                    : (effectiveHasilKg <= 0
                        ? '⚠️ Ketik Hasil KG Dulu'
                        : 'Simpan Data HPP'))}
            </span>
          </button>
        </div>
      </div>

      {/* ===== SUMMARY METRICS CARDS (5 TOP CARDS RESPONSIVE GRID INC. BIAYA KEMASAN INPUT & TOTAL BIAYA + KEMASAN!) ===== */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', minWidth: '680px' }}>
          {/* Card 1: Biaya Bahan Mentah */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #f59e0b', borderRadius: '10px', padding: '0.75rem 0.85rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarSign size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Biaya Bahan Baku ({selectedProdukNama || 'Total All Item'})
                </span>
                <h3 style={{ color: '#d97706', fontSize: '1.1rem', fontWeight: 900, margin: '0.15rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Rp {formatNumber(totalBiayaHppPeriode)}
                </h3>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#b45309', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedProdukNama ? selectedProdukNama : 'Semua Item'} : {filterTanggal || 'Semua'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Input Hasil Produksi (KG) */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #10b981', borderRadius: '10px', padding: '0.75rem 0.85rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: '#d1fae5', color: '#059669', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Scale size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Hasil Produksi ({selectedProdukNama || 'Total All Item'}) / KG
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    style={{
                      width: '85px',
                      background: '#f0fdf4',
                      border: '1.5px solid #10b981',
                      color: '#065f46',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                    value={manualHasilKgInput || (effectiveHasilKg > 0 ? effectiveHasilKg : '')}
                    onChange={(e) => setManualHasilKgInput(e.target.value)}
                    placeholder="0"
                  />
                  <span style={{ fontWeight: 900, color: '#059669', fontSize: '0.9rem' }}>KG</span>
                </div>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#047857', marginTop: '0.15rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {effectiveHasilKg > 0 ? `✓ Yield: ${effectiveHasilKg} KG` : `⚠️ Wajib di isi`}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Input Biaya Kemasan & Stiker (Rp/pcs) */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #6366f1', borderRadius: '10px', padding: '0.75rem 0.85rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Biaya Kemasan &amp; Stiker
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                  <span style={{ fontWeight: 900, color: '#4f46e5', fontSize: '0.9rem' }}>Rp</span>
                  <input
                    type="number"
                    style={{
                      width: '75px',
                      background: '#eef2ff',
                      border: '1.5px solid #6366f1',
                      color: '#3730a3',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                    value={biayaKemasanPerPack}
                    onChange={(e) => setBiayaKemasanPerPack(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#4338ca', marginTop: '0.15rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {biayaKemasanPerPack ? `✓ Kemasan Rp ${biayaKemasanPerPack}/pcs` : 'Plastik & Stiker/Pcs'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4 (NEW): Total Biaya Bahan + Total Kemasan */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #8b5cf6', borderRadius: '10px', padding: '0.75rem 0.85rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: '#f3e8ff', color: '#8b5cf6', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShoppingCart size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Total Biaya + Kemasan
                </span>
                <h3 style={{ color: '#7c3aed', fontSize: '1.1rem', fontWeight: 900, margin: '0.15rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Rp {formatNumber(Math.round(totalBiayaHppPeriode + (packCost * (parseFloat(manualHasilKgInput) || 0))))}
                </h3>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6d28d9', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {packCost > 0 && parseFloat(manualHasilKgInput) > 0
                    ? `Bahan + Plastik (Rp ${formatNumber(Math.round(packCost * (parseFloat(manualHasilKgInput) || 0)))})`
                    : 'Bahan Baku + Total Plastik'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: HPP 1 KG (+ Waste 8% + Kemasan) */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #0284c7', borderRadius: '10px', padding: '0.75rem 0.85rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  HPP 1kg + Mrg {packCost > 0 ? '+ Kemasan' : ''}
                </span>
                <h3 style={{ color: '#0284c7', fontSize: '1.1rem', fontWeight: 900, margin: '0.15rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentActiveHpp1Kg > 0 ? `Rp ${formatNumber(hpp1KgWithWasteAndPack)} / kg` : 'Rp 0 / kg'}
                </h3>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#0369a1', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentActiveHpp1Kg > 0
                    ? `Rp ${formatNumber(currentActiveHpp1Kg)} + Rp ${formatNumber(marginErrorNominal1Kg)}${packCost > 0 ? ` + Rp ${formatNumber(packCost)}` : ''}`
                    : 'Isi Hasil Produksi'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== LANGSUNG GRAMASI KUSTOM & KARTU PACKAGING KONVERSI (COMPACT ELEGANT SIZE) ===== */}
      <div style={{ marginBottom: '1.75rem' }}>
        {/* INPUT GRAMASI KUSTOM BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '1rem', background: '#f8fafc', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0369a1' }}>Gramasi Kustom:</span>
            <input
              type="number"
              style={{ width: '90px', padding: '0.3rem 0.5rem', fontSize: '0.88rem', fontWeight: 900, color: '#0369a1', background: '#ffffff', border: '1.5px solid #0284c7', borderRadius: '6px', outline: 'none' }}
              value={customGramInput}
              onChange={(e) => setCustomGramInput(e.target.value)}
              placeholder="350"
            />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7' }}>gram</span>
          </div>
        </div>

        {/* 5 PACKAGING CONVERSION CARDS (COMPACT & NEAT) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {/* Kemasan 250 Gram */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '4px solid #6366f1', borderRadius: '10px', padding: '0.75rem 0.85rem', textAlign: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#3730a3', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Kemasan 250 Gram</span>
            <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontWeight: 600 }}>
              <div>HPP : <strong>Rp {formatNumber(hpp250gNetto)}</strong></div>
              <div style={{ color: '#dc2626', fontWeight: 800 }}>+ Mrg error {marginPct}% : <strong> Rp {formatNumber(hpp250gWasteNominal)}</strong></div>
              <div>+ Plastik &amp; Stiker : <strong> Rp {formatNumber(packCost)}</strong></div>
            </div>
            <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '0.5rem', paddingTop: '0.4rem' }}>
              <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#4338ca', fontWeight: 800 }}>HPP FINAL 250G:</span>
              <h4 style={{ color: '#4f46e5', fontSize: '1.15rem', fontWeight: 900, margin: '0.15rem 0 0 0' }}>
                {hpp250gWaste > 0 ? `Rp ${formatNumber(hpp250gWaste)}` : 'Rp 0'}
              </h4>
            </div>
          </div>

          {/* Kemasan 500 Gram */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '4px solid #2563eb', borderRadius: '10px', padding: '0.75rem 0.85rem', textAlign: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Kemasan 500 Gram</span>
            <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontWeight: 600 }}>
              <div>HPP : <strong>Rp {formatNumber(hpp500gNetto)}</strong></div>
              <div style={{ color: '#dc2626', fontWeight: 800 }}>+ Mrg error {marginPct}% : <strong> Rp {formatNumber(hpp500gWasteNominal)}</strong></div>
              <div>+ Plastik &amp; Stiker : <strong>Rp {formatNumber(packCost)}</strong></div>
            </div>
            <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '0.5rem', paddingTop: '0.4rem' }}>
              <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#1d4ed8', fontWeight: 800 }}>HPP FINAL 500G:</span>
              <h4 style={{ color: '#2563eb', fontSize: '1.15rem', fontWeight: 900, margin: '0.15rem 0 0 0' }}>
                {hpp500gWaste > 0 ? `Rp ${formatNumber(hpp500gWaste)}` : 'Rp 0'}
              </h4>
            </div>
          </div>

          {/* Kemasan 900 Gram */}
          <div style={{ background: '#ffffff', border: '1px solid #fcd34d', borderTop: '4px solid #f59e0b', borderRadius: '10px', padding: '0.75rem 0.85rem', textAlign: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Kemasan 900 Gram</span>
            <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontWeight: 600 }}>
              <div>HPP : <strong>Rp {formatNumber(hpp900gNetto)}</strong></div>
              <div style={{ color: '#dc2626', fontWeight: 800 }}>+ Mrg error {marginPct}% : <strong> Rp {formatNumber(hpp900gWasteNominal)}</strong></div>
              <div>+ Plastik &amp; Stiker : <strong>Rp {formatNumber(packCost)}</strong></div>
            </div>
            <div style={{ borderTop: '1px dashed #fcd34d', marginTop: '0.5rem', paddingTop: '0.4rem' }}>
              <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#b45309', fontWeight: 800 }}>HPP FINAL 900G:</span>
              <h4 style={{ color: '#d97706', fontSize: '1.15rem', fontWeight: 900, margin: '0.15rem 0 0 0' }}>
                {hpp900gWaste > 0 ? `Rp ${formatNumber(hpp900gWaste)}` : 'Rp 0'}
              </h4>
            </div>
          </div>

          {/* Kemasan 1000 Gram (1 KG) */}
          <div style={{ background: '#ffffff', border: '1px solid #6ee7b7', borderTop: '4px solid #10b981', borderRadius: '10px', padding: '0.75rem 0.85rem', textAlign: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Kemasan 1kg</span>
            <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontWeight: 600 }}>
              <div>HPP : <strong>Rp {formatNumber(hpp1000gNetto)}</strong></div>
              <div style={{ color: '#dc2626', fontWeight: 800 }}>+ Mrg error {marginPct}% : <strong> Rp {formatNumber(hpp1000gWasteNominal)}</strong></div>
              <div>+ Plastik &amp; Stiker : <strong>Rp {formatNumber(packCost)}</strong></div>
            </div>
            <div style={{ borderTop: '1px dashed #6ee7b7', marginTop: '0.5rem', paddingTop: '0.4rem' }}>
              <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#047857', fontWeight: 800 }}>HPP FINAL 1 KG:</span>
              <h4 style={{ color: '#059669', fontSize: '1.15rem', fontWeight: 900, margin: '0.15rem 0 0 0' }}>
                {hpp1000gWaste > 0 ? `Rp ${formatNumber(hpp1000gWaste)}` : 'Rp 0'}
              </h4>
            </div>
          </div>

          {/* Gramasi Kustom */}
          <div style={{ background: '#ffffff', border: '1px solid #7dd3fc', borderTop: '4px solid #0284c7', borderRadius: '10px', padding: '0.75rem 0.85rem', textAlign: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#075985', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Gramasi Kustom ({customGrams}g)</span>
            <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontWeight: 600 }}>
              <div>HPP : <strong>Rp {formatNumber(hppCustomNetto)}</strong></div>
              <div style={{ color: '#dc2626', fontWeight: 800 }}>+ Mrg error {marginPct}% : <strong> Rp {formatNumber(hppCustomWasteNominal)}</strong></div>
              <div>+ Plastik &amp; Stiker : <strong>Rp {formatNumber(packCost)}</strong></div>
            </div>
            <div style={{ borderTop: '1px dashed #7dd3fc', marginTop: '0.5rem', paddingTop: '0.4rem' }}>
              <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#0369a1', fontWeight: 800 }}>HPP FINAL ({customGrams}g):</span>
              <h4 style={{ color: '#0284c7', fontSize: '1.15rem', fontWeight: 900, margin: '0.15rem 0 0 0' }}>
                {hppCustomWaste > 0 ? `Rp ${formatNumber(hppCustomWaste)}` : 'Rp 0'}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABEL RINCIAN DATA HPP TERSIMPAN ===== */}
      <div className="table-container mt-4" style={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', background: '#ffffff' }}>
        <div style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '14px', borderTopRightRadius: '14px', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Package size={17} style={{ color: '#10b981' }} /> Laporan Data HPP Produk Tersimpan
            </h3>

            {/* PERIODE BULAN MODERN MONTH PICKER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ModernMonthPicker
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(val)}
                allowAll={true}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {displayedSavedHppList.length > 0 && (
              <>
                <button className="btn btn-sm btn-outline" onClick={handleExportPDF} title="Cetak Laporan PDF HPP" style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.55rem', fontWeight: 800 }}>
                  <FileText size={13} style={{ color: '#f59e0b' }} /> Cetak PDF
                </button>
                <button className="btn btn-sm btn-outline" onClick={handleExportExcel} style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.55rem', fontWeight: 800 }}>
                  Export Excel
                </button>
              </>
            )}
          </div>
        </div>

        <table className="custom-table" style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>TANGGAL &amp; WAKTU</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>NAMA PRODUK OLAHAN</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>HPP KEMASAN 250G</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>HPP KEMASAN 500G</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>HPP KEMASAN 900G</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>HPP 1 KG</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'center', whiteSpace: 'nowrap' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {displayedSavedHppList.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b45309', marginBottom: '0.25rem' }}>
                    Belum ada data HPP yang disimpan untuk tanggal {filterTanggal || 'ini'}.
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Silakan ketik <strong>Hasil Produksi (KG)</strong> di atas dan klik tombol <strong>"Simpan Data HPP"</strong> untuk menyimpan laporan HPP secara permanen.
                  </div>
                </td>
              </tr>
            ) : (
              displayedSavedHppList.map((l, idx) => {
                return (
                  <tr key={l.id || l._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>{l.tanggal}</td>
                    <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>{l.produkNama}</td>
                    <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Rp {formatNumber(l.hpp250g)}</td>
                    <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Rp {formatNumber(l.hpp500g)}</td>
                    <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Rp {formatNumber(l.hpp900g)}</td>
                    <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.74rem', fontWeight: 900, color: '#0284c7', whiteSpace: 'nowrap' }}>Rp {formatNumber(l.hppPerKgWaste || l.hppPerKgNetto)}</td>

                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          style={{
                            background: '#f0f9ff',
                            color: '#0284c7',
                            border: '1px solid #bae6fd',
                            borderRadius: '5px',
                            width: '24px',
                            height: '24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => setSelectedDetailHpp(l)}
                          title="Lihat Detail HPP Produksi"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          type="button"
                          style={{
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            borderRadius: '5px',
                            width: '24px',
                            height: '24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => handleDeleteHpp(l.id || l._id, l.produkNama, l.tanggal)}
                          title="Hapus Data HPP Tersimpan Ini"
                        >
                          <Trash2 size={12} />
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

      {/* ===== MODAL DETAIL HPP TERSIMPAN ===== */}
      {selectedDetailHpp && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          zIndex: 99999,
          padding: '1.25rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
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
                  <TrendingUp size={22} style={{ color: '#0284c7' }} /> Rincian Detail HPP - {selectedDetailHpp.produkNama}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                  Tanggal Produksi: {selectedDetailHpp.tanggal}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailHpp(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '0.4rem', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* Highlight Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f0fdf4', border: '1.5px solid #10b981', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>Hasil Produksi (KG)</span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669', margin: '0.25rem 0 0 0' }}>
                    {selectedDetailHpp.hasilKg} KG
                  </h3>
                </div>

                <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>Total Biaya Bahan Mentah</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#d97706', margin: '0.25rem 0 0 0' }}>
                    Rp {formatNumber(selectedDetailHpp.totalBiayaBahan)}
                  </h3>
                </div>

                <div style={{ background: '#eef2ff', border: '1.5px solid #6366f1', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3730a3', textTransform: 'uppercase' }}>Biaya Kemasan (PCS)</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#4f46e5', margin: '0.25rem 0 0 0' }}>
                    Rp {formatNumber(selectedDetailHpp.biayaKemasan || 0)}
                  </h3>
                </div>
              </div>

              {/* Detail Table Breakdown */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.15rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.85rem' }}>
                  Rincian Perhitungan Per 1 KG &amp; Kemasan:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #cbd5e1' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>HPP Netto Per 1 KG:</span>
                    <strong style={{ color: '#0f172a' }}>Rp {formatNumber(selectedDetailHpp.hppPerKgNetto)} / kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #cbd5e1' }}>
                    <span style={{ color: '#0369a1', fontWeight: 800 }}>HPP 1 KG (+ Waste {selectedDetailHpp.marginPct || 8}% + Kemasan):</span>
                    <strong style={{ color: '#0284c7' }}>Rp {formatNumber(selectedDetailHpp.hppPerKgWaste)} / kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #cbd5e1' }}>
                    <span style={{ color: '#4f46e5', fontWeight: 700 }}>HPP Kemasan 250 Gram:</span>
                    <strong style={{ color: '#4f46e5' }}>Rp {formatNumber(selectedDetailHpp.hpp250g)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #cbd5e1' }}>
                    <span style={{ color: '#2563eb', fontWeight: 700 }}>HPP Kemasan 500 Gram:</span>
                    <strong style={{ color: '#2563eb' }}>Rp {formatNumber(selectedDetailHpp.hpp500g)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #cbd5e1' }}>
                    <span style={{ color: '#d97706', fontWeight: 700 }}>HPP Kemasan 900 Gram:</span>
                    <strong style={{ color: '#d97706' }}>Rp {formatNumber(selectedDetailHpp.hpp900g)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#059669', fontWeight: 700 }}>HPP Kemasan 1000 Gram (1 KG):</span>
                    <strong style={{ color: '#059669' }}>Rp {formatNumber(selectedDetailHpp.hpp1000g || selectedDetailHpp.hppPerKgWaste)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontWeight: 800, padding: '0.5rem 1.25rem', borderRadius: '8px' }}
                onClick={() => setSelectedDetailHpp(null)}
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
