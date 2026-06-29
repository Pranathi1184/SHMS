import api from './api';

export const ehrService = {
  createEHR: async (data) => {
    const response = await api.post('/ehr', data);
    return response.data;
  },
  getEHRs: async (params = {}) => {
    const response = await api.get('/ehr', { params });
    return response.data;
  },
  getEHRById: async (id) => {
    const response = await api.get(`/ehr/${id}`);
    return response.data;
  },
  updateEHR: async (id, data) => {
    const response = await api.put(`/ehr/${id}`, data);
    return response.data;
  },
  deleteEHR: async (id) => {
    const response = await api.delete(`/ehr/${id}`);
    return response.data;
  },
};
