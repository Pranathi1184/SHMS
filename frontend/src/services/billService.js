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

export const billService = {
  createBill: async (data) => {
    const response = await api.post('/bills', data);
    return response.data;
  },
  getBills: async (params = {}) => {
    const response = await api.get('/bills', { params: normalizeListParams(params) });
    return response.data;
  },
  getBillById: async (id) => {
    const response = await api.get(`/bills/${id}`);
    return response.data;
  },
  updateBill: async (id, data) => {
    const response = await api.put(`/bills/${id}`, data);
    return response.data;
  },
  deleteBill: async (id) => {
    const response = await api.delete(`/bills/${id}`);
    return response.data;
  },
};
