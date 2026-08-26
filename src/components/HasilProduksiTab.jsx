import React, { useState, useMemo } from 'react';
import { Search, Plus, FileSpreadsheet, FileText, Trash2, Calendar, PackageCheck, Download, Info, CheckCircle2, Layers } from 'lucide-react';
import { formatNumber, INITIAL_PRODUK_MASTER } from '../data/initialData';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { ModalCatatHasilProduksi, ModalImportHasilProduksiExcel } from './Modals';

export default function HasilProduksiTab({
  hasilProduksi = [],
  produkList = [],
  activeRoleView,
  onSaveHasilProduksi,
  onImportHasilProduksi,
  onDeleteHasilProduksi,
  onOpenPdfPreview,
  showAlert
}) {
  const todayStr = new Date().toISOString().substring(0, 10);
  const [search, setSearch] = useState('');
  const [filterTanggal, setFilterTanggal] = useState(todayStr);
  const [isModalInputOpen, setIsModalInputOpen] = useState(false);
  const [isModalImportOpen, setIsModalImportOpen] = useState(false);

  const canManage = ['ADMIN', 'ADMIN_PRODUK', 'BAHAN_BAKU', 'PRODUKSI'].includes(activeRoleView);

  // Master product list with full item names
  const allProducts = INITIAL_PRODUK_MASTER;

  // Filtered yield entries for active date & search query
  const filteredYieldList = useMemo(() => {
    return (hasilProduksi || []).filter(item => {
      const matchDate = filterTanggal ? (item.tanggal && item.tanggal.substring(0, 10) === filterTanggal) : true;
      const matchSearch =
        String(item.produkNama || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.alias || item.kode || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.catatan || '').toLowerCase().includes(search.toLowerCase());
      return matchDate && matchSearch;
    }).sort((a, b) => (b.timestamp || b.tanggal || '').localeCompare(a.timestamp || a.tanggal || ''));
  }, [hasilProduksi, filterTanggal, search]);

  // Compute daily metrics
  const totalYieldPcs = useMemo(() => {
    return filteredYieldList.reduce((acc, curr) => acc + (parseFloat(curr.jumlahPcs) || 0), 0);
  }, [filteredYieldList]);

  const uniqueVariantCount = useMemo(() => {
    const set = new Set(filteredYieldList.map(item => item.alias || item.produkNama));
    return set.size;
  }, [filteredYieldList]);

  const totalYieldValue = useMemo(() => {
    return filteredYieldList.reduce((acc, item) => {
      const qty = parseFloat(item.jumlahPcs) || 0;
      const price = parseFloat(item.harga) || 0;
      return acc + (qty * price);
    }, 0);
  }, [filteredYieldList]);

  // Handle Export Excel
  const handleExportExcel = () => {
    const headers = ['No', 'ID Transaksi', 'Tanggal', 'Kode Alias', 'Nama Produk Jadi', 'Brand', 'Jumlah Hasil (Pack/Pcs)', 'Catatan / Shift'];
    const rows = filteredYieldList.map((item, idx) => [
      idx + 1,
      item.id || '-',
      item.tanggal || '-',
      item.alias || item.kode || '-',
      item.produkNama || '-',
      item.brand || '-',
      item.jumlahPcs,
      item.catatan || '-'
    ]);
    exportToExcel(`Laporan_Hasil_Produksi_${filterTanggal || 'Semua'}`, headers, rows);
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    const headers = ['Tanggal', 'Kode Alias', 'Nama Produk Jadi', 'Hasil Produksi', 'Catatan / Shift'];
    const rows = filteredYieldList.map(item => [
      item.tanggal || '-',
      item.alias || item.kode || '-',
      item.produkNama || '-',
      `${formatNumber(item.jumlahPcs)} ${item.satuan || 'pack'}`,
      item.catatan || '-'
    ]);
    const config = {
      title: 'Jurnal Output Hasil Produksi Barang Jadi',
      subtitle: `Catatan Hasil Penimbangan & Pembungkusan Produk Jadi (Periode Position: ${filterTanggal || 'Semua Tanggal'}).`,
      headers,
      rows,
      summaryText: `Total Output: ${formatNumber(totalYieldPcs)} Pack/Pcs | Variants: ${uniqueVariantCount} Jenis Produk | Est. Nilai: Rp ${formatNumber(totalYieldValue)}`,
      filename: `Jurnal_Hasil_Produksi_${filterTanggal || 'Semua'}`
    };
    if (onOpenPdfPreview) {
      onOpenPdfPreview(config);
    } else {
      exportToPDF(config.title, config.subtitle, config.headers, config.rows, config.summaryText, config.filename);
    }
  };

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      {/* ===== HEADER BANNER ===== */}
      <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 8px 25px rgba(2, 132, 199, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.75rem', padding: '0.25rem 0.6rem', marginBottom: '0.4rem', border: '1px solid rgba(255,255,255,0.3)' }}>
            📦 OUTPUT FINISHED GOODS (PRODUK JADI)
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <PackageCheck size={28} /> Pencatatan &amp; Import Hasil Produksi
          </h2>
          <p style={{ fontSize: '0.84rem', margin: '0.3rem 0 0 0', opacity: 0.9 }}>
            Catat hasil akhir pembungkusan sosis &amp; produk beku per hari. Mendukung input manual &amp; <strong>Import Excel</strong> dengan pemetaan nama produk lengkap.
          </p>
        </div>

        {canManage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={() => setIsModalImportOpen(true)}
              style={{ background: '#ffffff', color: '#0369a1', fontWeight: 800, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              <FileSpreadsheet size={16} /> Import Excel Hasil Produksi
            </button>
            <button
              className="btn btn-emerald"
              onClick={() => setIsModalInputOpen(true)}
              style={{ fontWeight: 800, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
            >
              <Plus size={16} /> + Catat Hasil Produksi
            </button>
          </div>
        )}
      </div>

      {/* ===== KPI SUMMARY METRICS ===== */}
      <div className="stats-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '5px solid #0284c7', borderRadius: '12px', padding: '1.15rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.65rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageCheck size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                Total Output ({filterTanggal === todayStr ? 'Hari Ini' : (filterTanggal || 'Semua')})
              </span>
              <h3 style={{ color: '#0284c7', fontSize: '1.4rem', fontWeight: 900, margin: '0.2rem 0' }}>
                {formatNumber(totalYieldPcs)} Pack/Pcs
              </h3>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0369a1' }}>
                Hasil Akhir Dapur &amp; Pembungkusan
              </span>
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '5px solid #10b981', borderRadius: '12px', padding: '1.15rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#dcfce7', color: '#10b981', padding: '0.65rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                Jumlah Variasi Produk
              </span>
              <h3 style={{ color: '#10b981', fontSize: '1.4rem', fontWeight: 900, margin: '0.2rem 0' }}>
                {uniqueVariantCount} Varian Item
              </h3>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#047857' }}>
                Termasuk Kode Alias &amp; Nama Lengkap
              </span>
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '5px solid #8b5cf6', borderRadius: '12px', padding: '1.15rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#f3e8ff', color: '#8b5cf6', padding: '0.65rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                Estimasi Nilai Hasil Produksi
              </span>
              <h3 style={{ color: '#8b5cf6', fontSize: '1.4rem', fontWeight: 900, margin: '0.2rem 0' }}>
                Rp {formatNumber(totalYieldValue)}
              </h3>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6d28d9' }}>
                Berdasarkan Harga Master Produk
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TOOLBAR & CONTROL BAR ===== */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box" style={{ maxWidth: '340px', margin: 0 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari kode alias (RCS, FS, BS) atau nama produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
            <Calendar size={16} style={{ color: '#0284c7' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Tanggal Position:</span>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
            />
          </div>

          {filterTanggal !== todayStr && (
            <button className="btn btn-sm btn-outline" onClick={() => setFilterTanggal(todayStr)} style={{ fontSize: '0.78rem' }}>
              Hari Ini
            </button>
          )}
          {filterTanggal && (
            <button className="btn btn-sm btn-outline" onClick={() => setFilterTanggal('')} style={{ fontSize: '0.78rem' }}>
              Semua Tanggal
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-sm btn-outline" onClick={handleExportExcel} title="Export ke Spreadsheet Excel">
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button className="btn btn-sm btn-outline" onClick={handleExportPDF} title="Cetak Jurnal Laporan PDF">
            <FileText size={15} /> PDF
          </button>
        </div>
      </div>

      {/* ===== JURNAL TABEL HASIL PRODUKSI ===== */}
      <div className="table-container" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '0.6rem', textAlign: 'center', width: '40px' }}>No</th>
              <th style={{ padding: '0.6rem' }}>Tanggal</th>
              <th style={{ padding: '0.6rem' }}>Kode Alias</th>
              <th style={{ padding: '0.6rem' }}>Nama Produk Jadi</th>
              <th style={{ padding: '0.6rem' }}>Brand</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Hasil Produksi</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>HPP / Pack</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Total HPP Modal</th>
              <th style={{ padding: '0.6rem' }}>Catatan / Shift</th>
              {canManage && <th style={{ padding: '0.6rem', textAlign: 'right' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filteredYieldList.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 10 : 9} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  <Info size={32} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>Belum ada catatan hasil produksi untuk tanggal atau pencarian ini.</p>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem' }}>Klik tombol <strong>"+ Catat Hasil Produksi"</strong> atau <strong>"Import Excel"</strong> untuk menambahkan data.</p>
                </td>
              </tr>
            ) : (
              filteredYieldList.map((item, idx) => {
                const qty = parseFloat(item.jumlahPcs) || 0;
                const hppUnit = item.hppPerPack || item.harga || 32000;
                const totalHppItem = qty * hppUnit;

                return (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '0.5rem 0.6rem', fontWeight: 700, color: '#475569', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {item.tanggal || '-'}
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', background: '#f0f9ff', color: '#0284c7', padding: '0.2rem 0.55rem', borderRadius: '5px', fontWeight: 900, border: '1px solid #bae6fd', fontSize: '0.82rem' }}>
                        {item.alias || item.kode || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                      {item.produkNama || '-'}
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', whiteSpace: 'nowrap' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                        {item.brand || 'SAREN ONE'}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 900, color: '#059669', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                      +{formatNumber(qty)} <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{item.satuan || 'pack'}</span>
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      Rp {formatNumber(hppUnit)}
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 900, color: '#8b5cf6', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                      Rp {formatNumber(totalHppItem)}
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', color: '#475569', fontSize: '0.78rem' }}>
                      {item.catatan || '-'}
                    </td>
                  {canManage && (
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-sm btn-icon btn-danger"
                        style={{ width: '26px', height: '26px', padding: 0 }}
                        onClick={() => {
                          if (onDeleteHasilProduksi) onDeleteHasilProduksi(item.id);
                        }}
                        title="Hapus Catatan Hasil Produksi"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  )}
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== MODAL FORMS ===== */}
      <ModalCatatHasilProduksi
        isOpen={isModalInputOpen}
        onClose={() => setIsModalInputOpen(false)}
        onSave={onSaveHasilProduksi}
        produkList={allProducts}
        showAlert={showAlert}
      />

      <ModalImportHasilProduksiExcel
        isOpen={isModalImportOpen}
        onClose={() => setIsModalImportOpen(false)}
        onImport={onImportHasilProduksi}
        produkList={allProducts}
        showAlert={showAlert}
      />
    </div>
  );
}
