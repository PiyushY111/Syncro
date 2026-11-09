import { useState } from 'react';
import { X, Send } from 'lucide-react';
import MessageCard from './MessageCard';

export default function ThreadPanel({ parentMessage, onClose, onSendReply }) {
    const [replyContent, setReplyContent] = useState('');

    if (!parentMessage) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        onSendReply(parentMessage.id, replyContent.trim());
        setReplyContent('');
    };

    return (
        <div className="w-80 bg-white/60 dark:bg-white/[0.03] border-l border-slate-900/[0.07] dark:border-white/[0.07] flex flex-col h-full overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-900/[0.07] dark:border-white/[0.07] flex items-center justify-between">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Thread Reply</h3>
                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors">
                    <X className="size-4" />
                </button>
            </div>

            <div className="px-0 py-2 border-b border-slate-900/[0.05] dark:border-white/[0.07] bg-slate-500/[0.05] dark:bg-white/[0.06] border-l-4 border-l-blue-400">
                <MessageCard message={parentMessage} onReact={() => {}} onOpenThread={() => {}} onDelete={() => {}} onPin={() => {}} onStar={() => {}} onConvertTask={() => {}} />
            </div>

            <div className="flex-1 overflow-y-auto py-1">
                {parentMessage.replies?.map((r) => (
                    <MessageCard key={r.id} message={r} onReact={() => {}} onOpenThread={() => {}} onDelete={() => {}} onPin={() => {}} onStar={() => {}} onConvertTask={() => {}} />
                ))}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-900/[0.07] dark:border-white/[0.07]">
                <div className="flex items-center gap-2 border border-slate-900/10 dark:border-white/10 rounded-lg border-l-4 border-l-blue-400 bg-white/60 dark:bg-white/[0.06] overflow-hidden">
                    <input
                        type="text"
                        placeholder="Reply to thread..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                    />
                    <button type="submit" disabled={!replyContent.trim()} className="p-2 mr-1 bg-brand hover:bg-brand-strong text-white rounded-full disabled:opacity-30 cursor-pointer transition">
                        <Send className="size-3.5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
