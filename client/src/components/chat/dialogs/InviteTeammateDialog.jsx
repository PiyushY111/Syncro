import { X } from "lucide-react";

export default function InviteTeammateDialog({
    isInviteTeammateOpen,
    setIsInviteTeammateOpen,
    inviteCandidates,
    handleAddTeammate,
    activeChat,
    colors
}) {
    if (!isInviteTeammateOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-xs">
            <div 
                className="border rounded-xl shadow-lg w-full max-w-sm p-6 animate-in zoom-in-95 duration-100"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.mainBorder }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 
                        className="text-base font-bold"
                        style={{ color: colors.mainText }}
                    >
                        Invite Teammates to #{activeChat.name}
                    </h2>
                    <button onClick={() => setIsInviteTeammateOpen(false)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {inviteCandidates.length > 0 ? (
                        inviteCandidates.map((candidate) => (
                            <div 
                                key={candidate.user.id} 
                                className="flex items-center justify-between p-2.5 rounded-lg border"
                                style={{ borderColor: colors.mainBorder }}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    {candidate.user.image ? (
                                        <img src={candidate.user.image} className="size-6.5 rounded-full object-cover" alt="avatar" />
                                    ) : (
                                        <div className="size-6.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                                            {candidate.user.name[0].toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-xs truncate font-medium" style={{ color: colors.mainText }}>
                                        {candidate.user.name}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleAddTeammate(candidate.user.id)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold px-2.5 py-1 rounded cursor-pointer transition"
                                >
                                    Add
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-zinc-500 text-center py-4">All workspace members are already in this channel.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
