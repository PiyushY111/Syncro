/**
 * Week ahead: a 7-day deadline strip. Pick a day to see what is due.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Panel, { PanelEmpty, panelLinkClass } from '@/components/dashboard/Panel';

const MAX_DOTS = 4;

function DayCell({ day, isSelected, onSelect }) {
    const count = day.tasks.length;
    const weekday = day.date.toLocaleDateString('en-US', { weekday: 'short' });
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={isSelected}
            aria-label={`${day.date.toDateString()}: ${count} due`}
            className={cn(
                'flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                isSelected
                    ? 'bg-[linear-gradient(160deg,#7c5cff,#5b3fe6)] text-white shadow-[0_12px_24px_-12px_rgba(98,70,234,0.9)]'
                    : cn('bg-white/55 hover:-translate-y-0.5 hover:bg-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08]', day.isToday && 'ring-1 ring-inset ring-brand/40')
            )}
        >
            <span className={cn('font-data text-[10px] uppercase tracking-wider', isSelected ? 'text-white/70' : day.isToday ? 'text-brand dark:text-violet-300' : 'text-slate-400 dark:text-zinc-500')}>
                {day.isToday ? 'Today' : weekday}
            </span>
            <span className={cn('font-data text-lg font-medium leading-none', isSelected ? 'text-white' : 'text-slate-900 dark:text-zinc-100')}>
                {day.date.getDate()}
            </span>
            <span className="flex h-1.5 items-center gap-[3px]">
                {Array.from({ length: Math.min(count, MAX_DOTS) }, (_, i) => (
                    <span key={i} className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-lime' : 'bg-brand/70')} />
                ))}
            </span>
        </button>
    );
}

/** @param {{ week: ReturnType<typeof import('./dashboardMetrics').getWeekAhead>, className?: string, delay?: number }} props */
export default function WeekAhead({ week, className, delay }) {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(() => week.find((d) => d.tasks.length > 0)?.offset ?? 0);
    const day = week.find((d) => d.offset === selected) || week[0];
    const totalDue = week.reduce((sum, d) => sum + d.tasks.length, 0);
    const dayLabel = day.isToday ? 'today' : day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return (
        <Panel
            eyebrow={`${totalDue} deadline${totalDue === 1 ? '' : 's'}`}
            title="Week ahead"
            action={<Link to="/calendar" className={panelLinkClass}>Calendar</Link>}
            className={className}
            delay={delay}
        >
            <div className="grid grid-cols-7 gap-1.5">
                {week.map((d) => (
                    <DayCell key={d.offset} day={d} isSelected={d.offset === selected} onSelect={() => setSelected(d.offset)} />
                ))}
            </div>

            <div className="mt-4">
                <p className="mb-2 text-xs text-slate-500 dark:text-zinc-400">Due {dayLabel}</p>
                {day.tasks.length === 0 ? (
                    <PanelEmpty icon={CalendarCheck2} title="Nothing due">A clear day.</PanelEmpty>
                ) : (
                    <ul className="space-y-1.5">
                        {day.tasks.map((task) => (
                            <li key={task.id}>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}
                                    className="flex w-full items-center gap-3 rounded-xl bg-white/60 px-3 py-2.5 text-left text-sm transition-colors hover:bg-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                                >
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                    <span className="flex-1 truncate text-slate-800 dark:text-zinc-100">{task.title}</span>
                                    <span className="truncate text-xs text-slate-400 dark:text-zinc-500">{task.projectName}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Panel>
    );
}
