import React, { useState, useMemo } from 'react';
import { Boxes, Search, AlertTriangle, Plus, Edit3, ArrowUpRight, ArrowDownRight, Package, Tag, Check, X, RefreshCw } from 'lucide-react';

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

export default function StokProdukSalesTab({
  produkSalesList = [],
  brandList = [],
  activeRoleView,
  onUpdateProdukSales,
  showAlert
}) {
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [stokFilter, setStokFilter] = useState('ALL'); // 'ALL', 'LOW', 'READY'

  // Modal Stock Adjustment State
  const [selectedProduk, setSelectedProduk] = useState(null);
  const [adjustType, setAdjustType] = useState('MASUK'); // 'MASUK' (Tambah), 'KELUAR' (Kurangi), 'SET' (Set Exact)
  const [adjustJumlah, setAdjustJumlah] = useState(0);
  const [adjustCatatan, setAdjustCatatan] = useState('');

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN'].includes(activeRoleView);

  const safeBrandList = useMemo(() => {
    if (!Array.isArray(brandList)) return [];
    return brandList
      .filter(Boolean)
      .map(b => typeof b === 'string' ? { id: b, nama: b } : b)
      .filter(b => b && b.nama && !['Saren Bakery', 'Saren Frozen', 'Dapur Saren', 'Saren One Original'].includes(b.nama));
  }, [brandList]);

  const filtered = useMemo(() => {
    return produkSalesList.filter(p => {
      const q = search.toLowerCase();
      const matchQ = !search || p.namaProduk?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
      const matchB = !brandFilter || p.brand === brandFilter;

      const stokVal = Number(p.stokReady) || 0;
      let matchS = true;
      if (stokFilter === 'LOW') matchS = stokVal < 20;
      else if (stokFilter === 'READY') matchS = stokVal >= 20;

      return matchQ && matchB && matchS;
    });
  }, [produkSalesList, search, brandFilter, stokFilter]);

  const totalItem = produkSalesList.length;
  const totalStokPcs = useMemo(() => produkSalesList.reduce((s, p) => s + (Number(p.stokReady) || 0), 0), [produkSalesList]);
  const lowStockItems = useMemo(() => produkSalesList.filter(p => (Number(p.stokReady) || 0) < 20), [produkSalesList]);
  const totalNilaiModal = useMemo(() => produkSalesList.reduce((s, p) => s + ((Number(p.stokReady) || 0) * (Number(p.hargaPabrik) || 0)), 0), [produkSalesList]);
  const totalNilaiJual = useMemo(() => produkSalesList.reduce((s, p) => s + ((Number(p.stokReady) || 0) * (Number(p.hargaJual) || 0)), 0), [produkSalesList]);

  const openAdjustModal = (p, type = 'MASUK') => {
    setSelectedProduk(p);
    setAdjustType(type);
    setAdjustJumlah(0);
    setAdjustCatatan('');
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduk) return;

    const currentStok = Number(selectedProduk.stokReady) || 0;
    const qty = Number(adjustJumlah) || 0;

    if (qty <= 0) {
      if (showAlert) showAlert('Jumlah stok harus lebih besar dari 0!', 'error');
      return;
    }

    let newStok = currentStok;
    if (adjustType === 'MASUK') newStok = currentStok + qty;
    else if (adjustType === 'KELUAR') {
      if (qty > currentStok) {
        if (showAlert) showAlert('Pengurangan stok melebihi stok ready yang ada!', 'error');
        return;
      }
      newStok = currentStok - qty;
    } else if (adjustType === 'SET') newStok = qty;

    const newStatus = newStok === 0 ? 'Stok Habis' : 'Tersedia';

    if (onUpdateProdukSales) {
      await onUpdateProdukSales(selectedProduk.id || selectedProduk._id, {
        ...selectedProduk,
        stokReady: newStok,
        status: newStatus
      });
      if (showAlert) showAlert(`Stok produk "${selectedProduk.namaProduk}" diperbarui menjadi ${newStok} Pcs!`, 'success');
    }

    setSelectedProduk(null);
  };

  return (
    <div className="tab-container">
      {/* HEADER */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title"><Boxes size={24} /> Stok &amp; Persediaan Produk Jual</h2>
          <p className="tab-subtitle">Pantau tingkat stok barang siap jual, mutasi persediaan, dan batas minimum stok</p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Boxes size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">Total Stok Ready</p>
            <h3 className="stat-value">{totalStokPcs} Pcs</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}><AlertTriangle size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">Stok Menipis (&lt;20 Pcs)</p>
            <h3 className="stat-value" style={{ color: lowStockItems.length > 0 ? '#ef4444' : 'inherit' }}>{lowStockItems.length} Item</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><Package size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">Nilai Modal Persediaan</p>
            <h3 className="stat-value" style={{ fontSize: '1rem' }}>{formatRp(totalNilaiModal)}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}><ArrowUpRight size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">Est. Omzet Persediaan</p>
            <h3 className="stat-value" style={{ fontSize: '1rem', color: '#10b981' }}>{formatRp(totalNilaiJual)}</h3>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Cari SKU, nama produk, atau brand..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="select-input" style={{ maxWidth: '170px' }}>
          <option value="">Semua Brand</option>
          {safeBrandList.map(b => <option key={b.id || b.nama} value={b.nama}>{b.nama}</option>)}
        </select>

        <select value={stokFilter} onChange={e => setStokFilter(e.target.value)} className="select-input" style={{ maxWidth: '180px' }}>
          <option value="ALL">Semua Status Stok</option>
          <option value="LOW">⚠️ Menipis (&lt;20 Pcs)</option>
          <option value="READY">✅ Aman (&ge;20 Pcs)</option>
        </select>
      </div>

      {/* STOK TABLE */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nama Produk</th>
              <th>Brand</th>
              <th>Gramasi</th>
              <th>Harga Pabrik</th>
              <th>Harga Jual</th>
              <th>Stok Ready</th>
              <th>Status Stock</th>
              {canEdit && <th style={{ textAlign: 'right' }}>Aksi Penyesuaian</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Tidak ada data persediaan produk yang sesuai filter.
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const stokVal = Number(p.stokReady) || 0;
                const isLow = stokVal < 20;

                return (
                  <tr key={p.id || p._id} style={{ background: isLow ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)' }}>{p.sku}</td>
                    <td><strong>{p.namaProduk}</strong></td>
                    <td><span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>🏷️ {p.brand || 'SAREN ONE'}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.gramasi || '-'}</td>
                    <td style={{ color: '#0ea5e9' }}>{formatRp(p.hargaPabrik)}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>{formatRp(p.hargaJual)}</td>
                    <td>
                      <strong style={{ fontSize: '1.05rem', color: isLow ? '#ef4444' : 'var(--text-primary)' }}>{stokVal} Pcs</strong>
                    </td>
                    <td>
                      {isLow ? (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> Menipis
                        </span>
                      ) : (
                        <span className="badge badge-emerald">Aman</span>
                      )}
                    </td>
                    {canEdit && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm btn-outline" onClick={() => openAdjustModal(p, 'MASUK')} title="Tambah Stok Ready dari Hasil Produksi">
                            <Plus size={14} style={{ color: '#10b981' }} /> Tambah
                          </button>
                          <button className="btn btn-sm btn-outline" onClick={() => openAdjustModal(p, 'SET')} title="Set Stok Manual">
                            <RefreshCw size={14} style={{ color: '#0ea5e9' }} /> Adjust
                          </button>
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

      {/* MODAL ADJUSTMENT STOK */}
      {selectedProduk && (
        <div className="modal-overlay" onClick={() => setSelectedProduk(null)}>
          <div className="modal-card modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Boxes size={20} style={{ color: 'var(--accent-primary)' }} /> Penyesuaian Stok Produk</h3>
              <button className="modal-close" onClick={() => setSelectedProduk(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Produk:</div>
                  <strong style={{ fontSize: '1.05rem', color: '#fff', display: 'block', margin: '2px 0 6px' }}>{selectedProduk.namaProduk}</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Stok Saat Ini:</span>
                    <strong style={{ color: '#10b981' }}>{selectedProduk.stokReady || 0} Pcs</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Jenis Penyesuaian *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'MASUK' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setAdjustType('MASUK')}
                    >
                      ➕ Tambah
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'KELUAR' ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => setAdjustType('KELUAR')}
                    >
                      ➖ Kurang
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'SET' ? 'btn-secondary' : 'btn-outline'}`}
                      onClick={() => setAdjustType('SET')}
                    >
                      ✏️ Set Exact
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">
                    {adjustType === 'MASUK' && 'Jumlah Tambah Stok (Pcs) *'}
                    {adjustType === 'KELUAR' && 'Jumlah Pengurangan Stok (Pcs) *'}
                    {adjustType === 'SET' && 'Set Total Stok Baru (Pcs) *'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    value={adjustJumlah}
                    onChange={e => setAdjustJumlah(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">Catatan / Alasan Penyesuaian</label>
                  <input
                    className="form-input"
                    placeholder="Contoh: Hasil batch produksi baru, retur, audit fisik..."
                    value={adjustCatatan}
                    onChange={e => setAdjustCatatan(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedProduk(null)}>Batal</button>
                <button type="submit" className="btn btn-primary"><Check size={16} /> Simpan Penyesuaian</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
