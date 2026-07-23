import { createContext, useContext, useEffect, useState } from 'react';
import api from '../configs/api';

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
                setUser(data.user);
                persistSession(token, data.user);
            } catch {
                clearSession();
                setToken('');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    const syncSession = (nextToken, nextUser) => {
        setToken(nextToken);
        setUser(nextUser);
        persistSession(nextToken, nextUser);
    };

    const login = async (credentials) => {
        const { data } = await api.post('/api/auth/login', credentials);
        if (data.requiresVerification) {
            return data;
        }
        syncSession(data.token, data.user);
        return data;
    };

    const verifyLoginCode = async (email, code) => {
        const { data } = await api.post('/api/auth/verify-login', { email, code });
        syncSession(data.token, data.user);
        return data.user;
    };

    const register = async (payload) => {
        const { data } = await api.post('/api/auth/register', payload);
        if (data.requiresVerification) {
            return data;
        }
        syncSession(data.token, data.user);
        return data;
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
                login,
                verifyLoginCode,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
};