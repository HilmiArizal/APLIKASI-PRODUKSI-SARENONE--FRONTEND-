import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Search, Calendar, CheckCircle, AlertTriangle, CreditCard, Building2, PackageCheck, Filter } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalTambahUtangSupplier, ModalKelolaSupplier } from './Modals';

// Robust date parser to YYYY-MM format
const parseYYYYMM = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();

  // Pattern YYYY-MM-DD or YYYY-MM...
  const matchIso = str.match(/^(\d{4})-(\d{2})/);
  if (matchIso) {
    return `${matchIso[1]}-${matchIso[2]}`;
  }

  // Pattern DD/MM/YYYY or D/M/YYYY
  const matchSlash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchSlash) {
    const year = matchSlash[3];
    const month = matchSlash[2].padStart(2, '0');
    return `${year}-${month}`;
  }

  // Native Date fallback
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }
  } catch (e) {}

  return '';
};

const formatMonthLabel = (ymStr) => {
  if (!ymStr || ymStr === 'semua') return 'Semua Periode (All Time)';
  const [year, month] = ymStr.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const idx = parseInt(month, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${monthNames[idx]} ${year}`;
  }
  return ymStr;
};

export default function PembelianBahanTab({
  utangList = [],
  bahanBaku = [],
  suppliersList = [],
  activeRoleView,
  onCreateUtang,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  showAlert
}) {
  const [isTambahOpen, setIsTambahOpen] = useState(false);
  const [isKelolaSupplierOpen, setIsKelolaSupplierOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Default to current running month (e.g. '2026-07')
  const now = new Date();
  const currentYear = now.getFullYear(); // e.g. 2026
  const currentYM = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentYM);

  const canManage = (activeRoleView === 'ADMIN' || activeRoleView === 'PEMBELIAN');

  // Generate FULL 12 MONTHS for the current year (Januari - Desember) + any other years found in data
  const full12MonthsOptions = useMemo(() => {
    const yearSet = new Set([currentYear]);
    utangList.forEach(item => {
      const ym = parseYYYYMM(item.tanggalBeli);
      if (ym) {
        const y = parseInt(ym.slice(0, 4), 10);
        if (y > 2000 && y < 2100) yearSet.add(y);
      }
    });

    const yearsSorted = Array.from(yearSet).sort((a, b) => b - a); // newest year first (e.g. 2026)

    const list = [];
    yearsSorted.forEach(y => {
      // Full 12 months from 1 (Januari) to 12 (Desember)
      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2, '0');
        list.push(`${y}-${mm}`);
      }
    });

    return list;
  }, [utangList, currentYear]);

  // Metrics for selected month
  const monthPembelianVal = useMemo(() => {
    return utangList
      .filter(item => selectedMonth === 'semua' || parseYYYYMM(item.tanggalBeli) === selectedMonth)
      .reduce((acc, item) => acc + (item.totalTagihan || 0), 0);
  }, [utangList, selectedMonth]);

  const monthPenerimaanVal = useMemo(() => {
    return utangList.reduce((acc, item) => {
      let recVal = 0;
      if (item.riwayatPenerimaan && item.riwayatPenerimaan.length > 0) {
        item.riwayatPenerimaan.forEach(r => {
          if (selectedMonth === 'semua' || parseYYYYMM(r.tanggal) === selectedMonth) {
            recVal += (r.jumlah || 0) * (item.hargaSatuan || 0);
          }
        });
      } else if ((item.jumlahDiterima || 0) > 0) {
        if (selectedMonth === 'semua' || parseYYYYMM(item.tanggalBeli) === selectedMonth) {
          recVal += (item.jumlahDiterima || 0) * (item.hargaSatuan || 0);
        }
      }
      return acc + recVal;
    }, 0);
  }, [utangList, selectedMonth]);

  const monthFakturCount = useMemo(() => {
    return utangList.filter(item => selectedMonth === 'semua' || parseYYYYMM(item.tanggalBeli) === selectedMonth).length;
  }, [utangList, selectedMonth]);

  const monthQtyDiterima = useMemo(() => {
    return utangList.reduce((acc, item) => {
      let qty = 0;
      if (item.riwayatPenerimaan && item.riwayatPenerimaan.length > 0) {
        item.riwayatPenerimaan.forEach(r => {
          if (selectedMonth === 'semua' || parseYYYYMM(r.tanggal) === selectedMonth) {
            qty += (r.jumlah || 0);
          }
        });
      } else if ((item.jumlahDiterima || 0) > 0) {
        if (selectedMonth === 'semua' || parseYYYYMM(item.tanggalBeli) === selectedMonth) {
          qty += (item.jumlahDiterima || 0);
        }
      }
      return acc + qty;
    }, 0);
  }, [utangList, selectedMonth]);

  // Filtered List for Table
  const filtered = utangList.filter(item => {
    const s = search.toLowerCase();
    const matchSearch = (item.supplier || '').toLowerCase().includes(s) ||
                        (item.noFaktur || '').toLowerCase().includes(s) ||
                        (item.bahanNama || '').toLowerCase().includes(s);

    const matchMonth = selectedMonth === 'semua' || parseYYYYMM(item.tanggalBeli) === selectedMonth;
    return matchSearch && matchMonth;
  });

  return (
    <div className="tab-pane active">
      {/* Header */}
      <div className="toolbar" style={{ marginBottom: '1.5rem', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={22} style={{ color: 'var(--primary)' }} /> Pembelian Bahan Baku
          </h2>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Catat transaksi pembelian bahan baku dari supplier &amp; pantau rekapitulasi nilai transaksi per bulan.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Month Selector Dropdown (Full 12 Months) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.35rem 0.75rem' }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Periode:</span>
            <select
              className="select-input"
              style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', padding: '0.2rem 0.4rem' }}
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              <option value="semua" style={{ background: '#1e293b' }}>🌐 Semua Periode (All Time)</option>
              {full12MonthsOptions.map(ym => (
                <option key={ym} value={ym} style={{ background: '#1e293b' }}>
                  📅 {formatMonthLabel(ym)} {ym === currentYM ? '(Bulan Berjalan)' : ''}
                </option>
              ))}
            </select>
          </div>

          {canManage && (
            <button className="btn btn-primary" onClick={() => setIsTambahOpen(true)}>
              <Plus size={16} /> Tambah Faktur Pembelian
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards Perbulan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Total Nilai Pembelian (Order) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--amber)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Total Nilai Pembelian (Order)</span>
            <ShoppingCart size={18} style={{ color: 'var(--amber)' }} />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--amber)', marginTop: '0.5rem' }}>
            Rp {formatNumber(monthPembelianVal)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Rencana pembelian: {formatMonthLabel(selectedMonth)}
          </span>
        </div>

        {/* Total Nilai Penerimaan (Fisik) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--emerald)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Total Nilai Penerimaan (Fisik)</span>
            <PackageCheck size={18} style={{ color: 'var(--emerald)' }} />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--emerald)', marginTop: '0.5rem' }}>
            Rp {formatNumber(monthPenerimaanVal)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Fisik diterima gudang: {formatMonthLabel(selectedMonth)}
          </span>
        </div>

        {/* Total Transaksi Faktur & Barangs */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Transaksi &amp; Fisik Diterima</span>
            <CreditCard size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
            {monthFakturCount} <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Faktur</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 600 }}>
            📥 {formatNumber(monthQtyDiterima)} item fisik masuk gudang
          </span>
        </div>
      </div>

      {/* Riwayat Faktur Table */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Riwayat Faktur Pembelian — <span style={{ color: 'var(--primary)' }}>{formatMonthLabel(selectedMonth)}</span>
            </h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
              Daftar transaksi pembelian bahan baku yang dicatat di periode {formatMonthLabel(selectedMonth)}.
            </span>
          </div>
          <div className="search-box" style={{ maxWidth: '280px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari Faktur, Supplier, Bahan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>NO FAKTUR &amp; SUPPLIER</th>
              <th>BAHAN BAKU DIBELI</th>
              <th>JUMLAH ORDER</th>
              <th>HARGA SATUAN</th>
              <th>TOTAL ORDER</th>
              <th>TGL BELI</th>
              <th>STATUS PENERIMAAN</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">
                  {canManage ? (
                    <div>
                      <ShoppingCart size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                      <div>Belum ada faktur pembelian di periode <strong>{formatMonthLabel(selectedMonth)}</strong>. Klik <strong>"+ Tambah Faktur Pembelian"</strong> untuk mulai mencatat.</div>
                    </div>
                  ) : `Belum ada catatan pembelian di ${formatMonthLabel(selectedMonth)}.`}
                </td>
              </tr>
            ) : (
              filtered.map(item => {
                const statusPeng = item.statusPengiriman || ((item.jumlahDiterima || 0) >= item.jumlah ? 'SUDAH DITERIMA' : ((item.jumlahDiterima || 0) > 0 ? 'SEBAGIAN' : 'BELUM DITERIMA'));
                const isFullReceived = statusPeng === 'SUDAH DITERIMA';
                const isPartial = statusPeng === 'SEBAGIAN';

                return (
                  <tr key={item.id || item._id || item.noFaktur}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.noFaktur}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{item.supplier}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.bahanNama}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>{item.satuan}</div>
                    </td>
                    <td><strong>{formatNumber(item.jumlah)} {item.satuan}</strong></td>
                    <td>Rp {formatNumber(item.hargaSatuan)}</td>
                    <td><strong style={{ color: 'var(--amber)' }}>Rp {formatNumber(item.totalTagihan)}</strong></td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>📅 {item.tanggalBeli}</div>
                    </td>
                    <td>
                      {isFullReceived ? (
                        <span className="badge badge-emerald">✓ SUDAH DITERIMA</span>
                      ) : isPartial ? (
                        <span className="badge badge-amber">⏳ DITERIMA SEBAGIAN ({item.jumlahDiterima || 0}/{item.jumlah})</span>
                      ) : (
                        <span className="badge badge-rose">📦 BELUM DITERIMA</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ModalTambahUtangSupplier
        isOpen={isTambahOpen}
        onClose={() => setIsTambahOpen(false)}
        bahanList={bahanBaku}
        suppliersList={suppliersList}
        onSubmit={onCreateUtang}
        onOpenKelolaSupplier={() => setIsKelolaSupplierOpen(true)}
        showAlert={showAlert}
      />

      <ModalKelolaSupplier
        isOpen={isKelolaSupplierOpen}
        onClose={() => setIsKelolaSupplierOpen(false)}
        suppliersList={suppliersList}
        onCreateSupplier={onCreateSupplier}
        onUpdateSupplier={onUpdateSupplier}
        onDeleteSupplier={onDeleteSupplier}
        showAlert={showAlert}
      />
    </div>
  );
}
