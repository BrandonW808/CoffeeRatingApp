// src/api/coffee.js
import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with auth interceptor (matching brew.js pattern)
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
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

// Get all coffees with pagination and sorting
export const getCoffees = async (params = {}) => {
  try {
    const response = await api.get('/coffees', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get single coffee
export const getCoffee = async (id) => {
  try {
    const response = await api.get(`/coffees/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create new coffee
export const createCoffee = async (coffeeData) => {
  try {
    const response = await api.post('/coffees', coffeeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update coffee
export const updateCoffee = async (id, coffeeData) => {
  try {
    const response = await api.put(`/coffees/${id}`, coffeeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete coffee
export const deleteCoffee = async (id) => {
  try {
    const response = await api.delete(`/coffees/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get popular coffees
export const getPopularCoffees = async (limit = 10) => {
  try {
    const response = await api.get('/coffees/popular/top', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Search coffees (autocomplete)
export const searchCoffees = async (query, field = 'all') => {
  try {
    const response = await api.get('/coffees/search/autocomplete', {
      params: { q: query, field }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Export coffee data
export const exportData = async () => {
  try {
    const response = await api.get('/coffees/export/csv', {
      responseType: 'blob'
    });

    // Create download link - ALREADY HANDLES THE BLOB
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `coffee-data-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;  // Returns true, not data
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get statistics
export const getStats = async () => {
  try {
    const response = await api.get('/coffees/stats/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};