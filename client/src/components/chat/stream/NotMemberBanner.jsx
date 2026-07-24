import { Hash } from 'lucide-react';

export default function NotMemberBanner({ activeChat, handleJoinChannel, colors }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: colors.streamBg }}>
            <div className="size-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-4">
                <Hash className="size-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold" style={{ color: colors.mainText }}>You are viewing #{activeChat.name}</h3>
            <p className="text-sm max-w-sm mt-2" style={{ color: colors.textMuted }}>
                This is a public channel. Join it to view the message history, read threads, and post messages.
            </p>
            <button
                onClick={handleJoinChannel}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow transition cursor-pointer"
            >
                Join Channel
            </button>
        </div>
    );
}
