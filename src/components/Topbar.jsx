import React, { useState, useEffect, useRef } from 'react';
import { Eye, Menu, KeyRound, LogOut, User, ChevronDown, ShieldCheck, Check } from 'lucide-react';

export default function Topbar({
  activeUser,
  activeRoleView,
  onChangeRoleView,
  activeTab,
  onOpenMobileSidebar,
  onOpenChangePassword,
  onLogout
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const titles = {
    'dashboard': { title: 'Dashboard Ringkasan', sub: 'Pantau kesehatan persediaan dan statistik produksi secara real-time.' },
    'dashboard-produk': { title: 'Dashboard Produk & Penjualan', sub: 'Ringkasan performa omzet, transaksi penjualan, dan program marketing.' },
    'katalog-produk': { title: 'Katalog Produk', sub: 'Daftar produk jadi, varian, dan stok yang tersedia untuk dijual.' },
    'stok-produk': { title: 'Stok & Persediaan Produk Jual', sub: 'Pantau stok ready, mutasi persediaan, dan penyesuaian stok produk siap jual.' },
    'kategori-produk-sales': { title: 'Kelola Brand Produk', sub: 'Master data brand & merk resmi Saren One (SAREN ONE, EAT GOW, BEULEUM).' },
    'penjualan': { title: 'Data Penjualan Produk', sub: 'Catat transaksi penjualan, pantau invoice, dan kelola histori pelanggan.' },
    'retur-produk': { title: 'Retur Produk Penjualan', sub: 'Pencatatan barang retur dari pelanggan, klaim produk rusak/expired, & penyesuaian stok.' },
    'pelanggan': { title: 'Kelola Pelanggan / Customer', sub: 'Master data pelanggan, kontak WhatsApp, alamat pengiriman, dan tipe kemitraan.' },
    'piutang-pelanggan': { title: 'Piutang & Tagihan Pelanggan', sub: 'Pantau sisa piutang tempo, histori tagihan per customer, & catat pelunasan pembayaran.' },
    'pembayaran-masuk': { title: 'Pembayaran Masuk Customer', sub: 'Catat setoran tunai, transfer bank, & pelunasan piutang tempo dari pelanggan.' },
    'marketing': { title: 'Program Marketing & Campaign', sub: 'Kelola program promo, diskon, anggaran marketing, dan saluran penjualan.' },
    'user-approval-produk': { title: 'Verifikasi User & Staf Produk', sub: 'Persetujuan pendaftaran & manajemen hak akses Tim Penjualan & Tim Marketing.' },
    'audit-log-produk': { title: 'Jurnal Aktivitas Produk', sub: 'Riwayat pencatatan aktivitas penjualan, promo, dan manajemen staf.' },
    'bahan-baku': { title: 'Manajemen Stok Bahan Baku', sub: 'Kelola inventaris bahan mentah, pemasokan supplier, dan peringatan stok.' },
    'produk': { title: 'Katalog & Pemrosesan Produksi', sub: 'Kelola stok produk jadi dan jalankan batch produksi otomatis.' },
    'resep': { title: 'Manajemen Resep & BOM', sub: 'Konfigurasi formula kebutuhan bahan baku untuk setiap produk.' },
    'riwayat-produksi': { title: 'Riwayat Batch Produksi', sub: 'Jurnal rekam jejak hasil olahan dapur & detail konsumsi pemotongan bahan baku.' },
    'kategori': { title: 'Manajemen Brand & Kategori Produk', sub: 'Kelola pengelompokan brand merk produk jadi dan kategori stok bahan baku dapur.' },
    'user-approval': { title: 'Verifikasi User & Akses Peran', sub: 'Modul persetujuan pendaftaran & manajemen hak akses peran pengguna.' },
    'audit-log': { title: 'Jurnal Transaksi & Audit Log', sub: 'Riwayat pencatatan lengkap aktivitas pergerakan stok.' },
    'utang-supplier': { title: 'Utang Supplier', sub: 'Pantau saldo utang, bayar cicilan, dan lihat riwayat pembayaran faktur supplier.' },
    'pembelian-bahan': { title: 'Pembelian Bahan Baku', sub: 'Catat transaksi pembelian bahan baku dari supplier & buat faktur pembelian baru.' },
    'penerimaan-bahan': { title: 'Penerimaan Bahan Baku & Verifikasi Fisik', sub: 'Konfirmasi kedatangan fisik barang baku supplier & update stok secara otomatis.' },
    'supplier': { title: 'Master Data Supplier & Vendor', sub: 'Kelola daftar perusahaan pemasok bahan baku, kemasan, dan bumbu (Khusus Super Admin).' },
    'emulsi': { title: 'Pengolahan Emulsi', sub: 'Proses pembuatan emulsi dari bahan baku yang tersedia' },
    'pemakaian-kemasan': { title: 'Pemakaian Kemasan', sub: 'Pemakaian kemasan berdasarkan hasil produksi sesuai ukuran kemasan' },
    'hpp': { title: 'HPP & Kalkulator Konversi Kemasan', sub: 'Perhitungan HPP harian, konversi gramasi kemasan, dan laporan persentase margin error.' },
    'hpp-kalkulator': { title: 'HPP & Kalkulator Konversi Kemasan', sub: 'Perhitungan HPP harian, konversi gramasi kemasan, dan laporan persentase margin error.' },
    'audit-stok': { title: 'Stok Fisik & Opname Harian', sub: 'Upload Excel & pencatatan stok fisik per tanggal tanpa mengubah stok sistem BOM.' },
    'absensi-spg': { title: 'Absensi SPG & Sales', sub: 'Pantau data check in & check out tim lapangan secara real-time dari aplikasi mobile PresensiKu.' },
  };

  const current = titles[activeTab] || titles['dashboard'];

  // User details & initial calculation
  const userName = activeUser?.name || 'User';
  const initial = userName.charAt(0).toUpperCase();

  const getRoleLabel = (role) => {
    if (role === 'ADMIN') return 'Super Admin BB';
    if (role === 'ADMIN_PRODUK') return 'Super Admin Produk';
    if (role === 'BAHAN_BAKU') return 'Tim Produksi';
    if (role === 'PEMBELIAN') return 'Tim Pembelian';
    if (role === 'TIM_PENJUALAN') return 'Tim Penjualan';
    if (role === 'TIM_MARKETING') return 'Tim Marketing';
    if (role === 'SALES') return 'Tim Sales';
    return role || 'Pengguna';
  };

  const currentRoleLabel = getRoleLabel(activeRoleView || activeUser?.role);

  return (
    <header className="topbar">
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          className="mobile-menu-toggle-btn"
          onClick={onOpenMobileSidebar}
          title="Buka Navigasi Utama"
          aria-label="Buka Navigasi"
        >
          <Menu size={22} style={{ color: '#0f172a' }} />
        </button>
        <div className="topbar-title">
          <h2>{current.title}</h2>
          <p className="text-muted">{current.sub}</p>
        </div>
      </div>

      <div className="topbar-actions">
        {/* ===== USER PROFILE DROPDOWN ===== */}
        <div className="profile-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
          {/* PROFILE BUTTON WITH INITIAL LOGO AVATAR */}
          <button
            type="button"
            className="profile-trigger-btn"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: isProfileOpen ? '#ffffff' : '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '30px',
              padding: '0.35rem 0.85rem 0.35rem 0.4rem',
              cursor: 'pointer',
              boxShadow: isProfileOpen ? '0 4px 14px rgba(0,0,0,0.1)' : '0 2px 6px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
          >
            {/* LOGO INISIAL AVATAR CIRCLE */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
              letterSpacing: '-0.02em'
            }}>
              {initial}
            </div>

            {/* NAME & ROLE DISPLAY */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {userName}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', lineHeight: 1.2 }}>
                {currentRoleLabel}
              </span>
            </div>

            <ChevronDown
              size={16}
              style={{
                color: '#64748b',
                transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </button>

          {/* DROPDOWN POPUP MENU */}
          {isProfileOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '280px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)',
              padding: '0.85rem',
              zIndex: 9999,
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {/* HEADER USER INFO */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35)'
                }}>
                  {initial}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {userName}
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {activeUser?.email || activeUser?.username || 'Akun Pengguna'}
                  </span>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '0.2rem',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '6px',
                    background: '#e0e7ff',
                    color: '#3730a3',
                    fontSize: '0.68rem',
                    fontWeight: 800
                  }}>
                    {getRoleLabel(activeUser?.role)}
                  </span>
                </div>
              </div>

              {/* PERAN SWITCHER (IF ADMIN / ADMIN PRODUK) */}
              {(activeUser?.role === 'ADMIN' || activeUser?.role === 'ADMIN_PRODUK') && (
                <div style={{ padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Eye size={13} style={{ color: '#2563eb' }} /> Switch Peran Tampilan:
                  </div>

                  {activeUser?.role === 'ADMIN' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {[
                        { role: 'ADMIN', label: 'Super Admin BB' },
                        { role: 'BAHAN_BAKU', label: 'Tim Produksi' },
                        { role: 'PEMBELIAN', label: 'Tim Pembelian' }
                      ].map(opt => (
                        <button
                          key={opt.role}
                          type="button"
                          onClick={() => {
                            onChangeRoleView(opt.role);
                            setIsProfileOpen(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.4rem 0.65rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeRoleView === opt.role ? '#eff6ff' : 'transparent',
                            color: activeRoleView === opt.role ? '#1d4ed8' : '#334155',
                            fontWeight: activeRoleView === opt.role ? 800 : 600,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            cursor: 'pointer'
                          }}
                        >
                          <span>{opt.label}</span>
                          {activeRoleView === opt.role && <Check size={14} style={{ color: '#2563eb' }} />}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeUser?.role === 'ADMIN_PRODUK' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {[
                        { role: 'ADMIN_PRODUK', label: 'Super Admin Produk' },
                        { role: 'TIM_PENJUALAN', label: 'Tim Penjualan' },
                        { role: 'TIM_MARKETING', label: 'Tim Marketing' },
                        { role: 'SALES', label: 'Tim Sales' }
                      ].map(opt => (
                        <button
                          key={opt.role}
                          type="button"
                          onClick={() => {
                            onChangeRoleView(opt.role);
                            setIsProfileOpen(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.4rem 0.65rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeRoleView === opt.role ? '#eff6ff' : 'transparent',
                            color: activeRoleView === opt.role ? '#1d4ed8' : '#334155',
                            fontWeight: activeRoleView === opt.role ? 800 : 600,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            cursor: 'pointer'
                          }}
                        >
                          <span>{opt.label}</span>
                          {activeRoleView === opt.role && <Check size={14} style={{ color: '#2563eb' }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ACTION MENU ITEMS */}
              <div style={{ paddingTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChangePassword();
                    setIsProfileOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.83rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <KeyRound size={16} style={{ color: '#f59e0b' }} />
                  <span>Ubah Kata Sandi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setIsProfileOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#e11d48',
                    fontWeight: 800,
                    fontSize: '0.83rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#ffe4e6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={16} style={{ color: '#e11d48' }} />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
