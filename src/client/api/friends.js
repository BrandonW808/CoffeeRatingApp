// src/api/friends.js
import axios from 'axios';

const API_BASE_URL = '/api';

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

// Search users
export const searchUsers = async (query) => {
    try {
        const response = await api.get('/friends/search', {
            params: { q: query }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Get all friends and requests
export const getFriends = async (status = 'all') => {
    try {
        const response = await api.get('/friends', {
            params: { status }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Send friend request
export const sendFriendRequest = async (userId) => {
    try {
        const response = await api.post('/friends/request', { userId });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Accept friend request
export const acceptFriendRequest = async (friendshipId) => {
    try {
        const response = await api.put(`/friends/accept/${friendshipId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Reject friend request
export const rejectFriendRequest = async (friendshipId) => {
    try {
        const response = await api.put(`/friends/reject/${friendshipId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Remove friend or cancel request
export const removeFriend = async (friendshipId) => {
    try {
        const response = await api.delete(`/friends/${friendshipId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Get friend's brews
export const getFriendBrews = async (friendId, params = {}) => {
    try {
        const response = await api.get(`/friends/${friendId}/brews`, { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Get friend's profile
export const getFriendProfile = async (friendId) => {
    try {
        const response = await api.get(`/friends/${friendId}/profile`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};