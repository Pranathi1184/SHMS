import api from './api';

const normalizeListParams = (params = {}) => {
  const normalized = { ...params };
  if (normalized.limit !== undefined) {
    const parsedLimit = Number(normalized.limit);
    if (!Number.isFinite(parsedLimit)) {
      delete normalized.limit;
    } else {
      normalized.limit = Math.min(100, Math.max(1, Math.floor(parsedLimit)));
    }
  }
  return normalized;
};

export const insuranceService = {
  createInsurance: async (data) => {
    const response = await api.post('/insurance', data);
    return response.data;
  },
  getInsurance: async (params = {}) => {
    const response = await api.get('/insurance', { params: normalizeListParams(params) });
    return response.data;
  },
  getInsuranceById: async (id) => {
    const response = await api.get(`/insurance/${id}`);
    return response.data;
  },
  updateInsurance: async (id, data) => {
    const response = await api.put(`/insurance/${id}`, data);
    return response.data;
  },
  deleteInsurance: async (id) => {
    const response = await api.delete(`/insurance/${id}`);
    return response.data;
  },
};
