import api from './api';

export const laboratoryTestService = {
  createLabTest: async (data) => {
    const response = await api.post('/laboratory-tests', data);
    return response.data;
  },
  getLabTests: async (params = {}) => {
    const response = await api.get('/laboratory-tests', { params });
    return response.data;
  },
  getLabTestById: async (id) => {
    const response = await api.get(`/laboratory-tests/${id}`);
    return response.data;
  },
  updateLabTest: async (id, data) => {
    const response = await api.put(`/laboratory-tests/${id}`, data);
    return response.data;
  },
  deleteLabTest: async (id) => {
    const response = await api.delete(`/laboratory-tests/${id}`);
    return response.data;
  },
};
