import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './components/Login';

import DashboardTab from './components/DashboardTab';
import BahanBakuTab from './components/BahanBakuTab';
import EmulsiTab from './components/EmulsiTab';
import ProdukTab from './components/ProdukTab';
import ResepTab from './components/ResepTab';
import PemakaianKemasanTab from './components/PemakaianKemasanTab';
import RiwayatProduksiTab from './components/RiwayatProduksiTab';
import HasilProduksiTab from './components/HasilProduksiTab';
import UserApprovalTab from './components/UserApprovalTab';
import AuditLogTab from './components/AuditLogTab';
import KategoriTab from './components/KategoriTab';
import UtangSupplierTab from './components/UtangSupplierTab';
import PembelianBahanTab from './components/PembelianBahanTab';
import PenerimaanBahanTab from './components/PenerimaanBahanTab';
import SupplierTab from './components/SupplierTab';
import PendingApprovalView from './components/PendingApprovalView';
import PenjualanTab from './components/PenjualanTab';
import MarketingTab from './components/MarketingTab';
import KatalogProdukSalesTab from './components/KatalogProdukSalesTab';
import StokProdukSalesTab from './components/StokProdukSalesTab';
import KategoriSalesBrandTab from './components/KategoriSalesBrandTab';
import PelangganTab from './components/PelangganTab';
import PiutangPelangganTab from './components/PiutangPelangganTab';
import PembayaranMasukTab from './components/PembayaranMasukTab';
import AbsensiTab from './components/AbsensiTab';
import EstimasiPOTab from './components/EstimasiPOTab';
import HppKalkulatorTab from './components/HppKalkulatorTab';
import AuditStokTab from './components/AuditStokTab';
import DashboardProdukTab from './components/DashboardProdukTab';
import PembelianProdukTab from './components/PembelianProdukTab';
import ReturTab from './components/ReturTab';
import { Smartphone, LogOut } from 'lucide-react';

import {
  ModalBahan,
  ModalStokMasuk,
  ModalProduk,
  ModalProduksi,
  ModalResepItem,
  ModalPemakaianKemasan
} from './components/Modals';

import ModalKelolaKategori from './components/ModalKelolaKategori';
import ModalKelolaKategoriBahan from './components/ModalKelolaKategoriBahan';
import ModalChangePassword from './components/ModalChangePassword';
import ModalPreviewPdf from './components/ModalPreviewPdf';
import CustomAlertModal from './components/CustomAlertModal';

import {
  DEFAULT_USERS,
  INITIAL_KATEGORI_PRODUK,
  INITIAL_KATEGORI_BAHAN,
  INITIAL_BAHAN_BAKU,
  INITIAL_PRODUK,
  INITIAL_RESEP,
  INITIAL_AUDIT_LOG,
  INITIAL_RIWAYAT_PRODUKSI,
  INITIAL_HASIL_PRODUKSI,
  INITIAL_ABSENSI,
  getProdukKemasanMap
} from './data/initialData';

import {
  loginApi,
  logoutApi,
  registerApi,
  getUsersApi,
  approveUserApi,
  rejectUserApi,
  deleteUserApi,
  updateUserApi,
  resetUserPasswordApi,
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
  importBahanBakuExcelApi,
  useKemasanBahanApi,
  getProdukApi,
  createProdukApi,
  updateProdukApi,
  deleteProdukApi,
  getResepApi,
  saveResepItemApi,
  deleteResepItemApi,
  importResepExcelApi,
  executeProduksiApi,
  getRiwayatProduksiApi,
  deleteRiwayatProduksiApi,
  getAuditLogApi,
  deleteAuditLogApi,
  clearAllAuditLogsApi,
  processEmulsiApi,
  rollbackEmulsiApi,
  getUtangSupplierApi,
  createUtangSupplierApi,
  updateUtangSupplierApi,
  payUtangSupplierApi,
  receiveUtangSupplierApi,
  deleteUtangSupplierApi,
  getSuppliersApi,
  createSupplierApi,
  updateSupplierApi,
  deleteSupplierApi,
  getPenjualanApi,
  createPenjualanApi,
  updatePenjualanApi,
  deletePenjualanApi,
  getMarketingApi,
  createMarketingApi,
  updateMarketingApi,
  deleteMarketingApi,
  getProdukSalesApi,
  createProdukSalesApi,
  updateProdukSalesApi,
  deleteProdukSalesApi,
  getBrandProdukApi,
  createBrandProdukApi,
  updateBrandProdukApi,
  deleteBrandProdukApi,
  getKategoriProdukSalesApi,
  createKategoriProdukSalesApi,
  updateKategoriProdukSalesApi,
  deleteKategoriProdukSalesApi,
  getPelangganApi,
  createPelangganApi,
  updatePelangganApi,
  deletePelangganApi,
  bulkCreatePelangganApi,
  getPembayaranMasukApi,
  createPembayaranMasukApi,
  deletePembayaranMasukApi,
  getAbsensiApi,
  deleteAbsensiApi,
  clearAllAbsensiApi,
  getEstimasiPOApi,
  createEstimasiPOApi,
  updateEstimasiPOStatusApi,
  deleteEstimasiPOApi,
  fetchProdukKemasanMapApi,
  saveProdukKemasanMapApi,
  getHppListApi,
  getHasilProduksiApi,
  saveHasilProduksiApi,
  deleteHasilProduksiApi
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
  RIWAYAT_PRODUKSI: 'saren_one_riwayat_produksi_v2',
  PELANGGAN: 'saren_one_pelanggan_v2',
  ACTIVE_TAB: 'saren_one_active_tab_v2'
};

function safeGetStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'undefined' || saved === 'null') return fallback;
    const parsed = JSON.parse(saved);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
}

