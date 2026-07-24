import { format } from 'date-fns';
import { Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/configs/api';
import { fetchWorkspaces } from '@/features/workspaceSlice';
import { useAuth } from '@/context/AuthContext';
import ProjectMembersList from '@/components/project/dialogs/ProjectMembersList';
import { getUserWorkspaceRole, canEditProject, canDeleteProject } from '@/utils/permissions';

export default function ProjectSettings({ project }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace);

    const currentUserRole = getUserWorkspaceRole(currentWorkspace, user?.id);
    const hasEditPermission = canEditProject(currentUserRole, project, user?.id);
    const hasDeletePermission = canDeleteProject(currentUserRole, project, user?.id);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: "",
        end_date: "",
        progress: 0,
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hasEditPermission) return toast.error("You do not have permission to edit project settings");
        setIsSubmitting(true);
        toast.loading("Saving...");
        try {
            const { data } = await api.put('/api/projects', formData, { headers: { Authorization: `Bearer ${token}` } });
            setIsDialogOpen(false);
            dispatch(fetchWorkspaces({ token }));
            toast.dismissAll();
            toast.success(data.message);
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!hasDeletePermission) return toast.error("You do not have permission to delete this project");
        if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/projects/${project.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Project deleted successfully");
            dispatch(fetchWorkspaces({ token }));
            navigate('/projects');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete project");
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        if (project) setFormData(project);
    }, [project]);

    const inputClasses = "w-full px-3 py-2 rounded mt-2 border text-sm dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 disabled:opacity-60 disabled:cursor-not-allowed";
    const cardClasses = "rounded-lg border p-6 not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border-zinc-300 dark:border-zinc-800";
    const labelClasses = "text-sm text-zinc-600 dark:text-zinc-400";

    return (
        <div className="grid lg:grid-cols-2 gap-8 text-left">
            {/* Project Details */}
            <div className={cardClasses}>
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">Project Details</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className={labelClasses}>Project Name</label>
                        <input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClasses} required disabled={!hasEditPermission} />
                    </div>

                    <div className="space-y-2">
                        <label className={labelClasses}>Description</label>
                        <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClasses + " h-24"} disabled={!hasEditPermission} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={labelClasses}>Status</label>
                            <select value={formData.status || 'PLANNING'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={inputClasses} disabled={!hasEditPermission}>
                                <option value="PLANNING">Planning</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Priority</label>
                            <select value={formData.priority || 'MEDIUM'} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className={inputClasses} disabled={!hasEditPermission}>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={labelClasses}>Start Date</label>
                            <input type="date" value={formData.start_date ? format(new Date(formData.start_date), "yyyy-MM-dd") : ""} onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value) })} className={inputClasses} disabled={!hasEditPermission} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>End Date</label>
                            <input type="date" value={formData.end_date ? format(new Date(formData.end_date), "yyyy-MM-dd") : ""} onChange={(e) => setFormData({ ...formData, end_date: new Date(e.target.value) })} className={inputClasses} disabled={!hasEditPermission} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={labelClasses}>Progress: {formData.progress || 0}%</label>
                        <input type="range" min="0" max="100" step="5" value={formData.progress || 0} onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })} className="w-full accent-blue-500 dark:accent-blue-400 disabled:opacity-50" disabled={!hasEditPermission} />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        {hasDeletePermission && (
                            <button type="button" onClick={handleDeleteProject} disabled={isDeleting} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-2 rounded transition cursor-pointer">
                                <Trash2 className="size-4" /> {isDeleting ? "Deleting..." : "Delete Project"}
                            </button>
                        )}
                        {hasEditPermission && (
                            <button type="submit" disabled={isSubmitting} className="ml-auto flex items-center text-sm justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded cursor-pointer">
                                <Save className="size-4" /> {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Team Members List */}
            <ProjectMembersList
                project={project}
                isDialogOpen={isDialogOpen}
                setIsDialogOpen={setIsDialogOpen}
                cardClasses={cardClasses}
            />
        </div>
    );
}
