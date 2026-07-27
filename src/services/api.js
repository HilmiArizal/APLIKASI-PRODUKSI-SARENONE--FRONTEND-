// SAREN ONE REST API INTEGRATION SERVICE
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

export async function registerApi(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function getUsersApi() {
  return request('/auth/users');
}

export async function approveUserApi(userId, role) {
  return request(`/auth/approve/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  });
}

export async function rejectUserApi(userId) {
  return request(`/auth/reject/${userId}`, {
    method: 'PUT'
  });
}

export async function deleteUserApi(userId) {
  return request(`/auth/users/${userId}`, {
    method: 'DELETE'
  });
}

export async function changePasswordApi(userId, oldPassword, newPassword) {
  return request('/auth/change-password', {
    method: 'PUT',
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
  return request('/resep/item', {
    method: 'POST',
    body: JSON.stringify({ ...data, user: activeUser })
  });
}

export async function deleteResepItemApi(produkId, itemIndex, activeUser) {
  return request('/resep/item', {
    method: 'DELETE',
    body: JSON.stringify({ produkId, itemIndex, user: activeUser })
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

// 8. AUDIT LOG ENDPOINTS
export async function getAuditLogApi() {
  return request('/audit-log');
}
