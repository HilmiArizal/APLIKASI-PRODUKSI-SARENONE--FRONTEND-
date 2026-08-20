import React, { useState, useMemo } from 'react';
import { PackageCheck, Truck, Search, Calendar, History, CheckCircle, Clock, Plus, Inbox, ShieldCheck } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalTerimaBahanSupplier, ModalRiwayatTerimaSupplier } from './Modals';

// Robust date parser to YYYY-MM format
const parseYYYYMM = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();

  // Pattern YYYY-MM-DD or YYYY-MM...
  const matchIso = str.match(/^(\d{4})-(\d{2})/);
  if (matchIso) return `${matchIso[1]}-${matchIso[2]}`;

  // Pattern DD/MM/YYYY or D/M/YYYY
  const matchSlash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchSlash) return `${matchSlash[3]}-${matchSlash[2].padStart(2, '0')}`;

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch (e) {}
  return '';
};

export default function PenerimaanBahanTab({
  utangList = [],
  bahanBaku = [],
  activeRoleView,
  onReceiveBahan,
  showAlert
}) {
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentYM);
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

    const poMonth = parseYYYYMM(item.tanggalBeli);
    const hasReceiptInMonth = (item.riwayatPenerimaan || []).some(r => parseYYYYMM(r.tanggal) === selectedMonth);
    const matchMonth = selectedMonth === 'semua' || poMonth === selectedMonth || hasReceiptInMonth;

    const statusPeng = item.statusPengiriman || (item.jumlahDiterima > 0 ? (item.sisaBelumDiterima === 0 ? 'SUDAH DITERIMA' : 'SEBAGIAN') : 'BELUM DITERIMA');

    const matchStatus = statusFilter === 'semua' ||
                        (statusFilter === 'pending' && statusPeng !== 'SUDAH DITERIMA') ||
                        (statusFilter === 'diterima' && statusPeng === 'SUDAH DITERIMA');
    return matchSearch && matchMonth && matchStatus;
  });

  return (
    <div className="tab-pane active">
      {/* ===== PERIODE BULAN FILTER BAR ===== */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={15} style={{ color: 'var(--emerald)' }} /> Periode Bulan:
          </span>
          <input
            type="month"
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid var(--emerald)',
              color: '#f8fafc',
              borderRadius: 'var(--radius-sm)',
              padding: '0.45rem 0.75rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              outline: 'none',
              cursor: 'pointer'
            }}
            value={selectedMonth === 'semua' ? currentYM : selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />

          <button
            className={`btn btn-sm ${selectedMonth === currentYM ? 'btn-emerald' : 'btn-outline'}`}
            onClick={() => setSelectedMonth(currentYM)}
          >
            Bulan Berjalan
          </button>

          <button
            className={`btn btn-sm ${selectedMonth === 'semua' ? 'btn-emerald' : 'btn-outline'}`}
            onClick={() => setSelectedMonth('semua')}
          >
            Semua Periode
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Jurnal Penerimaan &amp; Pengiriman Bahan Baku</h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Klik "Restock / Terima" saat supplier mengirimkan barang mentah ke gudang. Periode: <strong>{selectedMonth === 'semua' ? 'Semua Bulan' : selectedMonth}</strong>.</span>
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
                  Belum ada faktur pengiriman bahan baku yang tercatat pada periode {selectedMonth}.
                </td>
              </tr>
            ) : (
              filteredList.map(item => {
                const totalBeli = item.jumlah || 0;
                const diterimQty = item.jumlahDiterima || 0;
                const sisaPending = item.sisaBelumDiterima !== undefined ? item.sisaBelumDiterima : Math.max(0, totalBeli - diterimQty);

                const statusPeng = item.statusPengiriman || (diterimQty > 0 ? (sisaPending === 0 ? 'SUDAH DITERIMA' : 'SEBAGIAN') : 'BELUM DITERIMA');

                const isFullReceived = statusPeng === 'SUDAH DITERIMA' || sisaPending === 0;

                // Tentukan Tanggal Penerimaan Terakhir
                let tglTerimaTerakhir = null;
                if (item.riwayatPenerimaan && item.riwayatPenerimaan.length > 0) {
                  tglTerimaTerakhir = item.riwayatPenerimaan[item.riwayatPenerimaan.length - 1].tanggal;
                } else if (diterimQty > 0) {
                  tglTerimaTerakhir = item.tanggalBeli;
                }

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.noFaktur}</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1f2d3d' }}>{item.supplier}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>Tgl Order: {item.tanggalBeli}</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: diterimQty > 0 ? 'var(--emerald)' : 'var(--amber)', marginTop: '0.15rem' }}>
                        📥 Tgl Terima: {diterimQty > 0 ? (tglTerimaTerakhir || item.tanggalBeli) : 'Belum Diterima'}
                      </div>
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
