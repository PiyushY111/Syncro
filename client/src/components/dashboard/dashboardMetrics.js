/**
 * Pure data helpers for the dashboard. Kept free of React so they are easy to test.
 */

export const PROJECT_STATUS_META = {
    ACTIVE: { label: 'Active', color: '#2563eb', dot: 'bg-blue-600', pill: 'text-blue-700 bg-blue-50 ring-blue-600/15 dark:text-blue-300 dark:bg-blue-500/10 dark:ring-blue-400/20' },
    PLANNING: { label: 'Planning', color: '#94a3b8', dot: 'bg-slate-400', pill: 'text-slate-700 bg-slate-100 ring-slate-500/15 dark:text-zinc-300 dark:bg-zinc-800 dark:ring-zinc-600/30' },
    ON_HOLD: { label: 'On hold', color: '#f59e0b', dot: 'bg-amber-500', pill: 'text-amber-700 bg-amber-50 ring-amber-600/20 dark:text-amber-300 dark:bg-amber-500/10 dark:ring-amber-400/20' },
    COMPLETED: { label: 'Completed', color: '#10b981', dot: 'bg-emerald-500', pill: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20 dark:text-emerald-300 dark:bg-emerald-500/10 dark:ring-emerald-400/20' },
    CANCELLED: { label: 'Cancelled', color: '#f43f5e', dot: 'bg-rose-500', pill: 'text-rose-700 bg-rose-50 ring-rose-600/15 dark:text-rose-300 dark:bg-rose-500/10 dark:ring-rose-400/20' },
};

export const TASK_STATUS_META = {
    TODO: { label: 'To do', dot: 'bg-slate-400' },
    IN_PROGRESS: { label: 'In progress', dot: 'bg-amber-500' },
    DONE: { label: 'Done', dot: 'bg-emerald-500' },
};

export const PRIORITY_META = {
    HIGH: { label: 'High', className: 'text-rose-600 dark:text-rose-400' },
    MEDIUM: { label: 'Medium', className: 'text-amber-600 dark:text-amber-400' },
    LOW: { label: 'Low', className: 'text-slate-500 dark:text-zinc-400' },
};

const OPEN_PROJECT_STATUSES = new Set(['ACTIVE', 'PLANNING', 'ON_HOLD']);

export const getProjectStatusMeta = (status) => PROJECT_STATUS_META[status] || PROJECT_STATUS_META.PLANNING;

export const getAllTasks = (workspace) =>
    (workspace?.projects || []).flatMap((project) => project.tasks || []);

export const isTaskOverdue = (task, now = new Date()) =>
    Boolean(task?.due_date) && task.status !== 'DONE' && new Date(task.due_date) < now;

export const isAssignedTo = (task, user) => {
    if (!user) return false;
    const assigneeId = task?.assigneeId || task?.assignee?.id;
    if (assigneeId && user.id) return assigneeId === user.id;
    return Boolean(user.email) && task?.assignee?.email === user.email;
};

/** Progress from task completion; falls back to the stored project progress, never an invented value. */
export const getProjectProgress = (project) => {
    const tasks = project?.tasks || [];
    if (tasks.length > 0) {
        const done = tasks.filter((t) => t.status === 'DONE').length;
        return Math.round((done / tasks.length) * 100);
    }
    if (project?.status === 'COMPLETED') return 100;
    const stored = Number(project?.progress);
    return Number.isFinite(stored) ? Math.min(100, Math.max(0, Math.round(stored))) : 0;
};

export const getStatusBreakdown = (projects = []) => {
    const total = projects.length;
    return Object.entries(PROJECT_STATUS_META)
        .map(([status, meta]) => {
            const count = projects.filter((p) => p.status === status).length;
            return { status, ...meta, count, percentage: total ? Math.round((count / total) * 100) : 0 };
        })
        .filter((item) => item.count > 0);
};

export const computeWorkspaceStats = (workspace, user, now = new Date()) => {
    const projects = workspace?.projects || [];
    const tasks = getAllTasks(workspace);
    const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
    const myOpenTasks = tasks.filter((t) => isAssignedTo(t, user) && t.status !== 'DONE').length;

    return {
        totalProjects: projects.length,
        openProjects: projects.filter((p) => OPEN_PROJECT_STATUSES.has(p.status)).length,
        completedProjects: projects.filter((p) => p.status === 'COMPLETED').length,
        totalTasks: tasks.length,
        doneTasks,
        taskCompletionRate: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0,
        myOpenTasks,
        overdueTasks: tasks.filter((t) => isTaskOverdue(t, now)).length,
    };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_LENGTH = 7;

const startOfLocalDay = (value) => {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/** Whole days from `now` until the task is due: negative = late, 0 = today, null = no due date. */
export const daysUntilDue = (task, now = new Date()) => {
    if (!task?.due_date) return null;
    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) return null;
    return Math.round((startOfLocalDay(due) - startOfLocalDay(now)) / DAY_MS);
};

/** All tasks across projects, each annotated with its project's name. */
export const getTasksWithProject = (workspace) =>
    (workspace?.projects || []).flatMap((project) =>
        (project.tasks || []).map((task) => ({ ...task, projectName: project.name, projectId: task.projectId || project.id }))
    );

const byDueDate = (a, b) => new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31');

/** Buckets for the focus queue. Each list is sorted by due date, soonest first. */
export const getFocusGroups = (tasks = [], user, now = new Date()) => {
    const open = tasks.filter((t) => t.status !== 'DONE');
    return {
        overdue: open.filter((t) => isTaskOverdue(t, now)).sort(byDueDate),
        week: open.filter((t) => {
            const days = daysUntilDue(t, now);
            return days !== null && days >= 0 && days < WEEK_LENGTH;
        }).sort(byDueDate),
        mine: open.filter((t) => isAssignedTo(t, user)).sort(byDueDate),
        progress: open.filter((t) => t.status === 'IN_PROGRESS').sort(byDueDate),
    };
};

/** The next seven days starting today, each with the open tasks due that day. */
export const getWeekAhead = (tasks = [], now = new Date()) => {
    const today = startOfLocalDay(now);
    return Array.from({ length: WEEK_LENGTH }, (_, offset) => {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
        const due = tasks.filter((t) => t.status !== 'DONE' && daysUntilDue(t, now) === offset);
        return { offset, date, isToday: offset === 0, tasks: due };
    });
};

/** Groups items by calendar day relative to now: "Today", "Yesterday" or "Earlier". */
export const groupByRecency = (items = [], now = new Date()) => {
    const today = startOfLocalDay(now).getTime();
    const groups = [
        { label: 'Today', items: [] },
        { label: 'Yesterday', items: [] },
        { label: 'Earlier', items: [] },
    ];
    items.forEach((item) => {
        const day = item.updatedAt ? startOfLocalDay(item.updatedAt).getTime() : 0;
        const index = day === today ? 0 : day === today - DAY_MS ? 1 : 2;
        groups[index] = { ...groups[index], items: [...groups[index].items, item] };
    });
    return groups.filter((group) => group.items.length > 0);
};

export const sortByRecentUpdate = (items = []) =>
    [...items].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

export const getInitials = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U';
