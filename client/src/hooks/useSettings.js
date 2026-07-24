import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import { useProfileSettings } from './useProfileSettings';
import { useWorkspaceSettings } from './useWorkspaceSettings';

export default function useSettings() {
    const { user, updateUser } = useAuth();
    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace);
    const [activeTab, setActiveTab] = useState('profile');

    const profileHook = useProfileSettings(user, updateUser);
    const workspaceHook = useWorkspaceSettings(currentWorkspace, user);

    return {
        user,
        currentWorkspace,
        activeTab,
        setActiveTab,
        ...profileHook,
        ...workspaceHook
    };
}
