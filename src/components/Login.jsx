import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import { Eye, EyeOff, ShieldCheck, UserCheck, KeyRound, User, Mail, Lock, Sparkles, LogIn, UserPlus } from 'lucide-react';
import PasswordStrengthChecker from './PasswordStrengthChecker';

export default function Login({ onLogin, onRegister, showAlert }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Helper alert safe trigger
  const notify = (msg, type = 'error', title = 'Peringatan!') => {
    if (showAlert) {
      showAlert(msg, type, title);
    } else {
      alert(msg);
    }
  };

  // Password visibility states
  const [showPass, setShowPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);

  // Login Form States
  const [loginInput, setLoginInput] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [regRole, setRegRole] = useState('BAHAN_BAKU');
  const [regCatatan, setRegCatatan] = useState('');

  // Quick Demo Credentials Handler
  const handleQuickFill = (userType) => {
    setIsRegisterMode(false);
    if (userType === 'admin') {
      setLoginInput('admin');
      setLoginPass('admin');
    } else if (userType === 'bahan') {
      setLoginInput('hilmi');
      setLoginPass('Hilmi@123');
    } else if (userType === 'admin_produk') {
      setLoginInput('admin_produk');
      setLoginPass('Adminproduk@123');
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

    // Password Security Checks
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
    if (!/[@$!%*?&#^_-]/.test(regPass)) {
      notify('🔒 Syarat Keamanan: Kata sandi wajib mengandung minimal 1 Simbol Spesial (contoh: @, #, $, %, !, &)!', 'error', 'Syarat Keamanan Password');
      return;
    }

    if (regPass !== regConfirmPass) {
      notify('Ulangi kata sandi (Konfirmasi Password) tidak cocok dengan Kata Sandi!', 'error', 'Password Tidak Cocok');
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
    <div className="login-wrapper">
      <div className="login-card" style={{ maxWidth: '520px', padding: isRegisterMode ? '1.75rem 2rem' : '2.25rem' }}>
        
        {/* Brand Header */}
        <div className="login-header" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
          <img src={logoImg} alt="SAREN ONE Logo" style={{ height: isRegisterMode ? '48px' : '65px', marginBottom: '0.4rem' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>SAREN ONE SYSTEM</h2>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            {isRegisterMode ? 'Pendaftaran Akun Pengguna Staf Baru' : 'Sistem Manajerial Persediaan Bahan Baku'}
          </p>
        </div>

        {/* Tab Toggle Switch (Masuk vs Daftar) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '14px',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => setIsRegisterMode(false)}
            style={{
              padding: '0.6rem 0.5rem',
              borderRadius: '10px',
              border: 'none',
              background: !isRegisterMode ? 'var(--primary)' : 'transparent',
              color: !isRegisterMode ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.25s ease'
            }}
          >
            <LogIn size={15} /> Masuk Akun
          </button>

          <button
            type="button"
            onClick={() => setIsRegisterMode(true)}
            style={{
              padding: '0.6rem 0.5rem',
              borderRadius: '10px',
              border: 'none',
              background: isRegisterMode ? 'var(--emerald)' : 'transparent',
              color: isRegisterMode ? '#022c22' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.25s ease'
            }}
          >
            <UserPlus size={15} /> Daftar Akun Baru
          </button>
        </div>

        {!isRegisterMode ? (
          /* FORM LOGIN */
          <form onSubmit={handleLoginSubmit}>
            {/* Demo Quick Fill Pills */}

            <div className="form-group">
              <label><User size={15} style={{ color: 'var(--primary)' }} /> Username atau Email *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Masukkan username atau email..."
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label><Lock size={15} style={{ color: 'var(--primary)' }} /> Kata Sandi *</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-control"
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                Ingat Saya di Perangkat Ini
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={isLoading}>
              {isLoading ? 'Sedang Memproses...' : 'Masuk Aplikasi SAREN ONE'}
            </button>
          </form>
        ) : (
          /* FORM REGISTER */
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.78rem' }}><User size={13} style={{ color: 'var(--emerald)' }} /> Nama Lengkap Staf *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nama lengkap Anda..."
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.78rem' }}><UserCheck size={13} style={{ color: 'var(--emerald)' }} /> Username *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Username unik..."
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.replace(/\s+/g, ''))}
                  required
                  style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.78rem' }}><Mail size={13} style={{ color: 'var(--emerald)' }} /> Email Aktif *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="email@domain.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                <label style={{ fontSize: '0.78rem' }}><Lock size={13} style={{ color: 'var(--emerald)' }} /> Kata Sandi *</label>
                <input
                  type={showRegPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Password..."
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  required
                  style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPass(!showRegPass)}
                  style={{ position: 'absolute', right: '10px', top: '32px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showRegPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                <label style={{ fontSize: '0.78rem' }}><KeyRound size={13} style={{ color: 'var(--emerald)' }} /> Ulangi Password *</label>
                <input
                  type={showRegConfirmPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Konfirmasi..."
                  value={regConfirmPass}
                  onChange={(e) => setRegConfirmPass(e.target.value)}
                  required
                  style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
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

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.78rem' }}><ShieldCheck size={13} style={{ color: 'var(--emerald)' }} /> Pilihan Divisi / Role Pengajuan *</label>
              <select
                className="form-control"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
              >
                <option value="TIM_PENJUALAN">🛍️ Tim Penjualan (Domain Produk)</option>
                <option value="TIM_MARKETING">📣 Tim Marketing (Domain Produk)</option>
                <option value="SALES">📱 Tim Sales / SPG (Khusus Mobile App PresensiKu)</option>
                <option value="BAHAN_BAKU">🏭 Tim Produksi (Domain Bahan Baku)</option>
                <option value="PEMBELIAN">🛒 Tim Pembelian (Domain Bahan Baku)</option>
              </select>
            </div>


            {/* Real-time Password Security Meter */}
            <PasswordStrengthChecker password={regPass} />

            <button type="submit" className="btn btn-emerald btn-block btn-lg" style={{ marginTop: '1rem' }} disabled={isLoading}>
              {isLoading ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Pendaftaran Staf'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
