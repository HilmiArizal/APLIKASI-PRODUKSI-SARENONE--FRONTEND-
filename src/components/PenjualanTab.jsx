import React, { useState, useMemo } from 'react';
import { ShoppingBag, Plus, Trash2, Edit3, Search, X, Eye, TrendingUp, DollarSign, Package, Users, Megaphone } from 'lucide-react';
import { ModernMonthPicker, ModernSearchableSelect } from './ModernDatePicker';

const METODE_PEMBAYARAN = ['Tunai', 'Transfer Bank', 'QRIS', 'Kartu Debit', 'Kartu Kredit', 'COD'];
const STATUS_PEMBAYARAN = ['Lunas', 'Cicilan', 'Pending', 'Dibatalkan'];

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
const formatDate = (d) => {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};

export default function PenjualanTab({
  penjualanList = [],
  pelangganList = [],
  produkSalesList = [],
  activeRoleView,
  activeUser,
  onCreatePenjualan,
  onUpdatePenjualan,
  onDeletePenjualan,
  showAlert
}) {
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [filterMonth, setFilterMonth] = useState(currentMonthKey);

  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editData, setEditData] = useState(null);

  // Checkbox Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filtered.map(p => p.id || p._id).filter(Boolean);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus (${selectedIds.length}) transaksi penjualan terpilih? Tindakan ini tidak dapat dibatalkan!`)) return;

    if (onDeletePenjualan) {
      for (const id of selectedIds) {
        await onDeletePenjualan(id, true);
      }
      setSelectedIds([]);
      if (showAlert) showAlert(`(${selectedIds.length}) transaksi penjualan terpilih berhasil dihapus! 🗑️`, 'info', 'Hapus Terpilih');
    }
  };

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'SALES'].includes(activeRoleView);

  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    monthsSet.add(currentMonthKey);
    penjualanList.forEach(p => {
      const t = p.tanggal || p.createdAt;
      if (t) {
        try {
          const d = new Date(t);
          if (!isNaN(d.getTime())) {
            monthsSet.add(d.toISOString().slice(0, 7));
          }
        } catch { /* ignore */ }
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [penjualanList, currentMonthKey]);

  const formatMonthName = (monthKey) => {
    if (!monthKey || monthKey === 'Semua') return 'Semua Bulan';
    try {
      const [year, month] = monthKey.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch {
      return monthKey;
    }
  };

  const todayStr = new Date().toISOString().substring(0, 10);
  const emptyForm = {
    tanggal: todayStr,
    noFaktur: '',
    pelangganId: '',
    namaPelanggan: '',
    teleponPelanggan: '',
    alamatPelanggan: '',
    items: [{ produkId: '', namaProduk: '', sku: '', brand: '', hargaPabrik: 0, qty: 1, hargaSatuan: 0, subtotal: 0 }],
    diskon: 0,
    metodePembayaran: 'Tunai',
    statusPembayaran: 'Lunas',
    catatan: ''
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    return penjualanList.filter(p => {
      const matchQ = !searchQ || p.namaPelanggan?.toLowerCase().includes(searchQ.toLowerCase()) || p.noFaktur?.toLowerCase().includes(searchQ.toLowerCase());
      const matchStatus = filterStatus === 'Semua' || p.statusPembayaran === filterStatus;
      
      let matchMonth = true;
      if (filterMonth && filterMonth !== 'Semua') {
        const itemDate = p.tanggal || p.createdAt;
        if (itemDate) {
          try {
            const itemKey = new Date(itemDate).toISOString().slice(0, 7);
            matchMonth = itemKey === filterMonth;
          } catch { matchMonth = true; }
        }
      }
      return matchQ && matchStatus && matchMonth;
    });
  }, [penjualanList, searchQ, filterStatus, filterMonth]);

  const totalPenjualan = useMemo(() => filtered.reduce((s, p) => s + (p.totalBersih || 0), 0), [filtered]);
  const totalTransaksi = filtered.length;
  const lunas = filtered.filter(p => p.statusPembayaran === 'Lunas').length;
  const pelangganUnik = new Set(filtered.map(p => p.namaPelanggan)).size;

  const totalHarga = form.items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const totalBersih = Math.max(0, totalHarga - (Number(form.diskon) || 0));

  const openAdd = () => { setEditData(null); setForm({ ...emptyForm, tanggal: new Date().toISOString().substring(0, 10) }); setShowModal(true); };
  const openEdit = (p) => {
    setEditData(p);
    setForm({
      tanggal: p.tanggal ? new Date(p.tanggal).toISOString().substring(0, 10) : todayStr,
      noFaktur: p.noFaktur || '',
      pelangganId: p.pelangganId || '',
      namaPelanggan: p.namaPelanggan || '',
      teleponPelanggan: p.teleponPelanggan || '',
      alamatPelanggan: p.alamatPelanggan || '',
      items: p.items?.length ? p.items : emptyForm.items,
      diskon: p.diskon || 0,
      metodePembayaran: p.metodePembayaran || 'Tunai',
      statusPembayaran: p.statusPembayaran || 'Lunas',
      catatan: p.catatan || ''
    });
    setShowModal(true);
  };

  // Urutkan Pelanggan dari Kode Terkecil (C1 -> C82) untuk Dropdown Options
  const sortedPelangganOptions = useMemo(() => {
    const list = [...(pelangganList || [])];
    list.sort((a, b) => {
      const getNum = (str) => {
        if (!str) return 999999;
        const match = String(str).match(/\d+/);
        return match ? parseInt(match[0], 10) : 999999;
      };
      const numA = getNum(a.kode);
      const numB = getNum(b.kode);
      if (numA !== numB) return numA - numB;
      return String(a.kode || '').localeCompare(String(b.kode || ''));
    });

    return list.map(c => {
      const cId = c.id || c._id;
      const katTag = c.kategoriCustomer === 'Top Market' || c.kategoriCustomer === 'TM' ? '⭐ TM' : 'Umum';
      return {
        id: cId,
        value: cId,
        kode: c.kode,
        nama: c.nama,
        label: `👤 [${c.kode || 'C'}] ${c.nama} (${katTag}) ${c.noHp ? `- ${c.noHp}` : ''}`,
        raw: c
      };
    });
  }, [pelangganList]);

  // Urutkan Produk dari SKU / Kode / Nama Terkecil untuk Dropdown Options
  const sortedProdukOptions = useMemo(() => {
    const list = [...(produkSalesList || [])];
    list.sort((a, b) => {
      const getNum = (str) => {
        if (!str) return 999999;
        const match = String(str).match(/\d+/);
        return match ? parseInt(match[0], 10) : 999999;
      };
      const codeA = a.sku || a.kodeProduk || a.namaProduk;
      const codeB = b.sku || b.kodeProduk || b.namaProduk;
      const numA = getNum(codeA);
      const numB = getNum(codeB);
      if (numA !== numB) return numA - numB;
      return String(codeA || '').localeCompare(String(codeB || ''));
    });

    return list.map(p => {
      const pId = p.id || p._id;
      const codeStr = p.sku ? `[${p.sku}] ` : '';
      return {
        id: pId,
        value: pId,
        kode: p.sku || p.kodeProduk || '',
        nama: p.namaProduk,
        label: `📦 ${codeStr}${p.namaProduk} [${p.brand || 'SAREN ONE'}] (Stok: ${p.stokReady || 0} Pcs)`,
        raw: p
      };
    });
  }, [produkSalesList]);

  const selectedCustomerValue = useMemo(() => {
    if (!form.pelangganId && !form.namaPelanggan) return '';
    const matched = (pelangganList || []).find(c => {
      const cId = c.id || c._id;
      if (cId && form.pelangganId && String(cId) === String(form.pelangganId)) return true;
      if (c.nama && form.namaPelanggan && c.nama.trim().toLowerCase() === form.namaPelanggan.trim().toLowerCase()) return true;
      return false;
    });
    return matched ? (matched.id || matched._id) : '';
  }, [form.pelangganId, form.namaPelanggan, pelangganList]);

  // Handle Customer Selection Dropdown
  const handleSelectCustomer = (e) => {
    const custId = e.target.value;
    if (!custId) {
      setForm(f => ({ ...f, pelangganId: '', namaPelanggan: '', teleponPelanggan: '', alamatPelanggan: '', kategoriCustomer: 'Umum' }));
      return;
    }
    const found = (pelangganList || []).find(c => {
      const cId = c.id || c._id;
      return String(cId) === String(custId) || c.nama === custId;
    });

    if (found) {
      const isTopMarket = found.kategoriCustomer === 'Top Market';
      const targetId = found.id || found._id;

      const updatedItems = form.items.map(item => {
        if (!item.produkId) return item;
        const prod = produkSalesList.find(p => {
          const pId = p.id || p._id;
          return String(pId) === String(item.produkId) || p.namaProduk === item.namaProduk;
        });
        if (!prod) return item;

        const newPrice = isTopMarket
          ? (prod.hargaTopMarket || prod.hargaUmum || prod.hargaPabrik || 0)
          : (prod.hargaUmum || prod.hargaTopMarket || prod.hargaPabrik || 0);

        const qty = Number(item.qty) || 1;
        return {
          ...item,
          hargaSatuan: newPrice,
          subtotal: qty * newPrice
        };
      });

      const isTempoCust = found.sistemPembayaran === 'Tempo';
      setForm(f => ({
        ...f,
        pelangganId: targetId,
        namaPelanggan: found.nama,
        teleponPelanggan: found.noHp || '',
        alamatPelanggan: found.alamat || '',
        kategoriCustomer: found.kategoriCustomer || 'Umum',
        sistemPembayaran: found.sistemPembayaran || f.sistemPembayaran,
        metodePembayaran: isTempoCust ? 'Tempo' : f.metodePembayaran,
        statusPembayaran: isTempoCust ? 'Tempo' : f.statusPembayaran,
        items: updatedItems
      }));
    }
  };

  // Handle Product Selection Dropdown per Item Row
  const handleSelectProduct = (idx, prodId) => {
    const items = [...form.items];
    const foundProd = produkSalesList.find(p => (p.id || p._id) === prodId);

    if (foundProd) {
      const selectedCust = pelangganList.find(c => (c.id || c._id) === form.pelangganId || c.nama === form.namaPelanggan);
      const isTopMarket = selectedCust?.kategoriCustomer === 'Top Market';
      const defaultPrice = isTopMarket
        ? (foundProd.hargaTopMarket || foundProd.hargaUmum || foundProd.hargaPabrik || 0)
        : (foundProd.hargaUmum || foundProd.hargaTopMarket || foundProd.hargaPabrik || 0);

      items[idx] = {
        ...items[idx],
        produkId: prodId,
        namaProduk: foundProd.namaProduk,
        sku: foundProd.sku || '',
        brand: foundProd.brand || '',
        hargaTopMarket: foundProd.hargaTopMarket || 0,
        hargaUmum: foundProd.hargaUmum || 0,
        hargaSatuan: defaultPrice,
        subtotal: (Number(items[idx].qty) || 1) * defaultPrice
      };
    } else {
      items[idx] = {
        ...items[idx],
        produkId: '',
        namaProduk: prodId,
        hargaTopMarket: 0,
        hargaUmum: 0
      };
    }
    setForm(f => ({ ...f, items }));
  };

  const handleItemChange = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    items[idx].subtotal = (Number(items[idx].qty) || 0) * (Number(items[idx].hargaSatuan) || 0);
    setForm(f => ({ ...f, items }));
  };

  const addItem = () => setForm(f => ({
    ...f,
    items: [...f.items, { produkId: '', namaProduk: '', sku: '', brand: '', hargaPabrik: 0, qty: 1, hargaSatuan: 0, subtotal: 0 }]
  }));

  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  // Calculate Items with Fee Marketing (Selisih Harga Jual vs Harga Modal)
  const calcItems = (itemsList) => {
    const selectedCust = (pelangganList || []).find(c => (c.id || c._id) === form.pelangganId || c.nama === form.namaPelanggan);
    const isTopMarket = selectedCust?.kategoriCustomer === 'Top Market';

    return (itemsList || []).map(it => {
      const prod = (produkSalesList || []).find(p => (p.id || p._id) === it.produkId || p.namaProduk === it.namaProduk);
      const qty = Number(it.qty) || 1;
      const hJual = Number(it.hargaSatuan) || 0;

      let hModal = Number(it.hargaModal) || 0;
      if (prod) {
        hModal = Number(prod.hargaModal || prod.hargaUmum || prod.hargaTopMarket || prod.hargaPabrik || 0);
      }

      const feeItem = Math.max(0, (hJual - hModal) * qty);
      const subtotal = qty * hJual;

      return {
        ...it,
        qty,
        hargaModal: hModal,
        hargaSatuan: hJual,
        feeMarketingItem: feeItem,
        subtotal
      };
    });
  };

  const totalFeeMarketingForm = useMemo(() => {
    return calcItems(form.items).reduce((sum, i) => sum + (i.feeMarketingItem || 0), 0);
  }, [form.items, form.pelangganId, form.namaPelanggan, produkSalesList, pelangganList]);

  const handleSubmit = async () => {
    if (!form.noFaktur || !form.noFaktur.trim()) {
      if (showAlert) showAlert('No. Faktur / Nota Transaksi tidak boleh kosong!', 'error', 'Peringatan');
      return;
    }

    // Cek Duplikasi No. Faktur
    const cleanedFaktur = form.noFaktur.trim().toLowerCase();
    const isDuplicateFaktur = (penjualanList || []).some(pj => {
      const currentId = editData ? (editData.id || editData._id) : null;
      const pjId = pj.id || pj._id;
      if (currentId && String(currentId) === String(pjId)) return false;
      return (pj.noFaktur || '').trim().toLowerCase() === cleanedFaktur;
    });

    if (isDuplicateFaktur) {
      if (showAlert) showAlert(`No. Faktur "${form.noFaktur}" sudah pernah digunakan! Nomor Invoice tidak boleh sama. Silakan gunakan nomor invoice unik lain.`, 'error', 'Invoice Duplikat');
      return;
    }
    if (!form.namaPelanggan || !form.namaPelanggan.trim()) {
      if (showAlert) showAlert('Pelanggan wajib dipilih atau diisi!', 'error', 'Peringatan');
      return;
    }
    if (!form.items || form.items.length === 0) {
      if (showAlert) showAlert('Minimal 1 item produk wajib ditambahkan!', 'error', 'Peringatan');
      return;
    }

    // Validasi per item produk
    for (let i = 0; i < form.items.length; i++) {
      const it = form.items[i];
      if (!it.namaProduk && !it.produkId) {
        if (showAlert) showAlert(`Item ke-${i + 1}: Silakan pilih produk terlebih dahulu!`, 'error', 'Peringatan');
        return;
      }
      if (!it.qty || Number(it.qty) <= 0) {
        if (showAlert) showAlert(`Item ke-${i + 1}: Qty harus lebih dari 0!`, 'error', 'Peringatan');
        return;
      }
      if (it.hargaSatuan === '' || it.hargaSatuan === null || it.hargaSatuan === undefined || Number(it.hargaSatuan) < 0) {
        if (showAlert) showAlert(`Item ke-${i + 1}: Harga Jual tidak boleh kosong!`, 'error', 'Peringatan');
        return;
      }
    }

    const matchedCust = (pelangganList || []).find(c => {
      const cId = c.id || c._id;
      if (cId && form.pelangganId && String(cId) === String(form.pelangganId)) return true;
      if (c.nama && form.namaPelanggan && c.nama.trim().toLowerCase() === form.namaPelanggan.trim().toLowerCase()) return true;
      return false;
    });

    const isTempoCust = matchedCust?.sistemPembayaran === 'Tempo';
    const finalMetode = (isTempoCust && form.metodePembayaran === 'Tunai') ? 'Tempo' : form.metodePembayaran;
    const finalStatus = (isTempoCust && form.statusPembayaran === 'Lunas') ? 'Tempo' : form.statusPembayaran;

    const processed = calcItems(form.items);
    const payload = {
      ...form,
      pelangganId: matchedCust ? (matchedCust.id || matchedCust._id) : form.pelangganId,
      namaPelanggan: matchedCust ? matchedCust.nama : form.namaPelanggan,
      metodePembayaran: finalMetode,
      statusPembayaran: finalStatus,
      items: processed,
      totalHarga,
      totalBersih,
      totalFeeMarketing: totalFeeMarketingForm
    };
    if (editData) {
      await onUpdatePenjualan(editData.id || editData._id, payload);
    } else {
      await onCreatePenjualan(payload);
    }
    setShowModal(false);
  };

  const handleDelete = async (p) => {
    if (!confirm(`Hapus penjualan ${p.noFaktur} ke ${p.namaPelanggan}?`)) return;
    await onDeletePenjualan(p.id || p._id);
  };

  const statusColor = { 'Lunas': '#10b981', 'Cicilan': '#f59e0b', 'Pending': '#6366f1', 'Dibatalkan': '#ef4444' };

  const totalFeeMarketingSemua = useMemo(() => {
    return filtered.reduce((sum, p) => {
      if (p.totalFeeMarketing !== undefined) return sum + (Number(p.totalFeeMarketing) || 0);
      const itemFee = (p.items || []).reduce((s, it) => {
        if (it.feeMarketingItem !== undefined) return s + Number(it.feeMarketingItem);
        const qty = Number(it.qty) || 1;
        const hj = Number(it.hargaSatuan) || 0;
        const hm = Number(it.hargaModal) || 0;
        return s + Math.max(0, (hj - hm) * qty);
      }, 0);
      return sum + itemFee;
    }, 0);
  }, [filtered]);

  return (
    <div className="tab-container">
      {/* KPI SUMMARY CARDS (SUPER COMPACT & RAMPING) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3px solid #0284c7', borderRadius: '10px', padding: '0.5rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>TOTAL OMZET</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={14} style={{ color: '#0284c7' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem', lineHeight: 1.2 }}>
            {formatRp(totalPenjualan)}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3px solid #db2777', borderRadius: '10px', padding: '0.5rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>FEE / MARGIN MKT</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Megaphone size={14} style={{ color: '#db2777' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem', lineHeight: 1.2 }}>
            {formatRp(totalFeeMarketingSemua)}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3px solid #059669', borderRadius: '10px', padding: '0.5rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>TOTAL TRANSAKSI</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={14} style={{ color: '#059669' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem', lineHeight: 1.2 }}>
            {totalTransaksi} <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>Invoice</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3px solid #d97706', borderRadius: '10px', padding: '0.5rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>TRANSAKSI LUNAS</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={14} style={{ color: '#d97706' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem', lineHeight: 1.2 }}>
            {lunas} <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700 }}>Lunas</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3px solid #0284c7', borderRadius: '10px', padding: '0.5rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>TOTAL PELANGGAN</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} style={{ color: '#0284c7' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem', lineHeight: 1.2 }}>
            {pelangganUnik} <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700 }}>Mitra</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR & FILTER ROW */}
      <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px', height: '36px' }}>
            <Search size={15} />
            <input className="search-input" placeholder="Cari pelanggan / no. faktur..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ fontSize: '0.8rem' }} />
          </div>

          <ModernMonthPicker
            value={filterMonth}
            onChange={setFilterMonth}
            allowAll={true}
            variant="primary"
          />


        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {selectedIds.length > 0 && (
              <button
                className="btn btn-outline-danger"
                onClick={handleBulkDeleteSelected}
                style={{
                  height: '36px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '0 0.85rem',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626'
                }}
              >
                <Trash2 size={15} /> Hapus Terpilih ({selectedIds.length})
              </button>
            )}

            <button className="btn btn-emerald" onClick={openAdd} style={{ height: '36px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.95rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={15} /> + Catat Penjualan
            </button>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="table-responsive" style={{ borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <table className="custom-table" style={{ width: '100%', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569' }}>
              {canEdit && (
                <th style={{ padding: '0.45rem 0.65rem', textAlign: 'center', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                    title="Pilih Semua"
                  />
                </th>
              )}
              <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>No. Faktur</th>
              <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>Tanggal</th>
              <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>Pelanggan</th>
              <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>Total Item</th>
              <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap' }}>Total Bersih</th>
              <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>Metode</th>
              <th style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '0.45rem 0.65rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                  Belum ada transaksi penjualan. Klik "+ Catat Penjualan" untuk mencatat.
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const pId = p.id || p._id;
                const isSelected = selectedIds.includes(pId);

                return (
                  <tr key={pId} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#f0f9ff' : 'transparent' }}>
                    {canEdit && (
                      <td style={{ padding: '0.4rem 0.65rem', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(pId)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                      </td>
                    )}
                  <td style={{ padding: '0.4rem 0.65rem', fontFamily: 'monospace', fontWeight: 800, color: '#0284c7', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{p.noFaktur || '-'}</td>
                  <td style={{ padding: '0.4rem 0.65rem', fontWeight: 700, color: '#475569', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{formatDate(p.tanggal || p.createdAt)}</td>
                  <td style={{ padding: '0.4rem 0.65rem', fontWeight: 800, color: '#0f172a', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{p.namaPelanggan}</td>
                  <td style={{ padding: '0.4rem 0.65rem', color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{p.items?.length || 0} Item</td>
                  <td style={{ padding: '0.4rem 0.65rem', textAlign: 'right', fontWeight: 900, color: '#059669', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatRp(p.totalBersih)}</td>
                  <td style={{ padding: '0.4rem 0.65rem', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontSize: '0.68rem', fontWeight: 700, padding: '0.08rem 0.45rem', borderRadius: '4px' }}>
                      {p.metodePembayaran || 'Tunai'}
                    </span>
                  </td>
                  <td style={{ padding: '0.4rem 0.65rem', whiteSpace: 'nowrap' }}>
                    <span style={{
                      background: `${statusColor[p.statusPembayaran] || '#10b981'}15`,
                      color: statusColor[p.statusPembayaran] || '#10b981',
                      border: `1px solid ${statusColor[p.statusPembayaran] || '#10b981'}40`,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.08rem 0.45rem',
                      borderRadius: '4px'
                    }}>
                      {p.statusPembayaran}
                    </span>
                  </td>
                  <td style={{ padding: '0.4rem 0.65rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                      <button className="btn btn-sm" onClick={() => setShowDetail(p)} style={{ padding: '0.2rem 0.45rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '5px' }} title="Lihat Detail"><Eye size={13} /></button>
                      {canEdit && (
                        <>
                          <button className="btn btn-sm" onClick={() => openEdit(p)} style={{ padding: '0.2rem 0.45rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '5px' }} title="Edit"><Edit3 size={13} /></button>
                          <button className="btn btn-sm" onClick={() => handleDelete(p)} style={{ padding: '0.2rem 0.45rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '5px' }} title="Hapus"><Trash2 size={13} /></button>
                        </>
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

      {/* MODAL CATAT PENJUALAN - LEBAR RAPI LEGA */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" style={{ maxWidth: 880, width: '92%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><ShoppingBag size={20} style={{ color: 'var(--accent-primary)' }} /> {editData ? 'Edit Catatan Penjualan' : 'Catat Transaksi Penjualan Baru'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {/* FORM UTAMA (4 FIELD PAS 2X2 SEJAJAR): NO FAKTUR, TANGGAL, PILIH PELANGGAN, NAMA PELANGGAN */}
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">No. Faktur / Nota Transaksi *</label>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#dc2626' }}>
                      ⚠️ Invoice Tidak Boleh Sama
                    </span>
                  </div>
                  <input
                    className="form-input"
                    value={form.noFaktur}
                    onChange={e => setForm(f => ({ ...f, noFaktur: e.target.value }))}
                    placeholder="Wajib diisi! (Contoh: INV-202608001)"
                    style={{ fontWeight: 700, height: '34px', fontSize: '0.78rem' }}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tanggal Transaksi *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.tanggal}
                    onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                    style={{ height: '34px', fontSize: '0.78rem', fontWeight: 600 }}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pilih Pelanggan / Customer *</label>
                  <ModernSearchableSelect
                    value={selectedCustomerValue}
                    onChange={(val) => handleSelectCustomer({ target: { value: val } })}
                    options={sortedPelangganOptions}
                    placeholder="-- Pilih Pelanggan Terdaftar --"
                    icon={Users}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nama Pelanggan (Manual / Edit) *</label>
                  <input className="form-input" value={form.namaPelanggan} onChange={e => setForm(f => ({ ...f, namaPelanggan: e.target.value }))} placeholder="Nama Pelanggan / Toko..." style={{ height: '34px', fontSize: '0.78rem' }} required />
                </div>
              </div>

              {/* PRODUCT ITEM SELECTION */}
              <div style={{ margin: '1.25rem 0 0.5rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📦 Item Produk Penjualan</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>* Pilihan otomatis dari Stok Produk</span>
              </div>

              {form.items.map((it, idx) => {
                const currentProd = produkSalesList.find(p => (p.id || p._id) === it.produkId || p.namaProduk === it.namaProduk);

                return (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 10, marginBottom: '0.6rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr auto', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Nama Produk *</label>
                        <ModernSearchableSelect
                          value={it.produkId || ''}
                          onChange={(val) => handleSelectProduct(idx, val)}
                          options={sortedProdukOptions}
                          placeholder="-- Pilih dari Stok Produk --"
                          icon={Package}
                        />
                        {currentProd && (
                          <div style={{ fontSize: '0.73rem', marginTop: '4px', color: '#64748b', fontWeight: 600 }}>
                            🔒 HPP / Modal Dasar: <strong style={{ color: '#0369a1' }}>{formatRp(currentProd.hargaModal || currentProd.hargaUmum || currentProd.hargaTopMarket || currentProd.hargaPabrik)}</strong>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Qty (Pcs) *</label>
                        <input className="form-input" type="number" min={1} value={it.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} placeholder="Qty" style={{ height: '34px', fontSize: '0.78rem' }} />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Harga Jual / Pcs (Rp) *</label>
                        <input className="form-input" type="number" min={0} value={it.hargaSatuan} onChange={e => handleItemChange(idx, 'hargaSatuan', e.target.value)} placeholder="Harga jual" style={{ height: '34px', fontSize: '0.78rem' }} />
                      </div>

                      <div style={{ paddingTop: '1.4rem' }}>
                        <button className="btn btn-sm btn-danger" onClick={() => removeItem(idx)} disabled={form.items.length === 1} title="Hapus Item"><X size={14} /></button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subtotal Item:</span>
                      <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>{formatRp(it.subtotal)}</strong>
                    </div>
                  </div>
                );
              })}

              <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }} onClick={addItem}><Plus size={14} /> Tambah Baris Produk</button>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Diskon Potongan (Rp)</label>
                  <input className="form-input" type="number" min={0} value={form.diskon} onChange={e => setForm(f => ({ ...f, diskon: e.target.value }))} style={{ height: '34px', fontSize: '0.78rem' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status Pembayaran *</label>
                  <select
                    className="form-select"
                    value={form.statusPembayaran}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(f => ({
                        ...f,
                        statusPembayaran: val,
                        metodePembayaran: val === 'Tempo' ? 'Tempo' : (f.metodePembayaran === 'Tempo' ? 'Tunai' : f.metodePembayaran)
                      }));
                    }}
                    style={{ height: '34px', fontSize: '0.78rem', fontWeight: 700, background: form.statusPembayaran === 'Tempo' ? '#fef2f2' : '#f0fdf4', color: form.statusPembayaran === 'Tempo' ? '#dc2626' : '#16a34a' }}
                    required
                  >
                    <option value="Lunas">✓ Lunas (Cash / Transfer)</option>
                    <option value="Tempo">⏳ Tempo / Kredit (Masuk Piutang)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Catatan Transaksi</label>
                  <input className="form-input" value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Catatan tambahan (opsional)" style={{ height: '34px', fontSize: '0.78rem' }} />
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: 'var(--text-muted)' }}><span>Subtotal Harga:</span><span>{formatRp(totalHarga)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: '#ef4444' }}><span>Diskon:</span><span>- {formatRp(form.diskon)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: '#10b981', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}><span>Total Penjualan Bersih:</span><span>{formatRp(totalBersih)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editData ? 'Simpan Perubahan' : 'Catat Penjualan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL - LEBAR RAPI LEGA */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-container" style={{ maxWidth: 760, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Penjualan — {showDetail.noFaktur}</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 1.5rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                {[
                  ['No. Faktur / Nota', showDetail.noFaktur || '-'],
                  ['Nama Pelanggan', showDetail.namaPelanggan],
                  ['Tanggal Transaksi', formatDate(showDetail.tanggal || showDetail.createdAt)],
                  ['Dicatat oleh', showDetail.createdBy || '-']
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px dashed #cbd5e1', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>{k}:</span>
                    <strong style={{ color: '#0f172a' }}>{v}</strong>
                  </div>
                ))}
              </div>

              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                📦 Rincian Item Produk Penjualan:
              </div>
              <div className="table-responsive" style={{ borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table className="data-table" style={{ width: '100%', fontSize: '0.78rem', margin: 0 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                      <th style={{ padding: '0.45rem 0.65rem' }}>Produk</th>
                      <th style={{ padding: '0.45rem 0.65rem', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right' }}>Harga Jual</th>
                      <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showDetail.items || []).map((it, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700, color: '#0f172a' }}>{it.namaProduk}</td>
                        <td style={{ padding: '0.45rem 0.65rem', textAlign: 'center', fontWeight: 800, color: '#0284c7' }}>{it.qty} Pcs</td>
                        <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right' }}>{formatRp(it.hargaSatuan)}</td>
                        <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>{formatRp(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}><span>Subtotal Harga:</span><strong style={{ color: '#0f172a' }}>{formatRp(showDetail.totalHarga)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}><span>Diskon Potongan:</span><strong>- {formatRp(showDetail.diskon)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.05rem', color: '#059669', borderTop: '1px solid #cbd5e1', paddingTop: '0.45rem', marginTop: '0.2rem' }}><span>Total Penjualan Bersih:</span><span>{formatRp(showDetail.totalBersih)}</span></div>
              </div>
              {showDetail.catatan && <div style={{ marginTop: '0.8rem', padding: '0.7rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>📝 {showDetail.catatan}</div>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
