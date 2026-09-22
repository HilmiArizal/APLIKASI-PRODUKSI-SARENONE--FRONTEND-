import React, { useState, useMemo } from 'react';
import { Search, FileSpreadsheet, FileText, Calendar, ShoppingCart, PackageCheck, Layers, ArrowUpRight, TrendingUp } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { ModernMonthPicker } from './ModernDatePicker';

export default function PembelianProdukTab({
  hasilProduksi = [],
  riwayatProduksi = [],
  produkList = [],
  savedHppList = [],
  onOpenPdfPreview
}) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthStr = todayStr.substring(0, 7);

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const calculateHppUnit = (item) => {
    if (!item) return 0;
    const targetDate = item.tanggal ? String(item.tanggal).substring(0, 10) : (item.timestamp ? String(item.timestamp).substring(0, 10) : '');
    const itemAlias = String(item.alias || item.kode || '').trim().toUpperCase();
    const itemName = String(item.produkNama || item.namaProduk || item.nama || '').trim().toLowerCase();

    // 1. Prioritaskan harga modal resmi dari Katalog Produk (produkList)
    const catalogMatch = (produkList || []).find(p => {
      const pSku = String(p.sku || '').trim().toUpperCase();
      const pName = String(p.namaProduk || p.nama || '').trim().toLowerCase();
      
      const skuMatch = pSku && itemAlias && (pSku === itemAlias || itemAlias.includes(pSku) || pSku.includes(itemAlias));
      const nameMatch = pName && itemName && (pName === itemName || pName.includes(itemName) || itemName.includes(pName));
      return skuMatch || nameMatch;
    });

    if (catalogMatch) {
      const catalogPrice = Number(catalogMatch.hargaModal || catalogMatch.hargaUmum || catalogMatch.hargaTopMarket || catalogMatch.hargaPabrik || 0);
      if (catalogPrice > 0) return catalogPrice;
    }

    // 2. Fallback ke savedHppList jika ada kalkulasi HPP Dapur
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

    // 3. Fallback ke hppPerPack / harga transaksi awal
    return Number(item.hppPerPack || item.harga || 0);
  };

  // Combine & Normalise All Received Products From Production
  const combinedReceivedData = useMemo(() => {
    const list = [];
    const sourceData = [...(hasilProduksi || []), ...(riwayatProduksi || [])];
    const processedMap = new Set();

    sourceData.forEach((item, idx) => {
      const dateStr = String(item.tanggal || item.timestamp || item.createdAt || '').substring(0, 10);
      if (!dateStr) return;

      const monthKey = dateStr.substring(0, 7);
      if (selectedMonth && selectedMonth !== 'Semua' && monthKey !== selectedMonth) return;

      const pName = item.produkNama || item.namaProduk || item.nama || item.alias || '';
      const aliasStr = String(item.alias || item.kode || '').trim().toUpperCase();

      // Abaikan data mentah non-spesifik seperti "BS", "SCM", "RCS" yang bukan varian produk siap jual bertimbangan gramasi
      const invalidNames = ['bs', 'scm', 'rcs', 'prod'];
      if (!pName || invalidNames.includes(pName.toLowerCase().trim())) return;
      if (invalidNames.includes(aliasStr.toLowerCase()) && !pName.toLowerCase().includes('sausage') && !pName.toLowerCase().includes('merah')) return;

      const keyStr = `${dateStr}_${pName}_${item.jumlahPcs || item.jumlahPack || item.pcs || 0}`;
      if (processedMap.has(keyStr)) return;
      processedMap.add(keyStr);

      const qty = Number(item.jumlahPcs || item.jumlahPack || item.jumlahBox || item.jumlah || item.pcs || 0);
      const hppUnit = calculateHppUnit(item);
      const totalNilai = qty * hppUnit;

      const matchSearch =
        pName.toLowerCase().includes(search.toLowerCase()) ||
        aliasStr.toLowerCase().includes(search.toLowerCase()) ||
        String(item.brand || '').toLowerCase().includes(search.toLowerCase());

      if (matchSearch) {
        list.push({
          id: item.id || item._id || `rec_${idx}`,
          tanggal: dateStr,
          produkNama: pName,
          alias: aliasStr || 'PROD',
          brand: item.brand || 'SAREN ONE',
          jumlahPack: qty,
          hargaModalPerPack: hppUnit,
          totalNilai,
          catatan: item.catatan || 'Terima Hasil Produksi'
        });
      }
    });

    return list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [hasilProduksi, riwayatProduksi, selectedMonth, search, savedHppList, produkList]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalPcs = 0;
    let totalRp = 0;
    const variants = new Set();

    combinedReceivedData.forEach(item => {
      totalPcs += item.jumlahPack;
      totalRp += item.totalNilai;
      variants.add(item.produkNama);
    });

    return {
      totalPcs,
      totalRp,
      variantCount: variants.size
    };
  }, [combinedReceivedData]);

  // Export Excel
  const handleExportExcel = () => {
    const headers = ['No', 'Tanggal Terima', 'Kode / Alias', 'Nama Produk', 'Brand', 'Jumlah Terima (Pack)', 'Harga Modal HPP/Pack (Rp)', 'Total Nilai (Rp)', 'Catatan'];
    const rows = combinedReceivedData.map((item, idx) => [
      idx + 1,
      item.tanggal,
      item.alias,
      item.produkNama,
      item.brand,
      item.jumlahPack,
      item.hargaModalPerPack,
      item.totalNilai,
      item.catatan
    ]);
    exportToExcel(`Laporan_Pembelian_Produk_${selectedMonth || 'Semua'}`, headers, rows);
  };

  // Export PDF
  const handleExportPDF = () => {
    const headers = ['Tanggal', 'Alias', 'Nama Produk Jadi', 'Jumlah Terima', 'Harga Modal', 'Total Nilai (Rp)'];
    const rows = combinedReceivedData.map(item => [
      item.tanggal,
      item.alias,
      item.produkNama,
      `${formatNumber(item.jumlahPack)} Pack`,
      `Rp ${formatNumber(item.hargaModalPerPack)}`,
      `Rp ${formatNumber(item.totalNilai)}`
    ]);
    const config = {
      title: 'Laporan Penerimaan Pembelian Produk Jadi',
      subtitle: `Daftar stok produk yang diterima dari Olahan Tim Produksi (Periode: ${selectedMonth || 'Semua'}).`,
      headers,
      rows,
      summaryText: `Total Penerimaan: ${formatNumber(metrics.totalPcs)} Pack | Nilai Total: Rp ${formatNumber(metrics.totalRp)}`,
      filename: `Pembelian_Produk_${selectedMonth || 'Semua'}`
    };

    if (onOpenPdfPreview) onOpenPdfPreview(config);
    else exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
  };

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      {/* ===== KPI SUMMARY CARDS (SUPER COMPACT & RAMPING) ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3px solid #059669', borderRadius: '10px', padding: '0.5rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total Terima</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageCheck size={14} style={{ color: '#059669' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem', lineHeight: 1.2 }}>
            {formatNumber(metrics.totalPcs)} <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>Pack</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3px solid #3b82f6', borderRadius: '10px', padding: '0.5rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Nilai Modal Persediaan</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={14} style={{ color: '#3b82f6' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2563eb', marginTop: '0.15rem', lineHeight: 1.2 }}>
            Rp {formatNumber(metrics.totalRp)}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3px solid #8b5cf6', borderRadius: '10px', padding: '0.5rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Varian Produk Masuk</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={14} style={{ color: '#8b5cf6' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem', lineHeight: 1.2 }}>
            {metrics.variantCount} <span style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 700 }}>Item Varian</span>
          </div>
        </div>
      </div>

      {/* ===== FILTER BAR & TABLE ===== */}
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div className="search-box" style={{ maxWidth: '320px', width: '100%', height: '36px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari nama produk / alias..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: '0.8rem' }}
            />
          </div>

          <ModernMonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            allowAll={true}
            variant="emerald"
          />
              {/* DATA TABLE READ-ONLY */}
        <div className="table-responsive" style={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569' }}>
                <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>No</th>
                <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>Tanggal Terima</th>
                <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>Alias / Kode</th>
                <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>Nama Produk Persediaan</th>
                <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>Brand</th>
                <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap' }}>Jumlah Terima</th>
                <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap' }}>Harga Modal HPP (Rp)</th>
                <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right', background: '#ecfdf5', color: '#047857', fontWeight: 900, whiteSpace: 'nowrap' }}>Total Nilai Pembelian (Rp)</th>
                <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {combinedReceivedData.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    Belum ada data penerimaan pembelian produk untuk periode ini.
                  </td>
                </tr>
              ) : (
                combinedReceivedData.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.4rem 0.65rem', fontWeight: 700, color: '#64748b', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td style={{ padding: '0.4rem 0.65rem', fontWeight: 800, color: '#334155', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{item.tanggal}</td>
                    <td style={{ padding: '0.4rem 0.65rem', whiteSpace: 'nowrap' }}>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                        {item.alias}
                      </span>
                    </td>
                    <td style={{ padding: '0.4rem 0.65rem', fontWeight: 800, color: '#0f172a', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {item.produkNama}
                    </td>
                    <td style={{ padding: '0.4rem 0.65rem', whiteSpace: 'nowrap' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.68rem', fontWeight: 700, padding: '0.08rem 0.4rem', borderRadius: '4px' }}>
                        {item.brand}
                      </span>
                    </td>
                    <td style={{ padding: '0.4rem 0.65rem', textAlign: 'right', fontWeight: 900, color: '#059669', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      +{formatNumber(item.jumlahPack)} <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Pack</span>
                    </td>
                    <td style={{ padding: '0.4rem 0.65rem', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      Rp {formatNumber(item.hargaModalPerPack)}
                    </td>
                    <td style={{ padding: '0.4rem 0.65rem', textAlign: 'right', fontWeight: 900, color: '#047857', background: '#f0fdf4', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      Rp {formatNumber(item.totalNilai)}
                    </td>
                    <td style={{ padding: '0.4rem 0.65rem', color: '#64748b', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                      {item.catatan}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {combinedReceivedData.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 900, color: '#0f172a', borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan={5} style={{ textAlign: 'right', padding: '0.55rem 0.65rem', color: '#475569', fontSize: '0.78rem' }}>TOTAL PENERIMAAN:</td>
                  <td style={{ textAlign: 'right', color: '#059669', padding: '0.55rem 0.65rem', fontSize: '0.82rem' }}>+{formatNumber(metrics.totalPcs)} Pack</td>
                  <td style={{ textAlign: 'center', color: '#64748b' }}>-</td>
                  <td style={{ textAlign: 'right', color: '#047857', fontSize: '0.88rem', background: '#d1fae5', padding: '0.55rem 0.65rem' }}>
                    Rp {formatNumber(metrics.totalRp)}
                  </td>
                  <td style={{ background: '#f8fafc' }}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>    </div>
      </div>
    </div>
  );
}
