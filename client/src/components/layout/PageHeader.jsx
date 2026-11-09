/**
 * Page header shared by every in-app page so each one opens like the dashboard:
 * gradient icon tile, eyebrow, display title, description and right-aligned actions.
 */
import { cn } from '@/lib/utils';

const TONE_CLASS = { violet: '', rose: 'sx-tile-rose', emerald: 'sx-tile-emerald', amber: 'sx-tile-amber', sky: 'sx-tile-sky' };

/**
 * @param {{ icon?: import('react').ElementType, eyebrow?: string, title: import('react').ReactNode,
 *   description?: import('react').ReactNode, actions?: import('react').ReactNode,
 *   tone?: keyof typeof TONE_CLASS, className?: string, children?: import('react').ReactNode }} props
 */
export default function PageHeader({ icon, eyebrow, title, description, actions, tone = 'violet', className, children }) {
    const Icon = icon;
    return (
        <header className={cn('sx-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="flex min-w-0 items-center gap-4">
                {Icon && (
                    <span className={cn('sx-tile', TONE_CLASS[tone])}>
                        <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                    </span>
                )}
                <div className="min-w-0">
                    {eyebrow && <p className="text-xs font-medium text-brand dark:text-lime">{eyebrow}</p>}
                    <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px] dark:text-white">{title}</h1>
                    {description && <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-zinc-400">{description}</p>}
                </div>
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
            {children}
        </header>
    );
}
