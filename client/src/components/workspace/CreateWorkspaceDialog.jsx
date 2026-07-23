import { useState } from 'react';
import { Plus, XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import api from '@/configs/api';
import { addWorkspace, setCurrentWorkspace } from '@/features/workspaceSlice';

const CreateWorkspaceDialog = ({ isDialogOpen, setIsDialogOpen }) => {
    const dispatch = useDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', image_url: '' });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const { data } = await api.post('/api/workspaces', formData);
            dispatch(addWorkspace(data.workspace));
            dispatch(setCurrentWorkspace(data.workspace.id));
            toast.success('Workspace created successfully');
            setIsDialogOpen(false);
            setFormData({ name: '', description: '', image_url: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isDialogOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-900/20 dark:bg-zinc-950 dark:text-white">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">New Workspace</p>
                        <h2 className="mt-1 text-2xl font-semibold">Create a workspace</h2>
                    </div>
                    <button type="button" onClick={() => setIsDialogOpen(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
                        <XIcon className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">Workspace name</label>
                        <input
                            value={formData.name}
                            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-950"
                            placeholder="Acme Product Team"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">Workspace Avatar URL</label>
                        <input
                            value={formData.image_url}
                            onChange={(event) => setFormData({ ...formData, image_url: event.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-950"
                            placeholder="https://example.com/workspace-avatar.png"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-950"
                            placeholder="What is this workspace for?"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsDialogOpen(false)} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
                            <Plus className="size-4" />
                            {isSubmitting ? 'Creating...' : 'Create Workspace'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateWorkspaceDialog;