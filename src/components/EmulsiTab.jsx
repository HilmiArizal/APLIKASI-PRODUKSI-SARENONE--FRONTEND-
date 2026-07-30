import React, { useState } from 'react';
import { FlaskConical, Play, Layers, Droplet, CheckCircle, ArrowDownLeft, ShieldAlert, History, Clock, Calendar } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalPengolahanEmulsi } from './Modals';

export default function EmulsiTab({
  bahanBaku = [],
  auditLog = [],
  activeRoleView,
  onProcessEmulsi,
  showAlert
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Today Date string in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateFilter, setSelectedDateFilter] = useState(todayStr);
  const [jenisFilter, setJenisFilter] = useState('semua');

  // Find Emulsi ISP & Emulsi TVP stock
  const emulsiIspItem = bahanBaku.find(b => b.sku === 'EML-ISP' || b.nama.toLowerCase().includes('emulsi isp'));
  const emulsiTvpItem = bahanBaku.find(b => b.sku === 'EML-TVP' || b.nama.toLowerCase().includes('emulsi tvp'));

  // Find Raw materials (strictly excluding Emulsi items!)
  const ispPowderItem = bahanBaku.find(b => {
    const name = (b.nama || '').toLowerCase();
    const sku = (b.sku || '').toLowerCase();
    return !name.includes('emulsi') && (name.includes('marksoy') || name.includes('isp') || sku.includes('marksoy') || sku.includes('isp'));
  });
  const tvpGranulesItem = bahanBaku.find(b => {
    const name = (b.nama || '').toLowerCase();
    const sku = (b.sku || '').toLowerCase();
    return !name.includes('emulsi') && (name.includes('tvp') || sku.includes('tvp'));
  });
  const waterItem = bahanBaku.find(b => {
    const name = (b.nama || '').toLowerCase();
    const sku = (b.sku || '').toLowerCase();
    return !name.includes('emulsi') && (name.includes('air') || name.includes('es') || sku.includes('air'));
  });
  const oilItem = bahanBaku.find(b => {
    const name = (b.nama || '').toLowerCase();
    const sku = (b.sku || '').toLowerCase();
    return !name.includes('emulsi') && (name.includes('minyak') || name.includes('lemak') || sku.includes('minyak'));
  });

  const isCanProcess = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  // Filter emulsion processing logs from auditLog
  const emulsiLogs = auditLog.filter(log => {
    const aksi = (log.aksi || '').toLowerCase();
    const detail = (log.detail || '').toLowerCase();
    return aksi.includes('emulsi') || detail.includes('emulsi');
  });

  const filteredHistory = emulsiLogs.filter(log => {
    const detail = (log.detail || '').toLowerCase();
    const matchDate = !selectedDateFilter || (log.timestamp || '').startsWith(selectedDateFilter);
    const matchJenis = jenisFilter === 'semua' || (jenisFilter === 'isp' ? detail.includes('isp') : detail.includes('tvp'));
    return matchDate && matchJenis;
  });

  return (
    <div className="tab-pane active">
      <div className="toolbar" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FlaskConical size={22} style={{ color: 'var(--emerald)' }} /> Pengolahan &amp; Stok Emulsi (ISP &amp; TVP)
          </h2>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Modul pengolahan formula emulsi pengikat daging sosis (ISP &amp; TVP). Pemotongan bahan mentah &amp; penambahan stok emulsi otomatis.
          </p>
        </div>

        {isCanProcess && (
          <button className="btn btn-emerald" onClick={() => setIsModalOpen(true)}>
            <Play size={16} /> Proses Emulsi Baru
          </button>
        )}
      </div>

      {/* Overview Stock Cards */}
      <div className="emulsi-cards-grid">
        {/* ISP Emulsion Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="badge badge-emerald">EMULSI ISP</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem' }}>Stok Emulsi ISP (Isolated Soy Protein)</h3>
              <p className="text-muted" style={{ fontSize: '0.78rem' }}>1 Batch = 2kg Marksoy + 4kg Air Es + 4 Pouch Minyak 2L ⇒ Yield 20 kg</p>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '50%', color: 'var(--emerald)' }}>
              <Layers size={24} />
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--emerald)' }}>
              {emulsiIspItem ? formatNumber(emulsiIspItem.stok) : '0'}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ✓ Siap digunakan sebagai campuran adonan sosis.
          </div>
        </div>

        {/* TVP Emulsion Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="badge badge-cyan">EMULSI TVP</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem' }}>Stok Emulsi TVP (Textured Vegetable Protein)</h3>
              <p className="text-muted" style={{ fontSize: '0.78rem' }}>1 Batch = 1kg TVP + 3kg Air Es ⇒ Yield 3.5 kg (Tanpa Minyak)</p>
            </div>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.75rem', borderRadius: '50%', color: 'var(--cyan)' }}>
              <Droplet size={24} />
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--cyan)' }}>
              {emulsiTvpItem ? formatNumber(emulsiTvpItem.stok) : '0'}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ✓ Hidrasi tekstur protein nabati pengganti serat daging.
          </div>
        </div>
      </div>

      {/* Raw Material Inventory Status for Emulsion */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} style={{ color: 'var(--emerald)' }} /> Ketersediaan Stok Bahan Baku Mentah Emulsi
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Marksoy (ISP)</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {ispPowderItem ? `${formatNumber(ispPowderItem.stok)} ${ispPowderItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>TVP Granules (Primary)</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {tvpGranulesItem ? `${formatNumber(tvpGranulesItem.stok)} ${tvpGranulesItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Air Es / Es Batu</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {waterItem ? `${formatNumber(waterItem.stok)} ${waterItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Minyak / Fat</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {oilItem ? `${formatNumber(oilItem.stok)} ${oilItem.satuan}` : 'Belum Terdaftar'}
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat Pengolahan Emulsi Per Tanggal */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} style={{ color: 'var(--emerald)' }} /> Riwayat &amp; Log Pengolahan Emulsi (ISP &amp; TVP) Per Tanggal
            </h3>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
              Menampilkan {filteredHistory.length} transaksi pengolahan batch emulsi.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="select-input"
              style={{ width: '140px', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
            >
              <option value="semua">Semua Emulsi</option>
              <option value="isp">Emulsi ISP</option>
              <option value="tvp">Emulsi TVP</option>
            </select>

            <input
              type="date"
              className="form-control"
              style={{ width: '160px', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
            />
            <button
              className={`btn btn-sm ${selectedDateFilter === todayStr ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setSelectedDateFilter(todayStr)}
            >
              Hari Ini
            </button>
            <button
              className={`btn btn-sm ${!selectedDateFilter ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setSelectedDateFilter('')}
            >
              Semua Tanggal
            </button>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>WAKTU / TANGGAL</th>
              <th>JENIS EMULSI</th>
              <th>RINCIAN PENGOLAHAN BATCH &amp; PEMOTONGAN BAHAN</th>
              <th>OPERATOR</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  {selectedDateFilter ? `Tidak ada riwayat pengolahan emulsi pada tanggal ${selectedDateFilter}.` : 'Belum ada riwayat pengolahan emulsi.'}
                </td>
              </tr>
            ) : (
              filteredHistory.map(log => {
                const isToday = (log.timestamp || '').startsWith(todayStr);
                const isISP = (log.detail || '').toLowerCase().includes('isp');

                return (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>
                      <Clock size={13} style={{ marginRight: '0.35rem' }} />
                      {log.timestamp}
                    </td>
                    <td>
                      <span className={`badge ${isISP ? 'badge-emerald' : 'badge-cyan'}`}>
                        {isISP ? 'EMULSI ISP' : 'EMULSI TVP'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.detail}</td>
                    <td>
                      <strong>{log.user}</strong> <span className="text-muted">({log.role})</span>
                    </td>
                    <td>
                      {isToday ? (
                        <span className="badge badge-emerald" style={{ fontWeight: 700 }}>✓ HARI INI</span>
                      ) : (
                        <span className="badge badge-outline">Lampau</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ModalPengolahanEmulsi
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProcess={onProcessEmulsi}
        bahanList={bahanBaku}
        showAlert={showAlert}
      />
    </div>
  );
}
