import axios from 'axios';
import { showToast } from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://xoto.ae/api';

// Resolves both '/vault/cases/...' and 'bank/products/...' correctly.
const resolve = (path: string) => `${API_BASE}/${path.replace(/^\//, '')}`;

// No baseURL on the instance — we build the full URL manually so that leading-slash
// paths like '/vault/cases/...' don't strip the /api segment via URL resolution.
const api = axios.create();

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vault_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem('vault_token');
    if (token) {
      const errorData = error.response?.data;
      const errorMessage =
        errorData?.message || errorData?.error?.message || 'Something went wrong';

      const suppress = [
        'generate more images',
        'customer not found',
      ];
      const lower = errorMessage.toLowerCase();
      if (!suppress.some((s) => lower.includes(s))) {
        showToast(errorMessage, 'error');
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  get: async <T = unknown>(url: string, params: Record<string, unknown> = {}): Promise<T> => {
    const response = await api.get<T>(resolve(url), { params });
    return response.data;
  },

  post: async <T = unknown>(url: string, data?: unknown): Promise<T> => {
    const response = await api.post<T>(resolve(url), data);
    return response.data;
  },

  put: async <T = unknown>(url: string, data?: unknown): Promise<T> => {
    const response = await api.put<T>(resolve(url), data);
    return response.data;
  },

  patch: async <T = unknown>(url: string, data?: unknown): Promise<T> => {
    const response = await api.patch<T>(resolve(url), data);
    return response.data;
  },

  delete: async <T = unknown>(url: string): Promise<T> => {
    const response = await api.delete<T>(resolve(url));
    return response.data;
  },

  upload: async <T = unknown>(
    url: string,
    formData: FormData,
    onUploadProgress?: (e: { loaded: number; total?: number }) => void
  ): Promise<T> => {
    const response = await api.post<T>(resolve(url), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  },

  download: async (url: string, fileName: string): Promise<boolean> => {
    const response = await api.get(resolve(url), { responseType: 'blob' });
    const urlBlob = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    const link = document.createElement('a');
    link.href = urlBlob;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  },
};

export default api;
