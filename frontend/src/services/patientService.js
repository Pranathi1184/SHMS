import api from './api';

const normalizeListParams = (params = {}) => {
  const normalized = { ...params };
  if (normalized.limit !== undefined) {
    const parsedLimit = Number(normalized.limit);
    if (!Number.isFinite(parsedLimit)) {
      delete normalized.limit;
    } else {
      normalized.limit = Math.min(200, Math.max(1, Math.floor(parsedLimit)));
    }
  }
  return normalized;
};

export const patientService = {
  getMyProfile: async () => {
    const response = await api.get('/patients/me');
    return response.data;
  },

  getAllPatients: async (params = {}) => {
    const response = await api.get('/patients', { params: normalizeListParams(params) });
    return response.data;
  },

  getPatientById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (patientData) => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },

  updatePatient: async (id, patientData) => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
  },

  deletePatient: async (id) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },

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
