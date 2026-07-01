import api from './api';

export const agentService = {
  getSchedulingSuggestions: async (params) => {
    const response = await api.get('/agents/scheduling', { params });
    return response.data;
  },
  triggerFollowUpAgent: async (payload = {}) => {
    const response = await api.post('/agents/follow-up/trigger', payload);
    return response.data;
  },
  triggerInventoryAgent: async (payload = {}) => {
    const response = await api.post('/agents/inventory/trigger', payload);
    return response.data;
  },
  triggerBillingAgent: async (payload = {}) => {
    const response = await api.post('/agents/billing/trigger', payload);
    return response.data;
  },
  getExecutionHistory: async (limit = 50) => {
    const response = await api.get('/agents/history', { params: { limit } });
    return response.data;
  },
  getSchedules: async () => {
    const response = await api.get('/agents/schedules');
    return response.data;
  },
};
