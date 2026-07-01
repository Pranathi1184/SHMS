import api from './api';
import createCrudService from './createCrudService';

const crud = createCrudService('/patients');

export const patientService = {
  getMyProfile: async () => {
    const response = await api.get('/patients/me');
    return response.data;
  },

  getAllPatients: crud.getAll,
  getPatientById: crud.getById,
  createPatient: crud.create,
  updatePatient: crud.update,
  deletePatient: crud.delete,

  uploadPatientDocument: async (patientId, payload) => {
    const formData = new FormData();
    formData.append('document', payload.file);
    if (payload.category) formData.append('category', payload.category);
    if (payload.notes) formData.append('notes', payload.notes);

    const response = await api.post(`/patients/${patientId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getPatientDocuments: async (patientId) => {
    const response = await api.get(`/patients/${patientId}/documents`);
    return response.data;
  },
};
