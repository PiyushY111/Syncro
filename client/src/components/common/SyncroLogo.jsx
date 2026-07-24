import React from 'react';

// Brand S-Logo Mark with embedded Chat, Calendar, and Checkmark icons
export function SyncroLogoMark({ size = 'md', className = '' }) {
    const sizeClasses = {
        xs: 'size-6',
        sm: 'size-8',
        md: 'size-10',
        lg: 'size-12',
        xl: 'size-16',
        '2xl': 'size-24'
    };

    const dimension = sizeClasses[size] || sizeClasses.md;

    return (
        <div className={`relative flex items-center justify-center shrink-0 ${dimension} ${className}`}>
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-md"
            >
                <defs>
                    {/* Brand Gradient: Purple -> Blue -> Cyan -> Emerald */}
                    <linearGradient id="syncroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="35%" stopColor="#3b82f6" />
                        <stop offset="70%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>

                    <linearGradient id="syncroDotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>

                    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
                    </filter>
                </defs>

                {/* Outer S-Ribbon Path */}
                <path
                    d="M 65 14 
                       C 40 14, 30 26, 30 38 
                       C 30 52, 70 48, 70 64 
                       C 70 78, 56 86, 35 86 
                       C 46 86, 76 84, 76 64 
                       C 76 44, 36 48, 36 38 
                       C 36 24, 52 14, 65 14 Z"
                    fill="url(#syncroGradient)"
                />

                {/* S-Shape Main Body with 3 Flow Curves */}
                <path
                    d="M 62 12
                       H 36
                       C 24 12, 16 22, 16 34
                       C 16 48, 32 54, 46 58
                       C 64 63, 76 68, 76 80
                       C 76 92, 62 98, 44 98
                       C 28 98, 16 92, 12 84
                       C 20 90, 32 94, 46 94
                       C 68 94, 84 84, 84 68
                       C 84 52, 68 46, 54 42
                       C 36 37, 24 32, 24 22
                       C 24 14, 34 12, 50 12
                       Z"
                    fill="url(#syncroGradient)"
                />

                {/* 1. Chat Bubble Icon (Top Curve) */}
                <g transform="translate(42, 22) scale(0.7)">
                    <rect x="0" y="0" width="22" height="15" rx="4" fill="#ffffff" opacity="0.95" />
                    <polygon points="4,15 9,15 3,20" fill="#ffffff" opacity="0.95" />
                    <circle cx="5" cy="7.5" r="1.5" fill="#7c3aed" />
                    <circle cx="11" cy="7.5" r="1.5" fill="#3b82f6" />
                    <circle cx="17" cy="7.5" r="1.5" fill="#06b6d4" />
                </g>

                {/* 2. Calendar Grid Icon (Middle Curve) */}
                <g transform="translate(41, 47) scale(0.75)">
                    <rect x="0" y="0" width="22" height="20" rx="3" fill="#ffffff" opacity="0.95" />
                    <rect x="0" y="0" width="22" height="6" rx="3" fill="#3b82f6" />
                    {/* Ring binders */}
                    <rect x="4" y="-2" width="2" height="4" rx="1" fill="#1e293b" />
                    <rect x="16" y="-2" width="2" height="4" rx="1" fill="#1e293b" />
                    {/* Grid dots */}
                    <circle cx="5" cy="10" r="1" fill="#06b6d4" />
                    <circle cx="11" cy="10" r="1" fill="#06b6d4" />
                    <circle cx="17" cy="10" r="1" fill="#06b6d4" />
                    <circle cx="5" cy="15" r="1" fill="#10b981" />
                    <circle cx="11" cy="15" r="1" fill="#10b981" />
                    <circle cx="17" cy="15" r="1" fill="#10b981" />
                </g>

                {/* 3. Checkmark Badge Icon (Bottom Curve) */}
                <g transform="translate(42, 73) scale(0.75)">
                    <rect x="0" y="0" width="18" height="16" rx="3" fill="#ffffff" opacity="0.95" />
                    <path d="M4 8 L8 12 L14 4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>
            </svg>
        </div>
    );
}

// Full Brand Logo with Wordmark & Tagline option
export default function SyncroLogo({
    size = 'md',
    variant = 'full',
    showTagline = false,
    className = ''
}) {
    const textSizes = {
        xs: 'text-base',
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-3xl'
    };

    const textSize = textSizes[size] || textSizes.md;

    if (variant === 'mark') {
        return <SyncroLogoMark size={size} className={className} />;
    }

    return (
        <div className={`flex flex-col text-left ${className}`}>
            <div className="flex items-center gap-2.5">
                <SyncroLogoMark size={size} />
                <div className="flex items-baseline font-black tracking-tight font-sans">
                    <span className={`font-extrabold text-zinc-900 dark:text-white ${textSize}`}>
                        Syncr
                    </span>
                    <span className={`font-black bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent ${textSize}`}>
                        o
                    </span>
                </div>
            </div>

            {showTagline && (
                <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider mt-1 flex items-center gap-1.5">
                    <span>Plan Together.</span>
                    <span>•</span>
                    <span>Chat Instantly.</span>
                    <span>•</span>
                    <span>Sync Everything.</span>
                </div>
            )}
        </div>
    );
}
