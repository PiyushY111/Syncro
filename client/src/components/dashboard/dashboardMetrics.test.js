import { describe, it, expect } from 'vitest';
import {
    computeWorkspaceStats,
    getProjectProgress,
    getStatusBreakdown,
    isTaskOverdue,
    isAssignedTo,
    sortByRecentUpdate,
    getInitials,
    daysUntilDue,
    getTasksWithProject,
    getFocusGroups,
    getWeekAhead,
    groupByRecency,
} from './dashboardMetrics';

// Local-time noon keeps day arithmetic stable across time zones.
const LOCAL_NOW = new Date(2026, 5, 15, 12, 0, 0);
const localDay = (offset) => new Date(2026, 5, 15 + offset, 9, 0, 0).toISOString();

describe('daysUntilDue', () => {
    it('counts whole calendar days, negative when late', () => {
        expect(daysUntilDue({ due_date: localDay(0) }, LOCAL_NOW)).toBe(0);
        expect(daysUntilDue({ due_date: localDay(3) }, LOCAL_NOW)).toBe(3);
        expect(daysUntilDue({ due_date: localDay(-2) }, LOCAL_NOW)).toBe(-2);
    });

    it('returns null without a valid due date', () => {
        expect(daysUntilDue({}, LOCAL_NOW)).toBeNull();
        expect(daysUntilDue({ due_date: 'nope' }, LOCAL_NOW)).toBeNull();
    });
});

describe('getTasksWithProject', () => {
    it('annotates tasks with their project name and id', () => {
        const result = getTasksWithProject({ projects: [{ id: 'p1', name: 'Apollo', tasks: [{ id: 't1' }] }] });
        expect(result).toEqual([{ id: 't1', projectName: 'Apollo', projectId: 'p1' }]);
    });
});

describe('getFocusGroups', () => {
    it('splits open tasks into overdue, this week, mine and in progress', () => {
        const tasks = [
            { id: 'late', due_date: localDay(-1), status: 'TODO', assigneeId: 'me' },
            { id: 'soon', due_date: localDay(2), status: 'IN_PROGRESS' },
            { id: 'later', due_date: localDay(10), status: 'TODO', assigneeId: 'me' },
            { id: 'done', due_date: localDay(1), status: 'DONE', assigneeId: 'me' },
        ];
        const groups = getFocusGroups(tasks, { id: 'me' }, LOCAL_NOW);
        expect(groups.overdue.map((t) => t.id)).toEqual(['late']);
        expect(groups.week.map((t) => t.id)).toEqual(['soon']);
        expect(groups.mine.map((t) => t.id)).toEqual(['late', 'later']);
        expect(groups.progress.map((t) => t.id)).toEqual(['soon']);
    });
});

describe('getWeekAhead', () => {
    it('returns seven days starting today with open tasks due each day', () => {
        const week = getWeekAhead([
            { id: 'a', due_date: localDay(0), status: 'TODO' },
            { id: 'b', due_date: localDay(6), status: 'TODO' },
            { id: 'c', due_date: localDay(7), status: 'TODO' },
            { id: 'd', due_date: localDay(1), status: 'DONE' },
        ], LOCAL_NOW);
        expect(week).toHaveLength(7);
        expect(week[0].isToday).toBe(true);
        expect(week.map((d) => d.tasks.map((t) => t.id))).toEqual([['a'], [], [], [], [], [], ['b']]);
    });
});

describe('groupByRecency', () => {
    it('buckets items into today, yesterday and earlier, dropping empty groups', () => {
        const groups = groupByRecency([
            { id: 1, updatedAt: localDay(0) },
            { id: 2, updatedAt: localDay(-5) },
        ], LOCAL_NOW);
        expect(groups.map((g) => [g.label, g.items.map((i) => i.id)])).toEqual([['Today', [1]], ['Earlier', [2]]]);
    });
});

const NOW = new Date('2026-06-15T12:00:00Z');

