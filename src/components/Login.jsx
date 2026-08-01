import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import { Eye, EyeOff, ShieldCheck, UserCheck, KeyRound, User, Mail, Lock, Sparkles, LogIn, UserPlus } from 'lucide-react';
import PasswordStrengthChecker from './PasswordStrengthChecker';

export default function Login({ onLogin, onRegister, showAlert }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const notify = (msg, type = 'error', title = 'Peringatan!') => {
    if (showAlert) showAlert(msg, type, title);
    else alert(msg);
  };

  const [showPass, setShowPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);

  const [loginInput, setLoginInput] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [regRole, setRegRole] = useState('BAHAN_BAKU');
  const [regCatatan, setRegCatatan] = useState('');

  const handleQuickFill = (userType) => {
    setIsRegisterMode(false);
    if (userType === 'admin') {
      setLoginInput('admin');
      setLoginPass('admin');
    } else if (userType === 'admin_produk') {
      setLoginInput('admin_produk');
      setLoginPass('Adminproduk@123');
    } else if (userType === 'bahan') {
      setLoginInput('hilmi');
      setLoginPass('Hilmi@123');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginInput || !loginPass) {
      notify('Mohon isi Username / Email dan Password!', 'warning', 'Form Belum Lengkap');
      return;
    }
    setIsLoading(true);
    try {
      await onLogin(loginInput, loginPass);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regUsername || !regEmail || !regPass) {
      notify('Mohon lengkapi semua bidang bertanda bintang (*)!', 'warning', 'Form Belum Lengkap');
      return;
    }

    if (regPass.length < 8) {
      notify('🔒 Syarat Keamanan: Kata sandi minimal harus 8 karakter!', 'error', 'Syarat Keamanan Password');
      return;
    }
    if (!/[A-Z]/.test(regPass)) {
      notify('🔒 Syarat Keamanan: Kata sandi wajib mengandung minimal 1 Huruf Besar (A-Z)!', 'error', 'Syarat Keamanan Password');
      return;
    }
    if (!/[a-z]/.test(regPass)) {
      notify('🔒 Syarat Keamanan: Kata sandi wajib mengandung minimal 1 Huruf Kecil (a-z)!', 'error', 'Syarat Keamanan Password');
      return;
    }
    if (!/\d/.test(regPass)) {
      notify('🔒 Syarat Keamanan: Kata sandi wajib mengandung minimal 1 Angka (0-9)!', 'error', 'Syarat Keamanan Password');
      return;
    }

    if (regPass !== regConfirmPass) {
      notify('Konfirmasi password tidak cocok dengan Kata Sandi!', 'error', 'Password Tidak Cocok');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onRegister({
        name: regName,
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim().toLowerCase(),
        pass: regPass,
        requestedRole: regRole,
        catatan: regCatatan
      });

      if (res?.success) {
        setRegName('');
        setRegUsername('');
        setRegEmail('');
        setRegPass('');
        setRegConfirmPass('');
        setIsRegisterMode(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top right, #1e1b4b 0%, #0f172a 60%, #020617 100%)', padding: '1.5rem' }}>
      <div className="login-card" style={{ maxWidth: '500px', width: '100%', padding: isRegisterMode ? '2rem' : '2.5rem', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* BRAND LOGO HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src={logoImg} alt="SAREN ONE Logo" style={{ height: isRegisterMode ? '52px' : '70px', marginBottom: '0.6rem', filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3))' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 0.2rem' }}>SAREN ONE SYSTEM</h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0 }}>
            {isRegisterMode ? 'Pendaftaran Akun Pengguna Staf Baru' : 'Sistem Integrasi Produksi, Bahan Baku, & Penjualan'}
          </p>
        </div>

        {/* TOGGLE MASUK vs DAFTAR */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255, 255, 255, 0.05)', padding: '5px', borderRadius: '14px', marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            type="button"
            onClick={() => setIsRegisterMode(false)}
            style={{
              padding: '0.65rem',
              borderRadius: '10px',
              border: 'none',
              background: !isRegisterMode ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: !isRegisterMode ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.25s ease'
            }}
          >
            <LogIn size={16} /> Masuk Akun
          </button>

          <button
            type="button"
            onClick={() => setIsRegisterMode(true)}
            style={{
              padding: '0.65rem',
              borderRadius: '10px',
              border: 'none',
              background: isRegisterMode ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: isRegisterMode ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.25s ease'
            }}
          >
            <UserPlus size={16} /> Daftar Akun Baru
          </button>
        </div>

        {!isRegisterMode ? (
          /* FORM LOGIN */
          <form onSubmit={handleLoginSubmit}>
            {/* Quick Fill Pills */}
            <div style={{ marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.8rem', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} style={{ color: '#f59e0b' }} /> Akun Demo Cepat:
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => handleQuickFill('admin_produk')} className="btn btn-sm btn-outline" style={{ fontSize: '0.73rem', padding: '0.25rem 0.6rem', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' }}>
                  👑 Super Admin Produk
                </button>
                <button type="button" onClick={() => handleQuickFill('admin')} className="btn btn-sm btn-outline" style={{ fontSize: '0.73rem', padding: '0.25rem 0.6rem', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' }}>
                  🏭 Admin Bahan Baku
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                <User size={14} style={{ color: 'var(--accent-primary)' }} /> Username atau Email *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Masukkan username atau email..."
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group" style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                <Lock size={14} style={{ color: 'var(--accent-primary)' }} /> Kata Sandi *
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Masukkan kata sandi..."
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.82rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)', width: '15px', height: '15px' }}
                />
                Ingat Saya di Perangkat Ini
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.98rem', fontWeight: 700, borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }} disabled={isLoading}>
              {isLoading ? 'Sedang Memproses...' : 'Masuk Aplikasi SAREN ONE'}
            </button>
          </form>
        ) : (
          /* FORM REGISTER */
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}><User size={13} style={{ color: '#10b981' }} /> Nama Lengkap Staf *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nama lengkap Anda..."
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>

            <div className="form-grid" style={{ marginBottom: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}><UserCheck size={13} style={{ color: '#10b981' }} /> Username *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Username..."
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.replace(/\s+/g, ''))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}><Mail size={13} style={{ color: '#10b981' }} /> Email Aktif *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="email@domain.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: '0.85rem' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}><Lock size={13} style={{ color: '#10b981' }} /> Kata Sandi *</label>
                <input
                  type={showRegPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Password..."
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPass(!showRegPass)}
                  style={{ position: 'absolute', right: '10px', top: '32px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showRegPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}><KeyRound size={13} style={{ color: '#10b981' }} /> Ulangi Password *</label>
                <input
                  type={showRegConfirmPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Konfirmasi..."
                  value={regConfirmPass}
                  onChange={(e) => setRegConfirmPass(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                  style={{ position: 'absolute', right: '10px', top: '32px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showRegConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}><ShieldCheck size={13} style={{ color: '#10b981' }} /> Divisi / Role Pengajuan *</label>
              <select
                className="form-select"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
              >
                <option value="TIM_PENJUALAN">🛍️ Tim Penjualan (Domain Produk)</option>
                <option value="TIM_MARKETING">📣 Tim Marketing (Domain Produk)</option>
                <option value="BAHAN_BAKU">🏭 Tim Produksi (Domain Bahan Baku)</option>
                <option value="PEMBELIAN">🛒 Tim Pembelian (Domain Bahan Baku)</option>
              </select>
            </div>

            <PasswordStrengthChecker password={regPass} />

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }} disabled={isLoading}>
              {isLoading ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Pendaftaran Staf'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
