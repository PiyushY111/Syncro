import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { updateWorkspace, deleteWorkspace } from '../features/workspaceSlice';
import api from '../configs/api';
import toast from 'react-hot-toast';
import { User, ShieldAlert, Settings2, Lock, Trash2, Globe } from 'lucide-react';

export default function SettingsPage() {
    const dispatch = useDispatch();
    const { user, updateUser } = useAuth();
    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace);

    const [activeTab, setActiveTab] = useState('profile');

    // Profile State
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profileImage, setProfileImage] = useState(user?.image || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Workspace State
    const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || '');
    const [workspaceDesc, setWorkspaceDesc] = useState(currentWorkspace?.description || '');
    const [workspaceImage, setWorkspaceImage] = useState(currentWorkspace?.image_url || '');
    const [isUpdatingWorkspace, setIsUpdatingWorkspace] = useState(false);

    // Workspace Delete State
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Sync state on change
    useEffect(() => {
        setWorkspaceName(currentWorkspace?.name || '');
        setWorkspaceDesc(currentWorkspace?.description || '');
        setWorkspaceImage(currentWorkspace?.image_url || '');
    }, [currentWorkspace]);

    useEffect(() => {
        setProfileName(user?.name || '');
        setProfileImage(user?.image || '');
    }, [user]);

    // Check if current user is admin/owner
    const isWorkspaceAdmin = currentWorkspace?.ownerId === user?.id || 
        currentWorkspace?.members?.some(m => m.userId === user?.id && ['OWNER', 'ADMIN'].includes(m.role));


    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!profileName.trim()) {
            toast.error('Name is required');
            return;
        }
        setIsUpdatingProfile(true);
        try {
            const { data } = await api.put('/api/auth/profile', {
                name: profileName,
                image: profileImage,
            });
            updateUser(data.user);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) {
            toast.error('Please fill in password fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setIsUpdatingPassword(true);
        try {
            await api.put('/api/auth/password', {
                currentPassword,
                newPassword,
            });
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleUpdateWorkspace = async (e) => {
        e.preventDefault();
        if (!currentWorkspace) return;
        if (!workspaceName.trim()) {
            toast.error('Workspace name is required');
            return;
        }
        setIsUpdatingWorkspace(true);
        try {
            const { data } = await api.put(`/api/workspaces/${currentWorkspace.id}`, {
                name: workspaceName,
                description: workspaceDesc,
                image_url: workspaceImage,
            });
            dispatch(updateWorkspace(data.workspace));
            toast.success('Workspace updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update workspace');
        } finally {
            setIsUpdatingWorkspace(false);
        }
    };

    const handleDeleteWorkspace = async () => {
        if (!currentWorkspace) return;
        if (deleteConfirmText !== currentWorkspace.name) {
            toast.error('Confirmation name does not match');
            return;
        }
        setIsDeletingWorkspace(true);
        try {
            await api.delete(`/api/workspaces/${currentWorkspace.id}`);
            dispatch(deleteWorkspace(currentWorkspace.id));
            toast.success('Workspace deleted successfully');
            setShowDeleteModal(false);
            setDeleteConfirmText('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete workspace');
        } finally {
            setIsDeletingWorkspace(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">Settings</h1>
                <p className="text-gray-500 dark:text-zinc-400 text-sm">Manage your profile account settings and workspace configurations.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-zinc-800 gap-4">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-all ${
                        activeTab === 'profile'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                    }`}
                >
                    <User size={16} />
                    Profile & Security
                </button>
                {currentWorkspace && (
                    <button
                        onClick={() => setActiveTab('workspace')}
                        className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-all ${
                            activeTab === 'workspace'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                        }`}
                    >
                        <Settings2 size={16} />
                        Workspace Settings
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                
                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="space-y-8 divide-y divide-gray-200 dark:divide-zinc-800">
                        {/* Profile Info Form */}
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                    <Globe size={18} className="text-blue-500" />
                                    Profile Details
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">Update your public profile details.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Name</label>
                                    <input
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Email Address</label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 cursor-not-allowed outline-none"
                                    />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Avatar Image URL</label>
                                    <input
                                        type="text"
                                        value={profileImage}
                                        onChange={(e) => setProfileImage(e.target.value)}
                                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                                        placeholder="https://example.com/image.png"
                                    />
                                    {profileImage && (
                                        <div className="mt-2 flex items-center gap-3">
                                            <img src={profileImage} alt="Avatar Preview" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-zinc-700" onError={(e) => e.target.style.display = 'none'} />
                                            <span className="text-xs text-gray-400">Preview image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isUpdatingProfile}
                                    className="px-5 py-2 text-sm font-semibold rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-95 disabled:opacity-50 transition"
                                >
                                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>

                        {/* Password Form */}
                        <form onSubmit={handleUpdatePassword} className="space-y-6 pt-8">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                    <Lock size={18} className="text-blue-500" />
                                    Security & Password
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">Change your password below. We recommend a length of at least 6 characters.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isUpdatingPassword}
                                    className="px-5 py-2 text-sm font-semibold rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-95 disabled:opacity-50 transition"
                                >
                                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* WORKSPACE TAB */}
                {activeTab === 'workspace' && currentWorkspace && (
                    <div className="space-y-8 divide-y divide-gray-200 dark:divide-zinc-800">
                        {/* Edit metadata */}
                        <form onSubmit={handleUpdateWorkspace} className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                    <Settings2 size={18} className="text-blue-500" />
                                    Workspace Configuration
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">Configure name and information of the workspace.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Workspace Name</label>
                                    <input
                                        type="text"
                                        value={workspaceName}
                                        onChange={(e) => setWorkspaceName(e.target.value)}
                                        disabled={!isWorkspaceAdmin}
                                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none disabled:opacity-55 disabled:cursor-not-allowed"
                                        placeholder="Workspace Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Workspace Avatar URL</label>
                                    <input
                                        type="text"
                                        value={workspaceImage}
                                        onChange={(e) => setWorkspaceImage(e.target.value)}
                                        disabled={!isWorkspaceAdmin}
                                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none disabled:opacity-55 disabled:cursor-not-allowed"
                                        placeholder="https://example.com/workspace.png"
                                    />
                                    {workspaceImage && (
                                        <div className="mt-2 flex items-center gap-3">
                                            <img src={workspaceImage} alt="Workspace Preview" className="w-10 h-10 rounded object-cover border border-gray-200 dark:border-zinc-700" onError={(e) => e.target.style.display = 'none'} />
                                            <span className="text-xs text-gray-400">Workspace avatar preview</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Description</label>
                                    <textarea
                                        value={workspaceDesc}
                                        onChange={(e) => setWorkspaceDesc(e.target.value)}
                                        disabled={!isWorkspaceAdmin}
                                        rows={4}
                                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none disabled:opacity-55 disabled:cursor-not-allowed resize-none"
                                        placeholder="Workspace description..."
                                    />
                                </div>
                            </div>

                            {isWorkspaceAdmin && (
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isUpdatingWorkspace}
                                        className="px-5 py-2 text-sm font-semibold rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-95 disabled:opacity-50 transition"
                                    >
                                        {isUpdatingWorkspace ? 'Updating Workspace...' : 'Update Workspace'}
                                    </button>
                                </div>
                            )}
                        </form>

                        {/* Danger zone */}
                        {currentWorkspace?.ownerId === user?.id && (
                            <div className="pt-8 space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
                                        <Trash2 size={18} />
                                        Danger Zone
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">Permanently delete this workspace and all associated projects and tasks.</p>
                                </div>

                                <div className="border border-red-200 dark:border-red-950 bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">Delete this workspace</p>
                                        <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-0.5">This action cannot be undone. All data will be permanently wiped.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded bg-red-600 text-white hover:bg-red-500 transition"
                                    >
                                        <Trash2 size={15} />
                                        Delete Workspace
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Workspace Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                            <ShieldAlert className="w-6 h-6" />
                            <h3 className="text-lg font-semibold">Delete Workspace</h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                            Are you absolutely sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{currentWorkspace?.name}"</span>? 
                            This will instantly delete all projects, members, tasks, and history associated with this workspace.
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                                    To confirm, type the workspace name: <span className="font-semibold text-gray-900 dark:text-white">"{currentWorkspace?.name}"</span>
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full text-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white outline-none focus:border-red-500"
                                    placeholder="Enter workspace name"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteConfirmText('');
                                    }}
                                    className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={deleteConfirmText !== currentWorkspace?.name || isDeletingWorkspace}
                                    onClick={handleDeleteWorkspace}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-xl transition"
                                >
                                    {isDeletingWorkspace ? 'Deleting...' : 'Delete permanently'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
