import { useState, useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

export default function ChatInput({ onSendMessage, onTypingStart, onTypingStop }) {
    const [content, setContent] = useState('');
    const typingTimeoutRef = useRef(null);

    const handleChange = (e) => {
        setContent(e.target.value);
        if (onTypingStart) onTypingStart();

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (onTypingStop) onTypingStop();
        }, 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        onSendMessage(content.trim());
        setContent('');
        if (onTypingStop) onTypingStop();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border-t border-zinc-200 px-5 py-3">
            <div className="flex items-center border border-zinc-300 rounded-lg border-l-4 border-l-blue-400 bg-white overflow-hidden focus-within:border-zinc-400 focus-within:border-l-blue-500 transition">
                <input
                    type="text"
                    placeholder="Type a message or share updates..."
                    value={content}
                    onChange={handleChange}
                    className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none"
                />
                <div className="flex items-center gap-1 pr-2">
                    <button type="button" className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer" title="Attachments coming soon">
                        <Paperclip className="size-[18px]" />
                    </button>
                    <button type="button" className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer" title="Emoji picker coming soon">
                        <Smile className="size-[18px]" />
                    </button>
                    <button type="submit" disabled={!content.trim()} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full disabled:opacity-30 transition cursor-pointer ml-1">
                        <Send className="size-4" />
                    </button>
                </div>
            </div>
        </form>
    );
}
