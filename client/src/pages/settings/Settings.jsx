import { User, Settings2, Clock } from 'lucide-react';
import ProfileSettingsForm from '@/components/settings/ProfileSettingsForm';
import PasswordSettingsForm from '@/components/settings/PasswordSettingsForm';
import WorkspaceSettingsForm from '@/components/settings/WorkspaceSettingsForm';
import WorkspaceDeleteModal from '@/components/settings/WorkspaceDeleteModal';
import WorkspaceRequestsTab from '@/components/settings/WorkspaceRequestsTab';
import useSettings from '@/hooks/useSettings';

export default function SettingsPage() {
    const settings = useSettings();

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">Settings</h1>
                <p className="text-gray-500 dark:text-zinc-400 text-sm">Manage your profile account settings, workspace requests, and configurations.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-zinc-800 gap-4 text-left overflow-x-auto">
                <button
                    onClick={() => settings.setActiveTab('profile')}
                    className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        settings.activeTab === 'profile'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                    }`}
                >
                    <User size={16} />
                    Profile & Security
                </button>
                <button
                    onClick={() => settings.setActiveTab('requests')}
                    className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        settings.activeTab === 'requests'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                    }`}
                >
                    <Clock size={16} />
                    Workspace Requests
                </button>
                {settings.currentWorkspace && (
                    <button
                        onClick={() => settings.setActiveTab('workspace')}
                        className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                            settings.activeTab === 'workspace'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
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
                {settings.activeTab === 'profile' && (
                    <div className="space-y-8 divide-y divide-gray-200 dark:divide-zinc-800">
                        <ProfileSettingsForm
                            profileName={settings.profileName}
                            setProfileName={settings.setProfileName}
                            profileImage={settings.profileImage}
                            setProfileImage={settings.setProfileImage}
                            isUpdatingProfile={settings.isUpdatingProfile}
                            handleUpdateProfile={settings.handleUpdateProfile}
                            user={settings.user}
                        />

                        <PasswordSettingsForm
                            currentPassword={settings.currentPassword}
                            setCurrentPassword={settings.setCurrentPassword}
                            newPassword={settings.newPassword}
                            setNewPassword={settings.setNewPassword}
                            confirmPassword={settings.confirmPassword}
                            setConfirmPassword={settings.setConfirmPassword}
                            isUpdatingPassword={settings.isUpdatingPassword}
                            handleUpdatePassword={settings.handleUpdatePassword}
                        />
                    </div>
                )}

                {/* REQUESTS TAB */}
                {settings.activeTab === 'requests' && (
                    <WorkspaceRequestsTab />
                )}

                {/* WORKSPACE TAB */}
                {settings.activeTab === 'workspace' && settings.currentWorkspace && (
                    <WorkspaceSettingsForm
                        workspaceName={settings.workspaceName}
                        setWorkspaceName={settings.setWorkspaceName}
                        workspaceDesc={settings.workspaceDesc}
                        setWorkspaceDesc={settings.setWorkspaceDesc}
                        workspaceImage={settings.workspaceImage}
                        setWorkspaceImage={settings.setWorkspaceImage}
                        isUpdatingWorkspace={settings.isUpdatingWorkspace}
                        handleUpdateWorkspace={settings.handleUpdateWorkspace}
                        isWorkspaceAdmin={settings.isWorkspaceAdmin}
                        currentWorkspace={settings.currentWorkspace}
                        user={settings.user}
                        setShowDeleteModal={settings.setShowDeleteModal}
                    />
                )}
            </div>

            {/* Workspace Delete Modal */}
            <WorkspaceDeleteModal
                showDeleteModal={settings.showDeleteModal}
                setShowDeleteModal={settings.setShowDeleteModal}
                deleteConfirmText={settings.deleteConfirmText}
                setDeleteConfirmText={settings.setDeleteConfirmText}
                isDeletingWorkspace={settings.isDeletingWorkspace}
                handleDeleteWorkspace={settings.handleDeleteWorkspace}
                currentWorkspace={settings.currentWorkspace}
            />
        </div>
    );
}
