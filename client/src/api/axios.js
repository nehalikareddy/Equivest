import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.endsWith('/auth/login') && !url.endsWith('/auth/register')) {
      window.dispatchEvent(new CustomEvent('equivest:session-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;