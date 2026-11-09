/**
 * Dashboard surface primitives: Panel (titled tile with staggered entrance) and PanelEmpty.
 */
import { cn } from '@/lib/utils';

/**
 * @param {{ eyebrow?: string, title: string, action?: import('react').ReactNode, delay?: number,
 *   className?: string, bodyClassName?: string, children: import('react').ReactNode }} props
 */
export default function Panel({ eyebrow, title, action, delay = 0, className, bodyClassName, children }) {
    return (
        <section
            style={{ '--rise-delay': `${delay}ms` }}
            className={cn(
                'sx-glass sx-rise flex min-w-0 flex-col rounded-3xl',
                className
            )}
        >
            <header className="flex items-end justify-between gap-4 px-5 pb-3 pt-5">
                <div className="min-w-0">
                    {eyebrow && (
                        <p className="font-data mb-1 text-xs font-medium text-slate-400 dark:text-zinc-500">{eyebrow}</p>
                    )}
                    <h2 className="truncate text-[17px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">{title}</h2>
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </header>
            <div className={cn('flex-1 px-5 pb-5', bodyClassName)}>{children}</div>
        </section>
    );
}

export function PanelEmpty({ icon: Icon, title, children }) {
    return (
        <div className="flex h-full min-h-[148px] flex-col items-center justify-center rounded-2xl bg-white/45 px-4 py-8 text-center dark:bg-white/[0.025]">
            {Icon && <Icon className="mb-2.5 h-5 w-5 text-slate-300 dark:text-zinc-600" strokeWidth={1.6} />}
            <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">{title}</p>
            {children && <div className="mt-1 text-xs text-slate-400 dark:text-zinc-500">{children}</div>}
        </div>
    );
}

/** Small text-link style action used in panel headers. */
export const panelLinkClass =
    'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-black/[0.04] hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100';
