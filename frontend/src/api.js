export const CLOUD_BACKEND_URL = 'https://campusedge-backend.onrender.com';

export const API_BASE = (() => {
  // Always prioritize explicit VITE_API_URL if present
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    const envUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    if (envUrl) return envUrl;
  }

  // When running locally in browser (Vite dev server), use empty string so Vite proxy forwards /api
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || 
                    host === '127.0.0.1' || 
                    host.startsWith('192.168.') || 
                    host.startsWith('10.') || 
                    host.endsWith('.local');
    if (isLocal) {
      return ''; // Relative path, Vite proxy forwards to http://localhost:5000
    }
    // When deployed online on Vercel (https://campus-edge-crzc.vercel.app), point directly to live Cloud Backend
    return CLOUD_BACKEND_URL;
  }

  return CLOUD_BACKEND_URL;
})();

export function getAuthToken() {
  const user = getSavedUser();
  return user?.token || null;
}

export function getSavedUser() {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const user = getSavedUser();

  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Build target endpoint with adminKey query parameter if user is an admin
  let targetEndpoint = endpoint;
  if (user && user.role === 'admin') {
    if (!targetEndpoint.includes('adminKey=')) {
      const sep = targetEndpoint.includes('?') ? '&' : '?';
      targetEndpoint = `${targetEndpoint}${sep}adminKey=CampusEdge2026`;
    }
    headers['x-admin-key'] = 'CampusEdge2026';
  }

  // If body is not FormData and Content-Type not set, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const primaryUrl = targetEndpoint.startsWith('http') 
    ? targetEndpoint 
    : (API_BASE ? `${API_BASE}${targetEndpoint}` : targetEndpoint);

  return fetch(primaryUrl, {
    ...options,
    headers
  });
}
