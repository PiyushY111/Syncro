/**
 * Project navigation: five labelled section tabs, plus a sub-view switch for sections that have one.
 */
import { cn } from '@/lib/utils';
import { PROJECT_SECTIONS, getSection } from '@/components/project/detail/projectSections';

/**
 * @param {{ section: string, view: string, onSelect: (tabKey: string) => void, trailing?: import('react').ReactNode }} props
 */
export default function ProjectSectionNav({ section, view, onSelect, trailing }) {
    const current = getSection(section);

    return (
        <div className="space-y-3">
            <nav aria-label="Project sections" className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
                {PROJECT_SECTIONS.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.key === section;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onSelect(item.key)}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                'inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                                isActive
                                    ? 'bg-white text-slate-900 shadow-[0_6px_20px_-10px_rgba(30,27,75,0.35)] dark:bg-white/10 dark:text-white dark:shadow-none'
                                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
                            )}
                        >
                            <Icon className={cn('h-4 w-4', isActive ? 'text-brand dark:text-lime' : 'opacity-70')} strokeWidth={2} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {(current.views.length > 0 || trailing) && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {current.views.length > 0 ? (
                        <div role="tablist" aria-label={`${current.label} views`} className="inline-flex items-center gap-1 rounded-2xl bg-slate-500/[0.08] p-1 dark:bg-white/[0.05]">
                            {current.views.map((v) => {
                                const isActive = v.key === view;
                                return (
                                    <button
                                        key={v.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => onSelect(v.key)}
                                        className={cn(
                                            'rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                                            isActive ? 'bg-brand text-white shadow-sm dark:bg-lime dark:text-ink' : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                                        )}
                                    >
                                        {v.label}
                                    </button>
                                );
                            })}
                        </div>
                    ) : <span />}
                    {trailing}
                </div>
            )}
        </div>
    );
}
