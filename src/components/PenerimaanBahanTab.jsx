import React, { useState, useMemo } from 'react';
import { PackageCheck, Truck, Search, Calendar, History, CheckCircle, Clock, Plus, Inbox, ShieldCheck, Edit3, Trash2 } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalTerimaBahanSupplier, ModalRiwayatTerimaSupplier, ModalTambahUtangSupplier } from './Modals';
import { ModernMonthPicker } from './ModernDatePicker';

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
  onCreateUtang,
  onUpdateUtang,
  onDeleteUtang,
  showAlert
}) {
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentYM);
  const [statusFilter, setStatusFilter] = useState('semua');
  const [selectedUtangForReceive, setSelectedUtangForReceive] = useState(null);
  const [selectedUtangForHistory, setSelectedUtangForHistory] = useState(null);

  const [isTambahOpen, setIsTambahOpen] = useState(false);
  const [editingUtang, setEditingUtang] = useState(null);

  const isSuperAdmin = activeRoleView === 'ADMIN';

  const handleOpenEdit = (item) => {
    setEditingUtang(item);
    setIsTambahOpen(true);
  };

  const handleSubmitUtangModal = async (formData) => {
    if (editingUtang && onUpdateUtang) {
      const targetId = editingUtang.id || editingUtang._id || editingUtang.noFaktur;
      await onUpdateUtang(targetId, formData);
    } else if (onCreateUtang) {
      await onCreateUtang(formData);
    }
    setIsTambahOpen(false);
  };

  // Filtered List
  const filteredList = utangList.filter(item => {
    const s = search.toLowerCase();
    const matchSearch = (item.supplier || '').toLowerCase().includes(s) ||
                        (item.noFaktur || '').toLowerCase().includes(s) ||
                        (item.bahanNama || '').toLowerCase().includes(s);

    const totalBeli = item.jumlah || 0;
    const diterimQty = item.jumlahDiterima || 0;
    const sisaPending = item.sisaBelumDiterima !== undefined ? item.sisaBelumDiterima : Math.max(0, totalBeli - diterimQty);
    const statusPeng = item.statusPengiriman || (diterimQty > 0 ? (sisaPending === 0 ? 'SUDAH DITERIMA' : 'SEBAGIAN') : 'BELUM DITERIMA');

    const poMonth = parseYYYYMM(item.tanggalBeli);
    const hasReceiptInMonth = (item.riwayatPenerimaan || []).some(r => parseYYYYMM(r.tanggal) === selectedMonth);
    const isPendingForRunningMonth = (statusPeng !== 'SUDAH DITERIMA' || sisaPending > 0) && selectedMonth === currentYM;
    const matchMonth = selectedMonth === 'semua' || poMonth === selectedMonth || hasReceiptInMonth || isPendingForRunningMonth;

    const matchStatus = statusFilter === 'semua' || 
                        (statusFilter === 'pending' && statusPeng !== 'SUDAH DITERIMA') ||
                        (statusFilter === 'diterima' && statusPeng === 'SUDAH DITERIMA');
    return matchSearch && matchMonth && matchStatus;
  });

  return (
    <div className="tab-pane active">
      {/* ===== PERIODE BULAN FILTER BAR (FAR LEFT / KIRI POSISI START) ===== */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '0.75rem' }}>
        <ModernMonthPicker
          value={selectedMonth}
          onChange={(val) => setSelectedMonth(val)}
          allowAll={true}
        />
      </div>

      {/* Main Table Container */}
      <div className="table-container">
        <div style={{ padding: '0.45rem 0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>Jurnal Penerimaan &amp; Pengiriman Bahan Baku</h3>
            <span className="text-muted" style={{ fontSize: '0.68rem', display: 'block', marginTop: '0.1rem' }}>Klik "Restock / Terima" saat supplier mengirimkan barang mentah ke gudang. Periode: <strong>{selectedMonth === 'semua' ? 'Semua Bulan' : selectedMonth}</strong>.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="select-input"
              style={{ width: '160px', padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="semua">Semua Pengiriman</option>
              <option value="pending">Pending / Belum Diterima</option>
              <option value="diterima">Sudah Diterima Full</option>
            </select>

            <div className="search-box" style={{ maxWidth: '220px', padding: '0.25rem 0.55rem' }}>
              <Search size={13} style={{ color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Cari Supplier, Faktur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: '0.74rem' }}
              />
            </div>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>NO FAKTUR &amp; SUPPLIER</th>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>BAHAN BAKU DIBELI</th>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>DITERIMA (FISIK)</th>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>SISA PENDING</th>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.03em' }}>STATUS PENGIRIMAN</th>
              <th style={{ padding: '0.45rem 0.95rem', whiteSpace: 'nowrap', fontSize: '0.72rem', textAlign: 'center' }}>AKSI VERIFIKASI</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
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
                  <tr key={item.id || item._id || item.noFaktur} style={{ fontSize: '0.74rem' }}>
                    <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.74rem' }}>{item.noFaktur}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>• {item.supplier}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.74rem', color: '#0f172a' }}>{item.bahanNama}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({formatNumber(totalBeli)} {item.satuan})</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                      <strong style={{ fontSize: '0.74rem', color: diterimQty > 0 ? 'var(--emerald)' : 'var(--text-muted)' }}>
                        {formatNumber(diterimQty)} {item.satuan}
                      </strong>
                    </td>
                    <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                      <strong style={{ fontSize: '0.74rem', color: sisaPending > 0 ? 'var(--rose)' : 'var(--emerald)' }}>
                        {formatNumber(sisaPending)} {item.satuan}
                      </strong>
                    </td>
                    <td style={{ padding: '0.35rem 0.95rem', whiteSpace: 'nowrap' }}>
                      {isFullReceived ? (
                        <span className="badge badge-emerald" style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>✓ SUDAH DITERIMA FULL</span>
                      ) : diterimQty > 0 ? (
                        <span className="badge badge-amber" style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>⏳ SEBAGIAN ({formatNumber(diterimQty)} {item.satuan})</span>
                      ) : (
                        <span className="badge badge-rose" style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>📦 BELUM DITERIMA</span>
                      )}
                    </td>
                    <td style={{ padding: '0.3rem 0.75rem', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
                        {!isFullReceived && (
                          <button
                            type="button"
                            className="btn btn-emerald btn-sm"
                            style={{ padding: '0.22rem 0.55rem', fontSize: '0.72rem', height: '26px' }}
                            onClick={() => setSelectedUtangForReceive(item)}
                            title="Restock &amp; Verifikasi Penerimaan Fisik Barang Baku"
                          >
                            <PackageCheck size={12} /> Restock / Terima
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.22rem 0.55rem', fontSize: '0.72rem', height: '26px' }}
                          onClick={() => setSelectedUtangForHistory(item)}
                          title="Lihat Riwayat Penerimaan Barang"
                        >
                          <History size={12} />
                        </button>

                        {/* SUPER ADMIN EDIT & HAPUS ACTION BUTTONS */}
                        {isSuperAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Faktur Pembelian / Penerimaan"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: 'rgba(2, 132, 199, 0.08)',
                                border: '1px solid rgba(2, 132, 199, 0.28)',
                                color: '#0284c7',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                outline: 'none'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)';
                                e.currentTarget.style.color = '#ffffff';
                                e.currentTarget.style.borderColor = '#0284c7';
                                e.currentTarget.style.transform = 'scale(1.06)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(2, 132, 199, 0.08)';
                                e.currentTarget.style.color = '#0284c7';
                                e.currentTarget.style.borderColor = 'rgba(2, 132, 199, 0.28)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <Edit3 size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const targetId = item.id || item._id || item.noFaktur;
                                showAlert(
                                  `Apakah Anda yakin ingin menghapus faktur ${item.noFaktur} (${item.supplier})?`,
                                  'confirm',
                                  'Konfirmasi Hapus Faktur',
                                  () => onDeleteUtang && onDeleteUtang(targetId)
                                );
                              }}
                              title="Hapus Faktur Pembelian / Penerimaan"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: 'rgba(244, 63, 94, 0.08)',
                                border: '1px solid rgba(244, 63, 94, 0.28)',
                                color: '#e11d48',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                outline: 'none'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)';
                                e.currentTarget.style.color = '#ffffff';
                                e.currentTarget.style.borderColor = '#e11d48';
                                e.currentTarget.style.transform = 'scale(1.06)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)';
                                e.currentTarget.style.color = '#e11d48';
                                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.28)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
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

      <ModalTambahUtangSupplier
        isOpen={isTambahOpen}
        onClose={() => setIsTambahOpen(false)}
        onSubmit={handleSubmitUtangModal}
        bahanList={bahanBaku}
        editingItem={editingUtang}
      />
    </div>
  );
}
