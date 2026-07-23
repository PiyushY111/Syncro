import { Navigate, useLocation } from 'react-router-dom';
import { Loader2Icon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RequireAuth = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
                <Loader2Icon className="size-7 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) {
        const next = encodeURIComponent(`${location.pathname}${location.search}`);
        return <Navigate to={`/auth?next=${next}`} replace />;
    }

    return children;
};

export default RequireAuth;