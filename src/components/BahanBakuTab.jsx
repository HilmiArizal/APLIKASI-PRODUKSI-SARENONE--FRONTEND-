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
    const bId = String(b.id || b._id || '').trim().toLowerCase();
    const bSku = String(b.sku || '').trim().toLowerCase();

    // 1. Rollback physical receipts that occurred AFTER targetDateStr (Subtract received qty)
    (utangList || []).forEach(p => {
      const itemNm = String(p.bahanNama || '').trim().toLowerCase();
      const itemId = String(p.bahanId || '').trim().toLowerCase();
      const itemSku = String(p.sku || '').trim().toLowerCase();
      const isMatch = itemNm === bNameLower || (bId && itemId === bId) || (bSku && itemSku === bSku);

      if (!isMatch) return;

      if (p.riwayatPenerimaan && Array.isArray(p.riwayatPenerimaan) && p.riwayatPenerimaan.length > 0) {
        p.riwayatPenerimaan.forEach(r => {
          const rDate = (r.tanggal || p.tanggalPenerimaan || p.tanggalBeli || '').substring(0, 10);
          if (rDate && rDate > targetDateStr) {
            currentStok -= Number(r.jumlah || r.diterima || 0);
          }
        });
      } else if (Number(p.jumlahDiterima || 0) > 0) {
        const pDate = (p.tanggalPenerimaan || p.tanggalBeli || p.tanggal || '').substring(0, 10);
        if (pDate && pDate > targetDateStr) {
          currentStok -= Number(p.jumlahDiterima || 0);
        }
      }
    });

    // 2. Rollback production consumptions that occurred AFTER targetDateStr (Add back consumed qty)
    (riwayatProduksi || []).forEach(r => {
      const rDate = (r.tanggal || r.timestamp || '').substring(0, 10);
      if (rDate && rDate > targetDateStr) {
        if (Array.isArray(r.bahanDigunakan)) {
          r.bahanDigunakan.forEach(item => {
            const itemNm = String(item.bahanNama || item.nama || '').trim().toLowerCase();
            const itemId = String(item.bahanId || '').trim().toLowerCase();
            if (itemNm === bNameLower || (bId && itemId === bId)) {
              currentStok += Number(item.jumlah || 0);
            }
          });
        }
      }
    });

    return Math.round(Math.max(0, currentStok) * 1000) / 1000;
  };

  const filteredBahan = bahanBaku
    .filter(b => {
      const matchQuery = b.nama.toLowerCase().includes(search.toLowerCase()) || b.sku.toLowerCase().includes(search.toLowerCase());
      const matchKat = !kategoriFilter || b.kategori === kategoriFilter;
      return matchQuery && matchKat;
    })
    .sort((a, b) => (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' }));

  // Get Unit Price on or before target date based strictly on PHYSICAL GOODS RECEIPT DATE
  const getBahanHargaOnDate = (b, targetDateStr) => {
    if (!b) return 0;
    const bNameLower = String(b.nama || '').trim().toLowerCase();
    const bId = String(b.id || b._id || '');

    // 1. Check persistent Backend DB riwayatHarga array on item (which is synced on physical receipt)
    if (Array.isArray(b.riwayatHarga) && b.riwayatHarga.length > 0) {
      const pastPrices = b.riwayatHarga
        .filter(r => (!targetDateStr || (r.tanggal && r.tanggal.substring(0, 10) <= targetDateStr)) && Number(r.harga) > 0)
        .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
      if (pastPrices.length > 0) {
        return Number(pastPrices[0].harga);
      }
    }

    // 2. Search utangList for physical receipt events ON OR BEFORE targetDateStr
    const validReceipts = [];
    (utangList || []).forEach(inv => {
      const itemNm = String(inv.bahanNama || inv.namaBahan || '').trim().toLowerCase();
      const isMatch = itemNm === bNameLower || inv.sku === b.sku || inv.bahanId === bId;
      if (!isMatch) return;

      if (Array.isArray(inv.riwayatPenerimaan) && inv.riwayatPenerimaan.length > 0) {
        inv.riwayatPenerimaan.forEach(r => {
          const recDate = (r.tanggal || inv.tanggalBeli || '').substring(0, 10);
          const recPrice = Number(r.hargaSatuan || inv.hargaSatuan || 0);
          if (recPrice > 0 && (!targetDateStr || recDate <= targetDateStr)) {
            validReceipts.push({ tanggal: recDate, harga: recPrice });
          }
        });
      } else if (Number(inv.jumlahDiterima || 0) > 0) {
        const recDate = (inv.tanggalPenerimaan || inv.tanggalBeli || inv.tanggal || '').substring(0, 10);
        const recPrice = Number(inv.hargaSatuan || 0);
        if (recPrice > 0 && (!targetDateStr || recDate <= targetDateStr)) {
          validReceipts.push({ tanggal: recDate, harga: recPrice });
        }
      }
    });

    if (validReceipts.length > 0) {
      validReceipts.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
      return validReceipts[0].harga;
    }

    // 3. Fallback to master raw material price
    return Number(b.harga || 0);
  };

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
    const headers = ['Kode SKU', 'Nama Bahan Baku', 'Kategori', filterTanggal ? `Harga Tgl (${filterTanggal})` : 'Harga Terakhir (/satuan)', filterTanggal ? `Stok Tgl (${filterTanggal})` : 'Stok Saat Ini', 'Batas Minimum', 'Satuan', 'Status Persediaan'];
    const rows = filteredBahan.map(b => {
      const stokVal = getBahanStokOnDate(b, filterTanggal);
      const hargaVal = getBahanHargaOnDate(b, filterTanggal);
      return [
        b.sku,
        b.nama,
        b.kategori,
        hargaVal,
        stokVal,
        b.minStok,
        b.satuan,
        stokVal <= b.minStok ? 'Menipis / Restock' : 'Stok Safe'
      ];
    });
    exportToExcel(`Stok_Bahan_Baku_${filterTanggal || 'Saat_Ini'}`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['SKU', 'Nama Bahan Baku', 'Kategori', filterTanggal ? `Harga (${filterTanggal})` : 'Harga Terakhir', filterTanggal ? `Stok (${filterTanggal})` : 'Stok Saat Ini', 'Batas Min.', 'Status'];
    const rows = filteredBahan.map(b => {
      const stokVal = getBahanStokOnDate(b, filterTanggal);
      const hargaVal = getBahanHargaOnDate(b, filterTanggal);
      return [
        b.sku,
        b.nama,
        b.kategori,
        `Rp ${formatNumber(hargaVal)}/${b.satuan}`,
        `${stokVal} ${b.satuan}`,
        `${b.minStok} ${b.satuan}`,
        stokVal <= b.minStok ? 'Menipis / Restock' : 'Stok Safe'
      ];
    });
    const config = {
      title: 'Laporan Inventaris Stok Bahan Baku Dapur',
      subtitle: `Menampilkan posisi stok & harga per tanggal (${filterTanggal || 'Hari Ini'}) - Total ${filteredBahan.length} item bahan mentah Saren One.`,
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
              <th>{filterTanggal ? `HARGA TGL (${filterTanggal})` : 'HARGA TERAKHIR (BELI)'}</th>
              <th>{filterTanggal ? `STOK TANGGAL (${filterTanggal})` : 'STOK SAAT INI'}</th>
              <th>BATAS MINIMUM</th>
              <th>STATUS STOK</th>
              {isSuperAdmin && <th style={{ textAlign: 'right' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filteredBahan.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Tidak ada data bahan baku dapur yang sesuai.
                </td>
              </tr>
            ) : (
              filteredBahan.map(b => {
                const stokVal = getBahanStokOnDate(b, filterTanggal);
                const hargaVal = getBahanHargaOnDate(b, filterTanggal);
                return (
                  <tr key={b.id}>
                    <td><span className="badge badge-amber">{b.sku}</span></td>
                    <td style={{ fontWeight: 600 }}>{b.nama}</td>
                    <td><span className="badge badge-cyan">{b.kategori}</span></td>
                    <td style={{ fontWeight: 700, color: '#1f2d3d' }}>
                      Rp {formatNumber(hargaVal)} <span style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 500 }}>/ {b.satuan}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#1f2d3d' }}>
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
