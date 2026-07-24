import { CornerDownRight } from "lucide-react";
import { format } from "date-fns";

export default function MessageItem({
    msg,
    colors,
    isDark,
    setThreadParent,
    setActiveRightPanel
}) {
    if (msg.type === "SYSTEM") {
        return (
            <div className="flex justify-center my-3.5">
                <span 
                    className="text-[11px] px-3 py-1.5 rounded-full border flex items-center gap-1.5 shadow-xs"
                    style={{ 
                        backgroundColor: isDark ? "#1E1E22" : "#F1F5F9", 
                        borderColor: colors.mainBorder,
                        color: colors.textMuted
                    }}
                >
                    👋 {msg.content}
                </span>
            </div>
        );
    }

    return (
        <div className="group flex items-start gap-3 p-2.5 rounded-lg transition-colors hover:bg-slate-200/40 dark:hover:bg-zinc-800/30">
            {msg.user?.image ? (
                <img src={msg.user.image} className="size-8.5 rounded-full object-cover mt-0.5" alt="avatar" />
            ) : (
                <div className="size-8.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm mt-0.5">
                    {msg.user?.name ? msg.user.name.charAt(0).toUpperCase() : "?"}
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span 
                        className="font-semibold text-sm"
                        style={{ color: colors.mainText }}
                    >
                        {msg.user?.name || "Unknown user"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        {format(new Date(msg.createdAt), "hh:mm a")}
                    </span>
                </div>
                <p 
                    className="text-sm mt-1 leading-relaxed whitespace-pre-wrap"
                    style={{ color: colors.mainText }}
                >
                    {msg.content}
                </p>
                
                {/* Thread actions */}
                <div className="flex items-center gap-3 mt-2">
                    <button
                        onClick={() => {
                            setThreadParent(msg);
                            setActiveRightPanel("thread");
                        }}
                        className="text-xs text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                        <CornerDownRight className="size-3" /> Reply in Thread
                    </button>
                    {msg._count?.replies > 0 && (
                        <span 
                            className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: isDark ? "#27272A" : "#E4E4E7", color: colors.textMuted }}
                        >
                            {msg._count.replies} repl{msg._count.replies === 1 ? "y" : "ies"}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
