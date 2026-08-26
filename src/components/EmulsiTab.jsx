import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FlaskConical, Play, Layers, Droplet, CheckCircle, ArrowDownLeft, ShieldAlert, History, Clock, Calendar, RotateCcw, X } from 'lucide-react';
import { formatNumber, STOCK_AWAL_JULI } from '../data/initialData';
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
    <div className="tab-pane active">
      {/* Date Position Banner Filter Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', background: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Calendar size={20} style={{ color: 'var(--emerald)' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Filter Tanggal Position:
          </span>
          <input
            type="date"
            className="form-control"
            style={{ width: '160px', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
            value={filterTanggalPosition}
            onChange={(e) => setFilterTanggalPosition(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn btn-sm ${filterTanggalPosition === todayStr ? 'btn-emerald' : 'btn-outline'}`}
            onClick={() => setFilterTanggalPosition(todayStr)}
            style={{ fontSize: '0.78rem' }}
          >
            Hari Ini
          </button>
          <button
            className={`btn btn-sm ${!filterTanggalPosition ? 'btn-emerald' : 'btn-outline'}`}
            onClick={() => setFilterTanggalPosition('')}
            style={{ fontSize: '0.78rem' }}
          >
            Semua Tanggal
          </button>
        </div>
      </div>

      {filterTanggalPosition && (
        <div style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', fontWeight: 700 }}>
            <Calendar size={18} style={{ color: '#38bdf8' }} />
            POSISI STOK EMULSI TANGGAL: <span style={{ color: '#38bdf8', letterSpacing: '0.5px' }}>{filterTanggalPosition}</span>
          </div>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Rumus: Stok Awal + Hasil Emulsi (+) - Pemakaian BOM (-) = Stok Posisi
          </span>
        </div>
      )}

      <div className="toolbar" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div>
        </div>

        {isCanProcess && (
          <button className="btn btn-emerald" onClick={() => setIsModalOpen(true)}>
            <Play size={16} /> Proses Emulsi Baru
          </button>
        )}
      </div>

      {/* Overview Stock Cards - 2 Columns Grid Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* ISP Emulsion Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="badge badge-emerald">EMULSI ISP</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem' }}>Stok Emulsi ISP (Isolated Soy Protein)</h3>
              <p className="text-muted" style={{ fontSize: '0.78rem' }}>1 Batch = 2kg Marksoy + 4kg Air Es + 4 Pouch Minyak 2L ⇒ Yield 20 kg</p>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '50%', color: 'var(--emerald)' }}>
              <Layers size={24} />
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--emerald)' }}>
              {emulsiIspItem ? formatNumber(getBahanStokOnDate(emulsiIspItem, filterTanggalPosition)) : '0'}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ✓ Siap digunakan sebagai campuran adonan sosis.
          </div>
        </div>

        {/* TVP Emulsion Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="badge badge-cyan">EMULSI TVP</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem' }}>Stok Emulsi TVP (Textured Vegetable Protein)</h3>
              <p className="text-muted" style={{ fontSize: '0.78rem' }}>1 Batch = 1kg TVP + 3kg Air (Biasa) ⇒ Yield 4.0 kg (Tanpa Air Es &amp; Minyak)</p>
            </div>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.75rem', borderRadius: '50%', color: 'var(--cyan)' }}>
              <Droplet size={24} />
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--cyan)' }}>
              {emulsiTvpItem ? formatNumber(getBahanStokOnDate(emulsiTvpItem, filterTanggalPosition)) : '0'}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ✓ Hidrasi tekstur protein nabati pengganti serat daging.
          </div>
        </div>
      </div>

      {/* Raw Material Inventory Status for Emulsion */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} style={{ color: 'var(--emerald)' }} /> Ketersediaan Stok Bahan Baku Mentah Emulsi
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Marksoy (ISP)</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {ispPowderItem ? `${formatNumber(getBahanStokOnDate(ispPowderItem, filterTanggalPosition))} ${ispPowderItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>TVP Granules (Primary)</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {tvpGranulesItem ? `${formatNumber(getBahanStokOnDate(tvpGranulesItem, filterTanggalPosition))} ${tvpGranulesItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Air Es / Es Batu</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {waterItem ? `${formatNumber(getBahanStokOnDate(waterItem, filterTanggalPosition))} ${waterItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Minyak / Fat</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {oilItem ? `${formatNumber(getBahanStokOnDate(oilItem, filterTanggalPosition))} ${oilItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat Pengolahan Emulsi Per Tanggal */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} style={{ color: 'var(--emerald)' }} /> Riwayat &amp; Log Pengolahan Emulsi (Periode Bulan Berjalan)
            </h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
              Menampilkan {filteredHistory.length} transaksi pengolahan batch emulsi.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="select-input"
              style={{ width: '140px', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
            >
              <option value="semua">Semua Emulsi</option>
              <option value="isp">Emulsi ISP</option>
              <option value="tvp">Emulsi TVP</option>
            </select>

            <input
              type="month"
              className="form-control"
              style={{ width: '165px', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              value={selectedDateFilter.length > 7 ? selectedDateFilter.slice(0, 7) : selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              title="Pilih Periode Bulan Berjalan"
            />
            <button
              className={`btn btn-sm ${selectedDateFilter === currentMonthStr ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setSelectedDateFilter(currentMonthStr)}
            >
              Bulan Ini
            </button>
            <button
              className={`btn btn-sm ${selectedDateFilter === todayStr ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setSelectedDateFilter(todayStr)}
            >
              Hari Ini
            </button>
            <button
              className={`btn btn-sm ${!selectedDateFilter ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setSelectedDateFilter('')}
            >
              Semua Periode
            </button>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>WAKTU / TANGGAL</th>
              <th>JENIS EMULSI</th>
              <th>RINCIAN PENGOLAHAN BATCH &amp; PEMOTONGAN BAHAN</th>
              <th>OPERATOR</th>
              <th>STATUS</th>
              {isSuperAdminUser && <th style={{ textAlign: 'right' }}>AKSI (SUPER ADMIN)</th>}
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdminUser ? "6" : "5"} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  {selectedDateFilter ? `Tidak ada riwayat pengolahan emulsi pada periode ${selectedDateFilter}.` : 'Belum ada riwayat pengolahan emulsi.'}
                </td>
              </tr>
            ) : (
              filteredHistory.map(log => {
                const isToday = (log.timestamp || '').startsWith(todayStr);
                const isISP = (log.detail || '').toLowerCase().includes('isp');

                return (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>
                      <Clock size={13} style={{ marginRight: '0.35rem' }} />
                      {log.timestamp}
                    </td>
                    <td>
                      <span className={`badge ${isISP ? 'badge-emerald' : 'badge-cyan'}`}>
                        {isISP ? 'EMULSI ISP' : 'EMULSI TVP'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.detail}</td>
                    <td>
                      <strong>{log.user}</strong> <span className="text-muted">({log.role})</span>
                    </td>
                    <td>
                      {isToday ? (
                        <span className="badge badge-emerald" style={{ fontWeight: 700 }}>✓ HARI INI</span>
                      ) : (
                        <span className="badge badge-outline">Lampau</span>
                      )}
                    </td>
                    {isSuperAdminUser && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-outline btn-danger"
                          onClick={() => setSelectedRollbackLog(log)}
                          title="Batalkan Batch Ini & Kembalikan Stok (Khusus Super Admin)"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                        >
                          <RotateCcw size={13} style={{ marginRight: '0.25rem' }} /> Batalkan
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
