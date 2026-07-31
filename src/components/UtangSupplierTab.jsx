import React, { useState } from 'react';
import { CreditCard, Search, History, CheckCircle, AlertTriangle, DollarSign, Trash2 } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalBayarUtangSupplier, ModalRiwayatBayarSupplier } from './Modals';

export default function UtangSupplierTab({
  utangList = [],
  activeRoleView,
  onPayUtang,
  onDeleteUtang,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [selectedUtangForPay, setSelectedUtangForPay] = useState(null);
  const [selectedUtangForHistory, setSelectedUtangForHistory] = useState(null);

  const canManage = (activeRoleView === 'ADMIN' || activeRoleView === 'PEMBELIAN');

  // Filtered List
  const filteredList = utangList.filter(item => {
    const s = search.toLowerCase();
    const matchSearch = (item.supplier || '').toLowerCase().includes(s) ||
                        (item.noFaktur || '').toLowerCase().includes(s) ||
                        (item.bahanNama || '').toLowerCase().includes(s);

    const matchStatus = statusFilter === 'semua' ||
                        (statusFilter === 'belum_lunas' && item.status !== 'LUNAS') ||
                        (statusFilter === 'lunas' && item.status === 'LUNAS');
    return matchSearch && matchStatus;
  });

  // Overview Metrics
  const totalUtangAktif = utangList
    .filter(x => x.status !== 'LUNAS')
    .reduce((acc, x) => acc + (x.sisaUtang || 0), 0);

  const totalTerbayar = utangList
    .reduce((acc, x) => acc + (x.jumlahDibayar || 0), 0);

  const totalFakturBelumLunas = utangList.filter(x => x.status !== 'LUNAS').length;

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

  return (
    <div className="tab-pane active">
      {/* Header Toolbar */}
      <div className="toolbar" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={22} style={{ color: 'var(--primary)' }} /> Utang Supplier
          </h2>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Pantau saldo utang, bayar cicilan, dan lihat riwayat pembayaran faktur supplier.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--rose)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Total Utang Supplier Aktif</span>
            <AlertTriangle size={18} style={{ color: 'var(--rose)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--rose)', marginTop: '0.5rem' }}>
            Rp {formatNumber(totalUtangAktif)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{totalFakturBelumLunas} faktur belum lunas</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--emerald)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Total Akumulasi Terbayar / DP</span>
            <CheckCircle size={18} style={{ color: 'var(--emerald)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)', marginTop: '0.5rem' }}>
            Rp {formatNumber(totalTerbayar)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pembayaran DP &amp; pelunasan</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--amber)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Total Transaksi Faktur</span>
            <CreditCard size={18} style={{ color: 'var(--amber)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--amber)', marginTop: '0.5rem' }}>
            {utangList.length} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Faktur</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tercatat dari supplier</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Daftar Tagihan &amp; Utang Supplier</h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Pantau tempo dan bayar cicilan utang bahan baku.</span>
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
              <th>TOTAL TAGIHAN</th>
              <th>DIBAYAR (DP)</th>
              <th>SISA UTANG</th>
              <th>JATUH TEMPO</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'center' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">
                  Belum ada catatan tagihan utang supplier.
                </td>
              </tr>
            ) : (
              filteredList.map(item => {
                const isLunas = item.status === 'LUNAS' || item.sisaUtang === 0;

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.noFaktur}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{item.supplier}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>Tgl Beli: {item.tanggalBeli}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.bahanNama}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {formatNumber(item.jumlah)} {item.satuan} @ Rp {formatNumber(item.hargaSatuan)}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem' }}>Rp {formatNumber(item.totalTagihan)}</strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                        Rp {formatNumber(item.jumlahDibayar)}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1rem', color: isLunas ? 'var(--emerald)' : 'var(--rose)' }}>
                        Rp {formatNumber(item.sisaUtang)}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isLunas ? 'var(--text-muted)' : 'var(--amber)' }}>
                        📅 {item.jatuhTempo}
                      </div>
                    </td>
                    <td>
                      {isLunas ? (
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
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
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
