import React from 'react';
import { LayoutDashboard, Boxes, Package, BookOpen, ChefHat, History, UserCheck, LogOut, X, Layers, Tag, FlaskConical, CreditCard, PackageCheck, Building2, ShoppingCart, Megaphone, TrendingUp } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Sidebar({ activeUser, activeRoleView, activeTab, onSwitchTab, onLogout, lowStockCount, pendingUserCount, isMobileOpen, onCloseMobile }) {

  const getRoleTitle = (role) => {
    if (role === 'ADMIN') return 'Super Admin Bahan Baku';
    if (role === 'ADMIN_PRODUK') return 'Super Admin Produk';
    if (role === 'BAHAN_BAKU') return 'Tim Produksi';
    if (role === 'PEMBELIAN') return 'Tim Pembelian';
    if (role === 'TIM_PENJUALAN') return 'Tim Penjualan';
    if (role === 'TIM_MARKETING') return 'Tim Marketing';
    if (role === 'PENDING') return 'Menunggu Approval';
    return role;
  };

  const isProdukDomain = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'TIM_MARKETING'].includes(activeRoleView);

  // Domain Bahan Baku
  const showBahan = !isProdukDomain && ['ADMIN', 'BAHAN_BAKU', 'PEMBELIAN'].includes(activeRoleView);
  const showEmulsi = !isProdukDomain && ['ADMIN', 'BAHAN_BAKU'].includes(activeRoleView);
  const showPembelian = !isProdukDomain && ['ADMIN', 'PEMBELIAN'].includes(activeRoleView);
  const showProdukMenu = !isProdukDomain && ['ADMIN', 'BAHAN_BAKU'].includes(activeRoleView);
  const showAudit = !isProdukDomain && activeRoleView === 'ADMIN';

  // Domain Produk
  const showKatalogProduk = isProdukDomain;
  const showPenjualan = isProdukDomain && ['ADMIN_PRODUK', 'TIM_PENJUALAN'].includes(activeRoleView);
  const showMarketing = isProdukDomain && ['ADMIN_PRODUK', 'TIM_MARKETING'].includes(activeRoleView);
  const showUserApprovalProduk = isProdukDomain && activeRoleView === 'ADMIN_PRODUK';
  const showAuditProduk = isProdukDomain && activeRoleView === 'ADMIN_PRODUK';

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

          {/* ===== DOMAIN BAHAN BAKU ===== */}
          {!isProdukDomain && (
            <>
              <a href="#dashboard" className={mi('dashboard')} onClick={e => { e.preventDefault(); nav('dashboard'); }}>
                <LayoutDashboard size={18} /><span>Dashboard Ringkasan</span>
              </a>

              {showBahan && (
                <>
                  <a href="#bahan-baku" className={mi('bahan-baku')} onClick={e => { e.preventDefault(); nav('bahan-baku'); }}>
                    <Boxes size={18} /><span>Stok Bahan Baku</span>
                    {lowStockCount > 0 && <span className="badge badge-amber">{lowStockCount}</span>}
                  </a>
                  {showEmulsi && (
                    <a href="#emulsi" className={mi('emulsi')} onClick={e => { e.preventDefault(); nav('emulsi'); }}>
                      <FlaskConical size={18} /><span>Pengolahan Emulsi</span>
                    </a>
                  )}
                </>
              )}

              {showPembelian && (
                <>
                  <a href="#pembelian-bahan" className={mi('pembelian-bahan')} onClick={e => { e.preventDefault(); nav('pembelian-bahan'); }}>
                    <ShoppingCart size={18} /><span>Pembelian Bahan Baku</span>
                  </a>
                  <a href="#penerimaan-bahan" className={mi('penerimaan-bahan')} onClick={e => { e.preventDefault(); nav('penerimaan-bahan'); }}>
                    <PackageCheck size={18} /><span>Penerimaan Bahan Baku</span>
                  </a>
                  <a href="#utang-supplier" className={mi('utang-supplier')} onClick={e => { e.preventDefault(); nav('utang-supplier'); }}>
                    <CreditCard size={18} /><span>Utang Supplier</span>
                  </a>
                </>
              )}

              {showProdukMenu && (
                <>
                  <a href="#produk" className={mi('produk')} onClick={e => { e.preventDefault(); nav('produk'); }}>
                    <Package size={18} /><span>Katalog &amp; Produksi</span>
                  </a>
                  <a href="#resep" className={mi('resep')} onClick={e => { e.preventDefault(); nav('resep'); }}>
                    <BookOpen size={18} /><span>Manajemen Resep (BOM)</span>
                  </a>
                  <a href="#pemakaian-kemasan" className={mi('pemakaian-kemasan')} onClick={e => { e.preventDefault(); nav('pemakaian-kemasan'); }}>
                    <Package size={18} /><span>Pemakaian Kemasan</span>
                  </a>
                  <a href="#riwayat-produksi" className={mi('riwayat-produksi')} onClick={e => { e.preventDefault(); nav('riwayat-produksi'); }}>
                    <ChefHat size={18} /><span>Riwayat Produksi</span>
                  </a>
                </>
              )}

              {activeRoleView === 'ADMIN' && (
                <>
                  <a href="#supplier" className={mi('supplier')} onClick={e => { e.preventDefault(); nav('supplier'); }}>
                    <Building2 size={18} /><span>Kelola Supplier</span>
                  </a>
                  <a href="#kategori" className={mi('kategori')} onClick={e => { e.preventDefault(); nav('kategori'); }}>
                    <Layers size={18} /><span>Kelola Brand</span>
                  </a>
                </>
              )}

              {showAudit && (
                <>
                  <a href="#user-approval" className={mi('user-approval')} onClick={e => { e.preventDefault(); nav('user-approval'); }}>
                    <UserCheck size={18} /><span>Verifikasi User &amp; Role</span>
                    {pendingUserCount > 0 && <span className="badge badge-amber">{pendingUserCount}</span>}
                  </a>
                  <a href="#audit-log" className={mi('audit-log')} onClick={e => { e.preventDefault(); nav('audit-log'); }}>
                    <History size={18} /><span>Jurnal Transaksi</span>
                  </a>
                </>
              )}
            </>
          )}

          {/* ===== DOMAIN PRODUK ===== */}
          {isProdukDomain && (
            <>
              <a href="#dashboard-produk" className={mi('dashboard-produk')} onClick={e => { e.preventDefault(); nav('dashboard-produk'); }}>
                <LayoutDashboard size={18} /><span>Dashboard Produk</span>
              </a>

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
                </>
              )}

              {showMarketing && (
                <a href="#marketing" className={mi('marketing')} onClick={e => { e.preventDefault(); nav('marketing'); }}>
                  <Megaphone size={18} /><span>Program Marketing</span>
                </a>
              )}

              {showUserApprovalProduk && (
                <a href="#user-approval-produk" className={mi('user-approval-produk')} onClick={e => { e.preventDefault(); nav('user-approval-produk'); }}>
                  <UserCheck size={18} /><span>Verifikasi User</span>
                  {pendingUserCount > 0 && <span className="badge badge-amber">{pendingUserCount}</span>}
                </a>
              )}

              {showAuditProduk && (
                <a href="#audit-log-produk" className={mi('audit-log-produk')} onClick={e => { e.preventDefault(); nav('audit-log-produk'); }}>
                  <History size={18} /><span>Jurnal Aktivitas</span>
                </a>
              )}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-danger btn-block" onClick={onLogout}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
