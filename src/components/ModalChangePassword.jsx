import React, { useState } from 'react';
import { X, KeyRound, Save, Eye, EyeOff } from 'lucide-react';
import PasswordStrengthChecker from './PasswordStrengthChecker';

export default function ModalChangePassword({ isOpen, onClose, onChangePassword, activeUser }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      alert('Mohon isi kata sandi lama dan kata sandi baru!');
      return;
    }

    if (newPassword.length < 8) {
      alert('🔒 Syarat Keamanan: Kata sandi baru minimal harus 8 karakter!');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      alert('🔒 Syarat Keamanan: Kata sandi baru wajib mengandung minimal 1 Huruf Besar (A-Z)!');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      alert('🔒 Syarat Keamanan: Kata sandi baru wajib mengandung minimal 1 Huruf Kecil (a-z)!');
      return;
    }
    if (!/\d/.test(newPassword)) {
      alert('🔒 Syarat Keamanan: Kata sandi baru wajib mengandung minimal 1 Angka (0-9)!');
      return;
    }
    if (!/[@$!%*?&#^_-]/.test(newPassword)) {
      alert('🔒 Syarat Keamanan: Kata sandi baru wajib mengandung minimal 1 Simbol Spesial (contoh: @, #, $, %, !, &)!');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Ulangi kata sandi baru tidak cocok dengan kata sandi baru!');
      return;
    }

    onChangePassword(oldPassword, newPassword);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3><KeyRound size={18} style={{ color: 'var(--amber)' }} /> Ubah Kata Sandi Akun</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Akun Terhubung:</span>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{activeUser?.name} (@{activeUser?.username})</div>
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label>Kata Sandi Lama *</label>
              <input
                type={showOld ? 'text' : 'password'}
                className="form-control"
                placeholder="Masukkan kata sandi lama..."
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label>Kata Sandi Baru *</label>
              <input
                type={showNew ? 'text' : 'password'}
                className="form-control"
                placeholder="Minimal 5 karakter..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="form-group">
              <label>Ulangi Kata Sandi Baru *</label>
              <input
                type="password"
                className="form-control"
                placeholder="Konfirmasi password baru..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <PasswordStrengthChecker password={newPassword} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-amber"><Save size={16} /> Simpan Kata Sandi Baru</button>
          </div>
        </form>
      </div>
    </div>
  );
}
