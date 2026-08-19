import React, { useState } from 'react';
import { FileText, Plus, Search, Trash2, CheckCircle2, Clock, Calculator, AlertCircle, X, ChevronRight, ArrowRight, ChefHat, Eye } from 'lucide-react';
import { cleanFloat, formatRupiah } from '../utils/numberUtils';

export default function EstimasiPOTab({
  estimasiPOList = [],
  produk = [],
  bahanBaku = [],
  resep = {},
  pelangganList = [],
  activeUser,
  activeRoleView,
  onCreateEstimasiPO,
  onUpdateStatusPO,
  onDeletePO,
  onOpenModalProduksi,
  showAlert
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State: Create Estimasi PO
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [noEstimasi, setNoEstimasi] = useState('');
  const [pelangganNama, setPelangganNama] = useState('');
  const [tanggalEstimasi, setTanggalEstimasi] = useState(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState('');
  const [items, setItems] = useState([
    { produkId: produk[0]?.id || '', jumlahPcs: 10, catatanItem: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State: BOM Calculator
  const [selectedPOForBOM, setSelectedPOForBOM] = useState(null);

  const canCreate = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'ADMIN'].includes(activeRoleView);
  const canUpdateStatus = ['ADMIN_PRODUK', 'ADMIN'].includes(activeRoleView);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const autoNo = `EST-${today.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    setNoEstimasi(autoNo);
    setPelangganNama(pelangganList[0]?.nama || '');
    setTanggalEstimasi(today);
    setCatatan('');
    setItems([{ produkId: produk[0]?.id || '', jumlahPcs: 20, catatanItem: '' }]);
    setIsModalCreateOpen(true);
  };

  // Add Item Row in Modal
  const handleAddItemRow = () => {
    setItems(prev => [...prev, { produkId: produk[0]?.id || '', jumlahPcs: 10, catatanItem: '' }]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (index) => {
    if (items.length <= 1) {
      alert('Minimal harus ada 1 item produk dalam estimasi PO!');
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handle Item Row Change
  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Submit Create PO
  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (!pelangganNama.trim()) {
      alert('Nama Pelanggan/Klien wajib diisi!');
      return;
    }

    const formattedItems = items.map(it => {
      const p = produk.find(x => x.id === it.produkId || x._id === it.produkId || x.sku === it.produkId);
      return {
        produkId: it.produkId,
        produkNama: p ? p.nama : 'Produk',
        produkSku: p ? p.sku : '',
        jumlahPcs: Number(it.jumlahPcs) || 0,
        catatanItem: it.catatanItem || ''
      };
    }).filter(it => it.jumlahPcs > 0);

    if (formattedItems.length === 0) {
      alert('Minimal harus ada 1 item dengan Jumlah Pcs > 0!');
      return;
    }

    setIsSubmitting(true);
    await onCreateEstimasiPO({
      noEstimasi,
      tanggalEstimasi,
      pelangganNama,
      salesName: activeUser?.name || 'Tim Penjualan',
      items: formattedItems,
      catatan
    });
    setIsSubmitting(false);
    setIsModalCreateOpen(false);
  };

  // Filter List
  const filteredPO = estimasiPOList.filter(po => {
    const matchStatus = selectedStatus === 'ALL' || po.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      (po.noEstimasi && po.noEstimasi.toLowerCase().includes(q)) ||
      (po.pelangganNama && po.pelangganNama.toLowerCase().includes(q)) ||
      (po.salesName && po.salesName.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  // Calculate Required BOM Raw Materials for a specific PO
  const calculateBOMNeeds = (po) => {
    if (!po || !po.items) return [];

    const rawMaterialsNeeded = {};

    po.items.forEach(item => {
      const pId = item.produkId;
      const targetQty = Number(item.jumlahPcs) || 0;

      // Find recipe items for this product
      let formula = resep[pId] || [];
      if (formula.length === 0) {
        // Fallback matching by SKU
        const pObj = produk.find(x => x.id === pId || x._id === pId || x.sku === pId);
        if (pObj) {
          formula = resep[pObj.id] || resep[pObj.sku] || resep[pObj._id] || [];
        }
      }

      formula.forEach(fItem => {
        const bId = fItem.bahanId;
        const perPcsTakaran = Number(fItem.takaran) || 0;
        const totalNeedForThisItem = perPcsTakaran * targetQty;

        if (!rawMaterialsNeeded[bId]) {
          rawMaterialsNeeded[bId] = 0;
        }
        rawMaterialsNeeded[bId] += totalNeedForThisItem;
      });
    });

    // Map to array with current stock comparison
    const result = Object.keys(rawMaterialsNeeded).map(bId => {
      const bObj = bahanBaku.find(x => x.id === bId || x._id === bId || x.sku === bId || x.nama === bId);
      const totalNeed = cleanFloat(rawMaterialsNeeded[bId]);
      const currentStok = bObj ? Number(bObj.stok || 0) : 0;
      const isShortage = currentStok < totalNeed;
      const shortageAmount = isShortage ? cleanFloat(totalNeed - currentStok) : 0;

      return {
        bahanId: bId,
        nama: bObj ? bObj.nama : 'Bahan Baku (' + bId + ')',
        satuan: bObj ? bObj.satuan : 'kg',
        totalNeed,
        currentStok,
        isShortage,
        shortageAmount
      };
    });

    return result.sort((a, b) => (b.isShortage ? 1 : 0) - (a.isShortage ? 1 : 0));
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> Diajukan (Sales)</span>;
      case 'APPROVED':
        return <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={12} /> Disetujui (Admin)</span>;
      case 'DIPROSES':
        return <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><ChefHat size={12} /> Diproses Produksi</span>;
      case 'SELESAI':
        return <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={12} /> Selesai</span>;
      case 'DIBATALKAN':
        return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><X size={12} /> Dibatalkan</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const totalSubmitted = estimasiPOList.filter(x => x.status === 'SUBMITTED').length;
  const totalDiproses = estimasiPOList.filter(x => x.status === 'DIPROSES').length;
  const totalPcsAll = estimasiPOList.reduce((acc, po) => acc + (po.items ? po.items.reduce((sum, i) => sum + (Number(i.jumlahPcs) || 0), 0) : 0), 0);

  return (
    <div className="tab-pane active">
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={24} style={{ color: 'var(--amber)' }} /> Estimasi PO &amp; Perencanaan Produksi
          </h2>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Estimasi pesanan dari Tim Penjualan untuk kalkulasi otomatis kebutuhan bahan baku &amp; persiapan batch produksi.
          </p>
        </div>

        {canCreate && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} /> Buat Estimasi PO Baru
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Estimasi PO</div>
          <div className="stat-value">{estimasiPOList.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Dokumen</span></div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Permintaan Pesanan (Sales)</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{totalSubmitted} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Perlu Review</span></div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Sedang Diproses Produksi</div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>{totalDiproses} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>PO Active</span></div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Target Pcs Pesanan</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{totalPcsAll.toLocaleString('id-ID')} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pcs</span></div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'SUBMITTED', label: 'Diajukan' },
              { id: 'APPROVED', label: 'Disetujui' },
              { id: 'DIPROSES', label: 'Diproses' },
              { id: 'SELESAI', label: 'Selesai' },
              { id: 'DIBATALKAN', label: 'Dibatalkan' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`btn btn-sm ${selectedStatus === tab.id ? 'btn-amber' : 'btn-outline'}`}
                onClick={() => setSelectedStatus(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Cari PO / Pelanggan / Sales..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Data Table View */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>NO ESTIMASI PO</th>
              <th>TANGGAL TARGET</th>
              <th>PELANGGAN / KLIEN</th>
              <th>SALES</th>
              <th>ITEM PRODUK &amp; TARGET QUANTITY</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>AKSI &amp; KALKULASI BOM</th>
            </tr>
          </thead>
          <tbody>
            {filteredPO.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }} className="text-muted">
                  Belum ada dokumen Estimasi PO pesanan. Klik <strong>"Buat Estimasi PO Baru"</strong> untuk mengajukan.
                </td>
              </tr>
            ) : (
              filteredPO.map(po => {
                const totalPcsPO = (po.items || []).reduce((acc, curr) => acc + (Number(curr.jumlahPcs) || 0), 0);
                const bomCalc = calculateBOMNeeds(po);
                const hasShortage = bomCalc.some(b => b.isShortage);

                return (
                  <tr key={po.id}>
                    <td>
                      <strong style={{ color: 'var(--amber)', fontSize: '0.92rem' }}>{po.noEstimasi}</strong>
                    </td>
                    <td>{po.tanggalEstimasi}</td>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{po.pelangganNama}</strong>
                    </td>
                    <td>{po.salesName}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {(po.items || []).map((it, idx) => (
                          <div key={idx} style={{ fontSize: '0.83rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--cyan)' }}>{it.produkNama}</span>: <strong>{it.jumlahPcs.toLocaleString('id-ID')} pcs</strong>
                          </div>
                        ))}
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Total: <strong>{totalPcsPO.toLocaleString('id-ID')} pcs</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                        {getStatusBadge(po.status)}
                        {hasShortage && (
                          <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                            <AlertCircle size={10} /> Stok Bahan Kurang
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* BOM Calculator Button */}
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ borderColor: 'var(--amber)', color: 'var(--amber)' }}
                          onClick={() => setSelectedPOForBOM(po)}
                          title="Hitung Kebutuhan Bahan Baku (BOM)"
                        >
                          <Calculator size={14} /> Hitung Bahan
                        </button>

                        {/* Status Switch Dropdown for Admin */}
                        {canUpdateStatus && (
                          <select
                            className="select-input"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 'auto' }}
                            value={po.status}
                            onChange={(e) => onUpdateStatusPO(po.id, e.target.value)}
                          >
                            <option value="SUBMITTED">Diajukan</option>
                            <option value="APPROVED">Disetujui</option>
                            <option value="DIPROSES">Diproses</option>
                            <option value="SELESAI">Selesai</option>
                            <option value="DIBATALKAN">Dibatalkan</option>
                          </select>
                        )}

                        {/* Delete PO Button */}
                        {canCreate && (
                          <button
                            className="btn btn-sm btn-outline btn-danger"
                            onClick={() => {
                              if (window.confirm(`Hapus estimasi PO ${po.noEstimasi}?`)) {
                                onDeletePO(po.id);
                              }
                            }}
                            title="Hapus Estimasi PO"
                          >
                            <Trash2 size={14} />
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

      {/* ===== MODAL 1: BUAT ESTIMASI PO BARU ===== */}
      {isModalCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3><FileText size={20} style={{ color: 'var(--amber)' }} /> Buat Estimasi PO Baru (Penjualan)</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsModalCreateOpen(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmitPO}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label>No Estimasi PO *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={noEstimasi}
                      onChange={e => setNoEstimasi(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Tanggal Target Delivery *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={tanggalEstimasi}
                      onChange={e => setTanggalEstimasi(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Pelanggan / Klien *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nama Toko / Klien / Supermarket..."
                    value={pelangganNama}
                    onChange={e => setPelangganNama(e.target.value)}
                    required
                  />
                </div>

                {/* Multi-Item Product Table Selector */}
                <div className="mt-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'var(--amber)' }}>
                      Daftar Produk &amp; Jumlah Pcs (Target Pesanan):
                    </label>
                    <button type="button" className="btn btn-sm btn-outline" onClick={handleAddItemRow}>
                      <Plus size={14} /> Tambah Baris Produk
                    </button>
                  </div>

                  {items.map((it, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2rem', gap: '0.5rem', marginBottom: '0.6rem', alignItems: 'center' }}>
                      <select
                        className="select-input"
                        value={it.produkId}
                        onChange={e => handleItemChange(idx, 'produkId', e.target.value)}
                      >
                        {produk.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.sku} - {p.nama}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        placeholder="Jumlah Pcs"
                        value={it.jumlahPcs}
                        onChange={e => handleItemChange(idx, 'jumlahPcs', e.target.value)}
                        required
                      />

                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-danger"
                        onClick={() => handleRemoveItemRow(idx)}
                        style={{ padding: '0.35rem' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="form-group mt-3">
                  <label>Catatan Estimasi PO</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Instruksi pengiriman / pengemasan khusus..."
                    value={catatan}
                    onChange={e => setCatatan(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalCreateOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  <FileText size={16} /> Ajukan Estimasi PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL 2: BOM CALCULATOR (KALKULASI BAHAN BAKU) ===== */}
      {selectedPOForBOM && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '760px' }}>
            <div className="modal-header">
              <h3><Calculator size={20} style={{ color: 'var(--amber)' }} /> Kalkulasi Bahan Baku BOM: {selectedPOForBOM.noEstimasi}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedPOForBOM(null)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'rgba(249, 115, 22, 0.08)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pelanggan / Klien</div>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{selectedPOForBOM.pelangganNama}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tanggal Delivery Target</div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--amber)' }}>{selectedPOForBOM.tanggalEstimasi}</strong>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', color: 'var(--cyan)', marginBottom: '0.5rem' }}>
                Kebutuhan Bahan Baku Berdasarkan Formulasi Resep (BOM):
              </h4>

              <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>BAHAN BAKU</th>
                      <th>TOTAL DIBUTUHKAN</th>
                      <th>STOK GUDANG SAAT INI</th>
                      <th>STATUS KECUKUPAN STOK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculateBOMNeeds(selectedPOForBOM).map((b, idx) => (
                      <tr key={idx}>
                        <td><strong style={{ color: 'var(--text-main)' }}>{b.nama}</strong></td>
                        <td><strong style={{ color: 'var(--amber)' }}>{b.totalNeed} {b.satuan}</strong></td>
                        <td>{b.currentStok} {b.satuan}</td>
                        <td>
                          {b.isShortage ? (
                            <span className="badge badge-danger">
                              ⚠️ KURANG {b.shortageAmount} {b.satuan}
                            </span>
                          ) : (
                            <span className="badge badge-green">
                              ✓ STOK CUKUP
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedPOForBOM(null)}>Tutup</button>
              {onOpenModalProduksi && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const firstItem = selectedPOForBOM.items[0];
                    setSelectedPOForBOM(null);
                    onOpenModalProduksi(firstItem?.produkId);
                  }}
                >
                  <ChefHat size={16} /> Jalankan Batch Produksi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
