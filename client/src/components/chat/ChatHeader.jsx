import { Pin, Settings, Users, Star } from 'lucide-react';

export default function ChatHeader({
    activeChannel,
    activeDM,
    onlineUsers = [],
    onOpenPinnedMessages,
    onOpenChannelDetails,
    starredChannelIds = [],
    onStarChannel
}) {
    const isDM = !!activeDM;
    const isOnline = isDM && onlineUsers.includes(activeDM.id);
    const isStarred = !isDM && activeChannel && starredChannelIds.includes(activeChannel.id);

    return (
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-5 pt-3 pb-3">

            {/* Main heading row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-left">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                        {isDM ? activeDM.name : activeChannel?.name ? `# ${activeChannel.name}` : 'Select a Channel'}
                    </h1>
                    {!isDM && activeChannel && (
                        <button 
                            onClick={() => onStarChannel(activeChannel.id)} 
                            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                            title={isStarred ? "Unstar channel" : "Star channel"}
                        >
                            <Star className={`size-4.5 transition-all ${isStarred ? 'text-amber-500 fill-amber-500 scale-110' : 'text-zinc-400 hover:text-amber-500'}`} />
                        </button>
                    )}
                    {isDM && (
                        <span className={`size-2.5 rounded-full mt-0.5 ${isOnline ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                    )}
                    {isDM && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">{isOnline ? 'Active Now' : 'Offline'}</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!isDM && activeChannel && (
                        <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-xs mr-2">
                            <Users className="size-3.5" />
                            <span>{activeChannel.members?.length || 0}</span>
                        </div>
                    )}
                    {!isDM && activeChannel && (
                        <>
                            <button onClick={onOpenPinnedMessages} className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors" title="Pinned messages">
                                <Pin className="size-4" />
                            </button>
                            <button onClick={onOpenChannelDetails} className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors" title="Channel settings">
                                <Settings className="size-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
