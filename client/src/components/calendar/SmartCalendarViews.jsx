import { format, isSameDay, isSameMonth, isBefore, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { Plus, Bug, Zap, Square, GitCommit, MessageSquare, CheckCircle2, User, Video, MapPin, Sparkles, Clock, CalendarDays, ExternalLink } from 'lucide-react';

const typeIcons = {
    BUG: Bug,
    FEATURE: Zap,
    TASK: Square,
    IMPROVEMENT: GitCommit,
    OTHER: MessageSquare,
};

const priorityBorders = {
    LOW: "border-l-4 border-l-zinc-300 dark:border-l-zinc-600",
    MEDIUM: "border-l-4 border-l-amber-500",
    HIGH: "border-l-4 border-l-red-500",
};

const priorityBadges = {
    LOW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
};

// Safe date helpers to prevent RangeError crashes
const safeFormat = (dateVal, formatStr, fallback = '') => {
    if (!dateVal) return fallback;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    try {
        return format(d, formatStr);
    } catch {
        return fallback;
    }
};

const safeIsSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    try {
        return isSameDay(d1, d2);
    } catch {
        return false;
    }
};

// Helper to filter events for a specific day
const getEventsForDate = (events, date) => {
    return events.filter(e => safeIsSameDay(e.date, date));
};

// Render helper for single event pills inside Month cells
function EventPill({ event, onClick }) {
    const isDone = event.type === 'task' && event.status === 'DONE';
    
    let pillStyle = "flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer truncate border-l-2 ";
    let TypeIcon = Square;

    if (event.type === 'task') {
        pillStyle += "bg-blue-50/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-l-blue-500 dark:border-l-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950/60";
        TypeIcon = typeIcons[event.originalItem?.type] || Square;
    } else if (event.type === 'meeting') {
        pillStyle += "bg-purple-50/80 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-l-purple-500 dark:border-l-purple-600 hover:bg-purple-100 dark:hover:bg-purple-950/60";
        TypeIcon = Video;
    } else {
        pillStyle += "bg-amber-50/80 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-l-amber-500 dark:border-l-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30";
        TypeIcon = Sparkles;
    }

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick(event);
            }}
            className={pillStyle}
            title={`${event.title || 'Event'} (${(event.type || '').toUpperCase()})`}
        >
            <TypeIcon className="size-3 shrink-0" />
            <span className={`truncate ${isDone ? "line-through opacity-60" : ""}`}>
                {event.title || 'Untitled Event'}
            </span>
            {isDone && <CheckCircle2 className="size-2.5 text-emerald-500 shrink-0 ml-auto" />}
        </div>
    );
}

