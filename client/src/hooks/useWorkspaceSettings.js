import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateWorkspace, deleteWorkspace } from '@/features/workspaceSlice';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export function useWorkspaceSettings(currentWorkspace, user) {
    const dispatch = useDispatch();
    const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || '');
    const [workspaceDesc, setWorkspaceDesc] = useState(currentWorkspace?.description || '');
    const [workspaceImage, setWorkspaceImage] = useState(currentWorkspace?.image_url || '');
    const [isUpdatingWorkspace, setIsUpdatingWorkspace] = useState(false);

    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        setWorkspaceName(currentWorkspace?.name || '');
        setWorkspaceDesc(currentWorkspace?.description || '');
        setWorkspaceImage(currentWorkspace?.image_url || '');
    }, [currentWorkspace]);

    const isWorkspaceAdmin = currentWorkspace?.ownerId === user?.id || 
        currentWorkspace?.members?.some(m => m.userId === user?.id && ['OWNER', 'ADMIN'].includes(m.role));

    const handleUpdateWorkspace = async (e) => {
        e.preventDefault();
        if (!currentWorkspace) return;
        if (!workspaceName.trim()) return toast.error('Workspace name is required');
        setIsUpdatingWorkspace(true);
        try {
            const { data } = await api.put(`/api/workspaces/${currentWorkspace.id}`, {
                name: workspaceName, description: workspaceDesc, image_url: workspaceImage,
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
        if (deleteConfirmText !== currentWorkspace.name) return toast.error('Confirmation name does not match');
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
        workspaceName, setWorkspaceName, workspaceDesc, setWorkspaceDesc,
        workspaceImage, setWorkspaceImage, isUpdatingWorkspace, handleUpdateWorkspace,
        deleteConfirmText, setDeleteConfirmText, isDeletingWorkspace, handleDeleteWorkspace,
        showDeleteModal, setShowDeleteModal, isWorkspaceAdmin
    };
}
