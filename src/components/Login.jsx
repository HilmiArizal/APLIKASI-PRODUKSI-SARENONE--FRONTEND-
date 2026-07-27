import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import { Eye, EyeOff } from 'lucide-react';

export default function Login({ onLogin, onRegister }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
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
  const [regRole, setRegRole] = useState('PRODUK');
  const [regCatatan, setRegCatatan] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginInput || !loginPass) {
      alert('Mohon isi Username / Email dan Password!');
      return;
    }
    onLogin(loginInput, loginPass);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regName || !regUsername || !regEmail || !regPass) {
      alert('Mohon lengkapi semua bidang bertanda bintang (*)!');
      return;
    }

    if (regPass !== regConfirmPass) {
      alert('Ulangi kata sandi (Konfirmasi Password) tidak cocok dengan Kata Sandi!');
      return;
    }

    onRegister({
      name: regName,
      username: regUsername,
      email: regEmail,
      pass: regPass,
      requestedRole: regRole,
      catatan: regCatatan
    });

    setRegPass('');
    setRegConfirmPass('');
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '500px', padding: isRegisterMode ? '1.5rem 2rem' : '2.25rem' }}>
        <div className="login-header" style={{ marginBottom: isRegisterMode ? '1rem' : '1.75rem' }}>
          <img src={logoImg} alt="SAREN ONE Logo" style={{ height: isRegisterMode ? '48px' : '65px', marginBottom: '0.4rem' }} />
          <h2 style={{ fontSize: '1.25rem' }}>SAREN ONE SYSTEM</h2>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            {isRegisterMode ? 'Formulir Pendaftaran Akun Staf Baru' : 'Sistem Inventaris Dapur & Produksi Roti'}
          </p>
        </div>

        {!isRegisterMode ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Username / Email Akun *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Masukkan username atau email..."
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label>Kata Sandi *</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="Masukkan kata sandi..."
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-3">
              Masuk Aplikasi
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Belum memiliki akun?{' '}
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer' }}
              >
                Daftar Akun Baru
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem' }}>Nama Lengkap *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nama lengkap Anda..."
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem' }}>Username *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Username..."
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem' }}>Email *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email aktif..."
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem' }}>Kata Sandi *</label>
                <input
                  type={showRegPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Kata sandi..."
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  required
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPass(!showRegPass)}
                  style={{ position: 'absolute', right: '10px', top: '30px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showRegPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem' }}>Ulangi Kata Sandi *</label>
                <input
                  type={showRegConfirmPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Konfirmasi password..."
                  value={regConfirmPass}
                  onChange={(e) => setRegConfirmPass(e.target.value)}
                  required
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                  style={{ position: 'absolute', right: '10px', top: '30px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showRegConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem' }}>Pengajuan Role / Peran *</label>
              <select
                className="select-input"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
              >
                <option value="PRODUK">Tim Produk & Pemrosesan Roti</option>
                <option value="BAHAN_BAKU">Tim Gudang Bahan Baku</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem' }}>Catatan Tugas / Alasan Pendaftaran</label>
              <input
                type="text"
                className="form-control"
                placeholder="Misal: Staf Shift Pagi Dapur Roti"
                value={regCatatan}
                onChange={(e) => setRegCatatan(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
              />
            </div>

            <button type="submit" className="btn btn-emerald btn-block" style={{ padding: '0.55rem' }}>
              Kirim Pengajuan Pendaftaran
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer' }}
              >
                Kembali ke Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
