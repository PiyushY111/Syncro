import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import PortfolioHeader from './PortfolioHeader';
import PortfolioCard from '@/components/portfolio/PortfolioCard';
import CreatePortfolioModal from '@/components/portfolio/CreatePortfolioModal';
import { FolderKanban } from 'lucide-react';

export default function Portfolios() {
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);
    const workspaceProjects = currentWorkspace?.projects || [];

    const [portfolios, setPortfolios] = useState([]);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchPortfolios = async () => {
        if (!currentWorkspace?.id) return;
        try {
            const res = await api.get(`/api/portfolios/workspace/${currentWorkspace.id}`);
            setPortfolios(res.data.portfolios || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPortfolios();
    }, [currentWorkspace?.id]);

    const handleCreate = async (data) => {
        try {
            await api.post('/api/portfolios', { ...data, workspaceId: currentWorkspace.id });
            toast.success('Portfolio created');
            setIsCreateOpen(false);
            fetchPortfolios();
        } catch (err) {
            toast.error('Failed to create portfolio');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/portfolios/${id}`);
            toast.success('Portfolio deleted');
            fetchPortfolios();
        } catch (err) {
            toast.error('Failed to delete portfolio');
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

            {filtered.length === 0 ? (
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
