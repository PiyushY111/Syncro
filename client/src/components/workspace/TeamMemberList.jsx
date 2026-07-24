import { UsersIcon, Trash2, LogOut } from 'lucide-react';
import TeamMemberMobileCards from './TeamMemberMobileCards';

export default function TeamMemberList({
    filteredUsers, users, canEditMember, handleRoleChange, handleRemoveMember, currentUser, currentWorkspace
}) {
    if (filteredUsers.length === 0) {
        return (
            <div className="col-span-full text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
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
            <div className="hidden sm:block overflow-x-auto rounded-md border border-gray-200 dark:border-zinc-800">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                    <thead className="bg-gray-50 dark:bg-zinc-900/50 text-gray-700 dark:text-zinc-300">
                        <tr>
                            <th className="px-6 py-2.5 text-left font-medium text-sm">Name</th>
                            <th className="px-6 py-2.5 text-left font-medium text-sm">Email</th>
                            <th className="px-6 py-2.5 text-left font-medium text-sm">Role</th>
                            <th className="px-6 py-2.5 text-right font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-2.5 whitespace-nowrap flex items-center gap-3">
                                    {user.user.image ? <img src={user.user.image} alt={user.user.name} className="size-7 rounded-full bg-gray-200 dark:bg-zinc-800 object-cover" /> : <div className="size-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs">{user.user?.name?.charAt(0).toUpperCase() || "?"}</div>}
                                    <span className="text-sm text-zinc-800 dark:text-white truncate font-medium">{user.user?.name || "Unknown User"}</span>
                                </td>
                                <td className="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">{user.user.email}</td>
                                <td className="px-6 py-2.5 whitespace-nowrap">
                                    {canEditMember(user) ? (
                                        <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="text-xs bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-md border border-gray-300 dark:border-zinc-800 p-1 outline-none">
                                            <option value="OWNER">Owner</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="MANAGER">Manager</option>
                                            <option value="MEMBER">Member</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1 text-xs rounded-md font-semibold ${user.role === "OWNER" ? "bg-red-100 text-red-600" : user.role === "ADMIN" ? "bg-purple-100 text-purple-500" : user.role === "MANAGER" ? "bg-blue-100 text-blue-500" : "bg-gray-200 text-gray-700"}`}>{user.role || "User"}</span>
                                    )}
                                </td>
                                <td className="px-6 py-2.5 whitespace-nowrap text-right text-sm">
                                    {user.user.id === currentUser?.id ? (
                                        currentWorkspace?.ownerId !== currentUser?.id && <button onClick={() => handleRemoveMember(user.id, user.user?.name, true)} className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"><LogOut size={16} /></button>
                                    ) : (
                                        canEditMember(user) && <button onClick={() => handleRemoveMember(user.id, user.user?.name, false)} className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"><Trash2 size={16} /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <TeamMemberMobileCards filteredUsers={filteredUsers} canEditMember={canEditMember} handleRoleChange={handleRoleChange} handleRemoveMember={handleRemoveMember} currentUser={currentUser} currentWorkspace={currentWorkspace} />
        </div>
    );
}
