import api from './api';

export const prescriptionService = {
  createPrescription: async (data) => {
    const response = await api.post('/prescriptions', data);
    return response.data;
  },
  getPrescriptions: async (params = {}) => {
    const response = await api.get('/prescriptions', { params });
    return response.data;
  },
  getPrescriptionById: async (id) => {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },
  updatePrescription: async (id, data) => {
    const response = await api.put(`/prescriptions/${id}`, data);
    return response.data;
  },
  dispensePrescription: async (id) => {
    const response = await api.put(`/prescriptions/${id}/dispense`);
    return response.data;
  },
  deletePrescription: async (id) => {
    const response = await api.delete(`/prescriptions/${id}`);
    return response.data;
  },
};
