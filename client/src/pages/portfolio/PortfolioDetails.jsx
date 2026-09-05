import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import { ArrowLeft, FolderKanban, RefreshCw, AlertCircle } from 'lucide-react';
import PortfolioMetrics from './PortfolioMetrics';
import PortfolioProjectsGrid from './PortfolioProjectsGrid';
import AddProjectModal from '@/components/portfolio/AddProjectModal';
import EntityVersionTimeline from '@/components/audit/EntityVersionTimeline';

function PortfolioDetailsSkeleton() {
    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-2 flex-1">
                    <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-80 bg-zinc-200 dark:bg-zinc-800/60 rounded" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4">
                <div className="h-5 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800/40" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function PortfolioDetails() {
    const [searchParams] = useSearchParams();
    const { id: routeId } = useParams();
    const id = searchParams.get('id') || routeId;
    const navigate = useNavigate();

    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);
    const workspaceProjects = currentWorkspace?.projects || [];

    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchPortfolioDetails = useCallback(async (forceRefresh = false) => {
        if (!id) {
            setLoading(false);
            return;
        }

        if (forceRefresh) {
            setIsRetrying(true);
        }

        try {
            const res = await api.get(`/api/portfolios/${id}`, { forceRefresh });
            const data = res.data?.portfolio ?? res.data?.data?.portfolio ?? res.data;
            if (data && data.id) {
                setPortfolio(data);
                setError(null);
            } else {
                setError('Portfolio not found');
            }
        } catch (err) {
            console.error('Failed to fetch portfolio details:', err);
            const message = err.response?.data?.message || (err.response?.status === 404 ? 'Portfolio not found' : 'Failed to load portfolio details');
            setError(message);
        } finally {
            setLoading(false);
            setIsRetrying(false);
        }
    }, [id]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchPortfolioDetails();
    }, [fetchPortfolioDetails]);

    if (loading) {
        return <PortfolioDetailsSkeleton />;
    }

    if (!id) {
        return (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/40 dark:bg-zinc-900/20 max-w-md mx-auto mt-24">
                <div className="mx-auto size-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                    <FolderKanban className="size-6" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">No Portfolio Selected</h3>
                <p className="text-xs text-zinc-500 mt-1 mb-4">Please select a portfolio to view its analytics, projects, and roadmap.</p>
                <button
                    onClick={() => navigate('/portfolios')}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition"
                >
                    View Portfolios
                </button>
            </div>
        );
    }

    if (error || !portfolio) {
        return (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/40 dark:bg-zinc-900/20 max-w-md mx-auto mt-24">
                <div className="mx-auto size-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
                    <AlertCircle className="size-6" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">{error || 'Portfolio not found'}</h3>
                <p className="text-xs text-zinc-500 mt-1 mb-5">
                    {error === 'Access restricted to workspace members only'
                        ? 'You do not have access to view this portfolio in this workspace.'
                        : 'This portfolio could not be found or may have been deleted.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => fetchPortfolioDetails(true)}
                        disabled={isRetrying}
                        className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <RefreshCw className={`size-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Retrying...' : 'Try Again'}
                    </button>
                    <button
                        onClick={() => navigate('/portfolios')}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition"
                    >
                        Back to Portfolios
                    </button>
                </div>
            </div>
        );
    }

    const attachedProjectIds = (portfolio.projects || []).map((p) => p.projectId);
    const availableProjects = workspaceProjects.filter((p) => !attachedProjectIds.includes(p.id));

    const handleAddProjects = async (projectIds) => {
        try {
            await api.post(`/api/portfolios/${id}/projects`, { projectIds });
            toast.success('Projects added');
            setIsAddModalOpen(false);
            fetchPortfolioDetails(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add projects');
        }
    };

    const handleRemoveProject = async (projectId) => {
        try {
            await api.delete(`/api/portfolios/${id}/projects/${projectId}`);
            toast.success('Project removed');
            fetchPortfolioDetails(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove project');
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto text-zinc-900 dark:text-white">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/portfolios')} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer">
                    <ArrowLeft className="size-4" /> Back to Portfolios
                </button>
            </div>

            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: `${portfolio.color || '#6366F1'}15`, color: portfolio.color || '#6366F1' }}>
                        <FolderKanban className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{portfolio.name}</h1>
                        <p className="text-xs text-zinc-500 mt-1">{portfolio.description || 'Enterprise project grouping'}</p>
                    </div>
                </div>
            </div>

            <PortfolioMetrics portfolio={portfolio} />

            <PortfolioProjectsGrid
                projects={portfolio.projects || []}
                onRemoveProject={handleRemoveProject}
                onOpenAddModal={() => setIsAddModalOpen(true)}
            />

            <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <EntityVersionTimeline entityType="PORTFOLIO" entityId={id} canRollback={false} />
            </div>

            <AddProjectModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddProjects}
                availableProjects={availableProjects}
            />
        </div>
    );
}
