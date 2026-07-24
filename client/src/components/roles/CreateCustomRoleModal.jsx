import { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function CreateCustomRoleModal({ isOpen, onClose, onCreate }) {
    const [roleName, setRoleName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#8B5CF6');
    const [permissions, setPermissions] = useState({
        createProject: false, editProject: false, deleteProject: false,
        createTasks: true, editTasks: true, deleteTasks: false,
        manageMilestones: false, managePortfolios: false, viewAnalytics: true, manageMembers: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const featureKeys = [
        { key: 'createProject', label: 'Create Projects' },
        { key: 'editProject', label: 'Edit Projects' },
        { key: 'deleteProject', label: 'Delete Projects' },
        { key: 'createTasks', label: 'Create Tasks' },
        { key: 'editTasks', label: 'Edit Tasks' },
        { key: 'deleteTasks', label: 'Delete Tasks' },
        { key: 'manageMilestones', label: 'Manage Milestones' },
        { key: 'managePortfolios', label: 'Manage Portfolios' },
        { key: 'viewAnalytics', label: 'View Analytics' },
        { key: 'manageMembers', label: 'Manage Members' }
    ];

    const togglePermission = (key) => {
        setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onCreate({ roleName, description, color, permissions });
            setRoleName('');
            setDescription('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#6366F1'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Create Custom Role</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Role Title *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., QA Engineer, Designer, Lead Auditor"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Badge Color</label>
                        <div className="flex items-center gap-2">
                            {colors.map((c) => (
                                <button type="button" key={c} onClick={() => setColor(c)} className={`size-5 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : ''}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Feature Capabilities</label>
                        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                            {featureKeys.map((f) => (
                                <div key={f.key} onClick={() => togglePermission(f.key)} className={`p-1.5 rounded cursor-pointer flex items-center justify-between transition ${permissions[f.key] ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                                    <span className="truncate">{f.label}</span>
                                    {permissions[f.key] && <Check className="size-3 text-purple-600 dark:text-purple-400" />}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-3.5 py-1.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 cursor-pointer">{isSubmitting ? "Creating..." : "Create Role"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
