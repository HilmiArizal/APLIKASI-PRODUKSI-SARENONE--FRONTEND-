// SAREN ONE REST API INTEGRATION SERVICE
const LOCAL_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
const PROD_API_URL = 'https://aplikasi-produksi-sarenone-backend.vercel.app/api';

async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const primaryUrl = import.meta.env.DEV ? LOCAL_API_URL : PROD_API_URL;

  try {
    const response = await fetch(`${primaryUrl}${endpoint}`, config);
    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (error) {
    // Jika server backend lokal belum dinyalakan/offline, otomatis fallback ke Vercel Cloud API agar data tidak kosong!
    if (primaryUrl !== PROD_API_URL) {
      try {
        const prodRes = await fetch(`${PROD_API_URL}${endpoint}`, config);
        if (prodRes.ok) {
          const prodResult = await prodRes.json();
          return prodResult;
        }
      } catch (e2) {}
    }
    console.warn(`[API Fallback] Gagal terhubung ke ${primaryUrl}${endpoint}:`, error.message);
  }

  return { success: false, isOffline: true, message: 'Server backend sedang offline.' };
}

// 1. AUTH & USER APPROVAL ENDPOINTS
export async function loginApi(usernameOrEmail, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usernameOrEmail, password })
  });
}

export async function logoutApi(user) {
  return request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ user })
  });
}

