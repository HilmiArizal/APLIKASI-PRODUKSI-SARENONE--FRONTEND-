import React, { useState } from 'react';
import { Search, Play, Plus, Edit3, Trash2, List, FileText, FileSpreadsheet, Tag } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function ProdukTab({
  produk,
  resep,
  kategoriList = [],
  activeRoleView,
  onOpenTambahProduk,
  onOpenEditProduk,
  onOpenProduksiSpesifik,
  onOpenKelolaKategori,
  onOpenPdfPreview,
  onDeleteProduk
}) {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const isSuperAdmin = (activeRoleView === 'ADMIN' || activeRoleView === 'ADMIN_PRODUK');
  const canEdit = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU' || activeRoleView === 'ADMIN_PRODUK' || activeRoleView === 'TIM_PENJUALAN');
  const isProdukDomain = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'TIM_MARKETING', 'SALES'].includes(activeRoleView);

  const filtered = produk
    .filter(p => {
      const matchQuery = p.nama.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchKat = !kategoriFilter || p.kategori === kategoriFilter;
      return matchQuery && matchKat;
    })
    .sort((a, b) => (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' }));

  const handleExportExcel = () => {
    const headers = ['Kode SKU', 'Nama Produk', 'Kategori', 'Stok Produk Jadi (Batch)', 'Jumlah Bahan Resep'];
    const rows = filtered.map(p => [
      p.sku,
      p.nama,
      p.kategori,
      p.stok,
      (resep[p.id] || []).length
    ]);
    exportToExcel('Katalog_Produk_Jadi', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['SKU', 'Nama Produk Jadi', 'Kategori', 'Stok Ready', 'Formulasi Resep'];
    const rows = filtered.map(p => [
      p.sku,
      p.nama,
      p.kategori,
      `${p.stok} Batch`,
      `${(resep[p.id] || []).length} Bahan Baku`
    ]);
    const config = {
      title: 'Laporan Katalog & Stok Produk Jadi',
      subtitle: `Menampilkan ${filtered.length} varian sosis`,
      headers,
      rows,
      summaryText: `Total Varian Produk: ${filtered.length} | Total Persediaan Siap Jual: ${filtered.reduce((acc, curr) => acc + curr.stok, 0)} Batch`,
      filename: 'Katalog_Stok_Produk_Jadi'
    };
    if (onOpenPdfPreview) {
      onOpenPdfPreview(config);
    } else {
      exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
    }
  };

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      {/* ===== TOOLBAR ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box" style={{ height: '32px', maxWidth: '300px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Cari produk (misal: RCS, SCM, BS)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: '0.78rem' }}
            />
          </div>

          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="select-input"
            style={{
              height: '32px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '0 0.6rem',
              background: '#ffffff',
              color: '#0f172a',
              outline: 'none',
              maxWidth: '180px'
            }}
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map(k => (
              <option key={k.id} value={k.nama}>{k.nama}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
          {canEdit && (
            <>
              {!isProdukDomain && (
                <button
                  type="button"
                  className="btn btn-emerald"
                  onClick={() => onOpenProduksiSpesifik(null)}
                  style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.75rem', borderRadius: '6px', boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Play size={14} /> Mulai Produksi Batch
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenTambahProduk}
                style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.75rem', borderRadius: '6px', boxShadow: '0 3px 10px rgba(14, 165, 233, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={14} /> + Tambah Produk Baru
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===== PRODUK CARDS GRID ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            Tidak ada produk yang sesuai dengan kriteria pencarian.
          </div>
        ) : (
          filtered.map(p => {
            const formulaList = resep[p.id] || [];

            return (
              <div
                key={p.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.75rem 0.85rem',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.65rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px', display: 'inline-block' }}>
                      {p.sku} • {p.kategori || 'Sosis Olahan'}
                    </span>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0 0', lineHeight: 1.3 }}>
                      {p.nama}
                    </h4>
                  </div>

                  {canEdit && (
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        type="button"
                        style={{
                          background: '#f0f9ff',
                          color: '#0284c7',
                          border: '1px solid #bae6fd',
                          borderRadius: '5px',
                          width: '24px',
                          height: '24px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => onOpenEditProduk(p)}
                        title="Edit Data Produk"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        type="button"
                        style={{
                          background: '#fef2f2',
                          color: '#ef4444',
                          border: '1px solid #fecaca',
                          borderRadius: '5px',
                          width: '24px',
                          height: '24px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => onDeleteProduk && onDeleteProduk(p.id)}
                        title="Hapus Produk"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Row: Formulasi Resep & Action Button */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                    <List size={13} style={{ color: '#0284c7' }} />
                    <span>Formulasi: <strong style={{ color: '#0f172a', fontWeight: 800 }}>{formulaList.length} Bahan</strong></span>
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onOpenProduksiSpesifik(p.id || p._id || p.sku)}
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        height: '28px',
                        padding: '0 0.65rem',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Play size={12} /> Produksi
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
