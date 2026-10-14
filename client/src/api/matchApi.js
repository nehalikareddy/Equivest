import api from './axios.js';

export const getMatches = async (filters = {}) => (await api.get('/matches', { params: filters })).data;
