import React, { useState, useEffect } from 'react';
import { X, Save, ArrowDownLeft, Play, Plus, Edit3 } from 'lucide-react';
import { formatNumber } from '../data/initialData';

export function ModalBahan({ isOpen, onClose, onSave, editingItem, kategoriList = [] }) {
  const [sku, setSku] = useState('');
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('Bahan Utama');
  const [stok, setStok] = useState(0);
  const [minStok, setMinStok] = useState(5);
  const [satuan, setSatuan] = useState('kg');
  const [harga, setHarga] = useState(0);

  useEffect(() => {
    if (editingItem) {
      setSku(editingItem.sku || '');
      setNama(editingItem.nama || '');
      setKategori(editingItem.kategori || (kategoriList[0]?.nama || 'Bahan Utama'));
      setStok(editingItem.stok || 0);
      setMinStok(editingItem.minStok || 5);
      setSatuan(editingItem.satuan || 'kg');
      setHarga(editingItem.harga || 0);
    } else {
      setSku('BHN-' + Math.floor(100 + Math.random() * 900));
      setNama('');
      setKategori(kategoriList[0]?.nama || 'Bahan Utama');
      setStok(10);
      setMinStok(5);
      setSatuan('kg');
      setHarga(15000);
    }
  }, [editingItem, isOpen, kategoriList]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nama || !sku) {
      alert('Nama dan SKU wajib diisi!');
      return;
    }
    onSave({
      id: editingItem ? editingItem.id : null,
      sku,
      nama,
      kategori,
      stok: Number(stok),
      minStok: Number(minStok),
      satuan,
      harga: Number(harga)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{editingItem ? '✏️ Edit Data Bahan Baku' : '➕ Tambah Bahan Baku Baru'}</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div className="form-group">
                <label>SKU Kode *</label>
                <input type="text" className="form-control" value={sku} onChange={e => setSku(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Nama Bahan Baku *</label>
                <input type="text" className="form-control" placeholder="Misal: Tepung Terigu..." value={nama} onChange={e => setNama(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Kategori *</label>
                <select className="select-input" value={kategori} onChange={e => setKategori(e.target.value)}>
                  {kategoriList.map(k => (
                    <option key={k.id} value={k.nama}>{k.nama}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Satuan Unit *</label>
                <select className="select-input" value={satuan} onChange={e => setSatuan(e.target.value)}>
                  <option value="kg">kg (Kilogram)</option>
                  <option value="gr">gr (Gram)</option>
                  <option value="liter">liter (Liter)</option>
                  <option value="pcs">pcs (Pieces/Dus)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Stok Awal</label>
                <input type="number" step="any" className="form-control" value={stok} onChange={e => setStok(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Batas Min. Perlu Restock</label>
                <input type="number" step="any" className="form-control" value={minStok} onChange={e => setMinStok(e.target.value)} required />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary"><Save size={16} /> Simpan Bahan Baku</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ModalStokMasuk({ isOpen, onClose, onSave, bahanList }) {
  const sortedBahanList = React.useMemo(() => {
    return [...bahanList].sort((a, b) => (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [bahanList]);

  const [bahanId, setBahanId] = useState(sortedBahanList[0]?.id || '');
  const [jumlah, setJumlah] = useState(0);
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    if (sortedBahanList.length > 0) {
      setBahanId(sortedBahanList[0].id);
    }
    setJumlah(0);
    setCatatan('');
  }, [sortedBahanList, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bahanId || Number(jumlah) <= 0) {
      alert('Pilih bahan baku dan masukkan jumlah stok masuk lebih dari 0!');
      return;
    }
    onSave({ bahanId, jumlah: Number(jumlah), supplier: '', catatan });
  };

  const selectedBahan = sortedBahanList.find(x => x.id === bahanId);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3><ArrowDownLeft size={18} style={{ color: 'var(--cyan)' }} /> Catat Stok Masuk (Restock Bahan)</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Pilih Bahan Baku Dapur *</label>
              <select className="select-input" value={bahanId} onChange={e => setBahanId(e.target.value)}>
                {sortedBahanList.map(b => (
                  <option key={b.id} value={b.id}>{b.sku} - {b.nama} (Stok Saat Ini: {b.stok} {b.satuan})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Jumlah Tambahan Stok Masuk ({selectedBahan?.satuan || 'satuan'}) *</label>
              <input type="number" step="any" className="form-control" value={jumlah} onChange={e => setJumlah(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Catatan Restock</label>
              <input type="text" className="form-control" placeholder="Catatan dokumen invoice / penerimaan..." value={catatan} onChange={e => setCatatan(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-cyan"><ArrowDownLeft size={16} /> Tambahkan Stok Masuk</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ModalProduk({ isOpen, onClose, onSave, editingItem, kategoriList = [] }) {
  const [sku, setSku] = useState('');
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('Roti Manis');
  const [harga, setHarga] = useState(15000);
  const [stok, setStok] = useState(0);

  useEffect(() => {
    if (editingItem) {
      setSku(editingItem.sku || '');
      setNama(editingItem.nama || '');
      setKategori(editingItem.kategori || (kategoriList[0]?.nama || 'Roti Manis'));
      setHarga(editingItem.harga || 15000);
      setStok(editingItem.stok || 0);
    } else {
      setSku('PRD-' + Math.floor(100 + Math.random() * 900));
      setNama('');
      setKategori(kategoriList[0]?.nama || 'Roti Manis');
      setHarga(18000);
      setStok(20);
    }
  }, [editingItem, isOpen, kategoriList]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nama || !sku) {
      alert('Nama produk dan SKU wajib diisi!');
      return;
    }
    onSave({
      id: editingItem ? editingItem.id : null,
      sku,
      nama,
      kategori,
      harga: Number(harga),
      stok: Number(stok)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{editingItem ? '✏️ Edit Katalog Produk' : '➕ Tambah Produk Jadi Baru'}</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div className="form-group">
                <label>SKU Kode *</label>
                <input type="text" className="form-control" value={sku} onChange={e => setSku(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Nama Produk Jadi *</label>
                <input type="text" className="form-control" placeholder="Misal: Roti Keju Spesial..." value={nama} onChange={e => setNama(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Kategori *</label>
                <select className="select-input" value={kategori} onChange={e => setKategori(e.target.value)}>
                  {kategoriList.map(k => (
                    <option key={k.id} value={k.nama}>{k.nama}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Stok Awal (Pcs)</label>
                <input type="number" className="form-control" value={stok} onChange={e => setStok(e.target.value)} required />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary"><Save size={16} /> Simpan Produk</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ModalProduksi({ isOpen, onClose, onExecute, produkList, bahanList, resep, defaultProdukId }) {
  const [selectedProdukId, setSelectedProdukId] = useState(defaultProdukId || produkList[0]?.id || '');
  const [targetQty, setTargetQty] = useState(25);

  useEffect(() => {
    if (defaultProdukId) {
      setSelectedProdukId(defaultProdukId);
    } else if (produkList.length > 0) {
      setSelectedProdukId(produkList[0].id);
    }
  }, [defaultProdukId, produkList, isOpen]);

  if (!isOpen) return null;

  const targetProduk = produkList.find(p => p.id === selectedProdukId) || produkList[0];
  const formula = targetProduk ? (resep[targetProduk.id] || []) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProdukId || targetQty <= 0) {
      alert('Pilih produk dan tentukan jumlah target produksi!');
      return;
    }

    onExecute({ produkId: selectedProdukId, targetQty: Number(targetQty) });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <h3><Play size={18} style={{ color: 'var(--emerald)' }} /> Jalankan Batch Pemrosesan Produksi Roti</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Pilih Varian Produk Jadi *</label>
                <select className="select-input" value={selectedProdukId} onChange={e => setSelectedProdukId(e.target.value)}>
                  {produkList.map(p => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.nama} (Stok Saat Ini: {p.stok} Batch)</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Jumlah Batch *</label>
                <input type="number" className="form-control" value={targetQty} onChange={e => setTargetQty(e.target.value)} min="1" required />
              </div>
            </div>

            {/* Simulated Material Consumption Preview */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
              <h5 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                Kebutuhan Pemotongan Stok Bahan Baku (Otomatis):
              </h5>
              {formula.length === 0 ? (
                <div className="text-muted" style={{ fontSize: '0.8rem', color: 'var(--rose)' }}>
                  ⚠️ Belum ada formula resep BOM terdaftar untuk produk ini.
                </div>
              ) : (
                <ul style={{ listStyle: 'none', fontSize: '0.82rem' }}>
                  {formula.map((item, idx) => {
                    const b = bahanList.find(x => x.id === item.bahanId);
                    const needQty = Math.round(item.takaran * targetQty * 1000) / 1000;
                    const isEnough = b ? b.stok >= needQty : false;

                    return (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                        <span>{b ? b.nama : 'Bahan'}:</span>
                        <span>
                          <strong style={{ color: 'var(--primary)' }}>{needQty} {b?.satuan}</strong>{' '}
                          <span className="text-muted">(Stok Tersedia: {b?.stok || 0} {b?.satuan})</span>{' '}
                          {isEnough ? (
                            <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>✓ Cukup</span>
                          ) : (
                            <span style={{ color: 'var(--rose)', fontWeight: 700 }}>✗ Kurang!</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-emerald" disabled={formula.length === 0}>
              <Play size={16} /> Proses Produksi & Potong Stok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ModalResepItem({ isOpen, onClose, onSave, bahanList, editingItem }) {
  const [bahanId, setBahanId] = useState(bahanList[0]?.id || '');
  const [takaran, setTakaran] = useState(0.05);

  useEffect(() => {
    if (editingItem) {
      setBahanId(editingItem.bahanId || (bahanList[0]?.id || ''));
      setTakaran(editingItem.takaran || 0.05);
    } else {
      if (bahanList.length > 0) setBahanId(bahanList[0].id);
      setTakaran(0.05);
    }
  }, [editingItem, bahanList, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bahanId || takaran <= 0) {
      alert('Pilih bahan baku dan tentukan nilai takaran per 1 pcs!');
      return;
    }
    onSave({ bahanId, takaran: Number(takaran) });
  };

  const selectedBahan = bahanList.find(b => b.id === bahanId);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>
            {editingItem ? (
              <><Edit3 size={18} style={{ color: 'var(--amber)' }} /> Edit Takaran Formulasi Resep (BOM)</>
            ) : (
              <><Plus size={18} style={{ color: 'var(--primary)' }} /> Tambah Takaran Formulasi Resep (BOM)</>
            )}
          </h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Pilih Bahan Baku Dapur *</label>
              <select className="select-input" value={bahanId} onChange={e => setBahanId(e.target.value)} disabled={!!editingItem}>
                {bahanList.map(b => (
                  <option key={b.id} value={b.id}>{b.nama} (Satuan: {b.satuan})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Takaran Kebutuhan per 1 Pcs Produk ({selectedBahan?.satuan || 'satuan'}) *</label>
              <input type="number" step="any" className="form-control" value={takaran} onChange={e => setTakaran(e.target.value)} required />
              <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                Misal: 0.08 kg untuk 80 gram tepung terigu per 1 pcs roti.
              </span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary"><Save size={16} /> Simpan Takaran Resep</button>
          </div>
        </form>
      </div>
    </div>
  );
}
