import { useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import api from '@/configs/api';
import { addWorkspace, setCurrentWorkspace } from '@/features/workspaceSlice';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CreateWorkspaceDialog = ({ isDialogOpen, setIsDialogOpen }) => {
    const dispatch = useDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', image_url: '' });

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const { data } = await api.post('/api/workspaces', formData);
            const payload = data?.data || data;
            const newWorkspace = payload.workspace;
            if (newWorkspace) {
                dispatch(addWorkspace(newWorkspace));
                dispatch(setCurrentWorkspace(newWorkspace.id));
            }
            toast.success('Workspace created successfully');
            setIsDialogOpen(false);
            setFormData({ name: '', description: '', image_url: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create Workspace</DialogTitle>
                    <DialogDescription>
                        Create a dedicated space to collaborate on projects, track issues, and manage team members.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Workspace Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                            placeholder="e.g. Acme Product Team"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Avatar URL <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <Input
                            value={formData.image_url}
                            onChange={(event) => setFormData({ ...formData, image_url: event.target.value })}
                            placeholder="https://example.com/logo.png"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Description <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <Textarea
                            value={formData.description}
                            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                            placeholder="What is this workspace dedicated to?"
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            {isSubmitting ? 'Creating...' : 'Create Workspace'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateWorkspaceDialog;