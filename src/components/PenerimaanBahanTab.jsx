import React, { useState } from 'react';
import { PackageCheck, Truck, Search, Calendar, History, CheckCircle, Clock, Plus, Inbox, ShieldCheck } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalTerimaBahanSupplier, ModalRiwayatTerimaSupplier } from './Modals';

export default function PenerimaanBahanTab({
  utangList = [],
  bahanBaku = [],
  activeRoleView,
  onReceiveBahan,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [selectedUtangForReceive, setSelectedUtangForReceive] = useState(null);
  const [selectedUtangForHistory, setSelectedUtangForHistory] = useState(null);

  const canReceive = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU' || activeRoleView === 'PEMBELIAN');

  // Filtered List
  const filteredList = utangList.filter(item => {
    const s = search.toLowerCase();
    const matchSearch = (item.supplier || '').toLowerCase().includes(s) ||
                        (item.noFaktur || '').toLowerCase().includes(s) ||
                        (item.bahanNama || '').toLowerCase().includes(s);

    const statusPeng = item.statusPengiriman || (item.jumlahDiterima > 0 ? (item.sisaBelumDiterima === 0 ? 'SUDAH DITERIMA' : 'SEBAGIAN') : 'BELUM DITERIMA');

    const matchStatus = statusFilter === 'semua' ||
                        (statusFilter === 'pending' && statusPeng !== 'SUDAH DITERIMA') ||
                        (statusFilter === 'diterima' && statusPeng === 'SUDAH DITERIMA');
    return matchSearch && matchStatus;
  });

  // Metrics
  const pendingCount = utangList.filter(x => (x.statusPengiriman || 'BELUM DITERIMA') !== 'SUDAH DITERIMA').length;
  const receivedCount = utangList.filter(x => (x.statusPengiriman || 'BELUM DITERIMA') === 'SUDAH DITERIMA').length;
  const totalQtyDiterima = utangList.reduce((acc, x) => acc + (x.jumlahDiterima || 0), 0);

  return (
    <div className="tab-pane active">
      {/* Header Toolbar */}
      <div className="toolbar" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PackageCheck size={22} style={{ color: 'var(--emerald)' }} /> Penerimaan Bahan Baku &amp; Verifikasi Fisik
          </h2>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Verifikasi fisik bahan baku yang dikirim supplier. Stok gudang akan otomatis bertambah saat barang diterima.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--amber)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Pengiriman Pending Supplier</span>
            <Truck size={18} style={{ color: 'var(--amber)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--amber)', marginTop: '0.5rem' }}>
            {pendingCount} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Faktur</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Belum diterima / partial delivery</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--emerald)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Faktur Selesai Diterima Full</span>
            <CheckCircle size={18} style={{ color: 'var(--emerald)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)', marginTop: '0.5rem' }}>
            {receivedCount} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Faktur</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fisik barang 100% terverifikasi</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: '4px solid var(--cyan)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Total Akumulasi Barang Diterima</span>
            <Inbox size={18} style={{ color: 'var(--cyan)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--cyan)', marginTop: '0.5rem' }}>
            {formatNumber(totalQtyDiterima)} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Item</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Telah masuk ke stok gudang</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Jurnal Penerimaan &amp; Pengiriman Bahan Baku</h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Klik "Terima Barang" saat supplier mengirimkan barang mentah ke gudang.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="select-input"
              style={{ width: '175px', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="semua">Semua Pengiriman</option>
              <option value="pending">Pending / Belum Diterima</option>
              <option value="diterima">Sudah Diterima Full</option>
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
              <th>BAHAN BAKU DIBELI</th>
              <th>DITERIMA (FISIK)</th>
              <th>SISA PENDING</th>
              <th>STATUS PENGIRIMAN</th>
              <th style={{ textAlign: 'center' }}>AKSI VERIFIKASI</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">
                  Belum ada faktur pengiriman bahan baku yang tercatat.
                </td>
              </tr>
            ) : (
              filteredList.map(item => {
                const totalBeli = item.jumlah || 0;
                const diterimQty = item.jumlahDiterima || 0;
                const sisaPending = item.sisaBelumDiterima !== undefined ? item.sisaBelumDiterima : Math.max(0, totalBeli - diterimQty);

                const statusPeng = item.statusPengiriman || (diterimQty > 0 ? (sisaPending === 0 ? 'SUDAH DITERIMA' : 'SEBAGIAN') : 'BELUM DITERIMA');

                const isFullReceived = statusPeng === 'SUDAH DITERIMA' || sisaPending === 0;

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.noFaktur}</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{item.supplier}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>Tgl Order: {item.tanggalBeli}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.bahanNama}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        Order Pembelian: <strong>{formatNumber(totalBeli)} {item.satuan}</strong>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: diterimQty > 0 ? 'var(--emerald)' : 'var(--text-muted)' }}>
                        {formatNumber(diterimQty)} <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.satuan}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: sisaPending > 0 ? 'var(--amber)' : 'var(--emerald)' }}>
                        {formatNumber(sisaPending)} <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.satuan}</span>
                      </div>
                    </td>
                    <td>
                      {isFullReceived ? (
                        <span className="badge badge-emerald">✓ SUDAH DITERIMA FULL</span>
                      ) : diterimQty > 0 ? (
                        <span className="badge badge-cyan">SEBAGIAN ({formatNumber(diterimQty)} {item.satuan})</span>
                      ) : (
                        <span className="badge badge-amber">⏳ BELUM DITERIMA</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        {!isFullReceived && (
                          <button
                            className="btn btn-emerald btn-sm"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                            onClick={() => setSelectedUtangForReceive(item)}
                            title="Restock &amp; Verifikasi Penerimaan Fisik Barang Baku"
                          >
                            <PackageCheck size={14} /> Restock / Terima
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setSelectedUtangForHistory(item)}
                          title="Lihat Riwayat Penerimaan Barang"
                        >
                          <History size={13} /> Riwayat
                        </button>
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
      <ModalTerimaBahanSupplier
        isOpen={!!selectedUtangForReceive}
        onClose={() => setSelectedUtangForReceive(null)}
        utangRecord={selectedUtangForReceive}
        onSubmitReceive={onReceiveBahan}
        showAlert={showAlert}
      />

      <ModalRiwayatTerimaSupplier
        isOpen={!!selectedUtangForHistory}
        onClose={() => setSelectedUtangForHistory(null)}
        utangRecord={selectedUtangForHistory}
      />
    </div>
  );
}
