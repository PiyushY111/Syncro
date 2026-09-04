import { Pin, Star, MessageSquare, CheckSquare, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ChatAvatar from './ChatAvatar';

export default function MessageCard({ message, onReact, onOpenThread, onDelete, onPin, onStar, onConvertTask }) {
    const { user } = useAuth();
    const isOwner = message.senderId === user?.id || message.userId === user?.id;

    const isSystem = message.type === 'SYSTEM' || 
                     /created the channel|joined the channel|left the channel|archived the channel/i.test(message.content);

    if (isSystem) {
        return (
            <div className="flex items-center gap-3 py-3 px-5 animate-fade-in">
                <hr className="flex-1 border-zinc-200 dark:border-zinc-800" />
                <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                    {message.content}
                    <span className="text-zinc-400 dark:text-zinc-500 ml-2">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </span>
                <hr className="flex-1 border-zinc-200 dark:border-zinc-800" />
            </div>
        );
    }

    const senderName = message.user?.name || message.sender?.name || 'User';

    // Group reactions by emoji
    const groupedReactions = (message.reactions || []).reduce((acc, r) => {
        if (!acc[r.emoji]) {
            acc[r.emoji] = { emoji: r.emoji, count: 0, userIds: [], users: [] };
        }
        acc[r.emoji].count += 1;
        acc[r.emoji].userIds.push(r.userId);
        if (r.user?.name) acc[r.emoji].users.push(r.user.name);
        return acc;
    }, {});

    const reactionsList = Object.values(groupedReactions);

    return (
        <div className={`group relative flex items-start gap-3 px-5 py-2 animate-stiff-slide-up ${isOwner ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <ChatAvatar name={senderName} imageUrl={message.user?.image || message.sender?.image} size="sm" className="mt-1 shrink-0" />

            {/* Message Body & Metadata */}
            <div className={`flex flex-col max-w-[70%] ${isOwner ? 'items-end' : 'items-start'}`}>
                {/* Name & Time */}
                <div className="flex items-center gap-2 mb-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                    {!isOwner && <span className="font-bold text-xs text-zinc-700 dark:text-zinc-200">{senderName}</span>}
                    <span>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.isPinned && <Pin className="size-3 text-amber-500 fill-amber-500" />}
                    {message.isStarred && <Star className="size-3 text-amber-500 fill-amber-500" />}
                </div>

                {/* Bubble Container */}
                <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-xs transition-stiff ${
                    isOwner 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none'
                }`}>
                    <p className="break-words text-left">{message.content}</p>
                    
                    {reactionsList.length > 0 && (
                        <div className={`flex items-center gap-1.5 mt-2 flex-wrap ${isOwner ? 'justify-end' : 'justify-start'}`}>
                            {reactionsList.map((r, i) => {
                                const hasReacted = r.userIds.includes(user?.id);
                                return (
                                    <button 
                                        key={i} 
                                        onClick={() => onReact(message.id, r.emoji)} 
                                        title={r.users.length > 0 ? r.users.join(", ") : "Reacted"}
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-all duration-200 flex items-center gap-1 ${
                                            hasReacted
                                                ? isOwner
                                                    ? 'bg-white text-blue-600 border-white font-extrabold shadow-sm'
                                                    : 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-955/40 dark:border-blue-900/60 dark:text-blue-400 font-extrabold shadow-xs'
                                                : isOwner 
                                                    ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white' 
                                                    : 'bg-zinc-50 hover:bg-zinc-150 border-zinc-200 text-zinc-600 dark:bg-zinc-800/60 dark:hover:bg-zinc-700 dark:border-zinc-700 dark:text-zinc-355'
                                        }`}
                                    >
                                        <span>{r.emoji}</span>
                                        <span className="text-[9px]">{r.count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Hover action toolbar */}
            <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 flex items-center gap-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 shadow-sm z-10 ${
                isOwner ? 'left-4' : 'right-4'
            }`}>
                <button onClick={() => onReact(message.id, '👍')} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 cursor-pointer text-sm" title="React 👍">👍</button>
                <button onClick={() => onReact(message.id, '❤️')} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 cursor-pointer text-sm" title="React ❤️">❤️</button>
                <button onClick={() => onReact(message.id, '🔥')} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 cursor-pointer text-sm" title="React 🔥">🔥</button>
                <button onClick={() => onReact(message.id, '🎉')} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 cursor-pointer text-sm" title="React 🎉">🎉</button>
                <button onClick={() => onStar && onStar(message.id)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-400 cursor-pointer" title="Star Message"><Star className="size-3.5" /></button>
                <button onClick={() => onOpenThread(message)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-400 cursor-pointer" title="Thread Reply"><MessageSquare className="size-3.5" /></button>
                <button onClick={() => onPin(message.id)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-400 cursor-pointer" title="Pin Message"><Pin className="size-3.5" /></button>
                <button onClick={() => onConvertTask(message)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-400 cursor-pointer" title="Convert to Task"><CheckSquare className="size-3.5" /></button>
                {isOwner && (
                    <button onClick={() => onDelete(message.id)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-rose-455 cursor-pointer" title="Delete"><Trash2 className="size-3.5" /></button>
                )}
            </div>
        </div>
    );
}
