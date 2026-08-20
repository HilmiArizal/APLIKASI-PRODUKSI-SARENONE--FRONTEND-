import React, { useState, useMemo } from 'react';
import { TrendingUp, Calculator, Calendar, DollarSign, Package, ArrowRight, FileText, CheckCircle, RefreshCw, ShoppingCart, Award } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

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
  const [selectedProdukId, setSelectedProdukId] = useState('');
  const [manualHpp1Kg, setManualHpp1Kg] = useState('45000');
  const [biayaKemasanPerPack, setBiayaKemasanPerPack] = useState('550'); // Default Vacumbag + Sticker
  const [customGramInput, setCustomGramInput] = useState('350');
  const [marginErrorPct, setMarginErrorPct] = useState('8'); // Default 8% Margin Error / Wastage

  // Helper: Find latest purchase price for a material
  const getLatestPurchasePrice = (bahanNama, defaultHarga = 0) => {
    const nmLower = String(bahanNama || '').trim().toLowerCase();
    for (const inv of (utangList || [])) {
      if (inv.items && Array.isArray(inv.items)) {
        for (const item of inv.items) {
          const itemNm = String(item.namaBahan || item.nama || '').trim().toLowerCase();
          if (itemNm === nmLower && Number(item.hargaSatuan || item.harga || 0) > 0) {
            return Number(item.hargaSatuan || item.harga);
          }
        }
      } else if (String(inv.bahanNama || '').trim().toLowerCase() === nmLower && Number(inv.hargaSatuan || 0) > 0) {
        return Number(inv.hargaSatuan);
      }
    }
    // Fallback to master bahanBaku price
    const master = (bahanBaku || []).find(b => String(b.nama || '').trim().toLowerCase() === nmLower);
    return master ? Number(master.harga || 0) : defaultHarga;
  };

  // Calculate HPP for Production Batches
  const productionHppList = useMemo(() => {
    return (riwayatProduksi || []).map(r => {
      const timestamp = r.timestamp || r.tanggal || r.createdAt || '';
      const dateStr = timestamp.substring(0, 10);

      let totalBiayaBahan = 0;
      const bahanDetails = [];

      if (r.bahanDigunakan && Array.isArray(r.bahanDigunakan)) {
        r.bahanDigunakan.forEach(b => {
          const bNama = b.bahanNama || b.nama || 'Bahan';
          const qty = Number(b.jumlah || 0);
          const hargaSatuan = getLatestPurchasePrice(bNama, Number(b.harga || 0));
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
      }

      // Quantity of product produced in KG (default batch estimate or pcs)
      const hasilKg = Math.max(1, Number(r.jumlahPcs || r.jumlahBatch || 1));
      const hppPerKg = totalBiayaBahan > 0 ? Math.round(totalBiayaBahan / hasilKg) : 0;

      return {
        id: r.id || r._id,
        timestamp,
        dateStr,
        produkNama: r.produkNama || 'Hasil Produksi Dapur',
        hasilKg,
        totalBiayaBahan: Math.round(totalBiayaBahan),
        hppPerKg,
        bahanDetails,
        operator: r.operator || r.user || 'Tim Produksi'
      };
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [riwayatProduksi, utangList, bahanBaku]);

  // Filtered Production HPP by Target Date
  const filteredProductionHpp = useMemo(() => {
    return productionHppList.filter(item => {
      return filterTanggal ? (item.dateStr === filterTanggal || item.dateStr.startsWith(filterTanggal)) : true;
    });
  }, [productionHppList, filterTanggal]);

  // Summary Metrics
  const totalBiayaHppPeriode = filteredProductionHpp.reduce((acc, x) => acc + x.totalBiayaBahan, 0);
  const totalHasilKgPeriode = filteredProductionHpp.reduce((acc, x) => acc + x.hasilKg, 0);
  const avgHppPerKgPeriode = totalHasilKgPeriode > 0 ? Math.round(totalBiayaHppPeriode / totalHasilKgPeriode) : 0;

  // Active HPP Per 1 KG for Calculator
  const currentActiveHpp1Kg = useMemo(() => {
    if (selectedProdukId) {
      const found = productionHppList.find(p => p.id === selectedProdukId || p.produkNama === selectedProdukId);
      if (found && found.hppPerKg > 0) return found.hppPerKg;
    }
    return Number(manualHpp1Kg) || 0;
  }, [selectedProdukId, manualHpp1Kg, productionHppList]);

  // Grammage Conversion Calculations (Standard vs Margin Error Wastage)
  const packCost = Number(biayaKemasanPerPack) || 0;
  const marginPct = Math.max(0, Number(marginErrorPct) || 0);
  const marginMultiplier = 1 + (marginPct / 100);
  const customGrams = Math.max(1, Number(customGramInput) || 350);

  // Standard HPP (Netto)
  const hpp250g = Math.round((currentActiveHpp1Kg * 0.25) + packCost);
  const hpp500g = Math.round((currentActiveHpp1Kg * 0.50) + packCost);
  const hpp750g = Math.round((currentActiveHpp1Kg * 0.75) + packCost);
  const hpp1000g = Math.round((currentActiveHpp1Kg * 1.00) + packCost);
  const hppCustom = Math.round((currentActiveHpp1Kg * (customGrams / 1000)) + packCost);

  // Safety HPP (+ Margin Error 8%)
  const hpp250gWaste = Math.round((currentActiveHpp1Kg * 0.25 * marginMultiplier) + packCost);
  const hpp500gWaste = Math.round((currentActiveHpp1Kg * 0.50 * marginMultiplier) + packCost);
  const hpp750gWaste = Math.round((currentActiveHpp1Kg * 0.75 * marginMultiplier) + packCost);
  const hpp1000gWaste = Math.round((currentActiveHpp1Kg * 1.00 * marginMultiplier) + packCost);
  const hppCustomWaste = Math.round((currentActiveHpp1Kg * (customGrams / 1000) * marginMultiplier) + packCost);

  // Export PDF
  const handleExportPDF = () => {
    const headers = ['Tanggal', 'Hasil Produksi', 'Jumlah Olahan (KG)', 'Total Biaya Bahan (Pembelian Terakhir)', 'HPP Per 1 KG'];
    const rows = filteredProductionHpp.map(l => [
      l.dateStr,
      l.produkNama,
      `${l.hasilKg} KG`,
      `Rp ${formatNumber(l.totalBiayaBahan)}`,
      `Rp ${formatNumber(l.hppPerKg)} / kg`
    ]);
    const config = {
      title: 'Laporan Perhitungan HPP Produksi Harian',
      subtitle: `Perhitungan HPP berdasarkan harga pembelian bahan baku terakhir (Periode: ${filterTanggal || 'Semua'}).`,
      headers,
      rows,
      summaryText: `Total Produksi: ${totalHasilKgPeriode} KG | Total Biaya: Rp ${formatNumber(totalBiayaHppPeriode)} | Rata-Rata HPP/KG: Rp ${formatNumber(avgHppPerKgPeriode)}`,
      filename: `HPP_Produksi_${filterTanggal || 'Saat_Ini'}`
    };
    if (onOpenPdfPreview) {
      onOpenPdfPreview(config);
    } else {
      exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
    }
  };

  const handleExportExcel = () => {
    const headers = ['Tanggal & Waktu', 'Produk Olahan', 'Hasil (KG)', 'Total Biaya HPP Bahan', 'HPP Per 1 KG', 'Operator'];
    const rows = filteredProductionHpp.map(l => [
      l.timestamp,
      l.produkNama,
      l.hasilKg,
      l.totalBiayaBahan,
      l.hppPerKg,
      l.operator
    ]);
    exportToExcel(`HPP_Produksi_${filterTanggal || 'Semua'}`, headers, rows);
  };

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* ===== HEADER & FILTER BAR ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <TrendingUp size={22} style={{ color: 'var(--amber)' }} /> HPP Produksi Harian &amp; Kalkulator Konversi
          </h2>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.2rem', margin: 0 }}>
            Kalkulasi HPP otomatis berbasis harga beli terakhir supplier + simulasi konversi gramasi kemasan (250g, 500g, 1kg).
          </p>
        </div>

        {/* Date Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={15} style={{ color: 'var(--amber)' }} /> Filter Tanggal HPP:
          </span>
          <input
            type="date"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#f8fafc',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer'
            }}
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
          />

          {filterTanggal !== todayStr && (
            <button className="btn btn-sm btn-outline" onClick={() => setFilterTanggal(todayStr)} style={{ fontSize: '0.78rem' }}>
              Hari Ini
            </button>
          )}

          {filterTanggal && (
            <button className="btn btn-sm btn-outline" onClick={() => setFilterTanggal('')} style={{ fontSize: '0.78rem' }}>
              Semua Tanggal
            </button>
          )}

          <button className="btn btn-sm btn-outline" onClick={handleExportPDF} title="Cetak Laporan PDF HPP">
            <FileText size={15} style={{ color: 'var(--amber)' }} /> Cetak PDF
          </button>
        </div>
      </div>

      {/* ===== SUMMARY METRICS CARDS ===== */}
      <div className="stats-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-card border-amber">
          <div className="stat-icon icon-amber"><DollarSign size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">Total HPP Olahan Produksi</span>
            <h3 className="stat-value" style={{ color: 'var(--amber)' }}>Rp {formatNumber(totalBiayaHppPeriode)}</h3>
            <span className="stat-desc text-amber">Berbasis Harga Pembelian Terakhir</span>
          </div>
        </div>

        <div className="stat-card border-cyan">
          <div className="stat-icon icon-cyan"><TrendingUp size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">Rata-Rata HPP Per 1 KG</span>
            <h3 className="stat-value" style={{ color: 'var(--cyan)' }}>Rp {formatNumber(avgHppPerKgPeriode)} / kg</h3>
            <span className="stat-desc text-cyan">Akumulasi Total Hasil ({totalHasilKgPeriode} KG)</span>
          </div>
        </div>

        <div className="stat-card border-indigo">
          <div className="stat-icon icon-indigo"><ShoppingCart size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">Rujukan Harga Pembelian</span>
            <h3 className="stat-value" style={{ fontSize: '1.1rem', color: '#818cf8' }}>Update Otomatis</h3>
            <span className="stat-desc text-indigo">Mengikuti Faktur Pembelian Terbaru</span>
          </div>
        </div>
      </div>

      {/* ===== KALKULATOR KONVERSI GRAMASI HPP (INTERACTIVE CONVERTER) ===== */}
      <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Calculator size={20} /> Simulasi &amp; Kalkulator Konversi Gramasi HPP Kemasan
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Pick Product or Enter HPP 1KG */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem', display: 'block' }}>
              Pilih Batch / Produksi Terakhir:
            </label>
            <select
              className="select-input"
              style={{ width: '100%', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              value={selectedProdukId}
              onChange={(e) => {
                setSelectedProdukId(e.target.value);
                const found = productionHppList.find(p => p.id === e.target.value);
                if (found && found.hppPerKg > 0) {
                  setManualHpp1Kg(String(found.hppPerKg));
                }
              }}
            >
              <option value="">-- Input HPP Kustom Manually --</option>
              {productionHppList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.produkNama} ({p.dateStr}) - Rp {formatNumber(p.hppPerKg)}/kg
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem', display: 'block' }}>
              Nilai HPP Per 1 KG (Rp / 1000g):
            </label>
            <input
              type="number"
              className="form-control"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--amber)', color: '#f8fafc', fontWeight: 800, fontSize: '0.95rem' }}
              value={manualHpp1Kg}
              onChange={(e) => {
                setManualHpp1Kg(e.target.value);
                setSelectedProdukId('');
              }}
              placeholder="Contoh: 45000"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--rose)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Margin Error / Waste Factor (%):
            </label>
            <input
              type="number"
              step="0.5"
              className="form-control"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--rose)', color: 'var(--rose)', fontWeight: 800, fontSize: '0.95rem' }}
              value={marginErrorPct}
              onChange={(e) => setMarginErrorPct(e.target.value)}
              placeholder="Default 8%"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem', display: 'block' }}>
              Biaya Kemasan Plastik &amp; Stiker (Rp/pcs):
            </label>
            <input
              type="number"
              className="form-control"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.9rem' }}
              value={biayaKemasanPerPack}
              onChange={(e) => setBiayaKemasanPerPack(e.target.value)}
              placeholder="Contoh: 550 (Plastik 350 + Stiker 200)"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: '0.35rem', display: 'block' }}>
              Input Gramasi Kustom (gram):
            </label>
            <input
              type="number"
              className="form-control"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--cyan)', color: 'var(--cyan)', fontWeight: 800, fontSize: '0.95rem' }}
              value={customGramInput}
              onChange={(e) => setCustomGramInput(e.target.value)}
              placeholder="Misal: 200, 350, 600"
            />
          </div>
        </div>

        {/* LIVE CONVERSION RESULTS CARDS WITH MARGIN ERROR 8% */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Kemasan 250 Gram</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>HPP Netto: Rp {formatNumber(hpp250g)}</div>
            <h4 style={{ color: 'var(--amber)', fontSize: '1.15rem', fontWeight: 900, margin: '0.3rem 0 0.1rem 0' }}>Rp {formatNumber(hpp250gWaste)}</h4>
            <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>🛡️ Inc. Waste {marginPct}%</span>
          </div>

          <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Kemasan 500 Gram</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>HPP Netto: Rp {formatNumber(hpp500g)}</div>
            <h4 style={{ color: 'var(--amber)', fontSize: '1.15rem', fontWeight: 900, margin: '0.3rem 0 0.1rem 0' }}>Rp {formatNumber(hpp500gWaste)}</h4>
            <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>🛡️ Inc. Waste {marginPct}%</span>
          </div>

          <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Kemasan 750 Gram</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>HPP Netto: Rp {formatNumber(hpp750g)}</div>
            <h4 style={{ color: 'var(--amber)', fontSize: '1.15rem', fontWeight: 900, margin: '0.3rem 0 0.1rem 0' }}>Rp {formatNumber(hpp750gWaste)}</h4>
            <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>🛡️ Inc. Waste {marginPct}%</span>
          </div>

          <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Kemasan 1000 Gram (1 KG)</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>HPP Netto: Rp {formatNumber(hpp1000g)}</div>
            <h4 style={{ color: 'var(--emerald)', fontSize: '1.15rem', fontWeight: 900, margin: '0.3rem 0 0.1rem 0' }}>Rp {formatNumber(hpp1000gWaste)}</h4>
            <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>🛡️ Inc. Waste {marginPct}%</span>
          </div>

          <div style={{ background: 'rgba(14, 165, 233, 0.12)', border: '1px solid var(--cyan)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--cyan)' }}>Gramasi Kustom ({customGrams}g)</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--cyan)', opacity: 0.8, marginTop: '0.2rem' }}>Netto: Rp {formatNumber(hppCustom)}</div>
            <h4 style={{ color: 'var(--cyan)', fontSize: '1.2rem', fontWeight: 900, margin: '0.3rem 0 0.1rem 0' }}>Rp {formatNumber(hppCustomWaste)}</h4>
            <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>🛡️ Inc. Waste {marginPct}%</span>
          </div>
        </div>
      </div>

      {/* ===== TABEL RINCIAN HPP PRODUKSI PER TANGGAL ===== */}
      <div className="table-container mt-4">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Package size={18} style={{ color: 'var(--amber)' }} /> Rincian HPP Hasil Produksi ({filteredProductionHpp.length} Batch)
          </h3>
          <button className="btn btn-sm btn-outline" onClick={handleExportExcel} style={{ fontSize: '0.78rem' }}>
            Export Excel
          </button>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>TANGGAL &amp; WAKTU</th>
              <th>NAMA PRODUK OLAHAN</th>
              <th>HASIL PRODUKSI (KG)</th>
              <th>TOTAL BIAYA BAHAN (HARGA TERAKHIR)</th>
              <th>HPP PER 1 KG</th>
              <th>SIMULASI HPP 250G</th>
              <th>SIMULASI HPP 500G</th>
            </tr>
          </thead>
          <tbody>
            {filteredProductionHpp.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Belum ada transaksi produksi pada tanggal {filterTanggal || 'ini'}.
                </td>
              </tr>
            ) : (
              filteredProductionHpp.map(l => {
                const p250 = Math.round((l.hppPerKg * 0.25) + packCost);
                const p500 = Math.round((l.hppPerKg * 0.50) + packCost);

                return (
                  <tr key={l.id}>
                    <td className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{l.timestamp || l.dateStr}</td>
                    <td style={{ fontWeight: 700 }}>{l.produkNama}</td>
                    <td style={{ fontWeight: 700, color: 'var(--cyan)' }}>{l.hasilKg} KG</td>
                    <td style={{ fontWeight: 800, color: 'var(--amber)' }}>Rp {formatNumber(l.totalBiayaBahan)}</td>
                    <td style={{ fontWeight: 800, color: 'var(--emerald)' }}>Rp {formatNumber(l.hppPerKg)} / kg</td>
                    <td style={{ fontWeight: 600 }}>Rp {formatNumber(p250)}</td>
                    <td style={{ fontWeight: 600 }}>Rp {formatNumber(p500)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
