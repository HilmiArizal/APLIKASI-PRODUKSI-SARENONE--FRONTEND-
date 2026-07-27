import React, { useRef } from 'react';
import { X, FileText, Download, Printer } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { exportToPDF } from '../utils/exportUtils';

export default function ModalPreviewPdf({ isOpen, onClose, previewConfig, bahanBaku = [], activeUser }) {
  const printRef = useRef();

  if (!isOpen) return null;

  const now = new Date();
  const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Default fallback if previewConfig is not provided (Bahan Baku)
  const sortedBahan = [...bahanBaku].sort((a, b) => (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true, sensitivity: 'base' }));

  const config = previewConfig || {
    title: 'Laporan Inventaris Stok Bahan Baku',
    subtitle: `Total: ${sortedBahan.length} Jenis Bahan Baku | Di-generate oleh: ${activeUser?.name || 'Staf SAREN ONE'}`,
    headers: ['Kode SKU', 'Nama Bahan Baku', 'Kategori', 'Stok Saat Ini', 'Batas Minimum', 'Status Persediaan'],
    rows: sortedBahan.map(b => [
      b.sku || '-',
      b.nama || '-',
      b.kategori || 'Umum',
      `${b.stok} ${b.satuan}`,
      `${b.minStok} ${b.satuan}`,
      b.stok <= b.minStok ? 'Menipis / Restock' : 'Stok Safe'
    ]),
    summaryText: 'Laporan resmi SAREN ONE System',
    filename: 'Laporan_Stok_Bahan_Baku'
  };

  const handleDownloadPdf = () => {
    exportToPDF(
      config.title,
      config.subtitle,
      config.headers,
      config.rows,
      config.summaryText || 'Laporan resmi SAREN ONE System',
      config.filename
    );
  };

  const handleDirectPrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
    windowPrint.document.write(`
      <html>
        <head>
          <title>${config.title} - SAREN ONE</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
            h2 { color: #ea580c; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background-color: #ea580c; color: white; padding: 8px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .header-flex { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 500);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-card" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} style={{ color: 'var(--amber)' }} /> Preview Dokumentasi PDF Sebelum Download
          </h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Modal Body - Printable Document Preview */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem', background: '#0f172a' }}>
          <div 
            ref={printRef}
            style={{ 
              background: '#ffffff', 
              color: '#1e293b', 
              padding: '2.5rem 2rem', 
              borderRadius: '12px', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              fontFamily: 'Helvetica, Arial, sans-serif'
            }}
          >
            {/* Document Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #ea580c', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <img src={logoImg} alt="SAREN ONE" style={{ height: '45px', marginBottom: '0.5rem' }} />
                <h2 style={{ margin: 0, color: '#ea580c', fontSize: '1.4rem', fontWeight: 800 }}>SAREN ONE SYSTEM</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Sistem Laporan Inventaris Dapur & Stok Roti</p>
              </div>

              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>DOKUMEN RESMI SISTEM</div>
                <div>Tanggal Cetak: {dateStr}</div>
                <div>Dicetak Oleh: <strong>{activeUser?.name || 'Super Admin'}</strong></div>
              </div>
            </div>

            {/* Document Sub-Header & Metadata Grid */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>JUDUL LAPORAN</span>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{config.title}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>RINGKASAN DATA</span>
                <strong style={{ fontSize: '0.9rem', color: '#ea580c' }}>{config.subtitle}</strong>
              </div>
            </div>

            {/* Preview Data Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#ea580c', color: '#ffffff' }}>
                  {config.headers.map((h, i) => (
                    <th key={i} style={{ padding: '8px 10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {config.rows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: '8px 10px', fontWeight: cIdx === 0 ? 'bold' : 'normal', color: cIdx === 0 ? '#ea580c' : '#1e293b' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Document Footer Note */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
              <div>* Catatan: {config.summaryText || 'Data diurutkan otomatis berdasarkan Kode SKU terkecil.'}</div>
              <div>Halaman 1 dari 1</div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer" style={{ gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal / Tutup
          </button>
          
          <button type="button" className="btn btn-outline" onClick={handleDirectPrint}>
            <Printer size={16} /> Cetak Langsung (Printer)
          </button>
          
          <button type="button" className="btn btn-emerald" onClick={handleDownloadPdf}>
            <Download size={16} /> Download File PDF
          </button>
        </div>

      </div>
    </div>
  );
}
