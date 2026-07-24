import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Folder } from 'lucide-react';
import AddProjectMember from '@/components/project/dialogs/AddProjectMember';
import api from '@/configs/api';

export default function ProjectMembersList({
    project,
    isDialogOpen,
    setIsDialogOpen,
    cardClasses
}) {
    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace);
    const [subTeams, setSubTeams] = useState([]);

    useEffect(() => {
        const fetchSubTeams = async () => {
            try {
                const { data } = await api.get(`/api/subteams/workspace/${currentWorkspace.id}`);
                setSubTeams(data.subTeams || []);
            } catch (err) {
                console.error(err);
            }
        };
        if (currentWorkspace?.id) {
            fetchSubTeams();
        }
    }, [currentWorkspace?.id, project?.id]);

    const assignedSubTeams = subTeams.filter(st => st.projectId === project?.id);

    return (
        <div className="space-y-6 text-left">
            {/* Direct Members Card */}
            <div className={cardClasses}>
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300">
                        Direct Team Members <span className="text-sm text-zinc-600 dark:text-zinc-400">({project?.members?.length || 0})</span>
                    </h2>
                    <button type="button" onClick={() => setIsDialogOpen(true)} className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer animate-stiff-pop" >
                        <Plus className="size-4 text-zinc-900 dark:text-zinc-300" />
                    </button>
                    <AddProjectMember isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
                </div>

                {project?.members?.length > 0 ? (
                    <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                        {project.members.map((member, index) => (
                            <div key={index} className="flex items-center justify-between px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50" >
                                <span>{member?.user?.email || "Unknown"}</span>
                                {project.team_lead === member.user.id && <span className="px-2 py-0.5 rounded-xs ring ring-zinc-200 dark:ring-zinc-600 text-xs font-semibold">Team Lead</span>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-zinc-500">No direct members added to this project.</p>
                )}
            </div>

            {/* Assigned Sub-Teams Card */}
            <div className={cardClasses}>
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">
                    Assigned Sub-Teams <span className="text-sm text-zinc-600 dark:text-zinc-400">({assignedSubTeams.length})</span>
                </h2>

                {assignedSubTeams.length > 0 ? (
                    <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                        {assignedSubTeams.map((team, index) => (
                            <div key={index} className="flex items-center justify-between px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50" >
                                <div className="flex items-center gap-2">
                                    <Folder className="size-3.5 text-zinc-450" />
                                    <span>{team.name}</span>
                                </div>
                                <span className="text-xs text-zinc-500">{team.members?.length || 0} members</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-zinc-500">No sub-teams assigned to this project.</p>
                )}

                <p className="text-[10px] text-zinc-450 mt-4 leading-relaxed">
                    Sub-teams can be created, managed, and assigned to this project under the workspace <strong>Team &gt; Sub-Teams</strong> tab.
                </p>
            </div>
        </div>
    );
}
