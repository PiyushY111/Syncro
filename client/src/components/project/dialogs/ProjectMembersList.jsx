import { Plus } from 'lucide-react';
import AddProjectMember from '@/components/project/dialogs/AddProjectMember';

export default function ProjectMembersList({
    project,
    isDialogOpen,
    setIsDialogOpen,
    cardClasses
}) {
    return (
        <div className="space-y-6 text-left">
            <div className={cardClasses}>
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">
                        Team Members <span className="text-sm text-zinc-600 dark:text-zinc-400">({project?.members?.length || 0})</span>
                    </h2>
                    <button type="button" onClick={() => setIsDialogOpen(true)} className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer" >
                        <Plus className="size-4 text-zinc-900 dark:text-zinc-300" />
                    </button>
                    <AddProjectMember isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
                </div>

                {project?.members?.length > 0 && (
                    <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                        {project.members.map((member, index) => (
                            <div key={index} className="flex items-center justify-between px-3 py-2 rounded dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-300" >
                                <span>{member?.user?.email || "Unknown"}</span>
                                {project.team_lead === member.user.id && <span className="px-2 py-0.5 rounded-xs ring ring-zinc-200 dark:ring-zinc-600 text-xs font-semibold">Team Lead</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
