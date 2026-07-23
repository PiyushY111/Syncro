import ThreadPanel from "@/components/chat/panels/ThreadPanel";
import MembersPanel from "@/components/chat/panels/MembersPanel";

export default function RightPanel({
    activeRightPanel,
    setActiveRightPanel,
    threadParent,
    setThreadParent,
    threadReplies,
    typedReply,
    setTypedReply,
    handleSendReply,
    threadEndRef,
    activeChat,
    joinedChannelMembers,
    filteredChannelMembers,
    membersSearchQuery,
    setMembersSearchQuery,
    currentUser,
    currentWorkspace,
    activeChannelObj,
    colors,
    isDark
}) {
    if (!activeRightPanel) return null;

    return (
        <div 
            className="w-80 border-l flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-150"
            style={{ backgroundColor: colors.mainBg, borderColor: colors.mainBorder }}
        >
            {activeRightPanel === "thread" && threadParent && (
                <ThreadPanel
                    threadParent={threadParent}
                    setThreadParent={setThreadParent}
                    setActiveRightPanel={setActiveRightPanel}
                    threadReplies={threadReplies}
                    typedReply={typedReply}
                    setTypedReply={setTypedReply}
                    handleSendReply={handleSendReply}
                    threadEndRef={threadEndRef}
                    activeChat={activeChat}
                    colors={colors}
                    isDark={isDark}
                />
            )}

            {activeRightPanel === "members" && (
                <MembersPanel
                    setActiveRightPanel={setActiveRightPanel}
                    joinedChannelMembers={joinedChannelMembers}
                    filteredChannelMembers={filteredChannelMembers}
                    membersSearchQuery={membersSearchQuery}
                    setMembersSearchQuery={setMembersSearchQuery}
                    currentUser={currentUser}
                    currentWorkspace={currentWorkspace}
                    activeChannelObj={activeChannelObj}
                    colors={colors}
                />
            )}
        </div>
    );
}
