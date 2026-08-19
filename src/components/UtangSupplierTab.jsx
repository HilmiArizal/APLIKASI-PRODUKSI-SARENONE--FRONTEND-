import React, { useState } from 'react';
import { CreditCard, Search, History, CheckCircle, AlertTriangle, DollarSign, Trash2, Calendar, Filter, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalBayarUtangSupplier, ModalRiwayatBayarSupplier } from './Modals';
import { cleanFloat } from '../utils/numberUtils';

export default function UtangSupplierTab({
  utangList = [],
  suppliersList = [],
  activeRoleView,
  onPayUtang,
  onDeleteUtang,
  showAlert
}) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [statusFilter, setStatusFilter] = useState('semua');
  const [selectedUtangForPay, setSelectedUtangForPay] = useState(null);
  const [selectedUtangForHistory, setSelectedUtangForHistory] = useState(null);

  const canManage = (activeRoleView === 'ADMIN' || activeRoleView === 'PEMBELIAN');

  // Helper to extract YYYY-MM from date string
  const getMonthFromDateStr = (dateStr) => {
    if (!dateStr) return '';
    const clean = dateStr.trim();
    if (clean.length >= 7) return clean.substring(0, 7);
    return '';
  };

  // ===== ACCOUNTING CALCULATIONS (SALDO AWAL, DEBIT, KREDIT, SALDO AKHIR) =====
  let globalSaldoAwal = 0;
  let globalDebit = 0;
  let globalKredit = 0;
  let globalSaldoAkhir = 0;

  // Supplier-level map initialization
  const supplierAccountingMap = {};
  suppliersList.forEach(sup => {
    const nama = sup.nama || sup.name || '';
    if (nama) {
      supplierAccountingMap[nama] = {
        nama,
        saldoAwal: 0,
        debit: 0,
        kredit: 0,
        saldoAkhir: 0,
        fakturCount: 0,
        fakturBelumLunas: 0
      };
    }
  });

  utangList.forEach(item => {
    const supNama = item.supplier || 'Supplier Lain';
    if (!supplierAccountingMap[supNama]) {
      supplierAccountingMap[supNama] = {
        nama: supNama,
        saldoAwal: 0,
        debit: 0,
        kredit: 0,
        saldoAkhir: 0,
        fakturCount: 0,
        fakturBelumLunas: 0
      };
    }

    const itemMonth = getMonthFromDateStr(item.tanggalBeli);
    const itemTotal = Number(item.totalTagihan || 0);
    const itemPaidTotal = Number(item.jumlahDibayar || 0);
    const itemSisa = Number(item.sisaUtang || 0);

    if (selectedMonth === 'ALL') {
      // All time view
      supplierAccountingMap[supNama].saldoAwal += 0;
      supplierAccountingMap[supNama].debit += itemTotal;
      supplierAccountingMap[supNama].kredit += itemPaidTotal;
      supplierAccountingMap[supNama].saldoAkhir += itemSisa;
      supplierAccountingMap[supNama].fakturCount += 1;
      if (item.status !== 'LUNAS' && itemSisa > 0) supplierAccountingMap[supNama].fakturBelumLunas += 1;

      globalDebit += itemTotal;
      globalKredit += itemPaidTotal;
      globalSaldoAkhir += itemSisa;
    } else {
      // Month-filtered accounting calculation
      if (itemMonth && itemMonth < selectedMonth) {
        // Faktur sebelum bulan yang dipilih (Saldo Awal)
        if (itemSisa > 0 || item.status !== 'LUNAS') {
          supplierAccountingMap[supNama].saldoAwal += itemSisa;
          globalSaldoAwal += itemSisa;
        }
      } else if (itemMonth === selectedMonth) {
        // Faktur pada bulan yang dipilih (Debit = Penambahan Utang Baru)
        supplierAccountingMap[supNama].debit += itemTotal;
        supplierAccountingMap[supNama].fakturCount += 1;
        globalDebit += itemTotal;

        // Hitung Kredit (Pembayaran pada bulan ini)
        let paidThisMonth = itemPaidTotal;
        if (item.riwayatPembayaran && Array.isArray(item.riwayatPembayaran)) {
          paidThisMonth = item.riwayatPembayaran
            .filter(r => getMonthFromDateStr(r.tanggal) === selectedMonth)
            .reduce((sum, r) => sum + Number(r.jumlah || 0), 0);
        }
        supplierAccountingMap[supNama].kredit += paidThisMonth;
        globalKredit += paidThisMonth;

        const sAkhirItem = itemTotal - paidThisMonth;
        supplierAccountingMap[supNama].saldoAkhir += sAkhirItem;
        if (sAkhirItem > 0) supplierAccountingMap[supNama].fakturBelumLunas += 1;
      }
    }
  });

  // Calculate final Saldo Akhir for all suppliers in map
  Object.values(supplierAccountingMap).forEach(sup => {
    if (selectedMonth !== 'ALL') {
      sup.saldoAkhir = cleanFloat(sup.saldoAwal + sup.debit - sup.kredit);
    }
  });

  globalSaldoAkhir = selectedMonth === 'ALL'
    ? cleanFloat(globalSaldoAkhir)
    : cleanFloat(globalSaldoAwal + globalDebit - globalKredit);

  // Filtered Items for Main Table
  const filteredList = utangList.filter(item => {
    const s = search.toLowerCase();
    const matchSearch = (item.supplier || '').toLowerCase().includes(s) ||
                        (item.noFaktur || '').toLowerCase().includes(s) ||
                        (item.bahanNama || '').toLowerCase().includes(s);

    const itemMonth = getMonthFromDateStr(item.tanggalBeli);
    const matchMonth = selectedMonth === 'ALL' || itemMonth === selectedMonth;

    const matchStatus = statusFilter === 'semua' ||
                        (statusFilter === 'belum_lunas' && item.status !== 'LUNAS') ||
                        (statusFilter === 'lunas' && item.status === 'LUNAS');

    return matchSearch && matchMonth && matchStatus;
  });

  const handleDeleteClick = (item) => {
    const targetId = item.id || item._id || item.noFaktur;
    if (showAlert) {
      showAlert(
        `Hapus faktur utang "${item.noFaktur}" (${item.supplier}) dari daftar?`,
        'danger',
        'Hapus Faktur Pembelian',
        () => onDeleteUtang(targetId),
        true,
        'Hapus',
        'Batal'
      );
    } else {
      onDeleteUtang(targetId);
    }
  };

  const sortedSuppliersList = Object.values(supplierAccountingMap).sort((a, b) => {
    if (b.saldoAkhir !== a.saldoAkhir) return b.saldoAkhir - a.saldoAkhir;
    return a.nama.localeCompare(b.nama);
  });

  return (
    <div className="tab-pane active">
      {/* ===== HEADER & PERIODE BULAN FILTER BAR ===== */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <CreditCard size={22} style={{ color: 'var(--amber)' }} /> Jurnal Utang Supplier (Akuntansi)
            </h2>
            <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem', marginBottom: 0 }}>
              Rekapitulasi Saldo Awal, Debit (Penambahan Utang), Kredit (Pembayaran Cicilan), dan Saldo Akhir.
            </p>
          </div>

          {/* Month Selector Filter Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={15} style={{ color: 'var(--amber)' }} /> Periode Bulan:
            </span>
            <input
              type="month"
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid var(--amber)',
                color: '#f8fafc',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer'
              }}
              value={selectedMonth === 'ALL' ? currentMonthStr : selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />

            <button
              className={`btn btn-sm ${selectedMonth === currentMonthStr ? 'btn-amber' : 'btn-outline'}`}
              onClick={() => setSelectedMonth(currentMonthStr)}
            >
              Bulan Berjalan
            </button>

            <button
              className={`btn btn-sm ${selectedMonth === 'ALL' ? 'btn-amber' : 'btn-outline'}`}
              onClick={() => setSelectedMonth('ALL')}
            >
              Semua Periode
            </button>
          </div>
        </div>
      </div>

      {/* ===== 4 CARDS AKUNTANSI (SALDO AWAL, DEBIT, KREDIT, SALDO AKHIR) ===== */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {/* Card 1: Saldo Awal */}
        <div className="stat-card" style={{ borderTop: '4px solid var(--cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Saldo Awal Utang</span>
            <Wallet size={18} style={{ color: 'var(--cyan)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>
            Rp {formatNumber(globalSaldoAwal)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sisa utang bulan sebelumnya</span>
        </div>

        {/* Card 2: Debit (Penambahan Utang Pembelian Baru) */}
        <div className="stat-card" style={{ borderTop: '4px solid var(--rose)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Debit (Penambahan Utang)</span>
            <ArrowUpRight size={18} style={{ color: 'var(--rose)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--rose)' }}>
            Rp {formatNumber(globalDebit)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total pembelian faktur baru</span>
        </div>

        {/* Card 3: Kredit (Pembayaran / Pelunasan) */}
        <div className="stat-card" style={{ borderTop: '4px solid var(--emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Kredit (Pembayaran Utang)</span>
            <ArrowDownRight size={18} style={{ color: 'var(--emerald)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--emerald)' }}>
            Rp {formatNumber(globalKredit)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total cicilan &amp; pelunasan masuk</span>
        </div>

        {/* Card 4: Saldo Akhir (Sisa Utang Aktif) */}
        <div className="stat-card" style={{ borderTop: '4px solid var(--amber)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Saldo Akhir (Sisa Utang)</span>
            <AlertTriangle size={18} style={{ color: 'var(--amber)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>
            Rp {formatNumber(globalSaldoAkhir)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {selectedMonth === 'ALL' ? 'Total kewajiban utang aktif' : `Saldo akhir per ${selectedMonth}`}
          </span>
        </div>
      </div>

      {/* ===== SALDO UTANG PER SUPPLIER CARDS ===== */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏢 Rincian Saldo Akuntansi per Supplier ({selectedMonth === 'ALL' ? 'Semua Periode' : selectedMonth})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {sortedSuppliersList.map(sup => {
            const isLunas = sup.saldoAkhir <= 0;
            return (
              <div
                key={sup.nama}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isLunas ? 'rgba(52,211,153,0.35)' : 'rgba(245,158,11,0.35)'}`,
                  borderLeft: `4px solid ${isLunas ? 'var(--emerald)' : 'var(--amber)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem 1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{sup.nama}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '0.15rem' }}>
                      {sup.fakturCount > 0 ? `${sup.fakturCount} faktur transaksi` : 'Belum ada transaksi'}
                    </div>
                  </div>
                  {isLunas ? (
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>✓ BERSIH / LUNAS</span>
                  ) : (
                    <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>ADA UTANG</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', background: 'rgba(15,23,42,0.4)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Saldo Awal:</span>
                    <span>Rp {formatNumber(sup.saldoAwal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Debit (Beli Baru):</span>
                    <span style={{ color: 'var(--rose)', fontWeight: 600 }}>+ Rp {formatNumber(sup.debit)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Kredit (Bayar):</span>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>- Rp {formatNumber(sup.kredit)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.3rem', marginTop: '0.1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Saldo Akhir:</span>
                    <span style={{ color: isLunas ? 'var(--emerald)' : 'var(--amber)', fontSize: '0.95rem' }}>
                      Rp {formatNumber(sup.saldoAkhir)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== MAIN TABLE CONTAINER ===== */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Daftar Faktur Pembelian &amp; Cicilan Utang</h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Menampilkan transaksi faktur utang periode <strong>{selectedMonth === 'ALL' ? 'Semua Bulan' : selectedMonth}</strong>.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="select-input"
              style={{ width: '160px', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="semua">Semua Status</option>
              <option value="belum_lunas">Belum Lunas / Partial</option>
              <option value="lunas">Sudah Lunas</option>
            </select>

            <div className="search-box" style={{ maxWidth: '280px' }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Cari Supplier, Faktur, Bahan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>FAKTUR &amp; SUPPLIER</th>
              <th>PEMBELIAN BAHAN BAKU</th>
              <th>DEBIT (TAGIHAN)</th>
              <th>KREDIT (DIBAYAR)</th>
              <th>SALDO AKHIR UTANG</th>
              <th>JATUH TEMPO</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'center' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">
                  Tidak ada catatan tagihan utang supplier pada periode {selectedMonth}.
                </td>
              </tr>
            ) : (
              filteredList.map(item => {
                const isPendingPenerimaan = (item.jumlahDiterima || 0) === 0 && (item.jumlahDibayar || 0) === 0;
                const isLunas = (item.status === 'LUNAS' || item.sisaUtang === 0) && !isPendingPenerimaan;

                return (
                  <tr key={item.id || item._id || item.noFaktur}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--amber)' }}>{item.noFaktur}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{item.supplier}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>Tgl Beli: {item.tanggalBeli}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.bahanNama}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        Order: {formatNumber(item.jumlah)} {item.satuan} @ Rp {formatNumber(item.hargaSatuan)}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: (item.jumlahDiterima || 0) > 0 ? 'var(--cyan)' : 'var(--amber)', marginTop: '0.15rem' }}>
                        📥 Diterima: {formatNumber(item.jumlahDiterima || 0)} / {formatNumber(item.jumlah)} {item.satuan}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--rose)' }}>Rp {formatNumber(item.totalTagihan)}</strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                        Rp {formatNumber(item.jumlahDibayar)}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1rem', color: isPendingPenerimaan ? 'var(--amber)' : (isLunas ? 'var(--emerald)' : 'var(--amber)') }}>
                        Rp {formatNumber(item.sisaUtang)}
                      </strong>
                      {isPendingPenerimaan && (
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Belum Diterima</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isLunas ? 'var(--text-muted)' : 'var(--amber)' }}>
                        📅 {item.jatuhTempo}
                      </div>
                    </td>
                    <td>
                      {isPendingPenerimaan ? (
                        <span className="badge badge-amber">⏳ PENDING RECEIVE</span>
                      ) : isLunas ? (
                        <span className="badge badge-emerald">✓ LUNAS</span>
                      ) : item.jumlahDibayar > 0 ? (
                        <span className="badge badge-amber">CICILAN</span>
                      ) : (
                        <span className="badge badge-rose">BELUM LUNAS</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        {canManage && !isLunas && (
                          <button
                            className="btn btn-emerald btn-sm"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => setSelectedUtangForPay(item)}
                            title="Bayar / Cicil Utang"
                          >
                            <DollarSign size={13} /> Bayar
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => setSelectedUtangForHistory(item)}
                          title="Lihat Riwayat Pembayaran"
                        >
                          <History size={13} /> Riwayat
                        </button>
                        {canManage && activeRoleView === 'ADMIN' && (
                          <button
                            className="btn btn-outline btn-danger btn-sm"
                            style={{ padding: '0.35rem 0.5rem' }}
                            onClick={() => handleDeleteClick(item)}
                            title="Hapus Faktur"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ModalBayarUtangSupplier
        isOpen={!!selectedUtangForPay}
        onClose={() => setSelectedUtangForPay(null)}
        utangRecord={selectedUtangForPay}
        onSubmitPay={onPayUtang}
        showAlert={showAlert}
      />

      <ModalRiwayatBayarSupplier
        isOpen={!!selectedUtangForHistory}
        onClose={() => setSelectedUtangForHistory(null)}
        utangRecord={selectedUtangForHistory}
      />
    </div>
  );
}
