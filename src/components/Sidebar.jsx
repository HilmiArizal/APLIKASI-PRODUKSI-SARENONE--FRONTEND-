import React from 'react';
import { LayoutDashboard, Boxes, Package, BookOpen, ChefHat, History, UserCheck, LogOut, X, Layers, FlaskConical, CreditCard, PackageCheck, Building2, ShoppingCart, Receipt } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Sidebar({
  activeUser,
  activeRoleView,
  activeTab,
  onSwitchTab,
  onLogout,
  lowStockCount,
  pendingUserCount,
  isMobileOpen,
  onCloseMobile
}) {
  const getRoleTitle = (role) => {
    if (role === 'ADMIN') return 'Super Admin';
    if (role === 'BAHAN_BAKU') return 'Tim Produksi';
    if (role === 'PEMBELIAN') return 'Tim Pembelian';
    if (role === 'PENDING') return 'Menunggu Approval';
    return role;
  };

  const showBahan = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU' || activeRoleView === 'PEMBELIAN');
  const showEmulsi = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');
  const showPembelian = (activeRoleView === 'ADMIN' || activeRoleView === 'PEMBELIAN');
  const showProduk = (activeRoleView === 'ADMIN' || activeRoleView === 'BAHAN_BAKU');
  const showAudit = (activeRoleView === 'ADMIN');

  const handleNavClick = (tabName) => {
    onSwitchTab(tabName);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* MOBILE OVERLAY BACKDROP */}
      {isMobileOpen && (
        <div className="sidebar-mobile-backdrop" onClick={onCloseMobile}></div>
      )}

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <img src={logoImg} alt="SAREN ONE" className="sidebar-logo" />
          <button className="mobile-close-btn" onClick={onCloseMobile}>
            <X size={20} />
          </button>
        </div>

        <div className="user-profile-card">
          <div className="avatar-icon">
            {activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="user-info">
            <h4>{activeUser?.name || 'User'}</h4>
            <span className="role-badge">{getRoleTitle(activeUser?.role)}</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-label">NAVIGASI UTAMA</div>

          <a
            href="#dashboard"
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); handleNavClick('dashboard'); }}
          >
            <LayoutDashboard size={18} /> <span>Dashboard Ringkasan</span>
          </a>

          {showBahan && (
            <>
              <a
                href="#bahan-baku"
                className={`menu-item ${activeTab === 'bahan-baku' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('bahan-baku'); }}
              >
                <Boxes size={18} /> <span>Stok Bahan Baku</span>
                {lowStockCount > 0 && (
                  <span className="badge badge-amber">{lowStockCount}</span>
                )}
              </a>

              <a
                href="#penerimaan-bahan"
                className={`menu-item ${activeTab === 'penerimaan-bahan' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('penerimaan-bahan'); }}
              >
                <PackageCheck size={18} /> <span>Penerimaan Bahan Baku</span>
              </a>

              {showEmulsi && (
                <a
                  href="#emulsi"
                  className={`menu-item ${activeTab === 'emulsi' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick('emulsi'); }}
                >
                  <FlaskConical size={18} /> <span>Pengolahan Emulsi</span>
                </a>
              )}
            </>
          )}

          {showPembelian && (
            <>
              <a
                href="#pembelian-bahan"
                className={`menu-item ${activeTab === 'pembelian-bahan' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('pembelian-bahan'); }}
              >
                <ShoppingCart size={18} /> <span>Pembelian Bahan Baku</span>
              </a>

              <a
                href="#utang-supplier"
                className={`menu-item ${activeTab === 'utang-supplier' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('utang-supplier'); }}
              >
                <CreditCard size={18} /> <span>Utang Supplier</span>
              </a>
            </>
          )}

          {showProduk && (
            <>
              <a
                href="#produk"
                className={`menu-item ${activeTab === 'produk' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('produk'); }}
              >
                <Package size={18} /> <span>Katalog & Produksi</span>
              </a>

              <a
                href="#resep"
                className={`menu-item ${activeTab === 'resep' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('resep'); }}
              >
                <BookOpen size={18} /> <span>Manajemen Resep (BOM)</span>
              </a>

              <a
                href="#pemakaian-kemasan"
                className={`menu-item ${activeTab === 'pemakaian-kemasan' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('pemakaian-kemasan'); }}
              >
                <Package size={18} /> <span>Pemakaian Kemasan</span>
              </a>

              <a
                href="#riwayat-produksi"
                className={`menu-item ${activeTab === 'riwayat-produksi' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('riwayat-produksi'); }}
              >
                <ChefHat size={18} /> <span>Riwayat Produksi</span>
              </a>
            </>
          )}

          {activeRoleView === 'ADMIN' && (
            <>
              <a
                href="#supplier"
                className={`menu-item ${activeTab === 'supplier' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('supplier'); }}
              >
                <Building2 size={18} /> <span>Kelola Supplier</span>
              </a>

              <a
                href="#kategori"
                className={`menu-item ${activeTab === 'kategori' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('kategori'); }}
              >
                <Layers size={18} /> <span>Kelola Brand</span>
              </a>
            </>
          )}

          {showAudit && (
            <>
              <a
                href="#user-approval"
                className={`menu-item ${activeTab === 'user-approval' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('user-approval'); }}
              >
                <UserCheck size={18} /> <span>Verifikasi User & Role</span>
                {pendingUserCount > 0 && (
                  <span className="badge badge-amber">{pendingUserCount}</span>
                )}
              </a>

              <a
                href="#audit-log"
                className={`menu-item ${activeTab === 'audit-log' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('audit-log'); }}
              >
                <History size={18} /> <span>Jurnal Transaksi</span>
              </a>
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
