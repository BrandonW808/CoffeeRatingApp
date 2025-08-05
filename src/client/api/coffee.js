import axios from 'axios';

const API_BASE_URL = '/api/coffees';

export const coffeeAPI = {
  // Get all coffees with pagination and sorting
  getCoffees: async (params = {}) => {
    const response = await axios.get(API_BASE_URL, { params });
    return response.data;
  },

  // Get single coffee
  getCoffee: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  // Create new coffee
  createCoffee: async (coffeeData) => {
    const response = await axios.post(API_BASE_URL, coffeeData);
    return response.data;
  },

  // Update coffee
  updateCoffee: async (id, coffeeData) => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, coffeeData);
    return response.data;
  },

  // Delete coffee
  deleteCoffee: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  // Export coffee data
  exportData: async () => {
    const response = await axios.get(`${API_BASE_URL}/export/csv`);
    return response.data;
  },

  // Get statistics
  getStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/stats/summary`);
    return response.data;
  }
};
