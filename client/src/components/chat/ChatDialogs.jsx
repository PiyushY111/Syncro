import BrowseChannelsDialog from "@/components/chat/dialogs/BrowseChannelsDialog";
import CreateChannelDialog from "@/components/chat/dialogs/CreateChannelDialog";
import EditChannelDialog from "@/components/chat/dialogs/EditChannelDialog";
import InviteTeammateDialog from "@/components/chat/dialogs/InviteTeammateDialog";
import ConfirmDialog from "@/components/chat/dialogs/ConfirmDialog";

export default function ChatDialogs({
    // Browse Channels
    isBrowseChannelsOpen,
    setIsBrowseChannelsOpen,
    browseSearchQuery,
    setBrowseSearchQuery,
    filteredPublicChannels,
    currentUser,
    setActiveChat,
    handleJoinChannelById,

    // Create Channel
    isCreateChannelOpen,
    setIsCreateChannelOpen,
    newChannelName,
    setNewChannelName,
    newChannelDesc,
    setNewChannelDesc,
    newChannelIsPrivate,
    setNewChannelIsPrivate,
    handleCreateChannel,

    // Edit Channel
    isEditChannelOpen,
    setIsEditChannelOpen,
    editChannelName,
    setEditChannelName,
    editChannelDesc,
    setEditChannelDesc,
    handleEditChannel,

    // Invite Teammates
    isInviteTeammateOpen,
    setIsInviteTeammateOpen,
    inviteCandidates,
    handleAddTeammate,
    activeChat,

    // Confirm Modal
    confirmModal,
    setConfirmModal,
    handleDeleteChannel,
    handleClearDMs,

    // Shared UI Properties
    colors,
    isDark
}) {
    return (
        <>
            <BrowseChannelsDialog
                isBrowseChannelsOpen={isBrowseChannelsOpen}
                setIsBrowseChannelsOpen={setIsBrowseChannelsOpen}
                browseSearchQuery={browseSearchQuery}
                setBrowseSearchQuery={setBrowseSearchQuery}
                filteredPublicChannels={filteredPublicChannels}
                currentUser={currentUser}
                setActiveChat={setActiveChat}
                setConfirmModal={setConfirmModal}
                colors={colors}
                isDark={isDark}
            />

            <CreateChannelDialog
                isCreateChannelOpen={isCreateChannelOpen}
                setIsCreateChannelOpen={setIsCreateChannelOpen}
                newChannelName={newChannelName}
                setNewChannelName={setNewChannelName}
                newChannelDesc={newChannelDesc}
                setNewChannelDesc={setNewChannelDesc}
                newChannelIsPrivate={newChannelIsPrivate}
                setNewChannelIsPrivate={setNewChannelIsPrivate}
                handleCreateChannel={handleCreateChannel}
                colors={colors}
                isDark={isDark}
            />

            <EditChannelDialog
                isEditChannelOpen={isEditChannelOpen}
                setIsEditChannelOpen={setIsEditChannelOpen}
                editChannelName={editChannelName}
                setEditChannelName={setEditChannelName}
                editChannelDesc={editChannelDesc}
                setEditChannelDesc={setEditChannelDesc}
                handleEditChannel={handleEditChannel}
                colors={colors}
                isDark={isDark}
            />

            <InviteTeammateDialog
                isInviteTeammateOpen={isInviteTeammateOpen}
                setIsInviteTeammateOpen={setIsInviteTeammateOpen}
                inviteCandidates={inviteCandidates}
                handleAddTeammate={handleAddTeammate}
                activeChat={activeChat}
                colors={colors}
            />

            <ConfirmDialog
                confirmModal={confirmModal}
                setConfirmModal={setConfirmModal}
                handleDeleteChannel={handleDeleteChannel}
                handleClearDMs={handleClearDMs}
                handleJoinChannelById={handleJoinChannelById}
                colors={colors}
            />
        </>
    );
}
