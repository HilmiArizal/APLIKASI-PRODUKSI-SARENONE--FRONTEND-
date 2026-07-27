import React, { useState } from 'react';
import { Layers, Plus, Edit3, Trash2, Tag, Boxes, Search } from 'lucide-react';

export default function KategoriTab({
  kategoriProduk = [],
  kategoriBahanBaku = [],
  produk = [],
  bahanBaku = [],
  activeRoleView,
  onSaveKategoriProduk,
  onDeleteKategoriProduk,
  onSaveKategoriBahan,
  onDeleteKategoriBahan
}) {
  const [subTab, setSubTab] = useState('produk'); // 'produk' or 'bahan'
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [namaInput, setNamaInput] = useState('');
  const [deskripsiInput, setDeskripsiInput] = useState('');

  const isSuperAdmin = (activeRoleView === 'ADMIN');
  const canEdit = isSuperAdmin;

  const activeList = subTab === 'produk' ? kategoriProduk : kategoriBahanBaku;
  const filteredList = activeList.filter(k =>
    k.nama.toLowerCase().includes(search.toLowerCase()) ||
    (k.deskripsi && k.deskripsi.toLowerCase().includes(search.toLowerCase()))
  );

  const handleStartAdd = () => {
    setEditingId('NEW');
    setNamaInput('');
    setDeskripsiInput('');
    setIsEditing(true);
  };

  const handleStartEdit = (kat) => {
    setEditingId(kat.id);
    setNamaInput(kat.nama);
    setDeskripsiInput(kat.deskripsi || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setNamaInput('');
    setDeskripsiInput('');
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!namaInput.trim()) {
      alert('Nama kategori wajib diisi!');
      return;
    }

    const payload = editingId === 'NEW'
      ? { nama: namaInput.trim(), deskripsi: deskripsiInput.trim() }
      : { id: editingId, nama: namaInput.trim(), deskripsi: deskripsiInput.trim() };

    if (subTab === 'produk') {
      onSaveKategoriProduk(payload);
    } else {
      onSaveKategoriBahan(payload);
    }

    handleCancel();
  };

  return (
    <div className="tab-pane active">
      {/* Header Banner */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={22} style={{ color: 'var(--amber)' }} /> Manajemen Kategori Produk & Bahan Baku
            </h3>
            <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
              Kelola pengelompokan jenis produk jadi dan kategori stok bahan baku dapur secara terpusat di Cloud MongoDB Atlas.
            </p>
          </div>

          {canEdit && (
            <button className="btn btn-primary" onClick={handleStartAdd}>
              <Plus size={16} /> Tambah Kategori {subTab === 'produk' ? 'Produk' : 'Bahan Baku'} Baru
            </button>
          )}
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => { setSubTab('produk'); handleCancel(); }}
          style={{
            flex: 1,
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: subTab === 'produk' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            background: subTab === 'produk' ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))' : 'var(--bg-card)',
            color: subTab === 'produk' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <Tag size={18} /> Kategori Produk Jadi ({kategoriProduk.length})
        </button>

        <button
          onClick={() => { setSubTab('bahan'); handleCancel(); }}
          style={{
            flex: 1,
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: subTab === 'bahan' ? '1px solid var(--amber)' : '1px solid var(--border-color)',
            background: subTab === 'bahan' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))' : 'var(--bg-card)',
            color: subTab === 'bahan' ? 'var(--amber)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <Boxes size={18} /> Kategori Bahan Baku ({kategoriBahanBaku.length})
        </button>
      </div>

      {/* Inline Form Add / Edit */}
      {isEditing && (
        <form onSubmit={handleSubmitForm} style={{ background: 'var(--bg-card)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>
            {editingId === 'NEW' ? `+ Tambah Kategori ${subTab === 'produk' ? 'Produk' : 'Bahan Baku'} Baru` : `✏️ Edit Kategori ${subTab === 'produk' ? 'Produk' : 'Bahan Baku'}`}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Nama Kategori *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Misal: Roti Manis, Toping & Isian..."
                value={namaInput}
                onChange={(e) => setNamaInput(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Deskripsi & Keterangan</label>
              <input
                type="text"
                className="form-control"
                placeholder="Penjelasan ringkas pengelompokan jenis ini..."
                value={deskripsiInput}
                onChange={(e) => setDeskripsiInput(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan Kategori ke MongoDB</button>
          </div>
        </form>
      )}

      {/* Toolbar Search */}
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder={`Cari kategori ${subTab === 'produk' ? 'produk' : 'bahan baku'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category List Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>NAMA KATEGORI</th>
              <th>DESKRIPSI & KETERANGAN</th>
              <th>TOTAL TERIKAT</th>
              {canEdit && <th style={{ textAlign: 'right' }}>AKSI MANAJEMEN</th>}
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 5 : 4} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Belum ada kategori {subTab === 'produk' ? 'produk' : 'bahan baku'} yang terdaftar.
                </td>
              </tr>
            ) : (
              filteredList.map((kat, idx) => {
                const countTerikat = subTab === 'produk'
                  ? produk.filter(p => p.kategori === kat.nama).length
                  : bahanBaku.filter(b => b.kategori === kat.nama).length;

                return (
                  <tr key={kat.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700, color: subTab === 'produk' ? 'var(--primary)' : 'var(--amber)' }}>{kat.nama}</td>
                    <td className="text-muted">{kat.deskripsi || '-'}</td>
                    <td>
                      <span className="badge badge-cyan">{countTerikat} {subTab === 'produk' ? 'Varian Produk' : 'Item Bahan'}</span>
                    </td>
                    {canEdit && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm btn-outline" onClick={() => handleStartEdit(kat)}>
                            <Edit3 size={14} /> Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline btn-danger"
                            onClick={() => subTab === 'produk' ? onDeleteKategoriProduk(kat.id) : onDeleteKategoriBahan(kat.id)}
                          >
                            <Trash2 size={14} /> Hapus
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
    </div>
  );
}
