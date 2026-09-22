import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Search, History, CheckCircle, AlertTriangle, DollarSign, Trash2, Calendar, Filter, ArrowUpRight, ArrowDownRight, Wallet, X, ChevronLeft, ChevronRight, Pencil, Save } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalBayarUtangSupplier, ModalRiwayatBayarSupplier } from './Modals';
import { ModernMonthPicker } from './ModernDatePicker';
import { cleanFloat } from '../utils/numberUtils';

const SALDO_AWAL_KEY = 'SAREN_SALDO_AWAL_UTANG';

const loadSaldoAwalManual = () => {
  try { return JSON.parse(localStorage.getItem(SALDO_AWAL_KEY) || '{}'); } catch { return {}; }
};
const saveSaldoAwalManual = (data) => {
  try { localStorage.setItem(SALDO_AWAL_KEY, JSON.stringify(data)); } catch { /* ignore */ }
};

export default function UtangSupplierTab({
  utangList = [],
  suppliersList = [],
  activeRoleView,
  onPayUtang,
  onDeletePaymentUtang,
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
  const [supplierSelectModal, setSupplierSelectModal] = useState(null);
  const [isModalSaldoAwalOpen, setIsModalSaldoAwalOpen] = useState(false);
  const [isModalDebitHistoryOpen, setIsModalDebitHistoryOpen] = useState(false);
  const [modalTargetMonth, setModalTargetMonth] = useState(currentMonthStr);
  const [saldoAwalManual, setSaldoAwalManual] = useState(() => loadSaldoAwalManual());
  const [draftSaldoAwal, setDraftSaldoAwal] = useState({});

  const canManage = (activeRoleView === 'ADMIN' || activeRoleView === 'PEMBELIAN');

  // Key per bulan per supplier: "2026-08::PT. Yoga"
  const getSaldoAwalKey = (month, supplierNama) => `${month}::${supplierNama}`;

  // Direct manual check
  const getExplicitManualSaldo = (month, supplierNama) => {
    const key = getSaldoAwalKey(month, supplierNama);
    if (key in saldoAwalManual) return Number(saldoAwalManual[key]);
    return null;
  };

  // Carry-forward manual adjustment logic
  const getManualSaldoAwal = (month, supplierNama) => {
    if (!month || month === 'ALL') return 0;
    
    // Check direct input for target month
    const directVal = getExplicitManualSaldo(month, supplierNama);
    if (directVal !== null) return directVal;

    // Search earlier months chronologically to carry forward latest manual input
    const keysForSupplier = Object.keys(saldoAwalManual)
      .filter(k => k.endsWith(`::${supplierNama}`))
      .map(k => k.split('::')[0])
      .filter(m => m <= month)
      .sort((a, b) => b.localeCompare(a)); // sort descending (latest first)

    if (keysForSupplier.length > 0) {
      const latestMonth = keysForSupplier[0];
      return Number(saldoAwalManual[getSaldoAwalKey(latestMonth, supplierNama)] || 0);
    }

    return 0;
  };

  const loadDraftForMonth = (month) => {
    const draft = {};
    suppliersList.forEach(sup => {
      const nama = sup.nama || sup.name || '';
      if (nama) draft[nama] = getManualSaldoAwal(month, nama);
    });
    utangList.forEach(item => {
      const nama = item.supplier || '';
      if (nama && !(nama in draft)) draft[nama] = getManualSaldoAwal(month, nama);
    });
    setDraftSaldoAwal(draft);
  };

  const handleOpenSaldoAwalModal = () => {
    const target = (selectedMonth && selectedMonth !== 'ALL') ? selectedMonth : currentMonthStr;
    setModalTargetMonth(target);
    loadDraftForMonth(target);
    setIsModalSaldoAwalOpen(true);
  };

  const handleModalMonthChange = (newMonth) => {
    setModalTargetMonth(newMonth);
    loadDraftForMonth(newMonth);
  };

  const handleSaveSaldoAwal = () => {
    const updated = { ...saldoAwalManual };
    Object.entries(draftSaldoAwal).forEach(([nama, val]) => {
      const key = getSaldoAwalKey(modalTargetMonth, nama);
      const num = Number(String(val).replace(/[^0-9]/g, '')) || 0;
      if (num > 0) updated[key] = num;
      else delete updated[key];
    });
    saveSaldoAwalManual(updated);
    setSaldoAwalManual(updated);
    setIsModalSaldoAwalOpen(false);
  };

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
      const manualSaldo = selectedMonth !== 'ALL' ? getManualSaldoAwal(selectedMonth, nama) : 0;
      supplierAccountingMap[nama] = {
        nama,
        kode: sup.kode || '',
        saldoAwal: manualSaldo,
        kredit: 0,
        debit: 0,
        saldoAkhir: 0,
        fakturCount: 0,
        fakturBelumLunas: 0
      };
      if (selectedMonth !== 'ALL') {
        globalSaldoAwal += manualSaldo;
      }
    }
  });

  utangList.forEach(item => {
    const supNama = item.supplier || 'Supplier Lain';
    if (!supplierAccountingMap[supNama]) {
      const manualSaldo = selectedMonth !== 'ALL' ? getManualSaldoAwal(selectedMonth, supNama) : 0;
      supplierAccountingMap[supNama] = {
        nama: supNama,
        kode: '',
        saldoAwal: manualSaldo,
        kredit: 0,
        debit: 0,
        saldoAkhir: 0,
        fakturCount: 0,
        fakturBelumLunas: 0
      };
      if (selectedMonth !== 'ALL') {
        globalSaldoAwal += manualSaldo;
      }
    }

    const unitHarga = Number(item.hargaSatuan || 0);

    // 1. Dapatkan daftar peristiwa penerimaan fisik (Kredit / Utang bertambah sesuai TANGGAL PENERIMAAN)
    const receiptEvents = [];
    if (item.riwayatPenerimaan && Array.isArray(item.riwayatPenerimaan) && item.riwayatPenerimaan.length > 0) {
      item.riwayatPenerimaan.forEach(r => {
        const rDate = r.tanggal || item.tanggalBeli;
        const rMonth = getMonthFromDateStr(rDate);
        const rAmount = Number(r.jumlah || 0) * unitHarga;
        if (rAmount > 0) receiptEvents.push({ date: rDate, month: rMonth, amount: rAmount });
      });
    } else if (Number(item.jumlahDiterima || 0) > 0) {
      const rDate = item.tanggalBeli;
      const rMonth = getMonthFromDateStr(rDate);
      const rAmount = Number(item.jumlahDiterima || 0) * unitHarga;
      receiptEvents.push({ date: rDate, month: rMonth, amount: rAmount });
    }

    // 2. Dapatkan daftar peristiwa pembayaran (Debit / Utang berkurang sesuai TANGGAL PEMBAYARAN)
    const paymentEvents = [];
    const payList = item.riwayatPembayaran || item.riwayatBayar;
    if (payList && Array.isArray(payList) && payList.length > 0) {
      payList.forEach(p => {
        const pDate = p.tanggal || item.tanggalBeli;
        const pMonth = getMonthFromDateStr(pDate);
        const pAmount = Number(p.jumlah || 0);
        if (pAmount > 0) paymentEvents.push({ date: pDate, month: pMonth, amount: pAmount });
      });
    } else if (Number(item.jumlahDibayar || 0) > 0) {
      const pDate = item.tanggalBeli;
      const pMonth = getMonthFromDateStr(pDate);
      const pAmount = Number(item.jumlahDibayar || 0);
      paymentEvents.push({ date: pDate, month: pMonth, amount: pAmount });
    }

    if (selectedMonth === 'ALL') {
      const totalKredit = receiptEvents.reduce((s, r) => s + r.amount, 0);
      const totalDebit = paymentEvents.reduce((s, p) => s + p.amount, 0);

      supplierAccountingMap[supNama].kredit += totalKredit;
      supplierAccountingMap[supNama].debit += totalDebit;
      supplierAccountingMap[supNama].fakturCount += 1;
      if (totalKredit - totalDebit > 0) supplierAccountingMap[supNama].fakturBelumLunas += 1;

      globalKredit += totalKredit;
      globalDebit += totalDebit;
    } else {
      // Hitung Saldo Awal Transaksi: Total Penerimaan sebelum bulan terpilih MINUS Total Pembayaran sebelum bulan terpilih
      const priorKredit = receiptEvents.filter(r => r.month && r.month < selectedMonth).reduce((s, r) => s + r.amount, 0);
      const priorDebit = paymentEvents.filter(p => p.month && p.month < selectedMonth).reduce((s, p) => s + p.amount, 0);
      const priorNetDebt = Math.max(0, priorKredit - priorDebit);

      supplierAccountingMap[supNama].saldoAwal += priorNetDebt;
      globalSaldoAwal += priorNetDebt;

      // Hitung Kredit & Debit khusus bulan terpilih (berdasarkan TANGGAL PENERIMAAN / PEMBAYARAN)
      const monthKredit = receiptEvents.filter(r => r.month === selectedMonth).reduce((s, r) => s + r.amount, 0);
      const monthDebit = paymentEvents.filter(p => p.month === selectedMonth).reduce((s, p) => s + p.amount, 0);

      const poMonth = getMonthFromDateStr(item.tanggalBeli);
      if (monthKredit > 0 || monthDebit > 0 || poMonth === selectedMonth || priorNetDebt > 0) {
        supplierAccountingMap[supNama].fakturCount += 1;
      }

      supplierAccountingMap[supNama].kredit += monthKredit;
      supplierAccountingMap[supNama].debit += monthDebit;
      globalKredit += monthKredit;
      globalDebit += monthDebit;

      const currentTotalKredit = priorKredit + monthKredit;
      const currentTotalDebit = priorDebit + monthDebit;
      if (currentTotalKredit - currentTotalDebit > 0) supplierAccountingMap[supNama].fakturBelumLunas += 1;
    }
  });

  // Read manual Saldo Awal payment transactions
  let saldoAwalPayments = [];
  try {
    saldoAwalPayments = JSON.parse(localStorage.getItem('SAREN_SALDO_AWAL_PAYMENTS') || '[]');
  } catch (e) { /* ignore */ }

  saldoAwalPayments.forEach(p => {
    const supNama = p.supplier;
    const pMonth = getMonthFromDateStr(p.tanggal) || p.month;
    const amt = Number(p.jumlah || 0);

    if (supplierAccountingMap[supNama]) {
      if (selectedMonth === 'ALL' || pMonth === selectedMonth) {
        supplierAccountingMap[supNama].debit += amt;
        globalDebit += amt;
      } else if (selectedMonth !== 'ALL' && pMonth < selectedMonth) {
        // Prior month payment reduces Saldo Awal carry forward
        supplierAccountingMap[supNama].saldoAwal = Math.max(0, supplierAccountingMap[supNama].saldoAwal - amt);
        globalSaldoAwal = Math.max(0, globalSaldoAwal - amt);
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

  // Filtered Items for Main Table (Only actual purchase invoices)
  const filteredList = utangList.filter(item => {
    const s = search.toLowerCase();
    const matchSearch = (item.supplier || '').toLowerCase().includes(s) ||
                        (item.noFaktur || '').toLowerCase().includes(s) ||
                        (item.bahanNama || '').toLowerCase().includes(s);

    const poMonth = getMonthFromDateStr(item.tanggalBeli);
    const hasReceiptInMonth = (item.riwayatPenerimaan || []).some(r => getMonthFromDateStr(r.tanggal) === selectedMonth);
    const hasPaymentInMonth = (item.riwayatPembayaran || item.riwayatBayar || []).some(p => getMonthFromDateStr(p.tanggal) === selectedMonth);

    const matchMonth = selectedMonth === 'ALL' || poMonth === selectedMonth || hasReceiptInMonth || hasPaymentInMonth;

    const matchStatus = statusFilter === 'semua' ||
                        (statusFilter === 'belum_lunas' && item.status !== 'LUNAS') ||
                        (statusFilter === 'lunas' && item.status === 'LUNAS');

    return matchSearch && matchMonth && matchStatus;
  });

  // Handle Pay Click directly from Supplier Card
  const handlePayFromSupplierCard = (supplierNama, e) => {
    if (e) e.stopPropagation();

    // Get all unpaid invoices for this supplier where goods have been physically received
    const unpaidInvoices = utangList.filter(x => {
      const isSameSupplier = (x.supplier || '').trim().toLowerCase() === (supplierNama || '').trim().toLowerCase();
      const physicalKredit = Number(x.jumlahDiterima || 0) * Number(x.hargaSatuan || 0);
      const sisaUtangFisik = Math.max(0, physicalKredit - Number(x.jumlahDibayar || 0));
      return isSameSupplier && x.status !== 'LUNAS' && sisaUtangFisik > 0;
    });

    const supObj = supplierAccountingMap[supplierNama];
    const targetM = (selectedMonth && selectedMonth !== 'ALL') ? selectedMonth : currentMonthStr;
    const manualAdjustment = getManualSaldoAwal(targetM, supplierNama);

    const allPayableInvoices = [...unpaidInvoices];

    // If supplier has manual Saldo Awal adjustment
    if (manualAdjustment > 0 && supObj) {
      const saPaid = (saldoAwalPayments || [])
        .filter(p => p.supplier === supplierNama && (p.month === targetM || getMonthFromDateStr(p.tanggal) === targetM))
        .reduce((s, p) => s + Number(p.jumlah || 0), 0);
      const saSisa = Math.max(0, manualAdjustment - saPaid);

      if (saSisa > 0) {
        allPayableInvoices.unshift({
          id: `SALDO_AWAL_${targetM}_${supplierNama}`,
          noFaktur: `PENYESUAIAN-SA-${targetM}`,
          supplier: supplierNama,
          bahanNama: 'Penyesuaian Saldo Awal Utang',
          tanggalBeli: `${targetM}-01`,
          jatuhTempo: `${targetM}-28`,
          totalHarga: manualAdjustment,
          jumlahDiterima: 1,
          hargaSatuan: manualAdjustment,
          jumlahDibayar: saPaid,
          sisaUtang: saSisa,
          status: saPaid > 0 ? 'SEBAGIAN' : 'BELUM_LUNAS',
          isManualAdjustment: true
        });
      }
    }

    if (allPayableInvoices.length === 0) {
      if (showAlert) showAlert(`Supplier ${supplierNama} tidak memiliki tunggakan utang aktif.`, 'info', 'Status Utang');
      return;
    }

    if (allPayableInvoices.length === 1) {
      setSelectedUtangForPay(allPayableInvoices[0]);
    } else {
      setSupplierSelectModal({
        supplierNama,
        invoices: allPayableInvoices
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
    const kodeA = a.kode || a.nama || '';
    const kodeB = b.kode || b.nama || '';
    const numA = parseCodeNumber(kodeA);
    const numB = parseCodeNumber(kodeB);
    if (numA !== numB) return numA - numB;

    return kodeA.localeCompare(kodeB, undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* 1. PALING ATAS: Ultra Compact Summary Cards Akuntansi (Sama Persis Pembelian) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {/* Card 1: Saldo Awal Utang */}
        <div className="summary-stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '3px solid var(--cyan)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', position: 'relative', display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Saldo Awal Utang</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {canManage && selectedMonth !== 'ALL' && (
                <button
                  type="button"
                  onClick={handleOpenSaldoAwalModal}
                  title="Atur Saldo Awal Manual per Supplier"
                  style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.35)', color: 'var(--cyan)', borderRadius: '5px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                >
                  <Pencil size={11} />
                </button>
              )}
              <Wallet size={16} style={{ color: 'var(--cyan)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cyan)', marginTop: '0.2rem' }}>
            Rp {formatNumber(globalSaldoAwal)}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Sisa utang bulan sebelumnya
            {Object.keys(saldoAwalManual).some(k => k.startsWith(`${selectedMonth}::`)) && (
              <span style={{ marginLeft: '0.3rem', color: 'var(--cyan)', fontWeight: 700 }}>+ penyesuaian ✓</span>
            )}
          </span>
        </div>

        {/* Card 2: Kredit (Penambahan Utang) */}
        <div className="summary-stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '3px solid var(--rose)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Kredit (Penambahan Utang)</span>
            <ArrowUpRight size={16} style={{ color: 'var(--rose)' }} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--rose)', marginTop: '0.2rem' }}>
            Rp {formatNumber(globalKredit)}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Faktur pembelian baru
          </span>
        </div>

        {/* Card 3: Debit (Pembayaran Utang) */}
        <div
          onClick={() => setIsModalDebitHistoryOpen(true)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderTop: '3px solid var(--emerald)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 0.85rem',
            cursor: 'pointer',
            position: 'relative',
            display: 'block'
          }}
          className="summary-stat-card supplier-card-hover"
          title="Klik untuk melihat seluruh riwayat pembayaran utang"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Debit (Pembayaran Utang)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--emerald)', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, padding: '0.05rem 0.35rem' }}>📜 Riwayat</span>
              <ArrowDownRight size={16} style={{ color: 'var(--emerald)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--emerald)', marginTop: '0.2rem' }}>
            Rp {formatNumber(globalDebit)}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Total cicilan &amp; pelunasan (Klik untuk detail)
          </span>
        </div>

        {/* Card 4: Saldo Akhir Utang */}
        <div className="summary-stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '3px solid var(--amber)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Saldo Akhir Utang</span>
            <AlertTriangle size={16} style={{ color: 'var(--amber)' }} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--amber)', marginTop: '0.2rem' }}>
            Rp {formatNumber(globalSaldoAkhir)}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Saldo utang bulan ini
          </span>
        </div>
      </div>

      {/* 2. DIBAWAHNYA: Toolbar Modern Month Picker di KIRI */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <ModernMonthPicker
          value={selectedMonth}
          onChange={(val) => setSelectedMonth(val)}
          allowAll={true}
        />
      </div>

      {/* ===== SALDO UTANG PER SUPPLIER CAROUSEL ===== */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
            🏢 Rincian Saldo Akuntansi per Supplier ({selectedMonth === 'ALL' ? 'Semua Periode' : selectedMonth})
          </h3>

          {/* Carousel Navigation Arrows */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                const el = document.getElementById('supplier-cards-carousel');
                if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
              }}
              style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
              title="Geser Kiri"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                const el = document.getElementById('supplier-cards-carousel');
                if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
              }}
              style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
              title="Geser Kanan"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          id="supplier-cards-carousel"
          style={{
            display: 'flex',
            gap: '0.75rem',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'thin'
          }}
        >
          {sortedSuppliersList.map(sup => {
            const isLunas = sup.saldoAkhir <= 0;
            const hasActiveDebt = !isLunas && canManage;

            return (
              <div
                key={sup.nama}
                onClick={(e) => hasActiveDebt && handlePayFromSupplierCard(sup.nama, e)}
                style={{
                  flex: '0 0 250px',
                  minWidth: '250px',
                  maxWidth: '250px',
                  background: 'var(--bg-card)',
                  border: `1px solid ${isLunas ? 'rgba(52,211,153,0.35)' : 'rgba(245,158,11,0.5)'}`,
                  borderLeft: `4px solid ${isLunas ? 'var(--emerald)' : 'var(--amber)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 0.9rem',
                  cursor: hasActiveDebt ? 'pointer' : 'default',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  boxShadow: hasActiveDebt ? '0 4px 12px rgba(245, 158, 11, 0.1)' : 'none',
                  boxSizing: 'border-box'
                }}
                className={hasActiveDebt ? 'supplier-card-hover' : ''}
              >
                <div style={{ marginBottom: '0.45rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sup.kode && <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--amber)', fontSize: '0.68rem', fontWeight: 800, padding: '0.05rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.3)', flexShrink: 0 }}>{sup.kode}</span>}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sup.nama}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.68rem', marginTop: '0.1rem' }}>
                    {sup.fakturCount > 0 ? `${sup.fakturCount} faktur transaksi` : 'Belum ada transaksi'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem', background: 'transparent', padding: '0.45rem 0', borderRadius: 'var(--radius-sm)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
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
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.25rem', marginTop: '0.1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                    <span>Saldo Akhir:</span>
                    <span style={{ color: isLunas ? 'var(--emerald)' : 'var(--amber)', fontSize: '0.82rem' }}>
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
                        marginTop: '0.55rem',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: '0 3px 8px rgba(16, 185, 129, 0.25)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      onClick={(e) => handlePayFromSupplierCard(sup.nama, e)}
                    >
                      <DollarSign size={13} /> Bayar Utang
                    </button>
                  ) : (
                    <button
                      className="btn btn-block"
                      disabled
                      style={{
                        marginTop: '0.55rem',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.74rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(148, 163, 184, 0.12)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        cursor: 'not-allowed',
                        opacity: 0.65,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <CheckCircle size={13} /> Tidak Ada Utang / Lunas
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
        <div style={{ padding: '0.45rem 0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>Daftar Faktur Pembelian &amp; Cicilan Utang</h3>
            <span className="text-muted" style={{ fontSize: '0.68rem', display: 'block', marginTop: '0.1rem' }}>Menampilkan transaksi faktur utang periode <strong>{selectedMonth === 'ALL' ? 'Semua Bulan' : selectedMonth}</strong>.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="select-input"
              style={{ width: '195px', padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="semua">Semua Status</option>
              <option value="belum_lunas">Belum Lunas / Partial</option>
              <option value="lunas">Sudah Lunas</option>
            </select>

            <div className="search-box" style={{ maxWidth: '220px', padding: '0.25rem 0.55rem' }}>
              <Search size={13} style={{ color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Cari Supplier, Faktur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: '0.74rem' }}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>NO FAKTUR &amp; SUPPLIER</th>
                <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>PEMBELIAN BAHAN BAKU</th>
                <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>RIWAYAT UTANG (PERTANGGAL)</th>
                <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>TERBAYAR (PERTANGGAL)</th>
                <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                    Tidak ada catatan tagihan utang supplier pada periode {selectedMonth}.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const physicalQtyDiterima = Number(item.jumlahDiterima || 0);
                  const unitHarga = Number(item.hargaSatuan || 0);
                  const physicalKreditVal = physicalQtyDiterima * unitHarga;
                  const itemPaidTotal = Number(item.jumlahDibayar || 0);
                  const physicalSisaUtang = Math.max(0, physicalKreditVal - itemPaidTotal);

                  const isPendingPenerimaan = physicalQtyDiterima === 0 && itemPaidTotal === 0;
                  const isLunas = (item.status === 'LUNAS' || (physicalQtyDiterima > 0 && physicalSisaUtang === 0)) && !isPendingPenerimaan;

                  return (
                    <tr key={item.id || item._id || item.noFaktur} style={{ fontSize: '0.74rem' }}>
                      <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '0.74rem' }}>{item.noFaktur}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>• {item.supplier}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.74rem', color: '#0f172a' }}>{item.bahanNama}</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({formatNumber(item.jumlah)} {item.satuan} @ Rp {formatNumber(item.hargaSatuan)})</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                        <div>
                          <strong style={{ fontSize: '0.74rem', color: physicalKreditVal > 0 ? 'var(--rose)' : 'var(--text-muted)' }}>
                            Rp {formatNumber(physicalKreditVal)}
                          </strong>
                          {physicalKreditVal > 0 && (
                            <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginTop: '0.05rem' }}>
                              📅 {item.tanggalBeli}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                        <div>
                          <strong style={{ color: 'var(--emerald)', fontSize: '0.74rem' }}>
                            Rp {formatNumber(itemPaidTotal)}
                          </strong>
                          {itemPaidTotal > 0 && (
                            <span style={{ fontSize: '0.68rem', color: '#059669', display: 'block', marginTop: '0.05rem', fontWeight: 600 }}>
                              📅 {(item.riwayatPembayaran?.[item.riwayatPembayaran.length - 1]?.tanggal || item.riwayatBayar?.[item.riwayatBayar.length - 1]?.tanggal || item.tanggalBeli)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.3rem 0.75rem', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
                          {canManage && !isLunas && (
                            <button
                              type="button"
                              className="btn btn-emerald btn-sm"
                              style={{ padding: '0.22rem 0.55rem', fontSize: '0.72rem', height: '26px' }}
                              onClick={() => setSelectedUtangForPay(item)}
                              title="Bayar / Cicil Utang"
                            >
                              <DollarSign size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.22rem 0.55rem', fontSize: '0.72rem', height: '26px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => setSelectedUtangForHistory(item)}
                            title="Lihat Riwayat Pembayaran"
                          >
                            <History size={12} /> Riwayat
                          </button>
                          {canManage && activeRoleView === 'ADMIN' && (
                            <button
                              type="button"
                              className="btn btn-outline btn-danger btn-sm"
                              style={{ padding: '0.22rem 0.45rem', fontSize: '0.72rem', height: '26px' }}
                              onClick={() => handleDeleteClick(item)}
                              title="Hapus Faktur"
                            >
                              <Trash2 size={12} />
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
      {supplierSelectModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', padding: '1rem', boxSizing: 'border-box' }}>
          <div className="modal-card" style={{ maxWidth: '520px', width: '100%', borderRadius: '16px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', margin: 'auto', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Pilih Faktur Tagihan Utang</h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Supplier: <strong>{supplierSelectModal.supplierNama}</strong></span>
                </div>
              </div>
              <button type="button" className="btn btn-outline btn-sm" style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSupplierSelectModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.15rem 1.25rem', background: '#ffffff' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                💡 <span>Supplier ini memiliki <strong>{supplierSelectModal.invoices.length} faktur utang aktif</strong>. Klik <strong>"Bayar Faktur Ini"</strong> pada faktur yang ingin diproses:</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '340px', overflowY: 'auto' }}>
                {supplierSelectModal.invoices.map(inv => {
                  const isAdj = inv.isManualAdjustment;
                  return (
                    <div
                      key={inv.id || inv._id || inv.noFaktur}
                      style={{
                        background: isAdj ? '#fffbeb' : '#ffffff',
                        border: `1px solid ${isAdj ? '#fde68a' : '#cbd5e1'}`,
                        borderLeft: `4px solid ${isAdj ? '#d97706' : '#0284c7'}`,
                        borderRadius: '10px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: isAdj ? '#d97706' : 'var(--primary)', fontSize: '0.88rem' }}>{inv.noFaktur}</span>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isAdj ? '#92400e' : '#0f172a', background: isAdj ? 'rgba(245, 158, 11, 0.2)' : '#f1f5f9', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                            {isAdj ? '⚙️ Saldo Awal (Penyesuaian)' : inv.bahanNama}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
                          📅 Beli: {inv.tanggalBeli} • ⏳ Tempo: {inv.jatuhTempo}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e11d48', marginTop: '0.2rem' }}>
                          Sisa Utang: Rp {formatNumber(inv.sisaUtang)}
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          background: isAdj ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: isAdj ? '0 3px 10px rgba(217, 119, 6, 0.3)' : '0 3px 10px rgba(5, 150, 105, 0.3)',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => {
                          setSupplierSelectModal(null);
                          setSelectedUtangForPay(inv);
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <DollarSign size={13} /> Bayar Faktur Ini
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
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
        onDeletePayment={onDeletePaymentUtang}
      />

      {/* MODAL SALDO AWAL BULAN (PENYESUAIAN MANUAL) */}
      {isModalSaldoAwalOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 3rem 1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              position: 'relative'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pencil size={18} style={{ color: '#06b6d4' }} /> Atur Saldo Awal Utang (Penyesuaian)
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Pilih bulan target dan masukkan sisa utang berjalan tanpa input mundur.
              </p>
              <button
                type="button"
                onClick={() => setIsModalSaldoAwalOpen(false)}
                style={{
                  position: 'absolute',
                  right: '1.25rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {/* Opsi Pilih Bulan Target */}
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>🗓️ Bulan Periode Penyesuaian</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Pilih bulan yang ingin diatur saldo awalnya</div>
                </div>
                <ModernMonthPicker
                  value={modalTargetMonth}
                  onChange={(newMonth) => handleModalMonthChange(newMonth)}
                  allowAll={false}
                  variant="dark"
                />
              </div>

              <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '1rem', background: '#f0f9ff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                💡 <strong>Catatan:</strong> Nilai ini akan ditambahkan sebagai <strong>Saldo Awal Utang</strong> khusus untuk periode <strong>{modalTargetMonth}</strong>.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.keys(draftSaldoAwal).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.8rem' }}>
                    Belum ada data supplier. Tambahkan supplier di master terlebih dahulu.
                  </div>
                ) : (
                  Object.keys(draftSaldoAwal)
                    .sort((supNamaA, supNamaB) => {
                      const supA = suppliersList.find(s => (s.nama || s.name) === supNamaA) || {};
                      const supB = suppliersList.find(s => (s.nama || s.name) === supNamaB) || {};
                      const kodeA = supA.kode || supNamaA;
                      const kodeB = supB.kode || supNamaB;
                      const numA = parseCodeNumber(kodeA);
                      const numB = parseCodeNumber(kodeB);
                      if (numA !== numB) return numA - numB;
                      return kodeA.localeCompare(kodeB, undefined, { numeric: true, sensitivity: 'base' });
                    })
                    .map((supNama) => {
                      const supObj = suppliersList.find(s => (s.nama || s.name) === supNama);
                      const kode = supObj?.kode || '';
                      return (
                        <div key={supNama} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: '#f8fafc', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {kode && (
                              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', fontSize: '0.68rem', fontWeight: 800, padding: '0.05rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.3)', flexShrink: 0 }}>
                                {kode}
                              </span>
                            )}
                            {supNama}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Rp</span>
                            <input
                              type="text"
                              value={draftSaldoAwal[supNama] ? formatNumber(draftSaldoAwal[supNama]) : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setDraftSaldoAwal(prev => ({ ...prev, [supNama]: val ? Number(val) : 0 }));
                              }}
                              placeholder="0"
                              style={{
                                width: '130px',
                                padding: '0.35rem 0.6rem',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                textAlign: 'right',
                                outline: 'none'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsModalSaldoAwalOpen(false)}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSaldoAwal}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Save size={14} /> Simpan Saldo Awal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== MODAL RIWAYAT SELURUH PEMBAYARAN UTANG (DEBIT) ===== */}
      {isModalDebitHistoryOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowDownRight size={22} /> Jurnal & Riwayat Pembayaran Utang (Debit)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                  Periode: <strong>{selectedMonth === 'ALL' ? 'Semua Periode' : selectedMonth}</strong> • Total Terbayar: <strong style={{ color: '#34d399' }}>Rp {formatNumber(globalDebit)}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalDebitHistoryOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Table of all payments */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {(() => {
                const allDebitRecords = [];
                // Collect payments from PO Invoices
                utangList.forEach(item => {
                  const supNama = item.supplier || 'Supplier Lain';
                  const payList = item.riwayatPembayaran || item.riwayatBayar;
                  if (payList && Array.isArray(payList) && payList.length > 0) {
                    payList.forEach((p, pIdx) => {
                      const pDate = p.tanggal || item.tanggalBeli;
                      const pMonth = getMonthFromDateStr(pDate);
                      const pAmt = Number(p.jumlah || 0);
                      if (pAmt > 0 && (selectedMonth === 'ALL' || pMonth === selectedMonth)) {
                        allDebitRecords.push({
                          id: p.id || `${item.id}-${pDate}-${pAmt}`,
                          tanggal: pDate,
                          supplier: supNama,
                          noFaktur: item.noFaktur || '-',
                          keterangan: p.metode ? `Pembayaran via ${p.metode} (${p.catatan || 'Cicilan/Pelunasan'})` : (p.catatan || 'Pembayaran Faktur Utang'),
                          jumlah: pAmt,
                          sumber: 'Faktur PO',
                          parentRecord: item,
                          paymentItem: p,
                          paymentIndex: pIdx
                        });
                      }
                    });
                  } else if (Number(item.jumlahDibayar || 0) > 0) {
                    const pDate = item.tanggalBeli;
                    const pMonth = getMonthFromDateStr(pDate);
                    const pAmt = Number(item.jumlahDibayar || 0);
                    if (selectedMonth === 'ALL' || pMonth === selectedMonth) {
                      allDebitRecords.push({
                        id: `dibayar-${item.id}`,
                        tanggal: pDate,
                        supplier: supNama,
                        noFaktur: item.noFaktur || '-',
                        keterangan: 'Pembayaran DP / Awal Faktur',
                        jumlah: pAmt,
                        sumber: 'Faktur PO',
                        parentRecord: item,
                        paymentItem: { tanggal: pDate, jumlah: pAmt, catatan: 'DP / Awal Faktur' },
                        paymentIndex: 0
                      });
                    }
                  }
                });

                // Collect manual saldo awal payments
                let saldoAwalPayments = [];
                try {
                  saldoAwalPayments = JSON.parse(localStorage.getItem('SAREN_SALDO_AWAL_PAYMENTS') || '[]');
                } catch (e) { /* ignore */ }

                saldoAwalPayments.forEach((p, pIdx) => {
                  const pMonth = getMonthFromDateStr(p.tanggal) || p.month;
                  const amt = Number(p.jumlah || 0);
                  if (amt > 0 && (selectedMonth === 'ALL' || pMonth === selectedMonth)) {
                    allDebitRecords.push({
                      id: p.id || `saldoawal-${p.tanggal}-${amt}`,
                      tanggal: p.tanggal,
                      supplier: p.supplier,
                      noFaktur: 'SALDO AWAL',
                      keterangan: p.catatan ? `Pelunasan Saldo Awal (${p.catatan})` : 'Pembayaran Cicilan Saldo Awal',
                      jumlah: amt,
                      sumber: 'Saldo Awal',
                      parentRecord: { isManualAdjustment: true, id: `SALDO_AWAL_${p.month || getMonthFromDateStr(p.tanggal)}_${p.supplier}` },
                      paymentItem: { ...p, paymentId: p.id },
                      paymentIndex: pIdx
                    });
                  }
                });

                // Sort descending by date
                allDebitRecords.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

                if (allDebitRecords.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Belum Ada Riwayat Pembayaran Utang (Debit)</p>
                      <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>Tidak ada transaksi pembayaran utang pada periode {selectedMonth === 'ALL' ? 'semua bulan' : selectedMonth}.</span>
                    </div>
                  );
                }

                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#1e293b' }}>Tanggal</th>
                        <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#1e293b' }}>Supplier</th>
                        <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#1e293b' }}>No. Faktur</th>
                        <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#1e293b' }}>Keterangan & Catatan</th>
                        <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#10b981', textAlign: 'right' }}>Nominal Dibayar (Debit)</th>
                        <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#e11d48', textAlign: 'center', width: '50px' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allDebitRecords.map((rec, idx) => (
                        <tr key={rec.id + idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {rec.tanggal}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#0f172a' }}>
                            {rec.supplier}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem' }}>
                            <span style={{
                              background: rec.sumber === 'Saldo Awal' ? 'rgba(6,182,212,0.12)' : 'rgba(2,132,199,0.1)',
                              color: rec.sumber === 'Saldo Awal' ? '#0891b2' : '#0284c7',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '5px',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              border: '1px solid rgba(2,132,199,0.2)'
                            }}>
                              {rec.noFaktur}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', color: '#475569' }}>
                            {rec.keterangan}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#10b981', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            Rp {formatNumber(rec.jumlah)}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              title="Hapus Pembayaran Ini"
                              onClick={() => {
                                if (showAlert) {
                                  showAlert(
                                    `Apakah Anda yakin ingin menghapus pembayaran Rp ${formatNumber(rec.jumlah)} (${rec.supplier} - ${rec.tanggal})?`,
                                    'danger',
                                    'Hapus Pembayaran Utang',
                                    () => {
                                      if (onDeletePaymentUtang) {
                                        onDeletePaymentUtang(rec.parentRecord, rec.paymentItem, rec.paymentIndex);
                                      }
                                    },
                                    true,
                                    'Ya, Hapus'
                                  );
                                }
                              }}
                              style={{
                                background: '#ffe4e6',
                                border: '1px solid #fecdd3',
                                color: '#e11d48',
                                borderRadius: '6px',
                                width: '28px',
                                height: '28px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                        <td colSpan={4} style={{ padding: '0.75rem 0.85rem', fontWeight: 800, textAlign: 'right', color: '#1e293b' }}>
                          TOTAL DEBIT PEMBAYARAN:
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontWeight: 800, fontSize: '0.95rem', color: '#10b981', textAlign: 'right' }}>
                          Rp {formatNumber(globalDebit)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsModalDebitHistoryOpen(false)}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
