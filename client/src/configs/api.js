import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://projectmanagementserver.vercel.app'),
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('pm-auth-token');

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;