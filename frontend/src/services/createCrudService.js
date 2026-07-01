import api from './api';

export const normalizeListParams = (params = {}, maxLimit = 200) => {
  const normalized = { ...params };
  if (normalized.limit !== undefined) {
    const parsedLimit = Number(normalized.limit);
    if (!Number.isFinite(parsedLimit)) {
      delete normalized.limit;
    } else {
      normalized.limit = Math.min(maxLimit, Math.max(1, Math.floor(parsedLimit)));
    }
  }
  return normalized;
};

const createCrudService = (basePath, options = {}) => {
  const { maxLimit = 200 } = options;

  return {
    getAll: async (params = {}) => {
      const response = await api.get(basePath, { params: normalizeListParams(params, maxLimit) });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`${basePath}/${id}`);
      return response.data;
    },
    create: async (data) => {
      const response = await api.post(basePath, data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await api.put(`${basePath}/${id}`, data);
      return response.data;
    },
    delete: async (id) => {
      const response = await api.delete(`${basePath}/${id}`);
      return response.data;
    },
  };
};

export default createCrudService;
