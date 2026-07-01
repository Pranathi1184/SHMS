import api from './api';
import createCrudService from './createCrudService';

const crud = createCrudService('/appointments');

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
  createAppointment: crud.create,
  getAppointments: crud.getAll,
  getAppointmentById: crud.getById,
  updateAppointment: crud.update,
  cancelAppointment: async (id) => {
    const response = await api.put(`/appointments/${id}/cancel`);
    return response.data;
  },
};
