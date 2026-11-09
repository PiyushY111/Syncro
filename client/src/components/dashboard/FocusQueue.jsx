/**
 * Focus queue: the tasks that need attention, split into Overdue / This week / Mine / In progress.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import Panel, { PanelEmpty } from '@/components/dashboard/Panel';
import { daysUntilDue } from '@/components/dashboard/dashboardMetrics';
import { describeDue, DUE_TONE_CLASS } from '@/components/dashboard/dueLabel';

const MAX_ROWS = 6;

const TABS = [
    { id: 'overdue', label: 'Overdue', empty: 'Nothing overdue. Keep it that way.' },
    { id: 'week', label: 'This week', empty: 'No deadlines in the next 7 days.' },
    { id: 'mine', label: 'Assigned to me', empty: 'Nothing is assigned to you.' },
    { id: 'progress', label: 'In progress', empty: 'No work is in progress.' },
];

const PRIORITY_STRIPE = {
    HIGH: 'bg-rose-500',
    MEDIUM: 'bg-amber-400',
    LOW: 'bg-slate-300 dark:bg-zinc-600',
};

function FocusRow({ task, onOpen }) {
    const due = describeDue(daysUntilDue(task));
    return (
        <li>
            <button
                type="button"
                onClick={() => onOpen(task)}
                className="group flex w-full items-center gap-3.5 rounded-2xl px-3 py-2.5 text-left transition-all hover:bg-white/80 hover:shadow-[0_6px_16px_-10px_rgba(30,27,75,0.35)] focus-visible:bg-white/80 focus-visible:outline-none dark:hover:bg-white/[0.05] dark:hover:shadow-none dark:focus-visible:bg-white/[0.05]"
            >
                <span className={cn('h-8 w-1 shrink-0 rounded-full', PRIORITY_STRIPE[task.priority] || PRIORITY_STRIPE.LOW)} title={`${(task.priority || 'low').toLowerCase()} priority`} />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800 group-hover:text-brand dark:text-zinc-100 dark:group-hover:text-violet-300">{task.title}</span>
                    <span className="block truncate text-xs text-slate-400 dark:text-zinc-500">
                        {task.projectName}<span className="mx-1.5">·</span><span className="capitalize">{(task.type || 'task').toLowerCase()}</span>
                    </span>
                </span>
                <span className={cn('font-data shrink-0 rounded-md px-2 py-1 text-[11px] font-medium', DUE_TONE_CLASS[due.tone])}>{due.text}</span>
            </button>
        </li>
    );
}

/** @param {{ groups: ReturnType<typeof import('./dashboardMetrics').getFocusGroups>, className?: string, delay?: number }} props */
export default function FocusQueue({ groups, className, delay }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(() => (TABS.find((t) => groups[t.id].length > 0) || TABS[2]).id);

    const items = groups[activeTab];
    const tab = TABS.find((t) => t.id === activeTab);
    const openTask = (task) => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`);

    return (
        <Panel eyebrow="Needs attention" title="Focus" className={className} delay={delay} bodyClassName="px-2 pb-3">
            <div role="tablist" aria-label="Focus filters" className="no-scrollbar mx-3 mb-2 flex gap-1.5 overflow-x-auto">
                {TABS.map(({ id, label }) => {
                    const isActive = id === activeTab;
                    const count = groups[id].length;
                    return (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                                isActive
                                    ? 'bg-brand text-white shadow-[0_8px_18px_-10px_rgba(98,70,234,0.9)] dark:bg-lime dark:text-ink dark:shadow-none'
                                    : 'bg-white/60 text-slate-600 hover:bg-white dark:bg-white/[0.05] dark:text-zinc-400 dark:hover:bg-white/[0.09]'
                            )}
                        >
                            {label}
                            <span className={cn(
                                'font-data text-[10px]',
                                id === 'overdue' && count > 0 ? 'text-rose-500' : isActive ? 'text-white/70 dark:text-ink/60' : 'text-slate-400'
                            )}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="px-1">
                {items.length === 0 ? (
                    <div className="px-2 pt-1"><PanelEmpty icon={Coffee} title="All clear">{tab.empty}</PanelEmpty></div>
                ) : (
                    <ul role="tabpanel" aria-label={tab.label}>
                        {items.slice(0, MAX_ROWS).map((task) => <FocusRow key={task.id} task={task} onOpen={openTask} />)}
                    </ul>
                )}
                {items.length > MAX_ROWS && (
                    <p className="font-data px-3 pt-2 text-[11px] text-slate-400 dark:text-zinc-500">+{items.length - MAX_ROWS} more</p>
                )}
            </div>
        </Panel>
    );
}
