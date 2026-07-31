import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, Trash2, Edit3, Search, X, Eye, Target, Wallet, Calendar, BarChart2 } from 'lucide-react';

const TIPE_PROMO = ['Diskon', 'Bundling', 'Cashback', 'Flash Sale', 'Buy 1 Get 1', 'Event Khusus'];
const STATUS_PROMO = ['Aktif', 'Selesai', 'Dibatalkan', 'Draft'];
const CHANNEL_LIST = ['Semua Channel', 'Online', 'Offline', 'Social Media', 'WhatsApp', 'Marketplace', 'Sales Direct'];

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
const formatDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };
const pct = (real, target) => target > 0 ? Math.min(100, Math.round((real / target) * 100)) : 0;

const statusColor = { 'Aktif': '#10b981', 'Selesai': '#6366f1', 'Dibatalkan': '#ef4444', 'Draft': '#f59e0b' };

export default function MarketingTab({ marketingList = [], activeRoleView, activeUser, onCreateMarketing, onUpdateMarketing, onDeleteMarketing, showAlert }) {
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
          <h2 className="tab-title"><Megaphone size={24} /> Program Marketing</h2>
          <p className="tab-subtitle">Kelola program promo, diskon, & campaign penjualan</p>
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
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Megaphone size={20} /></div>
          <div className="stat-info"><p className="stat-label">Program Aktif</p><h3 className="stat-value">{aktif}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}><Wallet size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Anggaran</p><h3 className="stat-value" style={{ fontSize: '1.05rem' }}>{formatRp(totalAnggaran)}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><BarChart2 size={20} /></div>
          <div className="stat-info"><p className="stat-label">Realisasi Anggaran</p><h3 className="stat-value" style={{ fontSize: '1.05rem' }}>{formatRp(totalRealisasi)}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><Target size={20} /></div>
          <div className="stat-info"><p className="stat-label">Target Penjualan</p><h3 className="stat-value" style={{ fontSize: '1.05rem' }}>{formatRp(totalTargetPenjualan)}</h3></div>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="filter-row" style={{ marginBottom: '1rem' }}>
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input className="search-input" placeholder="Cari nama promo / tipe..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 140 }}>
          <option value="Semua">Semua Status</option>
          {STATUS_PROMO.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* CARDS GRID */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 12, border: '2px dashed var(--border-color)' }}>
          <Megaphone size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} /><br />
          Belum ada program marketing.{canEdit && <span> Klik "+ Buat Program Baru" untuk memulai.</span>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filtered.map(m => {
            const penjualanPct = pct(m.hasilPenjualan, m.targetPenjualan);
            const anggaranPct = pct(m.realisasiAnggaran, m.anggaranMarketing);
            return (
              <div key={m.id || m._id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '1.25rem', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                {/* Status badge */}
                <span style={{ position: 'absolute', top: 12, right: 12, background: statusColor[m.status] || '#6b7280', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{m.status}</span>

                {/* Tipe badge */}
                <div style={{ marginBottom: '0.3rem' }}>
                  <span style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>{m.tipePromo}</span>
                </div>

                <h4 style={{ margin: '0.4rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', paddingRight: '4rem' }}>{m.namaPromo}</h4>
                {m.deskripsi && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.6rem' }}>{m.deskripsi}</p>}

                {/* Info row */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                  <span><Calendar size={12} style={{ marginRight: 3 }} />{formatDate(m.tanggalMulai)} – {formatDate(m.tanggalSelesai)}</span>
                  {m.nilaiDiskon > 0 && <span>💸 {m.nilaiDiskon}{m.tipeNilai === 'persen' ? '%' : ' Rp'} off</span>}
                  {m.channel && <span>📡 {m.channel}</span>}
                </div>

                {/* Target produk */}
                {m.targetProduk && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>🎯 Produk: <strong>{m.targetProduk}</strong></div>}

                {/* Progress: Anggaran */}
                {m.anggaranMarketing > 0 && (
                  <div style={{ marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span>💰 Anggaran terpakai</span><span>{anggaranPct}%</span>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 99, height: 6 }}>
                      <div style={{ background: anggaranPct > 90 ? '#ef4444' : '#6366f1', borderRadius: 99, height: '100%', width: `${anggaranPct}%`, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      <span>{formatRp(m.realisasiAnggaran)}</span><span>{formatRp(m.anggaranMarketing)}</span>
                    </div>
                  </div>
                )}

                {/* Progress: Penjualan */}
                {m.targetPenjualan > 0 && (
                  <div style={{ marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span>📈 Hasil penjualan</span><span>{penjualanPct}%</span>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 99, height: 6 }}>
                      <div style={{ background: penjualanPct >= 100 ? '#10b981' : '#0ea5e9', borderRadius: 99, height: '100%', width: `${penjualanPct}%`, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      <span>{formatRp(m.hasilPenjualan)}</span><span>{formatRp(m.targetPenjualan)}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowDetail(m)}><Eye size={14} /> Detail</button>
                  {canEdit && <>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(m)}><Edit3 size={14} /> Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m)}><Trash2 size={14} /></button>
                  </>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editData ? 'Edit Program Marketing' : 'Buat Program Marketing Baru'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Nama Program / Promo *</label>
                  <input className="form-input" value={form.namaPromo} onChange={e => setForm(f => ({ ...f, namaPromo: e.target.value }))} placeholder="Contoh: Promo Lebaran 2026, Flash Sale Agustus" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipe Promo</label>
                  <select className="form-select" value={form.tipePromo} onChange={e => setForm(f => ({ ...f, tipePromo: e.target.value }))}>
                    {TIPE_PROMO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_PROMO.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Deskripsi Program</label>
                  <textarea className="form-input" rows={2} value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} placeholder="Keterangan singkat program marketing ini..." style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nilai Diskon</label>
                  <input className="form-input" type="number" min={0} value={form.nilaiDiskon} onChange={e => setForm(f => ({ ...f, nilaiDiskon: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipe Nilai Diskon</label>
                  <select className="form-select" value={form.tipeNilai} onChange={e => setForm(f => ({ ...f, tipeNilai: e.target.value }))}>
                    <option value="persen">Persen (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Target Produk</label>
                  <input className="form-input" value={form.targetProduk} onChange={e => setForm(f => ({ ...f, targetProduk: e.target.value }))} placeholder="Contoh: Semua Produk, Roti Keju, Croissant" />
                </div>
                <div className="form-group">
                  <label className="form-label">Channel Marketing</label>
                  <select className="form-select" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                    {CHANNEL_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Anggaran Marketing (Rp)</label>
                  <input className="form-input" type="number" min={0} value={form.anggaranMarketing} onChange={e => setForm(f => ({ ...f, anggaranMarketing: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Realisasi Anggaran (Rp)</label>
                  <input className="form-input" type="number" min={0} value={form.realisasiAnggaran} onChange={e => setForm(f => ({ ...f, realisasiAnggaran: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Penjualan (Rp)</label>
                  <input className="form-input" type="number" min={0} value={form.targetPenjualan} onChange={e => setForm(f => ({ ...f, targetPenjualan: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hasil Penjualan Aktual (Rp)</label>
                  <input className="form-input" type="number" min={0} value={form.hasilPenjualan} onChange={e => setForm(f => ({ ...f, hasilPenjualan: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Mulai *</label>
                  <input className="form-input" type="date" value={form.tanggalMulai} onChange={e => setForm(f => ({ ...f, tanggalMulai: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Selesai *</label>
                  <input className="form-input" type="date" value={form.tanggalSelesai} onChange={e => setForm(f => ({ ...f, tanggalSelesai: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Catatan Internal</label>
                  <input className="form-input" value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Catatan tambahan untuk tim internal..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editData ? 'Simpan Perubahan' : 'Buat Program'}</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-container" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail — {showDetail.namaPromo}</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {[['Tipe Promo', showDetail.tipePromo], ['Status', showDetail.status], ['Deskripsi', showDetail.deskripsi || '-'], ['Nilai Diskon', showDetail.nilaiDiskon ? `${showDetail.nilaiDiskon}${showDetail.tipeNilai === 'persen' ? '%' : ' Rp'}` : '-'], ['Target Produk', showDetail.targetProduk], ['Channel', showDetail.channel || '-'], ['Tanggal', `${formatDate(showDetail.tanggalMulai)} – ${formatDate(showDetail.tanggalSelesai)}`], ['Anggaran', formatRp(showDetail.anggaranMarketing)], ['Realisasi Anggaran', formatRp(showDetail.realisasiAnggaran)], ['Target Penjualan', formatRp(showDetail.targetPenjualan)], ['Hasil Penjualan', formatRp(showDetail.hasilPenjualan)], ['Dibuat oleh', showDetail.createdBy || '-']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{k}</span><span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
              {showDetail.catatan && <div style={{ marginTop: '0.8rem', padding: '0.7rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>📝 {showDetail.catatan}</div>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
