import { Hash, Lock } from 'lucide-react';
import { useState } from 'react';

export default function ChannelIcon({ channel, size = 'md', className = '' }) {
    const [failedToLoad, setFailedToLoad] = useState(false);
    const sizes = { sm: 'size-5', md: 'size-10', lg: 'size-16' };
    const iconSize = { sm: 'size-4', md: 'size-5', lg: 'size-7' };

    if (channel?.iconUrl && !failedToLoad) {
        return <img src={channel.iconUrl} alt="" onError={() => setFailedToLoad(true)} className={`${sizes[size]} rounded-xl object-cover shrink-0 bg-slate-100 ${className}`} />;
    }

    const Icon = channel?.isPrivate ? Lock : Hash;
    return (
        <div className={`${sizes[size]} rounded-xl shrink-0 grid place-items-center bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 ${className}`}>
            <Icon className={`${iconSize[size]} ${channel?.isPrivate ? 'text-amber-500' : ''}`} />
        </div>
    );
}
