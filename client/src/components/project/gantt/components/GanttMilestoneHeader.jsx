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
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white select-none">
            {/* Top Tier: Month/Year */}
            <div className="flex h-6 border-b border-slate-100 text-[10px] font-bold text-slate-600">
                {monthGroups.map((mg) => (
                    <div key={mg.key} style={{ width: `${mg.count * columnWidth}px` }} className="flex items-center justify-center truncate border-r border-slate-100 bg-slate-50 px-2 tracking-wide">
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
                            ? 'bg-blue-600 text-white font-black border-r-blue-700 shadow-sm'
                            : isToday
                            ? 'bg-blue-50 text-blue-600 font-extrabold border-r-blue-200'
                            : isWeekend
                            ? 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                            : 'text-slate-600 border-slate-100 hover:bg-slate-50'
                            }`}
                            title={`Click to select ${format(day, 'MMM d, yyyy')}`}
                        >
                            <span className="text-[8px] uppercase font-mono">{format(day, 'EEE')}</span>
                            <span className="font-semibold">{format(day, 'd')}</span>

                            {dayMilestone && (
                                <div className="absolute -top-1 size-2 rounded-full bg-violet-400 ring-2 ring-white" title={`Milestone: ${dayMilestone.title}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
