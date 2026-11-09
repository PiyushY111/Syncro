/**
 * Human label + tone for a task's due date relative to today.
 * @param {number|null} days result of daysUntilDue
 * @returns {{ text: string, tone: 'late' | 'today' | 'soon' | 'none' }}
 */
export const describeDue = (days) => {
    if (days === null || days === undefined) return { text: 'No date', tone: 'none' };
    if (days < 0) return { text: `${Math.abs(days)}d late`, tone: 'late' };
    if (days === 0) return { text: 'Today', tone: 'today' };
    if (days === 1) return { text: 'Tomorrow', tone: 'soon' };
    return { text: `In ${days}d`, tone: 'soon' };
};

export const DUE_TONE_CLASS = {
    late: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    today: 'bg-brand-tint text-brand dark:bg-brand/20 dark:text-violet-200',
    soon: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300',
    none: 'text-slate-400 dark:text-zinc-500',
};