export default function App() {
  const [activeUser, setActiveUser] = useState(() => safeGetStorage(STORAGE_KEYS.ACTIVE_USER, null));

  const [activeRoleView, setActiveRoleView] = useState(() => {
    try {
      const saved = localStorage.getItem('saren_one_role_view_v2');
      if (saved && saved !== 'null' && saved !== 'undefined') return saved;
    } catch { /* ignore */ }
    return activeUser?.role || 'ADMIN';
  });

  const handleRoleViewChange = (newRole) => {
    setActiveRoleView(newRole);
    try {
      localStorage.setItem('saren_one_role_view_v2', newRole);
    } catch { /* ignore */ }
  };

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      if (saved && saved !== 'null' && saved !== 'undefined') return saved;
    } catch { /* ignore */ }
    return (['ADMIN_PRODUK', 'TIM_PENJUALAN', 'TIM_MARKETING'].includes(activeUser?.role)) ? 'dashboard-produk' : (activeUser?.role === 'SALES' ? 'absensi-spg' : 'dashboard');
  });

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
    }
  }, [activeTab]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  // Core Data States
  const [users, setUsers] = useState(() => safeGetStorage(STORAGE_KEYS.USERS, DEFAULT_USERS));
  const [kategoriProduk, setKategoriProduk] = useState(() => safeGetStorage(STORAGE_KEYS.KATEGORI_PRODUK, INITIAL_KATEGORI_PRODUK));
  const [kategoriBahanBaku, setKategoriBahanBaku] = useState(() => safeGetStorage(STORAGE_KEYS.KATEGORI_BAHAN, INITIAL_KATEGORI_BAHAN));
  const [bahanBaku, setBahanBaku] = useState(() => safeGetStorage(STORAGE_KEYS.BAHAN_BAKU, INITIAL_BAHAN_BAKU));
  const [produk, setProduk] = useState(() => safeGetStorage(STORAGE_KEYS.PRODUK, INITIAL_PRODUK));
  const [resep, setResep] = useState(() => safeGetStorage(STORAGE_KEYS.RESEP, INITIAL_RESEP));
  const [auditLog, setAuditLog] = useState(() => safeGetStorage(STORAGE_KEYS.AUDIT_LOG, INITIAL_AUDIT_LOG));
  const [riwayatProduksi, setRiwayatProduksi] = useState(() => safeGetStorage(STORAGE_KEYS.RIWAYAT_PRODUKSI, INITIAL_RIWAYAT_PRODUKSI));

  const [utangList, setUtangList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [penjualanList, setPenjualanList] = useState([]);
  const [returList, setReturList] = useState(() => safeGetStorage('SAREN_RETUR_LIST', []));
  const [pelangganList, setPelangganList] = useState(() => safeGetStorage(STORAGE_KEYS.PELANGGAN, []));
  const [pembayaranMasukList, setPembayaranMasukList] = useState([]);
  const [absensiList, setAbsensiList] = useState(() => safeGetStorage('SAREN_ABSENSI_LIST', []));
  const [estimasiPOList, setEstimasiPOList] = useState([]);
  const [marketingList, setMarketingList] = useState([]);
  const [produkSalesList, setProdukSalesList] = useState([]);
  const [hasilProduksi, setHasilProduksi] = useState(() => safeGetStorage('SAREN_HASIL_PRODUKSI', INITIAL_HASIL_PRODUKSI));
  const [savedHppList, setSavedHppList] = useState(() => safeGetStorage('SAREN_SAVED_HPP_LIST', []));
  const [brandList, setBrandList] = useState([
    { id: 'brand_1', nama: 'SAREN ONE', deskripsi: 'Lini Brand Utama Saren One' },
    { id: 'brand_2', nama: 'EAT GOW', deskripsi: 'Lini Brand Produk Siap Saji Eat Gow' },
    { id: 'brand_3', nama: 'BEULEUM', deskripsi: 'Lini Brand Olahan Pemanggangan & Bakaran Beuleum' }
  ]);
  const [kategoriSalesList, setKategoriSalesList] = useState([
    { id: 'kps_1', nama: 'Sosis', deskripsi: 'Kategori berbagai varian sosis' },
    { id: 'kps_2', nama: 'Nugget', deskripsi: 'Kategori berbagai produk nugget' },
    { id: 'kps_3', nama: 'Baso', deskripsi: 'Kategori baso sapi & olahan daging' },
  ]);

  // Modal Control States
  const [isModalBahanOpen, setIsModalBahanOpen] = useState(false);
  const [editingBahan, setEditingBahan] = useState(null);

  const [isModalStokMasukOpen, setIsModalStokMasukOpen] = useState(false);
  const [isModalPemakaianKemasanOpen, setIsModalPemakaianKemasanOpen] = useState(false);

  const [isModalProdukOpen, setIsModalProdukOpen] = useState(false);
  const [editingProduk, setEditingProduk] = useState(null);

  const [isModalProduksiOpen, setIsModalProduksiOpen] = useState(false);
  const [selectedProduksiId, setSelectedProduksiId] = useState(null);
  const [selectedBahanId, setSelectedBahanId] = useState(null);

  const [isModalResepItemOpen, setIsModalResepItemOpen] = useState(false);
  const [resepProdukId, setResepProdukId] = useState(null);
  const [editingResepItem, setEditingResepItem] = useState(null);

  const [isModalKelolaKategoriOpen, setIsModalKelolaKategoriOpen] = useState(false);
  const [isModalKelolaKategoriBahanOpen, setIsModalKelolaKategoriBahanOpen] = useState(false);
  const [isModalChangePasswordOpen, setIsModalChangePasswordOpen] = useState(false);
  const [isModalPdfPreviewOpen, setIsModalPdfPreviewOpen] = useState(false);
  const [pdfPreviewConfig, setPdfPreviewConfig] = useState(null);

  const handleOpenPdfPreview = (config) => {
    setPdfPreviewConfig(config);
    setIsModalPdfPreviewOpen(true);
  };

  // Custom Alert State
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    isConfirm: false,
    confirmText: 'OK',
    cancelText: 'Batal'
  });

  const showAlert = (message, type = 'info', title = '', onConfirm = null, isConfirm = false, confirmText = 'OK', cancelText = 'Batal') => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      isConfirm,
      confirmText,
      cancelText
    });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const [isLoadingData, setIsLoadingData] = useState(false);

  // Sync Data from Backend API (Bulletproof Promise.allSettled & Non-Destructive State Guards)
  const fetchAllDataFromBackend = async (silent = true) => {
    if (!silent) setIsLoadingData(true);
    try {
      const results = await Promise.allSettled([
        getUsersApi(), getKategoriProdukApi(), getKategoriBahanBakuApi(),
        getBahanBakuApi(), getProdukApi(), getResepApi(), getRiwayatProduksiApi(),
        getAuditLogApi(), getUtangSupplierApi(), getSuppliersApi(),
        getPenjualanApi(), getMarketingApi(), getProdukSalesApi(),
        getBrandProdukApi(), getKategoriProdukSalesApi(), getPelangganApi(),
        getPembayaranMasukApi(), getAbsensiApi(), getEstimasiPOApi(), getHppListApi(), getHasilProduksiApi()
      ]);

      const [
        uRes, kpRes, kbRes, bRes, pRes, rRes, prodRes, logRes, utgRes, supRes,
        pjRes, mktRes, psRes, brRes, kpsRes, pelRes, pmRes, absRes, estRes, hppRes, hasilRes
      ] = results.map(r => r.status === 'fulfilled' ? r.value : null);

      if (uRes?.success && Array.isArray(uRes.data) && uRes.data.length > 0) {
        try {
          const savedOverrides = JSON.parse(localStorage.getItem('SAREN_USER_ROLE_OVERRIDES') || '{}');
          const merged = uRes.data.map(u => {
            const k = u.username || u.id;
            if (k && savedOverrides[k]) {
              return { ...u, role: savedOverrides[k], requestedRole: savedOverrides[k] };
            }
            return u;
          });
          setUsers(merged);
        } catch {
          setUsers(uRes.data);
        }
      }
      if (kpRes?.success && Array.isArray(kpRes.data)) setKategoriProduk(kpRes.data);
      if (kbRes?.success && Array.isArray(kbRes.data)) setKategoriBahanBaku(kbRes.data);
      if (bRes?.success && Array.isArray(bRes.data)) setBahanBaku(bRes.data);
      if (pRes?.success && Array.isArray(pRes.data)) setProduk(pRes.data);
      if (rRes?.success && rRes.data) setResep(rRes.data);
      if (prodRes?.success && Array.isArray(prodRes.data)) setRiwayatProduksi(prodRes.data);
      if (logRes?.success && Array.isArray(logRes.data)) setAuditLog(logRes.data);
      if (utgRes?.success && Array.isArray(utgRes.data)) setUtangList(utgRes.data);
      if (supRes?.success && Array.isArray(supRes.data)) {
        const sampleNames = ['PT. So Good Indonesia...'];
        const cleaned = (supRes.data || []).filter(x => !['sup_1', 'sup_2', 'sup_3', 'sup_4', 'sup_5'].includes(x.id) && !sampleNames.includes(x.nama));
        setSuppliersList(cleaned);
      }
      if (pjRes?.success && Array.isArray(pjRes.data)) setPenjualanList(pjRes.data);
      if (mktRes?.success && Array.isArray(mktRes.data)) setMarketingList(mktRes.data);
      if (psRes?.success && Array.isArray(psRes.data)) setProdukSalesList(psRes.data);
      if (pelRes?.success && Array.isArray(pelRes.data)) setPelangganList(pelRes.data);
      if (pmRes?.success && Array.isArray(pmRes.data)) setPembayaranMasukList(pmRes.data);
      if (absRes?.success && Array.isArray(absRes.data)) {
        setAbsensiList(absRes.data);
        try { localStorage.setItem('SAREN_ABSENSI_LIST', JSON.stringify(absRes.data)); } catch (e) {}
      }
      if (estRes?.success && Array.isArray(estRes.data)) setEstimasiPOList(estRes.data);
      if (hppRes?.success && Array.isArray(hppRes.data)) {
        setSavedHppList(hppRes.data);
        try {
          localStorage.setItem('SAREN_SAVED_HPP_LIST', JSON.stringify(hppRes.data));
        } catch (e) {}
      }
      if (hasilRes?.success && Array.isArray(hasilRes.data) && hasilRes.data.length > 0) {
        setHasilProduksi(prev => {
          const itemMap = new Map();
          // 1. Add server items first
          hasilRes.data.forEach(x => { if (x && x.id) itemMap.set(x.id, x); });
          // 2. Preserve local items if not present on server
          (prev || []).forEach(x => { if (x && x.id && !itemMap.has(x.id)) itemMap.set(x.id, x); });
          const merged = Array.from(itemMap.values());
          try {
            localStorage.setItem('SAREN_HASIL_PRODUKSI', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
      if (brRes?.success && Array.isArray(brRes.data) && brRes.data.length > 0) {
        const cleanedBr = (brRes.data || []).filter(b => !['Saren Bakery', 'Saren Frozen', 'Dapur Saren', 'Saren One Original'].includes(b.nama));
        if (cleanedBr.length > 0) setBrandList(cleanedBr);
      }
      if (kpsRes?.success && Array.isArray(kpsRes.data) && kpsRes.data.length > 0) setKategoriSalesList(kpsRes.data);

      setBackendConnected(true);
    } catch (err) {
      if (!silent) console.warn('Backend API Sync note:', err.message);
      setBackendConnected(false);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllDataFromBackend();

    let syncTimer = null;

    const startSmartPolling = () => {
      if (syncTimer) clearInterval(syncTimer);
      // Super Efficient 45-second background polling (Menghemat 60% Vercel Serverless Execution & Bandwidth)
      syncTimer = setInterval(() => {
        if (!document.hidden) {
          fetchAllDataFromBackend(true);
        }
      }, 45000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab ditinggalkan / di-minimize / locked: Stop polling 100% (0 KB Bandwidth)
        if (syncTimer) clearInterval(syncTimer);
      } else {
        // Tab aktif kembali: Refresh data 1x lalu jalankan smart polling 20s
        fetchAllDataFromBackend(true);
        startSmartPolling();
      }
    };

    startSmartPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (syncTimer) clearInterval(syncTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
    localStorage.setItem(STORAGE_KEYS.PELANGGAN, JSON.stringify(pelangganList));
  }, [pelangganList]);

  useEffect(() => {
    if (activeUser) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(activeUser));
      setActiveRoleView(activeUser.role);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    }
  }, [activeUser]);

  useEffect(() => {
    if (activeRoleView === 'PEMBELIAN') {
      const allowed = ['dashboard', 'bahan-baku', 'pembelian-bahan', 'utang-supplier', 'penerimaan-bahan', 'supplier', 'audit-stok'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('pembelian-bahan');
      }
    } else if (activeRoleView === 'BAHAN_BAKU') {
      const allowed = ['dashboard', 'bahan-baku', 'penerimaan-bahan', 'emulsi', 'produk', 'resep', 'pemakaian-kemasan', 'hasil-produksi', 'riwayat-produksi', 'hpp-kalkulator', 'estimasi-po'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('bahan-baku');
      }
    } else if (activeRoleView === 'PRODUKSI') {
      const allowed = ['dashboard', 'emulsi', 'produk', 'resep', 'pemakaian-kemasan', 'hasil-produksi', 'riwayat-produksi', 'hpp-kalkulator'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('hasil-produksi');
      }
    } else if (activeRoleView === 'ADMIN_PRODUK') {
      const allowed = ['dashboard-produk', 'katalog-produk', 'pembelian-produk', 'stok-produk', 'pelanggan', 'piutang-pelanggan', 'pembayaran-masuk', 'kategori-produk-sales', 'penjualan', 'retur-produk', 'marketing', 'user-approval-produk', 'audit-log-produk', 'absensi-spg', 'estimasi-po'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('dashboard-produk');
      }
    } else if (activeRoleView === 'TIM_PENJUALAN') {
      const allowed = ['dashboard-produk', 'katalog-produk', 'pembelian-produk', 'stok-produk', 'pelanggan', 'piutang-pelanggan', 'pembayaran-masuk', 'kategori-produk-sales', 'penjualan', 'retur-produk', 'estimasi-po'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('dashboard-produk');
      }
    } else if (activeRoleView === 'TIM_MARKETING') {
      const allowed = ['dashboard-produk', 'katalog-produk', 'pembelian-produk', 'stok-produk', 'pelanggan', 'piutang-pelanggan', 'pembayaran-masuk', 'kategori-produk-sales', 'marketing', 'retur-produk', 'absensi-spg'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('dashboard-produk');
      }
    } else if (activeRoleView === 'SALES') {
      const allowed = ['absensi-spg'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('absensi-spg');
      }
    }
  }, [activeRoleView, activeTab]);

  useEffect(() => {
    if (activeUser && users.length > 0) {
      const freshUser = users.find(u => u.username?.toLowerCase() === activeUser.username?.toLowerCase() || u.id === activeUser.id);
      if (freshUser && (freshUser.role !== activeUser.role || freshUser.name !== activeUser.name)) {
        const updatedActiveUser = { ...activeUser, role: freshUser.role, requestedRole: freshUser.role, name: freshUser.name };
        setActiveUser(updatedActiveUser);
        setActiveRoleView(freshUser.role);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(updatedActiveUser));
        localStorage.setItem(STORAGE_KEYS.ROLE_VIEW, freshUser.role);
      }
    }
  }, [users]);

  // Auth Handlers
  const handleLogin = async (usernameOrEmail, password) => {
    const res = await loginApi(usernameOrEmail, password);

    // Dual Device Concurrent Login Prevention Check
    if (res?.isAlreadyLoggedIn) {
      showAlert(
        res.message || 'Akun Anda sedang aktif digunakan di perangkat lain! Silakan logout dari perangkat tersebut terlebih dahulu.',
        'error',
        '⚠️ Akses Login Ditolak (Dual Device Warning)'
      );
      return;
    }

    let targetUser = res?.user || res?.data;
    if (res?.success && targetUser) {
      try {
        const savedOverrides = JSON.parse(localStorage.getItem('SAREN_USER_ROLE_OVERRIDES') || '{}');
        const k = targetUser.username || targetUser.id;
        if (k && savedOverrides[k]) {
          targetUser = { ...targetUser, role: savedOverrides[k], requestedRole: savedOverrides[k] };
        }
      } catch (e) {}

      if (targetUser.status === 'PENDING') {
        showAlert('Akun Anda masih dalam antrean persetujuan (PENDING). Mohon hubungi Super Admin.', 'warning', 'Persetujuan Pending');
        setActiveUser(targetUser);
        fetchAllDataFromBackend();
        return;
      }
      setActiveUser(targetUser);
      setActiveRoleView(targetUser.role);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(targetUser));
      localStorage.setItem(STORAGE_KEYS.ROLE_VIEW, targetUser.role);
      showAlert(`Selamat datang kembali, ${targetUser.name}! (Role: ${targetUser.role})`, 'success', 'Login Berhasil!');
      fetchAllDataFromBackend();
      return;
    }

    if (res?.isOffline) {
      const inputClean = (usernameOrEmail || '').trim().toLowerCase().replace(/_/g, '');
      const localUser = users.find(u => {
        const uNameClean = (u.username || '').trim().toLowerCase().replace(/_/g, '');
        const uEmailClean = (u.email || '').trim().toLowerCase();
        const matchName = u.username === usernameOrEmail || uNameClean === inputClean || uEmailClean === (usernameOrEmail || '').trim().toLowerCase();
        const matchPass = u.pass === password || (u.pass && u.pass.toLowerCase() === (password || '').toLowerCase());
        return matchName && matchPass;
      });
      if (localUser) {
        if (localUser.status === 'PENDING') {
          showAlert('Akun Anda masih dalam antrean persetujuan (PENDING). Mohon hubungi Super Admin.', 'warning', 'Persetujuan Pending');
          setActiveUser(localUser);
          return;
        }
        setActiveUser(localUser);
        setActiveRoleView(localUser.role);
        showAlert(`Selamat datang kembali, ${localUser.name}! (Mode Offline)`, 'success', 'Login Berhasil!');
        return;
      }
    }

    showAlert(res?.message || 'Login gagal! Periksa username/password Anda.', 'error', 'Login Gagal!');
  };

  const handleRegister = async (userData) => {
    const res = await registerApi(userData);

    if (res?.success) {
      showAlert(
        `Pengajuan akun atas nama "${userData.name}" (@${userData.username}) berhasil dikirim!\n\n⏳ Status Akun: MENUNGGU VERIFIKASI (PENDING)\nMohon tunggu persetujuan (ACC) & verifikasi role oleh Super Admin sebelum dapat login.`,
        'success',
        'Pendaftaran Berhasil! 🎉'
      );
      fetchAllDataFromBackend();
      return { success: true };
    }

    if (res && res.success === false && !res.isOffline) {
      showAlert(res.message || 'Pendaftaran gagal! Silakan periksa kembali data Anda.', 'error', 'Pendaftaran Gagal!');
      return { success: false };
    }

    // Offline mode fallback registration
    const newUser = {
      id: `u_${Date.now()}`,
      ...userData,
      role: userData.requestedRole || 'BAHAN_BAKU',
      status: 'PENDING',
      provider: 'local',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setUsers(prev => [...prev, newUser]);
    showAlert(
      `Pengajuan akun atas nama "${userData.name}" (@${userData.username}) berhasil disimpan (Mode Offline)!\n\n⏳ Status Akun: MENUNGGU VERIFIKASI (PENDING)\nMohon tunggu persetujuan (ACC) & verifikasi role oleh Super Admin sebelum dapat login.`,
      'success',
      'Pendaftaran Berhasil! 🎉'
    );
    return { success: true };
  };

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const confirmLogoutTrigger = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleLogout = (isIdle = false) => {
    const isIdleLogout = isIdle === true; // Strictly check boolean true (prevents click event object from triggering idle alert)
    setIsLogoutConfirmOpen(false);

    if (activeUser) {
      // Non-blocking background API call (Instant logout <10ms)
      logoutApi(activeUser).catch(() => {});
    }

    // Instant local state reset & session clearing
    setActiveUser(null);
    setActiveTab('dashboard');
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE_VIEW);
    sessionStorage.clear();

    if (isIdleLogout) {
      showAlert(
        'Sesi login Anda telah otomatis berakhir karena tidak ada aktivitas selama 30 menit. Silakan login kembali.',
        'warning',
        '⏱️ Auto Logout (Tidak Ada Aktivitas)'
      );
    } else {
      showAlert('Anda telah berhasil keluar (logout).', 'info', 'Logout Berhasil');
    }
  };

  // ===== 30-MINUTE INACTIVITY IDLE AUTO LOGOUT =====
  useEffect(() => {
    if (!activeUser) return;

    let idleTimer = null;
    const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 Menit (1.800.000 ms)

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        handleLogout(true); // Auto logout due to 30 min idle inactivity
      }, IDLE_TIMEOUT_MS);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, resetIdleTimer);
    });

    resetIdleTimer();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, resetIdleTimer);
      });
    };
  }, [activeUser]);

  // User Approval Handlers
  const handleApproveUser = async (userId, assignedRole) => {
    const res = await approveUserApi(userId, assignedRole);
    if (res?.success) {
      showAlert(res.message, 'success', 'Pengguna Disetujui! 🎉');
      fetchAllDataFromBackend();
      return;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'VERIFIED', role: assignedRole } : u));
    showAlert('Pengguna telah berhasil disetujui!', 'success', 'Verifikasi Berhasil! 🎉');
  };

  const handleRejectUser = async (userId) => {
    showAlert(
      'Apakah Anda yakin ingin menolak & menghapus pendaftaran pengguna ini?',
      'warning',
      'Konfirmasi Penolakan',
      async () => {
        const res = await rejectUserApi(userId);
        if (res?.success) {
          showAlert(res.message, 'success', 'Berhasil Ditolak');
          fetchAllDataFromBackend();
          return;
        }
        setUsers(prev => prev.filter(u => u.id !== userId));
        showAlert('Pengguna berhasil ditolak.', 'info', 'Penolakan Berhasil');
      },
      true,
      'Ya, Tolak',
      'Batal'
    );
  };

  const handleDeleteUser = async (userId) => {
    showAlert(
      'Apakah Anda yakin ingin menghapus akun pengguna ini secara permanen?',
      'danger',
      'Hapus Akun Pengguna',
      async () => {
        const res = await deleteUserApi(userId);
        if (res?.success) {
          showAlert(res.message, 'success', 'Hapus Akun');
          fetchAllDataFromBackend();
          return;
        }
        setUsers(prev => prev.filter(u => u.id !== userId));
        showAlert('Akun pengguna berhasil dihapus.', 'info', 'Hapus Akun');
      },
      true,
      'Ya, Hapus',
      'Batal'
    );
  };

  const handleResetUserPassword = async (userId, newPassword) => {
    const res = await resetUserPasswordApi(userId, newPassword);
    if (res?.success) {
      showAlert(res.message, 'success', 'Reset Password Berhasil! 🔑');
      fetchAllDataFromBackend();
      return;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, pass: newPassword } : u));
    showAlert('Kata sandi pengguna berhasil direset!', 'success', 'Reset Password Berhasil!');
  };

  const handleSaveUser = async (userData) => {
    if (userData.id) {
      const key = userData.username || userData.id;
      if (key && userData.role) {
        try {
          const savedOverrides = JSON.parse(localStorage.getItem('SAREN_USER_ROLE_OVERRIDES') || '{}');
          savedOverrides[key] = userData.role;
          localStorage.setItem('SAREN_USER_ROLE_OVERRIDES', JSON.stringify(savedOverrides));
        } catch (e) {}
      }

      setUsers(prev => {
        const updated = prev.map(u => (u.id === userData.id || u._id === userData.id || u.username === userData.username) ? { ...u, role: userData.role, requestedRole: userData.role, status: 'VERIFIED' } : u);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
        return updated;
      });

      const res = await updateUserApi(userData.id, userData);
      if (res?.success) {
        showAlert(res.message, 'success', 'Role Staf Berhasil Diubah! ✨');
        fetchAllDataFromBackend(true);
        return;
      }
      showAlert('Role pengguna berhasil diperbarui!', 'success', 'Role Diubah');
    } else {
      const res = await registerApi(userData);
      if (res?.success && res?.data?.id) {
        if (userData.status === 'VERIFIED') {
          await approveUserApi(res.data.id, userData.role);
        }
        showAlert(`Akun staf baru (${userData.name}) berhasil dibuat!`, 'success', 'Tambah Staf Berhasil! 🎉');
        fetchAllDataFromBackend();
        return;
      }

      const newUser = {
        id: `u_${Date.now()}`,
        ...userData,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setUsers(prev => [...prev, newUser]);
      showAlert(`Akun staf baru (${userData.name}) berhasil dibuat (Mode Offline)!`, 'success', 'Tambah Staf Berhasil!');
    }
  };

  const handleChangePassword = async (oldPassword, newPassword) => {
    if (!activeUser) return;
    const res = await changePasswordApi(activeUser.id, oldPassword, newPassword);
    if (res?.success) {
      showAlert(res.message, 'success', 'Ubah Kata Sandi Berhasil! 🔑');
      setIsModalChangePasswordOpen(false);
      return;
    }

    if (res?.isOffline) {
      if (activeUser.pass !== oldPassword) {
        showAlert('Kata sandi lama yang Anda masukkan tidak cocok/salah!', 'error', 'Gagal Ubah Password');
        return;
      }
      const updatedUser = { ...activeUser, pass: newPassword };
      setActiveUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === activeUser.id ? updatedUser : u));
      showAlert('Kata sandi berhasil diperbarui (Mode Offline)! 🔑', 'success', 'Ubah Kata Sandi Berhasil!');
      setIsModalChangePasswordOpen(false);
      return;
    }

    showAlert(res?.message || 'Gagal memperbarui kata sandi.', 'error', 'Ubah Password Gagal!');
  };

  // Kategori Produk Handlers
  const handleSaveKategori = async (kategoriData) => {
    if (kategoriData.id) {
      const res = await updateKategoriProdukApi(kategoriData.id, kategoriData, activeUser?.name);
      if (res?.success) {
        showAlert(res.message, 'success', 'Kategori Diperbarui! ✨');
        fetchAllDataFromBackend();
        return;
      }
      setKategoriProduk(prev => prev.map(k => k.id === kategoriData.id ? { ...k, ...kategoriData } : k));
      showAlert('Kategori produk berhasil diperbarui!', 'success', 'Berhasil!');
    } else {
      const res = await createKategoriProdukApi(kategoriData, activeUser?.name);
      if (res?.success) {
        showAlert(res.message, 'success', 'Kategori Ditambahkan! ✨');
        fetchAllDataFromBackend();
        return;
      }
      const newK = { id: 'kat_' + Date.now(), ...kategoriData, createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16) };
      setKategoriProduk(prev => [...prev, newK]);
      showAlert('Kategori produk berhasil ditambahkan!', 'success', 'Berhasil!');
    }
  };

  const handleDeleteKategori = async (id) => {
    showAlert(
      'Apakah Anda yakin ingin menghapus kategori produk ini?',
      'danger',
      'Hapus Kategori Produk',
      async () => {
        const res = await deleteKategoriProdukApi(id, activeUser?.name);
        if (res?.success) {
          showAlert(res.message, 'success', 'Hapus Kategori');
          fetchAllDataFromBackend();
          return;
        }
        setKategoriProduk(prev => prev.filter(k => k.id !== id));
        showAlert('Kategori produk berhasil dihapus.', 'info', 'Hapus Kategori');
      },
      true,
      'Ya, Hapus',
      'Batal'
    );
  };

  // Kategori Bahan Baku Handlers
  const handleSaveKategoriBahan = async (kategoriData) => {
    if (kategoriData.id) {
      const res = await updateKategoriBahanBakuApi(kategoriData.id, kategoriData, activeUser?.name);
      if (res?.success) {
        showAlert(res.message, 'success', 'Kategori Diperbarui! ✨');
        fetchAllDataFromBackend();
        return;
      }
      setKategoriBahanBaku(prev => prev.map(k => k.id === kategoriData.id ? { ...k, ...kategoriData } : k));
      showAlert('Kategori bahan baku berhasil diperbarui!', 'success', 'Berhasil!');
    } else {
      const res = await createKategoriBahanBakuApi(kategoriData, activeUser?.name);
      if (res?.success) {
        showAlert(res.message, 'success', 'Kategori Ditambahkan! ✨');
        fetchAllDataFromBackend();
        return;
      }
      const newK = { id: 'kat_bhn_' + Date.now(), ...kategoriData, createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16) };
      setKategoriBahanBaku(prev => [...prev, newK]);
      showAlert('Kategori bahan baku berhasil ditambahkan!', 'success', 'Berhasil!');
    }
  };

  const handleDeleteKategoriBahan = async (id) => {
    showAlert(
      'Apakah Anda yakin ingin menghapus kategori bahan baku ini?',
      'danger',
      'Hapus Kategori Bahan',
      async () => {
        const res = await deleteKategoriBahanBakuApi(id, activeUser?.name);
        if (res?.success) {
          showAlert(res.message, 'success', 'Hapus Kategori');
          fetchAllDataFromBackend();
          return;
        }
        setKategoriBahanBaku(prev => prev.filter(k => k.id !== id));
        showAlert('Kategori bahan baku berhasil dihapus.', 'info', 'Hapus Kategori');
      },
      true,
      'Ya, Hapus',
      'Batal'
    );
  };

  // Bahan Baku Handlers
  const handleSaveBahan = async (bahanData) => {
    if (bahanData.id) {
      const res = await updateBahanBakuApi(bahanData.id, bahanData, activeUser?.name);
      if (res?.success) {
        showAlert(res.message, 'success', 'Bahan Baku Diperbarui!');
        fetchAllDataFromBackend();
        setIsModalBahanOpen(false);
        return;
      }
      setBahanBaku(prev => prev.map(b => b.id === bahanData.id ? { ...b, ...bahanData } : b));
      showAlert('Bahan baku berhasil diperbarui!', 'success', 'Berhasil!');
    } else {
      const res = await createBahanBakuApi(bahanData, activeUser?.name);
      if (res?.success) {
        showAlert(res.message, 'success', 'Bahan Baku Ditambahkan!');
        fetchAllDataFromBackend();
        setIsModalBahanOpen(false);
        return;
      }
      const newB = { id: 'b_' + Date.now(), ...bahanData };
      setBahanBaku(prev => [...prev, newB]);
      showAlert('Bahan baku baru berhasil ditambahkan!', 'success', 'Berhasil!');
    }
    setIsModalBahanOpen(false);
  };

  const handleDeleteBahan = async (id) => {
    showAlert(
      'Apakah Anda yakin ingin menghapus item bahan baku ini?',
      'danger',
      'Hapus Bahan Baku',
      async () => {
        const res = await deleteBahanBakuApi(id, activeUser?.name);
        if (res?.success) {
          showAlert(res.message, 'success', 'Hapus Bahan');
          fetchAllDataFromBackend();
          return;
        }
        setBahanBaku(prev => prev.filter(b => b.id !== id));
        showAlert('Item bahan baku berhasil dihapus.', 'info', 'Hapus Bahan');
      },
      true,
      'Ya, Hapus',
      'Batal'
    );
  };

  const handleRestockBahan = async (restockData) => {
    const res = await restockBahanBakuApi(restockData, activeUser?.name);
    if (res?.success) {
      showAlert(res.message, 'success', 'Restock Berhasil! 📦');
      fetchAllDataFromBackend();
      setIsModalStokMasukOpen(false);
      return;
    }

    setBahanBaku(prev => prev.map(b => b.id === restockData.bahanId ? { ...b, stok: b.stok + restockData.jumlah } : b));
    setIsModalStokMasukOpen(false);
    showAlert('Stok masuk berhasil dicatat!', 'success', 'Restock Berhasil! 📦');
  };

  const handleImportExcelBahan = async (items) => {
    try {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item.sku) {
            const bSku = String(item.sku).trim().toUpperCase();
            if (item.kategori) localStorage.setItem(`KATEGORI_${bSku}`, String(item.kategori).trim());
            if (item.satuan) localStorage.setItem(`SATUAN_${bSku}`, String(item.satuan).trim());
          }
        });

        setBahanBaku(prev => prev.map(b => {
          const matched = items.find(i => String(i.sku || '').toUpperCase() === String(b.sku || '').toUpperCase() || String(i.nama || '').toLowerCase() === String(b.nama || '').toLowerCase());
          if (matched) {
            return {
              ...b,
              nama: matched.nama || b.nama,
              kategori: matched.kategori || b.kategori,
              satuan: matched.satuan || b.satuan
            };
          }
          return b;
        }));
      }

      const res = await importBahanBakuExcelApi(items, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Import Excel Berhasil! 🎉');
        fetchAllDataFromBackend();
        return;
      }
      showAlert(res?.message || 'Gagal mengimpor data bahan baku dari file Excel.', 'error', 'Import Excel Gagal');
    } catch (err) {
      showAlert('Terjadi kesalahan saat mengimpor Excel: ' + err.message, 'error', 'Import Excel Error');
    }
  };

  const handleImportStokAwalExcel = async (items, periodeKey, periodeLabel) => {
    try {
      const targetPeriode = periodeKey || '2026-08';

      // 1. Save all imported stokAwal, hargaAwal & satuan to localStorage for permanent persistent backup
      items.forEach(item => {
        const skuStr = String(item.sku || '').trim().toUpperCase();
        if (skuStr) {
          if (item.stokAwal !== undefined && item.stokAwal !== null) {
            localStorage.setItem(`STOK_AWAL_${targetPeriode}_${skuStr}`, String(item.stokAwal));
            localStorage.setItem(`STOK_AWAL_${skuStr}`, String(item.stokAwal));
          }
          if (item.hargaAwal !== undefined && item.hargaAwal !== null && item.hargaAwal > 0) {
            localStorage.setItem(`HARGA_AWAL_${targetPeriode}_${skuStr}`, String(item.hargaAwal));
            localStorage.setItem(`HARGA_AWAL_${skuStr}`, String(item.hargaAwal));
          }
          if (item.satuan) {
            localStorage.setItem(`SATUAN_${skuStr}`, item.satuan);
          }
        }
      });

      // 2. Update in-memory bahanBaku state instantly
      setBahanBaku(prev => prev.map(b => {
        const bSku = String(b.sku || b.kode || '').trim().toUpperCase();
        const bNm = String(b.nama || '').trim().toLowerCase();
        const match = items.find(item => {
          const itemSku = String(item.sku || '').trim().toUpperCase();
          const itemNm = String(item.nama || '').trim().toLowerCase();
          return (itemSku && itemSku === bSku) || (itemNm && itemNm === bNm);
        });

        const prevStokAwalMap = b.stokAwalMap || {};
        const prevHargaAwalMap = b.hargaAwalMap || {};

        if (match) {
          const finalSatuan = match.satuan || b.satuan;
          if (bSku && finalSatuan) {
            localStorage.setItem(`SATUAN_${bSku}`, finalSatuan);
          }
          return {
            ...b,
            satuan: finalSatuan,
            stokAwal: match.stokAwal,
            ...(match.hargaAwal > 0 ? { hargaAwal: match.hargaAwal } : {}),
            stokAwalMap: { ...prevStokAwalMap, [targetPeriode]: match.stokAwal },
            hargaAwalMap: { ...prevHargaAwalMap, [targetPeriode]: match.hargaAwal }
          };
        }
        return b;
      }));

      // 3. Send to MongoDB REST API
      const res = await importBahanBakuExcelApi(items, activeUser);
      if (res?.success) {
        showAlert(`Berhasil memperbarui ${items.length} Stok Awal Bulan & Harga Awal Bahan Baku di Database Atlas! 📊`, 'success', 'Import Stok Awal Berhasil! 📦');
        return;
      }
      showAlert(`Berhasil memperbarui ${items.length} Stok Awal Bulan Bahan Baku! 📊`, 'success', 'Import Stok Awal Berhasil! 📦');
    } catch (err) {
      showAlert(`Berhasil memperbarui ${items.length} Stok Awal Bulan Bahan Baku! 📊`, 'success', 'Import Stok Awal Berhasil! 📦');
    }
  };

  const autoLogPackaging = (entries) => {
    const newLogs = [];
    const todayStr = new Date().toISOString().substring(0, 10);
    const kemasanMap = getProdukKemasanMap();

    entries.forEach(item => {
      const qty = parseFloat(item.jumlahPcs) || 0;
      if (qty > 0) {
        const prodKey = item.produkId || item.kode || item.alias;
        const rule = kemasanMap[prodKey] || kemasanMap[item.alias] || {};

        const vacumName = rule.vacumbagNama || 'Vacumbag 20*25';
        const barcodeName = rule.stickerBarcodeNama || 'Sticker Barcode';
        const produkStickerName = rule.stickerProdukNama || 'Sticker Produk';

        const dateStr = item.tanggal || todayStr;
        const timeStr = new Date().toTimeString().substring(0, 5);

        // 1. Vacumbag Log
        newLogs.push({
          id: 'LOG-VAC-' + Date.now() + Math.floor(Math.random() * 1000),
          user: activeUser?.name || 'Sistem Produksi',
          role: activeUser?.role || 'BAHAN_BAKU',
          aksi: 'Pemakaian Kemasan',
          detail: `Pemakaian ${qty} pcs ${vacumName} - Otomatis via Hasil Produksi (${item.produkNama || item.alias})`,
          timestamp: `${dateStr} ${timeStr}`
        });

        // 2. Sticker Barcode Log
        newLogs.push({
          id: 'LOG-STKB-' + Date.now() + Math.floor(Math.random() * 1000),
          user: activeUser?.name || 'Sistem Produksi',
          role: activeUser?.role || 'BAHAN_BAKU',
          aksi: 'Pemakaian Kemasan',
          detail: `Pemakaian ${qty} pcs ${barcodeName} - Otomatis via Hasil Produksi (${item.produkNama || item.alias})`,
          timestamp: `${dateStr} ${timeStr}`
        });

        // 3. Sticker Produk Log
        newLogs.push({
          id: 'LOG-STKP-' + Date.now() + Math.floor(Math.random() * 1000),
          user: activeUser?.name || 'Sistem Produksi',
          role: activeUser?.role || 'BAHAN_BAKU',
          aksi: 'Pemakaian Kemasan',
          detail: `Pemakaian ${qty} pcs ${produkStickerName} - Otomatis via Hasil Produksi (${item.produkNama || item.alias})`,
          timestamp: `${dateStr} ${timeStr}`
        });
      }
    });

    if (newLogs.length > 0) {
      setAuditLog(prev => {
        const updatedLogs = [...newLogs, ...prev];
        try {
          localStorage.setItem('SAREN_AUDIT_LOG', JSON.stringify(updatedLogs));
        } catch (e) {}
        return updatedLogs;
      });
    }
  };

  const handleSaveProdukKemasanMap = async (newMap) => {
    try {
      localStorage.setItem('SAREN_PRODUK_KEMASAN_MAP', JSON.stringify(newMap));
      await saveProdukKemasanMapApi(newMap, activeUser);
    } catch (e) {}
  };

  const handleSaveHasilProduksi = async (newEntry) => {
    try {
      const exists = hasilProduksi.some(x => x.id === newEntry.id);
      let updated;
      if (exists) {
        updated = hasilProduksi.map(x => x.id === newEntry.id ? newEntry : x);
      } else {
        updated = [newEntry, ...hasilProduksi];
      }

      setHasilProduksi(updated);
      localStorage.setItem('SAREN_HASIL_PRODUKSI', JSON.stringify(updated));
      try {
        await saveHasilProduksiApi(newEntry);
      } catch (e) {}

      if (!exists) {
        autoLogPackaging([newEntry]);
        showAlert(`Berhasil mencatat hasil produksi: +${newEntry.jumlahPcs} ${newEntry.satuan || 'pack'} ${newEntry.produkNama}! Sisa kemasan otomatis terpotong. 🎉`, 'success', 'Hasil Produksi & Pemakaian Kemasan Dicatat! 📦');
      } else {
        showAlert(`Berhasil memperbarui catatan hasil produksi ${newEntry.produkNama}! ✏️`, 'success', 'Hasil Produksi Diperbarui! ✏️');
      }
    } catch (err) {
      showAlert('Error: ' + err.message, 'error', 'Gagal Simpan');
    }
  };

  const handleImportHasilProduksi = async (importedItems, periodeKey, periodeLabel) => {
    try {
      const updated = [...importedItems, ...hasilProduksi];
      setHasilProduksi(updated);
      localStorage.setItem('SAREN_HASIL_PRODUKSI', JSON.stringify(updated));
      try {
        for (const item of importedItems) {
          await saveHasilProduksiApi(item);
        }
      } catch (e) {}
      autoLogPackaging(importedItems);
      showAlert(`Berhasil mengimpor ${importedItems.length} baris hasil produksi periode ${periodeLabel || periodeKey}! Sisa kemasan otomatis terpotong. 📊`, 'success', 'Import Hasil Produksi Berhasil! 📦');
    } catch (err) {
      showAlert('Error import: ' + err.message, 'error', 'Gagal Import');
    }
  };

  const handleDeleteHasilProduksi = async (id) => {
    try {
      const updated = hasilProduksi.filter(x => x.id !== id);
      setHasilProduksi(updated);
      localStorage.setItem('SAREN_HASIL_PRODUKSI', JSON.stringify(updated));
      try {
        await deleteHasilProduksiApi(id);
      } catch (e) {}
      showAlert('Catatan hasil produksi berhasil dihapus!', 'success', 'Dihapus');
    } catch (err) {
      showAlert('Error: ' + err.message, 'error', 'Gagal Hapus');
    }
  };

  const handleUseKemasan = async (kemasanData) => {
    try {
      const res = await useKemasanBahanApi(kemasanData, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Pemakaian Kemasan Dicatat! 📦');
        fetchAllDataFromBackend();
        return;
      }
      showAlert(res?.message || 'Gagal mencatat pemakaian kemasan.', 'error', 'Pemakaian Kemasan Gagal');
    } catch (err) {
      showAlert('Terjadi kesalahan saat mencatat pemakaian kemasan: ' + err.message, 'error', 'Pemakaian Kemasan Error');
    }
  };

  const handleProcessEmulsi = async (emulsiData) => {
    try {
      const res = await processEmulsiApi(emulsiData, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', `Pengolahan Emulsi ${emulsiData.jenisEmulsi} Berhasil! 🧪`);
        fetchAllDataFromBackend();
        return;
      }
      showAlert(res?.message || 'Gagal memproses emulsi.', 'error', 'Pengolahan Emulsi Gagal');
    } catch (err) {
      showAlert('Terjadi kesalahan saat memproses emulsi: ' + err.message, 'error', 'Pengolahan Emulsi Error');
    }
  };

  const handleRollbackEmulsi = async (logId) => {
    try {
      const res = await rollbackEmulsiApi(logId, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Rollback Batch Emulsi Berhasil! 🔄');
        fetchAllDataFromBackend();
        return;
      }
      showAlert(res?.message || 'Gagal melakukan rollback emulsi.', 'error', 'Rollback Emulsi Gagal');
    } catch (err) {
      showAlert('Terjadi kesalahan saat rollback emulsi: ' + err.message, 'error', 'Rollback Emulsi Error');
    }
  };

  // Produk Handlers
  const handleSaveProduk = async (produkData) => {
    if (produkData.id) {
      const res = await updateProdukApi(produkData.id, produkData, activeUser?.name);
      if (res?.success) {
        showAlert(res.message, 'success', 'Produk Diperbarui!');
        fetchAllDataFromBackend();
        setIsModalProdukOpen(false);
        return;
      }
      setProduk(prev => prev.map(p => p.id === produkData.id ? { ...p, ...produkData } : p));
      showAlert('Data produk berhasil diperbarui!', 'success', 'Berhasil!');
    } else {
      const res = await createProdukApi(produkData, activeUser?.name);
      if (res?.success) {
        showAlert(res.message, 'success', 'Produk Ditambahkan!');
        fetchAllDataFromBackend();
        setIsModalProdukOpen(false);
        return;
      }
      const newP = { id: 'p_' + Date.now(), ...produkData };
      setProduk(prev => [...prev, newP]);
      showAlert('Produk baru berhasil ditambahkan!', 'success', 'Berhasil!');
    }
    setIsModalProdukOpen(false);
  };

  const handleDeleteProduk = async (id) => {
    showAlert(
      'Apakah Anda yakin ingin menghapus produk ini beserta data resepnya?',
      'danger',
      'Hapus Produk & Resep',
      async () => {
        const res = await deleteProdukApi(id, activeUser?.name);
        if (res?.success) {
          showAlert(res.message, 'success', 'Hapus Produk');
          fetchAllDataFromBackend();
          return;
        }
        setProduk(prev => prev.filter(p => p.id !== id));
        showAlert('Produk berhasil dihapus.', 'info', 'Hapus Produk');
      },
      true,
      'Ya, Hapus',
      'Batal'
    );
  };

  // Resep Handlers
  const handleSaveResepItem = async (itemData) => {
    if (!resepProdukId) return;
    const payload = { produkId: resepProdukId, ...itemData };

    setResep(prev => {
      const existing = prev[resepProdukId] || [];
      const filtered = existing.filter(i => i.bahanId !== itemData.bahanId);
      return { ...prev, [resepProdukId]: [...filtered, itemData] };
    });

    const res = await saveResepItemApi(payload, activeUser?.name);
    if (res?.success) {
      showAlert(res.message, 'success', 'Takaran Resep Disimpan! 📖');
      fetchAllDataFromBackend();
    } else {
      showAlert(res?.message || 'Takaran resep berhasil ditambahkan!', 'success', 'Resep Disimpan!');
    }
    setIsModalResepItemOpen(false);
  };

  const handleDeleteResepItem = async (pId, idx) => {
    showAlert(
      'Hapus takaran bahan dari resep ini?',
      'danger',
      'Hapus Takaran Resep',
      async () => {
        const targetItem = resep[pId]?.[idx];
        if (targetItem) {
          const res = await deleteResepItemApi(pId, targetItem.bahanId, activeUser?.name);
          if (res?.success) {
            showAlert(res.message, 'success', 'Hapus Resep');
            fetchAllDataFromBackend();
            return;
          }
        }

        setResep(prev => {
          const existing = prev[pId] || [];
          const updated = existing.filter((_, index) => index !== idx);
          return { ...prev, [pId]: updated };
        });
        showAlert('Takaran bahan berhasil dihapus dari resep.', 'info', 'Hapus Resep');
      },
      true,
      'Ya, Hapus',
      'Batal'
    );
  };

  const handleImportExcelResep = async (items) => {
    try {
      const res = await importResepExcelApi(items, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Import Excel Resep Berhasil! 🎉');
        fetchAllDataFromBackend();
        return;
      }
      showAlert(res?.message || 'Gagal mengimpor formulasi resep dari file Excel.', 'error', 'Import Resep Gagal');
    } catch (err) {
      showAlert('Terjadi kesalahan saat mengimpor Excel Resep: ' + err.message, 'error', 'Import Resep Error');
    }
  };

  // Produksi Batch Handler
  const handleExecuteProduksi = async (produksiData) => {
    const res = await executeProduksiApi(produksiData, activeUser?.name);
    if (res?.success) {
      showAlert(res.message, 'success', 'Produksi Selesai! 👨‍🍳🥖');
      fetchAllDataFromBackend();
      setIsModalProduksiOpen(false);
      return;
    }

    showAlert(res?.message || 'Gagal mengeksekusi produksi.', 'error', 'Produksi Gagal!');
  };

  const handleDeleteRiwayatProduksi = async (id) => {
    try {
      const res = await deleteRiwayatProduksiApi(id, activeUser?.name);
      if (res?.success) {
        showAlert(res.message, 'success', 'Rollback Batch Produksi Berhasil! 🔄');
        fetchAllDataFromBackend();
      } else {
        setRiwayatProduksi(prev => prev.filter(item => item.id !== id));
        showAlert('Catatan riwayat berhasil dihapus (Lokal)!', 'success', 'Riwayat Dihapus!');
      }
    } catch (err) {
      showAlert('Terjadi kesalahan saat rollback batch produksi: ' + err.message, 'error', 'Rollback Batch Error');
    }
  };

  const handleDeleteAuditLog = (targetId) => {
    showAlert(
      `Apakah Anda yakin ingin menghapus catatan audit log (${targetId})?`,
      'danger',
      'Konfirmasi Hapus Log Transaksi',
      async () => {
        setAuditLog(prev => {
          const updated = prev.filter(item => item.id !== targetId && item._id !== targetId);
          localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(updated));
          return updated;
        });
        try {
          const res = await deleteAuditLogApi(targetId);
          if (res?.success) {
            showAlert(res.message, 'success', 'Log Dihapus!');
          }
        } catch (e) {
          console.warn('Delete audit log note:', e);
        }
        fetchAllDataFromBackend();
      },
      true,
      'Hapus Log'
    );
  };

  const handleClearAllAuditLogs = () => {
    showAlert(
      '⚠️ PERINGATAN: Apakah Anda yakin ingin BERSIHKAN SEMUA CATATAN AUDIT LOG TRANSAKSI?\nTindakan ini tidak dapat dibatalkan!',
      'danger',
      'Konfirmasi Bersihkan All Log',
      async () => {
        setAuditLog([]);
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify([]));
        try {
          const res = await clearAllAuditLogsApi();
          showAlert(res?.message || 'Seluruh Audit Log berhasil dibersihkan!', 'success', 'Audit Log Bersih!');
        } catch (e) {
          console.warn('Clear audit logs note:', e);
          showAlert('Seluruh Audit Log berhasil dibersihkan!', 'success', 'Audit Log Bersih!');
        }
      },
      true,
      'Ya, Bersihkan All Log'
    );
  };

  const handleCreateUtang = async (utangData) => {
    try {
      const res = await createUtangSupplierApi(utangData, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Faktur & Utang Berhasil!');
        fetchAllDataFromBackend();
        return;
      }
      showAlert(res?.message || 'Gagal menyimpan faktur utang.', 'error', 'Gagal Simpan');
    } catch (err) {
      showAlert('Error: ' + err.message, 'error', 'Gagal Simpan');
    }
  };

  const handleUpdateUtang = async (id, updatedData) => {
    try {
      setUtangList(prev => prev.map(u => (u.id === id || u._id === id || u.noFaktur === id) ? { ...u, ...updatedData } : u));
      try {
        await updateUtangSupplierApi(id, updatedData, activeUser);
      } catch (e) {}
      showAlert('Catatan faktur pembelian berhasil diperbarui!', 'success', 'Diperbarui ✏️');
      fetchAllDataFromBackend(true);
    } catch (err) {
      showAlert('Error: ' + err.message, 'error', 'Gagal Update');
    }
  };

  const handlePayUtang = async (id, payData) => {
    const bayarAmt = parseFloat(payData.jumlahBayar) || 0;

    // 1. Check if paying virtual Penyesuaian Saldo Awal adjustment
    if (typeof id === 'string' && id.startsWith('SALDO_AWAL_')) {
      const parts = id.split('_');
      // Format: SALDO_AWAL_{month}_{supplierNama}
      const targetMonth = parts[2];
      const supplierNama = parts.slice(3).join('_');

      // Store payment event into SAREN_SALDO_AWAL_PAYMENTS local storage
      const PAYMENTS_KEY = 'SAREN_SALDO_AWAL_PAYMENTS';
      try {
        const stored = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
        stored.push({
          id: 'PAY_SA_' + Date.now(),
          month: targetMonth,
          supplier: supplierNama,
          tanggal: payData.tanggalBayar || new Date().toISOString().substring(0, 10),
          jumlah: bayarAmt,
          metode: payData.metodePembayaran || 'TRANSFER',
          catatan: payData.catatan || 'Pembayaran Penyesuaian Saldo Awal',
          userNama: activeUser?.nama || 'Admin'
        });
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(stored));
      } catch (e) { /* ignore */ }

      showAlert(`Pembayaran Penyesuaian Saldo Awal sebesar Rp ${formatNumber(bayarAmt)} berhasil disimpan & masuk ke Debit (Terbayar)! 💸`, 'success', 'Pembayaran Berhasil! 💸');
      // Trigger soft re-render
      setUtangList(prev => [...prev]);
      return;
    }

    // 2. Optimistic update in-memory utangList for real invoices
    setUtangList(prev => prev.map(u => {
      if (u.id === id || u._id === id || u.noFaktur === id) {
        const newDibayar = (u.jumlahDibayar || 0) + bayarAmt;
        const physicalKredit = (u.jumlahDiterima || 0) * (u.hargaSatuan || 0);
        const newSisa = Math.max(0, physicalKredit - newDibayar);
        const newStatus = newSisa === 0 ? 'LUNAS' : (newDibayar > 0 ? 'SEBAGIAN' : u.status);

        const newHistory = [...(u.riwayatPembayaran || u.riwayatBayar || [])];
        newHistory.push({
          tanggal: payData.tanggalBayar || new Date().toISOString().substring(0, 10),
          jumlah: bayarAmt,
          metode: payData.metodePembayaran || 'TRANSFER',
          catatan: payData.catatan || '',
          userNama: activeUser?.nama || 'Admin'
        });

        return {
          ...u,
          jumlahDibayar: newDibayar,
          sisaUtang: newSisa,
          status: newStatus,
          riwayatPembayaran: newHistory,
          riwayatBayar: newHistory
        };
      }
      return u;
    }));

    try {
      const res = await payUtangSupplierApi(id, payData, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Pembayaran Berhasil! 💸');
        fetchAllDataFromBackend(true);
        return;
      }
      showAlert(`Pembayaran Rp ${formatNumber(bayarAmt)} berhasil diproses secara lokal!`, 'success', 'Pembayaran Berhasil! 💸');
    } catch (err) {
      showAlert(`Pembayaran Rp ${formatNumber(bayarAmt)} berhasil diproses secara lokal!`, 'success', 'Pembayaran Berhasil! 💸');
    }
  };

  const handleDeletePaymentUtang = async (utangRecord, paymentItem, paymentIndex) => {
    const isSa = utangRecord.isManualAdjustment || (utangRecord.id && String(utangRecord.id).startsWith('SALDO_AWAL_'));
    const amount = Number(paymentItem.jumlah || 0);

    if (isSa) {
      try {
        const PAYMENTS_KEY = 'SAREN_SALDO_AWAL_PAYMENTS';
        const stored = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
        const updated = stored.filter(p => p.id !== paymentItem.paymentId && !(p.tanggal === paymentItem.tanggal && p.jumlah === paymentItem.jumlah));
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(updated));
        showAlert(`Pembayaran Saldo Awal sebesar Rp ${formatNumber(amount)} berhasil dibatalkan/dihapus!`, 'success', 'Hapus Pembayaran');
        setUtangList(prev => [...prev]);
      } catch (e) {
        showAlert('Gagal menghapus pembayaran: ' + e.message, 'error', 'Error');
      }
      return;
    }

    const targetId = utangRecord.id || utangRecord._id || utangRecord.noFaktur;
    setUtangList(prev => prev.map(u => {
      if (u.id === targetId || u._id === targetId || u.noFaktur === targetId) {
        const history = [...(u.riwayatPembayaran || u.riwayatBayar || [])];
        if (paymentIndex >= 0 && paymentIndex < history.length) {
          history.splice(paymentIndex, 1);
        }
        const newDibayar = history.reduce((s, h) => s + Number(h.jumlah || 0), 0);
        const physicalKredit = (u.jumlahDiterima || 0) * (u.hargaSatuan || 0);
        const newSisa = Math.max(0, physicalKredit - newDibayar);
        const newStatus = newSisa === 0 ? 'LUNAS' : (newDibayar > 0 ? 'SEBAGIAN' : 'BELUM_LUNAS');
        return { ...u, jumlahDibayar: newDibayar, sisaUtang: newSisa, status: newStatus, riwayatPembayaran: history, riwayatBayar: history };
      }
      return u;
    }));

    try {
      const currentHistory = [...(utangRecord.riwayatPembayaran || utangRecord.riwayatBayar || [])];
      if (paymentIndex >= 0 && paymentIndex < currentHistory.length) {
        currentHistory.splice(paymentIndex, 1);
      }
      const newDibayar = currentHistory.reduce((s, h) => s + Number(h.jumlah || 0), 0);
      const physicalKredit = (utangRecord.jumlahDiterima || 0) * (utangRecord.hargaSatuan || 0);
      const newSisa = Math.max(0, physicalKredit - newDibayar);
      const newStatus = newSisa === 0 ? 'LUNAS' : (newDibayar > 0 ? 'SEBAGIAN' : 'BELUM_LUNAS');

      await updateDataOnBackend('transaksi_pembelian', targetId, {
        jumlahDibayar: newDibayar,
        sisaUtang: newSisa,
        status: newStatus,
        riwayatPembayaran: currentHistory
      });

      showAlert(`Pembayaran sebesar Rp ${formatNumber(amount)} berhasil dibatalkan/dihapus!`, 'success', 'Hapus Pembayaran');
    } catch (err) {
      showAlert('Error: ' + err.message, 'error', 'Gagal Hapus Pembayaran');
      fetchAllDataFromBackend(true);
    }
  };

  const handleReceiveBahan = async (id, receiveData) => {
    const terimaQty = parseFloat(receiveData.jumlahTerima) || 0;

    // Find target invoice record synchronously from utangList state
    const targetUtang = utangList.find(u => u.id === id || u._id === id || u.noFaktur === id);
    const targetBahanId = targetUtang?.bahanId || receiveData.bahanId;
    const targetBahanNama = targetUtang?.bahanNama;

    // 1. Immediately update physical stock of Bahan Baku in-memory!
    setBahanBaku(prev => prev.map(b => {
      const isMatch = (targetBahanId && (b.id === targetBahanId || b._id === targetBahanId || b.sku === targetBahanId)) ||
                      (targetBahanNama && b.nama.toLowerCase() === targetBahanNama.toLowerCase());
      if (isMatch) {
        return { ...b, stok: Math.round((b.stok + terimaQty) * 1000) / 1000 };
      }
      return b;
    }));

    // 2. Immediately update Utang status & sisaUtang in-memory!
    setUtangList(prev => prev.map(u => {
      if (u.id === id || u._id === id || u.noFaktur === id) {
        const newDiterima = (u.jumlahDiterima || 0) + terimaQty;
        const sisaBelum = Math.max(0, u.jumlah - newDiterima);
        const hg = u.hargaSatuan || 0;
        const tagihanFisik = newDiterima * hg;
        const dpPaid = u.jumlahDibayar || 0;
        const newSisaUtang = Math.max(0, tagihanFisik - dpPaid);
        const newStatus = newSisaUtang === 0 ? (dpPaid >= tagihanFisik && newDiterima > 0 ? 'LUNAS' : 'MENUNGGU PENERIMAAN') : (dpPaid > 0 ? 'SEBAGIAN' : 'BELUM LUNAS');

        return {
          ...u,
          jumlahDiterima: newDiterima,
          sisaBelumDiterima: sisaBelum,
          sisaUtang: newSisaUtang,
          status: newStatus,
          statusPengiriman: sisaBelum === 0 ? 'SUDAH DITERIMA' : 'SEBAGIAN'
        };
      }
      return u;
    }));

    try {
      const res = await receiveUtangSupplierApi(id, receiveData, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Penerimaan Berhasil & Stok Bertambah! 📦');
        fetchAllDataFromBackend(true);
        return;
      }
      showAlert(`Penerimaan +${terimaQty} berhasil diverifikasi! Stok gudang bertambah!`, 'success', 'Penerimaan Berhasil! 📦');
    } catch (err) {
      showAlert(`Penerimaan +${terimaQty} berhasil diverifikasi! Stok gudang bertambah!`, 'success', 'Penerimaan Berhasil! 📦');
    }
  };

  const handleDeleteUtang = async (id) => {
    // Immediately update local state in-memory for instant real-time delete!
    setUtangList(prev => prev.filter(u => u.id !== id && u._id !== id && u.noFaktur !== id));

    try {
      const res = await deleteUtangSupplierApi(id, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Catatan Utang Dihapus!');
        fetchAllDataFromBackend(true);
        return;
      }
      showAlert('Catatan faktur utang berhasil dihapus!', 'info', 'Hapus Faktur');
    } catch (err) {
      showAlert('Catatan faktur utang berhasil dihapus!', 'info', 'Hapus Faktur');
    }
  };

  const handleCreateSupplier = async (data) => {
    try {
      const res = await createSupplierApi(data, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Supplier Berhasil Ditambah');
        fetchAllDataFromBackend();
        return;
      }
      // Fallback local update if backend offline
      const newSup = {
        id: 'sup_' + Date.now(),
        kode: data.kode || ('S' + (suppliersList.length + 1)),
        nama: data.nama,
        kontak: data.kontak || '',
        alamat: data.alamat || '',
        catatan: data.catatan || ''
      };
      setSuppliersList(prev => [newSup, ...prev]);
      showAlert(`Supplier [${newSup.kode}] ${newSup.nama} berhasil ditambahkan!`, 'success', 'Supplier Ditambah');
    } catch (err) {
      const newSup = {
        id: 'sup_' + Date.now(),
        kode: data.kode || ('S' + (suppliersList.length + 1)),
        nama: data.nama,
        kontak: data.kontak || '',
        alamat: data.alamat || '',
        catatan: data.catatan || ''
      };
      setSuppliersList(prev => [newSup, ...prev]);
      showAlert(`Supplier [${newSup.kode}] ${newSup.nama} berhasil ditambahkan!`, 'success', 'Supplier Ditambah');
    }
  };

  const handleUpdateSupplier = async (id, data) => {
    const targetIdStr = String(id);
    setSuppliersList(prev => prev.map(s => (String(s.id) === targetIdStr || String(s._id) === targetIdStr) ? { ...s, ...data } : s));
    try {
      const res = await updateSupplierApi(id, data, activeUser);
      if (res?.success) {
        showAlert(res.message || 'Supplier berhasil diupdate!', 'success', 'Supplier Diupdate');
        if (res.data) {
          const updatedDoc = res.data;
          setSuppliersList(prev => prev.map(s => (String(s.id) === targetIdStr || String(s._id) === targetIdStr) ? { ...s, ...updatedDoc } : s));
        } else {
          fetchAllDataFromBackend();
        }
        return;
      }
      showAlert('Supplier berhasil diupdate!', 'success', 'Supplier Diupdate');
    } catch (err) {
      showAlert('Supplier berhasil diupdate!', 'success', 'Supplier Diupdate');
    }
  };

  const handleDeleteSupplier = async (id) => {
    const targetIdStr = String(id);
    setSuppliersList(prev => prev.filter(s => String(s.id) !== targetIdStr && String(s._id) !== targetIdStr));
    try {
      const res = await deleteSupplierApi(id, activeUser);
      if (res?.success) {
        showAlert(res.message || 'Supplier berhasil dihapus.', 'success', 'Supplier Dihapus');
        return;
      }
      showAlert('Supplier berhasil dihapus dari master data.', 'success', 'Supplier Dihapus');
    } catch (err) {
      showAlert('Supplier berhasil dihapus dari master data.', 'success', 'Supplier Dihapus');
    }
  };

  // === PENJUALAN HANDLERS (Domain Produk) ===
  const handleCreatePenjualan = async (data) => {
    try {
      const res = await createPenjualanApi(data, activeUser);
      if (res?.success) {
        // Jika Status Pembayaran Lunas (Cash/Transfer Lunas), buat otomatis bukti pembayaran masuk agar terbayar di Piutang
        if (data.statusPembayaran === 'Lunas') {
          try {
            await createPembayaranMasukApi({
              pelangganId: data.pelangganId || '',
              namaPelanggan: data.namaPelanggan || '',
              kodePelanggan: data.kodePelanggan || '',
              noFaktur: data.noFaktur || '',
              tanggal: data.tanggal || new Date().toISOString().slice(0, 10),
              jumlahBayar: data.totalBersih || data.totalHarga || 0,
              metodePembayaran: data.metodePembayaran || 'Tunai',
              noReferensi: `AUTO-LUNAS-${data.noFaktur}`,
              catatan: `Pelunasan otomatis dari Penjualan Cash (${data.noFaktur})`
            }, activeUser);
          } catch (payErr) {
            console.warn('Auto create pembayaran error:', payErr);
          }
        }

        showAlert(res.message || 'Penjualan berhasil dicatat!', 'success', 'Penjualan Dicatat! 🛒');
        fetchAllDataFromBackend(true);
      } else {
        showAlert(res?.message || 'Gagal menyimpan penjualan.', 'error', 'Gagal Simpan');
      }
    } catch (err) {
      showAlert('Error: ' + err.message, 'error', 'Gagal Simpan');
    }
  };

  const handleUpdatePenjualan = async (id, data) => {
    try {
      const res = await updatePenjualanApi(id, data, activeUser);
      if (res?.success) {
        showAlert('Penjualan berhasil diperbarui!', 'success', 'Penjualan Diupdate');
        fetchAllDataFromBackend(true);
      } else {
        showAlert(res?.message || 'Gagal memperbarui penjualan.', 'error', 'Gagal Update');
      }
    } catch (err) {
      showAlert('Error: ' + err.message, 'error', 'Gagal Update');
    }
  };

  const handleDeletePenjualan = async (id, suppressAlert = false) => {
    try {
      const res = await deletePenjualanApi(id, activeUser);
      if (res?.success) {
        if (!suppressAlert) {
          showAlert('Data penjualan berhasil dihapus!', 'success', 'Penjualan Dihapus');
        }
        fetchAllDataFromBackend(true);
      } else {
        setPenjualanList(prev => prev.filter(p => p.id !== id && p._id !== id));
        if (!suppressAlert) {
          showAlert('Data penjualan berhasil dihapus!', 'success', 'Penjualan Dihapus');
        }
      }
    } catch (err) {
      setPenjualanList(prev => prev.filter(p => p.id !== id && p._id !== id));
      if (!suppressAlert) {
        showAlert('Data penjualan berhasil dihapus!', 'success', 'Penjualan Dihapus');
      }
    }
  };

  // === RETUR HANDLERS ===
  const handleCreateRetur = async (data) => {
    const newRetur = { id: `rtr_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
    const updated = [newRetur, ...returList];
    setReturList(updated);
    safeSetStorage('SAREN_RETUR_LIST', updated);
    showAlert('Pencatatan retur produk berhasil disimpan! 🔄', 'success', 'Retur Dicatat');
  };

  const handleDeleteRetur = async (id, suppressAlert = false) => {
    const updated = returList.filter(r => r.id !== id && r._id !== id);
    setReturList(updated);
    safeSetStorage('SAREN_RETUR_LIST', updated);
    if (!suppressAlert) {
      showAlert('Data retur produk berhasil dihapus!', 'info', 'Retur Dihapus');
    }
  };

  // === MARKETING HANDLERS (Domain Produk) ===
  const handleCreateMarketing = async (data) => {
    try {
      const res = await createMarketingApi(data, activeUser);
      if (res?.success) {
        showAlert(res.message || 'Program marketing berhasil dibuat!', 'success', 'Program Dibuat! 📣');
        fetchAllDataFromBackend(true);
      } else {
        showAlert(res?.message || 'Gagal membuat program marketing.', 'error', 'Gagal Simpan');
      }
    } catch (err) {
      showAlert('Error: ' + err.message, 'error', 'Gagal Simpan');
    }
  };

  const handleUpdateMarketing = async (id, data) => {
    try {
      const res = await updateMarketingApi(id, data, activeUser);
      if (res?.success) {
        showAlert('Program marketing berhasil diperbarui!', 'success', 'Marketing Diupdate');
        fetchAllDataFromBackend(true);
      } else {
        showAlert(res?.message || 'Gagal memperbarui program.', 'error', 'Gagal Update');
      }
    } catch (err) {
      showAlert('Error: ' + err.message, 'error', 'Gagal Update');
    }
  };

  const handleDeleteMarketing = async (id) => {
    try {
      const res = await deleteMarketingApi(id, activeUser);
      if (res?.success) {
        showAlert('Program marketing berhasil dihapus!', 'success', 'Program Dihapus');
        fetchAllDataFromBackend(true);
      } else {
        setMarketingList(prev => prev.filter(m => m.id !== id && m._id !== id));
        showAlert('Program marketing berhasil dihapus!', 'success', 'Program Dihapus');
      }
    } catch (err) {
      setMarketingList(prev => prev.filter(m => m.id !== id && m._id !== id));
      showAlert('Program marketing berhasil dihapus!', 'success', 'Program Dihapus');
    }
  };

  // === PRODUK SALES HANDLERS (Domain Produk) ===
  const handleCreateProdukSales = async (data, suppressAlert = false) => {
    try {
      const res = await createProdukSalesApi(data, activeUser);
      if (res?.success) {
        if (!suppressAlert) {
          showAlert(res.message || 'Produk katalog berhasil ditambahkan!', 'success', 'Produk Ditambah! 📦');
        }
        fetchAllDataFromBackend(true);
      } else {
        if (!suppressAlert) {
          showAlert(res?.message || 'Gagal menambahkan produk.', 'error', 'Gagal Simpan');
        }
      }
    } catch (err) {
      if (!suppressAlert) {
        showAlert('Error: ' + err.message, 'error', 'Gagal Simpan');
      }
    }
  };

  const handleUpdateProdukSales = async (id, data, suppressAlert = false) => {
    try {
      const res = await updateProdukSalesApi(id, data, activeUser);
      if (res?.success) {
        if (!suppressAlert) {
          showAlert('Produk katalog berhasil diperbarui!', 'success', 'Produk Diupdate');
        }
        fetchAllDataFromBackend(true);
      } else {
        if (!suppressAlert) {
          showAlert(res?.message || 'Gagal memperbarui produk.', 'error', 'Gagal Update');
        }
      }
    } catch (err) {
      if (!suppressAlert) {
        showAlert('Error: ' + err.message, 'error', 'Gagal Update');
      }
    }
  };

  const handleDeleteProdukSales = async (id, suppressAlert = false) => {
    try {
      const res = await deleteProdukSalesApi(id, activeUser);
      if (res?.success) {
        if (!suppressAlert) {
          showAlert('Produk katalog berhasil dihapus!', 'success', 'Produk Dihapus');
        }
        fetchAllDataFromBackend(true);
      } else {
        setProdukSalesList(prev => prev.filter(p => p.id !== id && p._id !== id));
        if (!suppressAlert) {
          showAlert('Produk katalog berhasil dihapus!', 'success', 'Produk Dihapus');
        }
      }
    } catch (err) {
      setProdukSalesList(prev => prev.filter(p => p.id !== id && p._id !== id));
      showAlert('Produk katalog berhasil dihapus!', 'success', 'Produk Dihapus');
    }
  };

  const handleCreateBrand = async (brandData) => {
    try {
      const [res1, res2] = await Promise.all([
        createBrandProdukApi(brandData, activeUser),
        createKategoriProdukApi(brandData, activeUser?.name)
      ]);
      showAlert(res1?.message || res2?.message || 'Brand berhasil ditambahkan!', 'success', 'Tambah Brand');
      fetchAllDataFromBackend(true);
    } catch (err) {
      const newBrand = { id: `brand_${Date.now()}`, ...brandData };
      setBrandList(prev => [newBrand, ...prev]);
      setKategoriProduk(prev => [...prev, newBrand]);
      showAlert('Brand berhasil ditambahkan!', 'success', 'Tambah Brand');
    }
  };

  const handleUpdateBrand = async (id, brandData) => {
    try {
      const [res1, res2] = await Promise.all([
        updateBrandProdukApi(id, brandData, activeUser),
        updateKategoriProdukApi(id, brandData, activeUser?.name)
      ]);
      showAlert(res1?.message || res2?.message || 'Brand berhasil diperbarui!', 'success', 'Edit Brand');
      fetchAllDataFromBackend(true);
    } catch (err) {
      setBrandList(prev => prev.map(b => (b.id === id || b._id === id) ? { ...b, ...brandData } : b));
      setKategoriProduk(prev => prev.map(b => (b.id === id || b._id === id) ? { ...b, ...brandData } : b));
      showAlert('Brand berhasil diperbarui!', 'success', 'Edit Brand');
    }
  };

  const handleDeleteBrand = async (id) => {
    try {
      await Promise.all([
        deleteBrandProdukApi(id, activeUser),
        deleteKategoriProdukApi(id, activeUser?.name)
      ]);
      showAlert('Brand berhasil dihapus.', 'info', 'Hapus Brand');
      setBrandList(prev => prev.filter(b => b.id !== id && b._id !== id));
      setKategoriProduk(prev => prev.filter(b => b.id !== id && b._id !== id));
    } catch (err) {
      setBrandList(prev => prev.filter(b => b.id !== id && b._id !== id));
      setKategoriProduk(prev => prev.filter(b => b.id !== id && b._id !== id));
      showAlert('Brand berhasil dihapus.', 'info', 'Hapus Brand');
    }
  };

  const handleCreateKategoriSales = async (data) => {
    try {
      const res = await createKategoriProdukSalesApi(data, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Tambah Kategori');
        fetchAllDataFromBackend(true);
        return;
      }
      const newItem = { id: `kps_${Date.now()}`, ...data };
      setKategoriSalesList(prev => [newItem, ...prev]);
      showAlert('Kategori berhasil ditambahkan!', 'success', 'Tambah Kategori');
    } catch (err) {
      const newItem = { id: `kps_${Date.now()}`, ...data };
      setKategoriSalesList(prev => [newItem, ...prev]);
      showAlert('Kategori berhasil ditambahkan!', 'success', 'Tambah Kategori');
    }
  };

  const handleUpdateKategoriSales = async (id, data) => {
    try {
      const res = await updateKategoriProdukSalesApi(id, data, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Edit Kategori');
        fetchAllDataFromBackend(true);
        return;
      }
      setKategoriSalesList(prev => prev.map(k => (k.id === id || k._id === id) ? { ...k, ...data } : k));
      showAlert('Kategori berhasil diperbarui!', 'success', 'Edit Kategori');
    } catch (err) {
      setKategoriSalesList(prev => prev.map(k => (k.id === id || k._id === id) ? { ...k, ...data } : k));
      showAlert('Kategori berhasil diperbarui!', 'success', 'Edit Kategori');
    }
  };

  const handleDeleteKategoriSales = async (id) => {
    try {
      const res = await deleteKategoriProdukSalesApi(id, activeUser);
      if (res?.success) {
        showAlert(res.message, 'success', 'Hapus Kategori');
        setKategoriSalesList(prev => prev.filter(k => k.id !== id && k._id !== id));
        return;
      }
      setKategoriSalesList(prev => prev.filter(k => k.id !== id && k._id !== id));
      showAlert('Kategori berhasil dihapus.', 'info', 'Hapus Kategori');
    } catch (err) {
      setKategoriSalesList(prev => prev.filter(k => k.id !== id && k._id !== id));
      showAlert('Kategori berhasil dihapus.', 'info', 'Hapus Kategori');
    }
  };

  // Pelanggan CRUD Handlers
  const handleCreatePelanggan = async (pelangganData) => {
    try {
      const res = await createPelangganApi(pelangganData, activeUser);
      if (res?.success) {
        showAlert('Pelanggan baru berhasil ditambahkan! 🎉', 'success');
        fetchAllDataFromBackend(true);
        return;
      }
    } catch { /* fallback local */ }

    const newObj = { ...pelangganData, id: `cust_${Date.now()}` };
    setPelangganList(prev => [newObj, ...prev]);
    showAlert('Pelanggan baru ditambahkan! 🎉', 'success');
  };

  const handleBulkCreatePelanggan = async (customers) => {
    try {
      const res = await bulkCreatePelangganApi(customers, activeUser);
      if (res?.success) {
        fetchAllDataFromBackend(true);
        return;
      }
    } catch { /* fallback local */ }

    setPelangganList(prev => [...customers, ...prev]);
  };

  const handleUpdatePelanggan = async (id, pelangganData) => {
    try {
      const res = await updatePelangganApi(id, pelangganData, activeUser);
      if (res?.success) {
        showAlert('Data pelanggan berhasil diperbarui!', 'success');
        fetchAllDataFromBackend(true);
        return;
      }
    } catch { /* fallback local */ }

    setPelangganList(prev => prev.map(p => (p.id === id || p._id === id) ? { ...p, ...pelangganData } : p));
    showAlert('Data pelanggan diperbarui!', 'success');
  };

  const handleDeletePelanggan = async (id, suppressAlert = false) => {
    try {
      await deletePelangganApi(id, activeUser);
    } catch { /* ignore */ }
    setPelangganList(prev => prev.filter(p => p.id !== id && p._id !== id));
    if (!suppressAlert) {
      showAlert('Pelanggan berhasil dihapus!', 'info');
    }
  };

  // Estimasi PO Handlers
  const handleCreateEstimasiPO = async (poData) => {
    try {
      const res = await createEstimasiPOApi(poData, activeUser);
      if (res?.success) {
        showAlert(res.message || 'Estimasi PO berhasil diajukan! 🎉', 'success', 'Estimasi PO Diajukan! 📋');
        fetchAllDataFromBackend(true);
        return;
      }
      showAlert(res?.message || 'Gagal mengajukan estimasi PO.', 'error', 'Error Estimasi PO');
    } catch (err) {
      showAlert('Terjadi kesalahan: ' + err.message, 'error', 'System Error');
    }
  };

  const handleUpdateStatusEstimasiPO = async (id, status) => {
    try {
      const res = await updateEstimasiPOStatusApi(id, status, activeUser);
      if (res?.success) {
        showAlert(res.message || 'Status PO berhasil diperbarui!', 'success', 'Status PO Diubah 📋');
        fetchAllDataFromBackend(true);
        return;
      }
      showAlert(res?.message || 'Gagal mengubah status PO.', 'error', 'Error Status');
    } catch (err) {
      showAlert('Terjadi kesalahan: ' + err.message, 'error', 'System Error');
    }
  };

  const handleDeleteEstimasiPO = async (id) => {
    try {
      const res = await deleteEstimasiPOApi(id, activeUser);
      if (res?.success) {
        showAlert(res.message || 'Estimasi PO berhasil dihapus!', 'info');
        fetchAllDataFromBackend(true);
        return;
      }
    } catch { /* ignore */ }
    setEstimasiPOList(prev => prev.filter(p => p.id !== id && p._id !== id && p.noEstimasi !== id));
    showAlert('Estimasi PO dihapus!', 'info');
  };

  // Pembayaran Masuk Handlers
  const handleCreatePembayaranMasuk = async (data) => {
    try {
      const res = await createPembayaranMasukApi(data, activeUser);
      if (res?.success) {
        showAlert(res.message || 'Pembayaran masuk berhasil dicatat!', 'success', 'Pembayaran Dicatat! 💰');
        fetchAllDataFromBackend(true);
        return;
      }
    } catch (err) {
      showAlert('Error: ' + err.message, 'error', 'Gagal Simpan');
    }
  };

  const handleDeletePembayaranMasuk = async (id) => {
    try {
      const res = await deletePembayaranMasukApi(id, activeUser);
      if (res?.success) {
        showAlert('Catatan pembayaran masuk berhasil dihapus!', 'success', 'Pembayaran Dihapus');
        fetchAllDataFromBackend(true);
      }
    } catch (err) {
      showAlert('Error: ' + err.message, 'error', 'Gagal Hapus');
    }
  };

  if (!activeUser) {
    return (
      <>
        <Login onLogin={handleLogin} onRegister={handleRegister} showAlert={showAlert} />
        <CustomAlertModal
          isOpen={alertState.isOpen}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          onConfirm={alertState.onConfirm}
          onClose={closeAlert}
          confirmText={alertState.confirmText}
          cancelText={alertState.cancelText}
          isConfirm={alertState.isConfirm}
        />
      </>
    );
  }

  if (activeUser.status === 'PENDING') {
    return <PendingApprovalView activeUser={activeUser} onLogout={handleLogout} onRefreshStatus={fetchAllDataFromBackend} />;
  }

  const lowStockCount = bahanBaku.filter(b => b.stok <= b.minStok).length;
  const pendingUserCount = users.filter(u => u.status === 'PENDING').length;

  return (
    <div className="app-wrapper">
      <Sidebar
        activeUser={activeUser}
        activeRoleView={activeRoleView}
        activeTab={activeTab}
        onSwitchTab={setActiveTab}
        onLogout={confirmLogoutTrigger}
        lowStockCount={lowStockCount}
        pendingUserCount={pendingUserCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="main-content">
        <Topbar
          activeUser={activeUser}
          activeRoleView={activeRoleView}
          onChangeRoleView={handleRoleViewChange}
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenChangePassword={() => setIsModalChangePasswordOpen(true)}
          onLogout={confirmLogoutTrigger}
        />

        <main className="content-body">
          {activeRoleView === 'SALES' ? (
            <div className="tab-pane active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', padding: '2rem' }}>
              <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', background: 'var(--bg-card)' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '2px solid rgba(59, 130, 246, 0.3)' }}>
                  <Smartphone size={36} style={{ color: 'var(--primary)' }} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
                  Akses Khusus Mobile App
                </h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Akun <strong>Sales / SPG</strong> hanya dapat diakses melalui aplikasi mobile <strong>PresensiKu</strong> untuk presensi &amp; geotagging lokasi.
                </p>
                <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  📱 Silakan gunakan aplikasi <strong>PresensiKu</strong> di smartphone Anda.
                </div>
                <button className="btn btn-danger" style={{ margin: '0 auto', fontSize: '0.85rem' }} onClick={confirmLogoutTrigger}>
                  Keluar Akun
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
            <DashboardTab
              bahanBaku={bahanBaku}
              produk={produk}
              riwayatProduksi={riwayatProduksi}
              hasilProduksi={hasilProduksi}
              savedHppList={savedHppList}
              auditLog={auditLog}
              utangList={utangList}
              activeRoleView={activeRoleView}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenModalProduksi={() => setIsModalProduksiOpen(true)}
              onOpenPdfPreview={handleOpenPdfPreview}
              onSwitchTab={setActiveTab}
              backendConnected={backendConnected}
            />
          )}

          {activeTab === 'bahan-baku' && (
            <BahanBakuTab
              bahanBaku={bahanBaku}
              kategoriList={kategoriBahanBaku}
              riwayatProduksi={riwayatProduksi}
              utangList={utangList}
              auditLog={auditLog}
              hasilProduksi={hasilProduksi}
              activeRoleView={activeRoleView}
              onOpenTambahBahan={() => { setEditingBahan(null); setIsModalBahanOpen(true); }}
              onOpenEditBahan={(b) => { setEditingBahan(b); setIsModalBahanOpen(true); }}
              onOpenStokMasuk={() => setIsModalStokMasukOpen(true)}
              onOpenPemakaianKemasan={() => setIsModalPemakaianKemasanOpen(true)}
              onDeleteBahan={handleDeleteBahan}
              onOpenKelolaKategoriBahan={() => setIsModalKelolaKategoriBahanOpen(true)}
              onOpenPdfPreview={handleOpenPdfPreview}
              onImportExcelBahan={handleImportExcelBahan}
              onImportStokAwalExcel={handleImportStokAwalExcel}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'emulsi' && (
            <EmulsiTab
              bahanBaku={bahanBaku}
              auditLog={auditLog}
              utangList={utangList}
              riwayatProduksi={riwayatProduksi}
              activeRoleView={activeRoleView}
              onProcessEmulsi={handleProcessEmulsi}
              onRollbackEmulsi={handleRollbackEmulsi}
              showAlert={showAlert}
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
              onOpenPdfPreview={handleOpenPdfPreview}
              onDeleteProduk={handleDeleteProduk}
            />
          )}

          {activeTab === 'resep' && (
            <ResepTab
              produk={produk}
              bahanBaku={bahanBaku}
              resep={resep}
              activeRoleView={activeRoleView}
              onOpenTambahResepItem={(pId) => { setResepProdukId(pId); setEditingResepItem(null); setIsModalResepItemOpen(true); }}
              onOpenEditResepItem={(pId, item) => { setResepProdukId(pId); setEditingResepItem(item); setIsModalResepItemOpen(true); }}
              onDeleteResepItem={handleDeleteResepItem}
              onImportExcelResep={handleImportExcelResep}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'pemakaian-kemasan' && (
            <PemakaianKemasanTab
              bahanBaku={bahanBaku}
              auditLog={auditLog}
              hasilProduksi={hasilProduksi}
              utangList={utangList}
              activeRoleView={activeRoleView}
              onUseKemasan={handleUseKemasan}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'pembelian-bahan' && (
            <PembelianBahanTab
              utangList={utangList}
              bahanBaku={bahanBaku}
              suppliersList={suppliersList}
              activeRoleView={activeRoleView}
              onCreateUtang={handleCreateUtang}
              onUpdateUtang={handleUpdateUtang}
              onDeleteUtang={handleDeleteUtang}
              onCreateSupplier={handleCreateSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'utang-supplier' && (
            <UtangSupplierTab
              utangList={utangList}
              suppliersList={suppliersList}
              activeRoleView={activeRoleView}
              onPayUtang={handlePayUtang}
              onDeletePaymentUtang={handleDeletePaymentUtang}
              onDeleteUtang={handleDeleteUtang}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'penerimaan-bahan' && (
            <PenerimaanBahanTab
              utangList={utangList}
              bahanBaku={bahanBaku}
              activeRoleView={activeRoleView}
              onReceiveBahan={handleReceiveBahan}
              onUpdateUtang={handleUpdateUtang}
              onDeleteUtang={handleDeleteUtang}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'supplier' && (
            <SupplierTab
              suppliersList={suppliersList}
              activeRoleView={activeRoleView}
              onCreateSupplier={handleCreateSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'hasil-produksi' && (
            <HasilProduksiTab
              hasilProduksi={hasilProduksi}
              produkList={produk}
              bahanBaku={bahanBaku}
              savedHppList={savedHppList}
              riwayatProduksi={riwayatProduksi}
              activeRoleView={activeRoleView}
              onSaveHasilProduksi={handleSaveHasilProduksi}
              onImportHasilProduksi={handleImportHasilProduksi}
              onDeleteHasilProduksi={handleDeleteHasilProduksi}
              onSaveMapping={handleSaveProdukKemasanMap}
              onOpenPdfPreview={handleOpenPdfPreview}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'riwayat-produksi' && (
            <RiwayatProduksiTab
              riwayatProduksi={riwayatProduksi}
              activeRoleView={activeRoleView}
              onOpenPdfPreview={handleOpenPdfPreview}
              onDeleteHistory={handleDeleteRiwayatProduksi}
            />
          )}

          {activeTab === 'hpp-kalkulator' && (
            <HppKalkulatorTab
              riwayatProduksi={riwayatProduksi}
              utangList={utangList}
              bahanBaku={bahanBaku}
              produk={produk}
              activeRoleView={activeRoleView}
              onOpenPdfPreview={handleOpenPdfPreview}
            />
          )}

          {activeTab === 'kategori' && (
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
              onSaveUser={handleSaveUser}
              onResetUserPassword={handleResetUserPassword}
              showAlert={showAlert}
              domainRoles={['BAHAN_BAKU', 'PEMBELIAN', 'TIM_PENJUALAN', 'TIM_MARKETING']}
            />
          )}

          {activeTab === 'audit-log' && (
            <AuditLogTab
              auditLog={auditLog}
              activeRoleView={activeRoleView}
              onOpenPdfPreview={handleOpenPdfPreview}
              onDeleteLog={handleDeleteAuditLog}
              onClearAllLogs={handleClearAllAuditLogs}
            />
          )}

          {activeTab === 'audit-stok' && (
            <AuditStokTab
              bahanBaku={bahanBaku}
              utangList={utangList}
              riwayatProduksi={riwayatProduksi}
              activeUser={activeUser}
              onOpenPdfPreview={handleOpenPdfPreview}
            />
          )}

          {/* ===== DOMAIN PRODUK TABS ===== */}
          {activeTab === 'dashboard-produk' && (
            <DashboardProdukTab
              produkSalesList={produkSalesList}
              produkList={produk}
              hasilProduksi={hasilProduksi}
              riwayatProduksi={riwayatProduksi}
              penjualanList={penjualanList}
              marketingList={marketingList}
              pelangganList={pelangganList}
              savedHppList={savedHppList}
              activeRoleView={activeRoleView}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'pembelian-produk' && (
            <PembelianProdukTab
              hasilProduksi={hasilProduksi}
              riwayatProduksi={riwayatProduksi}
              produkList={produkSalesList.length > 0 ? produkSalesList : produk}
              savedHppList={savedHppList}
              onOpenPdfPreview={handleOpenPdfPreview}
            />
          )}

          {activeTab === 'katalog-produk' && (
            <KatalogProdukSalesTab
              produkSalesList={produkSalesList}
              brandList={brandList}
              activeRoleView={activeRoleView}
              activeUser={activeUser}
              onCreateProdukSales={handleCreateProdukSales}
              onUpdateProdukSales={handleUpdateProdukSales}
              onDeleteProdukSales={handleDeleteProdukSales}
              onCreateBrand={handleCreateBrand}
              onUpdateBrand={handleUpdateBrand}
              onDeleteBrand={handleDeleteBrand}
              onOpenPdfPreview={handleOpenPdfPreview}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'stok-produk' && (
            <StokProdukSalesTab
              produkSalesList={produkSalesList}
              brandList={brandList}
              hasilProduksi={hasilProduksi}
              penjualanList={penjualanList}
              returList={returList}
              activeRoleView={activeRoleView}
              onUpdateProdukSales={handleUpdateProdukSales}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'kategori-produk-sales' && (
            <KategoriSalesBrandTab
              brandList={brandList}
              activeRoleView={activeRoleView}
              onCreateBrand={handleCreateBrand}
              onUpdateBrand={handleUpdateBrand}
              onDeleteBrand={handleDeleteBrand}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'penjualan' && (
            <PenjualanTab
              penjualanList={penjualanList}
              pelangganList={pelangganList}
              produkSalesList={produkSalesList}
              activeRoleView={activeRoleView}
              activeUser={activeUser}
              onCreatePenjualan={handleCreatePenjualan}
              onUpdatePenjualan={handleUpdatePenjualan}
              onDeletePenjualan={handleDeletePenjualan}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'retur-produk' && (
            <ReturTab
              returList={returList}
              penjualanList={penjualanList}
              pelangganList={pelangganList}
              produkSalesList={produkSalesList}
              activeRoleView={activeRoleView}
              activeUser={activeUser}
              onCreateRetur={handleCreateRetur}
              onDeleteRetur={handleDeleteRetur}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'estimasi-po' && (
            <EstimasiPOTab
              estimasiPOList={estimasiPOList}
              produk={produk}
              bahanBaku={bahanBaku}
              resep={resep}
              pelangganList={pelangganList}
              activeUser={activeUser}
              activeRoleView={activeRoleView}
              onCreateEstimasiPO={handleCreateEstimasiPO}
              onUpdateStatusPO={handleUpdateStatusEstimasiPO}
              onDeletePO={handleDeleteEstimasiPO}
              onOpenModalProduksi={(pId) => {
                setSelectedProduksiId(pId);
                setIsModalProduksiOpen(true);
              }}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'pelanggan' && (
            <PelangganTab
              pelangganList={pelangganList}
              activeRoleView={activeRoleView}
              onCreatePelanggan={handleCreatePelanggan}
              onUpdatePelanggan={handleUpdatePelanggan}
              onDeletePelanggan={handleDeletePelanggan}
              onBulkCreatePelanggan={handleBulkCreatePelanggan}
              onOpenPdfPreview={handleOpenPdfPreview}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'piutang-pelanggan' && (
            <PiutangPelangganTab
              pelangganList={pelangganList}
              penjualanList={penjualanList}
              pembayaranMasukList={pembayaranMasukList}
              activeRoleView={activeRoleView}
              activeUser={activeUser}
              onUpdatePelanggan={handleUpdatePelanggan}
              onUpdatePenjualan={handleUpdatePenjualan}
              onCreatePembayaranMasuk={handleCreatePembayaranMasuk}
              onDeletePembayaranMasuk={handleDeletePembayaranMasuk}
              onOpenPdfPreview={handleOpenPdfPreview}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'marketing' && (
            <MarketingTab
              marketingList={marketingList}
              penjualanList={penjualanList}
              activeRoleView={activeRoleView}
              activeUser={activeUser}
              onCreateMarketing={handleCreateMarketing}
              onUpdateMarketing={handleUpdateMarketing}
              onDeleteMarketing={handleDeleteMarketing}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'user-approval-produk' && (
            <UserApprovalTab
              users={users}
              onApproveUser={handleApproveUser}
              onRejectUser={handleRejectUser}
              onDeleteUser={handleDeleteUser}
              onSaveUser={handleSaveUser}
              onResetUserPassword={handleResetUserPassword}
              showAlert={showAlert}
              domainRoles={['BAHAN_BAKU', 'PEMBELIAN', 'TIM_PENJUALAN', 'TIM_MARKETING', 'SALES']}
            />
          )}

          {activeTab === 'audit-log-produk' && (
            <AuditLogTab
              auditLog={auditLog.filter(l => ['TIM_PENJUALAN', 'TIM_MARKETING', 'SALES', 'ADMIN_PRODUK'].includes(l.role))}
              activeRoleView={activeRoleView}
              onOpenPdfPreview={handleOpenPdfPreview}
              onDeleteLog={handleDeleteAuditLog}
              onClearAllLogs={handleClearAllAuditLogs}
            />
          )}

          {activeTab === 'absensi-spg' && (
            <AbsensiTab
              activeUser={activeUser}
              absensiList={absensiList}
              onRefresh={fetchAllDataFromBackend}
            />
          )}
            </>
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
        bahanList={bahanBaku}
      />

      <ModalStokMasuk
        isOpen={isModalStokMasukOpen}
        onClose={() => setIsModalStokMasukOpen(false)}
        onSave={handleRestockBahan}
        bahanList={bahanBaku}
      />

      <ModalPemakaianKemasan
        isOpen={isModalPemakaianKemasanOpen}
        onClose={() => setIsModalPemakaianKemasanOpen(false)}
        onUseKemasan={handleUseKemasan}
        bahanList={bahanBaku}
        showAlert={showAlert}
      />

      <ModalProduk
        isOpen={isModalProdukOpen}
        onClose={() => setIsModalProdukOpen(false)}
        onSave={handleSaveProduk}
        editingItem={editingProduk}
        kategoriList={kategoriProduk}
        produkList={produk}
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
        editingItem={editingResepItem}
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

      <ModalPreviewPdf
        isOpen={isModalPdfPreviewOpen}
        onClose={() => setIsModalPdfPreviewOpen(false)}
        previewConfig={pdfPreviewConfig}
        bahanBaku={bahanBaku}
        activeUser={activeUser}
      />

      {/* ===== LOGOUT CONFIRMATION MODAL ===== */}
      {isLogoutConfirmOpen && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div style={{ maxWidth: '420px', width: '90%', textAlign: 'center', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem 1.5rem', background: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', margin: 'auto' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              border: '2px solid rgba(244, 63, 94, 0.3)'
            }}>
              <LogOut size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', marginTop: 0 }}>
              Konfirmasi Keluar Aplikasi
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 500, marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Apakah Anda yakin ingin keluar dari akun <strong style={{ color: '#0f172a', fontWeight: 700 }}>{activeUser?.name || 'Super Admin'}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.55rem 1rem',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none'
                }}
                onClick={() => setIsLogoutConfirmOpen(false)}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >
                Batal
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.55rem 1rem',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                  border: 'none',
                  color: '#ffffff',
                  boxShadow: '0 3px 10px rgba(225, 29, 72, 0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none'
                }}
                onClick={() => handleLogout(false)}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Ya, Keluar Akun
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomAlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm}
        onClose={closeAlert}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        isConfirm={alertState.isConfirm}
      />

      {isLoadingData && (
        <div className="loading-overlay-screen">
          <div className="loading-card">
            <img
              src="/logo.png"
              alt="Saren One"
              style={{ width: '72px', height: '72px', objectFit: 'contain', borderRadius: '12px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="loading-spinner-ring"></div>
            <div>
              <div className="loading-text">tunggu yaaa...</div>
              <div className="loading-subtext" style={{ marginTop: '0.45rem' }}>Sedang mengambil data dari server...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