describe('isTaskOverdue', () => {
    it('flags open tasks past their due date', () => {
        expect(isTaskOverdue({ due_date: '2026-06-01', status: 'TODO' }, NOW)).toBe(true);
    });

    it('ignores finished tasks and tasks without a due date', () => {
        expect(isTaskOverdue({ due_date: '2026-06-01', status: 'DONE' }, NOW)).toBe(false);
        expect(isTaskOverdue({ status: 'TODO' }, NOW)).toBe(false);
    });
});

describe('isAssignedTo', () => {
    it('matches by id, then falls back to email', () => {
        expect(isAssignedTo({ assigneeId: 'u1' }, { id: 'u1' })).toBe(true);
        expect(isAssignedTo({ assignee: { id: 'u2' } }, { id: 'u1' })).toBe(false);
        expect(isAssignedTo({ assignee: { email: 'a@b.c' } }, { email: 'a@b.c' })).toBe(true);
        expect(isAssignedTo({ assigneeId: 'u1' }, null)).toBe(false);
    });
});

describe('getProjectProgress', () => {
    it('derives progress from completed tasks', () => {
        const project = { tasks: [{ status: 'DONE' }, { status: 'TODO' }, { status: 'DONE' }, { status: 'IN_PROGRESS' }] };
        expect(getProjectProgress(project)).toBe(50);
    });

    it('uses stored progress when there are no tasks, clamped to 0-100', () => {
        expect(getProjectProgress({ progress: 42 })).toBe(42);
        expect(getProjectProgress({ progress: 140 })).toBe(100);
        expect(getProjectProgress({ status: 'COMPLETED' })).toBe(100);
        expect(getProjectProgress({ status: 'ACTIVE' })).toBe(0);
    });
});

describe('getStatusBreakdown', () => {
    it('returns only statuses present, with percentages', () => {
        const result = getStatusBreakdown([{ status: 'ACTIVE' }, { status: 'ACTIVE' }, { status: 'COMPLETED' }, { status: 'ON_HOLD' }]);
        expect(result.map((r) => [r.status, r.count, r.percentage])).toEqual([
            ['ACTIVE', 2, 50],
            ['ON_HOLD', 1, 25],
            ['COMPLETED', 1, 25],
        ]);
    });

    it('handles an empty list', () => {
        expect(getStatusBreakdown([])).toEqual([]);
    });
});

describe('computeWorkspaceStats', () => {
    it('aggregates project and task metrics for the current user', () => {
        const workspace = {
            projects: [
                { status: 'ACTIVE', tasks: [
                    { status: 'DONE', assigneeId: 'me' },
                    { status: 'TODO', assigneeId: 'me', due_date: '2026-06-01' },
                    { status: 'IN_PROGRESS', assigneeId: 'other' },
                ] },
                { status: 'COMPLETED', tasks: [{ status: 'DONE' }] },
                { status: 'CANCELLED', tasks: [] },
            ],
        };

        expect(computeWorkspaceStats(workspace, { id: 'me' }, NOW)).toEqual({
            totalProjects: 3,
            openProjects: 1,
            completedProjects: 1,
            totalTasks: 4,
            doneTasks: 2,
            taskCompletionRate: 50,
            myOpenTasks: 1,
            overdueTasks: 1,
        });
    });

    it('returns zeros for a missing workspace', () => {
        expect(computeWorkspaceStats(null, null, NOW).totalProjects).toBe(0);
        expect(computeWorkspaceStats(null, null, NOW).taskCompletionRate).toBe(0);
    });
});

describe('sortByRecentUpdate', () => {
    it('sorts newest first without mutating input', () => {
        const input = [{ id: 1, updatedAt: '2026-01-01' }, { id: 2, updatedAt: '2026-03-01' }];
        expect(sortByRecentUpdate(input).map((t) => t.id)).toEqual([2, 1]);
        expect(input[0].id).toBe(1);
    });
});

describe('getInitials', () => {
    it('builds up to two initials', () => {
        expect(getInitials('Ada Lovelace King')).toBe('AL');
        expect(getInitials('')).toBe('U');
    });
});
