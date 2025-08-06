import axios from 'axios';

const API_BASE_URL = '/api/coffees';

// Configure axios defaults
axios.defaults.withCredentials = true;

// Get all coffees with pagination and sorting
export const getCoffees = async (params = {}) => {
  const response = await axios.get(API_BASE_URL, { params });
  return response.data;
}

// Get single coffee
export const getCoffee = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/${id}`);
  return response.data;
}

// Create new coffee
export const createCoffee = async (coffeeData) => {
  const response = await axios.post(API_BASE_URL, coffeeData);
  return response.data;
}

// Update coffee
export const updateCoffee = async (id, coffeeData) => {
  const response = await axios.put(`${API_BASE_URL}/${id}`, coffeeData);
  return response.data;
}

// Delete coffee
export const deleteCoffee = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/${id}`);
  return response.data;
}

// Get popular coffees
export const getPopularCoffees = async (limit = 10) => {
  const response = await axios.get(`${API_BASE_URL}/popular/top`, {
    params: { limit }
  });
  return response.data;
}

// Search coffees (autocomplete)
export const searchCoffees = async (query, field = 'all') => {
  const response = await axios.get(`${API_BASE_URL}/search/autocomplete`, {
    params: { q: query, field }
  });
  return response.data;
}

// Export coffee data
export const exportData = async () => {
  const response = await axios.get(`${API_BASE_URL}/export/csv`);
  return response.data;
}

// Get statistics
export const getStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/stats/summary`);
  return response.data;
}