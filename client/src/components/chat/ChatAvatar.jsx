import { useState } from 'react';

const initialsFor = (name = '') => name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';

/** A consistent image-first avatar with a graceful initials fallback. */
export default function ChatAvatar({ name, imageUrl, size = 'md', className = '' }) {
    const [failedToLoad, setFailedToLoad] = useState(false);
    const sizes = {
        sm: 'size-8 text-[11px]',
        md: 'size-9 text-xs',
        lg: 'size-11 text-sm'
    };

    const image = imageUrl?.trim();

    if (image && !failedToLoad) {
        return (
            <img
                src={image}
                alt={`${name || 'Member'} profile`}
                onError={() => setFailedToLoad(true)}
                className={`${sizes[size]} rounded-full object-cover shrink-0 bg-zinc-100 ${className}`}
            />
        );
    }

    return (
        <div className={`${sizes[size]} rounded-full shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold ${className}`}>
            {initialsFor(name)}
        </div>
    );
}