// ==========================================
// 1. MONTH VIEW
// ==========================================
export function MonthView({
    currentMonth,
    selectedDate,
    setSelectedDate,
    events,
    today,
    onEventClick,
    onAddTaskForDate
}) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm text-left">
            <div className="grid grid-cols-7 text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3 text-center uppercase tracking-wider">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((day) => {
                    const dayEvents = getEventsForDate(events, day);
                    const isSelected = safeIsSameDay(day, selectedDate);
                    const isToday = safeIsSameDay(day, today);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const formattedDateStr = safeFormat(day, "yyyy-MM-dd");

                    const visibleEvents = dayEvents.slice(0, 3);
                    const extraCount = dayEvents.length - visibleEvents.length;

                    return (
                        <div
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={`group relative min-h-[100px] sm:min-h-[120px] p-2 rounded-lg border transition-all flex flex-col justify-between cursor-pointer ${
                                isSelected
                                    ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-500 dark:border-blue-500 shadow-2xs"
                                    : isCurrentMonth
                                    ? "bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                    : "bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-100 dark:border-zinc-900 opacity-40 hover:opacity-75"
                            }`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <span
                                    className={`inline-flex items-center justify-center size-6 text-xs font-bold rounded-full ${
                                        isToday
                                            ? "bg-blue-600 text-white shadow-2xs"
                                            : isSelected
                                            ? "text-blue-600 dark:text-blue-400 font-extrabold"
                                            : isCurrentMonth
                                            ? "text-zinc-800 dark:text-zinc-200"
                                            : "text-zinc-400 dark:text-zinc-600"
                                    }`}
                                >
                                    {safeFormat(day, "d")}
                                </span>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddTaskForDate(formattedDateStr);
                                    }}
                                    title="Add task on this date"
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                >
                                    <Plus className="size-3.5" />
                                </button>
                            </div>

                            {/* Event list */}
                            <div className="flex-1 my-1.5 space-y-1 overflow-hidden">
                                {visibleEvents.map((evt) => (
                                    <EventPill key={evt.id} event={evt} onClick={onEventClick} />
                                ))}
                            </div>

                            {/* Extra count */}
                            {extraCount > 0 && (
                                <div className="text-[9px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 rounded px-1 py-0.5 text-center">
                                    +{extraCount} more
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==========================================
// 2. WEEK VIEW
// ==========================================
export function WeekView({
    currentMonth,
    selectedDate,
    setSelectedDate,
    events,
    today,
    onEventClick,
    onAddTaskForDate
}) {
    const weekStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-left">
            {days.map((day) => {
                const dayEvents = getEventsForDate(events, day);
                const isToday = safeIsSameDay(day, today);
                const isSelected = safeIsSameDay(day, selectedDate);
                const dateStr = safeFormat(day, "yyyy-MM-dd");

                return (
                    <div
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`flex flex-col min-h-[380px] rounded-xl border p-3 transition-all ${
                            isSelected
                                ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/15"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60"
                        }`}
                    >
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-2 mb-3">
                            <div>
                                <p className="text-xs font-semibold text-zinc-500 uppercase">{safeFormat(day, "EEE")}</p>
                                <span className={`inline-flex items-center justify-center size-7 text-sm font-bold rounded-full mt-0.5 ${
                                    isToday ? "bg-blue-600 text-white" : "text-zinc-900 dark:text-zinc-100"
                                }`}>{safeFormat(day, "d")}</span>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddTaskForDate(dateStr);
                                }}
                                title="Add task"
                                className="p-1 rounded text-zinc-500 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                            >
                                <Plus className="size-4" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[320px] no-scrollbar">
                            {dayEvents.length === 0 ? (
                                <p className="text-[11px] text-zinc-400 text-center py-10">No events scheduled</p>
                            ) : (
                                dayEvents.map((evt) => {
                                    const isDone = evt.type === 'task' && evt.status === 'DONE';
                                    let borderStyle = "";
                                    let typeLabel = "";
                                    let badgeColor = "";

                                    if (evt.type === 'task') {
                                        borderStyle = priorityBorders[evt.originalItem?.priority] || "border-l-4 border-l-blue-400";
                                        typeLabel = evt.originalItem?.priority || 'TASK';
                                        badgeColor = priorityBadges[evt.originalItem?.priority] || "bg-blue-100 text-blue-800";
                                    } else if (evt.type === 'meeting') {
                                        borderStyle = "border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/10";
                                        typeLabel = "Meeting";
                                        badgeColor = "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300";
                                    } else {
                                        borderStyle = "border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/5";
                                        typeLabel = "GCal Sync";
                                        badgeColor = "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
                                    }

                                    const formattedTime = safeFormat(evt.originalItem?.start_time || evt.date, 'hh:mm a');

                                    return (
                                        <div
                                            key={evt.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick(evt);
                                            }}
                                            className={`p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:shadow-2xs transition cursor-pointer ${borderStyle}`}
                                        >
                                            <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                                <span className={`text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 ${isDone ? "line-through opacity-60" : ""}`}>
                                                    {evt.title}
                                                </span>
                                                {isDone && <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                                            </div>

                                            {formattedTime && (
                                                <div className="flex items-center gap-1 text-[9px] text-zinc-500 mb-2">
                                                    <Clock className="size-3 text-zinc-400 shrink-0" />
                                                    <span>{formattedTime}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-[9px] mt-2">
                                                <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${badgeColor}`}>
                                                    {typeLabel}
                                                </span>

                                                {evt.type === 'meeting' && evt.originalItem?.creator && (
                                                    <div className="flex items-center gap-1">
                                                        <img
                                                            src={evt.originalItem.creator.image || `https://api.dicebear.com/7.x/initials/svg?seed=${evt.originalItem.creator.name}`}
                                                            alt=""
                                                            className="size-3.5 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                                                        />
                                                    </div>
                                                )}
                                                {evt.type === 'task' && evt.originalItem?.assignee && (
                                                    <div className="flex items-center gap-1">
                                                        <img
                                                            src={evt.originalItem.assignee.image || `https://api.dicebear.com/7.x/initials/svg?seed=${evt.originalItem.assignee.name}`}
                                                            alt=""
                                                            className="size-3.5 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ==========================================
// 3. DAY VIEW
// ==========================================
export function DayView({
    selectedDate,
    events,
    onEventClick,
    onAddTaskForDate
}) {
    const dayEvents = getEventsForDate(events, selectedDate);
    const dateStr = safeFormat(selectedDate, "yyyy-MM-dd");

    // Full 24-Hours list (0:00 / 12:00 AM to 23:00 / 11:00 PM)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const formatHour = (h) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        return `${displayHour}:00 ${ampm}`;
    };

    const getEventsInHour = (hr) => {
        return dayEvents.filter((evt) => {
            const timeVal = evt.originalItem?.start_time || evt.originalItem?.due_date || evt.date;
            if (!timeVal) return hr === 9;
            const d = new Date(timeVal);
            if (isNaN(d.getTime())) return hr === 9;
            const eventHour = d.getHours();
            return eventHour === hr;
        });
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm text-left overflow-hidden">
            {/* Day Header */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                    <h3 className="text-md font-bold text-zinc-900 dark:text-white">
                        {safeFormat(selectedDate, "EEEE, MMMM d, yyyy")}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {dayEvents.length} events scheduled for today
                    </p>
                </div>
                <button
                    onClick={() => onAddTaskForDate(dateStr)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer"
                >
                    <Plus className="size-3.5" />
                    Quick Add Task
                </button>
            </div>

            {/* Hours Grid */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[600px] overflow-y-auto no-scrollbar">
                {hours.map((hour) => {
                    const hourEvents = getEventsInHour(hour);

                    return (
                        <div key={hour} className="flex min-h-[70px] relative hover:bg-zinc-50/40 dark:hover:bg-zinc-850/20 transition">
                            {/* Time axis */}
                            <div className="w-24 border-r border-zinc-100 dark:border-zinc-800/80 p-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 select-none shrink-0 text-right">
                                {formatHour(hour)}
                            </div>

                            {/* Event list for hour */}
                            <div className="flex-1 p-2 flex flex-wrap gap-2 items-center">
                                {hourEvents.map((evt) => {
                                    let cardStyle = "flex items-start gap-3 p-2 rounded-lg border text-xs min-w-[200px] max-w-sm shadow-2xs hover:shadow-xs transition cursor-pointer ";
                                    let labelBadge = "";

                                    if (evt.type === 'task') {
                                        cardStyle += "bg-blue-50/40 dark:bg-blue-950/15 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-300";
                                        labelBadge = evt.originalItem?.priority || 'TASK';
                                    } else if (evt.type === 'meeting') {
                                        cardStyle += "bg-purple-50/40 dark:bg-purple-950/15 border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-300";
                                        labelBadge = "MEETING";
                                    } else {
                                        cardStyle += "bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-400";
                                        labelBadge = "GCAL";
                                    }

                                    const formattedTime = safeFormat(evt.originalItem?.start_time || evt.date, 'hh:mm a');

                                    return (
                                        <div
                                            key={evt.id}
                                            onClick={() => onEventClick(evt)}
                                            className={cardStyle}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="font-bold truncate">{evt.title}</span>
                                                    <span className="text-[8px] px-1 py-0.25 rounded-md font-bold uppercase border bg-white dark:bg-zinc-900 shrink-0">
                                                        {labelBadge}
                                                    </span>
                                                </div>

                                                {evt.originalItem?.description && (
                                                    <p className="text-[10px] text-zinc-500 truncate mb-1">
                                                        {evt.originalItem.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 text-[9px] text-zinc-400 mt-1.5">
                                                    {formattedTime && (
                                                        <span className="flex items-center gap-0.5">
                                                            <Clock className="size-3 text-zinc-400" />
                                                            {formattedTime}
                                                        </span>
                                                    )}
                                                    {evt.originalItem?.location && (
                                                        <span className="flex items-center gap-0.5 truncate">
                                                            <MapPin className="size-3 text-zinc-400" />
                                                            {evt.originalItem.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==========================================
// 4. AGENDA VIEW
// ==========================================
export function AgendaView({
    events,
    onEventClick,
    today
}) {
    // Sort events chronologically, safely handling dates
    const sortedEvents = [...events].sort((a, b) => {
        const da = new Date(a.date || 0).getTime();
        const db = new Date(b.date || 0).getTime();
        return (isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db);
    });

    // Group events by date string
    const grouped = sortedEvents.reduce((acc, evt) => {
        const dateStr = safeFormat(evt.date, "yyyy-MM-dd", "No Date");
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(evt);
        return acc;
    }, {});

    const dateKeys = Object.keys(grouped).sort();

    return (
        <div className="space-y-4 text-left">
            {dateKeys.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center shadow-xs">
                    <CalendarDays className="size-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                    <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No Upcoming Events</h3>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Schedule a meeting or add tasks to see them in your agenda.</p>
                </div>
            ) : (
                dateKeys.map((dateKey) => {
                    const parsedDate = new Date(dateKey);
                    const dayEvents = grouped[dateKey];
                    const isToday = safeIsSameDay(parsedDate, today);

                    return (
                        <div key={dateKey} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row gap-4 items-stretch">
                            {/* Date Column */}
                            <div className="md:w-36 shrink-0 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800/80 pb-3 md:pb-0 md:pr-4">
                                <div className="text-left">
                                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                        {safeFormat(parsedDate, "EEEE", "Scheduled")}
                                    </p>
                                    <p className="text-md sm:text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5">
                                        {safeFormat(parsedDate, "MMMM d", dateKey)}
                                    </p>
                                </div>
                                {isToday && (
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 rounded-lg px-2 py-0.5 md:mt-2">
                                        TODAY
                                    </span>
                                )}
                            </div>

                            {/* Events List */}
                            <div className="flex-1 space-y-3">
                                {dayEvents.map((evt) => {
                                    const isDone = evt.type === 'task' && evt.status === 'DONE';
                                    let borderStyle = "";
                                    let typeBadge = "";
                                    let TypeIcon = Square;

                                    if (evt.type === 'task') {
                                        borderStyle = "border border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850/60";
                                        typeBadge = evt.originalItem?.priority || 'TASK';
                                        TypeIcon = typeIcons[evt.originalItem?.type] || Square;
                                    } else if (evt.type === 'meeting') {
                                        borderStyle = "border border-purple-200 dark:border-purple-900/40 bg-purple-50/10 dark:bg-purple-950/5 hover:bg-purple-50/20";
                                        typeBadge = "MEETING";
                                        TypeIcon = Video;
                                    } else {
                                        borderStyle = "border border-amber-200 dark:border-amber-900/30 bg-amber-50/10 dark:bg-amber-950/5 hover:bg-amber-50/20";
                                        typeBadge = "GOOGLE SYNC";
                                        TypeIcon = Sparkles;
                                    }

                                    const formattedStart = safeFormat(evt.originalItem?.start_time || evt.date, 'hh:mm a');
                                    const formattedEnd = safeFormat(evt.originalItem?.end_time, 'hh:mm a');

                                    return (
                                        <div
                                            key={evt.id}
                                            onClick={() => onEventClick(evt)}
                                            className={`p-3 rounded-lg flex items-center justify-between gap-4 transition cursor-pointer ${borderStyle}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-2 rounded-lg ${
                                                    evt.type === 'task' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' :
                                                    evt.type === 'meeting' ? 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400' :
                                                    'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                                                }`}>
                                                    <TypeIcon className="size-4 shrink-0" />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className={`text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate ${isDone ? "line-through opacity-60" : ""}`}>
                                                        {evt.title}
                                                    </p>
                                                    
                                                    {/* Description/Agenda */}
                                                    {(evt.originalItem?.description || evt.originalItem?.agenda) && (
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                                                            {evt.originalItem?.agenda || evt.originalItem?.description}
                                                        </p>
                                                    )}

                                                    {/* Location, link, or host */}
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400 mt-2">
                                                        {formattedStart && (
                                                            <span className="flex items-center gap-1 font-medium">
                                                                <Clock className="size-3" />
                                                                {formattedStart}
                                                                {formattedEnd && ` - ${formattedEnd}`}
                                                            </span>
                                                        )}
                                                        {evt.originalItem?.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="size-3" />
                                                                {evt.originalItem.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-md ${
                                                    evt.type === 'task' ? priorityBadges[evt.originalItem?.priority] || 'bg-blue-100 text-blue-800' :
                                                    evt.type === 'meeting' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                                                    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                }`}>
                                                    {typeBadge}
                                                </span>

                                                {evt.type === 'meeting' && evt.originalItem?.meetingLink && (
                                                    <a
                                                        href={evt.originalItem.meetingLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-purple-600 dark:text-purple-400 transition"
                                                        title="Join Video Link"
                                                    >
                                                        <ExternalLink className="size-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
