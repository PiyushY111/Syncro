import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/configs/api';

const AUTH_TOKEN_KEY = 'pm-auth-token';
const AUTH_USER_KEY = 'pm-auth-user';

const AuthContext = createContext(null);

const readStoredUser = () => {
    const stored = localStorage.getItem(AUTH_USER_KEY);

    if (!stored) {
        return null;
    }

    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
};

const persistSession = (token, user) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => readStoredUser());
    const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const bootstrap = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await api.get('/api/auth/me');
                const payload = data?.data || data;
                setUser(payload.user);
                persistSession(token, payload.user);
            } catch {
                clearSession();
                setToken('');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, [token]);

    const syncSession = (nextToken, nextUser) => {
        setToken(nextToken);
        setUser(nextUser);
        persistSession(nextToken, nextUser);
    };

    const login = async (credentials) => {
        const { data } = await api.post('/api/auth/login', credentials);
        const payload = data?.data || data;
        if (payload?.requiresVerification) {
            clearSession();
            setToken('');
            setUser(null);
            return payload;
        }
        syncSession(payload.token, payload.user);
        return payload;
    };

    const verifyLoginCode = async (email, code) => {
        const { data } = await api.post('/api/auth/verify-login', { email, code });
        const payload = data?.data || data;
        syncSession(payload.token, payload.user);
        return payload.user;
    };

    const register = async (payloadData) => {
        const { data } = await api.post('/api/auth/register', payloadData);
        const payload = data?.data || data;
        if (payload?.requiresVerification) {
            clearSession();
            setToken('');
            setUser(null);
            return payload;
        }
        syncSession(payload.token, payload.user);
        return payload;
    };

    const refreshUser = async () => {
        if (!token) return null;
        try {
            const { data } = await api.get('/api/auth/me');
            const payload = data?.data || data;
            if (payload?.user) {
                setUser(payload.user);
                persistSession(token, payload.user);
                return payload.user;
            }
        } catch {
            return null;
        }
    };

    const logout = () => {
        clearSession();
        setToken('');
        setUser(null);
    };

    const updateUser = (nextUser) => {
        setUser(nextUser);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated: Boolean(user),
                isSuperAdmin: Boolean(user?.isSuperAdmin),
                isPendingApproval: user?.status === 'PENDING_APPROVAL',
                isRejected: user?.status === 'REJECTED',
                login,
                verifyLoginCode,
                register,
                logout,
                updateUser,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
};