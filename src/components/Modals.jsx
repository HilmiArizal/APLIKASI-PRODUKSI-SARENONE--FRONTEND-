import React, { useState, useEffect } from 'react';
import { X, Save, ArrowDownLeft, Play, Plus, Edit3, Upload, Download, FileSpreadsheet, MinusCircle, Package } from 'lucide-react';
import * as XLSX from 'xlsx';
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
          <h3><Play size={18} style={{ color: 'var(--emerald)' }} /> Jalankan Batch Pemrosesan Produksi</h3>
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

export function ModalImportBahanExcel({ isOpen, onClose, onImport, showAlert }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setParsedData([]);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateData = [
      { 'SKU': 'BB1', 'NAMA BAHAN BAKU': 'Daging Ayam', 'KATEGORI': 'Bahan Utama', 'STOK': 50, 'STOK MINIMAL': 10, 'SATUAN': 'kg' },
      { 'SKU': 'BB2', 'NAMA BAHAN BAKU': 'Daging Sapi', 'KATEGORI': 'Bahan Utama', 'STOK': 25, 'STOK MINIMAL': 5, 'SATUAN': 'kg' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Bahan_Baku');
    XLSX.writeFile(wb, 'Template_Import_Bahan_Baku.xlsx');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const mapped = json.map((row, index) => {
          const skuKey = Object.keys(row).find(k => k.toLowerCase().includes('sku') || k.toLowerCase().includes('kode')) || '';
          const namaKey = Object.keys(row).find(k => k.toLowerCase().includes('nama') || k.toLowerCase().includes('bahan')) || '';
          const katKey = Object.keys(row).find(k => k.toLowerCase().includes('kategori')) || '';
          const stokKey = Object.keys(row).find(k => k.toLowerCase() === 'stok' || k.toLowerCase().includes('stok saat ini')) || '';
          const minKey = Object.keys(row).find(k => k.toLowerCase().includes('min') || k.toLowerCase().includes('batas')) || '';
          const satKey = Object.keys(row).find(k => k.toLowerCase().includes('satuan')) || '';

          return {
            id: index + 1,
            sku: String(row[skuKey] || `BHN-${Math.floor(100 + Math.random() * 900)}`).trim(),
            nama: String(row[namaKey] || '').trim(),
            kategori: String(row[katKey] || 'Bahan Utama').trim(),
            stok: parseFloat(row[stokKey]) || 0,
            minStok: parseFloat(row[minKey]) || 0,
            satuan: String(row[satKey] || 'kg').trim()
          };
        }).filter(item => item.nama.length > 0 || item.sku.length > 0);

        if (mapped.length === 0) {
          if (showAlert) showAlert('File Excel kosong atau format kolom tidak dikenali!', 'error', 'Format File Salah');
          setParsedData([]);
          return;
        }

        setParsedData(mapped);
      } catch (err) {
        if (showAlert) showAlert('Gagal membaca file Excel: ' + err.message, 'error', 'Error File');
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleCommitImport = async () => {
    if (parsedData.length === 0) return;
    setIsProcessing(true);
    await onImport(parsedData);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <h3><FileSpreadsheet size={20} style={{ color: 'var(--emerald)' }} /> Import Bahan Baku dari Excel / CSV</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Unggah file spreadsheet `.xlsx`, `.xls`, atau `.csv` berisi daftar bahan baku dapur Anda.
            </p>
            <button className="btn btn-sm btn-outline" onClick={handleDownloadTemplate} title="Unduh Contoh Format Excel">
              <Download size={14} style={{ color: 'var(--cyan)' }} /> Unduh Template Excel
            </button>
          </div>

          <div className="form-group">
            <label>Pilih File Excel (.xlsx / .csv) *</label>
            <input type="file" accept=".xlsx, .xls, .csv" className="form-control" onChange={handleFileChange} />
          </div>

          {parsedData.length > 0 && (
            <div className="mt-3">
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--emerald)' }}>
                ✓ Pratinjau Data ({parsedData.length} Baris Bahan Baku Ditemukan):
              </h4>
              <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>SKU</th>
                      <th>NAMA BAHAN</th>
                      <th>KATEGORI</th>
                      <th>STOK</th>
                      <th>MIN STOK</th>
                      <th>SATUAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><span className="badge badge-cyan">{row.sku}</span></td>
                        <td style={{ fontWeight: 600 }}>{row.nama}</td>
                        <td>{row.kategori}</td>
                        <td style={{ fontWeight: 700 }}>{row.stok}</td>
                        <td className="text-muted">{row.minStok}</td>
                        <td>{row.satuan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button
            type="button"
            className="btn btn-emerald"
            disabled={parsedData.length === 0 || isProcessing}
            onClick={handleCommitImport}
          >
            <Upload size={16} /> {isProcessing ? 'Proses Import...' : `Import ${parsedData.length} Data ke Database`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalImportResepExcel({ isOpen, onClose, onImport, showAlert }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setParsedData([]);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateData = [
      { 'SKU PRODUK': 'PR1', 'NAMA PRODUK': 'RCS', 'SKU BAHAN': 'BB1', 'NAMA BAHAN BAKU': 'BLP', 'TAKARAN': 0.08 },
      { 'SKU PRODUK': 'PR1', 'NAMA PRODUK': 'RCS', 'SKU BAHAN': 'BB2', 'NAMA BAHAN BAKU': 'CL 65', 'TAKARAN': 0.02 },
      { 'SKU PRODUK': 'PR1', 'NAMA PRODUK': 'RCS', 'SKU BAHAN': 'BB3', 'NAMA BAHAN BAKU': 'MDM', 'TAKARAN': 0.03 }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Resep_BOM');
    XLSX.writeFile(wb, 'Template_Import_Resep_BOM.xlsx');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const mapped = json.map((row, index) => {
          const pSkuKey = Object.keys(row).find(k => k.toLowerCase().includes('sku produk') || k.toLowerCase().includes('kode produk') || k.toLowerCase() === 'produk sku') || '';
          const pNamaKey = Object.keys(row).find(k => k.toLowerCase().includes('nama produk') || k.toLowerCase() === 'produk') || '';
          const bSkuKey = Object.keys(row).find(k => k.toLowerCase().includes('sku bahan') || k.toLowerCase().includes('kode bahan') || k.toLowerCase() === 'bahan sku') || '';
          const bNamaKey = Object.keys(row).find(k => k.toLowerCase().includes('nama bahan') || k.toLowerCase() === 'bahan baku' || k.toLowerCase() === 'bahan') || '';
          const takaranKey = Object.keys(row).find(k => k.toLowerCase().includes('takaran') || k.toLowerCase().includes('jumlah') || k.toLowerCase().includes('qty')) || '';

          return {
            id: index + 1,
            produkSku: String(row[pSkuKey] || '').trim(),
            produkNama: String(row[pNamaKey] || '').trim(),
            bahanSku: String(row[bSkuKey] || '').trim(),
            bahanNama: String(row[bNamaKey] || '').trim(),
            takaran: parseFloat(row[takaranKey]) || 0
          };
        }).filter(item => (item.produkSku || item.produkNama) && (item.bahanSku || item.bahanNama) && item.takaran > 0);

        if (mapped.length === 0) {
          if (showAlert) showAlert('File Excel kosong atau format kolom tidak dikenali!', 'error', 'Format File Salah');
          setParsedData([]);
          return;
        }

        setParsedData(mapped);
      } catch (err) {
        if (showAlert) showAlert('Gagal membaca file Excel Resep: ' + err.message, 'error', 'Error File');
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleCommitImport = async () => {
    if (parsedData.length === 0) return;
    setIsProcessing(true);
    await onImport(parsedData);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <h3><FileSpreadsheet size={20} style={{ color: 'var(--amber)' }} /> Import Formulasi Resep (BOM) dari Excel / CSV</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Unggah file spreadsheet `.xlsx`, `.xls`, atau `.csv` berisi takaran bahan baku per produk.
            </p>
            <button className="btn btn-sm btn-outline" onClick={handleDownloadTemplate} title="Unduh Contoh Format Excel Resep">
              <Download size={14} style={{ color: 'var(--cyan)' }} /> Unduh Template Excel Resep
            </button>
          </div>

          <div className="form-group">
            <label>Pilih File Excel Resep (.xlsx / .csv) *</label>
            <input type="file" accept=".xlsx, .xls, .csv" className="form-control" onChange={handleFileChange} />
          </div>

          {parsedData.length > 0 && (
            <div className="mt-3">
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--amber)' }}>
                ✓ Pratinjau Formulasi ({parsedData.length} Baris Takaran Ditemukan):
              </h4>
              <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>PRODUK (SKU / NAMA)</th>
                      <th>BAHAN BAKU (SKU / NAMA)</th>
                      <th>TAKARAN (PER 1 PCS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.produkSku || row.produkNama} {row.produkNama && `(${row.produkNama})`}</td>
                        <td style={{ fontWeight: 600, color: 'var(--cyan)' }}>{row.bahanSku || row.bahanNama} {row.bahanNama && `(${row.bahanNama})`}</td>
                        <td style={{ fontWeight: 700, color: 'var(--amber)' }}>{row.takaran}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button
            type="button"
            className="btn btn-amber"
            disabled={parsedData.length === 0 || isProcessing}
            onClick={handleCommitImport}
          >
            <Upload size={16} /> {isProcessing ? 'Proses Import...' : `Import ${parsedData.length} Resep ke Database`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalPengolahanEmulsi({ isOpen, onClose, onProcess, bahanList = [], showAlert }) {
  const [jenisEmulsi, setJenisEmulsi] = useState('ISP');
  const [jumlahBatch, setJumlahBatch] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setJumlahBatch(1);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isTvp = jenisEmulsi === 'TVP';
  const bNum = Math.max(1, parseInt(jumlahBatch) || 1);

  // Calculations per factory batch spec
  const marksoyQty = isTvp ? 0 : 2 * bNum;
  const tvpQty = isTvp ? 1 * bNum : 0;
  const waterQty = (isTvp ? 3 : 4) * bNum;
  const oilPouchQty = isTvp ? 0 : 4 * bNum;
  const totalYield = (isTvp ? 3.5 : 20) * bNum;

  // Real-time Stock Lookup in bahanList (Strictly EXCLUDING Emulsi items!)
  const mainBahan = bahanList.find(b => {
    const name = (b.nama || '').toLowerCase();
    const sku = (b.sku || '').toLowerCase();
    if (isTvp) {
      return !name.includes('emulsi') && (name.includes('tvp') || sku.includes('tvp'));
    } else {
      return !name.includes('emulsi') && (name.includes('marksoy') || name.includes('isp') || sku.includes('marksoy') || sku.includes('isp'));
    }
  });

  const waterBahan = bahanList.find(b => {
    const name = (b.nama || '').toLowerCase();
    const sku = (b.sku || '').toLowerCase();
    return !name.includes('emulsi') && (name.includes('air') || name.includes('es') || sku.includes('air'));
  });

  const oilBahan = !isTvp ? bahanList.find(b => {
    const name = (b.nama || '').toLowerCase();
    const sku = (b.sku || '').toLowerCase();
    return !name.includes('emulsi') && (name.includes('minyak') || name.includes('lemak') || sku.includes('minyak'));
  }) : null;

  const mainBahanStok = mainBahan ? mainBahan.stok : 0;
  const waterBahanStok = waterBahan ? waterBahan.stok : 0;
  const oilBahanStok = oilBahan ? oilBahan.stok : 0;

  const isMainEnough = isTvp ? (mainBahanStok >= tvpQty) : (mainBahanStok >= marksoyQty);
  const isWaterEnough = waterBahanStok >= waterQty;
  const isOilEnough = isTvp ? true : (oilBahanStok >= oilPouchQty);

  const isAnyInsufficient = !isMainEnough || !isWaterEnough || !isOilEnough;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (bNum <= 0) {
      if (showAlert) showAlert('Jumlah batch harus minimal 1 batch.', 'error', 'Validasi Gagal');
      return;
    }
    if (isAnyInsufficient) {
      if (showAlert) showAlert('Stok bahan baku tidak mencukupi untuk memproses batch emulsi ini.', 'error', 'Stok Kurang!');
      return;
    }

    setIsSubmitting(true);
    await onProcess({
      jenisEmulsi,
      jumlahBatch: bNum
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h3>🧪 Eksekusi Batch Pengolahan Emulsi ({isTvp ? 'Emulsi TVP' : 'Emulsi ISP'})</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Pilih Jenis Formulasi Emulsi Sosis *</label>
              <select className="select-input" value={jenisEmulsi} onChange={e => setJenisEmulsi(e.target.value)}>
                <option value="ISP">Emulsi ISP</option>
                <option value="TVP">Emulsi TVP</option>
              </select>
            </div>

            <div className="form-group">
              <label>Jumlah Target Produksi (Berapa Batch?) *</label>
              <input type="number" min="1" step="1" className="form-control" value={jumlahBatch} onChange={e => setJumlahBatch(e.target.value)} required />
              <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                Misal: Masukkan `1` untuk 1 batch, `2` untuk 2 batch, dst.
              </span>
            </div>

            {isAnyInsufficient && (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid var(--rose)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--rose)', fontSize: '0.83rem', fontWeight: 600 }}>
                ⚠️ <strong>Peringatan Stok Bahan Baku Tidak Mencukupi!</strong> Beberapa bahan mentah dapur di bawah ini bernilai kurang dari kebutuhan target batch. Harap lakukan Restock / Tambah Stok Masuk terlebih dahulu.
              </div>
            )}

            <div className="mt-3" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--emerald)', marginBottom: '0.65rem', fontWeight: 700 }}>
                📊 Rincian Otomatis Pemotongan Stok ({bNum} Batch {jenisEmulsi}):
              </h4>
              <ul style={{ fontSize: '0.85rem', listStyle: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {!isTvp ? (
                  <>
                    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🔻 Pemotongan Marksoy / ISP: <strong>{marksoyQty} kg</strong></span>
                      <span style={{ fontSize: '0.8rem' }}>
                        (Stok Tersedia: <strong>{mainBahanStok} {mainBahan?.satuan || 'kg'}</strong>){' '}
                        {isMainEnough ? (
                          <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>✓ Cukup</span>
                        ) : (
                          <span style={{ color: 'var(--rose)', fontWeight: 700 }}>✗ Stok Kurang!</span>
                        )}
                      </span>
                    </li>

                    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🔻 Pemotongan Air Es Batu: <strong>{waterQty} kg</strong></span>
                      <span style={{ fontSize: '0.8rem' }}>
                        (Stok Tersedia: <strong>{waterBahanStok} {waterBahan?.satuan || 'kg'}</strong>){' '}
                        {isWaterEnough ? (
                          <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>✓ Cukup</span>
                        ) : (
                          <span style={{ color: 'var(--rose)', fontWeight: 700 }}>✗ Stok Kurang!</span>
                        )}
                      </span>
                    </li>

                    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🔻 Pemotongan Minyak Goreng: <strong>{oilPouchQty} pouch</strong></span>
                      <span style={{ fontSize: '0.8rem' }}>
                        (Stok Tersedia: <strong>{oilBahanStok} {oilBahan?.satuan || 'pouch'}</strong>){' '}
                        {isOilEnough ? (
                          <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>✓ Cukup</span>
                        ) : (
                          <span style={{ color: 'var(--rose)', fontWeight: 700 }}>✗ Stok Kurang!</span>
                        )}
                      </span>
                    </li>
                  </>
                ) : (
                  <>
                    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🔻 Pemotongan TVP Granules: <strong>{tvpQty} kg</strong></span>
                      <span style={{ fontSize: '0.8rem' }}>
                        (Stok Tersedia: <strong>{mainBahanStok} {mainBahan?.satuan || 'kg'}</strong>){' '}
                        {isMainEnough ? (
                          <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>✓ Cukup</span>
                        ) : (
                          <span style={{ color: 'var(--rose)', fontWeight: 700 }}>✗ Stok Kurang!</span>
                        )}
                      </span>
                    </li>

                    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🔻 Pemotongan Air Es Batu: <strong>{waterQty} kg</strong></span>
                      <span style={{ fontSize: '0.8rem' }}>
                        (Stok Tersedia: <strong>{waterBahanStok} {waterBahan?.satuan || 'kg'}</strong>){' '}
                        {isWaterEnough ? (
                          <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>✓ Cukup</span>
                        ) : (
                          <span style={{ color: 'var(--rose)', fontWeight: 700 }}>✗ Stok Kurang!</span>
                        )}
                      </span>
                    </li>

                    <li className="text-muted">🔹 Minyak Goreng: <strong>0 (Tanpa Minyak)</strong></li>
                  </>
                )}

                <li style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem', fontSize: '0.95rem' }}>
                  🟢 <strong>TOTAL HASIL KELUARAN EMULSI {jenisEmulsi} (YIELD): +{totalYield} kg</strong>
                </li>
              </ul>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button
              type="submit"
              className={`btn ${isAnyInsufficient ? 'btn-danger' : 'btn-emerald'}`}
              disabled={isSubmitting || isAnyInsufficient}
            >
              <Play size={16} /> {isAnyInsufficient ? '⚠️ Stok Bahan Tidak Cukup' : (isSubmitting ? 'Memproses Batch...' : `Proses ${bNum} Batch (+${totalYield} kg Emulsi ${jenisEmulsi})`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ModalPemakaianKemasan({ isOpen, onClose, onUseKemasan, bahanList = [], selectedBahan: selectedBahanProp = null, totalVacumbagSuggestQty = 0, showAlert }) {
  const [bahanId, setBahanId] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kemasanList = bahanList.filter(b => {
    const kat = (b.kategori || '').toLowerCase();
    const name = (b.nama || '').toLowerCase();
    return kat.includes('kemasan') || name.includes('casing') || name.includes('plastik') || name.includes('pouch') || name.includes('box') || name.includes('label') || name.includes('sticker') || name.includes('stiker') || name.includes('vacum');
  });

  const rawDisplay = kemasanList.length > 0 ? kemasanList : bahanList;
  const displayList = [...rawDisplay].sort((a, b) => {
    const nameA = (a.nama || '').toLowerCase();
    const nameB = (b.nama || '').toLowerCase();
    const isASticker = nameA.includes('sticker') || nameA.includes('stiker') || nameA.includes('label');
    const isBSticker = nameB.includes('sticker') || nameB.includes('stiker') || nameB.includes('label');

    if (isASticker && !isBSticker) return 1;
    if (!isASticker && isBSticker) return -1;
    return (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' });
  });

  useEffect(() => {
    if (isOpen) {
      if (selectedBahanProp) {
        const val = selectedBahanProp.id || selectedBahanProp._id || selectedBahanProp.sku;
        if (val) setBahanId(val);
      } else if (displayList.length > 0) {
        const val = displayList[0].id || displayList[0]._id || displayList[0].sku;
        if (val) setBahanId(val);
      }
      setJumlah(1);
      setKeterangan('');
      setIsSubmitting(false);
    }
  }, [isOpen, selectedBahanProp, bahanList]);

  if (!isOpen) return null;

  const selectedBahan = displayList.find(b => b.id === bahanId || b._id === bahanId || b.sku === bahanId) || displayList[0];
  const currentStok = selectedBahan ? selectedBahan.stok : 0;
  const useQty = parseFloat(jumlah) || 0;
  const isInsufficient = selectedBahan ? (currentStok < useQty) : true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bahanId || useQty <= 0) {
      if (showAlert) showAlert('Pilih bahan kemasan dan tentukan jumlah pemakaian (>0).', 'error', 'Validasi Gagal');
      return;
    }
    if (isInsufficient) {
      if (showAlert) showAlert(`Stok ${selectedBahan?.nama || 'bahan'} tidak mencukupi!`, 'error', 'Stok Kurang');
      return;
    }

    setIsSubmitting(true);
    // Deduct ONLY the selected item (100% Independent)
    await onUseKemasan({
      bahanId: selectedBahan.id || selectedBahan._id || selectedBahan.sku,
      sku: selectedBahan.sku,
      nama: selectedBahan.nama,
      jumlah: useQty,
      keterangan
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <h3>📦 Catat Pemakaian Bahan Kemasan (Casing / Plastik / Box / Sticker)</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Pilih Bahan Kemasan Dapur *</label>
              <select className="select-input" value={bahanId} onChange={e => setBahanId(e.target.value)}>
                {displayList.map(b => {
                  const bValue = b.id || b._id || b.sku;
                  return (
                    <option key={bValue} value={bValue}>
                      {b.sku} - {b.nama} (Stok Tersedia: {b.stok} {b.satuan})
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Jumlah Pemakaian ({selectedBahan?.satuan || 'satuan'}) *</label>
                <input type="number" step="any" min="0.1" className="form-control" value={jumlah} onChange={e => setJumlah(e.target.value)} required />
                {totalVacumbagSuggestQty > 0 && (selectedBahan?.nama || '').toLowerCase().includes('sticker') && (
                  <button
                    type="button"
                    className="btn btn-outline btn-amber btn-sm"
                    style={{ marginTop: '0.45rem', fontSize: '0.74rem', width: '100%', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => {
                      setJumlah(totalVacumbagSuggestQty);
                      setKeterangan(`Pemakaian Sticker Sesuai Total Vacumbag Hari Ini (${totalVacumbagSuggestQty} pcs)`);
                    }}
                  >
                    ⚡ Auto-Isi Sesuai Vacumbag Hari Ini ({totalVacumbagSuggestQty} pcs)
                  </button>
                )}
              </div>
              <div className="form-group">
                <label>Stok Saat Ini</label>
                <input type="text" className="form-control" value={`${currentStok} ${selectedBahan?.satuan || ''}`} disabled readOnly />
              </div>
            </div>

            <div className="form-group">
              <label>Keterangan / Catatan Pemakaian</label>
              <input type="text" className="form-control" placeholder="Misal: Pengemasan Sosis Original Batch #05" value={keterangan} onChange={e => setKeterangan(e.target.value)} />
            </div>

            {isInsufficient && (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid var(--rose)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginTop: '0.5rem', color: 'var(--rose)', fontSize: '0.83rem', fontWeight: 600 }}>
                ⚠️ <strong>Stok Bahan Kemasan Tidak Cukup!</strong> Stok tersedia ({currentStok} {selectedBahan?.satuan}) lebih kecil dari jumlah pemakaian ({useQty} {selectedBahan?.satuan}).
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button
              type="submit"
              className={`btn ${isInsufficient ? 'btn-danger' : 'btn-primary'}`}
              disabled={isSubmitting || isInsufficient}
            >
              <MinusCircle size={16} /> {isInsufficient ? 'Stok Tidak Cukup' : (isSubmitting ? 'Memproses...' : `Pemakaian -${useQty} ${selectedBahan?.satuan || ''}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL TAMBAH UTANG / FAKTUR SUPPLIER BARU
// ----------------------------------------------------
export function ModalTambahUtangSupplier({ isOpen, onClose, bahanList = [], suppliersList = [], onSubmit, onOpenKelolaSupplier, showAlert }) {
  const [noFaktur, setNoFaktur] = useState('');
  const [supplier, setSupplier] = useState('');
  const [bahanId, setBahanId] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [hargaSatuan, setHargaSatuan] = useState(0);
  const [dp, setDp] = useState(0);
  const [jatuhTempo, setJatuhTempo] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedBahanList = React.useMemo(() => {
    return [...bahanList].sort((a, b) => {
      const numA = parseInt((a.sku || '').replace(/\D/g, '') || '0', 10);
      const numB = parseInt((b.sku || '').replace(/\D/g, '') || '0', 10);
      if (numA !== numB) return numA - numB;
      return (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [bahanList]);

  useEffect(() => {
    if (isOpen) {
      setNoFaktur('');
      setSupplier(suppliersList.length > 0 ? suppliersList[0].nama : '');
      if (sortedBahanList.length > 0) {
        const firstB = sortedBahanList[0];
        setBahanId(firstB.id || firstB._id || firstB.sku);
        if (firstB.harga) setHargaSatuan(firstB.harga);
      }
      setJumlah(100);
      setHargaSatuan(0);
      setDp(0);
      const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setJatuhTempo(in14Days);
      setCatatan('');
      setIsSubmitting(false);
    }
  }, [isOpen, sortedBahanList, suppliersList]);

  if (!isOpen) return null;

  const selectedBahan = sortedBahanList.find(b => b.id === bahanId || b._id === bahanId || b.sku === bahanId) || sortedBahanList[0];
  const totalTagihan = (parseFloat(jumlah) || 0) * (parseFloat(hargaSatuan) || 0);
  const sisaUtang = Math.max(0, totalTagihan - (parseFloat(dp) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplier || !noFaktur || parseFloat(jumlah) <= 0) {
      if (showAlert) showAlert('Supplier, No Faktur, dan Jumlah wajib diisi (>0).', 'error', 'Validasi Gagal');
      return;
    }

    setIsSubmitting(true);
    await onSubmit({
      noFaktur,
      supplier,
      bahanId: selectedBahan ? (selectedBahan.id || selectedBahan._id || selectedBahan.sku) : '',
      bahanNama: selectedBahan ? selectedBahan.nama : 'Bahan Baku',
      satuan: selectedBahan ? selectedBahan.satuan : 'unit',
      jumlah: parseFloat(jumlah),
      hargaSatuan: parseFloat(hargaSatuan),
      dp: parseFloat(dp) || 0,
      jatuhTempo,
      catatan
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <h3>💳 Catat Pembelian Bahan &amp; Utang Supplier Baru</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label>Nomor Faktur / Invoice *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Masukkan No Faktur / Invoice"
                  value={noFaktur}
                  onChange={e => setNoFaktur(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ marginBottom: 0 }}>Pilih Supplier / Vendor *</label>
                  {onOpenKelolaSupplier && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm"
                      style={{ padding: 0, fontSize: '0.75rem', color: 'var(--amber)', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer' }}
                      onClick={onOpenKelolaSupplier}
                    >
                      + Kelola Supplier
                    </button>
                  )}
                </div>
                {suppliersList.length > 0 ? (
                  <select
                    className="select-input"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  >
                    {suppliersList.map(s => (
                      <option key={s.id || s._id || s.nama} value={s.nama}>
                        {s.kode ? `[${s.kode}] ${s.nama}` : s.nama}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Misal: PT Marksoy Indonesia"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    required
                  />
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Pilih Bahan Baku Yang Dibeli</label>
              <select className="select-input" value={bahanId} onChange={e => {
                setBahanId(e.target.value);
                const b = sortedBahanList.find(x => (x.id || x._id || x.sku) === e.target.value);
                if (b && b.harga) setHargaSatuan(b.harga);
              }}>
                {sortedBahanList.map(b => (
                  <option key={b.id || b._id || b.sku} value={b.id || b._id || b.sku}>
                    {b.sku} - {b.nama} (Stok Saat Ini: {b.stok} {b.satuan})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Jumlah ({selectedBahan?.satuan || 'unit'}) *</label>
                <input type="number" step="any" min="0.1" className="form-control" value={jumlah} onChange={e => setJumlah(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Harga Satuan (Rp)</label>
                <input type="number" step="any" min="0" className="form-control" value={hargaSatuan} onChange={e => setHargaSatuan(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Total Tagihan</label>
                <input type="text" className="form-control" value={`Rp ${totalTagihan.toLocaleString('id-ID')}`} disabled readOnly style={{ fontWeight: 700, color: 'var(--amber)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label>Uang Muka / DP Dibayar (Rp)</label>
                <input type="number" step="any" min="0" className="form-control" placeholder="0" value={dp} onChange={e => setDp(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Sisa Utang Tempo</label>
                <input type="text" className="form-control" value={`Rp ${sisaUtang.toLocaleString('id-ID')}`} disabled readOnly style={{ fontWeight: 800, color: 'var(--rose)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label>Tanggal Jatuh Tempo *</label>
                <input type="date" className="form-control" value={jatuhTempo} onChange={e => setJatuhTempo(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Catatan Pembelian</label>
                <input type="text" className="form-control" placeholder="Misal: DP 50%, sisa tempo 14 hari" value={catatan} onChange={e => setCatatan(e.target.value)} />
              </div>
            </div>

            <div style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--amber)', fontWeight: 600 }}>
              💡 <strong>INFO PEMBELIAN:</strong> Pencatatan faktur utang ini <strong>TIDAK MENGUBAH STOK BARANG</strong>. Stok fisik gudang baru akan bertambah saat barang dikirim &amp; diverifikasi di menu <strong>Penerimaan Bahan Baku</strong>.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pembelian & Faktur Utang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL BAYAR / CICIL UTANG SUPPLIER
// ----------------------------------------------------
export function ModalBayarUtangSupplier({ isOpen, onClose, utangRecord, onSubmitPay, showAlert }) {
  const [jumlahBayar, setJumlahBayar] = useState(0);
  const [metode, setMetode] = useState('Transfer Bank');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && utangRecord) {
      setJumlahBayar(utangRecord.sisaUtang || 0);
      setMetode('Transfer Bank');
      setKeterangan('Pelunasan Utang Supplier');
      setIsSubmitting(false);
    }
  }, [isOpen, utangRecord]);

  if (!isOpen || !utangRecord) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payVal = parseFloat(jumlahBayar) || 0;
    if (payVal <= 0) {
      if (showAlert) showAlert('Masukkan jumlah pembayaran (>0).', 'error', 'Validasi Gagal');
      return;
    }
    if (payVal > utangRecord.sisaUtang) {
      if (showAlert) showAlert(`Jumlah bayar (Rp ${payVal.toLocaleString('id-ID')}) melebihi sisa utang (Rp ${utangRecord.sisaUtang.toLocaleString('id-ID')}).`, 'error', 'Pembayaran Melebihi Utang');
      return;
    }

    setIsSubmitting(true);
    await onSubmitPay(utangRecord.id, {
      jumlahBayar: payVal,
      metode,
      keterangan
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3>💸 Bayar / Cicil Utang Supplier</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: 'var(--bg-darker)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Faktur Tagihan:</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>{utangRecord.noFaktur}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>{utangRecord.supplier} ({utangRecord.bahanNama})</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.82rem', borderTop: '1px border var(--border-color)', paddingTop: '0.5rem' }}>
                <div>Total Tagihan: <strong>Rp {utangRecord.totalTagihan?.toLocaleString('id-ID')}</strong></div>
                <div>Sudah Dibayar: <strong style={{ color: 'var(--emerald)' }}>Rp {utangRecord.jumlahDibayar?.toLocaleString('id-ID')}</strong></div>
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--rose)' }}>
                Sisa Utang Tempo: Rp {utangRecord.sisaUtang?.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="form-group">
              <label>Jumlah Pembayaran Saat Ini (Rp) *</label>
              <input type="number" step="any" min="1" max={utangRecord.sisaUtang} className="form-control" value={jumlahBayar} onChange={e => setJumlahBayar(e.target.value)} required />
              <button
                type="button"
                className="btn btn-outline btn-emerald btn-sm"
                style={{ marginTop: '0.4rem', width: '100%', fontSize: '0.75rem' }}
                onClick={() => setJumlahBayar(utangRecord.sisaUtang)}
              >
                ⚡ Lunasi Seluruh Sisa Utang (Rp {utangRecord.sisaUtang?.toLocaleString('id-ID')})
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label>Metode Pembayaran</label>
                <select className="select-input" value={metode} onChange={e => setMetode(e.target.value)}>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="Tunai / Cash">Tunai / Cash</option>
                  <option value="Giro / Cek">Giro / Cek</option>
                </select>
              </div>
              <div className="form-group">
                <label>Keterangan Pembayaran</label>
                <input type="text" className="form-control" placeholder="Misal: Cicilan ke-2" value={keterangan} onChange={e => setKeterangan(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-emerald" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : `Simpan Pembayaran Rp ${parseFloat(jumlahBayar || 0).toLocaleString('id-ID')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL RIWAYAT PEMBAYARAN SUPPLIER
// ----------------------------------------------------
export function ModalRiwayatBayarSupplier({ isOpen, onClose, utangRecord }) {
  if (!isOpen || !utangRecord) return null;

  const riwayat = utangRecord.riwayatBayar || [];

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>📜 Riwayat Pembayaran Faktur {utangRecord.noFaktur}</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--bg-darker)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>{utangRecord.supplier}</div>
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>{utangRecord.bahanNama} ({utangRecord.jumlah} {utangRecord.satuan})</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sisa Utang:</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: utangRecord.sisaUtang === 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                Rp {utangRecord.sisaUtang?.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {riwayat.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
              Belum ada riwayat pembayaran untuk faktur ini.
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>TANGGAL &amp; WAKTU</th>
                    <th>JUMLAH DIBAYAR</th>
                    <th>METODE</th>
                    <th>KETERANGAN</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{r.tanggal}</td>
                      <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                        +Rp {r.jumlah?.toLocaleString('id-ID')}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{r.metode}</td>
                      <td style={{ fontSize: '0.78rem' }} className="text-muted">{r.keterangan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL TERIMA BARANG / VERIFIKASI STOK FISIK
// ----------------------------------------------------
export function ModalTerimaBahanSupplier({ isOpen, onClose, utangRecord, onSubmitReceive, showAlert }) {
  const [jumlahTerima, setJumlahTerima] = useState(0);
  const [penerima, setPenerima] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && utangRecord) {
      const total = utangRecord.jumlah || 0;
      const diterim = utangRecord.jumlahDiterima || 0;
      const pending = utangRecord.sisaBelumDiterima !== undefined ? utangRecord.sisaBelumDiterima : Math.max(0, total - diterim);

      setJumlahTerima(pending);
      setPenerima('');
      setCatatan('Verifikasi Fisik & Penerimaan Gudang');
      setIsSubmitting(false);
    }
  }, [isOpen, utangRecord]);

  if (!isOpen || !utangRecord) return null;

  const total = utangRecord.jumlah || 0;
  const diterim = utangRecord.jumlahDiterima || 0;
  const pending = utangRecord.sisaBelumDiterima !== undefined ? utangRecord.sisaBelumDiterima : Math.max(0, total - diterim);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const receiveVal = parseFloat(jumlahTerima) || 0;
    if (receiveVal <= 0) {
      if (showAlert) showAlert('Masukkan jumlah barang yang diterima (>0).', 'error', 'Validasi Gagal');
      return;
    }
    if (receiveVal > pending) {
      if (showAlert) showAlert(`Jumlah penerimaan (${receiveVal} ${utangRecord.satuan}) melebihi sisa barang pending (${pending} ${utangRecord.satuan}).`, 'error', 'Jumlah Melebihi Pesanan');
      return;
    }

    setIsSubmitting(true);
    await onSubmitReceive(utangRecord.id, {
      jumlahTerima: receiveVal,
      penerima,
      catatan
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3>📦 Verifikasi Penerimaan Barang Fisik Gudang</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: 'var(--bg-darker)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No. Faktur Pembelian:</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>{utangRecord.noFaktur}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>{utangRecord.supplier}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.82rem', borderTop: '1px border var(--border-color)', paddingTop: '0.5rem' }}>
                <div>Order Beli: <strong>{total} {utangRecord.satuan} {utangRecord.bahanNama}</strong></div>
                <div>Sudah Diterima: <strong style={{ color: 'var(--emerald)' }}>{diterim} {utangRecord.satuan}</strong></div>
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--amber)' }}>
                Sisa Pending Pengiriman: {pending} {utangRecord.satuan}
              </div>
            </div>

            <div className="form-group">
              <label>Jumlah Fisik Barang Diterima ({utangRecord.satuan}) *</label>
              <input type="number" step="any" min="0.1" max={pending} className="form-control" value={jumlahTerima} onChange={e => setJumlahTerima(e.target.value)} required />
              <button
                type="button"
                className="btn btn-outline btn-emerald btn-sm"
                style={{ marginTop: '0.4rem', width: '100%', fontSize: '0.75rem' }}
                onClick={() => setJumlahTerima(pending)}
              >
                ⚡ Terima Seluruh Sisa Barang ({pending} {utangRecord.satuan})
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label>Nama Penerima / Verifikator</label>
                <input type="text" className="form-control" placeholder="Misal: Siti Gudang" value={penerima} onChange={e => setPenerima(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Catatan Fisik Barang</label>
                <input type="text" className="form-control" placeholder="Kondisi barang baik &amp; segel utuh" value={catatan} onChange={e => setCatatan(e.target.value)} />
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 600 }}>
              💡 <strong>INFO STOK:</strong> Mengonfirmasi penerimaan ini akan <strong>otomatis menambah +{jumlahTerima} {utangRecord.satuan} {utangRecord.bahanNama}</strong> ke persediaan stok fisik gudang!
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-emerald" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : `Konfirmasi Terima +${parseFloat(jumlahTerima || 0)} ${utangRecord.satuan}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL RIWAYAT PENERIMAAN BARANG SUPPLIER
// ----------------------------------------------------
export function ModalRiwayatTerimaSupplier({ isOpen, onClose, utangRecord }) {
  if (!isOpen || !utangRecord) return null;

  const riwayat = utangRecord.riwayatPenerimaan || [];

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>📜 Riwayat Penerimaan Fisik Faktur {utangRecord.noFaktur}</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--bg-darker)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>{utangRecord.supplier}</div>
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>{utangRecord.bahanNama} (Total Order: {utangRecord.jumlah} {utangRecord.satuan})</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Jumlah Diterima:</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--emerald)' }}>
                {utangRecord.jumlahDiterima || 0} {utangRecord.satuan}
              </div>
            </div>
          </div>

          {riwayat.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
              Belum ada riwayat pengiriman / penerimaan fisik barang untuk faktur ini.
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>TANGGAL &amp; WAKTU</th>
                    <th>JUMLAH DITERIMA</th>
                    <th>PENERIMA</th>
                    <th>CATATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{r.tanggal}</td>
                      <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                        +{r.jumlah} {utangRecord.satuan}
                      </td>
                      <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{r.penerima || 'Staf Gudang'}</td>
                      <td style={{ fontSize: '0.78rem' }} className="text-muted">{r.catatan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL KELOLA MASTER DATA SUPPLIER
// ----------------------------------------------------
export function ModalKelolaSupplier({ isOpen, onClose, suppliersList = [], onCreateSupplier, onUpdateSupplier, onDeleteSupplier, showAlert }) {
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [alamat, setAlamat] = useState('');
  const [catatan, setCatatan] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setNama('');
    setKontak('');
    setAlamat('');
    setCatatan('');
    setEditingId(null);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  const handleEditClick = (s) => {
    setEditingId(s.id || s._id);
    setNama(s.nama || '');
    setKontak(s.kontak || '');
    setAlamat(s.alamat || '');
    setCatatan(s.catatan || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim()) {
      if (showAlert) showAlert('Nama supplier wajib diisi.', 'error', 'Validasi Gagal');
      return;
    }

    setIsSubmitting(true);
    if (editingId) {
      await onUpdateSupplier(editingId, { nama: nama.trim(), kontak, alamat, catatan });
    } else {
      await onCreateSupplier({ nama: nama.trim(), kontak, alamat, catatan });
    }
    setIsSubmitting(false);
    resetForm();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <h3>🏢 Master Data &amp; Kelola Supplier / Vendor</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {/* Form Create / Edit Supplier */}
          <form onSubmit={handleSubmit} style={{ background: 'var(--bg-darker)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: editingId ? 'var(--cyan)' : 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {editingId ? <Edit3 size={15} /> : <Plus size={15} />}
              {editingId ? 'Edit Supplier' : 'Tambah Supplier Baru'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.78rem' }}>Nama Supplier / Perusahaan *</label>
                <input type="text" className="form-control" placeholder="Misal: PT Marksoy Indonesia" value={nama} onChange={e => setNama(e.target.value)} required />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.78rem' }}>Kontak / No HP Sales</label>
                <input type="text" className="form-control" placeholder="0812-xxxx-xxxx" value={kontak} onChange={e => setKontak(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.78rem' }}>Alamat Kota / Wilayah</label>
                <input type="text" className="form-control" placeholder="Jakarta" value={alamat} onChange={e => setAlamat(e.target.value)} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.78rem' }}>Catatan</label>
                <input type="text" className="form-control" placeholder="Keterangan bumbu / bahan baku" value={catatan} onChange={e => setCatatan(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              {editingId && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>Batal Edit</button>
              )}
              <button type="submit" className={`btn btn-sm ${editingId ? 'btn-cyan' : 'btn-emerald'}`} disabled={isSubmitting}>
                {isSubmitting ? 'Memproses...' : (editingId ? 'Simpan Perubahan' : '+ Tambah Supplier')}
              </button>
            </div>
          </form>

          {/* Table Daftar Supplier */}
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Daftar Opsi Supplier ({suppliersList.length})</h4>
          <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>NAMA SUPPLIER</th>
                  <th>KONTAK</th>
                  <th>ALAMAT</th>
                  <th style={{ textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {suppliersList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem' }} className="text-muted">
                      Belum ada data supplier. Tambahkan supplier pertama Anda di atas.
                    </td>
                  </tr>
                ) : (
                  suppliersList.map(s => (
                    <tr key={s.id || s._id || s.nama}>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{s.nama}</td>
                      <td style={{ fontSize: '0.8rem' }}>{s.kontak || '-'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{s.alamat || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="btn-group">
                          <button className="btn btn-sm btn-outline" title="Edit Supplier" onClick={() => handleEditClick(s)}>
                            <Edit3 size={13} />
                          </button>
                          <button className="btn btn-sm btn-outline btn-danger" title="Hapus Supplier" onClick={() => onDeleteSupplier(s.id || s._id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Selesai &amp; Tutup</button>
        </div>
      </div>
    </div>
  );
}
