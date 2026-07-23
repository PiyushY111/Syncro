import { XIcon } from 'lucide-react';

export default function TeamMembersSelector({
    teamMembers,
    currentWorkspace,
    onAddMember,
    onRemoveMember
}) {
    return (
        <div>
            <label className="block text-sm mb-1">Team Members</label>
            <select 
                className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                onChange={(e) => {
                    if (e.target.value && !teamMembers.includes(e.target.value)) {
                        onAddMember(e.target.value);
                    }
                }}
            >
                <option value="">Add team members</option>
                {currentWorkspace?.members
                    ?.filter((member) => !teamMembers.includes(member.user.email))
                    .map((member) => (
                        <option key={member.user.email} value={member.user.email}>
                            {member.user.email}
                        </option>
                    ))}
            </select>

            {teamMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {teamMembers.map((email) => (
                        <div key={email} className="flex items-center gap-1 bg-blue-200/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md text-sm" >
                            {email}
                            <button type="button" onClick={() => onRemoveMember(email)} className="ml-1 hover:bg-blue-300/30 dark:hover:bg-blue-500/30 rounded cursor-pointer" >
                                <XIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
