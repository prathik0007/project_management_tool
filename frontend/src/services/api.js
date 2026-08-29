// Base URL for all API requests
const API_URL = 'http://localhost:5000/api';

// ─── Core fetch wrapper ─────────────────────────────────────────────────────
// All requests use credentials: 'include' so the browser automatically
// sends the HTTP-only JWT cookie with every request — this is how
// authentication works without using localStorage.
const request = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include', // Always send cookies (the JWT token)
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    // Throw the message from the backend so it can be shown in the UI
    throw new Error(data.message || 'An error occurred');
  }

  return data;
};

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
};

// ─── Users API (for task assignment dropdown) ────────────────────────────────
export const usersAPI = {
  getAll: () => request('/users'),
};

// ─── Projects API ────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: () => request('/projects'),
  getById: (id) => request(`/projects/${id}`),
  getSummary: (id) => request(`/projects/${id}/summary`),
  create: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
};

// ─── Tasks API ───────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: () => request('/tasks'),
  getDeadlines: () => request('/tasks/deadlines'),
  getById: (id) => request(`/tasks/${id}`),
  getByProject: (projectId) => request(`/projects/${projectId}/tasks`),
  create: (body) => request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
