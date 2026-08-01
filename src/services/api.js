// SAREN ONE REST API INTEGRATION SERVICE
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aplikasi-produksi-sarenone-backend.vercel.app/api';

async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const parsed = JSON.parse(errorText);
        return { success: false, message: parsed.message || `Gagal mengeksekusi (Status ${response.status})` };
      } catch {
        return { success: false, message: errorText || `Gagal mengeksekusi (Status ${response.status})` };
      }
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.warn(`[API Fallback] Gagal terhubung ke ${API_BASE_URL}${endpoint}:`, error.message);
    return { success: false, isOffline: true, message: 'Server backend sedang offline.' };
  }
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
  return request('/audit-log/all', {
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


