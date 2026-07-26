import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
})

api.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('pm-auth-token');

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    const method = config.method?.toLowerCase();
    const url = config.url || '';
    const isMutative = ['post', 'put', 'patch', 'delete'].includes(method);
    const isBypassed = url.includes('/login') || url.includes('/register') || url.includes('/logout') || url.includes('/chat/message') || url.includes('/verify') || url.includes('/auth') || url.includes('/message') || config.headers?.skipConfirm;

    if (isMutative && !isBypassed && window.__triggerConfirmModal) {
        let action = 'create';
        if (method === 'delete') action = 'delete';
        else if (['put', 'patch'].includes(method)) action = 'edit';
        
        let entity = 'item';
        if (url.includes('/projects')) entity = 'project';
        else if (url.includes('/tasks')) entity = 'task';
        else if (url.includes('/workspaces')) entity = 'workspace';
        else if (url.includes('/milestones')) entity = 'milestone';
        else if (url.includes('/subteams')) entity = 'sub-team';
        else if (url.includes('/roles')) entity = 'role';
        else if (url.includes('/chat/channels')) entity = 'channel';
        else if (url.includes('/meetings')) entity = 'meeting';
        else if (url.includes('/whiteboards')) entity = 'whiteboard';

        const confirmed = await new Promise((resolve) => {
            window.__confirmResolver = resolve;
            window.__triggerConfirmModal(action, entity);
        });

        if (!confirmed) {
            throw new axios.Cancel('Operation cancelled by user');
        }
    }

    return config;
});

export default api;