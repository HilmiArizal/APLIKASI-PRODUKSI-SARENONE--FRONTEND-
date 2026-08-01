import React, { useState, useMemo } from 'react';
import { CreditCard, Search, DollarSign, Clock, CheckCircle2, User, Phone, MapPin, Eye, PlusCircle, Check, X, AlertCircle } from 'lucide-react';

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

export default function PiutangPelangganTab({
  pelangganList = [],
  penjualanList = [],
  activeRoleView,
  activeUser,
  onUpdatePelanggan,
  onUpdatePenjualan,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [showPayModal, setShowPayModal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(null);

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Transfer Bank');
  const [payNotes, setPayNotes] = useState('');

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN'].includes(activeRoleView);

  // Filter customers that have totalPiutang > 0 or matching search
  const customersWithPiutang = useMemo(() => {
    return pelangganList.filter(p => {
      const q = search.toLowerCase();
      const matchQ = !search || p.nama?.toLowerCase().includes(q) || p.kode?.toLowerCase().includes(q) || p.noHp?.includes(q);
      const matchK = !kategoriFilter || p.kategoriCustomer === kategoriFilter;
      return matchQ && matchK;
    });
  }, [pelangganList, search, kategoriFilter]);

  const totalPiutangKeseluruhan = useMemo(() => {
    return pelangganList.reduce((sum, p) => sum + (Number(p.totalPiutang) || 0), 0);
  }, [pelangganList]);

  const totalPelangganBerpiutang = useMemo(() => {
    return pelangganList.filter(p => (Number(p.totalPiutang) || 0) > 0).length;
  }, [pelangganList]);

  const openPayModal = (p) => {
    setShowPayModal(p);
    setPayAmount(p.totalPiutang || 0);
    setPayMethod('Transfer Bank');
    setPayNotes('');
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!showPayModal) return;

    const currentPiutang = Number(showPayModal.totalPiutang) || 0;
    const amount = Number(payAmount) || 0;

    if (amount <= 0) {
      if (showAlert) showAlert('Jumlah pembayaran harus lebih dari Rp 0!', 'error');
      return;
    }

    if (amount > currentPiutang) {
      if (showAlert) showAlert('Jumlah pembayaran melebihi total sisa piutang!', 'error');
      return;
    }

    const newPiutang = Math.max(0, currentPiutang - amount);
    const updatedPayload = {
      ...showPayModal,
      totalPiutang: newPiutang
    };

    if (onUpdatePelanggan) {
      await onUpdatePelanggan(showPayModal.id || showPayModal._id, updatedPayload);
      if (showAlert) {
        showAlert(`Pembayaran piutang ${showPayModal.nama} sebesar ${formatRp(amount)} berhasil dicatat! 🎉`, 'success', 'Pembayaran Piutang');
      }
    }

    setShowPayModal(null);
  };

  return (
    <div className="tab-container">
      {/* HEADER */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title"><CreditCard size={24} /> Piutang &amp; Tagihan Pelanggan</h2>
          <p className="tab-subtitle">Pantau sisa piutang tempo, histori tagihan per customer, &amp; catat pelunasan pembayaran</p>
        </div>
      </div>

      {/* STATS SUMMARY CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}><DollarSign size={20} /></div>
          <div className="stat-info"><p className="stat-label">Total Sisa Piutang Aktif</p><h3 className="stat-value" style={{ color: '#ef4444' }}>{formatRp(totalPiutangKeseluruhan)}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><User size={20} /></div>
          <div className="stat-info"><p className="stat-label">Pelanggan Berpiutang</p><h3 className="stat-value">{totalPelangganBerpiutang} Orang</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><Clock size={20} /></div>
          <div className="stat-info"><p className="stat-label">Customer Tempo Kredit</p><h3 className="stat-value">{pelangganList.filter(p => p.sistemPembayaran === 'Tempo').length}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><CheckCircle2 size={20} /></div>
          <div className="stat-info"><p className="stat-label">Pelanggan Bebas Piutang</p><h3 className="stat-value">{pelangganList.length - totalPelangganBerpiutang}</h3></div>
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

      {/* TABLE PIUTANG */}
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
                <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Tidak ada data piutang pelanggan. Seluruh piutang telah lunas atau belum ada tagihan kredit.
                </td>
              </tr>
            ) : (
              customersWithPiutang.map(p => {
                const sisa = Number(p.totalPiutang) || 0;
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
                            <button className="btn btn-sm btn-primary" onClick={() => openPayModal(p)} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none' }} title="Catat Pelunasan / Cicilan">
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

      {/* MODAL 1: CATAT PEMBAYARAN PIUTANG */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(null)}>
          <div className="modal-card modal-sm" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3><CreditCard size={20} style={{ color: '#10b981' }} /> Catat Pembayaran Piutang</h3>
              <button className="modal-close" onClick={() => setShowPayModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleProcessPayment}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: 10, marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pelanggan:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{showPayModal.kode} — {showPayModal.nama}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sisa Piutang Saat Ini:</span>
                    <strong style={{ color: '#ef4444', fontSize: '1.05rem' }}>{formatRp(showPayModal.totalPiutang)}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Jumlah Pembayaran / Setoran (Rp) *</label>
                  <input className="form-input" type="number" min={1} max={showPayModal.totalPiutang} value={payAmount} onChange={e => setPayAmount(e.target.value)} required />
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">Metode Pembayaran</label>
                  <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai">Tunai / Cash</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Giro / Cek">Giro / Cek</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">Catatan Pembayaran</label>
                  <input className="form-input" placeholder="Contoh: Cicilan tahap 1 via BCA..." value={payNotes} onChange={e => setPayNotes(e.target.value)} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none' }}>
                  <Check size={16} /> Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HISTORI PENJUALAN / FAKTUR PELANGGAN */}
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
    </div>
  );
}
