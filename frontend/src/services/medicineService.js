import api from './api';

export const medicineService = {
  createMedicine: async (data) => {
    const response = await api.post('/medicines', data);
    return response.data;
  },
  getMedicines: async (params = {}) => {
    const response = await api.get('/medicines', { params });
    return response.data;
  },
  getMedicineById: async (id) => {
    const response = await api.get(`/medicines/${id}`);
    return response.data;
  },
  updateMedicine: async (id, data) => {
    const response = await api.put(`/medicines/${id}`, data);
    return response.data;
  },
  deleteMedicine: async (id) => {
    const response = await api.delete(`/medicines/${id}`);
    return response.data;
  },
};
