import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Search, DollarSign, Clock, CheckCircle2, User, Users, Phone, MapPin, Eye, PlusCircle, Check, X, AlertCircle, ArrowDownLeft, ArrowUpRight, Download, FileText, Trash2, Plus, Wallet, Pencil, Save, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { ModernMonthPicker, ModernSearchableSelect } from './ModernDatePicker';
import { cleanFloat } from '../utils/numberUtils';

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

const parseCodeNumber = (str) => {
  if (!str) return 999999;
  const match = String(str).match(/\d+/);
  return match ? parseInt(match[0], 10) : 999999;
};

const SALDO_AWAL_PIUTANG_KEY = 'SAREN_SALDO_AWAL_PIUTANG';

const loadSaldoAwalManual = () => {
  try { return JSON.parse(localStorage.getItem(SALDO_AWAL_PIUTANG_KEY) || '{}'); } catch { return {}; }
};
const saveSaldoAwalManual = (data) => {
  try { localStorage.setItem(SALDO_AWAL_PIUTANG_KEY, JSON.stringify(data)); } catch { /* ignore */ }
};

export default function PiutangPelangganTab({
  pelangganList = [],
  penjualanList = [],
  pembayaranMasukList = [],
  activeRoleView,
  activeUser,
  onUpdatePelanggan,
  onUpdatePenjualan,
  onCreatePembayaranMasuk,
  onDeletePembayaranMasuk,
  onOpenPdfPreview,
  showAlert
}) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [kategoriFilter, setKategoriFilter] = useState('');
  
  // Modal States Saldo Awal Manual, Import, & Riwayat Setoran
  const [isModalSaldoAwalOpen, setIsModalSaldoAwalOpen] = useState(false);
  const [showImportSaldoModal, setShowImportSaldoModal] = useState(false);
  const [isModalDebitHistoryOpen, setIsModalDebitHistoryOpen] = useState(false);
  const [modalTargetMonth, setModalTargetMonth] = useState(currentMonthStr);
  const [saldoAwalManual, setSaldoAwalManual] = useState(() => loadSaldoAwalManual());
  const [draftSaldoAwal, setDraftSaldoAwal] = useState({});

  // Payment Modal States
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showKwitansi, setShowKwitansi] = useState(null);

  const [formPay, setFormPay] = useState({
    pelangganId: '',
    namaPelanggan: '',
    kodePelanggan: '',
    noFaktur: '',
    tanggal: new Date().toISOString().slice(0, 10),
    jumlahBayar: '',
    metodePembayaran: 'Transfer Bank',
    noReferensi: '',
    catatan: ''
  });

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'SALES'].includes(activeRoleView);

  const getSaldoAwalKey = (month, namaCust) => `${month}::${namaCust}`;

  const getExplicitManualSaldo = (month, namaCust) => {
    const key = getSaldoAwalKey(month, namaCust);
    if (key in saldoAwalManual) return Number(saldoAwalManual[key]);
    return null;
  };

  const getManualSaldoAwal = (month, namaCust) => {
    if (!month || month === 'ALL') return 0;
    const directVal = getExplicitManualSaldo(month, namaCust);
    if (directVal !== null) return directVal;

    const keysForCust = Object.keys(saldoAwalManual)
      .filter(k => k.endsWith(`::${namaCust}`))
      .map(k => k.split('::')[0])
      .filter(m => m <= month)
      .sort((a, b) => b.localeCompare(a));

    if (keysForCust.length > 0) {
      const latestMonth = keysForCust[0];
      return Number(saldoAwalManual[getSaldoAwalKey(latestMonth, namaCust)] || 0);
    }
    return 0;
  };

  const loadDraftForMonth = (month) => {
    const draft = {};
    (pelangganList || []).forEach(p => {
      const nama = p.nama || '';
      if (nama) draft[nama] = getManualSaldoAwal(month, nama);
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

  const handleDownloadTemplateSaldoAwal = () => {
    const data = [
      { 'Kode Pelanggan': 'C1', 'Nama Pelanggan': 'RSB Pusat', 'Saldo Awal (Rp)': 1500000 },
      { 'Kode Pelanggan': 'C2', 'Nama Pelanggan': 'RSB Sawo', 'Saldo Awal (Rp)': 750000 },
      { 'Kode Pelanggan': 'C3', 'Nama Pelanggan': 'RSB Ciroyom', 'Saldo Awal (Rp)': 0 }
    ];
    exportToExcel(`Template_Saldo_Awal_Piutang_${modalTargetMonth}`, ['Kode Pelanggan', 'Nama Pelanggan', 'Saldo Awal (Rp)'], data.map(d => [d['Kode Pelanggan'], d['Nama Pelanggan'], d['Saldo Awal (Rp)']]));
  };

  const handleImportExcelSaldoAwal = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          if (showAlert) showAlert('File Excel kosong atau format tidak sesuai!', 'error');
          return;
        }

        const newDraft = { ...draftSaldoAwal };
        let matchCount = 0;

        rawJson.forEach(row => {
          const kode = String(row['Kode Pelanggan'] || row['Kode'] || '').trim().toUpperCase();
          const nama = String(row['Nama Pelanggan'] || row['Nama Toko'] || row['Nama'] || '').trim();
          const saldo = Number(row['Saldo Awal (Rp)'] || row['Saldo Awal'] || row['Total Piutang'] || row['Saldo'] || 0);

          // Match by Kode or Nama Pelanggan
          const found = (pelangganList || []).find(p => {
            const pKode = (p.kode || '').trim().toUpperCase();
            const pNama = (p.nama || '').trim().toLowerCase();
            return (kode && pKode === kode) || (nama && pNama === nama.toLowerCase());
          });

          if (found) {
            newDraft[found.nama] = saldo;
            matchCount++;
          }
        });

        setDraftSaldoAwal(newDraft);
        if (showAlert) {
          showAlert(`Berhasil membaca ${matchCount} saldo awal dari file Excel! Klik "Simpan Saldo Awal" untuk menyimpan. 🎉`, 'success', 'Import Saldo Awal');
        }
      } catch (err) {
        if (showAlert) showAlert(`Gagal membaca Excel: ${err.message}`, 'error');
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const getMonthFromDateStr = (dateStr) => {
    if (!dateStr) return '';
    const clean = String(dateStr).trim();
    if (clean.length >= 7) return clean.substring(0, 7);
    return '';
  };

  // Helper untuk mendapatkan Sisa Piutang Aktif (Saldo Akhir) untuk pelanggan tertentu
  const getNetPiutangForCustomer = (p) => {
    if (!p) return 0;
    const cId = (p.id || p._id || '').toString();
    const custName = p.nama?.trim().toLowerCase();

    let found = customerAccountingMap[cId];
    if (!found && custName) {
      found = Object.values(customerAccountingMap).find(c => c.nama.trim().toLowerCase() === custName);
    }
    return found ? found.saldoAkhir : (Number(p.totalPiutang) || 0);
  };

  // ===== KALKULASI PERBULAN PER PELANGGAN (AKUNTANSI KREDIT & DEBIT PIUTANG) =====
  const customerAccountingMap = useMemo(() => {
    const map = {};

    // Inisialisasi dari Master Pelanggan (Hanya mengambil Saldo Awal Murni jika di-set manual / di-import)
    (pelangganList || []).forEach(p => {
      const cId = (p.id || p._id || '').toString();
      const name = p.nama || '';
      const manualSaldo = selectedMonth !== 'ALL' ? getManualSaldoAwal(selectedMonth, name) : 0;

      map[cId] = {
        id: cId,
        kode: p.kode || '',
        nama: name,
        kategoriCustomer: p.kategoriCustomer || 'Umum',
        sistemPembayaran: p.sistemPembayaran || 'COD',
        noHp: p.noHp || '',
        alamat: p.alamat || '',
        raw: p,
        saldoAwal: manualSaldo,
        piutangBaru: 0, // Kredit piutang baru bulan ini
        pembayaran: 0,  // Setoran masuk bulan ini
        saldoAkhir: 0
      };
    });

    // 1. Penjualan (Semua Penjualan Tunai & Tempo menambah transaksi Penjualan/Piutang Baru)
    (penjualanList || []).forEach(pj => {
      const pjCustId = (pj.pelangganId || '').toString();
      const custName = pj.namaPelanggan?.trim().toLowerCase();
      let matchedId = pjCustId && map[pjCustId] ? pjCustId : null;

      if (!matchedId && custName) {
        matchedId = Object.keys(map).find(k => map[k].nama.trim().toLowerCase() === custName);
      }

      if (matchedId) {
        const pjDate = pj.tanggal || pj.createdAt;
        const pjMonth = getMonthFromDateStr(pjDate);
        const amount = Number(pj.totalBersih) || Number(pj.totalHarga) || 0;

        if (amount > 0) {
          if (selectedMonth === 'ALL') {
            map[matchedId].piutangBaru += amount;
          } else if (pjMonth === selectedMonth) {
            map[matchedId].piutangBaru += amount;
          }
        }
      }
    });

    // 2. Pembayaran Masuk / Setoran (Pengurangan Piutang)
    (pembayaranMasukList || []).forEach(pm => {
      const pmCustId = (pm.pelangganId || '').toString();
      const custName = pm.namaPelanggan?.trim().toLowerCase();
      let matchedId = pmCustId && map[pmCustId] ? pmCustId : null;

      if (!matchedId && custName) {
        matchedId = Object.keys(map).find(k => map[k].nama.trim().toLowerCase() === custName);
      }

      if (matchedId) {
        const pmDate = pm.tanggal || pm.createdAt;
        const pmMonth = getMonthFromDateStr(pmDate);
        const amount = Number(pm.jumlahBayar) || 0;

        if (amount > 0) {
          if (selectedMonth === 'ALL') {
            map[matchedId].pembayaran += amount;
          } else if (pmMonth === selectedMonth) {
            map[matchedId].pembayaran += amount;
          }
        }
      }
    });

    // Hitung Saldo Akhir Piutang per Pelanggan = Saldo Awal + Piutang Baru - Pembayaran
    Object.values(map).forEach(c => {
      c.saldoAwal = cleanFloat(c.saldoAwal);
      c.piutangBaru = cleanFloat(c.piutangBaru);
      c.pembayaran = cleanFloat(c.pembayaran);
      c.saldoAkhir = cleanFloat(Math.max(0, c.saldoAwal + c.piutangBaru - c.pembayaran));
    });

    return map;
  }, [pelangganList, penjualanList, pembayaranMasukList, selectedMonth]);

  // Aggregate Ringkasan Global Saldo Awal, Piutang, Pembayaran, Saldo Akhir
  const globalSummary = useMemo(() => {
    let sa = 0, pNew = 0, pay = 0, saAkhir = 0;
    Object.values(customerAccountingMap).forEach(c => {
      sa += c.saldoAwal;
      pNew += c.piutangBaru;
      pay += c.pembayaran;
      saAkhir += c.saldoAkhir;
    });
    return {
      saldoAwal: cleanFloat(sa),
      piutangBaru: cleanFloat(pNew),
      pembayaran: cleanFloat(pay),
      saldoAkhir: cleanFloat(saAkhir)
    };
  }, [customerAccountingMap]);

  // Filter & Urutkan Pelanggan Sesuai Kode Terkecil (C1 -> C82)
  const filteredCustomers = useMemo(() => {
    const list = Object.values(customerAccountingMap).filter(p => {
      const q = search.toLowerCase();
      const matchQ = !search || p.nama?.toLowerCase().includes(q) || p.kode?.toLowerCase().includes(q) || p.noHp?.includes(q);
      const matchK = !kategoriFilter || p.kategoriCustomer === kategoriFilter;
      return matchQ && matchK;
    });

    return list.sort((a, b) => {
      const numA = parseCodeNumber(a.kode);
      const numB = parseCodeNumber(b.kode);
      if (numA !== numB) return numA - numB;
      return (a.kode || '').localeCompare(b.kode || '', undefined, { numeric: true });
    });
  }, [customerAccountingMap, search, kategoriFilter]);

  // Selected customer object in form pay modal
  const selectedCustInModal = useMemo(() => {
    if (!formPay.pelangganId) return null;
    return pelangganList.find(c => (c.id || c._id) === formPay.pelangganId);
  }, [formPay.pelangganId, pelangganList]);

  // Options Pelanggan untuk ModernSearchableSelect (Urut C1 -> C82)
  const sortedPelangganPayOptions = useMemo(() => {
    return [...(pelangganList || [])]
      .sort((a, b) => {
        const numA = parseCodeNumber(a.kode);
        const numB = parseCodeNumber(b.kode);
        if (numA !== numB) return numA - numB;
        return (a.kode || '').localeCompare(b.kode || '', undefined, { numeric: true });
      })
      .map(c => {
        const cId = c.id || c._id;
        const net = getNetPiutangForCustomer(c);
        return {
          value: cId,
          label: `[${c.kode || 'C'}] ${c.nama} (Sisa Piutang: ${formatRp(net)})`,
          kode: c.kode || '',
          nama: c.nama || ''
        };
      });
  }, [pelangganList, customerAccountingMap]);

  const openAddPayModal = (p = null) => {
    if (p) {
      const net = getNetPiutangForCustomer(p);
      setFormPay({
        pelangganId: p.id || p._id,
        namaPelanggan: p.nama,
        kodePelanggan: p.kode || '',
        noFaktur: '',
        tanggal: new Date().toISOString().slice(0, 10),
        jumlahBayar: net || '',
        metodePembayaran: 'Transfer Bank',
        noReferensi: '',
        catatan: ''
      });
    } else {
      setFormPay({
        pelangganId: '',
        namaPelanggan: '',
        kodePelanggan: '',
        noFaktur: '',
        tanggal: new Date().toISOString().slice(0, 10),
        jumlahBayar: '',
        metodePembayaran: 'Transfer Bank',
        noReferensi: '',
        catatan: ''
      });
    }
    setShowPayModal(true);
  };

  const handleSelectCustChange = (e) => {
    const cId = e.target.value;
    if (!cId) {
      setFormPay(f => ({ ...f, pelangganId: '', namaPelanggan: '', kodePelanggan: '', jumlahBayar: '' }));
      return;
    }
    const found = pelangganList.find(c => (c.id || c._id) === cId);
    if (found) {
      const net = getNetPiutangForCustomer(found);
      setFormPay(f => ({
        ...f,
        pelangganId: cId,
        namaPelanggan: found.nama,
        kodePelanggan: found.kode || '',
        jumlahBayar: net || ''
      }));
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!formPay.namaPelanggan) {
      if (showAlert) showAlert('Pelanggan wajib dipilih!', 'error');
      return;
    }

    const amount = Number(formPay.jumlahBayar) || 0;
    if (amount <= 0) {
      if (showAlert) showAlert('Jumlah pembayaran harus lebih dari Rp 0!', 'error');
      return;
    }

    if (onCreatePembayaranMasuk) {
      await onCreatePembayaranMasuk(formPay);
      if (showAlert) {
        showAlert(`Pembayaran masuk ${formatRp(amount)} dari ${formPay.namaPelanggan} berhasil dicatat! 🎉`, 'success', 'Pembayaran Masuk');
      }
    }

    setShowPayModal(false);
  };

  const handleDeletePembayaran = async (p) => {
    if (!confirm(`Hapus catatan pembayaran ${p.noBukti} dari ${p.namaPelanggan}? Sisa piutang akan dikembalikan.`)) return;
    if (onDeletePembayaranMasuk) {
      await onDeletePembayaranMasuk(p.id || p._id);
    }
  };

  // Export Excel Piutang
  const handleExportExcel = () => {
    const headers = ['Kode', 'Nama Pelanggan', 'Kategori', 'Sistem Pembayaran', 'No. WA', 'Total Sisa Piutang'];
    const rows = customersWithPiutang.map(p => [
      p.kode || '-',
      p.nama,
      p.kategoriCustomer || 'Umum',
      p.sistemPembayaran || 'COD',
      p.noHp || '-',
      p.totalPiutang || 0
    ]);
    exportToExcel('Data_Piutang_Pelanggan', headers, rows);
  };

  // Export PDF Piutang
  const handleExportPDF = () => {
    const headers = ['Kode', 'Nama Pelanggan', 'Kategori', 'Sistem Bayar', 'No. WA', 'Sisa Piutang'];
    const rows = customersWithPiutang.map(p => [
      p.kode || '-',
      p.nama,
      p.kategoriCustomer || 'Umum',
      p.sistemPembayaran || 'COD',
      p.noHp || '-',
      formatRp(p.totalPiutang || 0)
    ]);
    const config = {
      title: 'Laporan Piutang & Tagihan Pelanggan',
      subtitle: `Status saldo piutang aktif pelanggan Saren One.`,
      headers,
      rows,
      summaryText: `Total Sisa Piutang Aktif: ${formatRp(totalPiutangKeseluruhan)} | Pelanggan Berpiutang: ${totalPelangganBerpiutang} Orang`,
      filename: 'Laporan_Piutang_Pelanggan'
    };
    if (onOpenPdfPreview) onOpenPdfPreview(config);
    else exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
  };

  return (
    <div className="tab-container" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* 1. 4 KPI SUMMARY CARDS AKUNTANSI (SALDO AWAL, PIUTANG, PEMBAYARAN, SALDO AKHIR) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '0.85rem' }}>
        {/* Card 1: Saldo Awal Piutang (Bisa Di-edit Manual) */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #0284c7', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>SALDO AWAL PIUTANG</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {canEdit && selectedMonth !== 'ALL' && (
                <button
                  type="button"
                  onClick={handleOpenSaldoAwalModal}
                  title="Atur Saldo Awal Manual per Pelanggan"
                  style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0284c7', borderRadius: '5px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                >
                  <Pencil size={11} />
                </button>
              )}
              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={13} style={{ color: '#0284c7' }} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0284c7', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {formatRp(globalSummary.saldoAwal)}
          </div>
          <span style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '0.15rem', display: 'block' }}>
            Sisa piutang bulan sebelumnya
            {Object.keys(saldoAwalManual).some(k => k.startsWith(`${selectedMonth}::`)) && (
              <span style={{ marginLeft: '0.3rem', color: '#0284c7', fontWeight: 700 }}>+ penyesuaian ✓</span>
            )}
          </span>
        </div>

        {/* Card 2: Penambahan Piutang Baru */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #dc2626', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>PENAMBAHAN PIUTANG</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={14} style={{ color: '#dc2626' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#dc2626', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {formatRp(globalSummary.piutangBaru)}
          </div>
          <span style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '0.15rem', display: 'block' }}>Penjualan kredit/tempo baru</span>
        </div>

        {/* Card 3: Pembayaran Setoran */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #16a34a', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>PEMBAYARAN / SETORAN</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setIsModalDebitHistoryOpen(true)}
                title="Buka Jurnal & Detail Riwayat Pembayaran Masuk"
                style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', borderRadius: '5px', padding: '0.1rem 0.4rem', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
              >
                <FileText size={10} /> Riwayat
              </button>
              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowDownLeft size={13} style={{ color: '#16a34a' }} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#16a34a', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {formatRp(globalSummary.pembayaran)}
          </div>
          <span style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '0.15rem', display: 'block' }}>Setoran pelunasan terkumpul</span>
        </div>

        {/* Card 4: Saldo Akhir Piutang */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #d97706', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>SALDO AKHIR PIUTANG</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={14} style={{ color: '#d97706' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#b45309', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {formatRp(globalSummary.saldoAkhir)}
          </div>
          <span style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '0.15rem', display: 'block' }}>Total tagihan aktif berjalan</span>
        </div>
      </div>

      {/* 2. TOOLBAR BARIS 1: MODERN MONTH PICKER DENGAN FILTER DISAMPING KIRI */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <ModernMonthPicker
          value={selectedMonth}
          onChange={(val) => setSelectedMonth(val)}
          allowAll={true}
        />
      </div>

      {/* 3. TOOLBAR BARIS 2: SEARCH & ACTION BUTTONS */}
      <div style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px', height: '34px' }}>
            <Search size={14} />
            <input className="search-input" placeholder="Cari kode C1/C2, nama pelanggan, no. HP..." value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: '0.78rem' }} />
          </div>

          <select value={kategoriFilter} onChange={e => setKategoriFilter(e.target.value)} className="form-select" style={{ height: '34px', fontSize: '0.78rem', width: 'auto', minWidth: '140px', background: '#f8fafc' }}>
            <option value="">Semua Kategori</option>
            <option value="Top Market">Top Market</option>
            <option value="Umum">Umum</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button className="btn btn-outline-secondary" onClick={handleExportExcel} style={{ height: '34px', fontSize: '0.75rem', fontWeight: 700, padding: '0 0.7rem', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Download size={13} style={{ color: 'var(--emerald)' }} /> Excel
          </button>
          <button className="btn btn-outline-secondary" onClick={handleExportPDF} style={{ height: '34px', fontSize: '0.75rem', fontWeight: 700, padding: '0 0.7rem', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileText size={13} style={{ color: '#ef4444' }} /> PDF
          </button>

          {canEdit && (
            <button className="btn btn-emerald" onClick={() => openAddPayModal()} style={{ height: '34px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.85rem', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Plus size={14} /> + Catat Pembayaran Masuk
            </button>
          )}
        </div>
      </div>

      {/* 4. TABEL DATA PIUTANG PELANGGAN (FONT DIPERKECIL RAMPING 1-BARIS) */}
      <div className="table-responsive" style={{ borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', marginBottom: '2rem' }}>
        <table className="custom-table" style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', whiteSpace: 'nowrap' }}>
              <th style={{ padding: '0.4rem 0.55rem', width: '60px' }}>Kode</th>
              <th style={{ padding: '0.4rem 0.55rem' }}>Nama Pelanggan</th>
              <th style={{ padding: '0.4rem 0.55rem', textAlign: 'center' }}>Kategori</th>
              <th style={{ padding: '0.4rem 0.55rem', textAlign: 'center' }}>Sistem Bayar</th>
              <th style={{ padding: '0.4rem 0.55rem' }}>No. WhatsApp</th>
              <th style={{ padding: '0.4rem 0.55rem', textAlign: 'right' }}>Saldo Awal</th>
              <th style={{ padding: '0.4rem 0.55rem', textAlign: 'right' }}>Piutang Baru</th>
              <th style={{ padding: '0.4rem 0.55rem', textAlign: 'right' }}>Pembayaran</th>
              <th style={{ padding: '0.4rem 0.55rem', textAlign: 'right' }}>Saldo Akhir</th>
              {canEdit && <th style={{ padding: '0.4rem 0.55rem', textAlign: 'center' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 10 : 9} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                  Tidak ada data saldo piutang pelanggan untuk periode ini.
                </td>
              </tr>
            ) : (
              filteredCustomers.map(p => {
                const isLunas = p.saldoAkhir === 0;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                    <td style={{ padding: '0.35rem 0.55rem' }}>
                      <strong style={{ color: '#0284c7', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.76rem' }}>{p.kode || 'C1'}</strong>
                    </td>
                    <td style={{ padding: '0.35rem 0.55rem' }}>
                      <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.76rem' }}>{p.nama}</span>
                    </td>
                    <td style={{ padding: '0.35rem 0.55rem', textAlign: 'center' }}>
                      <span className="badge" style={{ background: p.kategoriCustomer === 'Top Market' ? '#fef3c7' : '#f1f5f9', color: p.kategoriCustomer === 'Top Market' ? '#d97706' : '#475569', border: `1px solid ${p.kategoriCustomer === 'Top Market' ? '#fde68a' : '#cbd5e1'}`, fontSize: '0.64rem', padding: '0.1rem 0.35rem' }}>
                        {p.kategoriCustomer === 'Top Market' ? '⭐ Top' : 'Umum'}
                      </span>
                    </td>
                    <td style={{ padding: '0.35rem 0.55rem', textAlign: 'center' }}>
                      <span className="badge" style={{ background: p.sistemPembayaran === 'Tempo' ? '#fef2f2' : '#f0fdf4', color: p.sistemPembayaran === 'Tempo' ? '#dc2626' : '#16a34a', border: `1px solid ${p.sistemPembayaran === 'Tempo' ? '#fca5a5' : '#86efac'}`, fontSize: '0.64rem', padding: '0.1rem 0.35rem' }}>
                        {p.sistemPembayaran || 'COD'}
                      </span>
                    </td>
                    <td style={{ padding: '0.35rem 0.55rem', color: '#64748b', fontSize: '0.72rem' }}>
                      {p.noHp ? (
                        <a href={`https://wa.me/${p.noHp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 600 }}>
                          <Phone size={11} /> {p.noHp}
                        </a>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '0.35rem 0.55rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>
                      {formatRp(p.saldoAwal)}
                    </td>
                    <td style={{ padding: '0.35rem 0.55rem', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                      {formatRp(p.piutangBaru)}
                    </td>
                    <td style={{ padding: '0.35rem 0.55rem', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                      {formatRp(p.pembayaran)}
                    </td>
                    <td style={{ padding: '0.35rem 0.55rem', textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.78rem', color: isLunas ? '#16a34a' : '#b45309', fontWeight: 900 }}>
                        {formatRp(p.saldoAkhir)}
                      </strong>
                    </td>
                    {canEdit && (
                      <td style={{ padding: '0.35rem 0.55rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                          <button className="btn btn-sm" onClick={() => setShowDetailModal(p.raw)} style={{ padding: '0.15rem 0.4rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '5px' }} title="Histori Detail"><Eye size={12} /></button>
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

      {/* TABLE RIWAYAT PEMBAYARAN MASUK */}
      <div className="table-responsive" style={{ borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', marginBottom: '2rem' }}>
        <table className="custom-table" style={{ width: '100%', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569' }}>
              <th style={{ padding: '0.45rem 0.65rem' }}>No. Bukti</th>
              <th style={{ padding: '0.45rem 0.65rem' }}>Tanggal</th>
              <th style={{ padding: '0.45rem 0.65rem' }}>Pelanggan</th>
              <th style={{ padding: '0.45rem 0.65rem' }}>Faktur Terkait</th>
              <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right' }}>Jumlah Setoran</th>
              <th style={{ padding: '0.45rem 0.65rem' }}>Metode Bayar</th>
              <th style={{ padding: '0.45rem 0.65rem' }}>No. Referensi</th>
              {canEdit && <th style={{ padding: '0.45rem 0.65rem', textAlign: 'center' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {(pembayaranMasukList || []).length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                  Belum ada riwayat pembayaran masuk dari pelanggan.
                </td>
              </tr>
            ) : (
              (pembayaranMasukList || []).map(pm => (
                <tr key={pm.id || pm._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.4rem 0.65rem', fontFamily: 'monospace', fontWeight: 800, color: '#0284c7', fontSize: '0.75rem' }}>{pm.noBukti}</td>
                  <td style={{ padding: '0.4rem 0.65rem', fontWeight: 600, color: '#475569', fontSize: '0.75rem' }}>{pm.tanggal || pm.createdAt}</td>
                  <td style={{ padding: '0.4rem 0.65rem' }}>
                    <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{pm.namaPelanggan}</strong>
                    {pm.kodePelanggan && <span className="badge" style={{ marginLeft: '6px', background: '#e0e7ff', color: '#4338ca', fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>{pm.kodePelanggan}</span>}
                  </td>
                  <td style={{ padding: '0.4rem 0.65rem', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7', fontSize: '0.75rem' }}>{pm.noFaktur || '-'}</td>
                  <td style={{ padding: '0.4rem 0.65rem', textAlign: 'right', fontWeight: 900, color: '#16a34a', fontSize: '0.85rem' }}>{formatRp(pm.jumlahBayar)}</td>
                  <td style={{ padding: '0.4rem 0.65rem' }}>
                    <span className="badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                      {pm.metodePembayaran || 'Transfer Bank'}
                    </span>
                  </td>
                  <td style={{ padding: '0.4rem 0.65rem', color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem' }}>{pm.noReferensi || '-'}</td>
                  {canEdit && (
                    <td style={{ padding: '0.4rem 0.65rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        <button className="btn btn-sm" onClick={() => setShowKwitansi(pm)} style={{ padding: '0.2rem 0.45rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '5px' }} title="Lihat Kwitansi"><Eye size={13} /></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePembayaran(pm)} style={{ padding: '0.2rem 0.45rem', borderRadius: '5px' }} title="Hapus Catatan"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: CATAT PEMBAYARAN MASUK */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-card modal-md" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h3><ArrowDownLeft size={20} style={{ color: '#10b981' }} /> Catat Pembayaran Masuk Customer</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                <div className="form-group">
                  <label className="form-label">Pilih Pelanggan / Customer *</label>
                  <ModernSearchableSelect
                    value={formPay.pelangganId}
                    onChange={(val) => handleSelectCustChange({ target: { value: val } })}
                    options={sortedPelangganPayOptions}
                    placeholder="-- Cari Kode / Nama Pelanggan --"
                    icon={Users}
                  />
                </div>

                {selectedCustInModal && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 10, margin: '0.75rem 0 1rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>Sisa Piutang Aktif:</span>
                    <strong style={{ color: '#ef4444', fontSize: '1.05rem' }}>{formatRp(getNetPiutangForCustomer(selectedCustInModal))}</strong>
                  </div>
                )}

                <div className="form-grid" style={{ marginTop: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Tanggal Pembayaran *</label>
                    <input className="form-input" type="date" value={formPay.tanggal} onChange={e => setFormPay(f => ({ ...f, tanggal: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Faktur Terkait (Opsional)</label>
                    <input className="form-input" placeholder="INV-202608..." value={formPay.noFaktur} onChange={e => setFormPay(f => ({ ...f, noFaktur: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">Jumlah Pembayaran / Setoran (Rp) *</label>
                  <input className="form-input" type="number" min={1} value={formPay.jumlahBayar} onChange={e => setFormPay(f => ({ ...f, jumlahBayar: e.target.value }))} placeholder="500000" required />
                </div>

                <div className="form-grid" style={{ marginTop: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Metode Pembayaran</label>
                    <select className="form-select" value={formPay.metodePembayaran} onChange={e => setFormPay(f => ({ ...f, metodePembayaran: e.target.value }))}>
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="Tunai">Tunai / Cash</option>
                      <option value="QRIS">QRIS</option>
                      <option value="Giro / Cek">Giro / Cek</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">No. Referensi / Reff</label>
                    <input className="form-input" placeholder="No. resi / reff transfer" value={formPay.noReferensi} onChange={e => setFormPay(f => ({ ...f, noReferensi: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">Catatan Pembayaran</label>
                  <input className="form-input" placeholder="Contoh: Setoran cicilan 1 via BCA..." value={formPay.catatan} onChange={e => setFormPay(f => ({ ...f, catatan: e.target.value }))} />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', minWidth: '170px', color: '#fff', fontWeight: 600 }}>
                  <Check size={16} /> Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HISTORI FAKTUR PELANGGAN */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
          <div className="modal-card modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Histori Tagihan — {showDetailModal.kode} ({showDetailModal.nama})</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sistem Bayar: </span>
                  <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{showDetailModal.sistemPembayaran || 'COD'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sisa Piutang: </span>
                  <strong style={{ color: '#ef4444', fontSize: '1.1rem' }}>{formatRp(showDetailModal.totalPiutang)}</strong>
                </div>
              </div>

              <h5 style={{ margin: '0 0 0.5rem', color: '#fff' }}>📋 Transaksi Penjualan Terkait</h5>
              <div className="table-responsive">
                <table className="table" style={{ fontSize: '0.83rem' }}>
                  <thead>
                    <tr>
                      <th>No. Faktur</th>
                      <th>Tanggal</th>
                      <th>Status Pembayaran</th>
                      <th>Total Bersih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penjualanList.filter(pj => pj.namaPelanggan === showDetailModal.nama || pj.pelangganId === showDetailModal.id || pj.pelangganId === showDetailModal._id).length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>Belum ada histori penjualan tercatat untuk pelanggan ini.</td></tr>
                    ) : (
                      penjualanList.filter(pj => pj.namaPelanggan === showDetailModal.nama || pj.pelangganId === showDetailModal.id || pj.pelangganId === showDetailModal._id).map(pj => (
                        <tr key={pj.id || pj._id}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{pj.noFaktur}</td>
                          <td>{pj.tanggal || pj.createdAt}</td>
                          <td><span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>{pj.statusPembayaran || 'Tempo'}</span></td>
                          <td><strong style={{ color: '#10b981' }}>{formatRp(pj.totalBersih)}</strong></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KWITANSI BUKTI PEMBAYARAN */}
      {showKwitansi && (
        <div className="modal-overlay" onClick={() => setShowKwitansi(null)}>
          <div className="modal-card modal-md" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>📄 Kwitansi Pembayaran Masuk</h3>
              <button className="modal-close" onClick={() => setShowKwitansi(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ background: '#fff', color: '#1e293b', padding: '1.5rem', borderRadius: 12 }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>SAREN ONE SYSTEM</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>BUKTI PENERIMAAN PEMBAYARAN</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: '1rem' }}>
                <div>No. Bukti: <strong style={{ color: '#4f46e5' }}>{showKwitansi.noBukti}</strong></div>
                <div>Tanggal: <strong>{showKwitansi.tanggal || showKwitansi.createdAt}</strong></div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Telah Diterima Dari:</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{showKwitansi.namaPelanggan} ({showKwitansi.kodePelanggan || 'C'})</div>
                
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.75rem' }}>Jumlah Pembayaran:</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16a34a' }}>{formatRp(showKwitansi.jumlahBayar)}</div>
              </div>

              <div style={{ fontSize: '0.83rem', lineHeight: 1.6 }}>
                <div>Metode Bayar: <strong>{showKwitansi.metodePembayaran}</strong></div>
                {showKwitansi.noFaktur && <div>Faktur Terkait: <strong>{showKwitansi.noFaktur}</strong></div>}
                {showKwitansi.noReferensi && <div>No. Reff: <strong>{showKwitansi.noReferensi}</strong></div>}
                {showKwitansi.catatan && <div>Catatan: <i>{showKwitansi.catatan}</i></div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowKwitansi(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL SETTING SALDO AWAL MANUAL PER PELANGGAN ===== */}
      {isModalSaldoAwalOpen && createPortal(
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
            maxWidth: '650px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Pencil size={18} /> Atur Saldo Awal Piutang Manual per Pelanggan
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#e0f2fe', marginTop: '0.25rem', display: 'block' }}>
                  Atur sisa tagihan piutang dari bulan sebelumnya yang ingin dibawa ke bulan terpilih.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalSaldoAwalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Month Selector & Import Button */}
            <div style={{ padding: '0.85rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Periode Bulan:</span>
                <ModernMonthPicker
                  value={modalTargetMonth}
                  onChange={handleModalMonthChange}
                  allowAll={false}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowImportSaldoModal(true)}
                style={{ height: '34px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.95rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 6px rgba(16,185,129,0.2)' }}
                title="Buka Modal Import Excel Saldo Awal"
              >
                <Upload size={14} /> Import Excel Saldo Awal
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(pelangganList || []).length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Tidak ada data pelanggan terdaftar.</div>
                ) : (
                  [...(pelangganList || [])]
                    .sort((a, b) => {
                      const numA = parseCodeNumber(a.kode);
                      const numB = parseCodeNumber(b.kode);
                      if (numA !== numB) return numA - numB;
                      return (a.kode || '').localeCompare(b.kode || '', undefined, { numeric: true });
                    })
                    .map(p => {
                      const nama = p.nama || '';
                      const currentVal = draftSaldoAwal[nama] ?? 0;

                    return (
                      <div key={p.id || p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <strong style={{ fontSize: '0.83rem', color: '#0f172a', display: 'block' }}>[{p.kode || 'C'}] {nama}</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Kategori: {p.kategoriCustomer || 'Umum'}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7' }}>Rp</span>
                          <input
                            type="text"
                            value={currentVal ? Number(currentVal).toLocaleString('id-ID') : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              setDraftSaldoAwal(prev => ({ ...prev, [nama]: raw ? parseInt(raw, 10) : 0 }));
                            }}
                            placeholder="0"
                            style={{ width: '130px', padding: '0.35rem 0.6rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'right', outline: 'none' }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer (Ringkasan Total Saldo Awal & Action Buttons) */}
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Total Saldo Awal ({modalTargetMonth}):</span>
                <strong style={{ fontSize: '1.05rem', color: '#0284c7', fontWeight: 900 }}>
                  {formatRp(Object.values(draftSaldoAwal).reduce((acc, curr) => acc + (Number(curr) || 0), 0))}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                  style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Save size={14} /> Simpan Saldo Awal
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== MODAL 2: IMPORT EXCEL SALDO AWAL (STANDAR DRAG/DROP & DOWNLOAD TEMPLATE INSIDE) ===== */}
      {showImportSaldoModal && createPortal(
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
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={20} /> Import Saldo Awal Piutang via Excel
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#ecfdf5', marginTop: '0.25rem', display: 'block' }}>
                  Periode Target: <strong>{modalTargetMonth}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowImportSaldoModal(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* Langkah 1: Download Template */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px border-solid #e2e8f0', marginBottom: '1.25rem', textAlign: 'center' }}>
                <Download size={32} style={{ color: '#0284c7', marginBottom: '0.4rem' }} />
                <h4 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontSize: '0.95rem', fontWeight: 800 }}>1. Unduh Template Format Excel</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.85rem' }}>
                  Gunakan format 3 kolom: <strong>Kode Pelanggan</strong>, <strong>Nama Pelanggan</strong>, dan <strong>Saldo Awal (Rp)</strong>.
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleDownloadTemplateSaldoAwal}
                  style={{ height: '34px', fontSize: '0.78rem', fontWeight: 700, padding: '0 0.9rem', borderRadius: '7px', borderColor: '#0284c7', color: '#0284c7', background: '#ffffff' }}
                >
                  <Download size={14} style={{ color: '#0284c7' }} /> Download Template Excel (.xlsx)
                </button>
              </div>

              {/* Langkah 2: Drag/Drop Upload File */}
              <div style={{ background: '#f0fdf4', padding: '1.25rem', borderRadius: '12px', border: '2px dashed #86efac', textAlign: 'center' }}>
                <Upload size={32} style={{ color: '#16a34a', marginBottom: '0.4rem' }} />
                <h4 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontSize: '0.95rem', fontWeight: 800 }}>2. Upload File Excel Saldo Awal</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem' }}>
                  Pilih file .xlsx atau .xls dari komputer Anda.
                </p>
                <label className="btn btn-emerald" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', height: '36px', fontSize: '0.8rem', fontWeight: 800, padding: '0 1rem', borderRadius: '8px' }}>
                  <Upload size={15} /> Pilih File Excel...
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      handleImportExcelSaldoAwal(e);
                      setShowImportSaldoModal(false);
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowImportSaldoModal(false)}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', cursor: 'pointer' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== MODAL 3: JURNAL & DETAIL RIWAYAT PEMBAYARAN MASUK (LENGKAP DENGAN TOMBOL HAPUS) ===== */}
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
          zIndex: 10000,
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
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowDownLeft size={22} /> Jurnal &amp; Detail Riwayat Pembayaran Masuk (Debit)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                  Periode: <strong>{selectedMonth === 'ALL' ? 'Semua Periode' : selectedMonth}</strong> • Total Terbayar: <strong style={{ color: '#34d399' }}>{formatRp(globalSummary.pembayaran)}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalDebitHistoryOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Table of all payment records */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {(() => {
                const records = (pembayaranMasukList || []).filter(pm => {
                  if (selectedMonth === 'ALL') return true;
                  const pmMonth = getMonthFromDateStr(pm.tanggal || pm.createdAt);
                  return pmMonth === selectedMonth;
                }).sort((a, b) => new Date(b.tanggal || b.createdAt) - new Date(a.tanggal || a.createdAt));

                if (records.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Belum Ada Riwayat Pembayaran Masuk</p>
                      <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>Tidak ada transaksi pembayaran setoran pada periode {selectedMonth === 'ALL' ? 'semua bulan' : selectedMonth}.</span>
                    </div>
                  );
                }

                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>No. Bukti / Reff</th>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>Tanggal</th>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>Nama Pelanggan</th>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>Keterangan / Faktur</th>
                        <th style={{ padding: '0.6rem', textAlign: 'right' }}>Jumlah Setoran</th>
                        {canEdit && <th style={{ padding: '0.6rem', textAlign: 'center' }}>Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((pm, idx) => {
                        const pmId = pm.id || pm._id;
                        return (
                          <tr key={pmId || idx} style={{ borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                            <td style={{ padding: '0.55rem 0.6rem', fontWeight: 800, color: '#4f46e5' }}>
                              {pm.noBukti || `SETOR-${idx + 1}`}
                            </td>
                            <td style={{ padding: '0.55rem 0.6rem', color: '#334155' }}>
                              {pm.tanggal || (pm.createdAt ? pm.createdAt.slice(0, 10) : '-')}
                            </td>
                            <td style={{ padding: '0.55rem 0.6rem', fontWeight: 800, color: '#0f172a' }}>
                              [{pm.kodePelanggan || 'C'}] {pm.namaPelanggan}
                            </td>
                            <td style={{ padding: '0.55rem 0.6rem', color: '#475569' }}>
                              <div>{pm.metodePembayaran || 'Transfer'} {pm.noFaktur ? `(Faktur: ${pm.noFaktur})` : ''}</div>
                              {pm.catatan && <small style={{ color: '#64748b', fontStyle: 'italic' }}>{pm.catatan}</small>}
                            </td>
                            <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, color: '#16a34a', fontSize: '0.82rem' }}>
                              {formatRp(pm.jumlahBayar)}
                            </td>
                            {canEdit && (
                              <td style={{ padding: '0.55rem 0.6rem', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePembayaran(pm)}
                                  title="Hapus Pembayaran Masuk Ini"
                                  style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fca5a5',
                                    color: '#dc2626',
                                    borderRadius: '6px',
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <Trash2 size={12} /> Hapus
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsModalDebitHistoryOpen(false)}
                style={{ padding: '0.45rem 1.2rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', cursor: 'pointer' }}
              >
                Tutup Jurnal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
