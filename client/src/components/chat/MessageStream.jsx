import { useEffect, useRef } from 'react';
import MessageCard from './MessageCard';
import { MessageSquare } from 'lucide-react';

const getDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
};

export default function MessageStream({
    messages = [],
    typingUser = null,
    onReact,
    onOpenThread,
    onDeleteMessage,
    onPinMessage,
    onStarMessage,
    onConvertTask
}) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUser]);

    // Group messages by date for dividers
    const renderMessages = () => {
        const elements = [];
        let lastDateLabel = null;

        messages.forEach((msg) => {
            const label = getDateLabel(msg.createdAt);
            if (label !== lastDateLabel) {
                elements.push(
                    <div key={`divider-${msg.id}`} className="flex items-center gap-4 px-5 py-3">
                        <hr className="flex-1 border-zinc-200" />
                        <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">{label}</span>
                        <hr className="flex-1 border-zinc-200" />
                    </div>
                );
                lastDateLabel = label;
            }
            elements.push(
                <MessageCard
                    key={msg.id}
                    message={msg}
                    onReact={onReact}
                    onOpenThread={onOpenThread}
                    onDelete={onDeleteMessage}
                    onPin={onPinMessage}
                    onStar={onStarMessage}
                    onConvertTask={onConvertTask}
                />
            );
        });

        return elements;
    };

    return (
        <div className="flex-1 min-h-0 bg-white flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                        <div className="size-14 grid place-items-center rounded-full bg-blue-50 text-blue-500 mb-4">
                            <MessageSquare className="size-7" />
                        </div>
                        <h4 className="font-bold text-zinc-700 text-sm">Start the conversation</h4>
                        <p className="text-xs mt-1 max-w-xs text-zinc-400">Share an update, ask a question, or give your team a warm welcome.</p>
                    </div>
                ) : (
                    renderMessages()
                )}

                {typingUser && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 px-5 py-2">
                        <span className="flex gap-0.5">
                            <span className="size-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="size-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="size-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span className="italic">{typingUser.name} is typing...</span>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
