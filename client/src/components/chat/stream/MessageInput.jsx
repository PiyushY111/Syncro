import { Send } from "lucide-react";

export default function MessageInput({
    typedMsg,
    setTypedMsg,
    handleSendMessage,
    activeChat,
    colors,
    isDark
}) {
    return (
        <form 
            onSubmit={handleSendMessage} 
            className="p-4 border-t flex gap-2"
            style={{ borderColor: colors.mainBorder }}
        >
            <input
                type="text"
                value={typedMsg}
                onChange={(e) => setTypedMsg(e.target.value)}
                disabled={activeChat.isArchived}
                placeholder={activeChat.isArchived ? "Channel is archived" : `Send a message to ${activeChat.type === "channel" ? "#" + activeChat.name : activeChat.name}`}
                className="flex-1 rounded border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                style={{
                    backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                    color: colors.mainText,
                    borderColor: colors.mainBorder
                }}
            />
            <button
                type="submit"
                disabled={!typedMsg.trim() || activeChat.isArchived}
                className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
            >
                <Send className="size-4" />
            </button>
        </form>
    );
}
