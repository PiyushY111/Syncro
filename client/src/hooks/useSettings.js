import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import { updateWorkspace, deleteWorkspace } from '@/features/workspaceSlice';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function useSettings() {
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

    return {
        user,
        currentWorkspace,
        activeTab,
        setActiveTab,
        profileName,
        setProfileName,
        profileImage,
        setProfileImage,
        isUpdatingProfile,
        handleUpdateProfile,
        currentPassword,
        setCurrentPassword,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        isUpdatingPassword,
        handleUpdatePassword,
        workspaceName,
        setWorkspaceName,
        workspaceDesc,
        setWorkspaceDesc,
        workspaceImage,
        setWorkspaceImage,
        isUpdatingWorkspace,
        handleUpdateWorkspace,
        deleteConfirmText,
        setDeleteConfirmText,
        isDeletingWorkspace,
        handleDeleteWorkspace,
        showDeleteModal,
        setShowDeleteModal,
        isWorkspaceAdmin
    };
}
