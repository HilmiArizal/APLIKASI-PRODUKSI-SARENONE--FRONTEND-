import React from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function PendingApprovalView({ activeUser, onLogout, onRefreshStatus }) {
  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ maxWidth: '520px', textAlign: 'center' }}>
        <img src={logoImg} alt="SAREN ONE Logo" className="brand-logo-img" style={{ maxWidth: '180px' }} />
        
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          marginTop: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <Clock size={28} />
          </div>

          <h3 style={{ color: '#1f2d3d', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Menunggu Verifikasi Super Admin
          </h3>
          <p style={{ color: '#495057', fontSize: '0.88rem', lineHeight: '1.5' }}>
            Halo <strong>{activeUser.name}</strong> (<code>{activeUser.username || activeUser.email}</code>), pendaftaran akun Anda telah diterima!
          </p>
        </div>

        <div style={{ textAlign: 'left', background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Rincian Pengajuan Akun:</div>
          <div style={{ fontSize: '0.88rem', color: '#212529' }}>
            • Role Yang Diajukan: <strong style={{ color: 'var(--amber)' }}>{activeUser.requestedRole === 'BAHAN_BAKU' ? 'Tim Bahan Baku' : 'Tim Produk'}</strong><br/>
            • Username: <span style={{ color: '#38bdf8' }}>{activeUser.username}</span><br/>
            • Catatan: {activeUser.catatan || 'Staf Baru'}<br/>
            • Status: <span className="status-badge status-warning">PENDING ACC</span>
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          💡 Masuk menggunakan akun <strong>Super Admin</strong> (username: <code>admin</code>, pass: <code>admin</code>) di sesi lain untuk memverifikasi & menyetujui akun ini.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onLogout} style={{ flex: 1 }}>
            <LogOut size={16} /> Keluar
          </button>
          <button className="btn btn-primary" onClick={onRefreshStatus} style={{ flex: 1 }}>
            <RefreshCw size={16} /> Cek Status Verifikasi
          </button>
        </div>
      </div>
    </div>
  );
}
