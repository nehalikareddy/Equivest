import api from './axios.js';

export const register = async (data) => (await api.post('/auth/register', data)).data;
export const login = async (data) => (await api.post('/auth/login', data)).data;
export const getCurrentUser = async () => (await api.get('/auth/me')).data;
export const logout = async () => (await api.post('/auth/logout')).data;
