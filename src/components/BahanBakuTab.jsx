import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2, FileText, Tag, Upload, Calendar } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { exportToExcel } from '../utils/exportUtils';
import ModalPreviewPdf from './ModalPreviewPdf';
import { ModalImportBahanExcel } from './Modals';

export default function BahanBakuTab({
  bahanBaku = [],
  kategoriList = [],
  riwayatProduksi = [],
  utangList = [],
  auditLog = [],
  activeRoleView,
  onOpenTambahBahan,
  onOpenEditBahan,
  onOpenStokMasuk,
  onOpenPemakaianKemasan,
  onDeleteBahan,
  onOpenKelolaKategoriBahan,
  onOpenPdfPreview,
  onImportExcelBahan,
  showAlert
}) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [filterTanggal, setFilterTanggal] = useState(todayStr);
  const [isPreviewPdfOpen, setIsPreviewPdfOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);

  const isSuperAdmin = (activeRoleView === 'ADMIN');
  const canAddOrRestock = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  // Calculate Historical Stock Position per Specific Date
  const getBahanStokOnDate = (b, targetDateStr) => {
    if (!targetDateStr || targetDateStr === todayStr) return Number(b.stok) || 0;

    let currentStok = Number(b.stok) || 0;
    const bNameLower = String(b.nama || '').trim().toLowerCase();
    const bId = String(b.id || b._id || '');

    // 1. Rollback receipts/restocks after target date (Subtract received qty after target date)
    (utangList || []).forEach(p => {
      const pDate = (p.tanggalPenerimaan || p.tanggalBeli || p.tanggal || '').substring(0, 10);
      if (pDate > targetDateStr) {
        if (p.riwayatPenerimaan && Array.isArray(p.riwayatPenerimaan)) {
          p.riwayatPenerimaan.forEach(r => {
            const rDate = (r.tanggal || r.createdAt || pDate).substring(0, 10);
            if (rDate > targetDateStr) {
              const itemNm = String(r.namaBahan || p.bahanNama || '').trim().toLowerCase();
              if (itemNm === bNameLower || p.sku === b.sku) {
                currentStok -= Number(r.jumlah || r.diterima || 0);
              }
            }
          });
        } else if (Number(p.jumlahDiterima || 0) > 0) {
          const itemNm = String(p.bahanNama || '').trim().toLowerCase();
          if (itemNm === bNameLower || p.sku === b.sku) {
            currentStok -= Number(p.jumlahDiterima || 0);
          }
        }
      }
    });

    // 2. Rollback production usage after target date (Add back consumed qty after target date)
    (riwayatProduksi || []).forEach(r => {
      const rDate = (r.timestamp || r.tanggal || '').substring(0, 10);
      if (rDate > targetDateStr) {
        if (r.bahanDigunakan && Array.isArray(r.bahanDigunakan)) {
          r.bahanDigunakan.forEach(item => {
            const itemNm = String(item.bahanNama || item.nama || '').trim().toLowerCase();
            if (itemNm === bNameLower || item.bahanId === bId) {
              currentStok += Number(item.jumlah || 0);
            }
          });
        }
      }
    });

    return Math.max(0, currentStok);
  };

  const filteredBahan = bahanBaku
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
    const headers = ['Kode SKU', 'Nama Bahan Baku', 'Kategori', filterTanggal ? `Stok Tgl (${filterTanggal})` : 'Stok Saat Ini', 'Batas Minimum', 'Satuan', 'Status Persediaan'];
    const rows = filteredBahan.map(b => {
      const stokVal = getBahanStokOnDate(b, filterTanggal);
      return [
        b.sku,
        b.nama,
        b.kategori,
        stokVal,
        b.minStok,
        b.satuan,
        stokVal <= b.minStok ? 'Menipis / Restock' : 'Stok Safe'
      ];
    });
    exportToExcel(`Stok_Bahan_Baku_${filterTanggal || 'Saat_Ini'}`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['SKU', 'Nama Bahan Baku', 'Kategori', filterTanggal ? `Stok (${filterTanggal})` : 'Stok Saat Ini', 'Batas Min.', 'Status'];
    const rows = filteredBahan.map(b => {
      const stokVal = getBahanStokOnDate(b, filterTanggal);
      return [
        b.sku,
        b.nama,
        b.kategori,
        `${stokVal} ${b.satuan}`,
        `${b.minStok} ${b.satuan}`,
        stokVal <= b.minStok ? 'Menipis / Restock' : 'Stok Safe'
      ];
    });
    const config = {
      title: 'Laporan Inventaris Stok Bahan Baku Dapur',
      subtitle: `Menampilkan posisi stok per tanggal (${filterTanggal || 'Hari Ini'}) - Total ${filteredBahan.length} item bahan mentah Saren One.`,
      headers,
      rows,
      summaryText: `Total Bahan Mentah: ${filteredBahan.length} Item`,
      filename: `Stok_Bahan_Baku_${filterTanggal || 'Saat_Ini'}`
    };
    if (onOpenPdfPreview) {
      onOpenPdfPreview(config);
    } else {
      setIsPreviewPdfOpen(true);
    }
  };

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* ===== PERIODE TANGGAL FILTER BAR (RIGHT ALIGNED) ===== */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={15} style={{ color: 'var(--amber)' }} /> Filter Position / Tanggal:
          </span>
          <input
            type="date"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#f8fafc',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer'
            }}
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
          />

          {filterTanggal !== todayStr && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setFilterTanggal(todayStr)}
              title="Reset ke tanggal hari ini"
              style={{ fontSize: '0.78rem' }}
            >
              Hari Ini
            </button>
          )}

          {filterTanggal && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setFilterTanggal('')}
              title="Tampilkan semua riwayat tanggal"
              style={{ fontSize: '0.78rem' }}
            >
              Semua Tanggal
            </button>
          )}
        </div>
      </div>

      {/* ===== SEARCH & ACTIONS TOOLBAR ===== */}
      <div className="toolbar">
        <div className="search-box" style={{ maxWidth: '320px' }}>
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

          {canAddOrRestock && (
            <button className="btn btn-outline btn-emerald" onClick={() => setIsImportExcelOpen(true)} title="Import Bahan Baku Masal dari File Excel">
              <Upload size={16} style={{ color: 'var(--emerald)' }} /> Import Excel
            </button>
          )}

          <button className="btn btn-outline" onClick={handleExportPDF} title="Preview & Cetak Laporan PDF">
            <FileText size={16} style={{ color: 'var(--amber)' }} /> Cetak PDF
          </button>

          {isSuperAdmin && (
            <button className="btn btn-primary" onClick={onOpenTambahBahan}>
              <Plus size={16} /> Tambah Bahan
            </button>
          )}
        </div>
      </div>

      {/* ===== TABEL STOK PERSEDIAAN ===== */}
      <div className="table-container mt-4">
        <table className="custom-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>NAMA BAHAN BAKU</th>
              <th>KATEGORI</th>
              <th>{filterTanggal ? `STOK TANGGAL (${filterTanggal})` : 'STOK SAAT INI'}</th>
              <th>BATAS MINIMUM</th>
              <th>STATUS STOK</th>
              {isSuperAdmin && <th style={{ textAlign: 'right' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filteredBahan.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Tidak ada data bahan baku dapur yang sesuai.
                </td>
              </tr>
            ) : (
              filteredBahan.map(b => {
                const stokVal = getBahanStokOnDate(b, filterTanggal);
                return (
                  <tr key={b.id}>
                    <td><span className="badge badge-amber">{b.sku}</span></td>
                    <td style={{ fontWeight: 600 }}>{b.nama}</td>
                    <td><span className="badge badge-cyan">{b.kategori}</span></td>
                    <td style={{ fontWeight: 700, color: filterTanggal ? 'var(--amber)' : '#f8fafc' }}>
                      {formatNumber(stokVal)} {b.satuan}
                    </td>
                    <td className="text-muted">{formatNumber(b.minStok)} {b.satuan}</td>
                    <td>{getStatusBadge(stokVal, b.minStok)}</td>
                    {isSuperAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button className="btn btn-icon btn-sm" onClick={() => onOpenEditBahan(b)} title="Edit Master Bahan">
                            <Edit3 size={15} />
                          </button>
                          <button className="btn btn-icon btn-sm btn-danger" onClick={() => onDeleteBahan(b.id)} title="Hapus Bahan Baku">
                            <Trash2 size={15} />
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

      {/* Excel & PDF Modals */}
      {isImportExcelOpen && (
        <ModalImportBahanExcel
          isOpen={isImportExcelOpen}
          onClose={() => setIsImportExcelOpen(false)}
          onImport={onImportExcelBahan}
          showAlert={showAlert}
        />
      )}
    </div>
  );
}
