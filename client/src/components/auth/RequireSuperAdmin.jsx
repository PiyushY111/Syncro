import { Navigate } from 'react-router-dom';
import { Loader2Icon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const RequireSuperAdmin = ({ children }) => {
    const { user, loading, isSuperAdmin } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
                <Loader2Icon className="size-7 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    if (!isSuperAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default RequireSuperAdmin;
