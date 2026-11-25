/**
 * Centralized API client for EcoSort FastAPI backend.
 * Uses Vite's `/api` proxy in development or VITE_API_BASE_URL in production.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const TOKEN_KEY = 'ecosort_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'Unable to reach the EcoSort server. Make sure the FastAPI backend is running on port 8000.'
    );
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Request failed with status ${response.status}`;
    const err = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    err.status = response.status;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
  updateMe: (payload) => request('/auth/me', { method: 'PUT', body: JSON.stringify(payload) }),

  // Waste & AI Classification
  getCategories: () => request('/waste/categories'),
  searchWaste: (q = '', category = 'all') => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category && category !== 'all') params.set('category', category);
    const qs = params.toString();
    return request(`/waste${qs ? `?${qs}` : ''}`);
  },
  getWasteItem: (id, trackSearch = true) =>
    request(`/waste/${id}?track_search=${trackSearch ? 'true' : 'false'}`),
  classifyImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/waste/classify', { method: 'POST', body: formData });
  },

  // Collection Centres
  getCollectionCentres: (wasteType = 'all', q = '') => {
    const params = new URLSearchParams();
    if (wasteType && wasteType !== 'all') params.set('waste_type', wasteType);
    if (q) params.set('q', q);
    const qs = params.toString();
    return request(`/collection-centres${qs ? `?${qs}` : ''}`);
  },

  // Activity & Dashboard
  getDashboard: () => request('/dashboard'),
  getWasteRecords: (category = 'all') => {
    const qs = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/waste-records${qs}`);
  },
  createWasteRecord: (payload) =>
    request('/waste-records', { method: 'POST', body: JSON.stringify(payload) }),
  deleteWasteRecord: (id) => request(`/waste-records/${id}`, { method: 'DELETE' }),

  // Challenges
  getChallenges: () => request('/challenges'),
  joinChallenge: (id) => request(`/challenges/${id}/join`, { method: 'POST' }),
  updateChallengeProgress: (id, payload) =>
    request(`/challenges/${id}/progress`, { method: 'POST', body: JSON.stringify(payload) }),

  // Awareness
  getAwarenessArticles: (tag = 'all') => {
    const qs = tag && tag !== 'all' ? `?tag=${encodeURIComponent(tag)}` : '';
    return request(`/awareness${qs}`);
  },

  // Admin
  adminGetAnalytics: () => request('/admin/analytics'),
  adminGetUsers: () => request('/admin/users'),
  adminUpdateUserStatus: (id, is_active) =>
    request(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    }),
  adminGetDisposalMethods: () => request('/admin/disposal-methods'),
  adminCreateWasteItem: (payload) =>
    request('/admin/waste', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateWasteItem: (id, payload) =>
    request(`/admin/waste/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminDeleteWasteItem: (id) => request(`/admin/waste/${id}`, { method: 'DELETE' }),
  adminGetCentres: () => request('/admin/collection-centres'),
  adminCreateCentre: (payload) =>
    request('/admin/collection-centres', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateCentre: (id, payload) =>
    request(`/admin/collection-centres/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminDeleteCentre: (id) =>
    request(`/admin/collection-centres/${id}`, { method: 'DELETE' }),
  adminCreateArticle: (payload) =>
    request('/admin/awareness', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateArticle: (id, payload) =>
    request(`/admin/awareness/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminDeleteArticle: (id) => request(`/admin/awareness/${id}`, { method: 'DELETE' }),
  adminGetChallenges: () => request('/admin/challenges'),
  adminCreateChallenge: (payload) =>
    request('/admin/challenges', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateChallenge: (id, payload) =>
    request(`/admin/challenges/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminDeleteChallenge: (id) => request(`/admin/challenges/${id}`, { method: 'DELETE' }),
};
