import React, { useState, useMemo } from 'react';
import { RotateCcw, Plus, Search, Trash2, Eye, Calendar, Package, Users, Tag, AlertCircle } from 'lucide-react';
import { ModernMonthPicker, ModernSearchableSelect } from './ModernDatePicker';

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
const formatDate = (d) => {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};

export default function ReturTab({
  returList = [],
  penjualanList = [],
  pelangganList = [],
  produkSalesList = [],
  activeRoleView,
  activeUser,
  onCreateRetur,
  onDeleteRetur,
  showAlert
}) {
  const [searchQ, setSearchQ] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const todayStr = new Date().toISOString().substring(0, 10);
  const emptyForm = {
    noRetur: '',
    tanggal: todayStr,
    tipeRetur: 'PENERIMAAN', // 'PENERIMAAN' (Stok Bertambah) atau 'PENGEMBALIAN' (Stok Berkurang)
    noFaktur: '',
    pelangganId: '',
    namaPelanggan: '',
    alasanRetur: 'Produk Rusak / Cacat',
    items: [{ produkId: '', namaProduk: '', qty: 1, hargaSatuan: 0, subtotal: 0 }],
    catatan: ''
  };

  const [form, setForm] = useState(emptyForm);

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'SALES'].includes(activeRoleView);

  const filtered = useMemo(() => {
    return (returList || []).filter(r => {
      const matchQ = !searchQ || r.noRetur?.toLowerCase().includes(searchQ.toLowerCase()) || r.namaPelanggan?.toLowerCase().includes(searchQ.toLowerCase()) || r.noFaktur?.toLowerCase().includes(searchQ.toLowerCase());
      
      let matchMonth = true;
      if (filterMonth && filterMonth !== 'Semua') {
        const itemDate = r.tanggal || r.createdAt;
        if (itemDate) {
          try {
            const itemKey = new Date(itemDate).toISOString().slice(0, 7);
            matchMonth = itemKey === filterMonth;
          } catch { matchMonth = true; }
        }
      }
      return matchQ && matchMonth;
    });
  }, [returList, searchQ, filterMonth]);

  const totalNilaiRetur = useMemo(() => filtered.reduce((s, r) => s + (Number(r.totalNilaiRetur) || 0), 0), [filtered]);
  const totalItemRetur = useMemo(() => filtered.reduce((s, r) => s + (r.items?.reduce((is, it) => is + Number(it.qty || 0), 0) || 0), 0), [filtered]);

  // Options Pelanggan
  const sortedPelangganOptions = useMemo(() => {
    return (pelangganList || []).map(c => {
      const cId = c.id || c._id;
      return {
        id: cId,
        value: cId,
        label: `👤 [${c.kode || 'C'}] ${c.nama}`,
        raw: c
      };
    });
  }, [pelangganList]);

  // Options Produk
  const sortedProdukOptions = useMemo(() => {
    return (produkSalesList || []).map(p => {
      const pId = p.id || p._id;
      return {
        id: pId,
        value: pId,
        label: `📦 ${p.sku ? `[${p.sku}] ` : ''}${p.namaProduk}`,
        raw: p
      };
    });
  }, [produkSalesList]);

  const handleSelectCustomer = (val) => {
    const found = (pelangganList || []).find(c => (c.id || c._id) === val);
    if (found) {
      setForm(f => ({
        ...f,
        pelangganId: val,
        namaPelanggan: found.nama
      }));
    }
  };

  const handleSelectProduct = (idx, val) => {
    const items = [...form.items];
    const foundProd = (produkSalesList || []).find(p => (p.id || p._id) === val);
    if (foundProd) {
      const price = Number(foundProd.hargaUmum || foundProd.hargaModal || 0);
      items[idx] = {
        ...items[idx],
        produkId: val,
        namaProduk: foundProd.namaProduk,
        hargaSatuan: price,
        subtotal: items[idx].qty * price
      };
      setForm(f => ({ ...f, items }));
    }
  };

  const handleItemChange = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    if (field === 'qty' || field === 'hargaSatuan') {
      const q = Number(items[idx].qty) || 0;
      const h = Number(items[idx].hargaSatuan) || 0;
      items[idx].subtotal = q * h;
    }
    setForm(f => ({ ...f, items }));
  };

  const addItem = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, { produkId: '', namaProduk: '', qty: 1, hargaSatuan: 0, subtotal: 0 }]
    }));
  };

  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    setForm(f => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx)
    }));
  };

  const openAdd = () => {
    const autoNoRetur = `RTR-${Date.now().toString().slice(-6)}`;
    setForm({ ...emptyForm, noRetur: autoNoRetur, tanggal: new Date().toISOString().substring(0, 10) });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.noRetur.trim()) { if (showAlert) showAlert('No. Retur wajib diisi!', 'error'); return; }
    if (!form.namaPelanggan.trim()) { if (showAlert) showAlert('Pelanggan wajib dipilih!', 'error'); return; }
    if (!form.items.some(it => it.namaProduk)) { if (showAlert) showAlert('Minimal 1 produk retur wajib dipilih!', 'error'); return; }

    const totalNilai = form.items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
    const payload = {
      ...form,
      totalNilaiRetur: totalNilai,
      createdBy: activeUser?.name || 'Super Admin Produk'
    };

    if (onCreateRetur) {
      await onCreateRetur(payload);
    }
    setShowModal(false);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(r => r.id || r._id).filter(Boolean));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Hapus (${selectedIds.length}) transaksi retur terpilih?`)) return;
    if (onDeleteRetur) {
      for (const id of selectedIds) {
        await onDeleteRetur(id, true);
      }
      setSelectedIds([]);
      if (showAlert) showAlert(`(${selectedIds.length}) retur berhasil dihapus!`, 'info');
    }
  };

  return (
    <div className="tab-container">
      {/* SUMMARY KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #ef4444', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TOTAL NILAI RETUR</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={14} style={{ color: '#ef4444' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#dc2626', marginTop: '0.25rem' }}>
            {formatRp(totalNilaiRetur)}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #0284c7', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TOTAL BARANG DIRETUR</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={14} style={{ color: '#0284c7' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', marginTop: '0.25rem' }}>
            {totalItemRetur} <span style={{ fontSize: '0.76rem', color: '#0284c7', fontWeight: 700 }}>Pcs</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px', height: '36px' }}>
            <Search size={15} />
            <input className="search-input" placeholder="Cari retur / pelanggan / no faktur..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ fontSize: '0.8rem' }} />
          </div>

          <ModernMonthPicker value={filterMonth} onChange={setFilterMonth} allowAll={true} variant="primary" />
        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {selectedIds.length > 0 && (
              <button className="btn btn-outline-danger" onClick={handleBulkDelete} style={{ height: '36px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.85rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                <Trash2 size={15} /> Hapus Terpilih ({selectedIds.length})
              </button>
            )}

            <button className="btn btn-emerald" onClick={openAdd} style={{ height: '36px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.95rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={15} /> + Catat Retur Produk
            </button>
          </div>
        )}
      </div>

      {/* TABEL DATA RETUR */}
      <div className="table-responsive" style={{ borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <table className="custom-table" style={{ width: '100%', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569' }}>
              {canEdit && (
                <th style={{ padding: '0.45rem 0.65rem', textAlign: 'center', width: '40px' }}>
                  <input type="checkbox" checked={filtered.length > 0 && selectedIds.length === filtered.length} onChange={handleSelectAll} style={{ cursor: 'pointer', width: '15px', height: '15px' }} />
                </th>
              )}
              <th style={{ padding: '0.45rem 0.65rem' }}>No. Retur</th>
              <th style={{ padding: '0.45rem 0.65rem' }}>Jenis Transaksi</th>
              <th style={{ padding: '0.45rem 0.65rem' }}>Tanggal</th>
              <th style={{ padding: '0.45rem 0.65rem' }}>No. Faktur</th>
              <th style={{ padding: '0.45rem 0.65rem' }}>Pelanggan</th>
              <th style={{ padding: '0.45rem 0.65rem' }}>Alasan Retur</th>
              <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right' }}>Total Nilai</th>
              <th style={{ padding: '0.45rem 0.65rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                  Belum ada data retur produk.
                </td>
              </tr>
            ) : (
              filtered.map(r => {
                const rId = r.id || r._id;
                const isSelected = selectedIds.includes(rId);
                const isPengembalian = r.tipeRetur === 'PENGEMBALIAN';

                return (
                  <tr key={rId} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#f0f9ff' : 'transparent' }}>
                    {canEdit && (
                      <td style={{ padding: '0.4rem 0.65rem', textAlign: 'center' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelect(rId)} style={{ cursor: 'pointer', width: '15px', height: '15px' }} />
                      </td>
                    )}
                    <td style={{ padding: '0.4rem 0.65rem', fontFamily: 'monospace', fontWeight: 800, color: '#dc2626', fontSize: '0.75rem' }}>{r.noRetur}</td>
                    <td style={{ padding: '0.4rem 0.65rem' }}>
                      {isPengembalian ? (
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                          📤 Pengembalian (Stok -)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}>
                          📥 Penerimaan (Stok +)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.4rem 0.65rem', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>{formatDate(r.tanggal || r.createdAt)}</td>
                    <td style={{ padding: '0.4rem 0.65rem', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7', fontSize: '0.75rem' }}>{r.noFaktur || '-'}</td>
                    <td style={{ padding: '0.4rem 0.65rem', fontWeight: 800, color: '#0f172a', fontSize: '0.78rem' }}>{r.namaPelanggan}</td>
                    <td style={{ padding: '0.4rem 0.65rem', color: '#d97706', fontWeight: 700, fontSize: '0.75rem' }}>{r.alasanRetur || '-'}</td>
                    <td style={{ padding: '0.4rem 0.65rem', textAlign: 'right', fontWeight: 900, color: '#dc2626', fontSize: '0.78rem' }}>{formatRp(r.totalNilaiRetur)}</td>
                    <td style={{ padding: '0.4rem 0.65rem', textAlign: 'center' }}>
                      <button className="btn btn-sm" onClick={() => setShowDetail(r)} style={{ padding: '0.2rem 0.45rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '5px' }} title="Detail"><Eye size={13} /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM RETUR */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" style={{ maxWidth: 840, width: '92%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><RotateCcw size={20} style={{ color: '#ef4444' }} /> Catat Retur Produk Baru</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">No. Retur *</label>
                  <input className="form-input" value={form.noRetur} onChange={e => setForm(f => ({ ...f, noRetur: e.target.value }))} style={{ fontWeight: 700, height: '34px', fontSize: '0.78rem' }} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tanggal Retur *</label>
                  <input className="form-input" type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} style={{ height: '34px', fontSize: '0.78rem', fontWeight: 600 }} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Jenis Transaksi Retur *</label>
                  <select className="form-select" value={form.tipeRetur} onChange={e => setForm(f => ({ ...f, tipeRetur: e.target.value }))} style={{ height: '34px', fontSize: '0.78rem', fontWeight: 800, color: form.tipeRetur === 'PENGEMBALIAN' ? '#dc2626' : '#16a34a' }}>
                    <option value="PENERIMAAN">📥 Penerimaan Barang Retur (Stok Bertambah +)</option>
                    <option value="PENGEMBALIAN">📤 Pengembalian Barang Retur (Stok Berkurang -)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pilih Pelanggan *</label>
                  <ModernSearchableSelect value={form.pelangganId} onChange={handleSelectCustomer} options={sortedPelangganOptions} placeholder="-- Pilih Pelanggan --" icon={Users} />
                </div>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                  <label className="form-label">No. Faktur Penjualan (Opsional)</label>
                  <input className="form-input" value={form.noFaktur} onChange={e => setForm(f => ({ ...f, noFaktur: e.target.value }))} placeholder="INV-xxx" style={{ height: '34px', fontSize: '0.78rem' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Alasan Retur *</label>
                <select className="form-select" value={form.alasanRetur} onChange={e => setForm(f => ({ ...f, alasanRetur: e.target.value }))} style={{ height: '34px', fontSize: '0.78rem' }}>
                  <option value="Produk Rusak / Cacat">Produk Rusak / Cacat</option>
                  <option value="Kadaluarsa / Expired">Kadaluarsa / Expired</option>
                  <option value="Salah Kirim Barang">Salah Kirim Barang</option>
                  <option value="Kemasan Bocor / Penyok">Kemasan Bocor / Penyok</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div style={{ margin: '1rem 0 0.5rem', fontWeight: 600, fontSize: '0.82rem' }}>📦 Item Produk Yang Diretur</div>
              {form.items.map((it, idx) => (
                <div key={idx} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 8, marginBottom: '0.6rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr auto', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Produk *</label>
                      <ModernSearchableSelect value={it.produkId} onChange={val => handleSelectProduct(idx, val)} options={sortedProdukOptions} placeholder="-- Pilih Produk --" icon={Package} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Qty (Pcs) *</label>
                      <input className="form-input" type="number" min={1} value={it.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} style={{ height: '34px', fontSize: '0.78rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Nilai Retur / Pcs (Rp)</label>
                      <input className="form-input" type="number" min={0} value={it.hargaSatuan} onChange={e => handleItemChange(idx, 'hargaSatuan', e.target.value)} style={{ height: '34px', fontSize: '0.78rem' }} />
                    </div>
                    <div style={{ paddingTop: '1.4rem' }}>
                      <button className="btn btn-sm btn-danger" onClick={() => removeItem(idx)} disabled={form.items.length === 1}>✕</button>
                    </div>
                  </div>
                </div>
              ))}

              <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }} onClick={addItem}>+ Tambah Baris</button>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Simpan Retur</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL RETUR */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-container" style={{ maxWidth: 700, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Retur Produk — {showDetail.noRetur}</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.78rem' }}>
                <div><strong>Pelanggan:</strong> {showDetail.namaPelanggan}</div>
                <div><strong>No. Faktur:</strong> {showDetail.noFaktur || '-'}</div>
                <div><strong>Tanggal:</strong> {formatDate(showDetail.tanggal || showDetail.createdAt)}</div>
                <div><strong>Alasan:</strong> <span style={{ color: '#d97706', fontWeight: 700 }}>{showDetail.alasanRetur}</span></div>
              </div>

              <div style={{ fontWeight: 800, fontSize: '0.82rem', marginBottom: '0.4rem' }}>📦 Rincian Barang Retur:</div>
              <table className="data-table" style={{ width: '100%', fontSize: '0.78rem' }}>
                <thead><tr style={{ background: '#f1f5f9' }}><th>Produk</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Nilai/Pcs</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr></thead>
                <tbody>
                  {(showDetail.items || []).map((it, i) => (
                    <tr key={i}>
                      <td>{it.namaProduk}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#dc2626' }}>{it.qty} Pcs</td>
                      <td style={{ textAlign: 'right' }}>{formatRp(it.hargaSatuan)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>{formatRp(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '1rem', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fca5a5', display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#dc2626', fontSize: '1rem' }}>
                <span>Total Nilai Retur:</span>
                <span>{formatRp(showDetail.totalNilaiRetur)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
