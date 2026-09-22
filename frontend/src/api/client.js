/**
 * ANNARAKSHAK API Client
 * Centralized API communication with JWT auth.
 */

const API_BASE = 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('annarakshak_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Seed
  seed: () => request('/seed', { method: 'POST' }),

  // Institutions
  createInstitution: (data) => request('/institutions', { method: 'POST', body: JSON.stringify(data) }),
  getMyInstitution: () => request('/institutions/me'),
  getInstitution: (id) => request(`/institutions/${id}`),
  getInstitutionStats: (id) => request(`/institutions/${id}/stats`),

  // Food Batches
  createFoodBatch: (formData) => request('/food-batches', { method: 'POST', body: formData }),
  listFoodBatches: (params = '') => request(`/food-batches${params ? '?' + params : ''}`),
  getFoodBatch: (id) => request(`/food-batches/${id}`),
  segregateBatch: (id, seg) => request(`/food-batches/${id}/segregate`, { method: 'PUT', body: JSON.stringify({ segregation: seg }) }),
  getAssessment: (id) => request(`/food-batches/${id}/assessment`),
  getRescueClock: (id) => request(`/food-batches/${id}/rescue-clock`),

  // Receivers
  createReceiver: (data) => request('/receivers', { method: 'POST', body: JSON.stringify(data) }),
  getMyReceiver: () => request('/receivers/me'),
  getReceiver: (id) => request(`/receivers/${id}`),
  updateReceiver: (id, data) => request(`/receivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getReceiverHistory: (id) => request(`/receivers/${id}/history`),

  // Allocations
  runAllocation: () => request('/allocations/run', { method: 'POST' }),
  listAllocations: (params = '') => request(`/allocations${params ? '?' + params : ''}`),
  acceptAllocation: (id) => request(`/allocations/${id}/accept`, { method: 'PUT' }),
  rejectAllocation: (id) => request(`/allocations/${id}/reject`, { method: 'PUT' }),
  confirmHandover: (id) => request(`/allocations/${id}/confirm-handover`, { method: 'PUT' }),
  confirmDelivery: (id) => request(`/allocations/${id}/confirm-delivery`, { method: 'PUT' }),

  // Admin
  getDashboard: () => request('/admin/dashboard'),
  getStateData: (state) => request(`/admin/states/${state}`),
  getHeatmap: () => request('/admin/heatmap'),
  getESGReport: () => request('/admin/esg-report'),
  getWasteHotspots: () => request('/admin/waste-hotspots'),
  getAllInstitutions: () => request('/admin/institutions'),

  // Analytics
  getWasteFingerprint: (id) => request(`/analytics/waste-fingerprint/${id}`),
  createWasteRecord: (data) => request('/analytics/waste-records', { method: 'POST', body: JSON.stringify(data) }),
  getPredictions: () => request('/analytics/predictions'),
  getDeliveries: () => request('/analytics/deliveries'),
};

export default api;
