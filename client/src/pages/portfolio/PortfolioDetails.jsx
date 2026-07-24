import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import { ArrowLeft, FolderKanban } from 'lucide-react';
import PortfolioMetrics from './PortfolioMetrics';
import PortfolioProjectsGrid from './PortfolioProjectsGrid';
import AddProjectModal from '@/components/portfolio/AddProjectModal';
import EntityVersionTimeline from '@/components/audit/EntityVersionTimeline';

export default function PortfolioDetails() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const navigate = useNavigate();

    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);
    const workspaceProjects = currentWorkspace?.projects || [];

    const [portfolio, setPortfolio] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchPortfolioDetails = async () => {
        if (!id) return;
        try {
            const res = await api.get(`/api/portfolios/${id}`);
            setPortfolio(res.data.portfolio);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPortfolioDetails();
    }, [id]);

    if (!portfolio) {
        return (
            <div className="p-6 text-center text-zinc-900 dark:text-zinc-200">
                <p className="text-3xl mt-40 mb-10 font-bold">Portfolio not found</p>
                <button onClick={() => navigate('/portfolios')} className="px-4 py-2 rounded bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white cursor-pointer">
                    Back to Portfolios
                </button>
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
            fetchPortfolioDetails();
        } catch (err) {
            toast.error('Failed to add projects');
        }
    };

    const handleRemoveProject = async (projectId) => {
        try {
            await api.delete(`/api/portfolios/${id}/projects/${projectId}`);
            toast.success('Project removed');
            fetchPortfolioDetails();
        } catch (err) {
            toast.error('Failed to remove project');
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
                    <div className="p-3 rounded-xl" style={{ backgroundColor: `${portfolio.color}15`, color: portfolio.color }}>
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
