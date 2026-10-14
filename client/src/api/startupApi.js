import api from './axios.js';

export const createStartup = async (data) => (await api.post('/startups', data)).data;
export const listMyStartups = async () => (await api.get('/startups/mine')).data;
export const getStartup = async (id) => (await api.get(`/startups/${id}`)).data;
export const updateStartup = async (id, data) => (await api.put(`/startups/${id}`, data)).data;
export const deleteStartup = async (id) => api.delete(`/startups/${id}`);
export const analyzeStartupPitch = async (id) => (await api.post(`/startups/${id}/analyze`)).data;
