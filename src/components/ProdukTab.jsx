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
    <div className="tab-pane active">
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Cari produk (misal: RCS, SCM, BS)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={kategoriFilter}
          onChange={(e) => setKategoriFilter(e.target.value)}
          className="select-input"
          style={{ maxWidth: '190px' }}
        >
          <option value="">Semua Kategori</option>
          {kategoriList.map(k => (
            <option key={k.id} value={k.nama}>{k.nama}</option>
          ))}
        </select>

        <div className="toolbar-actions">
          {isSuperAdmin && (
            <button className="btn btn-outline" onClick={onOpenKelolaKategori} title="Kelola Kategori Produk">
              <Tag size={16} style={{ color: 'var(--amber)' }} /> Kategori
            </button>
          )}

          {/* <button className="btn btn-outline" onClick={handleExportExcel} title="Export Data ke Excel (.csv)">
            <FileSpreadsheet size={16} style={{ color: 'var(--emerald)' }} /> Excel
          </button>

          <button className="btn btn-outline" onClick={handleExportPDF} title="Cetak / Simpan Laporan PDF">
            <FileText size={16} style={{ color: 'var(--amber)' }} /> Cetak PDF
          </button> */}

          {canEdit && (
            <>
              {!isProdukDomain && (
                <button className="btn btn-emerald" onClick={() => onOpenProduksiSpesifik(null)}>
                  <Play size={16} /> Mulai Produksi Batch
                </button>
              )}
              <button className="btn btn-primary" onClick={onOpenTambahProduk}>
                <Plus size={16} /> Tambah Produk Baru
              </button>
            </>
          )}
        </div>
      </div>

      <div className="produk-grid mt-4">
        {filtered.map(p => {
          const formulaList = resep[p.id] || [];

          return (
            <div key={p.id} className="produk-card">
              <div className="produk-card-header">
                <div>
                  <div className="produk-sku">{p.sku} • {p.kategori}</div>
                  <h4 className="produk-title">{p.nama}</h4>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button className="btn btn-sm btn-outline" title="Edit Data Produk" onClick={() => onOpenEditProduk(p)}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn btn-sm btn-outline btn-danger" title="Hapus Produk" onClick={() => onDeleteProduk && onDeleteProduk(p.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="produk-stok-box">
                <div>
                  <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>Ready, now?</span>
                  {/* <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{p.stok} Batch</strong> */}
                </div>
                {canEdit && (
                  <button className="btn btn-sm btn-emerald" onClick={() => onOpenProduksiSpesifik(p.id)}>
                    <Play size={14} /> Produksi
                  </button>
                )}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <List size={12} /> Formulasi Resep: <strong>{formulaList.length} Bahan</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
