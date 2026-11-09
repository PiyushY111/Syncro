/**
 * Activity timeline: latest task updates grouped by day.
 */
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isValid } from 'date-fns';
import { History } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Panel, { PanelEmpty } from '@/components/dashboard/Panel';
import { getInitials, groupByRecency, TASK_STATUS_META } from '@/components/dashboard/dashboardMetrics';

const relativeTime = (value) => {
    const date = value ? new Date(value) : null;
    return date && isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : 'recently';
};

function ActivityItem({ task, onOpen }) {
    const status = TASK_STATUS_META[task.status] || TASK_STATUS_META.TODO;
    const actor = task.assignee?.name || 'Unassigned';
    return (
        <li className="relative pl-10">
            <Avatar className="absolute left-0 top-0.5 h-7 w-7 ring-4 ring-white dark:ring-zinc-900">
                <AvatarImage src={task.assignee?.image} alt="" />
                <AvatarFallback className="bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {getInitials(task.assignee?.name || '')}
                </AvatarFallback>
            </Avatar>
            <button type="button" onClick={() => onOpen(task)} className="group block w-full text-left focus-visible:outline-none">
                <p className="text-sm leading-snug text-slate-500 dark:text-zinc-400">
                    <span className="font-medium text-slate-900 dark:text-zinc-100">{actor}</span>{' '}updated{' '}
                    <span className="font-medium text-slate-800 group-hover:text-brand group-focus-visible:underline dark:text-zinc-200 dark:group-hover:text-violet-300">{task.title}</span>
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />{status.label}
                    </span>
                    <span>·</span>
                    <span>{task.projectName}</span>
                    <span>·</span>
                    <span>{relativeTime(task.updatedAt)}</span>
                </p>
            </button>
        </li>
    );
}

/** @param {{ tasks: Array<object>, className?: string, delay?: number }} props tasks sorted newest first */
export default function ActivityTimeline({ tasks, className, delay }) {
    const navigate = useNavigate();
    const groups = groupByRecency(tasks);
    const openTask = (task) => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`);

    return (
        <Panel eyebrow="Latest updates" title="Activity" className={className} delay={delay}>
            {groups.length === 0 ? (
                <PanelEmpty icon={History} title="No activity yet">Updates appear here as your team works.</PanelEmpty>
            ) : (
                <div className="space-y-5">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <p className="font-data mb-3 text-xs font-medium text-slate-400 dark:text-zinc-500">{group.label}</p>
                            <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-3.5 before:top-2 before:w-px before:bg-black/[0.07] dark:before:bg-white/[0.07]">
                                {group.items.map((task) => <ActivityItem key={task.id} task={task} onOpen={openTask} />)}
                            </ol>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}
