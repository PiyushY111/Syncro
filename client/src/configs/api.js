import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('pm-auth-token');

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    const currentWorkspaceId = localStorage.getItem('currentWorkspaceId');
    if (currentWorkspaceId && !config.headers['x-workspace-id']) {
        config.headers = config.headers || {};
        config.headers['x-workspace-id'] = currentWorkspaceId;
    }

    return config;
});

export default api;