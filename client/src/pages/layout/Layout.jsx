import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadTheme } from '@/features/themeSlice';
import { Loader2Icon } from 'lucide-react';
import { fetchWorkspaces, addWorkspace, setCurrentWorkspace } from '@/features/workspaceSlice';
import { useAuth } from '@/context/AuthContext';
import CreateWorkspaceDialog from '@/components/workspace/CreateWorkspaceDialog';
import NoWorkspaceScreen from '@/components/layout/NoWorkspaceScreen';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
    const { loading, workspaces } = useSelector((state) => state.workspace);
    const dispatch = useDispatch();
    const { user, loading: authLoading } = useAuth();
    const [isCreatingPersonal, setIsCreatingPersonal] = useState(false);
    const location = useLocation();
    const isChatPage = location.pathname.startsWith('/chat');

    const handleCreatePersonalWorkspace = async () => {
        setIsCreatingPersonal(true);
        try {
            const workspaceName = user?.name ? `${user.name}'s Personal Workspace` : 'My Personal Workspace';
            const { data } = await api.post('/api/workspaces', {
                name: workspaceName,
                description: 'Default workspace for personal projects and tasks.',
            });
            dispatch(addWorkspace(data.workspace));
            dispatch(setCurrentWorkspace(data.workspace.id));
            toast.success('Welcome! Your personal workspace is ready.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initialize workspace');
        } finally {
            setIsCreatingPersonal(false);
        }
    };

    useEffect(() => {
        dispatch(loadTheme());
    }, [dispatch]);

    useEffect(() => {
        if (authLoading || !user) return;

        const loadWorkspaces = () => dispatch(fetchWorkspaces());
        loadWorkspaces();

        const handleWindowFocus = () => loadWorkspaces();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadWorkspaces();
            }
        };

        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [authLoading, user, dispatch]);

    if (loading) {
        return (
            <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
                <Loader2Icon className="size-7 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!workspaces.length) {
        return (
            <NoWorkspaceScreen
                isCreateWorkspaceOpen={isCreateWorkspaceOpen}
                setIsCreateWorkspaceOpen={setIsCreateWorkspaceOpen}
                handleCreatePersonalWorkspace={handleCreatePersonalWorkspace}
                isCreatingPersonal={isCreatingPersonal}
            />
        );
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} onCreateWorkspace={() => setIsCreateWorkspaceOpen(true)} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className={`flex-1 min-h-0 ${isChatPage ? 'p-0 overflow-hidden' : 'p-6 xl:p-10 xl:px-16 overflow-y-auto'}`}>
                    <Outlet />
                </div>
            </div>
            <CreateWorkspaceDialog isDialogOpen={isCreateWorkspaceOpen} setIsDialogOpen={setIsCreateWorkspaceOpen} />
        </div>
    );
}
