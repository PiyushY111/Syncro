/**
 * Pure helpers for the project Tasks view: stage labels, filtering, and summary numbers.
 */
import { isTaskOverdue } from '@/components/dashboard/dashboardMetrics';

export const DEFAULT_STAGES = ['TODO', 'IN_PROGRESS', 'DONE'];
export const EMPTY_TASK_FILTERS = Object.freeze({ query: '', status: '', priority: '', type: '', assignee: '' });

/** @param {{ stages?: string }} project */
export const getProjectStages = (project) => {
    const stages = (project?.stages || '').split(',').map((s) => s.trim()).filter(Boolean);
    return stages.length ? stages : DEFAULT_STAGES;
};

/** "IN_PROGRESS" → "In progress" */
export const formatStage = (stage = '') => {
    const words = stage.replace(/_/g, ' ').toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
};

export const hasActiveFilters = (filters) => Object.values(filters).some(Boolean);

/**
 * @param {Array<object>} tasks
 * @param {{ query: string, status: string, priority: string, type: string, assignee: string }} filters
 */
export function filterTasks(tasks, filters) {
    const query = filters.query.trim().toLowerCase();
    return tasks.filter((task) => {
        if (filters.status && task.status !== filters.status) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        if (filters.type && task.type !== filters.type) return false;
        if (filters.assignee && (task.assignee?.id || task.assigneeId) !== filters.assignee) return false;
        if (query && !`${task.title || ''} ${task.description || ''}`.toLowerCase().includes(query)) return false;
        return true;
    });
}

/** Unique assignees across tasks, sorted by name: [{ id, name }]. */
export function getAssignees(tasks) {
    const byId = new Map();
    for (const task of tasks) {
        const id = task.assignee?.id || task.assigneeId;
        if (id && !byId.has(id)) byId.set(id, { id, name: task.assignee?.name || 'Unknown' });
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Headline numbers for the project header. */
export function summarizeTasks(tasks, now = new Date()) {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    return {
        total,
        done,
        open: total - done,
        overdue: tasks.filter((t) => isTaskOverdue(t, now)).length,
        progress: total ? Math.round((done / total) * 100) : 0,
    };
}
