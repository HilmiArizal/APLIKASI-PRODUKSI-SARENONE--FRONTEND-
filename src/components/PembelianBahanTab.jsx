import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Search, Calendar, CheckCircle, AlertTriangle, CreditCard, Building2, PackageCheck, Filter, Edit3, Trash2 } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalTambahUtangSupplier, ModalKelolaSupplier } from './Modals';
import { ModernMonthPicker } from './ModernDatePicker';

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
  onUpdateUtang,
  onDeleteUtang,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  showAlert
}) {
  const [isTambahOpen, setIsTambahOpen] = useState(false);
  const [editingUtang, setEditingUtang] = useState(null);
  const [isKelolaSupplierOpen, setIsKelolaSupplierOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Default to current running month (e.g. '2026-07')
  const now = new Date();
  const currentYear = now.getFullYear(); // e.g. 2026
  const currentYM = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentYM);

  const canManage = (activeRoleView === 'ADMIN' || activeRoleView === 'PEMBELIAN');
  const isSuperAdmin = (activeRoleView === 'ADMIN');

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
    return utangList
      .filter(item => selectedMonth === 'semua' || parseYYYYMM(item.tanggalBeli) === selectedMonth)
      .reduce((acc, item) => {
        const total = item.totalTagihan || 0;
        const hg = item.hargaSatuan || 0;
        let recVal = 0;
        if (item.riwayatPenerimaan && item.riwayatPenerimaan.length > 0) {
          item.riwayatPenerimaan.forEach(r => {
            recVal += (r.jumlah || 0) * hg;
          });
        } else {
          recVal = (item.jumlahDiterima || 0) * hg;
        }
        // Cap physical received value at total invoice tagihan
        const finalVal = Math.min(total, recVal);
        return acc + finalVal;
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

  const monthBelumDiterimaVal = useMemo(() => {
    return Math.max(0, monthPembelianVal - monthPenerimaanVal);
  }, [monthPembelianVal, monthPenerimaanVal]);

  // Filtered List for Table
  const filtered = utangList.filter(item => {
    const s = search.toLowerCase();
    const matchSearch = (item.supplier || '').toLowerCase().includes(s) ||
                        (item.noFaktur || '').toLowerCase().includes(s) ||
                        (item.bahanNama || '').toLowerCase().includes(s);

    const matchMonth = selectedMonth === 'semua' || parseYYYYMM(item.tanggalBeli) === selectedMonth;
    return matchSearch && matchMonth;
  });

  const handleOpenTambah = () => {
    setEditingUtang(null);
    setIsTambahOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingUtang(item);
    setIsTambahOpen(true);
  };

  const handleSubmitUtangModal = async (formData) => {
    if (editingUtang && onUpdateUtang) {
      const targetId = editingUtang.id || editingUtang._id || editingUtang.noFaktur;
      await onUpdateUtang(targetId, formData);
    } else if (onCreateUtang) {
      await onCreateUtang(formData);
    }
    setIsTambahOpen(false);
  };

  return (
    <div className="tab-pane active">
      {/* 1. PALING ATAS: Ultra Compact Summary Cards Perbulan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {/* Total Nilai Pembelian (Order) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Total Nilai Pembelian (Order)</span>
            <ShoppingCart size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
            Rp {formatNumber(monthPembelianVal)}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Rencana pembelian: {formatMonthLabel(selectedMonth)}
          </span>
        </div>

        {/* Total Nilai Penerimaan (Fisik) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '3px solid var(--emerald)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Total Nilai Penerimaan (Fisik)</span>
            <PackageCheck size={16} style={{ color: 'var(--emerald)' }} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--emerald)', marginTop: '0.2rem' }}>
            Rp {formatNumber(monthPenerimaanVal)}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Fisik diterima gudang: {formatMonthLabel(selectedMonth)}
          </span>
        </div>

        {/* Total Nilai Belum Diterima (Pending) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '3px solid var(--rose)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Total Nilai Belum Diterima (Pending)</span>
            <AlertTriangle size={16} style={{ color: 'var(--rose)' }} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--rose)', marginTop: '0.2rem' }}>
            Rp {formatNumber(monthBelumDiterimaVal)}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Pesanan belum sampai gudang: {formatMonthLabel(selectedMonth)}
          </span>
        </div>
      </div>

      {/* 2. DIBAWAHNYA: Header Toolbar (Periode Button di Kiri & Button Tambah Faktur di Kanan) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {/* Left (Position Start): Modern Custom Month Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <ModernMonthPicker
            value={selectedMonth}
            onChange={(val) => setSelectedMonth(val)}
            allowAll={true}
          />
        </div>

        {/* Right (Position End): Ultra Modern Tambah Faktur Pembelian Button */}
        {canManage && (
          <button
            type="button"
            onClick={handleOpenTambah}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              height: '32px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '0 0.75rem',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s ease',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 5px 14px rgba(37, 99, 235, 0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 3px 10px rgba(37, 99, 235, 0.3)';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              borderRadius: '5px',
              background: 'rgba(255, 255, 255, 0.22)',
              color: '#ffffff'
            }}>
              <Plus size={12} />
            </div>
            <span>Tambah Faktur Pembelian</span>
          </button>
        )}
      </div>

      {/* Riwayat Faktur Table */}
      <div className="table-container">
        <div style={{ padding: '0.45rem 0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              Riwayat Faktur Pembelian — <span style={{ color: 'var(--primary)' }}>{formatMonthLabel(selectedMonth)}</span>
            </h3>
            <span className="text-muted" style={{ fontSize: '0.68rem', display: 'block', marginTop: '0.1rem' }}>
              Daftar transaksi pembelian bahan baku yang dicatat di periode {formatMonthLabel(selectedMonth)}.
            </span>
          </div>
          <div className="search-box" style={{ maxWidth: '220px', padding: '0.25rem 0.55rem' }}>
            <Search size={13} style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Cari Faktur, Supplier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: '0.74rem' }}
            />
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>NO FAKTUR &amp; SUPPLIER</th>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>BAHAN BAKU DIBELI</th>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>JUMLAH ORDER</th>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>HARGA SATUAN</th>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>TOTAL ORDER</th>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>STATUS PENERIMAAN</th>
              {isSuperAdmin && (
                <th style={{ padding: '0.45rem 0.5rem', whiteSpace: 'nowrap', fontSize: '0.72rem', textAlign: 'center', width: '55px' }}>AKSI</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  {canManage ? (
                    <div>
                      <ShoppingCart size={28} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                      <div style={{ fontSize: '0.78rem' }}>Belum ada faktur pembelian di periode <strong>{formatMonthLabel(selectedMonth)}</strong>. Klik <strong>"+ Tambah Faktur Pembelian"</strong> untuk mulai mencatat.</div>
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
                  <tr key={item.id || item._id || item.noFaktur} style={{ fontSize: '0.74rem' }}>
                    <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.74rem' }}>{item.noFaktur}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>• {item.supplier}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.74rem', color: '#0f172a', whiteSpace: 'nowrap' }}>{item.bahanNama}</div>
                    </td>
                    <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                      <strong style={{ fontSize: '0.74rem' }}>{formatNumber(item.jumlah)} {item.satuan}</strong>
                    </td>
                    <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.74rem', color: '#475569' }}>
                      Rp {formatNumber(item.hargaSatuan)}
                    </td>
                    <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.74rem' }}>
                      <strong style={{ color: 'var(--primary)' }}>Rp {formatNumber(item.totalTagihan)}</strong>
                    </td>
                    <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                      {isFullReceived ? (
                        <span className="badge badge-emerald" style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>✓ SUDAH DITERIMA</span>
                      ) : isPartial ? (
                        <span className="badge badge-amber" style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>⏳ DITERIMA SEBAGIAN ({item.jumlahDiterima || 0}/{item.jumlah})</span>
                      ) : (
                        <span className="badge badge-rose" style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>📦 BELUM DITERIMA</span>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td style={{ padding: '0.25rem 0.4rem', whiteSpace: 'nowrap', textAlign: 'center', width: '60px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Faktur Pembelian"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              background: 'rgba(2, 132, 199, 0.08)',
                              border: '1px solid rgba(2, 132, 199, 0.28)',
                              color: '#0284c7',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              outline: 'none'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)';
                              e.currentTarget.style.color = '#ffffff';
                              e.currentTarget.style.borderColor = '#0284c7';
                              e.currentTarget.style.transform = 'scale(1.06)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(2, 132, 199, 0.08)';
                              e.currentTarget.style.color = '#0284c7';
                              e.currentTarget.style.borderColor = 'rgba(2, 132, 199, 0.28)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <Edit3 size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const targetId = item.id || item._id || item.noFaktur;
                              showAlert(
                                `Apakah Anda yakin ingin menghapus faktur pembelian ${item.noFaktur} (${item.supplier})?`,
                                'confirm',
                                'Konfirmasi Hapus Faktur',
                                () => onDeleteUtang && onDeleteUtang(targetId)
                              );
                            }}
                            title="Hapus Faktur Pembelian"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              background: 'rgba(244, 63, 94, 0.08)',
                              border: '1px solid rgba(244, 63, 94, 0.28)',
                              color: '#e11d48',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              outline: 'none'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)';
                              e.currentTarget.style.color = '#ffffff';
                              e.currentTarget.style.borderColor = '#e11d48';
                              e.currentTarget.style.transform = 'scale(1.06)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)';
                              e.currentTarget.style.color = '#e11d48';
                              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.28)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
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

      {/* Modals */}
      <ModalTambahUtangSupplier
        isOpen={isTambahOpen}
        onClose={() => setIsTambahOpen(false)}
        editingItem={editingUtang}
        bahanList={bahanBaku}
        suppliersList={suppliersList}
        utangList={utangList}
        onSubmit={handleSubmitUtangModal}
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
