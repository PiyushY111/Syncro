import React from 'react';
import { Plus, XCircle, Sparkles, Check } from 'lucide-react';

export default function GatekeeperPoliciesTab({
    settings,
    setSettings,
    domainInput,
    setDomainInput,
    isSavingSettings,
    onSaveSettings,
    onAddDomain,
    onRemoveDomain
}) {
    return (
        <form onSubmit={onSaveSettings} className="space-y-6 max-w-4xl">
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
                        onClick={onAddDomain}
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
                                    onClick={() => onRemoveDomain(domain)}
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
    );
}
