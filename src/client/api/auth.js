import axios from 'axios';

const API_BASE_URL = '/api';

// Configure axios defaults
axios.defaults.withCredentials = true;

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/logout`);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await axios.get(`${API_BASE_URL}/auth/me`);
    return response.data;
  },

  // Check authentication status
  checkAuthStatus: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/status`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return { authenticated: false };
      }
      throw error;
    }
  }
};
