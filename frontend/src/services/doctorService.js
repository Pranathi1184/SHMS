import api from './api';

export const doctorService = {
  getDoctors: async (params = {}) => {
    const response = await api.get('/doctors', { params });
    return response.data;
  },
  createDoctor: async (data) => {
    const response = await api.post('/doctors', data);
    return response.data;
  },
  updateDoctorAvailability: async (id, data) => {
    const response = await api.put(`/doctors/${id}/availability`, data);
    return response.data;
  },
  updateClinicMode: async (id, data) => {
    const response = await api.put(`/doctors/${id}/clinic-mode`, data);
    return response.data;
  },
};
