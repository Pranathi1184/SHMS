import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url || '');
    const normalizedUrl = requestUrl.toLowerCase();
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
    const isAuthEndpoint =
      normalizedUrl.includes('auth/login') ||
      normalizedUrl.includes('auth/register') ||
      normalizedUrl.includes('auth/refresh-token') ||
      normalizedUrl.includes('auth/me');

    if (isAuthEndpoint || isLoginPage) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('Missing refresh token');
        }

        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
          { refreshToken }
        );
        
        const { accessToken, refreshToken: rotatedRefreshToken } = response.data.data;
        localStorage.setItem('token', accessToken);
        if (rotatedRefreshToken) {
          localStorage.setItem('refreshToken', rotatedRefreshToken);
        }
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
