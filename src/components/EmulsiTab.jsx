import React, { useState } from 'react';
import { FlaskConical, Play, Layers, Droplet, CheckCircle, ArrowDownLeft, ShieldAlert } from 'lucide-react';
import { formatNumber } from '../data/initialData';
import { ModalPengolahanEmulsi } from './Modals';

export default function EmulsiTab({
  bahanBaku = [],
  activeRoleView,
  onProcessEmulsi,
  showAlert
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find Emulsi ISP & Emulsi TVP stock
  const emulsiIspItem = bahanBaku.find(b => b.sku === 'EML-ISP' || b.nama.toLowerCase().includes('emulsi isp'));
  const emulsiTvpItem = bahanBaku.find(b => b.sku === 'EML-TVP' || b.nama.toLowerCase().includes('emulsi tvp'));

  // Find Raw materials
  const ispPowderItem = bahanBaku.find(b => b.nama.toLowerCase().includes('isp'));
  const tvpGranulesItem = bahanBaku.find(b => b.nama.toLowerCase().includes('tvp'));
  const waterItem = bahanBaku.find(b => b.nama.toLowerCase().includes('air') || b.nama.toLowerCase().includes('es'));
  const oilItem = bahanBaku.find(b => b.nama.toLowerCase().includes('minyak') || b.nama.toLowerCase().includes('lemak'));

  const isCanProcess = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');

  return (
    <div className="tab-pane active">
      <div className="toolbar" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FlaskConical size={22} style={{ color: 'var(--emerald)' }} /> Pengolahan & Stok Emulsi (ISP & TVP)
          </h2>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Modul pengolahan formula emulsi pengikat daging sosis (ISP & TVP). Pemotongan bahan mentah & penambahan stok emulsi otomatis.
          </p>
        </div>

        {isCanProcess && (
          <button className="btn btn-emerald" onClick={() => setIsModalOpen(true)}>
            <Play size={16} /> Proses Emulsi Baru
          </button>
        )}
      </div>

      {/* Overview Stock Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
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

          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--emerald)' }}>
              {formatNumber(emulsiIspItem ? emulsiIspItem.stok : 0)}
            </span>
            <span className="text-muted" style={{ fontSize: '1rem', fontWeight: 600 }}>kg</span>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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

          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--cyan)' }}>
              {formatNumber(emulsiTvpItem ? emulsiTvpItem.stok : 0)}
            </span>
            <span className="text-muted" style={{ fontSize: '1rem', fontWeight: 600 }}>kg</span>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            ✓ Hidrasi tekstur protein nabati pengganti serat daging.
          </div>
        </div>
      </div>

      {/* Stock Status Raw Materials Needed */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} style={{ color: 'var(--emerald)' }} /> Ketersediaan Stok Bahan Baku Mentah Emulsi
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>ISP Powder (Primary)</span>
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
