import api from './api';

export const enterpriseService = {
  createClaim: async (payload) => {
    const response = await api.post('/enterprise/claims', payload);
    return response.data;
  },
  getClaims: async (params = {}) => {
    const response = await api.get('/enterprise/claims', { params });
    return response.data;
  },
  updateClaimStatus: async (claimId, payload) => {
    const response = await api.patch(`/enterprise/claims/${claimId}/status`, payload);
    return response.data;
  },
  saveDischargePathway: async (payload) => {
    const response = await api.post('/enterprise/discharge-pathways', payload);
    return response.data;
  },
  getDischargePathways: async (params = {}) => {
    const response = await api.get('/enterprise/discharge-pathways', { params });
    return response.data;
  },
  sendCommunication: async (payload) => {
    const response = await api.post('/enterprise/communications/send', payload);
    return response.data;
  },
  getCommunications: async (params = {}) => {
    const response = await api.get('/enterprise/communications', { params });
    return response.data;
  },
};
