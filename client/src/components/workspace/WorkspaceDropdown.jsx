import { ChevronDown, Check, Plus, Building2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentWorkspace } from '@/features/workspaceSlice';
import { useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function WorkspaceDropdown({ onCreateWorkspace }) {
    const { workspaces } = useSelector((state) => state.workspace);
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onSelectWorkspace = (workspaceId) => {
        dispatch(setCurrentWorkspace(workspaceId));
        navigate('/dashboard');
    };

    const currentInitials = currentWorkspace?.name
        ? currentWorkspace.name.substring(0, 2).toUpperCase()
        : 'W';

    return (
        <div className="p-3">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/60 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 transition-all outline-none group cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={currentWorkspace?.image_url} alt={currentWorkspace?.name} />
                                <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold">
                                    {currentInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 text-left">
                                <p className="font-semibold text-slate-800 dark:text-zinc-100 text-sm truncate leading-tight">
                                    {currentWorkspace?.name || "Select Workspace"}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                                    {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-transform duration-200 shrink-0" />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-64 p-1.5 mt-1">
                    <DropdownMenuLabel className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                        Workspaces
                    </DropdownMenuLabel>
                    
                    <div className="max-h-60 overflow-y-auto space-y-1 py-1 no-scrollbar">
                        {workspaces.map((workspace) => {
                            const initials = workspace.name ? workspace.name.substring(0, 2).toUpperCase() : 'W';
                            const isSelected = currentWorkspace?.id === workspace.id;
                            const isPending = workspace.approvalStatus === 'PENDING';

                            return (
                                <DropdownMenuItem
                                    key={workspace.id}
                                    onClick={() => onSelectWorkspace(workspace.id)}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                        isSelected 
                                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium' 
                                            : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <Avatar className="h-6 w-6 rounded">
                                            <AvatarImage src={workspace.image_url} alt={workspace.name} />
                                            <AvatarFallback className="rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-bold">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-medium truncate">{workspace.name}</p>
                                                {isPending && (
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                                        Review
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                                                {isPending ? 'Pending Super-Admin approval' : `${workspace.members?.length || 0} member${(workspace.members?.length || 0) !== 1 ? 's' : ''}`}
                                            </p>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            );
                        })}
                    </div>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem
                        onClick={onCreateWorkspace}
                        className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-950/40 cursor-pointer rounded-lg p-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Create Workspace</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export default WorkspaceDropdown;
