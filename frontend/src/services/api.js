// Base URL for all API requests
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// In-memory cache & request deduplication store
const cacheStore = new Map();
const inFlightRequests = new Map();

// Clear cached items matching pattern or all
export const clearCache = (pattern) => {
  if (!pattern) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  }
};

// ─── Core fetch wrapper ─────────────────────────────────────────────────────
const request = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include', // Always send cookies (the JWT token)
    ...options,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(res.ok ? 'Invalid response from the server' : 'The server is currently unavailable');
  }

  if (!res.ok) {
    throw new Error(data.message || 'Unable to complete the request');
  }

  return data;
};

// Cached GET wrapper with deduplication and TTL (default 15 seconds)
const cachedRequest = async (path, ttlMs = 15000) => {
  const now = Date.now();
  const cached = cacheStore.get(path);

  // 1. If valid cached data exists, return it immediately
  if (cached && (now - cached.timestamp < ttlMs)) {
    return cached.data;
  }

  // 2. If a request for this exact path is currently in-flight, reuse it (deduplication)
  if (inFlightRequests.has(path)) {
    return inFlightRequests.get(path);
  }

  // 3. Otherwise, make network request
  const promise = (async () => {
    try {
      const data = await request(path);
      cacheStore.set(path, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlightRequests.delete(path);
    }
  })();

  inFlightRequests.set(path, promise);
  return promise;
};

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  register: async (body) => {
    const res = await request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
    clearCache();
    return res;
  },
  login: async (body) => {
    const res = await request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
    clearCache();
    return res;
  },
  logout: async () => {
    const res = await request('/auth/logout', { method: 'POST' });
    clearCache();
    return res;
  },
  getMe: () => cachedRequest('/auth/me', 60000), // Cache auth for 60s
};

// ─── Users API ───────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: () => cachedRequest('/users', 30000),
};

// ─── Projects API ────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: () => cachedRequest('/projects', 15000),
  getById: (id) => cachedRequest(`/projects/${id}`, 15000),
  getSummary: (id) => cachedRequest(`/projects/${id}/summary`, 15000),
  create: async (body) => {
    const res = await request('/projects', { method: 'POST', body: JSON.stringify(body) });
    clearCache('/projects');
    return res;
  },
  update: async (id, body) => {
    const res = await request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    clearCache('/projects');
    return res;
  },
  delete: async (id) => {
    const res = await request(`/projects/${id}`, { method: 'DELETE' });
    clearCache('/projects');
    return res;
  },
};

// ─── Tasks API ───────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: () => cachedRequest('/tasks', 15000),
  getDeadlines: () => cachedRequest('/tasks/deadlines', 15000),
  getById: (id) => cachedRequest(`/tasks/${id}`, 15000),
  getByProject: (projectId) => cachedRequest(`/projects/${projectId}/tasks`, 15000),
  create: async (body) => {
    const res = await request('/tasks', { method: 'POST', body: JSON.stringify(body) });
    clearCache('/tasks');
    clearCache('/projects');
    return res;
  },
  update: async (id, body) => {
    const res = await request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    clearCache('/tasks');
    clearCache('/projects');
    return res;
  },
  delete: async (id) => {
    const res = await request(`/tasks/${id}`, { method: 'DELETE' });
    clearCache('/tasks');
    clearCache('/projects');
    return res;
  },
};
