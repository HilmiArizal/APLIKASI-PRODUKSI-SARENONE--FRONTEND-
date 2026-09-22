import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FlaskConical, Play, Layers, Droplet, CheckCircle, ArrowDownLeft, ShieldAlert, History, Clock, Calendar, RotateCcw, X } from 'lucide-react';
import { formatNumber, STOCK_AWAL_JULI } from '../data/initialData';
import { ModernDatePicker, ModernMonthPicker } from './ModernDatePicker';
import { ModalPengolahanEmulsi } from './Modals';

export default function EmulsiTab({
  bahanBaku = [],
  auditLog = [],
  utangList = [],
  riwayatProduksi = [],
  activeRoleView,
  onProcessEmulsi,
  onRollbackEmulsi,
  isSuperAdmin,
  showAlert
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRollbackLog, setSelectedRollbackLog] = useState(null);
  const isSuperAdminUser = Boolean(isSuperAdmin || activeRoleView === 'ALL' || activeRoleView === 'ADMIN' || activeRoleView === 'ADMIN_PRODUK' || (activeRoleView && String(activeRoleView).includes('ADMIN')));

  // Date & Month strings (Default to 1 Periode Bulan Berjalan: YYYY-MM)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedDateFilter, setSelectedDateFilter] = useState(currentMonthStr);
  const [jenisFilter, setJenisFilter] = useState('semua');

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

  // Calculate Real-Time Stock Position for any Material b on Target Date
  const getBahanStokOnDate = (b, targetDateStr) => {
    if (!b) return 0;
    const targetDate = targetDateStr || todayStr;
    const bSku = String(b.sku || b.kode || '').trim().toUpperCase();
    const bName = String(b.nama || '').trim().toLowerCase();

    // 1. Base Starting Stock
    let baseStockAwal = 0;
    const localStokAwal = localStorage.getItem('STOK_AWAL_' + bSku);
    if (b.stokAwal !== undefined && b.stokAwal !== null && !isNaN(Number(b.stokAwal))) {
      baseStockAwal = Number(b.stokAwal);
    } else if (localStokAwal !== null && !isNaN(Number(localStokAwal))) {
      baseStockAwal = Number(localStokAwal);
    } else if (STOCK_AWAL_JULI[bSku] !== undefined) {
      baseStockAwal = Number(STOCK_AWAL_JULI[bSku]);
    } else {
      baseStockAwal = Number(b.stok) || 0;
    }

    if (!targetDate) return baseStockAwal;

    // 2. Receipts (Supplier POs + Emulsion Production Yields)
    let totalReceipts = 0;
    (utangList || []).forEach(p => {
      if (!isBahanMatch(p, b)) return;

      if (Array.isArray(p.riwayatPenerimaan) && p.riwayatPenerimaan.length > 0) {
        p.riwayatPenerimaan.forEach(r => {
          const rawDate = r.tanggal || p.tanggalPenerimaan || p.tanggalBeli || p.tanggal || r.createdAt || p.createdAt || '';
          const rDate = String(rawDate).substring(0, 10);
          if (rDate && rDate <= targetDate) {
            totalReceipts += Number(r.jumlah || r.diterima || 0);
          }
        });
      } else {
        const qty = Number(p.jumlahDiterima || p.jumlah || 0);
        if (qty > 0) {
          const rawDate = p.tanggalPenerimaan || p.tanggalBeli || p.tanggal || p.createdAt || '';
          const pDate = String(rawDate).substring(0, 10);
          if (pDate && pDate <= targetDate) {
            totalReceipts += qty;
          }
        }
      }
    });

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
        if (logDate && logDate <= targetDate) {
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
            totalReceipts += yieldQty;
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
            totalReceipts += yieldQty;
          }
        }
      });
    }

    // 3. Consumptions (Kitchen Finished Goods Batches based strictly on BOM)
    let totalConsumptions = 0;
    (riwayatProduksi || []).forEach(r => {
      const rawDate = r.tanggal || r.timestamp || r.createdAt || '';
      const rDate = String(rawDate).substring(0, 10);
      if (rDate && rDate <= targetDate) {
        const items = (Array.isArray(r.pemotonganBahan) && r.pemotonganBahan.length > 0)
          ? r.pemotonganBahan
          : (Array.isArray(r.bahanDigunakan) ? r.bahanDigunakan : []);

        items.forEach(item => {
          if (isBahanMatch(item, b)) {
            totalConsumptions += Number(item.jumlah || item.qty || 0);
          }
        });
      }
    });

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
        if (logDate && logDate <= targetDate) {
          const matchBatch = detail.match(/memproses\s*(\d+)\s*batch/i);
          const batchNum = matchBatch ? parseInt(matchBatch[1], 10) : 1;

          if (detail.includes('isp') || aksi.includes('isp')) {
            if (bSku === 'BB6' || bName.includes('marksoy') || bName.includes('isp')) totalConsumptions += 2 * batchNum;
            if (bSku === 'BB8' || (bName.includes('air') && bName.includes('es'))) totalConsumptions += 4 * batchNum;
            if (bSku === 'BB7' || bName.includes('minyak')) totalConsumptions += 4 * batchNum;
          } else if (detail.includes('tvp') || aksi.includes('tvp')) {
            if (bSku === 'BB54' || bName.includes('tvp')) totalConsumptions += 1 * batchNum;
          }
        }
      });
    }

    const calculatedStok = baseStockAwal + totalReceipts - totalConsumptions;
    return Math.round(Math.max(0, calculatedStok) * 1000) / 1000;
  };

  // Find Emulsi ISP & Emulsi TVP items
  const emulsiIspItem = bahanBaku.find(b => b.sku === 'BB5' || b.sku === 'EML-ISP' || b.nama.toLowerCase().includes('emulsi isp'));
  const emulsiTvpItem = bahanBaku.find(b => b.sku === 'BB55' || b.sku === 'EML-TVP' || b.nama.toLowerCase().includes('emulsi tvp'));

  // Find Raw materials (strictly excluding Emulsi items!)
  const ispPowderItem = bahanBaku.find(b => {
    const name = (b.nama || '').toLowerCase();
    const sku = (b.sku || '').toLowerCase();
    return !name.includes('emulsi') && (name.includes('marksoy') || name.includes('isp') || sku.includes('marksoy') || sku.includes('isp'));
  });
  const tvpGranulesItem = bahanBaku.find(b => {
    const name = (b.nama || '').toLowerCase();
    const sku = (b.sku || '').toLowerCase();
    return !name.includes('emulsi') && (name.includes('tvp') || sku.includes('tvp'));
  });
  const waterItem = bahanBaku.find(b => {
    const name = (b.nama || '').toLowerCase();
    const sku = (b.sku || '').toLowerCase();
    return !name.includes('emulsi') && (name.includes('air') || name.includes('es') || sku.includes('air'));
  });
  const oilItem = bahanBaku.find(b => {
    const name = (b.nama || '').toLowerCase();
    const sku = (b.sku || '').toLowerCase();
    return !name.includes('emulsi') && (name.includes('minyak') || name.includes('lemak') || sku.includes('minyak'));
  });

  const isCanProcess = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  // Filter emulsion processing logs from auditLog (strictly EXCLUDING rollback/cancellation logs!)
  const emulsiLogs = auditLog.filter(log => {
    const aksi = (log.aksi || '').toLowerCase();
    const detail = (log.detail || '').toLowerCase();
    const isRollback = aksi.includes('rollback') || aksi.includes('batal') || detail.includes('rollback') || detail.includes('membatalkan');
    return !isRollback && (aksi.includes('emulsi') || detail.includes('emulsi'));
  });

  const filteredHistory = emulsiLogs.filter(log => {
    const detail = (log.detail || '').toLowerCase();
    const matchDate = !selectedDateFilter || (log.timestamp || '').startsWith(selectedDateFilter);
    const matchJenis = jenisFilter === 'semua' || (jenisFilter === 'isp' ? detail.includes('isp') : detail.includes('tvp'));
    return matchDate && matchJenis;
  });

  // Filter Tanggal Position state for stock calculation
  const [filterTanggalPosition, setFilterTanggalPosition] = useState(todayStr);

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      {/* Top Toolbar: Modern Date Picker & Process Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ModernDatePicker
            value={filterTanggalPosition}
            onChange={(val) => setFilterTanggalPosition(val)}
          />
        </div>

        {isCanProcess && (
          <button
            type="button"
            className="btn btn-emerald"
            onClick={() => setIsModalOpen(true)}
            style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.75rem', borderRadius: '6px', boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Play size={14} /> + Proses Emulsi Baru
          </button>
        )}
      </div>

      {/* Overview Stock Cards - 2 Columns Grid Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {/* ISP Emulsion Card */}
        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(16, 185, 129, 0.25)', borderTop: '3.5px solid var(--emerald)', borderRadius: '10px', padding: '0.75rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px' }}>
                EMULSI ISP
              </span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0 0 0' }}>Stok Emulsi ISP (Isolated Soy Protein)</h3>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} style={{ color: 'var(--emerald)' }} />
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {emulsiIspItem ? formatNumber(getBahanStokOnDate(emulsiIspItem, filterTanggalPosition)) : '0'}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>kg</span>
          </div>

          <div style={{ marginTop: '0.45rem', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '0.4rem', fontSize: '0.68rem', color: '#94a3b8' }}>
            ✓ Siap digunakan sebagai campuran adonan sosis.
          </div>
        </div>

        {/* TVP Emulsion Card */}
        <div className="summary-stat-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(56, 189, 248, 0.25)', borderTop: '3.5px solid var(--cyan)', borderRadius: '10px', padding: '0.75rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px' }}>
                HYDRASI TVP
              </span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0 0 0' }}>Stok Hydrasi TVP (Textured Vegetable Protein)</h3>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplet size={18} style={{ color: 'var(--cyan)' }} />
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {emulsiTvpItem ? formatNumber(getBahanStokOnDate(emulsiTvpItem, filterTanggalPosition)) : '0'}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>kg</span>
          </div>

          <div style={{ marginTop: '0.45rem', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '0.4rem', fontSize: '0.68rem', color: '#94a3b8' }}>
            ✓ Siap digunakan sebagai teksturisator daging sosis.
          </div>
        </div>
      </div>

      {/* Raw Material Inventory Status for Emulsion */}
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.75rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <CheckCircle size={16} style={{ color: '#10b981' }} /> Ketersediaan Stok Bahan Baku Mentah Emulsi
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
          <div style={{ border: '1px solid #e2e8f0', padding: '0.45rem 0.65rem', borderRadius: '6px', background: '#f8fafc' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Marksoy (ISP)</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
              {ispPowderItem ? `${formatNumber(getBahanStokOnDate(ispPowderItem, filterTanggalPosition))} ${ispPowderItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', padding: '0.45rem 0.65rem', borderRadius: '6px', background: '#f8fafc' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>TVP Granules (Primary)</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
              {tvpGranulesItem ? `${formatNumber(getBahanStokOnDate(tvpGranulesItem, filterTanggalPosition))} ${tvpGranulesItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', padding: '0.45rem 0.65rem', borderRadius: '6px', background: '#f8fafc' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Air Es / Es Batu</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
              {waterItem ? `${formatNumber(getBahanStokOnDate(waterItem, filterTanggalPosition))} ${waterItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', padding: '0.45rem 0.65rem', borderRadius: '6px', background: '#f8fafc' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Minyak / Fat</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
              {oilItem ? `${formatNumber(getBahanStokOnDate(oilItem, filterTanggalPosition))} ${oilItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat Pengolahan Emulsi Per Tanggal */}
      <div className="table-container" style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Left Side: Title & Month Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <History size={16} style={{ color: '#10b981' }} /> Riwayat &amp; Log Pengolahan Emulsi
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Menampilkan {filteredHistory.length} transaksi pengolahan batch.
              </span>
            </div>

            <ModernMonthPicker
              value={selectedDateFilter}
              onChange={(val) => setSelectedDateFilter(val === 'semua' ? '' : val)}
              allowAll={true}
            />
          </div>

          {/* Right Side: Category Filter Dropdown (Far Right) */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <select
              className="select-input"
              style={{
                height: '32px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0 0.6rem',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                minWidth: '140px'
              }}
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
            >
              <option value="semua">Semua Emulsi</option>
              <option value="isp">Emulsi ISP</option>
              <option value="tvp">Emulsi TVP</option>
            </select>
          </div>
        </div>

        <table className="custom-table" style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>WAKTU / TANGGAL</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>JENIS EMULSI</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>RINCIAN PENGOLAHAN BATCH &amp; PEMOTONGAN BAHAN</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>OPERATOR</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>STATUS</th>
              {isSuperAdminUser && <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI (SUPER ADMIN)</th>}
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdminUser ? "6" : "5"} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  {selectedDateFilter ? `Tidak ada riwayat pengolahan emulsi pada periode ${selectedDateFilter}.` : 'Belum ada riwayat pengolahan emulsi.'}
                </td>
              </tr>
            ) : (
              filteredHistory.map(log => {
                const isToday = (log.timestamp || '').startsWith(todayStr);
                const isISP = (log.detail || '').toLowerCase().includes('isp');

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.32rem 0.55rem', fontWeight: 700, color: '#059669', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                      <Clock size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                      {log.timestamp}
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        background: isISP ? '#dcfce7' : '#e0f2fe',
                        color: isISP ? '#059669' : '#0369a1',
                        border: isISP ? '1px solid #a7f3d0' : '1px solid #bae6fd',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.12rem 0.45rem',
                        borderRadius: '5px'
                      }}>
                        {isISP ? 'EMULSI ISP' : 'EMULSI TVP'}
                      </span>
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', fontWeight: 800, color: '#0f172a', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>{log.detail}</td>
                    <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                      <strong style={{ color: '#0f172a' }}>{log.user}</strong> <span style={{ color: '#64748b' }}>({log.role})</span>
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                      {isToday ? (
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>✓ HARI INI</span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Lampau</span>
                      )}
                    </td>
                    {isSuperAdminUser && (
                      <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setSelectedRollbackLog(log)}
                          title="Batalkan Batch Ini & Kembalikan Stok (Khusus Super Admin)"
                          style={{
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
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
                          <RotateCcw size={12} /> Batalkan
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

      <ModalPengolahanEmulsi
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProcess={onProcessEmulsi}
        bahanList={bahanBaku}
        defaultTanggal={selectedDateFilter && selectedDateFilter.length === 10 ? selectedDateFilter : todayStr}
        showAlert={showAlert}
      />

      <ModalRollbackEmulsi
        isOpen={Boolean(selectedRollbackLog)}
        onClose={() => setSelectedRollbackLog(null)}
        logItem={selectedRollbackLog}
        onConfirmRollback={onRollbackEmulsi}
      />
    </div>
  );
}

function ModalRollbackEmulsi({ isOpen, onClose, logItem, onConfirmRollback }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !logItem) return null;

  const detailText = logItem.detail || '';
  const isISP = detailText.toLowerCase().includes('isp');
  const batchMatch = detailText.match(/(\d+)\s*Batch/i);
  const batchNum = batchMatch ? parseInt(batchMatch[1], 10) : 1;

  const yieldMatch = detailText.match(/Menghasilkan\s*\+(\d+(?:\.\d+)?)\s*kg/i);
  const yieldQty = yieldMatch ? parseFloat(yieldMatch[1]) : ((isISP ? 20 : 4) * batchNum);

  const mainQtyMatch = detailText.match(/(?:Marksoy|TVP|ISP)[^:-]*:\s*-(\d+(?:\.\d+)?)/i);
  const mainQty = mainQtyMatch ? parseFloat(mainQtyMatch[1]) : ((isISP ? 2 : 1) * batchNum);

  const waterQtyMatch = detailText.match(/Air\s*Es[^:-]*:\s*-(\d+(?:\.\d+)?)/i);
  const waterQty = waterQtyMatch ? parseFloat(waterQtyMatch[1]) : ((isISP ? 4 : 0) * batchNum);

  const oilQtyMatch = detailText.match(/Minyak[^:-]*:\s*-(\d+(?:\.\d+)?)/i);
  const oilQty = oilQtyMatch ? parseFloat(oilQtyMatch[1]) : ((isISP ? 4 : 0) * batchNum);

  const mainName = isISP ? 'Marksoy / ISP' : 'TVP Granules';

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirmRollback(logItem.id);
    setIsSubmitting(false);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '580px' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <h3 style={{ color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
            <RotateCcw size={20} /> Konfirmasi Rollback Batch Emulsi
          </h3>
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={isSubmitting}><X size={16} /></button>
        </div>

        <div className="modal-body" style={{ paddingTop: '1.15rem' }}>
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--rose)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', marginBottom: '1.25rem', color: 'var(--rose)', fontSize: '0.85rem' }}>
            ⚠️ <strong>Tindakan Pembatalan / Rollback:</strong> Batalkan batch emulsi ini untuk memulihkan stok mentah ke gudang dan mengurangi stok emulsi hasil jadi.
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className={`badge ${isISP ? 'badge-emerald' : 'badge-cyan'}`} style={{ fontWeight: 700 }}>
                {isISP ? 'EMULSI ISP' : 'EMULSI TVP'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <Clock size={12} style={{ marginRight: '0.25rem' }} /> {logItem.timestamp}
              </span>
            </div>

            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1f2d3d', marginBottom: '0.5rem' }}>
              {logItem.detail}
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Operator: <strong>{logItem.user}</strong> ({logItem.role})
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald)', marginBottom: '0.5rem' }}>
              🔄 Efek Pengembalian Stok Otomatis:
            </h4>
            <ul style={{ fontSize: '0.82rem', margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>
                <strong>+ {mainQty} kg {mainName}</strong> dikembalikan ke Stok Bahan Baku.
              </li>
              {isISP && waterQty > 0 && (
                <li>
                  <strong>+ {waterQty} kg Air Es Batu</strong> dikembalikan ke Stok Bahan Baku.
                </li>
              )}
              {isISP && oilQty > 0 && (
                <li>
                  <strong>+ {oilQty} pouch Minyak Goreng</strong> dikembalikan ke Stok Bahan Baku.
                </li>
              )}
              <li style={{ color: 'var(--rose)', fontWeight: 600 }}>
                <strong>- {yieldQty} kg Stok {isISP ? 'Emulsi ISP' : 'Emulsi TVP'}</strong> dikurangi dari persediaan.
              </li>
            </ul>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Memproses Rollback...' : <><RotateCcw size={15} style={{ marginRight: '0.35rem' }} /> Ya, Batalkan Batch &amp; Kembalikan Stok</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
