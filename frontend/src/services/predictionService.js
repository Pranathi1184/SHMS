import api from './api';

export const predictionService = {
  // No-Show Predictions
  getNoShowPredictions: async (params = {}) => {
    const response = await api.get('/predictions/no-show', { params });
    return response.data;
  },

  // Doctor Load Forecast
  getDoctorLoadForecasts: async (params = {}) => {
    const response = await api.get('/predictions/doctor-load', { params });
    return response.data;
  },

  // Medicine Demand Forecast
  getMedicineDemandForecasts: async (params = {}) => {
    const response = await api.get('/predictions/medicine-demand', { params });
    return response.data;
  },

  // Bed Occupancy Forecast
  getBedOccupancyForecasts: async (params = {}) => {
    const response = await api.get('/predictions/bed-occupancy', { params });
    return response.data;
  },

  // Billing Risk Scores
  getBillingRiskScores: async (params = {}) => {
    const response = await api.get('/predictions/billing-risk', { params });
    return response.data;
  },

  // Prediction Summary (Admin only)
  getPredictionSummary: async () => {
    const response = await api.get('/predictions/summary');
    return response.data;
  },
};
