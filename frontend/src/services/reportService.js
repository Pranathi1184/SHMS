import api from './api';

export const reportService = {
  getRevenueStats: async (params = {}) => {
    const response = await api.get('/reports/revenue', { params });
    return response.data;
  },
  getPatientStats: async (params = {}) => {
    const response = await api.get('/reports/patients', { params });
    return response.data;
  },
  getDepartmentStats: async (params = {}) => {
    const response = await api.get('/reports/departments', { params });
    return response.data;
  },
  getOccupancyStats: async (params = {}) => {
    const response = await api.get('/reports/occupancy', { params });
    return response.data;
  },
  getInventoryAlerts: async (params = {}) => {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },
};
