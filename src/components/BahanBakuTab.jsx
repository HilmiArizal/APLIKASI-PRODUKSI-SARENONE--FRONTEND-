import React, { useState } from 'react';
import { Search, Plus, ArrowDownLeft, Edit3, Trash2, FileText, FileSpreadsheet, Tag } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { exportToExcel } from '../utils/exportUtils';
import ModalPreviewPdf from './ModalPreviewPdf';

export default function BahanBakuTab({
  bahanBaku,
  kategoriList = [],
  activeRoleView,
  onOpenTambahBahan,
  onOpenEditBahan,
  onOpenStokMasuk,
  onDeleteBahan,
  onOpenKelolaKategoriBahan,
  onOpenPdfPreview
}) {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [isPreviewPdfOpen, setIsPreviewPdfOpen] = useState(false);

  const isSuperAdmin = (activeRoleView === 'ADMIN');
  const canAddOrRestock = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU' || activeRoleView === 'PRODUK');

  const filtered = bahanBaku
    .filter(b => {
      const matchQuery = b.nama.toLowerCase().includes(search.toLowerCase()) || b.sku.toLowerCase().includes(search.toLowerCase());
      const matchKat = !kategoriFilter || b.kategori === kategoriFilter;
      return matchQuery && matchKat;
    })
    .sort((a, b) => (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' }));

  const getStatusBadge = (stok, minStok) => {
    if (stok === 0) {
      return <span className="badge badge-rose">Habis (Restock!)</span>;
    }
    if (stok <= minStok) {
      return <span className="badge badge-amber">Menipis (Restock!)</span>;
    }
    return <span className="badge badge-emerald">Stok Safe</span>;
  };

  const handleExportExcel = () => {
    const headers = ['Kode SKU', 'Nama Bahan Baku', 'Kategori', 'Stok Saat Ini', 'Batas Minimum', 'Satuan', 'Status Persediaan'];
    const rows = filtered.map(b => [
      b.sku,
      b.nama,
      b.kategori,
      b.stok,
      b.minStok,
      b.satuan,
      b.stok <= b.minStok ? 'Menipis / Restock' : 'Stok Safe'
    ]);
    exportToExcel('Stok_Bahan_Baku_Dapur', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['SKU', 'Nama Bahan Baku', 'Kategori', 'Stok Saat Ini', 'Batas Min.', 'Status'];
    const rows = filtered.map(b => [
      b.sku,
      b.nama,
      b.kategori,
      `${b.stok} ${b.satuan}`,
      `${b.minStok} ${b.satuan}`,
      b.stok <= b.minStok ? 'Menipis / Restock' : 'Stok Safe'
    ]);
    const config = {
      title: 'Laporan Inventaris Stok Bahan Baku Dapur',
      subtitle: `Menampilkan ${filtered.length} bahan mentah pergerakan stok Saren One.`,
      headers,
      rows,
      summaryText: `Total Bahan Mentah: ${filtered.length} Item | Status Menipis: ${filtered.filter(x => x.stok <= x.minStok).length} Item`,
      filename: 'Stok_Bahan_Baku'
    };
    if (onOpenPdfPreview) {
      onOpenPdfPreview(config);
    } else {
      setIsPreviewPdfOpen(true);
    }
  };

  return (
    <div className="tab-pane active">
      <div className="toolbar">
        <div className="search-box" style={{ maxWidth: '300px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Cari SKU atau Nama Bahan..."
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
            <button className="btn btn-outline" onClick={onOpenKelolaKategoriBahan} title="Kelola Kategori Bahan Baku">
              <Tag size={16} style={{ color: 'var(--amber)' }} /> Kategori
            </button>
          )}

          <button className="btn btn-outline" onClick={handleExportExcel} title="Export Data ke Excel (.csv)">
            <FileSpreadsheet size={16} style={{ color: 'var(--emerald)' }} /> Excel
          </button>

          <button className="btn btn-outline" onClick={() => setIsPreviewPdfOpen(true)} title="Preview & Cetak Laporan PDF">
            <FileText size={16} style={{ color: 'var(--amber)' }} /> Cetak PDF
          </button>

          {canAddOrRestock && (
            <>
              <button className="btn btn-cyan" onClick={onOpenStokMasuk}>
                <ArrowDownLeft size={16} /> Stok Masuk (Restock)
              </button>
              <button className="btn btn-primary" onClick={onOpenTambahBahan}>
                <Plus size={16} /> Tambah Bahan
              </button>
            </>
          )}
        </div>
      </div>

      <div className="table-container mt-4">
        <table className="custom-table">
          <thead>
            <tr>
              <th>SKU / KODE</th>
              <th>NAMA BAHAN BAKU</th>
              <th>KATEGORI</th>
              <th>STOK SAAT INI</th>
              <th>BATAS MIN.</th>
              <th>STATUS STOK</th>
              {isSuperAdmin && <th style={{ textAlign: 'right' }}>AKSI (SUPER ADMIN)</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Tidak ada bahan baku yang cocok dengan kata kunci pencarian.
                </td>
              </tr>
            ) : (
              filtered.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.8rem' }}>{b.sku}</td>
                  <td style={{ fontWeight: 600 }}>{b.nama}</td>
                  <td><span className="text-muted">{b.kategori}</span></td>
                  <td>
                    <strong style={{ fontSize: '0.95rem', color: b.stok <= b.minStok ? 'var(--rose)' : 'var(--text-main)' }}>
                      {b.stok}
                    </strong>{' '}
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>{b.satuan}</span>
                  </td>
                  <td className="text-muted">{b.minStok} {b.satuan}</td>
                  <td>{getStatusBadge(b.stok, b.minStok)}</td>
                  {isSuperAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-outline" title="Edit Bahan Baku" onClick={() => onOpenEditBahan(b)}>
                          <Edit3 size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline btn-danger" title="Hapus Bahan Baku" onClick={() => onDeleteBahan(b.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ModalPreviewPdf
        isOpen={isPreviewPdfOpen}
        onClose={() => setIsPreviewPdfOpen(false)}
        bahanBaku={filtered}
        activeUser={{ name: activeRoleView === 'ADMIN' ? 'Super Admin SAREN ONE' : 'Tim Bahan Baku' }}
      />
    </div>
  );
}
