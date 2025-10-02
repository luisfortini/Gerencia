import axios from 'axios';

const INVALID_CONTA_VALUES = new Set(['null', 'undefined', '']);

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gerencia_token');
  const contaId = localStorage.getItem('gerencia_conta');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (contaId && !INVALID_CONTA_VALUES.has(contaId)) {
    config.headers['X-Conta-Id'] = contaId;
  } else {
    delete config.headers['X-Conta-Id'];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gerencia_token');
      localStorage.removeItem('gerencia_conta');
      localStorage.removeItem('gerencia_usuario');

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
