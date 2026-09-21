/**
 * Role-Based Access Control (RBAC) Portal View Component
 */
import { useState, useEffect, useCallback } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { updateWorkspace } from '@/features/workspaceSlice';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import RoleHeader from './RoleHeader';
import RoleMatrixTable from './RoleMatrixTable';
import RoleMembersList from './RoleMembersList';
import RoleCapabilitiesCard from './RoleCapabilitiesCard';
import CreateCustomRoleModal from './CreateCustomRoleModal';

export default function RolePortalView() {
    const dispatch = useDispatch();
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);

    const [roleMatrix, setRoleMatrix] = useState({});
    const [customRoles, setCustomRoles] = useState([]);
    const [allowManagerPortalAccess, setAllowManagerPortalAccess] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [canManagePortal, setCanManagePortal] = useState(false);
    const [members, setMembers] = useState([]);
    const [activeTab, setActiveTab] = useState('matrix');
    const [isSaving, setIsSaving] = useState(false);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

    const fetchRoleData = useCallback(async () => {
        if (!currentWorkspace?.id) return;
        try {
            const res = await api.get(`/api/roles/workspace/${currentWorkspace.id}`);
            setRoleMatrix(res.data.roleMatrix || {});
            setCustomRoles(res.data.customRoles || []);
            setAllowManagerPortalAccess(res.data.allowManagerPortalAccess || false);
            setIsOwner(res.data.isOwner || false);
            setCanManagePortal(res.data.canManagePortal || res.data.isOwner || false);
            setMembers(res.data.members || []);
        } catch (err) {
            console.error(err);
        }
    }, [currentWorkspace?.id]);

    useEffect(() => {
        fetchRoleData();
    }, [fetchRoleData]);

    const handleToggleFeature = async (role, featureKey, value) => {
        const updatedMatrix = {
            ...roleMatrix,
            [role]: { ...(roleMatrix[role] || {}), [featureKey]: value }
        };
        setRoleMatrix(updatedMatrix);
        await saveRoleMatrix(updatedMatrix, allowManagerPortalAccess);
    };

    const handleToggleManagerAccess = async (value) => {
        setAllowManagerPortalAccess(value);
        await saveRoleMatrix(roleMatrix, value);
    };

    const saveRoleMatrix = async (matrix, managerAccess) => {
        setIsSaving(true);
        try {
            const res = await api.patch(`/api/roles/workspace/${currentWorkspace.id}/matrix`, {
                roleMatrix: matrix,
                allowManagerPortalAccess: managerAccess
            });
            if (res.data.settings && currentWorkspace) {
                dispatch(updateWorkspace({ ...currentWorkspace, settings: res.data.settings }));
            }
            toast.success('Permissions updated');
        } catch {
            toast.error('Failed to update permissions');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateCustomRole = async (roleData) => {
        try {
            await api.post(`/api/roles/workspace/${currentWorkspace.id}/custom-role`, {
                ...roleData,
                workspaceId: currentWorkspace.id
            });
            toast.success('Custom role created');
            setIsCustomModalOpen(false);
            fetchRoleData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create custom role');
        }
    };

    const handleDeleteCustomRole = async (roleKey) => {
        try {
            await api.delete(`/api/roles/workspace/${currentWorkspace.id}/custom-role/${roleKey}`);
            toast.success('Custom role deleted');
            fetchRoleData();
        } catch {
            toast.error('Failed to delete custom role');
        }
    };

    const handleUpdateMemberRole = async (targetUserId, newRole) => {
        try {
            await api.patch(`/api/roles/workspace/${currentWorkspace.id}/member`, { targetUserId, newRole });
            toast.success('Member role updated');
            fetchRoleData();
        } catch {
            toast.error('Failed to update member role');
        }
    };

    return (
        <div className="space-y-5 max-w-5xl mx-auto">
            <RoleHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOwner={isOwner}
                canManagePortal={canManagePortal}
                allowManagerPortalAccess={allowManagerPortalAccess}
                onToggleManagerAccess={handleToggleManagerAccess}
                isSaving={isSaving}
                onOpenCustomModal={() => setIsCustomModalOpen(true)}
                onApplyPreset={(preset) => { setRoleMatrix(preset); saveRoleMatrix(preset, allowManagerPortalAccess); }}
            />

            <RoleCapabilitiesCard roleMatrix={roleMatrix} />

            {activeTab === 'matrix' && (
                <RoleMatrixTable
                    roleMatrix={roleMatrix}
                    customRoles={customRoles}
                    onToggleFeature={handleToggleFeature}
                    onDeleteCustomRole={handleDeleteCustomRole}
                    isOwner={isOwner}
                    canManagePortal={canManagePortal}
                />
            )}

            {activeTab === 'members' && (
                <RoleMembersList
                    members={members}
                    customRoles={customRoles}
                    onUpdateMemberRole={handleUpdateMemberRole}
                    isOwner={isOwner}
                    canManagePortal={canManagePortal}
                />
            )}


            <CreateCustomRoleModal
                isOpen={isCustomModalOpen}
                onClose={() => setIsCustomModalOpen(false)}
                onCreate={handleCreateCustomRole}
            />
        </div>
    );
}
