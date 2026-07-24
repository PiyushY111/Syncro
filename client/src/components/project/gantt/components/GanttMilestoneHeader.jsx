import { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';

export default function GanttMilestoneHeader({ timelineDays, columnWidth, milestones = [], selectedDate, onSelectDate }) {
    const monthGroups = useMemo(() => {
        const groups = [];
        let currentGroup = null;

        timelineDays.forEach((day) => {
            const mKey = format(day, 'MMM yyyy');
            if (!currentGroup || currentGroup.key !== mKey) {
                currentGroup = { key: mKey, count: 1, startDay: day };
                groups.push(currentGroup);
            } else {
                currentGroup.count++;
            }
        });
        return groups;
    }, [timelineDays]);

    return (
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-950/90 border-b border-zinc-200 dark:border-zinc-800 select-none">
            {/* Top Tier: Month/Year */}
            <div className="flex h-6 border-b border-zinc-200/80 dark:border-zinc-850/80 text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                {monthGroups.map((mg) => (
                    <div key={mg.key} style={{ width: `${mg.count * columnWidth}px` }} className="border-r border-zinc-200 dark:border-zinc-800 px-2 flex items-center justify-center truncate uppercase tracking-wider bg-zinc-100/60 dark:bg-zinc-900/60">
                        {mg.key}
                    </div>
                ))}
            </div>

            {/* Bottom Tier: Day Ticks */}
            <div className="flex h-7">
                {timelineDays.map((day, idx) => {
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const dayMilestone = milestones.find((m) => isSameDay(new Date(m.due_date), day));

                    return (
                        <div
                            key={idx}
                            onClick={() => onSelectDate && onSelectDate(day)}
                            style={{ width: `${columnWidth}px` }}
                            className={`flex flex-col items-center justify-center border-r text-[10px] relative cursor-pointer transition-colors ${
                                isSelected
                                    ? 'bg-purple-600 text-white font-black border-r-purple-700 shadow-xs'
                                    : isToday
                                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-extrabold border-r-blue-300'
                                    : isWeekend
                                    ? 'bg-zinc-100/50 dark:bg-zinc-950/40 text-zinc-400 dark:text-zinc-600 border-zinc-200/70 dark:border-zinc-850/60 hover:bg-zinc-200/60'
                                    : 'text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-zinc-850/60 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                            }`}
                            title={`Click to select ${format(day, 'MMM d, yyyy')}`}
                        >
                            <span className="text-[8px] uppercase font-mono">{format(day, 'EEE')}</span>
                            <span className="font-semibold">{format(day, 'd')}</span>

                            {dayMilestone && (
                                <div className="absolute -top-1 size-2 rounded-full bg-purple-400 ring-2 ring-white dark:ring-zinc-900" title={`Milestone: ${dayMilestone.title}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
