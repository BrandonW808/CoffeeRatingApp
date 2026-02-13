// src/api/profile.js
import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
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

// Get current user profile
export const getProfile = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Update profile
export const updateProfile = async (profileData) => {
    try {
        const response = await api.put('/auth/profile', profileData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Change password
export const changePassword = async (passwordData) => {
    try {
        const response = await api.put('/auth/password', passwordData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Delete account
export const deleteAccount = async (password) => {
    try {
        const response = await api.delete('/auth/account', {
            data: { password }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};