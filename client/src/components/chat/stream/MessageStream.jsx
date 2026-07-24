import { HelpCircle, MessageSquare } from "lucide-react";
import MessageHeader from "./MessageHeader";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import NotMemberBanner from "./NotMemberBanner";

export default function MessageStream({
    activeChat, isNotMember, messages, typedMsg, setTypedMsg, handleSendMessage,
    handleJoinChannel, currentUser, colors, isDark, chatEndRef, setThreadParent,
    setActiveRightPanel, isMenuOpen, setIsMenuOpen, canEditChannel, handleCopyInviteLink,
    setIsInviteTeammateOpen, activeChannelObj, setConfirmModal, joinedChannelMembers,
    setEditChannelName, setEditChannelDesc, setIsEditChannelOpen, handleToggleArchive
}) {
    return (
        <div className="flex-1 flex flex-col relative" style={{ backgroundColor: colors.mainBg }}>
            {activeChat.id ? (
                <>
                    <MessageHeader
                        activeChat={activeChat} isNotMember={isNotMember} isMenuOpen={isMenuOpen}
                        setIsMenuOpen={setIsMenuOpen} joinedChannelMembers={joinedChannelMembers}
                        setActiveRightPanel={setActiveRightPanel} handleCopyInviteLink={handleCopyInviteLink}
                        setIsInviteTeammateOpen={setIsInviteTeammateOpen} canEditChannel={canEditChannel}
                        setEditChannelName={setEditChannelName} setEditChannelDesc={setEditChannelDesc}
                        activeChannelObj={activeChannelObj} setIsEditChannelOpen={setIsEditChannelOpen}
                        handleToggleArchive={handleToggleArchive} setConfirmModal={setConfirmModal} colors={colors}
                    />

                    {activeChat.isArchived && (
                        <div className="bg-amber-100/50 dark:bg-amber-950/20 border-b border-amber-300 dark:border-amber-900 p-3 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-400">
                            <HelpCircle className="size-4 text-amber-500 flex-shrink-0" />
                            <span>This channel has been archived. Posting new messages is locked.</span>
                        </div>
                    )}

                    {isNotMember ? (
                        <NotMemberBanner activeChat={activeChat} handleJoinChannel={handleJoinChannel} colors={colors} />
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ backgroundColor: colors.streamBg }}>
                                {messages.length > 0 ? (
                                    messages.map((msg) => (
                                        <MessageItem key={msg.id} msg={msg} currentUser={currentUser} colors={colors} isDark={isDark} setThreadParent={setThreadParent} setActiveRightPanel={setActiveRightPanel} />
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                                        <MessageSquare className="size-14 mb-3 text-zinc-500" />
                                        <p className="text-sm">This is the start of your message history with {activeChat.name}.</p>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <MessageInput typedMsg={typedMsg} setTypedMsg={setTypedMsg} handleSendMessage={handleSendMessage} activeChat={activeChat} colors={colors} isDark={isDark} />
                        </>
                    )}
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <MessageSquare className="size-16 mb-4 text-zinc-300 dark:text-zinc-700" />
                    <p className="text-base font-semibold" style={{ color: colors.mainText }}>No Active Conversation</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Select a group channel or team member to get started!</p>
                </div>
            )}
        </div>
    );
}
