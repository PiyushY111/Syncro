import { X, Send } from "lucide-react";
import { format } from "date-fns";

export default function ThreadPanel({
    threadParent,
    setThreadParent,
    setActiveRightPanel,
    threadReplies,
    typedReply,
    setTypedReply,
    handleSendReply,
    threadEndRef,
    activeChat,
    colors,
    isDark
}) {
    return (
        <>
            {/* Thread Header */}
            <div 
                className="p-4 border-b flex items-center justify-between"
                style={{ borderColor: colors.mainBorder }}
            >
                <h4 className="font-bold text-sm" style={{ color: colors.mainText }}>
                    Thread replies
                </h4>
                <button 
                    onClick={() => { setActiveRightPanel(null); setThreadParent(null); }} 
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                    <X className="size-4" />
                </button>
            </div>

            {/* Parent Message details */}
            <div 
                className="p-4 border-b flex items-start gap-3"
                style={{ backgroundColor: isDark ? "#1E1E22" : "#F8FAFC", borderColor: colors.mainBorder }}
            >
                {threadParent.user?.image ? (
                    <img src={threadParent.user.image} className="size-8 rounded-full object-cover mt-0.5" alt="avatar" />
                ) : (
                    <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs mt-0.5">
                        {threadParent.user?.name ? threadParent.user.name.charAt(0).toUpperCase() : "?"}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-xs" style={{ color: colors.mainText }}>
                        {threadParent.user?.name || "Unknown user"}
                    </span>
                    <p className="text-xs mt-1 leading-relaxed whitespace-pre-wrap" style={{ color: colors.mainText }}>
                        {threadParent.content}
                    </p>
                </div>
            </div>

            {/* Replies Stream */}
            <div 
                className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar"
                style={{ backgroundColor: colors.streamBg }}
            >
                {threadReplies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-200/30 dark:hover:bg-zinc-800/20">
                        {reply.user?.image ? (
                            <img src={reply.user.image} className="size-6.5 rounded-full object-cover mt-0.5" alt="avatar" />
                        ) : (
                            <div className="size-6.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-[10px] mt-0.5">
                                {reply.user?.name ? reply.user.name.charAt(0).toUpperCase() : "?"}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs" style={{ color: colors.mainText }}>
                                    {reply.user?.name || "Unknown user"}
                                </span>
                                <span className="text-[9px] text-gray-400">{format(new Date(reply.createdAt), "hh:mm a")}</span>
                            </div>
                            <p className="text-xs mt-0.5 leading-relaxed whitespace-pre-wrap" style={{ color: colors.mainText }}>
                                {reply.content}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={threadEndRef} />
            </div>

            {/* Reply Input Box */}
            <form 
                onSubmit={handleSendReply} 
                className="p-3 border-t flex gap-1.5"
                style={{ borderColor: colors.mainBorder }}
            >
                <input
                    type="text"
                    value={typedReply}
                    onChange={(e) => setTypedReply(e.target.value)}
                    disabled={activeChat.isArchived}
                    placeholder={activeChat.isArchived ? "Archived" : "Reply..."}
                    className="flex-1 rounded border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    style={{
                        backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                        color: colors.mainText,
                        borderColor: colors.mainBorder
                    }}
                />
                <button 
                    type="submit" 
                    disabled={!typedReply.trim() || activeChat.isArchived} 
                    className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                >
                    <Send className="size-3.5" />
                </button>
            </form>
        </>
    );
}
