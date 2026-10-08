export const CLOUD_BACKEND_URL = 'https://campusedge-backend.onrender.com';

export const API_BASE = (() => {
  // If running in browser and NOT strictly on laptop loopback (e.g. mobile device, tablet, Vercel, HTTPS),
  // automatically route directly to the live Cloud Backend so mobile and remote devices never hit a dead localhost
  if (typeof window !== 'undefined') {
    const isLoopback = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLoopback || window.location.protocol === 'https:') {
      return CLOUD_BACKEND_URL;
    }
  }

  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    const configured = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && configured.startsWith('http://localhost')) {
      return CLOUD_BACKEND_URL;
    }
    return configured;
  }
  return 'http://localhost:5000';
})();

let localOfflineDetected = false;

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
  // Query parameters are completely immune to CORS preflight header restrictions
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

  // Determine base URL: if local was already detected offline, switch directly to cloud
  const base = (localOfflineDetected && API_BASE.includes('localhost')) ? CLOUD_BACKEND_URL : API_BASE;
  const primaryUrl = targetEndpoint.startsWith('http') ? targetEndpoint : `${base}${targetEndpoint}`;

  try {
    const response = await fetch(primaryUrl, {
      ...options,
      headers
    });
    return response;
  } catch (err) {
    // If request to localhost failed (e.g. port 5000 offline or unreachable from network), failover to live cloud backend
    if (!targetEndpoint.startsWith('http') && primaryUrl.includes('localhost') && CLOUD_BACKEND_URL) {
      console.warn(`[CampusEdge] Local backend unreachable at ${primaryUrl}. Failing over to live cloud backend (${CLOUD_BACKEND_URL})...`);
      localOfflineDetected = true;
      const fallbackUrl = `${CLOUD_BACKEND_URL}${targetEndpoint}`;
      
      try {
        const fallbackResponse = await fetch(fallbackUrl, {
          ...options,
          headers
        });
        return fallbackResponse;
      } catch (fallbackErr) {
        // If fallback failed due to custom header preflight rejection on strict proxy, retry once with only standard headers
        if (headers['x-admin-key']) {
          const standardHeaders = { ...headers };
          delete standardHeaders['x-admin-key'];
          try {
            return await fetch(fallbackUrl, {
              ...options,
              headers: standardHeaders
            });
          } catch (lastErr) {
            throw lastErr;
          }
        }
        throw fallbackErr;
      }
    }
    throw err;
  }
}
