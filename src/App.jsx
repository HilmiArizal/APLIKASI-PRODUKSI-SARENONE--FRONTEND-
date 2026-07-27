import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './components/Login';

import DashboardTab from './components/DashboardTab';
import BahanBakuTab from './components/BahanBakuTab';
import ProdukTab from './components/ProdukTab';
import ResepTab from './components/ResepTab';
import RiwayatProduksiTab from './components/RiwayatProduksiTab';
import UserApprovalTab from './components/UserApprovalTab';
import AuditLogTab from './components/AuditLogTab';
import KategoriTab from './components/KategoriTab';

import {
  ModalBahan,
  ModalStokMasuk,
  ModalProduk,
  ModalProduksi,
  ModalResepItem
} from './components/Modals';

import ModalKelolaKategori from './components/ModalKelolaKategori';
import ModalKelolaKategoriBahan from './components/ModalKelolaKategoriBahan';
import ModalChangePassword from './components/ModalChangePassword';

import {
  DEFAULT_USERS,
  INITIAL_KATEGORI_PRODUK,
  INITIAL_KATEGORI_BAHAN,
  INITIAL_BAHAN_BAKU,
  INITIAL_PRODUK,
  INITIAL_RESEP,
  INITIAL_AUDIT_LOG,
  INITIAL_RIWAYAT_PRODUKSI
} from './data/initialData';

import {
  loginApi,
  registerApi,
  getUsersApi,
  approveUserApi,
  rejectUserApi,
  deleteUserApi,
  changePasswordApi,
  getKategoriProdukApi,
  createKategoriProdukApi,
  updateKategoriProdukApi,
  deleteKategoriProdukApi,
  getKategoriBahanBakuApi,
  createKategoriBahanBakuApi,
  updateKategoriBahanBakuApi,
  deleteKategoriBahanBakuApi,
  getBahanBakuApi,
  createBahanBakuApi,
  updateBahanBakuApi,
  deleteBahanBakuApi,
  restockBahanBakuApi,
  getProdukApi,
  createProdukApi,
  updateProdukApi,
  deleteProdukApi,
  getResepApi,
  saveResepItemApi,
  deleteResepItemApi,
  executeProduksiApi,
  getRiwayatProduksiApi,
  getAuditLogApi
} from './services/api';

const STORAGE_KEYS = {
  USERS: 'saren_one_users_v2',
  ACTIVE_USER: 'saren_one_active_user_v2',
  KATEGORI_PRODUK: 'saren_one_kategori_produk_v2',
  KATEGORI_BAHAN: 'saren_one_kategori_bahan_v2',
  BAHAN_BAKU: 'saren_one_bahan_baku_v2',
  PRODUK: 'saren_one_produk_v2',
  RESEP: 'saren_one_resep_v2',
  AUDIT_LOG: 'saren_one_audit_log_v2',
  RIWAYAT_PRODUKSI: 'saren_one_riwayat_produksi_v2'
};

