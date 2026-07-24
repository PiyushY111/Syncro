import { useState } from 'react';
import { XIcon } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import api from '@/configs/api';
import { addProject } from '@/features/workspaceSlice';
import { useAuth } from '@/context/AuthContext';
import TeamMembersSelector from '@/components/project/dialogs/TeamMembersSelector';
import ProjectDatesLeadSelector from '@/components/project/dialogs/ProjectDatesLeadSelector';

export default function CreateProjectDialog({ isDialogOpen, setIsDialogOpen }) {
    const { token } = useAuth();
    const dispatch = useDispatch();
    const { currentWorkspace } = useSelector((state) => state.workspace);

    const [formData, setFormData] = useState({
        name: "", description: "", status: "PLANNING", priority: "MEDIUM",
        start_date: "", end_date: "", team_members: [], team_lead: "", progress: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.team_lead) return toast.error("Please select a project lead.");
            setIsSubmitting(true);
            const { data } = await api.post('/api/projects', { ...formData, workspaceId: currentWorkspace.id }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(addProject(data.project));
            setIsDialogOpen(false);
            toast.success("Project created successfully!");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "Failed to create project.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isDialogOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur flex items-center justify-center text-left z-50">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-lg text-zinc-900 dark:text-zinc-200 relative">
                <button className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer" onClick={() => setIsDialogOpen(false)}>
                    <XIcon className="size-5" />
                </button>
                <h2 className="text-xl font-medium mb-1">Create New Project</h2>
                {currentWorkspace && <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">In workspace: <span className="text-blue-600 dark:text-blue-400">{currentWorkspace.name}</span></p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Project Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter project name" className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your project" className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-sm h-20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-sm">
                                <option value="PLANNING">Planning</option>
                                <option value="ACTIVE">Active</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Priority</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-sm">
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>
                    <ProjectDatesLeadSelector formData={formData} setFormData={setFormData} currentWorkspace={currentWorkspace} />
                    <TeamMembersSelector teamMembers={formData.team_members} currentWorkspace={currentWorkspace} onAddMember={(e) => setFormData(prev => ({ ...prev, team_members: [...prev.team_members, e] }))} onRemoveMember={(e) => setFormData(prev => ({ ...prev, team_members: prev.team_members.filter(m => m !== e) }))} />
                    <div className="flex justify-end gap-3 pt-2 text-sm">
                        <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer">Cancel</button>
                        <button disabled={isSubmitting || !currentWorkspace} className="px-4 py-2 rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer">{isSubmitting ? "Creating..." : "Create Project"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}