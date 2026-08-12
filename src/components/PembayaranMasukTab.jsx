import React, { useState, useMemo } from 'react';
import { ArrowDownLeft, Plus, Search, DollarSign, Calendar, User, Phone, MapPin, Eye, Check, X, FileText, Download, Trash2, CreditCard, Filter } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

export default function PembayaranMasukTab({
  pembayaranMasukList = [],
  pelangganList = [],
  penjualanList = [],
  activeRoleView,
  activeUser,
  onCreatePembayaranMasuk,
  onDeletePembayaranMasuk,
  onOpenPdfPreview,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [metodeFilter, setMetodeFilter] = useState('');
  
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [monthFilter, setMonthFilter] = useState(currentMonthKey);

  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [showKwitansi, setShowKwitansi] = useState(null);

  const [form, setForm] = useState({
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

  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    monthsSet.add(currentMonthKey);
    pembayaranMasukList.forEach(p => {
      const t = p.tanggal || p.createdAt;
      if (t) {
        try {
          const d = new Date(t);
          if (!isNaN(d.getTime())) monthsSet.add(d.toISOString().slice(0, 7));
        } catch { /* ignore */ }
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [pembayaranMasukList, currentMonthKey]);

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

  const filtered = useMemo(() => {
    return (pembayaranMasukList || []).filter(p => {
      const q = search.toLowerCase();
      const matchQ = !search || p.namaPelanggan?.toLowerCase().includes(q) || p.kodePelanggan?.toLowerCase().includes(q) || p.noBukti?.toLowerCase().includes(q) || p.noReferensi?.toLowerCase().includes(q);
      const matchM = !metodeFilter || p.metodePembayaran === metodeFilter;

      let matchMonth = true;
      if (monthFilter && monthFilter !== 'Semua') {
        const itemDate = p.tanggal || p.createdAt;
        if (itemDate) {
          try {
            const itemKey = new Date(itemDate).toISOString().slice(0, 7);
            matchMonth = itemKey === monthFilter;
          } catch { matchMonth = true; }
        }
      }

      return matchQ && matchM && matchMonth;
    });
  }, [pembayaranMasukList, search, metodeFilter, monthFilter]);

  const totalPembayaranTerkumpul = useMemo(() => {
    return filtered.reduce((sum, p) => sum + (Number(p.jumlahBayar) || 0), 0);
  }, [filtered]);

  const totalTransaksiBayar = filtered.length;
  const pelangganUnikBayar = new Set(filtered.map(p => p.namaPelanggan)).size;

  // Selected customer object in form modal
  const selectedCustObj = useMemo(() => {
    if (!form.pelangganId) return null;
    return pelangganList.find(c => (c.id || c._id) === form.pelangganId);
  }, [form.pelangganId, pelangganList]);

  // Handle select customer in modal
  const handleSelectCustomerInModal = (e) => {
    const cId = e.target.value;
    if (!cId) {
      setForm(f => ({ ...f, pelangganId: '', namaPelanggan: '', kodePelanggan: '', jumlahBayar: '' }));
      return;
    }
    const found = pelangganList.find(c => (c.id || c._id) === cId);
    if (found) {
      setForm(f => ({
        ...f,
        pelangganId: cId,
        namaPelanggan: found.nama,
        kodePelanggan: found.kode || '',
        jumlahBayar: found.totalPiutang || ''
      }));
    }
  };

  const openAddModal = () => {
    setForm({
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
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.namaPelanggan) {
      if (showAlert) showAlert('Pelanggan wajib dipilih!', 'error');
      return;
    }
    const amount = Number(form.jumlahBayar) || 0;
    if (amount <= 0) {
      if (showAlert) showAlert('Jumlah pembayaran harus lebih besar dari Rp 0!', 'error');
      return;
    }

    if (onCreatePembayaranMasuk) {
      await onCreatePembayaranMasuk(form);
      if (showAlert) {
        showAlert(`Pembayaran sebesar ${formatRp(amount)} dari ${form.namaPelanggan} berhasil dicatat! 🎉`, 'success', 'Pembayaran Masuk');
      }
    }
    setShowModal(false);
  };

  const handleDelete = async (p) => {
    if (!confirm(`Hapus catatan pembayaran ${p.noBukti} dari ${p.namaPelanggan}? Piutang pelanggan akan dikembalikan.`)) return;
    if (onDeletePembayaranMasuk) {
      await onDeletePembayaranMasuk(p.id || p._id);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const headers = ['No. Bukti', 'Tanggal', 'Kode Customer', 'Nama Pelanggan', 'Faktur Terkait', 'Jumlah Bayar (Rp)', 'Metode', 'No. Referensi', 'Catatan'];
    const rows = filtered.map(p => [
      p.noBukti,
      p.tanggal || p.createdAt,
      p.kodePelanggan || '-',
      p.namaPelanggan,
      p.noFaktur || '-',
      p.jumlahBayar || 0,
      p.metodePembayaran || 'Transfer Bank',
      p.noReferensi || '-',
      p.catatan || '-'
    ]);
    exportToExcel('Data_Pembayaran_Masuk_Customer', headers, rows);
  };

  // Export PDF
  const handleExportPDF = () => {
    const headers = ['No. Bukti', 'Tanggal', 'Pelanggan & Kode', 'Faktur', 'Jumlah Bayar', 'Metode Bayar'];
    const rows = filtered.map(p => [
      p.noBukti,
      p.tanggal || p.createdAt,
      `${p.namaPelanggan}\n(${p.kodePelanggan || 'C'})`,
      p.noFaktur || '-',
      formatRp(p.jumlahBayar),
      p.metodePembayaran || 'Transfer Bank'
    ]);
    const config = {
      title: 'Laporan Pembayaran Masuk Customer',
      subtitle: `Daftar setoran & pelunasan piutang pelanggan Saren One.`,
      headers,
      rows,
      summaryText: `Total Setoran Terkumpul: ${formatRp(totalPembayaranTerkumpul)} | Total Transaksi: ${filtered.length}`,
      filename: 'Data_Pembayaran_Masuk_Customer'
    };
    if (onOpenPdfPreview) onOpenPdfPreview(config);
    else exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
  };

  return (
    <div className="tab-container">
      {/* HEADER */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title"><ArrowDownLeft size={24} style={{ color: '#10b981' }} /> Pembayaran Masuk Customer</h2>
          <p className="tab-subtitle">Catat setoran tunai, transfer bank, &amp; pelunasan piutang tempo dari pelanggan</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            <Download size={16} style={{ color: 'var(--emerald)' }} /> Excel
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <FileText size={16} style={{ color: '#ef4444' }} /> PDF
          </button>
          {canEdit && (
            <button className="btn btn-primary" onClick={openAddModal} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
              <Plus size={16} /> Catat Pembayaran Masuk
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><DollarSign size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">Total Setoran Terkumpul</p>
            <h3 className="stat-value" style={{ color: '#10b981' }}>{formatRp(totalPembayaranTerkumpul)}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><ArrowDownLeft size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">Jumlah Setoran Masuk</p>
            <h3 className="stat-value">{totalTransaksiBayar} Transaksi</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><User size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">Pelanggan Melakukan Setoran</p>
            <h3 className="stat-value">{pelangganUnikBayar} Orang</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><CreditCard size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">Periode Filter</p>
            <h3 className="stat-value" style={{ fontSize: '0.98rem' }}>{formatMonthName(monthFilter)}</h3>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Cari No. Bukti PAY, Kode C1, Nama Pelanggan..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="select-input" style={{ maxWidth: '180px', fontWeight: 600 }}>
          <option value="Semua">🗓️ Semua Bulan</option>
          {availableMonths.map(m => (
            <option key={m} value={m}>🗓️ {formatMonthName(m)}</option>
          ))}
        </select>

        <select value={metodeFilter} onChange={e => setMetodeFilter(e.target.value)} className="select-input" style={{ maxWidth: '170px' }}>
          <option value="">Semua Metode</option>
          <option value="Transfer Bank">Transfer Bank</option>
          <option value="Tunai">Tunai / Cash</option>
          <option value="QRIS">QRIS</option>
          <option value="Giro / Cek">Giro / Cek</option>
        </select>
      </div>

      {/* TABLE */}
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Belum ada catatan pembayaran masuk dari pelanggan pada periode ini.
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id || p._id}>
                  <td><strong style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{p.noBukti}</strong></td>
                  <td>{p.tanggal || p.createdAt}</td>
                  <td>
                    <strong style={{ color: '#fff' }}>{p.namaPelanggan}</strong>
                    {p.kodePelanggan && <span className="badge" style={{ marginLeft: '6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{p.kodePelanggan}</span>}
                  </td>
                  <td>{p.noFaktur ? <strong style={{ color: '#0ea5e9', fontFamily: 'monospace' }}>{p.noFaktur}</strong> : '-'}</td>
                  <td><strong style={{ color: '#10b981', fontSize: '1.05rem' }}>{formatRp(p.jumlahBayar)}</strong></td>
                  <td><span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{p.metodePembayaran || 'Transfer Bank'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.noReferensi || '-'}</td>
                  {canEdit && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setShowKwitansi(p)} title="Lihat Kwitansi"><Eye size={14} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)} title="Hapus Catatan"><Trash2 size={14} /></button>
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
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card modal-md" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3><ArrowDownLeft size={20} style={{ color: '#10b981' }} /> Catat Pembayaran Masuk Customer</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Pilih Pelanggan / Customer *</label>
                  <select className="form-select" value={form.pelangganId} onChange={handleSelectCustomerInModal} required>
                    <option value="">-- Pilih Pelanggan --</option>
                    {pelangganList.map(c => (
                      <option key={c.id || c._id} value={c.id || c._id}>
                        👤 [{c.kode || 'C'}] {c.nama} (Sisa Piutang: {formatRp(c.totalPiutang)})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustObj && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 10, margin: '0.75rem 0 1rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>Sisa Piutang Aktif Customer:</span>
                    <strong style={{ color: '#ef4444', fontSize: '1.05rem' }}>{formatRp(selectedCustObj.totalPiutang)}</strong>
                  </div>
                )}

                <div className="form-grid" style={{ marginTop: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Tanggal Pembayaran *</label>
                    <input className="form-input" type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Faktur Terkait (Opsional)</label>
                    <input className="form-input" placeholder="INV-202608..." value={form.noFaktur} onChange={e => setForm(f => ({ ...f, noFaktur: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">Jumlah Setoran / Pembayaran (Rp) *</label>
                  <input className="form-input" type="number" min={1} value={form.jumlahBayar} onChange={e => setForm(f => ({ ...f, jumlahBayar: e.target.value }))} placeholder="500000" required />
                </div>

                <div className="form-grid" style={{ marginTop: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Metode Pembayaran</label>
                    <select className="form-select" value={form.metodePembayaran} onChange={e => setForm(f => ({ ...f, metodePembayaran: e.target.value }))}>
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="Tunai">Tunai / Cash</option>
                      <option value="QRIS">QRIS</option>
                      <option value="Giro / Cek">Giro / Cek</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">No. Referensi / Reff Reft</label>
                    <input className="form-input" placeholder="No. resi / reff transfer" value={form.noReferensi} onChange={e => setForm(f => ({ ...f, noReferensi: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">Catatan Keterangan</label>
                  <input className="form-input" placeholder="Contoh: Setoran cicilan 1 via BCA..." value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
                  <Check size={16} /> Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: KWITANSI PEMBAYARAN */}
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
