import api from './api';

export const departmentService = {
  createDepartment: async (data) => {
    const response = await api.post('/departments', data);
    return response.data;
  },
  getDepartments: async (params = {}) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },
  getDepartmentById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },
  updateDepartment: async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },
  deleteDepartment: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },
};
