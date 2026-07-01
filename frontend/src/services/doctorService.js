import api from './api';
import createCrudService from './createCrudService';

const crud = createCrudService('/doctors');

export const doctorService = {
  getDoctors: crud.getAll,
  createDoctor: crud.create,
  updateDoctorAvailability: async (id, data) => {
    const response = await api.put(`/doctors/${id}/availability`, data);
    return response.data;
  },
  updateClinicMode: async (id, data) => {
    const response = await api.put(`/doctors/${id}/clinic-mode`, data);
    return response.data;
  },
};