export default function App() {
  const [activeUser, setActiveUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [activeRoleView, setActiveRoleView] = useState(() => activeUser?.role || 'ADMIN');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  // Core Data States
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [kategoriProduk, setKategoriProduk] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KATEGORI_PRODUK);
    return saved ? JSON.parse(saved) : INITIAL_KATEGORI_PRODUK;
  });

  const [kategoriBahanBaku, setKategoriBahanBaku] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KATEGORI_BAHAN);
    return saved ? JSON.parse(saved) : INITIAL_KATEGORI_BAHAN;
  });

  const [bahanBaku, setBahanBaku] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BAHAN_BAKU);
    return saved ? JSON.parse(saved) : INITIAL_BAHAN_BAKU;
  });

  const [produk, setProduk] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUK);
    return saved ? JSON.parse(saved) : INITIAL_PRODUK;
  });

  const [resep, setResep] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESEP);
    return saved ? JSON.parse(saved) : INITIAL_RESEP;
  });

  const [auditLog, setAuditLog] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOG;
  });

  const [riwayatProduksi, setRiwayatProduksi] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RIWAYAT_PRODUKSI);
    return saved ? JSON.parse(saved) : INITIAL_RIWAYAT_PRODUKSI;
  });

  // Modal Control States
  const [isModalBahanOpen, setIsModalBahanOpen] = useState(false);
  const [editingBahan, setEditingBahan] = useState(null);

  const [isModalStokMasukOpen, setIsModalStokMasukOpen] = useState(false);

  const [isModalProdukOpen, setIsModalProdukOpen] = useState(false);
  const [editingProduk, setEditingProduk] = useState(null);

  const [isModalProduksiOpen, setIsModalProduksiOpen] = useState(false);
  const [selectedProduksiId, setSelectedProduksiId] = useState(null);

  const [isModalResepItemOpen, setIsModalResepItemOpen] = useState(false);
  const [resepProdukId, setResepProdukId] = useState(null);

  const [isModalKelolaKategoriOpen, setIsModalKelolaKategoriOpen] = useState(false);
  const [isModalKelolaKategoriBahanOpen, setIsModalKelolaKategoriBahanOpen] = useState(false);
  const [isModalChangePasswordOpen, setIsModalChangePasswordOpen] = useState(false);

  // Sync Data from Backend API on Initial Mount
  const fetchAllDataFromBackend = async () => {
    try {
      const [uRes, kpRes, kbRes, bRes, pRes, rRes, prodRes, logRes] = await Promise.all([
        getUsersApi(),
        getKategoriProdukApi(),
        getKategoriBahanBakuApi(),
        getBahanBakuApi(),
        getProdukApi(),
        getResepApi(),
        getRiwayatProduksiApi(),
        getAuditLogApi()
      ]);

      if (uRes?.success) setUsers(uRes.data);
      if (kpRes?.success) setKategoriProduk(kpRes.data);
      if (kbRes?.success) setKategoriBahanBaku(kbRes.data);
      if (bRes?.success) setBahanBaku(bRes.data);
      if (pRes?.success) setProduk(pRes.data);
      if (rRes?.success) setResep(rRes.data);
      if (prodRes?.success) setRiwayatProduksi(prodRes.data);
      if (logRes?.success) setAuditLog(logRes.data);

      setBackendConnected(true);
    } catch (err) {
      console.warn('Backend API Offline, menggunakan LocalStorage:', err);
      setBackendConnected(false);
    }
  };

  useEffect(() => {
    fetchAllDataFromBackend();
  }, []);

  // Save to LocalStorage Backup
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KATEGORI_PRODUK, JSON.stringify(kategoriProduk));
  }, [kategoriProduk]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KATEGORI_BAHAN, JSON.stringify(kategoriBahanBaku));
  }, [kategoriBahanBaku]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BAHAN_BAKU, JSON.stringify(bahanBaku));
  }, [bahanBaku]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUK, JSON.stringify(produk));
  }, [produk]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESEP, JSON.stringify(resep));
  }, [resep]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(auditLog));
  }, [auditLog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RIWAYAT_PRODUKSI, JSON.stringify(riwayatProduksi));
  }, [riwayatProduksi]);

  useEffect(() => {
    if (activeUser) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(activeUser));
      setActiveRoleView(activeUser.role);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    }
  }, [activeUser]);

  // Auth Handlers
  const handleLogin = async (usernameOrEmail, password) => {
    const res = await loginApi(usernameOrEmail, password);
    if (res?.success) {
      setActiveUser(res.user);
      setActiveRoleView(res.user.role);
      alert(`Selamat datang kembali, ${res.user.name}! (Role: ${res.user.role})`);
      return;
    }

    if (res?.isOffline) {
      const localUser = users.find(u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.pass === password);
      if (localUser) {
        if (localUser.status === 'PENDING') {
          alert('Akun Anda masih dalam antrean persetujuan (PENDING). Mohon hubungi Super Admin.');
          return;
        }
        setActiveUser(localUser);
        setActiveRoleView(localUser.role);
        alert(`Selamat datang kembali, ${localUser.name}! (Mode Offline)`);
        return;
      }
    }

    alert(res?.message || 'Login gagal! Periksa username/password Anda.');
  };

  const handleRegister = async (userData) => {
    const res = await registerApi(userData);
    if (res?.success) {
      alert(res.message);
      fetchAllDataFromBackend();
      return;
    }

    const newUser = {
      id: 'u_' + Date.now(),
      username: userData.username,
      email: userData.email,
      pass: userData.pass,
      name: userData.name,
      role: 'PENDING',
      requestedRole: userData.requestedRole || 'PRODUK',
      status: 'PENDING',
      provider: 'local',
      catatan: userData.catatan || '',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setUsers(prev => [newUser, ...prev]);
    alert('Pendaftaran berhasil dikirim! Menunggu ACC Verifikasi Super Admin.');
  };

  const handleLogout = () => {
    setActiveUser(null);
    setActiveTab('dashboard');
  };

  // User Approval Handlers
  const handleApproveUser = async (userId, assignedRole) => {
    const res = await approveUserApi(userId, assignedRole);
    if (res?.success) {
      alert(res.message);
      fetchAllDataFromBackend();
      return;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'VERIFIED', role: assignedRole } : u));
    alert('Pengguna telah disetujui!');
  };

  const handleRejectUser = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menolak & menghapus pendaftaran pengguna ini?')) return;
    const res = await rejectUserApi(userId);
    if (res?.success) {
      alert(res.message);
      fetchAllDataFromBackend();
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    alert('Pengguna berhasil ditolak.');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus akun pengguna ini?')) return;
    const res = await deleteUserApi(userId);
    if (res?.success) {
      alert(res.message);
      fetchAllDataFromBackend();
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    alert('Akun pengguna berhasil dihapus.');
  };

  const handleChangePassword = async (oldPassword, newPassword) => {
    if (!activeUser) return;
    const res = await changePasswordApi(activeUser.id, oldPassword, newPassword);
    if (res?.success) {
      alert(res.message);
      setIsModalChangePasswordOpen(false);
      return;
    }

    if (res?.isOffline) {
      if (activeUser.pass !== oldPassword) {
        alert('Kata sandi lama salah!');
        return;
      }
      const updatedUser = { ...activeUser, pass: newPassword };
      setActiveUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === activeUser.id ? updatedUser : u));
      alert('Kata sandi berhasil diperbarui (Offline)!');
      setIsModalChangePasswordOpen(false);
      return;
    }

    alert(res?.message || 'Gagal memperbarui kata sandi.');
  };

  // Kategori Produk Handlers
  const handleSaveKategori = async (kategoriData) => {
    if (kategoriData.id) {
      const res = await updateKategoriProdukApi(kategoriData.id, kategoriData, activeUser?.name);
      if (res?.success) {
        alert(res.message);
        fetchAllDataFromBackend();
        return;
      }
      setKategoriProduk(prev => prev.map(k => k.id === kategoriData.id ? { ...k, ...kategoriData } : k));
    } else {
      const res = await createKategoriProdukApi(kategoriData, activeUser?.name);
      if (res?.success) {
        alert(res.message);
        fetchAllDataFromBackend();
        return;
      }
      const newK = { id: 'kat_' + Date.now(), ...kategoriData, createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16) };
      setKategoriProduk(prev => [...prev, newK]);
    }
  };

  const handleDeleteKategori = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kategori produk ini?')) return;
    const res = await deleteKategoriProdukApi(id, activeUser?.name);
    if (res?.success) {
      alert(res.message);
      fetchAllDataFromBackend();
      return;
    }
    setKategoriProduk(prev => prev.filter(k => k.id !== id));
  };

  // Kategori Bahan Baku Handlers
  const handleSaveKategoriBahan = async (kategoriData) => {
    if (kategoriData.id) {
      const res = await updateKategoriBahanBakuApi(kategoriData.id, kategoriData, activeUser?.name);
      if (res?.success) {
        alert(res.message);
        fetchAllDataFromBackend();
        return;
      }
      setKategoriBahanBaku(prev => prev.map(k => k.id === kategoriData.id ? { ...k, ...kategoriData } : k));
    } else {
      const res = await createKategoriBahanBakuApi(kategoriData, activeUser?.name);
      if (res?.success) {
        alert(res.message);
        fetchAllDataFromBackend();
        return;
      }
      const newK = { id: 'kat_bhn_' + Date.now(), ...kategoriData, createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16) };
      setKategoriBahanBaku(prev => [...prev, newK]);
    }
  };

  const handleDeleteKategoriBahan = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kategori bahan baku ini?')) return;
    const res = await deleteKategoriBahanBakuApi(id, activeUser?.name);
    if (res?.success) {
      alert(res.message);
      fetchAllDataFromBackend();
      return;
    }
    setKategoriBahanBaku(prev => prev.filter(k => k.id !== id));
  };

  // Bahan Baku Handlers
  const handleSaveBahan = async (bahanData) => {
    if (bahanData.id) {
      const res = await updateBahanBakuApi(bahanData.id, bahanData, activeUser?.name);
      if (res?.success) {
        alert(res.message);
        fetchAllDataFromBackend();
        setIsModalBahanOpen(false);
        return;
      }
      setBahanBaku(prev => prev.map(b => b.id === bahanData.id ? { ...b, ...bahanData } : b));
    } else {
      const res = await createBahanBakuApi(bahanData, activeUser?.name);
      if (res?.success) {
        alert(res.message);
        fetchAllDataFromBackend();
        setIsModalBahanOpen(false);
        return;
      }
      const newB = { id: 'b_' + Date.now(), ...bahanData };
      setBahanBaku(prev => [...prev, newB]);
    }
    setIsModalBahanOpen(false);
  };

  const handleDeleteBahan = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus item bahan baku ini?')) return;
    const res = await deleteBahanBakuApi(id, activeUser?.name);
    if (res?.success) {
      alert(res.message);
      fetchAllDataFromBackend();
      return;
    }
    setBahanBaku(prev => prev.filter(b => b.id !== id));
  };

  const handleRestockBahan = async (restockData) => {
    const res = await restockBahanBakuApi(restockData, activeUser?.name);
    if (res?.success) {
      alert(res.message);
      fetchAllDataFromBackend();
      setIsModalStokMasukOpen(false);
      return;
    }

    setBahanBaku(prev => prev.map(b => b.id === restockData.bahanId ? { ...b, stok: b.stok + restockData.jumlah } : b));
    setIsModalStokMasukOpen(false);
    alert('Stok masuk berhasil dicatat!');
  };

  // Produk Handlers
  const handleSaveProduk = async (produkData) => {
    if (produkData.id) {
      const res = await updateProdukApi(produkData.id, produkData, activeUser?.name);
      if (res?.success) {
        alert(res.message);
        fetchAllDataFromBackend();
        setIsModalProdukOpen(false);
        return;
      }
      setProduk(prev => prev.map(p => p.id === produkData.id ? { ...p, ...produkData } : p));
    } else {
      const res = await createProdukApi(produkData, activeUser?.name);
      if (res?.success) {
        alert(res.message);
        fetchAllDataFromBackend();
        setIsModalProdukOpen(false);
        return;
      }
      const newP = { id: 'p_' + Date.now(), ...produkData };
      setProduk(prev => [...prev, newP]);
    }
    setIsModalProdukOpen(false);
  };

  const handleDeleteProduk = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini beserta data resepnya?')) return;
    const res = await deleteProdukApi(id, activeUser?.name);
    if (res?.success) {
      alert(res.message);
      fetchAllDataFromBackend();
      return;
    }
    setProduk(prev => prev.filter(p => p.id !== id));
  };

  // Resep Handlers
  const handleSaveResepItem = async (itemData) => {
    if (!resepProdukId) return;
    const payload = { produkId: resepProdukId, ...itemData };
    const res = await saveResepItemApi(payload, activeUser?.name);
    if (res?.success) {
      alert(res.message);
      fetchAllDataFromBackend();
      setIsModalResepItemOpen(false);
      return;
    }

    setResep(prev => {
      const existing = prev[resepProdukId] || [];
      return { ...prev, [resepProdukId]: [...existing, itemData] };
    });
    setIsModalResepItemOpen(false);
  };

  const handleDeleteResepItem = async (pId, idx) => {
    if (!window.confirm('Hapus takaran bahan dari resep ini?')) return;
    const targetItem = resep[pId]?.[idx];
    if (targetItem) {
      const res = await deleteResepItemApi(pId, targetItem.bahanId, activeUser?.name);
      if (res?.success) {
        alert(res.message);
        fetchAllDataFromBackend();
        return;
      }
    }

    setResep(prev => {
      const existing = prev[pId] || [];
      const updated = existing.filter((_, index) => index !== idx);
      return { ...prev, [pId]: updated };
    });
  };

  // Produksi Batch Handler
  const handleExecuteProduksi = async (produksiData) => {
    const res = await executeProduksiApi(produksiData, activeUser?.name);
    if (res?.success) {
      alert(res.message);
      fetchAllDataFromBackend();
      setIsModalProduksiOpen(false);
      return;
    }

    alert('Gagal mengeksekusi produksi.');
  };

  if (!activeUser) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const lowStockCount = bahanBaku.filter(b => b.stok <= b.minStok).length;
  const pendingUserCount = users.filter(u => u.status === 'PENDING').length;

  return (
    <div className="app-container">
      <Sidebar
        activeUser={activeUser}
        activeRoleView={activeRoleView}
        activeTab={activeTab}
        onSwitchTab={setActiveTab}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
        pendingUserCount={pendingUserCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <Topbar
          activeUser={activeUser}
          activeRoleView={activeRoleView}
          onChangeRoleView={setActiveRoleView}
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenChangePassword={() => setIsModalChangePasswordOpen(true)}
        />

        <main className="content-body">
          {activeTab === 'dashboard' && (
            <DashboardTab
              bahanBaku={bahanBaku}
              produk={produk}
              riwayatProduksi={riwayatProduksi}
              auditLog={auditLog}
              activeRoleView={activeRoleView}
              onNavigate={(tab) => setActiveTab(tab)}
              backendConnected={backendConnected}
            />
          )}

          {activeTab === 'bahan-baku' && (
            <BahanBakuTab
              bahanBaku={bahanBaku}
              kategoriList={kategoriBahanBaku}
              activeRoleView={activeRoleView}
              onOpenTambahBahan={() => { setEditingBahan(null); setIsModalBahanOpen(true); }}
              onOpenEditBahan={(b) => { setEditingBahan(b); setIsModalBahanOpen(true); }}
              onOpenStokMasuk={() => setIsModalStokMasukOpen(true)}
              onDeleteBahan={handleDeleteBahan}
              onOpenKelolaKategoriBahan={() => setIsModalKelolaKategoriBahanOpen(true)}
            />
          )}

          {activeTab === 'produk' && (
            <ProdukTab
              produk={produk}
              resep={resep}
              kategoriList={kategoriProduk}
              activeRoleView={activeRoleView}
              onOpenTambahProduk={() => { setEditingProduk(null); setIsModalProdukOpen(true); }}
              onOpenEditProduk={(p) => { setEditingProduk(p); setIsModalProdukOpen(true); }}
              onOpenProduksiSpesifik={(pId) => { setSelectedProduksiId(pId); setIsModalProduksiOpen(true); }}
              onOpenKelolaKategori={() => setIsModalKelolaKategoriOpen(true)}
              onDeleteProduk={handleDeleteProduk}
            />
          )}

          {activeTab === 'resep' && (
            <ResepTab
              produk={produk}
              bahanBaku={bahanBaku}
              resep={resep}
              activeRoleView={activeRoleView}
              onOpenTambahResepItem={(pId) => { setResepProdukId(pId); setIsModalResepItemOpen(true); }}
              onDeleteResepItem={handleDeleteResepItem}
            />
          )}

          {activeTab === 'riwayat-produksi' && (
            <RiwayatProduksiTab
              riwayatProduksi={riwayatProduksi}
              produk={produk}
            />
          )}

          {activeTab === 'kategori' && activeRoleView === 'ADMIN' && (
            <KategoriTab
              kategoriProduk={kategoriProduk}
              kategoriBahanBaku={kategoriBahanBaku}
              produk={produk}
              bahanBaku={bahanBaku}
              activeRoleView={activeRoleView}
              onSaveKategoriProduk={handleSaveKategori}
              onDeleteKategoriProduk={handleDeleteKategori}
              onSaveKategoriBahan={handleSaveKategoriBahan}
              onDeleteKategoriBahan={handleDeleteKategoriBahan}
            />
          )}

          {activeTab === 'user-approval' && (
            <UserApprovalTab
              users={users}
              onApproveUser={handleApproveUser}
              onRejectUser={handleRejectUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'audit-log' && (
            <AuditLogTab auditLog={auditLog} />
          )}
        </main>
      </div>

      {/* Modals Container */}
      <ModalBahan
        isOpen={isModalBahanOpen}
        onClose={() => setIsModalBahanOpen(false)}
        onSave={handleSaveBahan}
        editingItem={editingBahan}
        kategoriList={kategoriBahanBaku}
      />

      <ModalStokMasuk
        isOpen={isModalStokMasukOpen}
        onClose={() => setIsModalStokMasukOpen(false)}
        onSave={handleRestockBahan}
        bahanList={bahanBaku}
      />

      <ModalProduk
        isOpen={isModalProdukOpen}
        onClose={() => setIsModalProdukOpen(false)}
        onSave={handleSaveProduk}
        editingItem={editingProduk}
        kategoriList={kategoriProduk}
      />

      <ModalProduksi
        isOpen={isModalProduksiOpen}
        onClose={() => setIsModalProduksiOpen(false)}
        onExecute={handleExecuteProduksi}
        produkList={produk}
        bahanList={bahanBaku}
        resep={resep}
        defaultProdukId={selectedProduksiId}
      />

      <ModalResepItem
        isOpen={isModalResepItemOpen}
        onClose={() => setIsModalResepItemOpen(false)}
        onSave={handleSaveResepItem}
        bahanList={bahanBaku}
      />

      <ModalKelolaKategori
        isOpen={isModalKelolaKategoriOpen}
        onClose={() => setIsModalKelolaKategoriOpen(false)}
        kategoriProduk={kategoriProduk}
        onSaveKategori={handleSaveKategori}
        onDeleteKategori={handleDeleteKategori}
      />

      <ModalKelolaKategoriBahan
        isOpen={isModalKelolaKategoriBahanOpen}
        onClose={() => setIsModalKelolaKategoriBahanOpen(false)}
        kategoriBahan={kategoriBahanBaku}
        onSaveKategoriBahan={handleSaveKategoriBahan}
        onDeleteKategoriBahan={handleDeleteKategoriBahan}
      />

      <ModalChangePassword
        isOpen={isModalChangePasswordOpen}
        onClose={() => setIsModalChangePasswordOpen(false)}
        onChangePassword={handleChangePassword}
        activeUser={activeUser}
      />
    </div>
  );
}
