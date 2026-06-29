import api from './api';

export const analyticsService = {
  getSummary: async () => {
    const response = await api.get('/analytics/summary');
    return response.data;
  },
  getKpiDrilldown: async (metric = 'revenue') => {
    const response = await api.get('/analytics/kpi-drilldown', { params: { metric } });
    return response.data;
  },
  getNoShowRisk: async (appointmentIds = []) => {
    const response = await api.get('/analytics/ml/no-show-risk', {
      params: {
        appointmentIds: appointmentIds.join(','),
      },
    });
    return response.data;
  },
  getDoctorLoadForecast: async () => {
    const response = await api.get('/analytics/ml/doctor-load-forecast');
    return response.data;
  },
  getCapacityHeatmap: async (params = {}) => {
    const response = await api.get('/analytics/capacity-heatmap', { params });
    return response.data;
  },
  runDataQualityChecks: async () => {
    const response = await api.post('/analytics/data-quality/run');
    return response.data;
  },
};
