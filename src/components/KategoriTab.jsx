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
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div></div>
          {canEdit && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartAdd}
              style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.75rem', borderRadius: '6px', boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} /> Tambah {subTab === 'produk' ? 'Brand Produk' : 'Kategori Bahan'} Baru
            </button>
          )}
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => { setSubTab('produk'); handleCancel(); }}
          style={{
            flex: 1,
            height: '36px',
            padding: '0 0.85rem',
            borderRadius: '8px',
            border: subTab === 'produk' ? '1px solid #0284c7' : '1px solid #cbd5e1',
            background: subTab === 'produk' ? '#e0f2fe' : '#ffffff',
            color: subTab === 'produk' ? '#0369a1' : '#64748b',
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Tag size={15} /> Brand / Merk Produk Jadi ({kategoriProduk.length})
        </button>

        <button
          type="button"
          onClick={() => { setSubTab('bahan'); handleCancel(); }}
          style={{
            flex: 1,
            height: '36px',
            padding: '0 0.85rem',
            borderRadius: '8px',
            border: subTab === 'bahan' ? '1px solid #f59e0b' : '1px solid #cbd5e1',
            background: subTab === 'bahan' ? '#fef3c7' : '#ffffff',
            color: subTab === 'bahan' ? '#b45309' : '#64748b',
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Boxes size={15} /> Kategori Bahan Baku ({kategoriBahanBaku.length})
        </button>
      </div>

      {/* Inline Form Add / Edit */}
      {isEditing && (
        <form onSubmit={handleSubmitForm} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #10b981', borderRadius: '10px', padding: '0.65rem 0.85rem', marginBottom: '0.75rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.55rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {editingId === 'NEW' ? `+ Tambah Kategori ${subTab === 'produk' ? 'Produk' : 'Bahan Baku'} Baru` : `✏️ Edit Kategori ${subTab === 'produk' ? 'Produk' : 'Bahan Baku'}`}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '0.55rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Nama Kategori *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Misal: Roti Manis, Toping & Isian..."
                value={namaInput}
                onChange={(e) => setNamaInput(e.target.value)}
                required
                style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.6rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Deskripsi &amp; Keterangan</label>
              <input
                type="text"
                className="form-control"
                placeholder="Penjelasan ringkas pengelompokan jenis ini..."
                value={deskripsiInput}
                onChange={(e) => setDeskripsiInput(e.target.value)}
                style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.6rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCancel} style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.75rem' }}>Batal</button>
            <button type="submit" className="btn btn-emerald" style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.85rem', borderRadius: '6px', boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)' }}>Simpan Kategori</button>
          </div>
        </form>
      )}

      {/* Toolbar Search */}
      <div className="toolbar" style={{ marginBottom: '0.65rem' }}>
        <div className="search-box" style={{ height: '32px', width: '100%' }}>
          <Search size={14} />
          <input
            type="text"
            placeholder={`Cari kategori ${subTab === 'produk' ? 'produk' : 'bahan baku'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '0.78rem' }}
          />
        </div>
      </div>

      {/* Category List Table */}
      <div className="table-container" style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
        <table className="custom-table" style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>NO</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>NAMA KATEGORI</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>DESKRIPSI &amp; KETERANGAN</th>
              <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>TOTAL TERIKAT</th>
              {canEdit && <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI MANAJEMEN</th>}
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 5 : 4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Belum ada kategori {subTab === 'produk' ? 'produk' : 'bahan baku'} yang terdaftar.
                </td>
              </tr>
            ) : (
              filteredList.map((kat, idx) => {
                const countTerikat = subTab === 'produk'
                  ? produk.filter(p => p.kategori === kat.nama).length
                  : bahanBaku.filter(b => b.kategori === kat.nama).length;

                return (
                  <tr key={kat.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.32rem 0.55rem', fontWeight: 700, color: '#64748b', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td style={{ padding: '0.32rem 0.55rem', fontWeight: 800, color: subTab === 'produk' ? '#0284c7' : '#d97706', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>{kat.nama}</td>
                    <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>{kat.deskripsi || '-'}</td>
                    <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.12rem 0.45rem', borderRadius: '5px', display: 'inline-block' }}>
                        {countTerikat} {subTab === 'produk' ? 'Varian Produk' : 'Item Bahan'}
                      </span>
                    </td>
                    {canEdit && (
                      <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            style={{
                              background: '#f0f9ff',
                              color: '#0284c7',
                              border: '1px solid #bae6fd',
                              borderRadius: '5px',
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              padding: '0 0.45rem',
                              height: '24px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => handleStartEdit(kat)}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            type="button"
                            style={{
                              background: '#fef2f2',
                              color: '#ef4444',
                              border: '1px solid #fecaca',
                              borderRadius: '5px',
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              padding: '0 0.45rem',
                              height: '24px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => subTab === 'produk' ? onDeleteKategoriProduk(kat.id) : onDeleteKategoriBahan(kat.id)}
                          >
                            <Trash2 size={12} /> Hapus
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
