import { useState } from 'react';
import { Download, Trash2, LogOut, Edit2, Volume2 } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import ChannelIcon from '../ChannelIcon';

export default function ChannelInfoTab({ channel, onChannelUpdated, onChannelDeleted, onClose, canManage = true, currentUser }) {
    const [name, setName] = useState(channel?.name || '');
    const [description, setDescription] = useState(channel?.description || '');
    const [iconUrl, setIconUrl] = useState(channel?.iconUrl || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const handleExport = async () => {
        try {
            const response = await api.get(`/api/chat/channels/${channel.id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${channel.name}-chat-export.txt`);
            document.body.appendChild(link);
            link.click();
            toast.success("Chat exported successfully!");
        } catch { toast.error("Failed to export chat"); }
    };

    const handleClearChat = async () => {
        if (!window.confirm("Clear all message history in this channel?")) return;
        try {
            await api.delete(`/api/chat/channels/${channel.id}/clear`);
            toast.success("Channel chat history cleared");
            if (onChannelUpdated) onChannelUpdated({ ...channel, messages: [] });
        } catch { toast.error("Failed to clear chat"); }
    };

    const handleSaveInfo = async () => {
        try {
            const { data } = await api.patch(`/api/chat/channels/${channel.id}`, { name, description, iconUrl });
            toast.success("Channel updated!");
            if (onChannelUpdated) onChannelUpdated(data.channel);
            setIsEditing(false);
        } catch { toast.error("Failed to update channel"); }
    };

    const handleDeleteChannel = async () => {
        if (!window.confirm("Are you sure you want to delete this channel permanently? This will delete all messages and cannot be undone.")) return;
        try {
            await api.delete(`/api/chat/channels/${channel.id}`);
            toast.success("Channel deleted successfully");
            if (onChannelDeleted) onChannelDeleted(channel.id);
            if (onClose) onClose();
        } catch {
            toast.error("Failed to delete channel");
        }
    };

    return (
        <div className="space-y-5 text-sm">
            {/* Channel profile */}
            <div className="text-center pb-4 border-b border-zinc-100">
                <ChannelIcon channel={channel} size="lg" className="mx-auto mb-3" />
                <h3 className="font-bold text-lg text-zinc-900">#{channel.name}</h3>
                <p className="text-zinc-400 text-xs mt-1">{channel.members?.length || 1} members • Public Channel</p>

                <div className="flex items-center justify-center gap-3 mt-4">
                    <button onClick={() => setIsMuted(!isMuted)} className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-xs font-medium transition cursor-pointer">
                        <Volume2 className="size-4" />
                        {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <button onClick={handleExport} className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-xs font-medium transition cursor-pointer">
                        <Download className="size-4 text-blue-500" />
                        Export
                    </button>
                </div>
            </div>

            {/* About section */}
            {isEditing ? (
                <div className="space-y-3 border border-zinc-200 rounded-lg p-4">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Channel Name" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition" />
                    <input type="url" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="Channel Icon Image URL" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition" />
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-400 transition" />
                    <button onClick={handleSaveInfo} className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-sm transition cursor-pointer">Save Info</button>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-zinc-900">About Channel</span>
                        {(canManage || channel.creatorId === currentUser?.id) && (
                            <button onClick={() => setIsEditing(true)} className="text-blue-500 text-xs font-medium flex items-center gap-1 hover:text-blue-600 cursor-pointer transition">
                                <Edit2 className="size-3" /> Edit
                            </button>
                        )}
                    </div>
                    <p className="text-zinc-500 text-sm leading-relaxed">{channel.description || "No topic description provided."}</p>
                </div>
            )}

            {/* Danger actions */}
            <div className="border-t border-zinc-100 pt-4 space-y-1">
                {(canManage || channel.creatorId === currentUser?.id) && (
                    <button onClick={handleClearChat} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium transition cursor-pointer text-sm">
                        <Trash2 className="size-4 text-amber-500" />
                        Clear Chat History
                    </button>
                )}
                <button onClick={async () => { if (window.confirm("Exit group?")) { onClose(); } }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 font-medium transition cursor-pointer text-sm">
                    <LogOut className="size-4" />
                    Exit Group / Leave Channel
                </button>
                {(canManage || channel.creatorId === currentUser?.id) && (
                    <button onClick={handleDeleteChannel} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 font-medium transition cursor-pointer text-sm">
                        <Trash2 className="size-4 text-rose-500" />
                        Delete Channel permanently
                    </button>
                )}
            </div>
        </div>
    );
}
