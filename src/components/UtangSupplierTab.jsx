import React, { useState } from 'react';
import { CreditCard, Search, History, CheckCircle, AlertTriangle, DollarSign, Trash2, Calendar, Filter, ArrowUpRight, ArrowDownRight, Wallet, X } from 'lucide-react';
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
  const [supplierSelectModal, setSupplierSelectModal] = useState(null); // Supplier name for multi-invoice selection modal

  const canManage = (activeRoleView === 'ADMIN' || activeRoleView === 'PEMBELIAN');

  // Helper to extract YYYY-MM from date string
  const getMonthFromDateStr = (dateStr) => {
    if (!dateStr) return '';
    const clean = dateStr.trim();
    if (clean.length >= 7) return clean.substring(0, 7);
    return '';
  };

  // ===== STANDARD ACCOUNTING CALCULATIONS (KREDIT = PENAMBAHAN UTANG, DEBIT = PEMBAYARAN UTANG) =====
  let globalSaldoAwal = 0;
  let globalKredit = 0; // Kredit = Penambahan Utang (Faktur Pembelian Baru)
  let globalDebit = 0;  // Debit = Pengurangan Utang (Pembayaran Cicilan/Pelunasan)
  let globalSaldoAkhir = 0;

  const supplierAccountingMap = {};
  suppliersList.forEach(sup => {
    const nama = sup.nama || sup.name || '';
    if (nama) {
      supplierAccountingMap[nama] = {
        nama,
        kode: sup.kode || '',
        saldoAwal: 0,
        kredit: 0,
        debit: 0,
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
        kredit: 0,
        debit: 0,
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
      supplierAccountingMap[supNama].saldoAwal += 0;
      supplierAccountingMap[supNama].kredit += itemTotal;
      supplierAccountingMap[supNama].debit += itemPaidTotal;
      supplierAccountingMap[supNama].fakturCount += 1;
      if (item.status !== 'LUNAS' && itemSisa > 0) supplierAccountingMap[supNama].fakturBelumLunas += 1;

      globalKredit += itemTotal;
      globalDebit += itemPaidTotal;
    } else {
      if (itemMonth && itemMonth < selectedMonth) {
        if (itemSisa > 0 || item.status !== 'LUNAS') {
          supplierAccountingMap[supNama].saldoAwal += itemSisa;
          globalSaldoAwal += itemSisa;
        }
      } else if (itemMonth === selectedMonth) {
        supplierAccountingMap[supNama].kredit += itemTotal;
        supplierAccountingMap[supNama].fakturCount += 1;
        globalKredit += itemTotal;

        let paidThisMonth = itemPaidTotal;
        if (item.riwayatPembayaran && Array.isArray(item.riwayatPembayaran) && item.riwayatPembayaran.length > 0) {
          paidThisMonth = item.riwayatPembayaran
            .filter(r => getMonthFromDateStr(r.tanggal) === selectedMonth)
            .reduce((sum, r) => sum + Number(r.jumlah || 0), 0);
        }
        supplierAccountingMap[supNama].debit += paidThisMonth;
        globalDebit += paidThisMonth;

        if (itemTotal - paidThisMonth > 0) supplierAccountingMap[supNama].fakturBelumLunas += 1;
      }
    }
  });

  // Calculate final Saldo Akhir for each supplier: Saldo Awal + Kredit - Debit
  Object.values(supplierAccountingMap).forEach(sup => {
    sup.saldoAwal = cleanFloat(sup.saldoAwal);
    sup.kredit = cleanFloat(sup.kredit);
    sup.debit = cleanFloat(sup.debit);
    sup.saldoAkhir = cleanFloat(sup.saldoAwal + sup.kredit - sup.debit);
  });

  globalSaldoAwal = cleanFloat(globalSaldoAwal);
  globalKredit = cleanFloat(globalKredit);
  globalDebit = cleanFloat(globalDebit);
  // STRICT ACCOUNTING EQUATION: Saldo Akhir = Saldo Awal + Kredit - Debit
  globalSaldoAkhir = cleanFloat(globalSaldoAwal + globalKredit - globalDebit);

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

  // Handle Pay Click directly from Supplier Card
  const handlePayFromSupplierCard = (supplierNama, e) => {
    if (e) e.stopPropagation();

    // Get all unpaid invoices for this supplier
    const unpaidInvoices = utangList.filter(
      x => (x.supplier || '').trim().toLowerCase() === (supplierNama || '').trim().toLowerCase() &&
           x.status !== 'LUNAS' &&
           (x.sisaUtang || 0) > 0
    );

    if (unpaidInvoices.length === 0) {
      if (showAlert) showAlert(`Supplier ${supplierNama} tidak memiliki tunggakan utang aktif.`, 'info', 'Status Utang');
      return;
    }

    if (unpaidInvoices.length === 1) {
      setSelectedUtangForPay(unpaidInvoices[0]);
    } else {
      setSupplierSelectModal({
        supplierNama,
        invoices: unpaidInvoices
      });
    }
  };

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

  const parseCodeNumber = (str) => {
    if (!str) return 999999;
    const match = String(str).match(/\d+/);
    return match ? parseInt(match[0], 10) : 999999;
  };

  const sortedSuppliersList = Object.values(supplierAccountingMap).sort((a, b) => {
    if (b.saldoAkhir !== a.saldoAkhir) return b.saldoAkhir - a.saldoAkhir;

    const kodeA = a.kode || a.nama || '';
    const kodeB = b.kode || b.nama || '';
    const numA = parseCodeNumber(kodeA);
    const numB = parseCodeNumber(kodeB);
    if (numA !== numB) return numA - numB;

    return kodeA.localeCompare(kodeB, undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* ===== PERIODE BULAN FILTER BAR ===== */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.25rem' }}>
        {/* Month Selector Filter Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                padding: '0.45rem 0.75rem',
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

      {/* ===== 4 CARDS AKUNTANSI RESPONSIVE GRID ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Card 1: Saldo Awal Utang */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderTop: '4px solid var(--cyan)',
          borderRadius: 'var(--radius-md)',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Saldo Awal Utang</span>
            <Wallet size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
          </div>
          <div style={{
            fontSize: 'clamp(1.15rem, 2vw, 1.45rem)',
            fontWeight: 800,
            color: 'var(--cyan)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Rp {formatNumber(globalSaldoAwal)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sisa utang bulan sebelumnya</span>
        </div>

        {/* Card 2: Kredit (Penambahan Utang Pembelian Baru) */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderTop: '4px solid var(--rose)',
          borderRadius: 'var(--radius-md)',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Kredit (Penambahan Utang)</span>
            <ArrowUpRight size={18} style={{ color: 'var(--rose)', flexShrink: 0 }} />
          </div>
          <div style={{
            fontSize: 'clamp(1.15rem, 2vw, 1.45rem)',
            fontWeight: 800,
            color: 'var(--rose)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Rp {formatNumber(globalKredit)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Faktur pembelian baru</span>
        </div>

        {/* Card 3: Debit (Pengurangan Utang / Pembayaran Pelunasan) */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderTop: '4px solid var(--emerald)',
          borderRadius: 'var(--radius-md)',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Debit (Pembayaran Utang)</span>
            <ArrowDownRight size={18} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
          </div>
          <div style={{
            fontSize: 'clamp(1.15rem, 2vw, 1.45rem)',
            fontWeight: 800,
            color: 'var(--emerald)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Rp {formatNumber(globalDebit)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total cicilan &amp; pelunasan</span>
        </div>

        {/* Card 4: Saldo Akhir Utang */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderTop: '4px solid var(--amber)',
          borderRadius: 'var(--radius-md)',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Saldo Akhir Utang</span>
            <AlertTriangle size={18} style={{ color: 'var(--amber)', flexShrink: 0 }} />
          </div>
          <div style={{
            fontSize: 'clamp(1.15rem, 2vw, 1.45rem)',
            fontWeight: 800,
            color: 'var(--amber)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Rp {formatNumber(globalSaldoAkhir)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Saldo utang bulan ini
          </span>
        </div>
      </div>

      {/* ===== SALDO UTANG PER SUPPLIER CARDS ===== */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏢 Rincian Saldo Akuntansi per Supplier ({selectedMonth === 'ALL' ? 'Semua Periode' : selectedMonth})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {sortedSuppliersList.map(sup => {
            const isLunas = sup.saldoAkhir <= 0;
            const hasActiveDebt = !isLunas && canManage;

            return (
              <div
                key={sup.nama}
                onClick={(e) => hasActiveDebt && handlePayFromSupplierCard(sup.nama, e)}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isLunas ? 'rgba(52,211,153,0.35)' : 'rgba(245,158,11,0.5)'}`,
                  borderLeft: `4px solid ${isLunas ? 'var(--emerald)' : 'var(--amber)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem 1.25rem',
                  cursor: hasActiveDebt ? 'pointer' : 'default',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  boxShadow: hasActiveDebt ? '0 4px 12px rgba(245, 158, 11, 0.1)' : 'none'
                }}
                className={hasActiveDebt ? 'supplier-card-hover' : ''}
              >
                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {sup.kode && <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--amber)', fontSize: '0.75rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.3)' }}>{sup.kode}</span>}
                    <span>{sup.nama}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '0.15rem' }}>
                    {sup.fakturCount > 0 ? `${sup.fakturCount} faktur transaksi` : 'Belum ada transaksi'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', background: 'rgba(15,23,42,0.4)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Saldo Awal:</span>
                    <span>Rp {formatNumber(sup.saldoAwal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Kredit:</span>
                    <span style={{ color: 'var(--rose)', fontWeight: 600 }}>+ Rp {formatNumber(sup.kredit)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Debit:</span>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>- Rp {formatNumber(sup.debit)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.3rem', marginTop: '0.1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Saldo Akhir:</span>
                    <span style={{ color: isLunas ? 'var(--emerald)' : 'var(--amber)', fontSize: '0.95rem' }}>
                      Rp {formatNumber(sup.saldoAkhir)}
                    </span>
                  </div>
                </div>

                {/* ===== ACTION BUTTON INSIDE CARD ===== */}
                {canManage && (
                  !isLunas ? (
                    <button
                      className="btn btn-emerald btn-block"
                      style={{
                        marginTop: '0.85rem',
                        padding: '0.5rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        gap: '0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => handlePayFromSupplierCard(sup.nama, e)}
                    >
                      <DollarSign size={15} /> Bayar Utang ({sup.nama})
                    </button>
                  ) : (
                    <button
                      className="btn btn-block"
                      disabled
                      style={{
                        marginTop: '0.85rem',
                        padding: '0.5rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        gap: '0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(148, 163, 184, 0.12)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        cursor: 'not-allowed',
                        opacity: 0.65
                      }}
                    >
                      <CheckCircle size={15} /> Tidak Ada Utang / Lunas
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== MAIN TABLE CONTAINER ===== */}
      <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
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

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '850px' }}>
            <thead>
              <tr>
                <th>FAKTUR &amp; SUPPLIER</th>
                <th>PEMBELIAN BAHAN BAKU</th>
                <th>KREDIT (PENAMBAHAN UTANG)</th>
                <th>DEBIT (PEMBAYARAN DIBAYAR)</th>
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
      </div>

      {/* ===== MULTI-INVOICE SUPPLIER SELECTOR MODAL ===== */}
      {supplierSelectModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>💳 Pilih Faktur Tagihan ({supplierSelectModal.supplierNama})</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSupplierSelectModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem' }}>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                Supplier ini memiliki {supplierSelectModal.invoices.length} faktur utang aktif. Pilih faktur yang ingin Anda bayar/cicil:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                {supplierSelectModal.invoices.map(inv => (
                  <div
                    key={inv.id || inv._id || inv.noFaktur}
                    style={{
                      background: 'var(--bg-darker)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '0.9rem' }}>{inv.noFaktur}</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{inv.bahanNama}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Tgl Beli: {inv.tanggalBeli} · Tempo: {inv.jatuhTempo}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--rose)', marginTop: '0.2rem' }}>
                        Sisa Utang: Rp {formatNumber(inv.sisaUtang)}
                      </div>
                    </div>
                    <button
                      className="btn btn-emerald btn-sm"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}
                      onClick={() => {
                        setSupplierSelectModal(null);
                        setSelectedUtangForPay(inv);
                      }}
                    >
                      <DollarSign size={14} /> Bayar Faktur Ini
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
