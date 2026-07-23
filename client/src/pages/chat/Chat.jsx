import ChatSidebar from '@/components/chat/ChatSidebar';
import MessageStream from '@/components/chat/MessageStream';
import RightPanel from '@/components/chat/RightPanel';
import ChatDialogs from '@/components/chat/ChatDialogs';
import useChat from '@/hooks/useChat';

export default function Chat() {
    const chat = useChat();

    return (
        <div 
            className="flex border rounded-2xl overflow-hidden h-[82vh] max-w-6xl mx-auto shadow-md"
            style={{ backgroundColor: chat.colors.mainBg, borderColor: chat.colors.mainBorder }}
        >
            <ChatSidebar
                channels={chat.channels}
                activeChat={chat.activeChat}
                setActiveChat={chat.setActiveChat}
                dmMembers={chat.dmMembers}
                setIsBrowseChannelsOpen={chat.setIsBrowseChannelsOpen}
                setBrowseSearchQuery={chat.setBrowseSearchQuery}
                setIsCreateChannelOpen={chat.setIsCreateChannelOpen}
                setIsMenuOpen={chat.setIsMenuOpen}
                colors={chat.colors}
            />

            <MessageStream
                activeChat={chat.activeChat}
                isNotMember={chat.isNotMember}
                messages={chat.messages}
                typedMsg={chat.typedMsg}
                setTypedMsg={chat.setTypedMsg}
                handleSendMessage={chat.handleSendMessage}
                handleJoinChannel={chat.handleJoinChannel}
                currentUser={chat.currentUser}
                colors={chat.colors}
                isDark={chat.isDark}
                chatEndRef={chat.chatEndRef}
                setThreadParent={chat.setThreadParent}
                setActiveRightPanel={chat.setActiveRightPanel}
                isMenuOpen={chat.isMenuOpen}
                setIsMenuOpen={chat.setIsMenuOpen}
                canEditChannel={chat.canEditChannel}
                handleCopyInviteLink={chat.handleCopyInviteLink}
                setIsInviteTeammateOpen={chat.setIsInviteTeammateOpen}
                activeChannelObj={chat.activeChannelObj}
                setConfirmModal={chat.setConfirmModal}
                joinedChannelMembers={chat.joinedChannelMembers}
                setEditChannelName={chat.setEditChannelName}
                setEditChannelDesc={chat.setEditChannelDesc}
                handleToggleArchive={chat.handleToggleArchive}
            />

            <RightPanel
                activeRightPanel={chat.activeRightPanel}
                setActiveRightPanel={chat.setActiveRightPanel}
                threadParent={chat.threadParent}
                setThreadParent={chat.setThreadParent}
                threadReplies={chat.threadReplies}
                typedReply={chat.typedReply}
                setTypedReply={chat.setTypedReply}
                handleSendReply={chat.handleSendReply}
                threadEndRef={chat.threadEndRef}
                activeChat={chat.activeChat}
                joinedChannelMembers={chat.joinedChannelMembers}
                filteredChannelMembers={chat.filteredChannelMembers}
                membersSearchQuery={chat.membersSearchQuery}
                setMembersSearchQuery={chat.setMembersSearchQuery}
                currentUser={chat.currentUser}
                currentWorkspace={chat.currentWorkspace}
                activeChannelObj={chat.activeChannelObj}
                colors={chat.colors}
                isDark={chat.isDark}
            />

            <ChatDialogs
                isBrowseChannelsOpen={chat.isBrowseChannelsOpen}
                setIsBrowseChannelsOpen={chat.setIsBrowseChannelsOpen}
                browseSearchQuery={chat.browseSearchQuery}
                setBrowseSearchQuery={chat.setBrowseSearchQuery}
                filteredPublicChannels={chat.filteredPublicChannels}
                currentUser={chat.currentUser}
                setActiveChat={chat.setActiveChat}
                handleJoinChannelById={chat.handleJoinChannelById}
                isCreateChannelOpen={chat.isCreateChannelOpen}
                setIsCreateChannelOpen={chat.setIsCreateChannelOpen}
                newChannelName={chat.newChannelName}
                setNewChannelName={chat.setNewChannelName}
                newChannelDesc={chat.newChannelDesc}
                setNewChannelDesc={chat.setNewChannelDesc}
                newChannelIsPrivate={chat.newChannelIsPrivate}
                setNewChannelIsPrivate={chat.setNewChannelIsPrivate}
                handleCreateChannel={chat.handleCreateChannel}
                isEditChannelOpen={chat.isEditChannelOpen}
                setIsEditChannelOpen={chat.setIsEditChannelOpen}
                editChannelName={chat.editChannelName}
                setEditChannelName={chat.setEditChannelName}
                editChannelDesc={chat.editChannelDesc}
                setEditChannelDesc={chat.setEditChannelDesc}
                handleEditChannel={chat.handleEditChannel}
                isInviteTeammateOpen={chat.isInviteTeammateOpen}
                setIsInviteTeammateOpen={chat.setIsInviteTeammateOpen}
                inviteCandidates={chat.inviteCandidates}
                handleAddTeammate={chat.handleAddTeammate}
                activeChat={chat.activeChat}
                confirmModal={chat.confirmModal}
                setConfirmModal={chat.setConfirmModal}
                handleDeleteChannel={chat.handleDeleteChannel}
                handleClearDMs={chat.handleClearDMs}
                colors={chat.colors}
                isDark={chat.isDark}
            />
        </div>
    );
}
