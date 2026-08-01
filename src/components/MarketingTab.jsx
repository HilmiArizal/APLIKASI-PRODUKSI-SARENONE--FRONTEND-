import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, Trash2, Edit3, Search, X, Eye, Target, Wallet, Calendar, BarChart2, DollarSign, ShoppingBag, ArrowUpRight } from 'lucide-react';

const TIPE_PROMO = ['Diskon', 'Bundling', 'Cashback', 'Flash Sale', 'Buy 1 Get 1', 'Event Khusus'];
const STATUS_PROMO = ['Aktif', 'Selesai', 'Dibatalkan', 'Draft'];
const CHANNEL_LIST = ['Semua Channel', 'Online', 'Offline', 'Social Media', 'WhatsApp', 'Marketplace', 'Sales Direct'];

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
const formatDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };
const pct = (real, target) => target > 0 ? Math.min(100, Math.round((real / target) * 100)) : 0;

const statusColor = { 'Aktif': '#10b981', 'Selesai': '#6366f1', 'Dibatalkan': '#ef4444', 'Draft': '#f59e0b' };

export default function MarketingTab({
  marketingList = [],
  penjualanList = [],
  activeRoleView,
  activeUser,
  onCreateMarketing,
  onUpdateMarketing,
  onDeleteMarketing,
  showAlert
}) {
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editData, setEditData] = useState(null);

  const canEdit = ['ADMIN_PRODUK', 'TIM_MARKETING'].includes(activeRoleView);

  const today = new Date().toISOString().split('T')[0];
  const emptyForm = { namaPromo: '', tipePromo: 'Diskon', deskripsi: '', nilaiDiskon: 0, tipeNilai: 'persen', targetProduk: 'Semua Produk', anggaranMarketing: 0, realisasiAnggaran: 0, tanggalMulai: today, tanggalSelesai: today, status: 'Aktif', channel: 'Semua Channel', targetPenjualan: 0, hasilPenjualan: 0, catatan: '' };
  const [form, setForm] = useState(emptyForm);

  const totalAnggaran = useMemo(() => marketingList.reduce((s, m) => s + (m.anggaranMarketing || 0), 0), [marketingList]);
  const totalRealisasi = useMemo(() => marketingList.reduce((s, m) => s + (m.realisasiAnggaran || 0), 0), [marketingList]);
  const aktif = marketingList.filter(m => m.status === 'Aktif').length;
  const totalTargetPenjualan = useMemo(() => marketingList.reduce((s, m) => s + (m.targetPenjualan || 0), 0), [marketingList]);

  // Total Fee Marketing from Sales (Selisih Harga Jual vs Modal)
  const totalFeeMarketingPenjualan = useMemo(() => {
    return (penjualanList || []).reduce((sum, p) => {
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
  }, [penjualanList]);

  const filtered = useMemo(() => {
    return marketingList.filter(m => {
      const matchQ = !searchQ || m.namaPromo?.toLowerCase().includes(searchQ.toLowerCase()) || m.tipePromo?.toLowerCase().includes(searchQ.toLowerCase());
      const matchStatus = filterStatus === 'Semua' || m.status === filterStatus;
      return matchQ && matchStatus;
    });
  }, [marketingList, searchQ, filterStatus]);

  const openAdd = () => { setEditData(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (m) => {
    setEditData(m);
    setForm({ namaPromo: m.namaPromo, tipePromo: m.tipePromo || 'Diskon', deskripsi: m.deskripsi || '', nilaiDiskon: m.nilaiDiskon || 0, tipeNilai: m.tipeNilai || 'persen', targetProduk: m.targetProduk || 'Semua Produk', anggaranMarketing: m.anggaranMarketing || 0, realisasiAnggaran: m.realisasiAnggaran || 0, tanggalMulai: m.tanggalMulai || today, tanggalSelesai: m.tanggalSelesai || today, status: m.status || 'Aktif', channel: m.channel || 'Semua Channel', targetPenjualan: m.targetPenjualan || 0, hasilPenjualan: m.hasilPenjualan || 0, catatan: m.catatan || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.namaPromo.trim()) { showAlert('Nama promo wajib diisi!', 'error'); return; }
    if (!form.tanggalMulai || !form.tanggalSelesai) { showAlert('Tanggal mulai dan selesai wajib diisi!', 'error'); return; }
    if (editData) {
      await onUpdateMarketing(editData.id || editData._id, form);
    } else {
      await onCreateMarketing(form);
    }
    setShowModal(false);
  };

  const handleDelete = async (m) => {
    if (!confirm(`Hapus program marketing "${m.namaPromo}"?`)) return;
    await onDeleteMarketing(m.id || m._id);
  };

  return (
    <div className="tab-container">
      {/* HEADER */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title"><Megaphone size={24} /> Program &amp; Fee Marketing</h2>
          <p className="tab-subtitle">Kelola program promo, campaign penjualan, &amp; pantau rekapan fee margin tim marketing</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Buat Program Baru
          </button>
        )}
      </div>

      {/* SUMMARY CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}><Megaphone size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">Total Fee Mkt Terkumpul</p>
            <h3 className="stat-value" style={{ color: '#ec4899', fontSize: '1.1rem' }}>{formatRp(totalFeeMarketingPenjualan)}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}><Wallet size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Anggaran</p><h3 className="stat-value" style={{ fontSize: '1.1rem' }}>{formatRp(totalAnggaran)}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><BarChart2 size={20} /></div>
          <div className="stat-info"><p className="stat-label">Realisasi Biaya</p><h3 className="stat-value" style={{ fontSize: '1.1rem' }}>{formatRp(totalRealisasi)}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Target size={20} /></div>
          <div className="stat-info"><p className="stat-label">Program Aktif</p><h3 className="stat-value">{aktif} Campaign</h3></div>
        </div>
      </div>

      {/* REKAPAN FEE MARKETING PENJUALAN */}
      <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 12, marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Megaphone size={18} style={{ color: '#ec4899' }} /> Rekapan Fee &amp; Margin Marketing Penjualan
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Hasil selisih (margin) antara harga jual transaksi vs harga modal (Top Market / Umum) per invoice
            </p>
          </div>
          <span className="badge" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', fontSize: '0.9rem', padding: '0.4rem 0.75rem' }}>
            Total Fee: {formatRp(totalFeeMarketingPenjualan)}
          </span>
        </div>

        <div className="table-responsive">
          <table className="table" style={{ fontSize: '0.83rem' }}>
            <thead>
              <tr>
                <th>No. Faktur</th>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th>Kategori</th>
                <th>Total Omzet</th>
                <th>Fee / Margin Marketing</th>
              </tr>
            </thead>
            <tbody>
              {(penjualanList || []).length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Belum ada transaksi penjualan tercatat untuk rekapan fee marketing.
                  </td>
                </tr>
              ) : (
                (penjualanList || []).slice(0, 10).map(p => {
                  const feeOrder = p.totalFeeMarketing !== undefined ? Number(p.totalFeeMarketing) : (p.items || []).reduce((s, it) => {
                    const qty = Number(it.qty) || 1;
                    const hj = Number(it.hargaSatuan) || 0;
                    const hm = Number(it.hargaModal) || 0;
                    return s + Math.max(0, (hj - hm) * qty);
                  }, 0);

                  return (
                    <tr key={p.id || p._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)' }}>{p.noFaktur}</td>
                      <td>{p.tanggal || p.createdAt}</td>
                      <td><strong>{p.namaPelanggan}</strong></td>
                      <td>
                        <span className="badge" style={{ background: p.kategoriCustomer === 'Top Market' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.08)', color: p.kategoriCustomer === 'Top Market' ? '#f59e0b' : 'var(--text-muted)' }}>
                          {p.kategoriCustomer === 'Top Market' ? '⭐ Top Market' : 'Umum'}
                        </span>
                      </td>
                      <td><strong style={{ color: '#10b981' }}>{formatRp(p.totalBersih)}</strong></td>
                      <td><strong style={{ color: '#ec4899', fontSize: '0.98rem' }}>{formatRp(feeOrder)}</strong></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FILTER ROW PROGRAM MARKETING */}
      <div className="filter-row" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input className="search-input" placeholder="Cari nama promo / tipe..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>

        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 150 }}>
          <option value="Semua">Semua Status</option>
          {STATUS_PROMO.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* TABLE PROGRAM MARKETING */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Program</th>
              <th>Tipe</th>
              <th>Channel</th>
              <th>Target &amp; Hasil</th>
              <th>Anggaran &amp; Realisasi</th>
              <th>Periode</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Belum ada program marketing. Klik "+ Buat Program Baru" untuk membuat.
                </td>
              </tr>
            ) : (
              filtered.map(m => (
                <tr key={m.id || m._id}>
                  <td><strong>{m.namaPromo}</strong><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.targetProduk}</div></td>
                  <td><span className="badge badge-amber">{m.tipePromo}</span></td>
                  <td><span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{m.channel || 'Semua'}</span></td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>Target: {formatRp(m.targetPenjualan)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--emerald)' }}>Hasil: {formatRp(m.hasilPenjualan)} ({pct(m.hasilPenjualan, m.targetPenjualan)}%)</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>Anggaran: {formatRp(m.anggaranMarketing)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--cyan)' }}>Realisasi: {formatRp(m.realisasiAnggaran)}</div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(m.tanggalMulai)} - {formatDate(m.tanggalSelesai)}</td>
                  <td><span className="badge" style={{ background: `${statusColor[m.status]}20`, color: statusColor[m.status], border: `1px solid ${statusColor[m.status]}` }}>{m.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setShowDetail(m)}><Eye size={14} /></button>
                      {canEdit && (
                        <>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(m)}><Edit3 size={14} /></button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m)}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL PROGRAM MARKETING */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Megaphone size={20} style={{ color: 'var(--accent-primary)' }} /> {editData ? 'Edit Program Marketing' : 'Buat Program Marketing Baru'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Nama Program / Campaign *</label>
                  <input className="form-input" value={form.namaPromo} onChange={e => setForm(f => ({ ...f, namaPromo: e.target.value }))} placeholder="Contoh: Diskon Kemerdekaan 17%, Flash Sale Agustus..." required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipe Promo</label>
                  <select className="form-select" value={form.tipePromo} onChange={e => setForm(f => ({ ...f, tipePromo: e.target.value }))}>
                    {TIPE_PROMO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Channel Penjualan</label>
                  <select className="form-select" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                    {CHANNEL_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Anggaran Marketing (Rp)</label>
                  <input className="form-input" type="number" value={form.anggaranMarketing} onChange={e => setForm(f => ({ ...f, anggaranMarketing: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Realisasi Biaya (Rp)</label>
                  <input className="form-input" type="number" value={form.realisasiAnggaran} onChange={e => setForm(f => ({ ...f, realisasiAnggaran: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Penjualan (Rp)</label>
                  <input className="form-input" type="number" value={form.targetPenjualan} onChange={e => setForm(f => ({ ...f, targetPenjualan: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hasil Penjualan (Rp)</label>
                  <input className="form-input" type="number" value={form.hasilPenjualan} onChange={e => setForm(f => ({ ...f, hasilPenjualan: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Mulai *</label>
                  <input className="form-input" type="date" value={form.tanggalMulai} onChange={e => setForm(f => ({ ...f, tanggalMulai: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Selesai *</label>
                  <input className="form-input" type="date" value={form.tanggalSelesai} onChange={e => setForm(f => ({ ...f, tanggalSelesai: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Status Program</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_PROMO.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Simpan Program</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
