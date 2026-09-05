import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import PortfolioHeader from './PortfolioHeader';
import PortfolioCard from '@/components/portfolio/PortfolioCard';
import CreatePortfolioModal from '@/components/portfolio/CreatePortfolioModal';
import { FolderKanban } from 'lucide-react';

function PortfoliosListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                            <div className="space-y-2">
                                <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800/60 rounded" />
                            </div>
                        </div>
                    </div>
                    <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-800/50 rounded" />
                    <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800/50" />
                            <div className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800/50" />
                        </div>
                        <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                        <div className="h-8 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function Portfolios() {
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);
    const workspaceProjects = currentWorkspace?.projects || [];

    const [portfolios, setPortfolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchPortfolios = useCallback(async (forceRefresh = false) => {
        if (!currentWorkspace?.id) return;
        try {
            const res = await api.get(`/api/portfolios/workspace/${currentWorkspace.id}`, { forceRefresh });
            setPortfolios(res.data.portfolios || res.data?.data?.portfolios || []);
        } catch (err) {
            console.error('Failed to fetch portfolios:', err);
        } finally {
            setLoading(false);
        }
    }, [currentWorkspace?.id]);

    useEffect(() => {
        setLoading(true);
        fetchPortfolios();
    }, [fetchPortfolios]);

    const handleCreate = async (data) => {
        try {
            await api.post('/api/portfolios', { ...data, workspaceId: currentWorkspace.id });
            toast.success('Portfolio created');
            setIsCreateOpen(false);
            fetchPortfolios(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create portfolio');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/portfolios/${id}`);
            toast.success('Portfolio deleted');
            fetchPortfolios(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete portfolio');
        }
    };

    const filtered = portfolios.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto text-zinc-900 dark:text-white">
            <PortfolioHeader
                search={search}
                setSearch={setSearch}
                onOpenCreate={() => setIsCreateOpen(true)}
            />

            {loading ? (
                <PortfoliosListSkeleton />
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/40 dark:bg-zinc-900/20">
                    <div className="mx-auto size-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                        <FolderKanban className="size-6" />
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">No portfolios found</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                        Group related projects under strategic umbrellas for executive health tracking and multi-project roadmaps.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((p) => (
                        <PortfolioCard key={p.id} portfolio={p} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            <CreatePortfolioModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSave={handleCreate}
                workspaceProjects={workspaceProjects}
            />
        </div>
    );
}
