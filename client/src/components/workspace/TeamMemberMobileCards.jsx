import { Trash2, LogOut } from 'lucide-react';

export default function TeamMemberMobileCards({
    filteredUsers, canEditMember, handleRoleChange, handleRemoveMember, currentUser, currentWorkspace
}) {
    return (
        <div className="sm:hidden space-y-3">
            {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 border border-gray-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {user.user.image ? (
                            <img src={user.user.image} alt={user.user.name} className="size-9 rounded-full bg-gray-200 dark:bg-zinc-800 object-cover" />
                        ) : (
                            <div className="size-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
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
                                        className="text-xs bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-md border border-gray-300 dark:border-zinc-800 p-0.5 outline-none"
                                    >
                                        <option value="OWNER">Owner</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="MEMBER">Member</option>
                                    </select>
                                ) : (
                                    <span className={`px-2 py-0.5 text-xs rounded font-semibold ${
                                        user.role === "OWNER" ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                                        : user.role === "ADMIN" ? "bg-purple-100 dark:bg-purple-500/20 text-purple-500 dark:text-purple-400"
                                        : user.role === "MANAGER" ? "bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400"
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
