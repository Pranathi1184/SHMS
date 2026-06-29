import api from './api';

export const appointmentService = {
  checkAvailability: async (params) => {
    const response = await api.get('/appointments/availability', { params });
    return response.data;
  },
  getAvailableDoctors: async (params) => {
    const response = await api.get('/appointments/available-doctors', { params });
    return response.data;
  },
  findBestSlots: async (params) => {
    const response = await api.get('/appointments/slot-finder', { params });
    return response.data;
  },
  getPreVisitReadiness: async (params = {}) => {
    const response = await api.get('/appointments/pre-visit-readiness', { params });
    return response.data;
  },
  createAppointment: async (data) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },
  getAppointments: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },
  getAppointmentById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  updateAppointment: async (id, data) => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  },
  cancelAppointment: async (id) => {
    const response = await api.put(`/appointments/${id}/cancel`);
    return response.data;
  },
};
