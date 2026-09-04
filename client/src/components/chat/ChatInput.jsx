import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

export default function ChatInput({ members = [], onSendMessage, onTypingStart, onTypingStop }) {
    const [content, setContent] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    const filteredMembers = members
        .map(m => m.user)
        .filter(u => u && u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleChange = (e) => {
        const val = e.target.value;
        setContent(val);

        if (onTypingStart) onTypingStart();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (onTypingStop) onTypingStop();
        }, 2000);

        // Check cursor position for @ mentions suggestion list
        const selectionStart = e.target.selectionStart;
        const textBeforeCursor = val.substring(0, selectionStart);
        const words = textBeforeCursor.split(/\s+/);
        const lastWord = words[words.length - 1];

        if (lastWord && lastWord.startsWith('@')) {
            setSearchQuery(lastWord.substring(1));
            setShowSuggestions(true);
            setActiveSuggestionIndex(0);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e) => {
        if (showSuggestions && filteredMembers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestionIndex((prev) => (prev + 1) % filteredMembers.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelectSuggestion(filteredMembers[activeSuggestionIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowSuggestions(false);
            }
        }
    };

    const handleSelectSuggestion = (user) => {
        if (!inputRef.current) return;
        const selectionStart = inputRef.current.selectionStart;
        const textBeforeCursor = content.substring(0, selectionStart);
        const textAfterCursor = content.substring(selectionStart);
        
        // Find last index of '@' before cursor
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        const newTextBeforeCursor = textBeforeCursor.substring(0, lastAtIndex) + `@${user.name} `;
        
        setContent(newTextBeforeCursor + textAfterCursor);
        setShowSuggestions(false);

        // Focus back and place cursor after the inserted name
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newCursorPos = newTextBeforeCursor.length;
                inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        onSendMessage(content.trim());
        setContent('');
        setShowSuggestions(false);
        if (onTypingStop) onTypingStop();
    };

    // Close suggestions dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowSuggestions(false);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-5 py-3 relative" onClick={(e) => e.stopPropagation()}>
            {/* Mention Suggestions Dropdown */}
            {showSuggestions && filteredMembers.length > 0 && (
                <div className="absolute bottom-[calc(100%-8px)] left-5 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800/80 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Mention workspace member
                    </div>
                    <ul className="max-h-48 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/50">
                        {filteredMembers.map((member, index) => {
                            const isActive = index === activeSuggestionIndex;
                            return (
                                <li
                                    key={member.id}
                                    onClick={() => handleSelectSuggestion(member)}
                                    className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'}`}
                                >
                                    <div className="size-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs uppercase text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                        {member.name.charAt(0)}
                                    </div>
                                    <span className="truncate">{member.name}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg border-l-4 border-l-blue-400 bg-white dark:bg-zinc-800/80 overflow-hidden focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:border-l-blue-500 transition">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message or share updates..."
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                />
                <div className="flex items-center gap-1 pr-2">
                    <button type="button" className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer" title="Attachments coming soon">
                        <Paperclip className="size-[18px]" />
                    </button>
                    <button type="button" className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer" title="Emoji picker coming soon">
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
