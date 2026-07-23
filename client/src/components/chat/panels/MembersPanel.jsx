import { X, Search } from "lucide-react";

export default function MembersPanel({
    setActiveRightPanel,
    joinedChannelMembers,
    filteredChannelMembers,
    membersSearchQuery,
    setMembersSearchQuery,
    currentUser,
    currentWorkspace,
    activeChannelObj,
    colors
}) {
    return (
        <>
            {/* Members Header */}
            <div 
                className="p-4 border-b flex items-center justify-between"
                style={{ borderColor: colors.mainBorder }}
            >
                <h4 className="font-bold text-sm" style={{ color: colors.mainText }}>
                    Channel Members ({joinedChannelMembers.length})
                </h4>
                <button 
                    onClick={() => setActiveRightPanel(null)} 
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                    <X className="size-4" />
                </button>
            </div>

            {/* Members search search bar */}
            <div className="p-3 border-b" style={{ borderColor: colors.mainBorder }}>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                    <input
                        type="text"
                        value={membersSearchQuery}
                        onChange={(e) => setMembersSearchQuery(e.target.value)}
                        placeholder="Search members..."
                        className="w-full text-xs pl-8 pr-3 py-1.5 rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        style={{
                            backgroundColor: colors.cardBg,
                            color: colors.mainText,
                            borderColor: colors.mainBorder
                        }}
                    />
                </div>
            </div>

            {/* Members List Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar" style={{ backgroundColor: colors.streamBg }}>
                {filteredChannelMembers.length > 0 ? (
                    filteredChannelMembers.map((member) => {
                        const isCreator = activeChannelObj?.creatorId === member.id;
                        const isOwner = currentWorkspace?.ownerId === member.id;
                        return (
                            <div 
                                key={member.id} 
                                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-200/35 dark:hover:bg-zinc-800/10 border border-transparent"
                            >
                                {member.image ? (
                                    <img src={member.image} className="size-7 rounded-full object-cover" alt="avatar" />
                                ) : (
                                    <div className="size-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-xs truncate" style={{ color: colors.mainText }}>
                                            {member.name}
                                        </span>
                                        {member.id === currentUser?.id && (
                                            <span className="text-[8px] bg-slate-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-1 rounded-sm">you</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {isOwner && (
                                            <span className="text-[7.5px] px-1 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 rounded-xs uppercase tracking-wide font-bold">Owner</span>
                                        )}
                                        {isCreator && (
                                            <span className="text-[7.5px] px-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xs uppercase tracking-wide font-bold">Creator</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-xs text-zinc-500 text-center py-8">No members found</p>
                )}
            </div>
        </>
    );
}
