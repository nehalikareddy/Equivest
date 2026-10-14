import api from './axios.js';

export const getInvestorProfile = async () => (await api.get('/investor/profile')).data;
export const saveInvestorProfile = async (profile) => (await api.put('/investor/profile', profile)).data;
