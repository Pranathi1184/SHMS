import api from './api';

export const aiService = {
  getPatientSummary: async (patientId) => {
    const response = await api.get(`/ai/patient-summary/${patientId}`);
    return response.data;
  },
  getMedicalReport: async (data) => {
    const response = await api.post('/ai/medical-report', data);
    return response.data;
  },
  getReminderMessage: async (appointmentId) => {
    const response = await api.get(`/ai/appointment-reminder/${appointmentId}`);
    return response.data;
  },
  handleChatbotQuery: async (query, patientId, context = {}) => {
    const response = await api.post('/ai/chatbot', { query, patientId, context });
    return response.data;
  },
};
