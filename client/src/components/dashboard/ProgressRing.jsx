/**
 * SVG progress ring. Solid colour via a Tailwind stroke class, or a two-stop gradient via `gradient`.
 * @param {{ value: number, size?: number, stroke?: number, trackClassName?: string, arcClassName?: string,
 *   gradient?: [string, string], label?: string, children?: import('react').ReactNode }} props
 */
import { useId } from 'react';

export default function ProgressRing({
    value,
    size = 44,
    stroke = 4,
    trackClassName = 'stroke-black/[0.06] dark:stroke-white/[0.08]',
    arcClassName = 'stroke-brand',
    gradient,
    label,
    children,
}) {
    const gradientId = useId();
    const clamped = Math.min(100, Math.max(0, value || 0));
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - clamped / 100);

    return (
        <div
            className="relative inline-flex shrink-0 items-center justify-center"
            style={{ width: size, height: size }}
            role="img"
            aria-label={label || `${clamped}% complete`}
        >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                {gradient && (
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={gradient[0]} />
                            <stop offset="100%" stopColor={gradient[1]} />
                        </linearGradient>
                    </defs>
                )}
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className={trackClassName} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    stroke={gradient ? `url(#${gradientId})` : undefined}
                    className={`${gradient ? '' : arcClassName} transition-[stroke-dashoffset] duration-1000 ease-out`}
                />
            </svg>
            {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
        </div>
    );
}
