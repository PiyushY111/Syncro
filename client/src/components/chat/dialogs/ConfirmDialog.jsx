import { Users, Trash2 } from "lucide-react";

export default function ConfirmDialog({
    confirmModal,
    setConfirmModal,
    handleDeleteChannel,
    handleClearDMs,
    handleJoinChannelById,
    colors
}) {
    if (!confirmModal.isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-xs">
            <div 
                className="border rounded-xl shadow-lg w-full max-w-sm p-6 animate-in zoom-in-95 duration-100"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.mainBorder }}
            >
                <h2 className="text-lg font-bold mb-2 text-red-600 dark:text-red-500 flex items-center gap-2">
                    {confirmModal.type === "join_channel" ? (
                        <Users className="size-5 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                        <Trash2 className="size-5 text-red-600" />
                    )}
                    {confirmModal.type === "join_channel" ? "Join Public Channel" : "Danger Action"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                    {confirmModal.type === "delete_channel" 
                        ? `Are you sure you want to delete the channel "#${confirmModal.targetName}"? This will permanently delete the channel and all its messages. This cannot be undone.` 
                        : confirmModal.type === "clear_dm" 
                        ? `Are you sure you want to clear chat history with "${confirmModal.targetName}"? All direct messages will be deleted forever.`
                        : `Would you like to join the public channel "#${confirmModal.targetName}"? You will be added to the channel members list.`}
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setConfirmModal({ isOpen: false, type: "", targetId: "", targetName: "" })}
                        className="rounded border px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        style={{ color: colors.mainText, borderColor: colors.mainBorder }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={
                            confirmModal.type === "delete_channel" 
                                ? handleDeleteChannel 
                                : confirmModal.type === "clear_dm" 
                                ? handleClearDMs 
                                : () => handleJoinChannelById(confirmModal.targetId)
                        }
                        className="rounded px-4 py-2 text-xs text-white transition cursor-pointer font-medium"
                        style={{ backgroundColor: confirmModal.type === "join_channel" ? colors.activePill : "#DC2626" }}
                    >
                        {confirmModal.type === "join_channel" ? "Join Channel" : confirmModal.type === "delete_channel" ? "Delete Channel" : "Clear Chat"}
                    </button>
                </div>
            </div>
        </div>
    );
}
