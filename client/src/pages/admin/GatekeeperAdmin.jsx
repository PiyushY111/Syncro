import { useState, useEffect, useCallback } from 'react';
import {
    Shield,
    Users,
    Building2,
    KeyRound,
    RefreshCw,
    Sliders,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/configs/api';

import GatekeeperStats from '@/components/admin/GatekeeperStats';
import PendingUsersTab from '@/components/admin/PendingUsersTab';
import PendingWorkspacesTab from '@/components/admin/PendingWorkspacesTab';
import VipPassesTab from '@/components/admin/VipPassesTab';
import GatekeeperPoliciesTab from '@/components/admin/GatekeeperPoliciesTab';
import UserDirectoryTab from '@/components/admin/UserDirectoryTab';

export default function GatekeeperAdmin() {
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'workspaces' | 'settings' | 'vip' | 'users'
    const [loading, setLoading] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Overview & Stats
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingUsersCount: 0,
        totalWorkspaces: 0,
        pendingWorkspacesCount: 0,
        activeVipCodesCount: 0,
    });

    // Settings
    const [settings, setSettings] = useState({
        userRegistrationMode: 'APPROVAL_REQUIRED',
        workspaceCreationMode: 'APPROVAL_REQUIRED',
        whitelistedDomains: [],
        notifyAdminOnRequest: true,
        autoApproveInvitedMembers: true,
        customPendingMessage: '',
    });
    const [domainInput, setDomainInput] = useState('');

    // Pending queues
    const [pendingUsers, setPendingUsers] = useState([]);
    const [pendingWorkspaces, setPendingWorkspaces] = useState([]);

    // VIP Codes
    const [vipCodes, setVipCodes] = useState([]);
    const [newVipForm, setNewVipForm] = useState({
        code: '',
        scope: 'ALL_ACCESS',
        maxUses: 1,
        expiresAt: '',
        note: '',
    });
    const [isCreatingVip, setIsCreatingVip] = useState(false);

    // All Users
    const [allUsers, setAllUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [userStatusFilter] = useState('');

    const fetchOverviewAndSettings = useCallback(async () => {
        try {
            const { data } = await api.get('/api/admin/overview');
            const payload = data?.data || data;
            if (payload.settings) setSettings(payload.settings);
            if (payload.stats) setStats(payload.stats);
        } catch {
            toast.error('Failed to load gatekeeper settings');
        }
    }, []);

    const fetchPending = useCallback(async () => {
        try {
            const { data } = await api.get('/api/admin/pending');
            const payload = data?.data || data;
            setPendingUsers(payload.pendingUsers || []);
            setPendingWorkspaces(payload.pendingWorkspaces || []);
        } catch {
            toast.error('Failed to load pending requests');
        }
    }, []);

    const fetchVipCodes = useCallback(async () => {
        try {
            const { data } = await api.get('/api/admin/vip-codes');
            const payload = data?.data || data;
            setVipCodes(payload.codes || []);
        } catch {
            toast.error('Failed to load VIP invite codes');
        }
    }, []);

    const fetchAllUsers = useCallback(async () => {
        try {
            const params = {};
            if (userSearch) params.search = userSearch;
            if (userStatusFilter) params.status = userStatusFilter;
            const { data } = await api.get('/api/admin/users', { params });
            const payload = data?.data || data;
            setAllUsers(payload.users || []);
        } catch {
            toast.error('Failed to load users directory');
        }
    }, [userSearch, userStatusFilter]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        await Promise.all([
            fetchOverviewAndSettings(),
            fetchPending(),
            fetchVipCodes(),
            fetchAllUsers(),
        ]);
        setLoading(false);
    }, [fetchOverviewAndSettings, fetchPending, fetchVipCodes, fetchAllUsers]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // Save Settings
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const { data } = await api.put('/api/admin/settings', settings);
            const payload = data?.data || data;
            setSettings(payload.settings);
            toast.success('Gatekeeper policies updated and cached!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update settings');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleAddDomain = (e) => {
        e.preventDefault();
        const clean = domainInput.trim().replace(/^@/, '').toLowerCase();
        if (!clean) return;
        if (settings.whitelistedDomains.includes(clean)) {
            toast.error('Domain already in whitelist');
            return;
        }
        setSettings({
            ...settings,
            whitelistedDomains: [...settings.whitelistedDomains, clean],
        });
        setDomainInput('');
    };

    const handleRemoveDomain = (domainToRemove) => {
        setSettings({
            ...settings,
            whitelistedDomains: settings.whitelistedDomains.filter((d) => d !== domainToRemove),
        });
    };

    // User Actions
    const handleApproveUser = async (userId) => {
        try {
            await api.post(`/api/admin/users/${userId}/approve`);
            toast.success('User approved & notification email sent!');
            fetchPending();
            fetchOverviewAndSettings();
            fetchAllUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve user');
        }
    };

    const handleRejectUser = async (userId) => {
        const reason = window.prompt('Enter rejection reason (optional):', 'Access request declined by administrator');
        if (reason === null) return;
        try {
            await api.post(`/api/admin/users/${userId}/reject`, { reason });
            toast.success('User request rejected');
            fetchPending();
            fetchOverviewAndSettings();
            fetchAllUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject user');
        }
    };

    // Workspace Actions
    const handleApproveWorkspace = async (workspaceId) => {
        try {
            await api.post(`/api/admin/workspaces/${workspaceId}/approve`);
            toast.success('Workspace approved and provisioned!');
            fetchPending();
            fetchOverviewAndSettings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve workspace');
        }
    };

    const handleRejectWorkspace = async (workspaceId) => {
        const reason = window.prompt('Enter rejection reason:', 'Workspace creation declined');
        if (reason === null) return;
        try {
            await api.post(`/api/admin/workspaces/${workspaceId}/reject`, { reason });
            toast.success('Workspace request rejected');
            fetchPending();
            fetchOverviewAndSettings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject workspace');
        }
    };

    // VIP Code Actions
    const handleCreateVipCode = async (e) => {
        e.preventDefault();
        setIsCreatingVip(true);
        try {
            await api.post('/api/admin/vip-codes', newVipForm);
            toast.success('VIP Pass created successfully');
            setNewVipForm({ code: '', scope: 'ALL_ACCESS', maxUses: 1, expiresAt: '', note: '' });
            fetchVipCodes();
            fetchOverviewAndSettings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate VIP code');
        } finally {
            setIsCreatingVip(false);
        }
    };

    const handleRevokeVipCode = async (id) => {
        if (!window.confirm('Are you sure you want to revoke this VIP code?')) return;
        try {
            await api.delete(`/api/admin/vip-codes/${id}`);
            toast.success('VIP code revoked');
            fetchVipCodes();
            fetchOverviewAndSettings();
        } catch {
            toast.error('Failed to revoke code');
        }
    };

    const copyVipLink = (code) => {
        const url = `${window.location.origin}/auth?invite=${code}`;
        navigator.clipboard.writeText(url);
        toast.success(`Copied VIP invite link for ${code}!`);
    };

    // Toggle SuperAdmin
    const handleToggleSuperAdmin = async (userId) => {
        try {
            const { data } = await api.put(`/api/admin/users/${userId}/superadmin`);
            toast.success(data?.message || 'Super-Admin access updated');
            fetchAllUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update super-admin privilege');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="size-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16">
            {/* Master Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="size-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Shield className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Gatekeeper Command Center
                                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    Super-Admin Only
                                </span>
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                                Dynamic access gate, account verification queues, workspace provisioning & VIP pass generation.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={loadAll}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition cursor-pointer self-start sm:self-auto"
                >
                    <RefreshCw className="size-3.5" />
                    Refresh Engine
                </button>
            </div>

            {/* Metrics Dashboard */}
            <GatekeeperStats stats={stats} />

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-zinc-800 space-x-1 sm:space-x-4 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                        activeTab === 'pending'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                >
                    <Users className="size-4" />
                    Pending Users
                    {pendingUsers.length > 0 && (
                        <span className="size-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                            {pendingUsers.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('workspaces')}
                    className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                        activeTab === 'workspaces'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                >
                    <Building2 className="size-4" />
                    Pending Workspaces
                    {pendingWorkspaces.length > 0 && (
                        <span className="size-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                            {pendingWorkspaces.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('vip')}
                    className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                        activeTab === 'vip'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                >
                    <KeyRound className="size-4" />
                    VIP Passes & Invites
                </button>

                <button
                    onClick={() => setActiveTab('settings')}
                    className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                        activeTab === 'settings'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                >
                    <Sliders className="size-4" />
                    Policies & Rules
                </button>

                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                        activeTab === 'users'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                >
                    <Shield className="size-4" />
                    User Directory & Roles
                </button>
            </div>

            {/* TAB 1: PENDING USERS QUEUE */}
            {activeTab === 'pending' && (
                <PendingUsersTab
                    pendingUsers={pendingUsers}
                    onApproveUser={handleApproveUser}
                    onRejectUser={handleRejectUser}
                />
            )}

            {/* TAB 2: PENDING WORKSPACES QUEUE */}
            {activeTab === 'workspaces' && (
                <PendingWorkspacesTab
                    pendingWorkspaces={pendingWorkspaces}
                    onApproveWorkspace={handleApproveWorkspace}
                    onRejectWorkspace={handleRejectWorkspace}
                />
            )}

            {/* TAB 3: VIP PASSES & INVITES */}
            {activeTab === 'vip' && (
                <VipPassesTab
                    vipCodes={vipCodes}
                    newVipForm={newVipForm}
                    setNewVipForm={setNewVipForm}
                    isCreatingVip={isCreatingVip}
                    onCreateVipCode={handleCreateVipCode}
                    onRevokeVipCode={handleRevokeVipCode}
                    onCopyVipLink={copyVipLink}
                />
            )}

            {/* TAB 4: POLICIES & RULES */}
            {activeTab === 'settings' && (
                <GatekeeperPoliciesTab
                    settings={settings}
                    setSettings={setSettings}
                    domainInput={domainInput}
                    setDomainInput={setDomainInput}
                    isSavingSettings={isSavingSettings}
                    onSaveSettings={handleSaveSettings}
                    onAddDomain={handleAddDomain}
                    onRemoveDomain={handleRemoveDomain}
                />
            )}

            {/* TAB 5: GLOBAL USERS DIRECTORY */}
            {activeTab === 'users' && (
                <UserDirectoryTab
                    allUsers={allUsers}
                    userSearch={userSearch}
                    setUserSearch={setUserSearch}
                    onToggleSuperAdmin={handleToggleSuperAdmin}
                />
            )}
        </div>
    );
}
