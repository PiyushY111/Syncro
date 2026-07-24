import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isSameDay, isBefore, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import CalendarUpcomingOverdue from '@/components/project/calendar/CalendarUpcomingOverdue';
import CalendarDayGrid from './CalendarDayGrid';
import CalendarToolbar from './CalendarToolbar';
import CalendarFilters from './CalendarFilters';
import CalendarSelectedDayTasks from './CalendarSelectedDayTasks';
import CalendarWeekView from './views/CalendarWeekView';
import CalendarAgendaView from './views/CalendarAgendaView';
import CreateTaskDialog from '@/components/task/CreateTaskDialog';

export default function ProjectCalendar({ tasks = [], projectId }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeProjectId = projectId || searchParams.get('id') || tasks[0]?.projectId;

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarView, setCalendarView] = useState("month");
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [initialDueDate, setInitialDueDate] = useState("");

    const today = useMemo(() => new Date(), []);

    useEffect(() => {
        const dateParam = searchParams.get('date');
        if (dateParam) {
            const parsed = new Date(dateParam);
            if (!isNaN(parsed.getTime())) {
                setSelectedDate(parsed);
                setCurrentMonth(parsed);
            }
        }
    }, [searchParams]);

    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                if (!t.title?.toLowerCase().includes(query) && !t.description?.toLowerCase().includes(query)) return false;
            }
            if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
            if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
            return true;
        });
    }, [tasks, searchQuery, typeFilter, priorityFilter]);

    const getTasksForDate = (date) => filteredTasks.filter((task) => task.due_date && isSameDay(new Date(task.due_date), date));
    const upcomingTasks = useMemo(() => filteredTasks.filter((t) => t.due_date && !isBefore(new Date(t.due_date), today) && t.status !== "DONE").sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5), [filteredTasks, today]);
    const overdueTasks = useMemo(() => filteredTasks.filter((t) => t.due_date && isBefore(new Date(t.due_date), today) && !isSameDay(new Date(t.due_date), today) && t.status !== "DONE"), [filteredTasks, today]);

    const handleTaskClick = (task) => {
        if (task?.id && (task.projectId || activeProjectId)) {
            navigate(`/taskDetails?projectId=${task.projectId || activeProjectId}&taskId=${task.id}`);
        }
    };

    const handleViewInGantt = (task) => {
        setSearchParams({ id: activeProjectId, tab: 'gantt' });
    };

    const handleAddTaskForDate = (dateStr) => { setInitialDueDate(dateStr); setShowCreateTask(true); };
    const handlePrev = () => setCurrentMonth((prev) => calendarView === "week" ? subWeeks(prev, 1) : subMonths(prev, 1));
    const handleNext = () => setCurrentMonth((prev) => calendarView === "week" ? addWeeks(prev, 1) : addMonths(prev, 1));
    const handleToday = () => { setCurrentMonth(new Date()); setSelectedDate(new Date()); };

    return (
        <div className="space-y-6 text-left">
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-2xs space-y-4">
                <CalendarToolbar currentMonth={currentMonth} calendarView={calendarView} setCalendarView={setCalendarView} handlePrev={handlePrev} handleNext={handleNext} handleToday={handleToday} onAddTaskForDate={handleAddTaskForDate} selectedDate={selectedDate} filteredCount={filteredTasks.length} />
                <CalendarFilters searchQuery={searchQuery} setSearchQuery={setSearchQuery} typeFilter={typeFilter} setTypeFilter={setTypeFilter} priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter} />
            </div>

            {calendarView === "agenda" ? (
                <CalendarAgendaView tasks={filteredTasks} onTaskClick={handleTaskClick} today={today} />
            ) : calendarView === "week" ? (
                <CalendarWeekView currentMonth={currentMonth} tasks={filteredTasks} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onTaskClick={handleTaskClick} onAddTaskForDate={handleAddTaskForDate} today={today} />
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-2xs">
                            <div className="grid grid-cols-7 text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3 text-center uppercase tracking-wider">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (<div key={day}>{day}</div>))}
                            </div>
                            <CalendarDayGrid currentMonth={currentMonth} selectedDate={selectedDate} setSelectedDate={setSelectedDate} getTasksForDate={getTasksForDate} today={today} onTaskClick={handleTaskClick} onAddTaskForDate={handleAddTaskForDate} />
                        </div>
                        <CalendarSelectedDayTasks selectedDate={selectedDate} selectedDayTasks={getTasksForDate(selectedDate)} handleAddTaskForDate={handleAddTaskForDate} handleTaskClick={handleTaskClick} onViewInGantt={handleViewInGantt} />
                    </div>
                    <CalendarUpcomingOverdue upcomingTasks={upcomingTasks} overdueTasks={overdueTasks} onTaskClick={handleTaskClick} />
                </div>
            )}

            {showCreateTask && <CreateTaskDialog showCreateTask={showCreateTask} setShowCreateTask={setShowCreateTask} projectId={activeProjectId} initialDueDate={initialDueDate} />}
        </div>
    );
}
