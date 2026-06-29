import api from './api';

export const wardManagementService = {
  // Wards
  createWard: async (data) => {
    const response = await api.post('/ward-management/wards', data);
    return response.data;
  },
  getWards: async () => {
    const response = await api.get('/ward-management/wards');
    return response.data;
  },
  getWardById: async (id) => {
    const response = await api.get(`/ward-management/wards/${id}`);
    return response.data;
  },
  updateWard: async (id, data) => {
    const response = await api.put(`/ward-management/wards/${id}`, data);
    return response.data;
  },
  deleteWard: async (id) => {
    const response = await api.delete(`/ward-management/wards/${id}`);
    return response.data;
  },

  // Beds
  createBed: async (data) => {
    const response = await api.post('/ward-management/beds', data);
    return response.data;
  },
  getBeds: async () => {
    const response = await api.get('/ward-management/beds');
    return response.data;
  },
  getBedById: async (id) => {
    const response = await api.get(`/ward-management/beds/${id}`);
    return response.data;
  },
  updateBed: async (id, data) => {
    const response = await api.put(`/ward-management/beds/${id}`, data);
    return response.data;
  },
  deleteBed: async (id) => {
    const response = await api.delete(`/ward-management/beds/${id}`);
    return response.data;
  },

  // Admissions
  createAdmission: async (data) => {
    const response = await api.post('/ward-management/admissions', data);
    return response.data;
  },
  getAdmissions: async (params = {}) => {
    const response = await api.get('/ward-management/admissions', { params });
    return response.data;
  },
  getAdmissionById: async (id) => {
    const response = await api.get(`/ward-management/admissions/${id}`);
    return response.data;
  },
  updateAdmission: async (id, data) => {
    const response = await api.put(`/ward-management/admissions/${id}`, data);
    return response.data;
  },
  dischargePatient: async (id) => {
    const response = await api.put(`/ward-management/admissions/${id}/discharge`);
    return response.data;
  },
  deleteAdmission: async (id) => {
    const response = await api.delete(`/ward-management/admissions/${id}`);
    return response.data;
  },
};
