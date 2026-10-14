import api from './axios.js';

export const listShortlist = async () => (await api.get('/shortlist')).data;
export const addToShortlist = async (startupId) => (await api.post(`/shortlist/${startupId}`)).data;
export const removeFromShortlist = async (startupId) => api.delete(`/shortlist/${startupId}`);
