import { createContext, useContext, useEffect, useState } from 'react';
import api, { setCsrfToken } from '@/configs/api';
import { AUTH_EXPIRED_EVENT } from '@/configs/sessionRefresh';

// Only non-sensitive display data is cached client-side, purely to avoid a
// flash-of-unauthenticated-content on reload. The actual credential (the JWT)
// lives only in the httpOnly session cookie the server sets — it is never
// readable by JS, so it can't be exfiltrated by an XSS payload reading storage.
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

const persistDisplayUser = (user) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

const clearDisplayUser = () => {
    localStorage.removeItem(AUTH_USER_KEY);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => readStoredUser());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                // Bypass the GET cache: this must reflect the live session.
                const { data } = await api.get('/api/auth/me', { cache: false });
                const payload = data?.data || data;
                setUser(payload.user);
                persistDisplayUser(payload.user);
                setCsrfToken(payload.csrfToken);
            } catch (error) {
                // Only a definite rejection ends the session. A timeout, network blip, cold database or
                // server restart keeps the cached user; the next API call re-validates (and refreshes) it.
                const status = error?.response?.status;
                if (status === 401 || status === 403) {
                    clearDisplayUser();
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    // Fired by the API client when the 7-day refresh session itself is gone.
    useEffect(() => {
        const handleExpired = () => {
            clearDisplayUser();
            setUser(null);
            setCsrfToken(null);
        };
        window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
        return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    }, []);

    const syncSession = (nextUser, csrfToken) => {
        setUser(nextUser);
        persistDisplayUser(nextUser);
        setCsrfToken(csrfToken);
    };

    const login = async (credentials) => {
        const { data } = await api.post('/api/auth/login', credentials);
        const payload = data?.data || data;
        if (payload?.requiresVerification) {
            clearDisplayUser();
            setUser(null);
            return payload;
        }
        syncSession(payload.user, payload.csrfToken);
        return payload;
    };

    const verifyLoginCode = async (email, code) => {
        const { data } = await api.post('/api/auth/verify-login', { email, code });
        const payload = data?.data || data;
        syncSession(payload.user, payload.csrfToken);
        return payload.user;
    };

    const register = async (payloadData) => {
        const { data } = await api.post('/api/auth/register', payloadData);
        const payload = data?.data || data;
        if (payload?.requiresVerification) {
            clearDisplayUser();
            setUser(null);
            return payload;
        }
        syncSession(payload.user, payload.csrfToken);
        return payload;
    };

    const refreshUser = async () => {
        try {
            const { data } = await api.get('/api/auth/me');
            const payload = data?.data || data;
            if (payload?.user) {
                setUser(payload.user);
                persistDisplayUser(payload.user);
                setCsrfToken(payload.csrfToken);
                return payload.user;
            }
        } catch {
            return null;
        }
    };

    const logout = async () => {
        try {
            // Revokes the session server-side (blacklists the JTI) — logging out
            // client-side only would leave the session usable by anyone holding the cookie/token.
            await api.post('/api/auth/logout');
        } catch {
            // Best-effort: still clear local state even if the network call fails.
        }
        clearDisplayUser();
        setUser(null);
        setCsrfToken(null);
    };

    const updateUser = (nextUser) => {
        setUser(nextUser);
        persistDisplayUser(nextUser);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
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
