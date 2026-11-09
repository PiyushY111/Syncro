import { describe, it, expect } from 'vitest';
import { resolveProjectTab, getSection } from './projectSections';
import {
    filterTasks, getAssignees, getProjectStages, formatStage, summarizeTasks, hasActiveFilters, EMPTY_TASK_FILTERS,
} from './taskFiltering';

describe('resolveProjectTab', () => {
    it('defaults to tasks for missing or unknown tabs', () => {
        expect(resolveProjectTab(null)).toEqual({ section: 'tasks', view: 'tasks' });
        expect(resolveProjectTab('nope')).toEqual({ section: 'tasks', view: 'tasks' });
    });

    it('maps legacy sub-view tabs to their parent section', () => {
        expect(resolveProjectTab('backlog')).toEqual({ section: 'sprints', view: 'backlog' });
        expect(resolveProjectTab('gantt')).toEqual({ section: 'timeline', view: 'gantt' });
        expect(resolveProjectTab('history')).toEqual({ section: 'settings', view: 'history' });
        expect(resolveProjectTab('analytics')).toEqual({ section: 'insights', view: 'insights' });
    });

    it('opens a section on its first view', () => {
        expect(resolveProjectTab('sprints')).toEqual({ section: 'sprints', view: 'activesprint' });
        expect(resolveProjectTab('settings')).toEqual({ section: 'settings', view: 'general' });
    });

    it('falls back to the first section for unknown keys', () => {
        expect(getSection('x').key).toBe('tasks');
    });
});

describe('task filtering', () => {
    const tasks = [
        { id: '1', title: 'Fix login bug', status: 'TODO', priority: 'HIGH', type: 'BUG', assignee: { id: 'a', name: 'Zed' } },
        { id: '2', title: 'Write docs', description: 'API reference', status: 'DONE', priority: 'LOW', type: 'TASK', assignee: { id: 'b', name: 'Amy' } },
        { id: '3', title: 'Dark mode', status: 'IN_PROGRESS', priority: 'HIGH', type: 'FEATURE', assigneeId: 'a', assignee: { id: 'a', name: 'Zed' } },
    ];

    it('returns everything with empty filters', () => {
        expect(filterTasks(tasks, EMPTY_TASK_FILTERS)).toHaveLength(3);
        expect(hasActiveFilters(EMPTY_TASK_FILTERS)).toBe(false);
    });

    it('combines search with field filters', () => {
        expect(filterTasks(tasks, { ...EMPTY_TASK_FILTERS, priority: 'HIGH' }).map((t) => t.id)).toEqual(['1', '3']);
        expect(filterTasks(tasks, { ...EMPTY_TASK_FILTERS, query: 'api' }).map((t) => t.id)).toEqual(['2']);
        expect(filterTasks(tasks, { ...EMPTY_TASK_FILTERS, assignee: 'a', status: 'TODO' }).map((t) => t.id)).toEqual(['1']);
    });

    it('lists unique assignees sorted by name', () => {
        expect(getAssignees(tasks)).toEqual([{ id: 'b', name: 'Amy' }, { id: 'a', name: 'Zed' }]);
    });

    it('reads custom stages and formats them', () => {
        expect(getProjectStages({ stages: 'TODO, REVIEW ,DONE' })).toEqual(['TODO', 'REVIEW', 'DONE']);
        expect(getProjectStages({})).toEqual(['TODO', 'IN_PROGRESS', 'DONE']);
        expect(formatStage('IN_PROGRESS')).toBe('In progress');
    });

    it('summarizes progress and overdue work', () => {
        const now = new Date('2026-06-10');
        const withDue = [...tasks, { id: '4', status: 'TODO', due_date: '2026-06-01' }];
        expect(summarizeTasks(withDue, now)).toEqual({ total: 4, done: 1, open: 3, overdue: 1, progress: 25 });
        expect(summarizeTasks([]).progress).toBe(0);
    });
});
