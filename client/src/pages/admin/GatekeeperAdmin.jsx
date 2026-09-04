import { useState, useEffect, useCallback } from 'react';
import {
    Shield,
    Users,
    Building2,
    KeyRound,
    CheckCircle2,
    XCircle,
    Clock,
    Plus,
    Copy,
    Trash2,
    RefreshCw,
    Search,
    Sliders,
    Sparkles,
    AlertTriangle,
    Mail,
    Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/configs/api';

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
    const [userStatusFilter, setUserStatusFilter] = useState('');

    const fetchOverviewAndSettings = useCallback(async () => {
        try {
            const { data } = await api.get('/api/admin/overview');
            const payload = data?.data || data;
            if (payload.settings) setSettings(payload.settings);
            if (payload.stats) setStats(payload.stats);
        } catch (err) {
            toast.error('Failed to load gatekeeper settings');
        }
    }, []);

    const fetchPending = useCallback(async () => {
        try {
            const { data } = await api.get('/api/admin/pending');
            const payload = data?.data || data;
            setPendingUsers(payload.pendingUsers || []);
            setPendingWorkspaces(payload.pendingWorkspaces || []);
        } catch (err) {
            toast.error('Failed to load pending requests');
        }
    }, []);

    const fetchVipCodes = useCallback(async () => {
        try {
            const { data } = await api.get('/api/admin/vip-codes');
            const payload = data?.data || data;
            setVipCodes(payload.codes || []);
        } catch (err) {
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
        } catch (err) {
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
        } catch (err) {
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
            const payload = data?.data || data;
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Pending Users</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-extrabold ${stats.pendingUsersCount > 0 ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                            {stats.pendingUsersCount}
                        </span>
                        {stats.pendingUsersCount > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                Action Needed
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Pending Workspaces</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-extrabold ${stats.pendingWorkspacesCount > 0 ? 'text-blue-600 dark:text-blue-400 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                            {stats.pendingWorkspacesCount}
                        </span>
                        {stats.pendingWorkspacesCount > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                Action Needed
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Active VIP Passes</span>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {stats.activeVipCodesCount}
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Total Workspaces</span>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {stats.totalWorkspaces}
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm col-span-2 md:col-span-1">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Total Registered Users</span>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {stats.totalUsers}
                    </div>
                </div>
            </div>

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
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Pending User Approvals</span>
                            <span className="text-xs font-normal text-slate-500">({pendingUsers.length} awaiting review)</span>
                        </h2>
                    </div>

                    {pendingUsers.length === 0 ? (
                        <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                            <CheckCircle2 className="size-12 text-emerald-500 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">All Clear! No Pending Users</h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                                Every registered user has been processed. New signup requests will appear here in real-time.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingUsers.map((pUser) => (
                                <div
                                    key={pUser.id}
                                    className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-amber-500/50 transition"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                                                    {pUser.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{pUser.name}</h4>
                                                    <p className="text-xs text-slate-500 font-mono">{pUser.email}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                                PENDING
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 pt-1">
                                            <Clock className="size-3.5" />
                                            <span>Registered: {new Date(pUser.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-5 border-t border-slate-100 dark:border-zinc-800 mt-4">
                                        <button
                                            onClick={() => handleApproveUser(pUser.id)}
                                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                                        >
                                            <Check className="size-3.5" />
                                            Approve Access
                                        </button>
                                        <button
                                            onClick={() => handleRejectUser(pUser.id)}
                                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                                        >
                                            <XCircle className="size-3.5" />
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: PENDING WORKSPACES QUEUE */}
            {activeTab === 'workspaces' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Pending Workspace Creation Requests</span>
                            <span className="text-xs font-normal text-slate-500">({pendingWorkspaces.length} awaiting review)</span>
                        </h2>
                    </div>

                    {pendingWorkspaces.length === 0 ? (
                        <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                            <CheckCircle2 className="size-12 text-blue-500 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Pending Workspace Requests</h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                                All organization and team space provisioning requests have been processed.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingWorkspaces.map((pWb) => (
                                <div
                                    key={pWb.id}
                                    className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-base border border-blue-200 dark:border-blue-800">
                                                    🏢
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{pWb.name}</h4>
                                                    <p className="text-xs text-slate-500 font-mono">slug: {pWb.slug}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                                WAITING PROVISION
                                            </span>
                                        </div>

                                        {pWb.description && (
                                            <p className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                                                {pWb.description}
                                            </p>
                                        )}

                                        <div className="text-xs text-slate-500 dark:text-zinc-400 space-y-1 pt-1">
                                            <div>
                                                Requested by: <span className="font-semibold text-slate-800 dark:text-zinc-200">{pWb.owner?.name}</span> ({pWb.owner?.email})
                                            </div>
                                            <div>Date: {new Date(pWb.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-5 border-t border-slate-100 dark:border-zinc-800 mt-4">
                                        <button
                                            onClick={() => handleApproveWorkspace(pWb.id)}
                                            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                                        >
                                            <Check className="size-3.5" />
                                            Approve & Provision
                                        </button>
                                        <button
                                            onClick={() => handleRejectWorkspace(pWb.id)}
                                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                                        >
                                            <XCircle className="size-3.5" />
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: VIP PASSES & INVITES */}
            {activeTab === 'vip' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* VIP Generator */}
                    <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <KeyRound className="size-5 text-amber-500" />
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create VIP Invite Pass</h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                            Generate VIP bypass tokens. Users holding this code bypass the approval queue instantly.
                        </p>

                        <form onSubmit={handleCreateVipCode} className="space-y-4 pt-2">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                    Custom Pass Code <span className="text-slate-400 font-normal">(Leave blank to auto-generate)</span>
                                </label>
                                <input
                                    type="text"
                                    value={newVipForm.code}
                                    onChange={(e) => setNewVipForm({ ...newVipForm, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g. VIP-FOUNDER-2026"
                                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono uppercase text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Bypass Scope</label>
                                <select
                                    value={newVipForm.scope}
                                    onChange={(e) => setNewVipForm({ ...newVipForm, scope: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="ALL_ACCESS">All Access (Account + Org Creation)</option>
                                    <option value="ACCOUNT_ONLY">Account Registration Only</option>
                                    <option value="ORG_ONLY">Workspace Creation Only</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Max Uses (0 = ∞)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newVipForm.maxUses}
                                        onChange={(e) => setNewVipForm({ ...newVipForm, maxUses: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={newVipForm.expiresAt}
                                        onChange={(e) => setNewVipForm({ ...newVipForm, expiresAt: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Internal Note / Target</label>
                                <input
                                    type="text"
                                    value={newVipForm.note}
                                    onChange={(e) => setNewVipForm({ ...newVipForm, note: e.target.value })}
                                    placeholder="e.g. For Beta Reviewers squad"
                                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isCreatingVip}
                                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                            >
                                <Sparkles className="size-4" />
                                {isCreatingVip ? 'Generating...' : 'Generate VIP Pass'}
                            </button>
                        </form>
                    </div>

                    {/* Active VIP Codes Table */}
                    <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Active VIP Passes ({vipCodes.length})</h3>
                        </div>

                        {vipCodes.length === 0 ? (
                            <p className="text-xs text-slate-500 py-8 text-center">No active VIP passes. Create one using the form on the left.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500">
                                            <th className="pb-3 font-semibold">Code / Link</th>
                                            <th className="pb-3 font-semibold">Scope</th>
                                            <th className="pb-3 font-semibold">Redemptions</th>
                                            <th className="pb-3 font-semibold">Status</th>
                                            <th className="pb-3 font-semibold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                                        {vipCodes.map((vip) => (
                                            <tr key={vip.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                                                <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    <div className="flex items-center gap-2">
                                                        <span>{vip.code}</span>
                                                        <button
                                                            onClick={() => copyVipLink(vip.code)}
                                                            title="Copy Invite Link"
                                                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition cursor-pointer"
                                                        >
                                                            <Copy className="size-3" />
                                                        </button>
                                                    </div>
                                                    {vip.note && <div className="text-[10px] text-slate-400 font-sans font-normal">{vip.note}</div>}
                                                </td>
                                                <td className="py-3 text-slate-600 dark:text-zinc-300">{vip.scope}</td>
                                                <td className="py-3">
                                                    <span className="font-semibold">{vip.usedCount}</span>
                                                    <span className="text-slate-400"> / {vip.maxUses === 0 ? '∞' : vip.maxUses}</span>
                                                </td>
                                                <td className="py-3">
                                                    {vip.isActive ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                                            ACTIVE
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500">
                                                            EXPIRED
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <button
                                                        onClick={() => handleRevokeVipCode(vip.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                                                        title="Revoke VIP Pass"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: POLICIES & RULES */}
            {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
                    {/* Mode 1: User Registration Policy */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">User Registration Access Policy</h3>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">
                                    Controls how new people can join the platform.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            {[
                                {
                                    id: 'OPEN',
                                    title: '🟢 Open Public Mode',
                                    desc: 'Anyone can sign up and get instant access.',
                                },
                                {
                                    id: 'APPROVAL_REQUIRED',
                                    title: '🟡 Super-Admin Review',
                                    desc: 'Users register but wait for your explicit approval.',
                                },
                                {
                                    id: 'INVITE_ONLY',
                                    title: '🔴 Strict Invite-Only',
                                    desc: 'Registration is locked unless holding a valid VIP code.',
                                },
                            ].map((mode) => (
                                <label
                                    key={mode.id}
                                    onClick={() => setSettings({ ...settings, userRegistrationMode: mode.id })}
                                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                                        settings.userRegistrationMode === mode.id
                                            ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20'
                                            : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold text-slate-900 dark:text-white">{mode.title}</div>
                                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">{mode.desc}</p>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                        {settings.userRegistrationMode === mode.id && <Check className="size-3.5" />}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Mode 2: Workspace Creation Policy */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Organization / Workspace Creation Policy</h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                                Controls who can spawn new organizations and personal workspace sandboxes.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            {[
                                {
                                    id: 'OPEN',
                                    title: '🟢 Open Workspace Creation',
                                    desc: 'Users can spawn new workspaces anytime.',
                                },
                                {
                                    id: 'APPROVAL_REQUIRED',
                                    title: '🟡 Admin Approval Gate',
                                    desc: 'Workspace requests wait for your approval.',
                                },
                                {
                                    id: 'INVITE_ONLY',
                                    title: '🔴 VIP Code Required',
                                    desc: 'Creating an org requires a valid VIP Org pass.',
                                },
                            ].map((mode) => (
                                <label
                                    key={mode.id}
                                    onClick={() => setSettings({ ...settings, workspaceCreationMode: mode.id })}
                                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                                        settings.workspaceCreationMode === mode.id
                                            ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20'
                                            : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold text-slate-900 dark:text-white">{mode.title}</div>
                                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">{mode.desc}</p>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                        {settings.workspaceCreationMode === mode.id && <Check className="size-3.5" />}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Whitelisted Email Domains */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Whitelisted Corporate / Personal Domains</h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                                Any user registering with an email matching these domains auto-bypasses the approval queue.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={domainInput}
                                onChange={(e) => setDomainInput(e.target.value)}
                                placeholder="e.g. piyushydv.com or google.com"
                                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddDomain}
                                className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                                Add Domain
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            {settings.whitelistedDomains?.length === 0 ? (
                                <span className="text-xs text-slate-400">No domain bypasses configured yet.</span>
                            ) : (
                                settings.whitelistedDomains.map((domain) => (
                                    <span
                                        key={domain}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                    >
                                        @{domain}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDomain(domain)}
                                            className="hover:text-rose-500 cursor-pointer"
                                        >
                                            <XCircle className="size-3.5" />
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Checkboxes & Custom Message */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notifyAdminOnRequest}
                                    onChange={(e) => setSettings({ ...settings, notifyAdminOnRequest: e.target.checked })}
                                    className="size-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Email Super-Admin on New Pending Requests</span>
                                    <p className="text-[11px] text-slate-500">Sends you an instant email alert when someone signs up or requests an organization.</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.autoApproveInvitedMembers}
                                    onChange={(e) => setSettings({ ...settings, autoApproveInvitedMembers: e.target.checked })}
                                    className="size-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Auto-Approve Invited Teammates</span>
                                    <p className="text-[11px] text-slate-500">Users accepting an email invitation to an approved workspace bypass the waitlist.</p>
                                </div>
                            </label>
                        </div>

                        <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-zinc-800">
                            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                Custom Waiting Screen Message
                            </label>
                            <textarea
                                value={settings.customPendingMessage}
                                onChange={(e) => setSettings({ ...settings, customPendingMessage: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                    >
                        <Sparkles className="size-4" />
                        {isSavingSettings ? 'Saving Policies...' : 'Save & Broadcast Policy Changes'}
                    </button>
                </form>
            )}

            {/* TAB 5: GLOBAL USERS DIRECTORY */}
            {activeTab === 'users' && (
                <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Registered Users Directory</h3>
                            <p className="text-xs text-slate-500">Manage account access, review workspaces, and assign Super-Admin status.</p>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="Search name or email..."
                                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500">
                                    <th className="pb-3 font-semibold">User</th>
                                    <th className="pb-3 font-semibold">Status</th>
                                    <th className="pb-3 font-semibold">Super-Admin</th>
                                    <th className="pb-3 font-semibold">Workspaces</th>
                                    <th className="pb-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                                {allUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                                        <td className="py-3">
                                            <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    u.status === 'ACTIVE'
                                                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                                        : u.status === 'PENDING_APPROVAL'
                                                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                                }`}
                                            >
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            {u.isSuperAdmin ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                                    👑 SUPER ADMIN
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">Regular</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-slate-600 dark:text-zinc-300">
                                            {u.workspaces?.length > 0 ? (
                                                <span className="font-medium">{u.workspaces.length} workspace(s)</span>
                                            ) : (
                                                <span className="text-slate-400">None</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => handleToggleSuperAdmin(u.id)}
                                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
                                            >
                                                {u.isSuperAdmin ? 'Revoke SuperAdmin' : 'Make SuperAdmin'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
