import { UsersIcon, Trash2, LogOut } from 'lucide-react';
import TeamMemberMobileCards from './TeamMemberMobileCards';

export default function TeamMemberList({
    filteredUsers, users, canEditMember, handleRoleChange, handleRemoveMember, currentUser, currentWorkspace, currentUserRole
}) {
    const isCallerOwner = currentWorkspace?.ownerId === currentUser?.id || currentUserRole === 'OWNER';

    const getSelectableRoles = () => {
        if (isCallerOwner) return ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
        if (currentUserRole === 'ADMIN') return ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
        if (currentUserRole === 'MANAGER') return ['MANAGER', 'MEMBER', 'VIEWER'];
        return ['MEMBER', 'VIEWER'];
    };

    const settings = typeof currentWorkspace?.settings === 'object' && currentWorkspace?.settings ? currentWorkspace.settings : {};
    const customRoles = settings.customRoles || [];

    if (filteredUsers.length === 0) {
        return (
            <div className="col-span-full text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-white/[0.06] rounded-full flex items-center justify-center">
                    <UsersIcon className="w-12 h-12 text-gray-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {users.length === 0 ? "No team members yet" : "No members match your search"}
                </h3>
                <p className="text-gray-500 dark:text-zinc-400 mb-6">
                    {users.length === 0 ? "Invite team members to start collaborating" : "Try adjusting your search term"}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl w-full text-left">
            <div className="hidden sm:block overflow-x-auto rounded-md border border-slate-900/[0.07] dark:border-white/[0.07]">
                <table className="min-w-full divide-y divide-slate-900/[0.06] dark:divide-white/[0.06]">
                    <thead className="bg-slate-500/[0.05] dark:bg-white/[0.03] text-gray-700 dark:text-zinc-300">
                        <tr>
                            <th className="px-6 py-2.5 text-left font-medium text-sm">Name</th>
                            <th className="px-6 py-2.5 text-left font-medium text-sm">Email</th>
                            <th className="px-6 py-2.5 text-left font-medium text-sm">Role</th>
                            <th className="px-6 py-2.5 text-right font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/[0.06] dark:divide-white/[0.06]">
                        {filteredUsers.map((user) => {
                            const isEditable = canEditMember(user);
                            const activeRole = user.customRole || user.role;
                            return (
                                <tr key={user.id} className="hover:bg-slate-500/[0.06] dark:hover:bg-white/[0.07] transition-colors">
                                    <td className="px-6 py-2.5 whitespace-nowrap flex items-center gap-3">
                                        {user.user?.image ? <img src={user.user.image} alt={user.user.name} className="size-7 rounded-full bg-gray-200 dark:bg-white/[0.06] object-cover" /> : <div className="size-7 rounded-full bg-gradient-to-br from-[#7c5cff] to-brand text-white flex items-center justify-center font-bold text-xs">{user.user?.name?.charAt(0).toUpperCase() || "?"}</div>}
                                        <span className="text-sm text-zinc-800 dark:text-white truncate font-medium">{user.user?.name || "Unknown User"}</span>
                                    </td>
                                    <td className="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">{user.user?.email}</td>
                                    <td className="px-6 py-2.5 whitespace-nowrap">
                                        {isEditable ? (
                                            <select value={activeRole} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="text-xs bg-slate-500/[0.05] dark:bg-white/[0.04] text-gray-900 dark:text-white rounded-md border border-slate-900/10 dark:border-white/[0.07] p-1.5 outline-none font-medium cursor-pointer">
                                                <optgroup label="Standard Roles">
                                                    {getSelectableRoles().map((r) => (<option key={r} value={r}>{r}</option>))}
                                                </optgroup>
                                                {customRoles.length > 0 && (
                                                    <optgroup label="Custom Roles">
                                                        {customRoles.map((c) => (<option key={c.key} value={c.key}>{c.label}</option>))}
                                                    </optgroup>
                                                )}
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 text-xs rounded-md font-semibold ${activeRole === "OWNER" ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400" : activeRole === "ADMIN" ? "bg-brand/10 text-brand dark:bg-brand/15 dark:text-violet-300" : activeRole === "MANAGER" ? "bg-brand/10 text-brand dark:bg-brand/15 dark:text-violet-300" : "bg-gray-200 text-gray-700 dark:bg-white/[0.06] dark:text-zinc-300"}`}>{activeRole || "User"}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-2.5 whitespace-nowrap text-right text-sm">
                                        {user.user?.id === currentUser?.id ? (
                                            currentWorkspace?.ownerId !== currentUser?.id && <button onClick={() => handleRemoveMember(user.id, user.user?.name, true)} className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"><LogOut size={16} /></button>
                                        ) : (
                                            isEditable && <button onClick={() => handleRemoveMember(user.id, user.user?.name, false)} className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"><Trash2 size={16} /></button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <TeamMemberMobileCards filteredUsers={filteredUsers} canEditMember={canEditMember} handleRoleChange={handleRoleChange} handleRemoveMember={handleRemoveMember} currentUser={currentUser} currentWorkspace={currentWorkspace} />
        </div>
    );
}