export async function registerApi(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function getUsersApi() {
  return request('/auth/users');
}

export async function approveUserApi(userId, assignedRole) {
  return request(`/auth/approve/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ role: assignedRole })
  });
}

export async function rejectUserApi(userId) {
  return request(`/auth/reject/${userId}`, {
    method: 'DELETE'
  });
}

export async function deleteUserApi(userId) {
  return request(`/auth/users/${userId}`, {
    method: 'DELETE'
  });
}

export async function updateUserApi(userId, userData) {
  return request(`/auth/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
}

export async function resetUserPasswordApi(userId, newPassword) {
  return request(`/auth/users/${userId}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword })
  });
}

export async function changePasswordApi(userId, oldPassword, newPassword) {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ userId, oldPassword, newPassword })
  });
}

// 2. KATEGORI PRODUK ENDPOINTS
export async function getKategoriProdukApi() {
  return request('/kategori-produk');
}

export async function createKategoriProdukApi(data, activeUser) {
  return request('/kategori-produk', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updateKategoriProdukApi(id, data, activeUser) {
  return request(`/kategori-produk/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteKategoriProdukApi(id, activeUser) {
  return request(`/kategori-produk/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 3. KATEGORI BAHAN BAKU ENDPOINTS
export async function getKategoriBahanBakuApi() {
  return request('/kategori-bahan-baku');
}

export async function createKategoriBahanBakuApi(data, activeUser) {
  return request('/kategori-bahan-baku', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updateKategoriBahanBakuApi(id, data, activeUser) {
  return request(`/kategori-bahan-baku/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteKategoriBahanBakuApi(id, activeUser) {
  return request(`/kategori-bahan-baku/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 4. BAHAN BAKU ENDPOINTS
export async function getBahanBakuApi() {
  return request('/bahan-baku');
}

export async function getHargaHistorisBahanBakuApi(tanggal) {
  const query = tanggal ? `?tanggal=${encodeURIComponent(tanggal)}` : '';
  return request(`/bahan-baku/harga-historis${query}`);
}

export async function createBahanBakuApi(data, activeUser) {
  return request('/bahan-baku', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updateBahanBakuApi(id, data, activeUser) {
  return request(`/bahan-baku/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteBahanBakuApi(id, activeUser) {
  return request(`/bahan-baku/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

export async function restockBahanBakuApi(data, activeUser) {
  return request('/bahan-baku/restock', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function importBahanBakuExcelApi(items, activeUser) {
  return request('/bahan-baku/import-excel', {
    method: 'POST',
    body: JSON.stringify({ items, user: activeUser })
  });
}

export async function useKemasanBahanApi(data, activeUser) {
  return request('/bahan-baku/pemakaian-kemasan', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

// 5. PRODUK ENDPOINTS
export async function getProdukApi() {
  return request('/produk');
}

export async function createProdukApi(data, activeUser) {
  return request('/produk', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updateProdukApi(id, data, activeUser) {
  return request(`/produk/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteProdukApi(id, activeUser) {
  return request(`/produk/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 6. RESEP ENDPOINTS
export async function getResepApi() {
  return request('/resep');
}

export async function saveResepItemApi(data, activeUser) {
  return request('/resep', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteResepItemApi(produkId, bahanId, activeUser) {
  return request(`/resep/${produkId}/${bahanId}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

export async function importResepExcelApi(items, activeUser) {
  return request('/resep/import-excel', {
    method: 'POST',
    body: JSON.stringify({ items, user: activeUser })
  });
}

// 7. PRODUKSI ENDPOINTS
export async function executeProduksiApi(data, activeUser) {
  return request('/produksi/execute', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function getRiwayatProduksiApi() {
  return request('/produksi/history');
}

export async function deleteRiwayatProduksiApi(id, activeUser) {
  return request(`/produksi/history/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 8. AUDIT LOG ENDPOINTS
export async function getAuditLogApi() {
  return request('/audit-log');
}

export async function deleteAuditLogApi(id) {
  return request(`/audit-log/${id}`, {
    method: 'DELETE'
  });
}

export async function clearAllAuditLogsApi() {
  return request('/audit-log/clear/all', {
    method: 'DELETE'
  });
}

// 9. EMULSI ENDPOINTS
export async function processEmulsiApi(data, activeUser) {
  return request('/emulsi/process', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function rollbackEmulsiApi(logId, activeUser) {
  return request('/emulsi/rollback', {
    method: 'POST',
    body: JSON.stringify({ logId, user: activeUser })
  });
}

// 9. UTANG SUPPLIER ENDPOINTS
export async function getUtangSupplierApi() {
  return request('/utang-supplier');
}

export async function createUtangSupplierApi(data, activeUser) {
  return request('/utang-supplier', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updateUtangSupplierApi(id, data, activeUser) {
  return request(`/utang-supplier/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function payUtangSupplierApi(id, data, activeUser) {
  return request(`/utang-supplier/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function receiveUtangSupplierApi(id, data, activeUser) {
  return request(`/utang-supplier/${id}/receive`, {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteUtangSupplierApi(id, activeUser) {
  return request(`/utang-supplier/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 10. SUPPLIER MASTER DATA ENDPOINTS
export async function getSuppliersApi() {
  return request('/suppliers');
}

export async function createSupplierApi(data, activeUser) {
  return request('/suppliers', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updateSupplierApi(id, data, activeUser) {
  return request(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteSupplierApi(id, activeUser) {
  return request(`/suppliers/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 10. PENJUALAN (Domain Produk)
export async function getPenjualanApi() {
  return request('/penjualan');
}

export async function createPenjualanApi(data, activeUser) {
  return request('/penjualan', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updatePenjualanApi(id, data, activeUser) {
  return request(`/penjualan/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deletePenjualanApi(id, activeUser) {
  return request(`/penjualan/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 11. MARKETING (Domain Produk)
export async function getMarketingApi() {
  return request('/marketing');
}

export async function createMarketingApi(data, activeUser) {
  return request('/marketing', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updateMarketingApi(id, data, activeUser) {
  return request(`/marketing/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteMarketingApi(id, activeUser) {
  return request(`/marketing/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 12. PRODUK SALES / KATALOG PENJUALAN (Domain Produk)
export async function getProdukSalesApi() {
  return request('/produk-sales');
}

export async function createProdukSalesApi(data, activeUser) {
  return request('/produk-sales', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updateProdukSalesApi(id, data, activeUser) {
  return request(`/produk-sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteProdukSalesApi(id, activeUser) {
  return request(`/produk-sales/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 13. BRAND PRODUK (Domain Produk)
export async function getBrandProdukApi() {
  return request('/brand-produk');
}

export async function createBrandProdukApi(data, activeUser) {
  return request('/brand-produk', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updateBrandProdukApi(id, data, activeUser) {
  return request(`/brand-produk/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteBrandProdukApi(id, activeUser) {
  return request(`/brand-produk/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 14. KATEGORI PRODUK SALES (Domain Produk)
export async function getKategoriProdukSalesApi() {
  return request('/kategori-produk-sales');
}

export async function createKategoriProdukSalesApi(data, activeUser) {
  return request('/kategori-produk-sales', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updateKategoriProdukSalesApi(id, data, activeUser) {
  return request(`/kategori-produk-sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteKategoriProdukSalesApi(id, activeUser) {
  return request(`/kategori-produk-sales/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 15. PELANGGAN / CUSTOMER (Domain Produk)
export async function getPelangganApi() {
  return request('/pelanggan');
}

export async function createPelangganApi(data, activeUser) {
  return request('/pelanggan', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updatePelangganApi(id, data, activeUser) {
  return request(`/pelanggan/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deletePelangganApi(id, activeUser) {
  return request(`/pelanggan/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

export async function bulkCreatePelangganApi(customers, activeUser) {
  return request('/pelanggan/bulk', {
    method: 'POST',
    body: JSON.stringify({ customers, user: activeUser })
  });
}

// 16. PEMBAYARAN MASUK PELANGGAN
export async function getPembayaranMasukApi() {
  return request('/pembayaran-masuk');
}

export async function createPembayaranMasukApi(data, activeUser) {
  return request('/pembayaran-masuk', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deletePembayaranMasukApi(id, activeUser) {
  return request(`/pembayaran-masuk/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 17. ABSENSI SPG / SALES
export async function getAbsensiApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/absensi${query ? '?' + query : ''}`);
}

export async function deleteAbsensiApi(id) {
  return request(`/absensi/${id}`, {
    method: 'DELETE'
  });
}

export async function clearAllAbsensiApi() {
  return request('/absensi/all', {
    method: 'DELETE'
  });
}

// 18. ESTIMASI PO (PURCHASE ORDER ESTIMATION)
export async function getEstimasiPOApi() {
  return request('/estimasi-po');
}

export async function createEstimasiPOApi(data, activeUser) {
  return request('/estimasi-po', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function updateEstimasiPOStatusApi(id, status, activeUser) {
  return request(`/estimasi-po/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, user: activeUser })
  });
}

export async function deleteEstimasiPOApi(id, activeUser) {
  return request(`/estimasi-po/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ user: activeUser })
  });
}

// 19. HPP PRODUKSI SAVED RECORDS
export async function getHppListApi() {
  return request('/hpp');
}

export async function saveHppApi(data) {
  return request('/hpp/save', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function deleteHppApi(id) {
  return request(`/hpp/${id}`, {
    method: 'DELETE'
  });
}

export async function getHasilProduksiApi() {
  return request('/produksi/hasil');
}

export async function saveHasilProduksiApi(data) {
  return request('/produksi/hasil', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function deleteHasilProduksiApi(id) {
  return request(`/produksi/hasil/${id}`, {
    method: 'DELETE'
  });
}

// 20. AUDIT STOK FISIK & PENYESUAIAN SUSUT ENDPOINTS
export async function getAuditStokListApi(bulan = '') {
  const query = bulan ? `?bulan=${bulan}` : '';
  return request(`/audit-stok${query}`);
}

export async function saveAuditStokApi(data) {
  return request('/audit-stok', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function deleteAuditStokApi(id) {
  return request(`/audit-stok/${id}`, {
    method: 'DELETE'
  });
}

export async function deleteAuditStokByDateApi(tanggal) {
  return request(`/audit-stok/tanggal/${tanggal}`, {
    method: 'DELETE'
  });
}

export async function deleteAuditStokBatchApi(ids) {
  return request('/audit-stok/delete-batch', {
    method: 'POST',
    body: JSON.stringify({ ids })
  });
}

export async function fetchProdukKemasanMapApi() {
  return request('/produk/kemasan-map');
}

export async function saveProdukKemasanMapApi(mapping, user) {
  return request('/produk/kemasan-map', {
    method: 'POST',
    body: JSON.stringify({ mapping, user })
  });
}





