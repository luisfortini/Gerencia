import axios from 'axios';

const INVALID_CONTA_VALUES = new Set(['null', 'undefined', '']);

const sanitizeJsonString = (value: string) => value.trim().replace(/^\uFEFF/, '');

const extractJsonSnippet = (value: string): string | null => {
  if (value.startsWith('{') || value.startsWith('[')) {
    return value;
  }

  const braceStart = value.indexOf('{');
  const braceEnd = value.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return value.slice(braceStart, braceEnd + 1);
  }

  const bracketStart = value.indexOf('[');
  const bracketEnd = value.lastIndexOf(']');
  if (bracketStart !== -1 && bracketEnd !== -1 && bracketEnd > bracketStart) {
    return value.slice(bracketStart, bracketEnd + 1);
  }

  return null;
};

const normalizeResponseData = (data: unknown): unknown => {
  if (typeof data !== 'string') {
    return data;
  }

  const sanitized = sanitizeJsonString(data);
  if (sanitized === '') {
    return data;
  }

  const snippet = extractJsonSnippet(sanitized);
  if (!snippet) {
    return data;
  }

  try {
    return JSON.parse(snippet);
  } catch (error) {
    console.warn('Resposta da API nao pode ser analisada como JSON:', sanitized, error);
    return data;
  }
};

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
  (response) => {
    response.data = normalizeResponseData(response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      error.response.data = normalizeResponseData(error.response.data);
    }

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
