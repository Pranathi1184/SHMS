import api from './api';

export const notificationService = {
  getMyNotifications: async (limit = 20) => {
    const response = await api.get('/notifications', { params: { limit } });
    return response.data;
  },
  markNotificationRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllNotificationsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
  markNotificationsRead: async (ids = []) => {
    if (!ids.length) return [];
    return Promise.all(ids.map((id) => api.patch(`/notifications/${id}/read`)));
  },
};
