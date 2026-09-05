import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, X, FileText, Image as ImageIcon } from 'lucide-react';

const EMOJI_CATEGORIES = [
    {
        name: 'Smileys',
        emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😎', '🤓', '🧐', '🤔', '🤐', '😮', '😴', '🤯', '🥳']
    },
    {
        name: 'Reactions',
        emojis: ['👍', '👎', '👏', '🙌', '🤝', '👊', '✌️', '🤞', '💪', '🙏', '❤️', '🧡', '💛', '💚', '💙', '💜', '🔥', '✨', '⚡', '🎉', '🚀', '💯', '👀', '💡']
    },
    {
        name: 'Status',
        emojis: ['✅', '❌', '⚠️', '⏳', '📌', '🎯', '🔒', '🔑', '💬', '🔔', '📦', '📝', '📊', '🔍', '⚙️', '📈']
    }
];

export default function ChatInput({ members = [], onSendMessage, onTypingStart, onTypingStop }) {
    const [content, setContent] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeEmojiTab, setActiveEmojiTab] = useState('Smileys');
    const [attachment, setAttachment] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);

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
        } else if (e.key === 'Escape' && showEmojiPicker) {
            setShowEmojiPicker(false);
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

    const handleSelectEmoji = (emoji) => {
        if (!inputRef.current) {
            setContent(prev => prev + emoji);
            setShowEmojiPicker(false);
            return;
        }

        const start = inputRef.current.selectionStart ?? content.length;
        const end = inputRef.current.selectionEnd ?? content.length;
        const newContent = content.substring(0, start) + emoji + content.substring(end);
        setContent(newContent);
        setShowEmojiPicker(false);

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const nextPos = start + emoji.length;
                inputRef.current.setSelectionRange(nextPos, nextPos);
            }
        }, 0);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachment({
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                type: file.type,
                raw: file
            });
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveAttachment = () => {
        setAttachment(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let messageToSend = content.trim();

        if (attachment) {
            const attachText = ` [📎 ${attachment.name} (${attachment.size})]`;
            messageToSend = messageToSend ? `${messageToSend}${attachText}` : `📎 Attached: ${attachment.name} (${attachment.size})`;
        }

        if (!messageToSend) return;

        onSendMessage(messageToSend);
        setContent('');
        setAttachment(null);
        setShowSuggestions(false);
        setShowEmojiPicker(false);
        if (onTypingStop) onTypingStop();
    };

    // Close popups when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
            setShowSuggestions(false);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const activeCategory = EMOJI_CATEGORIES.find(c => c.name === activeEmojiTab) || EMOJI_CATEGORIES[0];

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-5 py-3 relative" onClick={(e) => e.stopPropagation()}>
            {/* Mention Suggestions Dropdown */}
            {showSuggestions && filteredMembers.length > 0 && (
                <div
                    id="mention-listbox"
                    role="listbox"
                    aria-label="Workspace member mentions"
                    className="absolute bottom-[calc(100%-8px)] left-5 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50"
                >
                    <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800/80 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Mention workspace member
                    </div>
                    <ul className="max-h-48 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/50">
                        {filteredMembers.map((member, index) => {
                            const isActive = index === activeSuggestionIndex;
                            return (
                                <li
                                    key={member.id}
                                    role="option"
                                    aria-selected={isActive}
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

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
                <div
                    ref={emojiPickerRef}
                    role="dialog"
                    aria-label="Emoji Picker"
                    className="absolute bottom-[calc(100%+8px)] right-8 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex gap-1">
                            {EMOJI_CATEGORIES.map(cat => (
                                <button
                                    key={cat.name}
                                    type="button"
                                    onClick={() => setActiveEmojiTab(cat.name)}
                                    className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer ${activeEmojiTab === cat.name ? 'bg-blue-500 text-white font-semibold' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            aria-label="Close emoji picker"
                            onClick={() => setShowEmojiPicker(false)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded cursor-pointer"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1">
                        {activeCategory.emojis.map(emoji => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => handleSelectEmoji(emoji)}
                                className="h-8 w-8 flex items-center justify-center text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition cursor-pointer hover:scale-125 duration-100"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* File Attachment Chip */}
            {attachment && (
                <div className="flex items-center gap-2 mb-2 p-1.5 px-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg text-xs w-fit text-blue-700 dark:text-blue-300">
                    {attachment.type.startsWith('image/') ? (
                        <ImageIcon className="size-3.5 shrink-0" />
                    ) : (
                        <FileText className="size-3.5 shrink-0" />
                    )}
                    <span className="font-semibold truncate max-w-[200px]">{attachment.name}</span>
                    <span className="text-[10px] text-blue-500 dark:text-blue-400">({attachment.size})</span>
                    <button
                        type="button"
                        aria-label="Remove attachment"
                        onClick={handleRemoveAttachment}
                        className="text-blue-400 hover:text-red-500 p-0.5 rounded transition cursor-pointer"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            )}

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                aria-label="Upload file attachment"
            />

            <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg border-l-4 border-l-blue-400 bg-white dark:bg-zinc-800/80 overflow-hidden focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:border-l-blue-500 transition">
                <input
                    ref={inputRef}
                    type="text"
                    aria-label="Chat message input"
                    aria-autocomplete="list"
                    aria-expanded={showSuggestions}
                    aria-controls={showSuggestions ? "mention-listbox" : undefined}
                    placeholder="Type a message or share updates..."
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                />
                <div className="flex items-center gap-1 pr-2">
                    <button
                        type="button"
                        aria-label="Attach file"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                        title="Attach file"
                    >
                        <Paperclip className="size-[18px]" />
                    </button>
                    <button
                        type="button"
                        aria-label="Choose emoji"
                        aria-haspopup="dialog"
                        aria-expanded={showEmojiPicker}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowEmojiPicker(prev => !prev);
                        }}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${showEmojiPicker ? 'bg-blue-50 dark:bg-blue-950 text-blue-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
                        title="Add emoji"
                    >
                        <Smile className="size-[18px]" />
                    </button>
                    <button
                        type="submit"
                        aria-label="Send message"
                        disabled={!content.trim() && !attachment}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full disabled:opacity-30 transition cursor-pointer ml-1"
                    >
                        <Send className="size-4" />
                    </button>
                </div>
            </div>
        </form>
    );
}
