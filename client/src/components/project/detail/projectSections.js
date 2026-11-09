/**
 * Project detail navigation model: five top-level sections, some with sub-views.
 * Legacy `?tab=` values (backlog, gantt, history…) still resolve to the right place.
 */
import {
    ListChecks, Zap, CalendarRange, BarChart3, Settings2,
} from 'lucide-react';

export const PROJECT_SECTIONS = [
    { key: 'tasks', label: 'Tasks', icon: ListChecks, views: [] },
    {
        key: 'sprints',
        label: 'Sprints',
        icon: Zap,
        views: [
            { key: 'activesprint', label: 'Active sprint' },
            { key: 'backlog', label: 'Backlog' },
            { key: 'epicmapping', label: 'Epics' },
            { key: 'retro', label: 'Retro' },
        ],
    },
    {
        key: 'timeline',
        label: 'Timeline',
        icon: CalendarRange,
        views: [
            { key: 'milestones', label: 'Milestones' },
            { key: 'gantt', label: 'Gantt' },
            { key: 'calendar', label: 'Calendar' },
        ],
    },
    { key: 'insights', label: 'Insights', icon: BarChart3, views: [] },
    {
        key: 'settings',
        label: 'Settings',
        icon: Settings2,
        views: [
            { key: 'general', label: 'General' },
            { key: 'history', label: 'History' },
        ],
    },
];

const LEGACY_ALIASES = { analytics: 'insights' };

/**
 * Turn a `?tab=` value into the section to highlight and the view to render.
 * @param {string | null | undefined} tab
 * @returns {{ section: string, view: string }}
 */
export function resolveProjectTab(tab) {
    const key = LEGACY_ALIASES[tab] || tab;
    const section = PROJECT_SECTIONS.find((s) => s.key === key);
    if (section) return { section: section.key, view: section.views[0]?.key || section.key };

    const owner = PROJECT_SECTIONS.find((s) => s.views.some((v) => v.key === key));
    if (owner) return { section: owner.key, view: key };

    return { section: 'tasks', view: 'tasks' };
}

/** @param {string} sectionKey */
export const getSection = (sectionKey) => PROJECT_SECTIONS.find((s) => s.key === sectionKey) || PROJECT_SECTIONS[0];
