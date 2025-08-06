import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Get user's brews
export const getMyBrews = async (params = {}) => {
  try {
    const response = await api.get('/brews/my-brews', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get public brews
export const getPublicBrews = async (params = {}) => {
  try {
    const response = await api.get('/brews/public', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get single brew
export const getBrew = async (id) => {
  try {
    const response = await api.get(`/brews/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create new brew
export const createBrew = async (brewData) => {
  try {
    const response = await api.post('/brews', brewData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update brew
export const updateBrew = async (id, brewData) => {
  try {
    const response = await api.put(`/brews/${id}`, brewData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete brew
export const deleteBrew = async (id) => {
  try {
    const response = await api.delete(`/brews/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Toggle like on brew
export const toggleBrewLike = async (id) => {
  try {
    const response = await api.post(`/brews/${id}/like`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get brew statistics
export const getBrewStats = async () => {
  try {
    const response = await api.get('/brews/stats/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Export brews as CSV
export const exportBrewsCSV = async () => {
  try {
    const response = await api.get('/brews/export/csv', {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `brew-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    throw error.response?.data || error;
  }
};
