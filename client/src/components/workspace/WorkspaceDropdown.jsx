/**
 * Workspace switcher shown at the top of the dark sidebar.
 */
import { ChevronsUpDown, Check, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCurrentWorkspace } from '@/features/workspaceSlice';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/components/dashboard/dashboardMetrics';
import { railText } from '@/components/layout/useSidebarRail';

const memberLabel = (count) => `${count} member${count === 1 ? '' : 's'}`;

function WorkspaceDropdown({ onCreateWorkspace, isExpanded = true, onOpenChange }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { workspaces = [] } = useSelector((state) => state.workspace);
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);

    const handleSelect = (workspaceId) => {
        dispatch(setCurrentWorkspace(workspaceId));
        navigate('/dashboard');
    };

    return (
        <DropdownMenu onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={`Workspace: ${currentWorkspace?.name || 'none selected'}`}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-rail-accent/50 ${isExpanded ? 'border-rail-line bg-rail-raised hover:border-rail-subtle/50' : 'border-transparent hover:bg-rail-hover'} max-sm:border-rail-line max-sm:bg-rail-raised`}
                >
                    <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                        <AvatarImage src={currentWorkspace?.image_url} alt="" />
                        <AvatarFallback className="rounded-lg bg-rail-accent text-xs font-bold text-rail-accent-fg">
                            {getInitials(currentWorkspace?.name || 'W')}
                        </AvatarFallback>
                    </Avatar>
                    <span className={`min-w-0 flex-1 ${railText(isExpanded)}`}>
                        <span className="block truncate text-[13px] font-semibold text-rail-fg">{currentWorkspace?.name || 'Select workspace'}</span>
                        <span className="block truncate text-[11px] text-rail-subtle">{memberLabel(currentWorkspace?.members?.length || 0)}</span>
                    </span>
                    <ChevronsUpDown className={`h-4 w-4 shrink-0 text-rail-subtle ${railText(isExpanded)}`} />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-[236px] p-1.5">
                <DropdownMenuLabel className="font-data text-xs font-medium text-slate-400">
                    Workspaces · {workspaces.length}
                </DropdownMenuLabel>
                <div className="no-scrollbar max-h-64 space-y-0.5 overflow-y-auto">
                    {workspaces.map((workspace) => {
                        const isSelected = currentWorkspace?.id === workspace.id;
                        return (
                            <DropdownMenuItem
                                key={workspace.id}
                                onClick={() => handleSelect(workspace.id)}
                                className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2"
                            >
                                <Avatar className="h-6 w-6 rounded-md">
                                    <AvatarImage src={workspace.image_url} alt="" />
                                    <AvatarFallback className="rounded-md bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-white/[0.06] dark:text-zinc-300">
                                        {getInitials(workspace.name || 'W')}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-medium">{workspace.name}</span>
                                    <span className="block truncate text-[10px] text-slate-400 dark:text-zinc-500">{memberLabel(workspace.members?.length || 0)}</span>
                                </span>
                                {isSelected && <Check className="h-4 w-4 shrink-0 text-brand" />}
                            </DropdownMenuItem>
                        );
                    })}
                </div>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={onCreateWorkspace} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-xs font-semibold text-brand">
                    <Plus className="h-4 w-4" /> Create workspace
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default WorkspaceDropdown;
