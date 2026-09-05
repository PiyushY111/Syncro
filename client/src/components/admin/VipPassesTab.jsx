import React from 'react';
import { KeyRound, Copy, Trash2, Sparkles } from 'lucide-react';

export default function VipPassesTab({
    vipCodes,
    newVipForm,
    setNewVipForm,
    isCreatingVip,
    onCreateVipCode,
    onRevokeVipCode,
    onCopyVipLink
}) {
    return (
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

                <form onSubmit={onCreateVipCode} className="space-y-4 pt-2">
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
                                                    onClick={() => onCopyVipLink(vip.code)}
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
                                                onClick={() => onRevokeVipCode(vip.id)}
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
    );
}
