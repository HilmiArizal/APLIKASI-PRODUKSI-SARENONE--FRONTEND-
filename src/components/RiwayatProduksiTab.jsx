import React, { useState } from 'react';
import { Search, ChefHat, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function RiwayatProduksiTab({ riwayatProduksi, onOpenPdfPreview }) {
  const [search, setSearch] = useState('');

  const filtered = riwayatProduksi.filter(h =>
    h.produkNama.toLowerCase().includes(search.toLowerCase()) ||
    h.id.toLowerCase().includes(search.toLowerCase()) ||
    h.operator.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportExcel = () => {
    const headers = ['ID Batch', 'Waktu Olah Dapur', 'Nama Produk Jadi', 'Jumlah Batch', 'Staf Operator', 'Rincian Pemotongan Bahan Baku'];
    const rows = filtered.map(h => [
      h.id,
      h.timestamp,
      h.produkNama,
      h.jumlahPcs,
      h.operator,
      (h.pemotonganBahan || []).map(b => `${b.bahanNama}: -${b.jumlah} ${b.satuan}`).join(' | ')
    ]);
    exportToExcel('Riwayat_Batch_Produksi_Dapur', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['ID Batch', 'Waktu Olah', 'Produk Olahan', 'Jumlah Batch', 'Staf Operator', 'Konsumsi Pemotongan Bahan'];
    const rows = filtered.map(h => [
      h.id,
      h.timestamp,
      h.produkNama,
      `${h.jumlahPcs} Batch`,
      h.operator,
      (h.pemotonganBahan || []).map(b => `${b.bahanNama} (-${b.jumlah} ${b.satuan})`).join(', ')
    ]);
    const config = {
      title: 'Jurnal Rekam Jejak Batch Produksi Dapur',
      subtitle: `Menampilkan ${filtered.length} riwayat hasil pemrosesan roti & konsumsi stok bahan baku.`,
      headers,
      rows,
      summaryText: `Total Batch Diproses: ${filtered.length} | Total Hasil Batch: ${filtered.reduce((acc, curr) => acc + curr.jumlahPcs, 0)} Batch`,
      filename: 'Jurnal_Batch_Produksi'
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
            placeholder="Cari riwayat (misal: BATCH-2026, Roti Keju)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <button className="btn btn-outline" onClick={handleExportExcel} title="Export Jurnal ke Excel (.csv)">
            <FileSpreadsheet size={16} style={{ color: 'var(--emerald)' }} /> Excel
          </button>
          <button className="btn btn-outline" onClick={handleExportPDF} title="Cetak Jurnal PDF">
            <FileText size={16} style={{ color: 'var(--amber)' }} /> Cetak PDF
          </button>
        </div>
      </div>

      <div className="table-container mt-4">
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID BATCH</th>
              <th>WAKTU OLAH DAPUR</th>
              <th>PRODUK OLAHAN</th>
              <th>JUMLAH BATCH</th>
              <th>STAF OPERATOR</th>
              <th>PEMOTONGAN STOK BAHAN BAKU (OTOMATIS)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Belum ada riwayat batch produksi olahan dapur.
                </td>
              </tr>
            ) : (
              filtered.map(h => (
                <tr key={h.id}>
                  <td><span className="badge badge-cyan">{h.id}</span></td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>{h.timestamp}</td>
                  <td style={{ fontWeight: 700 }}>{h.produkNama}</td>
                  <td>
                    <strong style={{ fontSize: '1rem', color: 'var(--emerald)' }}>{h.jumlahPcs} Batch</strong>
                  </td>
                  <td><span className="badge badge-amber"><ChefHat size={12} /> {h.operator}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {(h.pemotonganBahan || []).map((b, bIdx) => (
                        <span key={bIdx} style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {b.bahanNama}: <strong style={{ color: 'var(--rose)' }}>-{b.jumlah} {b.satuan}</strong>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
