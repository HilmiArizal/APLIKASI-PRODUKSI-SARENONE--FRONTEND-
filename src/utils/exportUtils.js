import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Export to CSV / Excel File
export function exportToExcel(filename, headers, rows) {
  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
  
  // Add Header
  csvContent += headers.map(h => `"${h}"`).join(',') + '\r\n';
  
  // Add Rows
  rows.forEach(row => {
    const formattedRow = row.map(val => {
      const cleanVal = (val === null || val === undefined) ? '' : String(val).replace(/"/g, '""');
      return `"${cleanVal}"`;
    }).join(',');
    csvContent += formattedRow + '\r\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  link.setAttribute('download', `${filename}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to PDF Document
export function exportToPDF(title, subtitle, headers, rows, footerNote = '') {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Title Branding
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(249, 115, 22); // Orange Accent
  doc.text('SAREN ONE', 14, 15);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(title, 14, 22);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 27);
  }

  const now = new Date();
  const timestamp = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  doc.setFontSize(8);
  doc.text(`Tanggal Cetak: ${timestamp}`, 196, 15, { align: 'right' });

  // Add Line Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 30, 196, 30);

  // AutoTable
  autoTable(doc, {
    startY: 34,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  // Footer Note
  if (footerNote) {
    const finalY = doc.lastAutoTable.finalY || 40;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(footerNote, 14, finalY + 8);
  }

  const cleanFilename = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`${cleanFilename}_${now.getTime()}.pdf`);
}
