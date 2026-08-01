import React, { useState, useMemo } from 'react';
import { CreditCard, Search, DollarSign, Clock, CheckCircle2, User, Phone, MapPin, Eye, PlusCircle, Check, X, AlertCircle, ArrowDownLeft, Download, FileText, Trash2, Plus } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

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
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  
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

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN'].includes(activeRoleView);

  // Calculate exact dynamic net piutang for any customer
  const getNetPiutangForCustomer = (p) => {
    const custName = p.nama?.trim().toLowerCase();

    // 1. Sum of sales invoices for this customer where payment is Tempo / Cicilan / Pending
    const totalSalesTempo = (penjualanList || [])
      .filter(pj => {
        const matchId = (pj.pelangganId && (pj.pelangganId === p.id || pj.pelangganId === p._id));
        const matchName = (pj.namaPelanggan && custName && pj.namaPelanggan.trim().toLowerCase() === custName);
        return matchId || matchName;
      })
      .filter(pj => (
        pj.metodePembayaran === 'Tempo' ||
        pj.statusPembayaran === 'Tempo' ||
        pj.statusPembayaran === 'Cicilan' ||
        pj.statusPembayaran === 'Pending' ||
        p.sistemPembayaran === 'Tempo'
      ))
      .reduce((sum, pj) => sum + (Number(pj.totalBersih) || 0), 0);

    // 2. Sum of payment receipts for this customer
    const totalPayments = (pembayaranMasukList || [])
      .filter(pm => {
        const matchId = (pm.pelangganId && (pm.pelangganId === p.id || pm.pelangganId === p._id));
        const matchName = (pm.namaPelanggan && custName && pm.namaPelanggan.trim().toLowerCase() === custName);
        return matchId || matchName;
      })
      .reduce((sum, pm) => sum + (Number(pm.jumlahBayar) || 0), 0);

    const basePiutang = Number(p.totalPiutang) || 0;
    const effectiveCredit = totalSalesTempo > 0 ? totalSalesTempo : basePiutang;
    return Math.max(0, effectiveCredit - totalPayments);
  };

  // Filter customers that have matching search
  const customersWithPiutang = useMemo(() => {
    return pelangganList.filter(p => {
      const q = search.toLowerCase();
      const matchQ = !search || p.nama?.toLowerCase().includes(q) || p.kode?.toLowerCase().includes(q) || p.noHp?.includes(q);
      const matchK = !kategoriFilter || p.kategoriCustomer === kategoriFilter;
      return matchQ && matchK;
    });
  }, [pelangganList, search, kategoriFilter]);

  const totalPiutangKeseluruhan = useMemo(() => {
    return pelangganList.reduce((sum, p) => sum + getNetPiutangForCustomer(p), 0);
  }, [pelangganList, penjualanList, pembayaranMasukList]);

  const totalPelangganBerpiutang = useMemo(() => {
    return pelangganList.filter(p => getNetPiutangForCustomer(p) > 0).length;
  }, [pelangganList, penjualanList, pembayaranMasukList]);

  const totalSetoranBulanIni = useMemo(() => {
    return (pembayaranMasukList || []).reduce((sum, p) => sum + (Number(p.jumlahBayar) || 0), 0);
  }, [pembayaranMasukList]);

  // Selected customer object in form pay modal
  const selectedCustInModal = useMemo(() => {
    if (!formPay.pelangganId) return null;
    return pelangganList.find(c => (c.id || c._id) === formPay.pelangganId);
  }, [formPay.pelangganId, pelangganList]);

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
    <div className="tab-container">
      {/* HEADER */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title"><CreditCard size={24} /> Piutang &amp; Tagihan Pelanggan</h2>
          <p className="tab-subtitle">Pantau sisa piutang tempo, histori tagihan customer, &amp; catat pembayaran masuk</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            <Download size={16} style={{ color: 'var(--emerald)' }} /> Excel
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <FileText size={16} style={{ color: '#ef4444' }} /> PDF
          </button>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => openAddPayModal()} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none' }}>
              <Plus size={16} /> Catat Pembayaran Masuk
            </button>
          )}
        </div>
      </div>

      {/* STATS SUMMARY CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}><DollarSign size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Sisa Piutang Aktif</p><h3 className="stat-value" style={{ color: '#ef4444' }}>{formatRp(totalPiutangKeseluruhan)}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><ArrowDownLeft size={20} /></div>
          <div className="stat-info"><p className="stat-label">Setoran Masuk Terkumpul</p><h3 className="stat-value" style={{ color: '#10b981' }}>{formatRp(totalSetoranBulanIni)}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><User size={20} /></div>
          <div className="stat-info"><p className="stat-label">Pelanggan Berpiutang</p><h3 className="stat-value">{totalPelangganBerpiutang} Orang</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><Clock size={20} /></div>
          <div className="stat-info"><p className="stat-label">Customer Tempo Kredit</p><h3 className="stat-value">{pelangganList.filter(p => p.sistemPembayaran === 'Tempo').length}</h3></div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Cari kode C1/C2, nama pelanggan, no. HP..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select value={kategoriFilter} onChange={e => setKategoriFilter(e.target.value)} className="select-input" style={{ maxWidth: '180px' }}>
          <option value="">Semua Kategori</option>
          <option value="Top Market">Top Market</option>
          <option value="Umum">Umum</option>
        </select>
      </div>

      {/* TABLE PIUTANG PELANGGAN */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ margin: '0 0 0.75rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CreditCard size={18} style={{ color: '#ef4444' }} /> Daftar Saldo Piutang Pelanggan
        </h4>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Pelanggan</th>
                <th>Kategori</th>
                <th>Sistem Bayar</th>
                <th>No. WhatsApp</th>
                <th>Total Sisa Piutang</th>
                <th>Status Tagihan</th>
                {canEdit && <th style={{ textAlign: 'right' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {customersWithPiutang.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Tidak ada data piutang pelanggan. Seluruh piutang telah lunas atau belum ada tagihan kredit.
                  </td>
                </tr>
              ) : (
                customersWithPiutang.map(p => {
                  const sisa = getNetPiutangForCustomer(p);
                  const isLunas = sisa === 0;

                  return (
                    <tr key={p.id || p._id}>
                      <td><strong style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{p.kode || 'C1'}</strong></td>
                      <td>
                        <strong style={{ color: '#fff', fontSize: '0.98rem' }}>{p.nama}</strong>
                        {p.alamat && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}><MapPin size={11} /> {p.alamat}</div>}
                      </td>
                      <td>
                        <span className="badge" style={{ background: p.kategoriCustomer === 'Top Market' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.08)', color: p.kategoriCustomer === 'Top Market' ? '#f59e0b' : 'var(--text-muted)', border: `1px solid ${p.kategoriCustomer === 'Top Market' ? '#f59e0b' : 'var(--border-color)'}` }}>
                          {p.kategoriCustomer === 'Top Market' ? '⭐ Top Market' : 'Umum'}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: p.sistemPembayaran === 'Tempo' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: p.sistemPembayaran === 'Tempo' ? '#ef4444' : '#10b981' }}>
                          {p.sistemPembayaran || 'COD'}
                        </span>
                      </td>
                      <td>
                        {p.noHp ? (
                          <a href={`https://wa.me/${p.noHp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            <Phone size={13} /> {p.noHp}
                          </a>
                        ) : '-'}
                      </td>
                      <td>
                        <strong style={{ fontSize: '1.05rem', color: isLunas ? '#10b981' : '#ef4444' }}>
                          {formatRp(sisa)}
                        </strong>
                      </td>
                      <td>
                        {isLunas ? (
                          <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>✓ Lunas</span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>⚠️ Ada Belum Bayar</span>
                        )}
                      </td>
                      {canEdit && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            {!isLunas && (
                              <button className="btn btn-sm btn-primary" onClick={() => openAddPayModal(p)} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none' }} title="Catat Setoran / Pelunasan">
                                <PlusCircle size={14} /> Bayar Piutang
                              </button>
                            )}
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowDetailModal(p)} title="Lihat Histori Faktur"><Eye size={14} /></button>
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
      </div>

      {/* TABLE RIWAYAT PEMBAYARAN MASUK */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowDownLeft size={18} style={{ color: '#10b981' }} /> Riwayat Pembayaran Masuk Customer
          </h4>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>No. Bukti</th>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th>Faktur Terkait</th>
                <th>Jumlah Setoran (Rp)</th>
                <th>Metode Bayar</th>
                <th>No. Referensi</th>
                {canEdit && <th style={{ textAlign: 'right' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {(pembayaranMasukList || []).length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Belum ada riwayat pembayaran masuk dari pelanggan. Klik "+ Catat Pembayaran Masuk" untuk mencatat setoran baru.
                  </td>
                </tr>
              ) : (
                (pembayaranMasukList || []).map(pm => (
                  <tr key={pm.id || pm._id}>
                    <td><strong style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{pm.noBukti}</strong></td>
                    <td>{pm.tanggal || pm.createdAt}</td>
                    <td>
                      <strong style={{ color: '#fff' }}>{pm.namaPelanggan}</strong>
                      {pm.kodePelanggan && <span className="badge" style={{ marginLeft: '6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{pm.kodePelanggan}</span>}
                    </td>
                    <td>{pm.noFaktur ? <strong style={{ color: '#0ea5e9', fontFamily: 'monospace' }}>{pm.noFaktur}</strong> : '-'}</td>
                    <td><strong style={{ color: '#10b981', fontSize: '1.05rem' }}>{formatRp(pm.jumlahBayar)}</strong></td>
                    <td><span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{pm.metodePembayaran || 'Transfer Bank'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{pm.noReferensi || '-'}</td>
                    {canEdit && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => setShowKwitansi(pm)} title="Lihat Kwitansi"><Eye size={14} /></button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeletePembayaran(pm)} title="Hapus Catatan"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CATAT PEMBAYARAN MASUK */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-card modal-md" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3><ArrowDownLeft size={20} style={{ color: '#10b981' }} /> Catat Pembayaran Masuk Customer</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleProcessPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Pilih Pelanggan / Customer *</label>
                  <select className="form-select" value={formPay.pelangganId} onChange={handleSelectCustChange} required>
                    <option value="">-- Pilih Pelanggan --</option>
                    {pelangganList.map(c => {
                      const net = getNetPiutangForCustomer(c);
                      return (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          👤 [{c.kode || 'C'}] {c.nama} (Sisa Piutang: {formatRp(net)})
                        </option>
                      );
                    })}
                  </select>
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

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none' }}>
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
    </div>
  );
}
