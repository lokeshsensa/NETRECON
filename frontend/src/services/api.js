import axios from 'axios';

// Dynamically target backend on port 8000 based on the current browser hostname
const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:8000/api`;
  }
  return 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Prevent leading slash from stripping /api in Axios URL resolution
  if (config.url && config.url.startsWith('/') && !config.url.startsWith('/api')) {
    config.url = config.url.substring(1);
  }
  const token = localStorage.getItem('netrecon_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
