import React, { useState, useMemo } from 'react';
import { Package, ShoppingBag, ShoppingCart, TrendingUp, DollarSign, Calendar, Eye, FileSpreadsheet, ArrowUpRight, ArrowDownRight, Layers, Award } from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';
import { ModernMonthPicker } from './ModernDatePicker';

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
const formatNum = (n) => (Number(n) || 0).toLocaleString('id-ID');

export default function DashboardProdukTab({
  produkSalesList = [],
  produkList = [],
  hasilProduksi = [],
  riwayatProduksi = [],
  penjualanList = [],
  marketingList = [],
  pelangganList = [],
  savedHppList = [],
  activeRoleView,
  onNavigate
}) {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [activeModal, setActiveModal] = useState(null); // 'stokAwal' | 'masukProduksi' | 'penjualan' | 'stokAkhir'

  // Extract available months from Penjualan & Hasil Produksi
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    monthsSet.add(currentMonthKey);
    (penjualanList || []).forEach(p => {
      const t = p.tanggal || p.createdAt;
      if (t) {
        try {
          const d = new Date(t);
          if (!isNaN(d.getTime())) monthsSet.add(d.toISOString().slice(0, 7));
        } catch {}
      }
    });
    (hasilProduksi || []).forEach(h => {
      const t = h.tanggal || h.createdAt;
      if (t) {
        try {
          const d = new Date(t);
          if (!isNaN(d.getTime())) monthsSet.add(d.toISOString().slice(0, 7));
        } catch {}
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [penjualanList, hasilProduksi, currentMonthKey]);

  const formatMonthName = (monthKey) => {
    if (!monthKey || monthKey === 'Semua') return 'Semua Bulan';
    try {
      const [year, month] = monthKey.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch {
      return monthKey;
    }
  };

  // Master product list combining Catalog Produk Sales & Master Produk
  const masterProdukList = useMemo(() => {
    const listMap = new Map();

    // Map from Produk Sales
    (produkSalesList || []).forEach(p => {
      const nameKey = (p.namaProduk || p.nama || '').trim().toLowerCase();
      if (!nameKey) return;
      const initialStok = (p.stokAwal !== undefined && p.stokAwal !== null && p.stokAwal !== '') ? Number(p.stokAwal) : 0;
      listMap.set(nameKey, {
        id: p.id || p._id,
        nama: p.namaProduk || p.nama,
        brand: p.brand || p.kategori || 'Saren One',
        sku: p.sku || '',
        stokAwal: isNaN(initialStok) ? 0 : initialStok,
        stokCurrent: Number(p.stok || 0),
        hargaTopMarket: Number(p.hargaTopMarket || p.hargaModal || 0),
        hargaUmum: Number(p.hargaUmum || p.hargaModal || 0)
      });
    });

    // Map fallback from master produk if missing
    (produkList || []).forEach(p => {
      const nameKey = (p.nama || p.namaProduk || '').trim().toLowerCase();
      if (!nameKey) return;
      if (!listMap.has(nameKey)) {
        const initialStok = (p.stokAwal !== undefined && p.stokAwal !== null && p.stokAwal !== '') ? Number(p.stokAwal) : 0;
        listMap.set(nameKey, {
          id: p.id || p._id,
          nama: p.nama || p.namaProduk,
          brand: p.kategori || 'Saren One',
          sku: p.sku || '',
          stokAwal: isNaN(initialStok) ? 0 : initialStok,
          stokCurrent: Number(p.stok || 0),
          hargaTopMarket: Number(p.hargaModal || 0),
          hargaUmum: Number(p.hargaModal || 0)
        });
      }
    });

    return Array.from(listMap.values());
  }, [produkSalesList, produkList]);

  // Main Stock Flow Calculations (Per Month & Product breakdown)
  const productFlowData = useMemo(() => {
    const productionSources = [...(hasilProduksi || []), ...(riwayatProduksi || [])];

    // Helper calculate HPP unit per item
    const getHppUnitForItem = (item, prodMatch) => {
      if (prodMatch) {
        const catalogPrice = Number(prodMatch.hargaModal || prodMatch.hargaUmum || prodMatch.hargaTopMarket || prodMatch.hargaPabrik || 0);
        if (catalogPrice > 0) return catalogPrice;
      }

      const targetDate = item.tanggal ? String(item.tanggal).substring(0, 10) : (item.timestamp ? String(item.timestamp).substring(0, 10) : '');
      const itemAlias = String(item.alias || item.kode || '').trim().toUpperCase();
      const itemName = String(item.produkNama || item.namaProduk || item.nama || '').trim().toLowerCase();

      const matchedLog = (savedHppList || []).find(log => {
        const logDate = String(log.tanggal || '').substring(0, 10);
        const dateMatch = !targetDate || !logDate || logDate === targetDate;
        if (!dateMatch) return false;
        const logProd = String(log.produkNama || '').trim().toLowerCase();
        return logProd && (itemName.includes(logProd) || logProd.includes(itemName));
      }) || (savedHppList || []).find(log => {
        const logProd = String(log.produkNama || '').trim().toLowerCase();
        return logProd && (itemName.includes(logProd) || logProd.includes(itemName));
      });

      if (matchedLog) {
        if (itemAlias.includes('250') || itemName.includes('250')) if (matchedLog.hpp250g) return Number(matchedLog.hpp250g);
        if (itemAlias.includes('300') || itemName.includes('300')) if (matchedLog.hpp250g) return Math.round(Number(matchedLog.hpp250g) * 1.2);
        if (itemAlias.includes('500') || itemName.includes('500')) if (matchedLog.hpp500g) return Number(matchedLog.hpp500g);
        if (itemAlias.includes('900') || itemName.includes('900')) if (matchedLog.hpp900g) return Number(matchedLog.hpp900g);
        if (itemAlias.includes('1000') || itemName.includes('1kg')) {
          const v = matchedLog.hpp1000g || matchedLog.hpp1kg;
          if (v) return Number(v);
        }
      }

      return Number(item.hppPerPack || item.harga || 0);
    };

    return masterProdukList.map(prod => {
      const nameLower = prod.nama.trim().toLowerCase();

      // 1. Masuk dari Hasil Produksi (Terima dari Role Bahan Baku)
      let qtyMasuk = 0;
      let valMasuk = 0;

      const processedMap = new Set();

      productionSources.forEach((hp, idx) => {
        const dateStr = String(hp.tanggal || hp.timestamp || hp.createdAt || '').substring(0, 10);
        if (!dateStr) return;

        const monthKey = dateStr.substring(0, 7);
        if (selectedMonth && selectedMonth !== 'Semua' && monthKey !== selectedMonth) return;

        const hpName = (hp.produkNama || hp.namaProduk || hp.nama || hp.alias || hp.kode || '').trim().toLowerCase();
        const prodSku = (prod.sku || '').trim().toLowerCase();

        const isMatch = (
          (hpName && nameLower && (hpName.includes(nameLower) || nameLower.includes(hpName))) ||
          (prodSku && hpName.includes(prodSku)) ||
          (prod.id && hp.produkId && String(prod.id) === String(hp.produkId))
        );

        if (isMatch) {
          const keyStr = `${dateStr}_${hpName}_${hp.jumlahPcs || hp.jumlahPack || hp.pcs || 0}`;
          if (processedMap.has(keyStr)) return;
          processedMap.add(keyStr);

          const qty = Number(hp.jumlahPcs || hp.jumlahPack || hp.jumlahBox || hp.jumlah || hp.pcs || 0);
          const price = getHppUnitForItem(hp, prod);
          qtyMasuk += qty;
          valMasuk += (qty * price);
        }
      });

      // 2. Terjual di Penjualan
      let qtyKeluar = 0;
      let valKeluar = 0;
      (penjualanList || []).forEach(pj => {
        const pjMonth = (pj.tanggal || pj.createdAt || '').slice(0, 7);
        if (selectedMonth && selectedMonth !== 'Semua' && pjMonth !== selectedMonth) return;

        (pj.items || []).forEach(it => {
          const itName = (it.namaProduk || it.produkNama || '').trim().toLowerCase();
          if (itName === nameLower || (prod.sku && it.sku === prod.sku)) {
            const qty = Number(it.qty || 0);
            const price = Number(it.hargaSatuan || 0);
            qtyKeluar += qty;
            valKeluar += (qty * price);
          }
        });
      });

      // 3. Stok Awal & Stok Akhir calculation
      const stokAwalPack = prod.stokAwal;
      const stokAkhirPack = Math.max(0, stokAwalPack + qtyMasuk - qtyKeluar);

      const unitVal = prod.hargaModal || prod.hargaUmum || prod.hargaTopMarket || 1;
      const valStokAwal = stokAwalPack * unitVal;
      const valStokAkhir = stokAkhirPack * unitVal;

      return {
        ...prod,
        stokAwalPack,
        valStokAwal,
        qtyMasuk,
        valMasuk,
        qtyKeluar,
        valKeluar,
        stokAkhirPack,
        valStokAkhir
      };
    });
  }, [masterProdukList, hasilProduksi, riwayatProduksi, penjualanList, savedHppList, selectedMonth]);

  // Aggregate Totals
  const totals = useMemo(() => {
    let stokAwalPcs = 0, valStokAwal = 0;
    let masukPcs = 0, valMasuk = 0;
    let keluarPcs = 0, valKeluar = 0;
    let stokAkhirPcs = 0, valStokAkhir = 0;

    // Direct 1-to-1 sync dengan PembelianProdukTab untuk total nominal Pembelian Produk
    const productionSources = [...(hasilProduksi || []), ...(riwayatProduksi || [])];
    const processedMap = new Set();

    productionSources.forEach((item, idx) => {
      const dateStr = String(item.tanggal || item.timestamp || item.createdAt || '').substring(0, 10);
      if (!dateStr) return;

      const monthKey = dateStr.substring(0, 7);
      if (selectedMonth && selectedMonth !== 'Semua' && monthKey !== selectedMonth) return;

      const pName = item.produkNama || item.namaProduk || item.nama || item.alias || 'Produk Saren One';
      const keyStr = `${dateStr}_${pName}_${item.jumlahPcs || item.jumlahPack || item.pcs || 0}`;
      if (processedMap.has(keyStr)) return;
      processedMap.add(keyStr);

      const qty = Number(item.jumlahPcs || item.jumlahPack || item.jumlahBox || item.jumlah || item.pcs || 0);

      // Pencarian HPP Unit persis seperti PembelianProdukTab
      const itemAlias = String(item.alias || item.kode || '').trim().toUpperCase();
      const itemName = String(pName).trim().toLowerCase();

      let hppUnit = 0;
      const catalogMatch = (masterProdukList || []).find(p => {
        const pSku = String(p.sku || '').trim().toUpperCase();
        const pNameStr = String(p.namaProduk || p.nama || '').trim().toLowerCase();
        const skuMatch = pSku && itemAlias && (pSku === itemAlias || itemAlias.includes(pSku) || pSku.includes(itemAlias));
        const nameMatch = pNameStr && itemName && (pNameStr === itemName || pNameStr.includes(itemName) || itemName.includes(pNameStr));
        return skuMatch || nameMatch;
      });

      if (catalogMatch) {
        hppUnit = Number(catalogMatch.hargaModal || catalogMatch.hargaUmum || catalogMatch.hargaTopMarket || catalogMatch.hargaPabrik || 0);
      }

      if (!hppUnit) {
        const matchedLog = (savedHppList || []).find(log => {
          const logProd = String(log.produkNama || '').trim().toLowerCase();
          return logProd && (itemName.includes(logProd) || logProd.includes(itemName));
        });

        if (matchedLog) {
          if (itemAlias.includes('250') || itemName.includes('250')) if (matchedLog.hpp250g) hppUnit = Number(matchedLog.hpp250g);
          else if (itemAlias.includes('500') || itemName.includes('500')) if (matchedLog.hpp500g) hppUnit = Number(matchedLog.hpp500g);
          else if (itemAlias.includes('900') || itemName.includes('900')) if (matchedLog.hpp900g) hppUnit = Number(matchedLog.hpp900g);
        }
      }

      if (!hppUnit) hppUnit = Number(item.hppPerPack || item.harga || 0);

      masukPcs += qty;
      valMasuk += (qty * hppUnit);
    });

    productFlowData.forEach(p => {
      stokAwalPcs += p.stokAwalPack;
      valStokAwal += p.valStokAwal;
      keluarPcs += p.qtyKeluar;
      valKeluar += p.valKeluar;
    });

    // RUMUS PERSAMAAN FINANSIAL & STOK: STOK AKHIR = STOK AWAL + PEMBELIAN - PENJUALAN
    stokAkhirPcs = Math.max(0, stokAwalPcs + masukPcs - keluarPcs);
    valStokAkhir = Math.max(0, valStokAwal + valMasuk - valKeluar);

    const omzetTotal = (penjualanList || []).reduce((sum, pj) => {
      const pjMonth = (pj.tanggal || pj.createdAt || '').slice(0, 7);
      if (selectedMonth && selectedMonth !== 'Semua' && pjMonth !== selectedMonth) return sum;
      return sum + (Number(pj.totalBersih) || 0);
    }, 0);

    const totalTransaksiCount = (penjualanList || []).filter(pj => {
      const pjMonth = (pj.tanggal || pj.createdAt || '').slice(0, 7);
      return (!selectedMonth || selectedMonth === 'Semua' || pjMonth === selectedMonth);
    }).length;

    return {
      stokAwalPcs, valStokAwal,
      masukPcs, valMasuk,
      keluarPcs, valKeluar,
      stokAkhirPcs, valStokAkhir,
      omzetTotal, totalTransaksiCount
    };
  }, [productFlowData, hasilProduksi, riwayatProduksi, masterProdukList, savedHppList, penjualanList, selectedMonth]);

  // Handle Export Excel
  const handleExportExcel = () => {
    const exportData = productFlowData.map((p, idx) => ({
      No: idx + 1,
      'Nama Produk': p.nama,
      'Brand / Kategori': p.brand,
      'SKU': p.sku || '-',
      'Stok Awal (Pack)': p.stokAwalPack,
      'Nilai Stok Awal (Rp)': p.valStokAwal,
      'Masuk Produksi (Pack)': p.qtyMasuk,
      'Nilai Masuk (Rp)': p.valMasuk,
      'Penjualan (Pack)': p.qtyKeluar,
      'Nilai Penjualan (Rp)': p.valKeluar,
      'Stok Akhir (Pack)': p.stokAkhirPack,
      'Nilai Stok Akhir (Rp)': p.valStokAkhir
    }));
    exportToExcel(exportData, `Dashboard_Flow_Stok_Produk_${selectedMonth}`);
  };

  return (
    <div className="tab-container">
      {/* ===== HEADER BANNER FINANCIAL PRODUK (IDENTIK DENGAN BAHAN BAKU BANNER) ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        borderRadius: '14px',
        padding: '1rem 1.35rem',
        marginBottom: '1rem',
        color: '#ffffff',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        boxShadow: '0 6px 20px rgba(2, 132, 199, 0.25)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 260px' }}>
          <h2 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '0.2px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            Hai, HS Team 👋 <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff', padding: '0.15rem 0.55rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(4px)' }}>DASHBOARD EXECUTIVE FINANCIAL PRODUK</span>
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#e2e8f0', margin: '0.25rem 0 0 0', fontWeight: 500, opacity: 0.95 }}>
            Ringkasan akumulasi nilai rupiah stok awal, masuk produksi, penjualan &amp; stok akhir real-time.
          </p>
        </div>
        <button
          className="btn btn-emerald"
          onClick={() => onNavigate && onNavigate('penjualan')}
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
          <ShoppingCart size={14} /> Mulai Penjualan
        </button>
      </div>

      {/* ===== EXECUTIVE FINANCIAL CHART PANEL (BAR CHART VERTIKAL FINANSIAL SAMA SEPERTI BAHAN BAKU) ===== */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '14px',
        padding: '1.15rem 1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.2px' }}>
              <TrendingUp size={18} style={{ color: '#0284c7' }} /> Grafik Ringkasan Keuangan Persediaan &amp; Penjualan Produk (Rupiah)
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0 0', fontWeight: 500 }}>
              Perbandingan komparatif nilai Rupiah Stok Awal, Pembelian Produk, Penjualan &amp; Stok Akhir.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ModernMonthPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              allowAll={true}
              variant="primary"
            />
          </div>
        </div>

        {/* 4 BAR FINANSIAL CHART VERTIKAL */}
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
            height: '320px',
            gap: '1rem',
            paddingBottom: '0.85rem',
            borderBottom: '2px dashed #cbd5e1',
            minWidth: '540px'
          }}>
            {[
              {
                type: 'stokAwal',
                title: 'Stok Awal',
                shortLabel: 'Stok Awal',
                subtitle: 'Harga Awal Bulan',
                val: totals.valStokAwal,
                color: '#0284c7',
                borderColor: '#bae6fd',
                lightBg: '#f0f9ff',
                gradient: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
                glow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              },
              {
                type: 'masukProduksi',
                title: 'Pembelian Produk (+)',
                shortLabel: 'Pembelian Produk',
                subtitle: 'Terima Dari Produksi',
                val: totals.valMasuk,
                color: '#059669',
                borderColor: '#a7f3d0',
                lightBg: '#ecfdf5',
                gradient: 'linear-gradient(180deg, #34d399 0%, #059669 100%)',
                glow: '0 4px 12px rgba(5, 150, 105, 0.3)'
              },
              {
                type: 'penjualan',
                title: 'Penjualan (-)',
                shortLabel: 'Penjualan',
                subtitle: 'Terjual Penjualan',
                val: totals.valKeluar,
                color: '#dc2626',
                borderColor: '#fca5a5',
                lightBg: '#fef2f2',
                gradient: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)',
                glow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              },
              {
                type: 'stokAkhir',
                title: 'Stok Akhir',
                shortLabel: 'Stok Akhir',
                subtitle: 'Harga Akhir Saat Ini',
                val: totals.valStokAkhir,
                color: '#0891b2',
                borderColor: '#a5f3fc',
                lightBg: '#ecfeff',
                gradient: 'linear-gradient(180deg, #22d3ee 0%, #0891b2 100%)',
                glow: '0 4px 12px rgba(8, 145, 178, 0.3)'
              }
            ].map((item, idx) => {
              const maxVal = Math.max(totals.valStokAwal, totals.valMasuk, totals.valKeluar, totals.valStokAkhir, 1);
              const heightPct = Math.max(18, Math.round((item.val / maxVal) * 100));

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', minWidth: '95px', position: 'relative' }}>
                  
                  {/* Floating Nominal Value Badge on Top */}
                  <div
                    onClick={() => setActiveModal(item.type)}
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
                    title={`Klik Rincian ${item.title}`}
                  >
                    {formatRp(item.val)}
                  </div>

                  {/* Gradient Filled Bar */}
                  <div
                    onClick={() => setActiveModal(item.type)}
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
                    title={`${item.title}: ${formatRp(item.val)}`}
                  />

                  {/* Label Bar Underneath */}
                  <div
                    onClick={() => setActiveModal(item.type)}
                    style={{ marginTop: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
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

        {/* HIGH-TECH FINANCIAL PILL SUMMARY LEGEND (PERSIS BAHAN BAKU) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
          {[
            { label: 'Stok Awal', val: totals.valStokAwal, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
            { label: 'Pembelian Produk', val: totals.valMasuk, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
            { label: 'Penjualan', val: totals.valKeluar, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
            { label: 'Stok Akhir', val: totals.valStokAkhir, color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: item.bg,
                border: `1px solid ${item.border}`,
                borderRadius: '8px',
                padding: '0.35rem 0.75rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ width: '9px', height: '9px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginRight: '0.15rem' }}>{item.label}:</span>
              <strong style={{ fontSize: '0.78rem', fontWeight: 900, color: item.color }}>
                {formatRp(item.val)}
              </strong>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
