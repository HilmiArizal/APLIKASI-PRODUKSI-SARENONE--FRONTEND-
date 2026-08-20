import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Boxes, Package, BookOpen, ChefHat, History, UserCheck,
  LogOut, X, Layers, Tag, Users, FlaskConical, CreditCard, PackageCheck,
  Building2, ShoppingCart, Megaphone, TrendingUp, ChevronDown, ChevronRight
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Sidebar({ activeUser, activeRoleView, activeTab, onSwitchTab, onLogout, lowStockCount, pendingUserCount, isMobileOpen, onCloseMobile }) {

  const getRoleTitle = (role) => {
    if (role === 'ADMIN') return 'Super Admin Bahan Baku';
    if (role === 'ADMIN_PRODUK') return 'Super Admin Produk';
    if (role === 'BAHAN_BAKU') return 'Tim Produksi';
    if (role === 'PEMBELIAN') return 'Tim Pembelian';
    if (role === 'TIM_PENJUALAN') return 'Tim Penjualan';
    if (role === 'TIM_MARKETING') return 'Tim Marketing';
    if (role === 'SALES') return 'Tim Sales';
    if (role === 'PENDING') return 'Menunggu Approval';
    return role;
  };

  const isProdukDomain = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'TIM_MARKETING'].includes(activeRoleView);

  // Group Active Checks
  const isPembelianActive = ['pembelian-bahan', 'penerimaan-bahan', 'utang-supplier', 'bahan-baku'].includes(activeTab);
  const isProduksiActive = ['emulsi', 'produk', 'resep', 'pemakaian-kemasan', 'riwayat-produksi', 'hpp-kalkulator'].includes(activeTab);

  const [openMenuPembelian, setOpenMenuPembelian] = useState(false);
  const [openMenuProduksi, setOpenMenuProduksi] = useState(false);

  // Domain Bahan Baku Permissions
  const showPembelianGroup = !isProdukDomain && activeRoleView !== 'SALES' && ['ADMIN', 'PEMBELIAN'].includes(activeRoleView);
  const showProduksiGroup = !isProdukDomain && activeRoleView !== 'SALES' && ['ADMIN', 'BAHAN_BAKU'].includes(activeRoleView);
  const showSupplier = !isProdukDomain && activeRoleView !== 'SALES' && ['ADMIN', 'PEMBELIAN'].includes(activeRoleView);
  const showAudit = !isProdukDomain && activeRoleView === 'ADMIN';

  // Domain Produk Permissions
  const showKatalogProduk = isProdukDomain && ['ADMIN_PRODUK', 'TIM_PENJUALAN'].includes(activeRoleView);
  const showPenjualan = isProdukDomain && ['ADMIN_PRODUK', 'TIM_PENJUALAN'].includes(activeRoleView);
  const showMarketing = isProdukDomain && ['ADMIN_PRODUK', 'TIM_MARKETING'].includes(activeRoleView);

  const nav = (tabName) => { onSwitchTab(tabName); if (onCloseMobile) onCloseMobile(); };
  const mi = (tab) => `menu-item ${activeTab === tab ? 'active' : ''}`;

  return (
    <>
      {isMobileOpen && <div className="sidebar-mobile-backdrop" onClick={onCloseMobile} />}

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <img src={logoImg} alt="SAREN ONE" className="sidebar-logo" />
          <button className="mobile-close-btn" onClick={onCloseMobile}><X size={20} /></button>
        </div>

        <div className="user-profile-card">
          <div className="avatar-icon">{activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : 'A'}</div>
          <div className="user-info">
            <h4>{activeUser?.name || 'User'}</h4>
            <span className="role-badge">{getRoleTitle(activeUser?.role)}</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-label">NAVIGASI UTAMA</div>

          {/* ===== DOMAIN BAHAN BAKU (SESUAI CATATAN TANGAN) ===== */}
          {!isProdukDomain && (
            <>
              {/* 1. Dashboard */}
              <a href="#dashboard" className={mi('dashboard')} onClick={e => { e.preventDefault(); nav('dashboard'); }}>
                <LayoutDashboard size={18} /><span>Dashboard</span>
              </a>

              {/* 2. Pembelian (Collapsible v) */}
              {showPembelianGroup && (
                <div className="menu-group">
                  <button
                    type="button"
                    className={`menu-group-header ${isPembelianActive ? 'active' : ''}`}
                    onClick={() => setOpenMenuPembelian(!openMenuPembelian)}
                    style={{
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      background: isPembelianActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                      color: isPembelianActive ? 'var(--amber)' : 'var(--text-color)',
                      border: 'none',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '0.25rem'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <ShoppingCart size={18} /> Pembelian
                    </span>
                    {openMenuPembelian ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {openMenuPembelian && (
                    <div className="menu-sub-items" style={{ paddingLeft: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <a href="#pembelian-bahan" className={mi('pembelian-bahan')} onClick={e => { e.preventDefault(); nav('pembelian-bahan'); }}>
                        <ShoppingCart size={16} /><span>Pembelian</span>
                      </a>
                      <a href="#penerimaan-bahan" className={mi('penerimaan-bahan')} onClick={e => { e.preventDefault(); nav('penerimaan-bahan'); }}>
                        <PackageCheck size={16} /><span>Penerimaan</span>
                      </a>
                      <a href="#utang-supplier" className={mi('utang-supplier')} onClick={e => { e.preventDefault(); nav('utang-supplier'); }}>
                        <CreditCard size={16} /><span>Utang Supplier</span>
                      </a>
                      <a href="#bahan-baku" className={mi('bahan-baku')} onClick={e => { e.preventDefault(); nav('bahan-baku'); }}>
                        <Boxes size={16} /><span>Stock Bahan Baku</span>
                        {lowStockCount > 0 && <span className="badge badge-amber">{lowStockCount}</span>}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Produksi (Collapsible v) */}
              {showProduksiGroup && (
                <div className="menu-group" style={{ marginTop: '0.35rem' }}>
                  <button
                    type="button"
                    className={`menu-group-header ${isProduksiActive ? 'active' : ''}`}
                    onClick={() => setOpenMenuProduksi(!openMenuProduksi)}
                    style={{
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      background: isProduksiActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                      color: isProduksiActive ? 'var(--cyan)' : 'var(--text-color)',
                      border: 'none',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '0.25rem'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <ChefHat size={18} /> Produksi
                    </span>
                    {openMenuProduksi ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {openMenuProduksi && (
                    <div className="menu-sub-items" style={{ paddingLeft: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <a href="#emulsi" className={mi('emulsi')} onClick={e => { e.preventDefault(); nav('emulsi'); }}>
                        <FlaskConical size={16} /><span>Pengolahan Emulsi</span>
                      </a>
                      <a href="#produk" className={mi('produk')} onClick={e => { e.preventDefault(); nav('produk'); }}>
                        <Package size={16} /><span>Katalog &amp; Produksi</span>
                      </a>
                      <a href="#resep" className={mi('resep')} onClick={e => { e.preventDefault(); nav('resep'); }}>
                        <BookOpen size={16} /><span>BOM</span>
                      </a>
                      <a href="#pemakaian-kemasan" className={mi('pemakaian-kemasan')} onClick={e => { e.preventDefault(); nav('pemakaian-kemasan'); }}>
                        <Package size={16} /><span>Pemakaian Kemasan</span>
                      </a>
                      <a href="#riwayat-produksi" className={mi('riwayat-produksi')} onClick={e => { e.preventDefault(); nav('riwayat-produksi'); }}>
                        <ChefHat size={16} /><span>Riwayat Produksi</span>
                      </a>
                      <a href="#hpp-kalkulator" className={mi('hpp-kalkulator')} onClick={e => { e.preventDefault(); nav('hpp-kalkulator'); }}>
                        <TrendingUp size={16} /><span>HPP Produksi</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Kelola Supplier */}
              {showSupplier && (
                <a href="#supplier" className={mi('supplier')} onClick={e => { e.preventDefault(); nav('supplier'); }} style={{ marginTop: '0.35rem' }}>
                  <Building2 size={18} /><span>Kelola Supplier</span>
                </a>
              )}

              {/* 5. Kelola Brand */}
              {activeRoleView === 'ADMIN' && (
                <a href="#kategori" className={mi('kategori')} onClick={e => { e.preventDefault(); nav('kategori'); }}>
                  <Layers size={18} /><span>Kelola Brand</span>
                </a>
              )}

              {/* 6. Verifikasi User & 7. Audit Log */}
              {showAudit && (
                <>
                  <a href="#user-approval" className={mi('user-approval')} onClick={e => { e.preventDefault(); nav('user-approval'); }}>
                    <UserCheck size={18} /><span>Verifikasi User</span>
                    {pendingUserCount > 0 && <span className="badge badge-amber">{pendingUserCount}</span>}
                  </a>
                  <a href="#audit-log" className={mi('audit-log')} onClick={e => { e.preventDefault(); nav('audit-log'); }}>
                    <History size={18} /><span>Audit Log</span>
                  </a>
                </>
              )}
            </>
          )}

          {/* ===== DOMAIN PRODUK ===== */}
          {isProdukDomain && (
            <>
              {['ADMIN_PRODUK', 'TIM_PENJUALAN', 'TIM_MARKETING'].includes(activeRoleView) && (
                <a href="#dashboard-produk" className={mi('dashboard-produk')} onClick={e => { e.preventDefault(); nav('dashboard-produk'); }}>
                  <LayoutDashboard size={18} /><span>Dashboard Produk</span>
                </a>
              )}

              {showKatalogProduk && (
                <>
                  <a href="#katalog-produk" className={mi('katalog-produk')} onClick={e => { e.preventDefault(); nav('katalog-produk'); }}>
                    <Package size={18} /><span>Katalog Produk</span>
                  </a>
                  <a href="#stok-produk" className={mi('stok-produk')} onClick={e => { e.preventDefault(); nav('stok-produk'); }}>
                    <Boxes size={18} /><span>Stok Produk</span>
                  </a>
                  <a href="#kategori-produk-sales" className={mi('kategori-produk-sales')} onClick={e => { e.preventDefault(); nav('kategori-produk-sales'); }}>
                    <Tag size={18} /><span>Kelola Brand</span>
                  </a>
                </>
              )}

              {showPenjualan && (
                <>
                  <a href="#penjualan" className={mi('penjualan')} onClick={e => { e.preventDefault(); nav('penjualan'); }}>
                    <TrendingUp size={18} /><span>Data Penjualan</span>
                  </a>
                  <a href="#pelanggan" className={mi('pelanggan')} onClick={e => { e.preventDefault(); nav('pelanggan'); }}>
                    <Users size={18} /><span>Kelola Pelanggan</span>
                  </a>
                  <a href="#piutang-pelanggan" className={mi('piutang-pelanggan')} onClick={e => { e.preventDefault(); nav('piutang-pelanggan'); }}>
                    <CreditCard size={18} /><span>Piutang Pelanggan</span>
                  </a>
                  <a href="#pembayaran-masuk" className={mi('pembayaran-masuk')} onClick={e => { e.preventDefault(); nav('pembayaran-masuk'); }}>
                    <PackageCheck size={18} /><span>Pembayaran Masuk</span>
                  </a>
                </>
              )}

              {showMarketing && (
                <a href="#marketing" className={mi('marketing')} onClick={e => { e.preventDefault(); nav('marketing'); }}>
                  <Megaphone size={18} /><span>Konten Marketing</span>
                </a>
              )}

              {activeRoleView === 'ADMIN_PRODUK' && (
                <>
                  <a href="#user-approval-produk" className={mi('user-approval-produk')} onClick={e => { e.preventDefault(); nav('user-approval-produk'); }}>
                    <UserCheck size={18} /><span>Verifikasi User</span>
                  </a>
                  <a href="#audit-log-produk" className={mi('audit-log-produk')} onClick={e => { e.preventDefault(); nav('audit-log-produk'); }}>
                    <History size={18} /><span>Audit Log</span>
                  </a>
                </>
              )}
            </>
          )}

          {activeRoleView === 'SALES' && (
            <a href="#absensi-spg" className={mi('absensi-spg')} onClick={e => { e.preventDefault(); nav('absensi-spg'); }}>
              <UserCheck size={18} /><span>Absensi Sales</span>
            </a>
          )}
        </nav>
      </aside>
    </>
  );
}
