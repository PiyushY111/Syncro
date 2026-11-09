import { Trash2, LogOut } from 'lucide-react';

export default function TeamMemberMobileCards({
    filteredUsers, canEditMember, handleRoleChange, handleRemoveMember, currentUser, currentWorkspace
}) {
    return (
        <div className="sm:hidden space-y-3">
            {filteredUsers.map((user) => (
                <div key={user.id} className="sx-glass p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {user.user.image ? (
                            <img src={user.user.image} alt={user.user.name} className="size-9 rounded-full bg-gray-200 dark:bg-white/[0.06] object-cover" />
                        ) : (
                            <div className="size-9 rounded-full bg-gradient-to-br from-[#7c5cff] to-brand text-white flex items-center justify-center font-bold text-sm">
                                {user.user?.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{user.user?.name || "Unknown User"}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{user.user.email}</p>
                            <div className="mt-1">
                                {canEditMember(user) ? (
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        className="text-xs bg-slate-500/[0.05] dark:bg-white/[0.02] text-gray-900 dark:text-white rounded-md border border-slate-900/10 dark:border-white/[0.07] p-0.5 outline-none"
                                    >
                                        <option value="OWNER">Owner</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="MEMBER">Member</option>
                                    </select>
                                ) : (
                                    <span className={`px-2 py-0.5 text-xs rounded font-semibold ${
                                        user.role === "OWNER" ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                                        : user.role === "ADMIN" ? "bg-brand/10 dark:bg-brand/15 text-brand dark:text-violet-300"
                                        : user.role === "MANAGER" ? "bg-brand/10 dark:bg-brand/15 text-brand dark:text-violet-300"
                                        : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300"
                                    }`}>
                                        {user.role || "User"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        {user.user.id === currentUser?.id ? (
                            currentWorkspace?.ownerId !== currentUser?.id && (
                                <button onClick={() => handleRemoveMember(user.id, user.user?.name, true)} className="text-gray-400 hover:text-red-500 p-2 cursor-pointer" title="Leave Workspace">
                                    <LogOut size={18} />
                                </button>
                            )
                        ) : (
                            canEditMember(user) && (
                                <button onClick={() => handleRemoveMember(user.id, user.user?.name, false)} className="text-gray-400 hover:text-red-500 p-2 cursor-pointer" title="Remove Member">
                                    <Trash2 size={18} />
                                </button>
                            )
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
