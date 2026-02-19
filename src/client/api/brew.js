// src/api/brew.js
import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

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

export const getMyBrews = async (params = {}) => {
  try {
    const response = await api.get('/brews/my-brews', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPublicBrews = async (params = {}) => {
  try {
    const response = await api.get('/brews/public', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBrew = async (id) => {
  try {
    const response = await api.get(`/brews/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createBrew = async (brewData) => {
  try {
    const response = await api.post('/brews', brewData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBrew = async (id, brewData) => {
  try {
    const response = await api.put(`/brews/${id}`, brewData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteBrew = async (id) => {
  try {
    const response = await api.delete(`/brews/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleBrewLike = async (id) => {
  try {
    const response = await api.post(`/brews/${id}/like`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBrewStats = async () => {
  try {
    const response = await api.get('/brews/stats/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const exportBrewsCSV = async () => {
  try {
    const response = await api.get('/brews/export/csv', {
      responseType: 'blob'
    });

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

// ── NEW: Brew image API functions ─────────────────

export const uploadBrewImages = async (brewId, files) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const token = localStorage.getItem('token');
  const response = await fetch(`/api/brews/${brewId}/images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Upload failed');
  }

  return response.json();
};

export const deleteBrewImage = async (brewId, imageId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/brews/${brewId}/images/${imageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Delete failed');
  }

  return response.json();
};

export const setBrewPrimaryImage = async (brewId, imageId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `/api/brews/${brewId}/images/${imageId}/primary`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to set primary');
  }

  return response.json();
};