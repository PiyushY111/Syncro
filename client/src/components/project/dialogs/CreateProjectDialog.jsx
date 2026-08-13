import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import api from '@/configs/api';
import { addProject } from '@/features/workspaceSlice';
import { useAuth } from '@/context/AuthContext';
import TeamMembersSelector from '@/components/project/dialogs/TeamMembersSelector';
import ProjectDatesLeadSelector from '@/components/project/dialogs/ProjectDatesLeadSelector';
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
import { Badge } from '@/components/ui/badge';

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
        if (isSubmitting) return;
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

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Create New Project</DialogTitle>
                    <DialogDescription>
                        Set up a new project in <span className="font-semibold text-blue-600 dark:text-blue-400">{currentWorkspace?.name || 'Workspace'}</span>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Project Name <span className="text-rose-500">*</span>
                        </label>
                        <Input 
                            type="text" 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            placeholder="e.g. Website Redesign Q3" 
                            required 
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Description
                        </label>
                        <Textarea 
                            value={formData.description} 
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                            placeholder="Key goals, scope, and target outcomes..." 
                            rows={3} 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Status</label>
                            <select 
                                value={formData.status} 
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none"
                            >
                                <option value="PLANNING">Planning</option>
                                <option value="ACTIVE">Active</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Priority</label>
                            <select 
                                value={formData.priority} 
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })} 
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none"
                            >
                                <option value="LOW">Low Priority</option>
                                <option value="MEDIUM">Medium Priority</option>
                                <option value="HIGH">High Priority</option>
                            </select>
                        </div>
                    </div>

                    <ProjectDatesLeadSelector formData={formData} setFormData={setFormData} currentWorkspace={currentWorkspace} />
                    
                    <TeamMembersSelector 
                        teamMembers={formData.team_members} 
                        currentWorkspace={currentWorkspace} 
                        onAddMember={(e) => setFormData(prev => ({ ...prev, team_members: [...prev.team_members, e] }))} 
                        onRemoveMember={(e) => setFormData(prev => ({ ...prev, team_members: prev.team_members.filter(m => m !== e) }))} 
                    />

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
                            disabled={isSubmitting || !currentWorkspace}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                            {isSubmitting ? "Creating..." : "Create Project"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}