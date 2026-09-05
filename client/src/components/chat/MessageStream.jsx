import { useEffect, useRef } from 'react';
import MessageCard from './MessageCard';
import { MessageSquare, Loader2 } from 'lucide-react';

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
    isLoading = false,
    typingUser = null,
    onReact,
    onOpenThread,
    onDeleteMessage,
    onPinMessage,
    onStarMessage,
    onConvertTask
}) {
    const containerRef = useRef(null);
    const bottomRef = useRef(null);
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        if (isLoading) {
            isInitialLoadRef.current = true;
        }
    }, [isLoading]);

    useEffect(() => {
        if (isLoading || !containerRef.current) return;
        const container = containerRef.current;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 160;

        if (isInitialLoadRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
            if (messages.length > 0) {
                isInitialLoadRef.current = false;
            }
        } else if (isNearBottom || typingUser) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, typingUser, isLoading]);

    if (isLoading) {
        return (
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-950 flex flex-col justify-between p-5 space-y-6 overflow-hidden animate-pulse">
                <div className="space-y-6">
                    {/* Date divider skeleton */}
                    <div className="flex items-center gap-4 px-5 py-2">
                        <hr className="flex-1 border-zinc-200 dark:border-zinc-800" />
                        <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                        <hr className="flex-1 border-zinc-200 dark:border-zinc-800" />
                    </div>

                    {/* Message skeleton rows */}
                    {[
                        { wName: 'w-24', w1: 'w-3/4', w2: 'w-1/2' },
                        { wName: 'w-20', w1: 'w-2/3', w2: 'w-1/3' },
                        { wName: 'w-28', w1: 'w-5/6', w2: 'w-2/5' },
                        { wName: 'w-20', w1: 'w-1/2', w2: '' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 px-3">
                            <div className="size-9 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className={`h-3 ${item.wName} bg-zinc-200 dark:bg-zinc-800 rounded`} />
                                    <div className="h-2.5 w-12 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
                                </div>
                                <div className={`h-3.5 ${item.w1} bg-zinc-200 dark:bg-zinc-800 rounded`} />
                                {item.w2 && <div className={`h-3.5 ${item.w2} bg-zinc-100 dark:bg-zinc-800/70 rounded`} />}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Centered loader spinner */}
                <div className="flex items-center justify-center pb-4">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 font-medium shadow-xs">
                        <Loader2 className="size-3.5 animate-spin text-blue-500" />
                        <span>Loading conversation...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Group messages by date for dividers
    const renderMessages = () => {
        const elements = [];
        let lastDateLabel = null;

        messages.forEach((msg) => {
            const label = getDateLabel(msg.createdAt);
            if (label !== lastDateLabel) {
                elements.push(
                    <div key={`divider-${msg.id}`} className="flex items-center gap-4 px-5 py-3">
                        <hr className="flex-1 border-zinc-200 dark:border-zinc-800" />
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium whitespace-nowrap">{label}</span>
                        <hr className="flex-1 border-zinc-200 dark:border-zinc-800" />
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
        <div className="flex-1 min-h-0 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
            <div ref={containerRef} className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400 dark:text-zinc-500">
                        <div className="size-14 grid place-items-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 mb-4">
                            <MessageSquare className="size-7" />
                        </div>
                        <h4 className="font-bold text-zinc-700 dark:text-zinc-200 text-sm">Start the conversation</h4>
                        <p className="text-xs mt-1 max-w-xs text-zinc-400 dark:text-zinc-500">Share an update, ask a question, or give your team a warm welcome.</p>
                    </div>
                ) : (
                    renderMessages()
                )}

                {typingUser && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 px-5 py-2">
                        <span className="flex gap-0.5">
                            <span className="size-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="size-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="size-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span className="italic">{typingUser.name} is typing...</span>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
