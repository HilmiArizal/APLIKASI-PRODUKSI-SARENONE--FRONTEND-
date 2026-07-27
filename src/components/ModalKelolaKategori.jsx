import React, { useState } from 'react';
import { X, Plus, Edit3, Trash2 } from 'lucide-react';

export default function ModalKelolaKategori({ isOpen, onClose, kategoriProduk, onSaveKategori, onDeleteKategori }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [namaInput, setNamaInput] = useState('');
  const [deskripsiInput, setDeskripsiInput] = useState('');

  if (!isOpen) return null;

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

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setNamaInput('');
    setDeskripsiInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!namaInput.trim()) {
      alert('Nama Kategori wajib diisi!');
      return;
    }

    if (editingId === 'NEW') {
      onSaveKategori({ nama: namaInput.trim(), deskripsi: deskripsiInput.trim() });
    } else {
      onSaveKategori({ id: editingId, nama: namaInput.trim(), deskripsi: deskripsiInput.trim() });
    }

    handleCancelForm();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <h3>🏷️ Kelola Kategori Produk Jadi</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Form Add / Edit */}
          {isEditing ? (
            <form onSubmit={handleSubmit} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                {editingId === 'NEW' ? '+ Tambah Kategori Baru' : '✏️ Edit Kategori Produk'}
              </h4>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label>Nama Kategori Produk *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Misal: Roti Manis, Cake & Tart..."
                  value={namaInput}
                  onChange={(e) => setNamaInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Deskripsi / Keterangan</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Keterangan singkat kategori ini..."
                  value={deskripsiInput}
                  onChange={(e) => setDeskripsiInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-sm btn-secondary" onClick={handleCancelForm}>Batal</button>
                <button type="submit" className="btn btn-sm btn-primary">Simpan Kategori</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Total {kategoriProduk.length} Kategori Produk Terdaftar</span>
              <button className="btn btn-sm btn-primary" onClick={handleStartAdd}>
                <Plus size={14} /> Tambah Kategori Baru
              </button>
            </div>
          )}

          {/* Table List Kategori */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>NAMA KATEGORI</th>
                  <th>DESKRIPSI</th>
                  <th style={{ textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {kategoriProduk.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem' }} className="text-muted">
                      Belum ada kategori produk.
                    </td>
                  </tr>
                ) : (
                  kategoriProduk.map(kat => (
                    <tr key={kat.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{kat.nama}</td>
                      <td className="text-muted" style={{ fontSize: '0.8rem' }}>{kat.deskripsi || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm btn-outline" onClick={() => handleStartEdit(kat)}>
                            <Edit3 size={14} />
                          </button>
                          <button className="btn btn-sm btn-outline btn-danger" onClick={() => onDeleteKategori(kat.id)}>
                            <Trash2 size={14} />
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
          <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}
