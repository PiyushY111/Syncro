import { useState } from 'react';
import { X, Info, Star, Users } from 'lucide-react';
import ChannelInfoTab from '../channelSettings/ChannelInfoTab';
import ChannelMembersTab from '../channelSettings/ChannelMembersTab';
import ChannelStarredTab from '../channelSettings/ChannelStarredTab';

export default function ChannelDetailsModal({ isOpen, onClose, channel, workspaceMembers = [], onChannelUpdated, onChannelDeleted, onSelectDM }) {
    const [activeTab, setActiveTab] = useState('info');

    if (!isOpen || !channel) return null;

    const tabs = [
        { key: 'info', label: 'Info', icon: Info, color: 'text-blue-500' },
        { key: 'starred', label: 'Starred', icon: Star, color: 'text-amber-500' },
        { key: 'members', label: 'Members', icon: Users, color: 'text-indigo-500' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* Slide-in panel */}
            <div className="relative w-[420px] h-full bg-white shadow-2xl flex flex-col animate-stiff-slide-right">
                {/* Panel header */}
                <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between shrink-0">
                    <h2 className="font-bold text-base text-zinc-900">Group Info</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer transition-colors">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Tab navigation */}
                <div className="px-3 py-2 border-b border-zinc-100 shrink-0 space-y-0.5">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                                activeTab === tab.key
                                    ? 'bg-zinc-100 text-zinc-900 font-semibold border-l-[3px] border-l-blue-500'
                                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 border-l-[3px] border-l-transparent'
                            }`}
                        >
                            <tab.icon className={`size-4 ${activeTab === tab.key ? tab.color : 'text-zinc-400'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto p-5">
                    {activeTab === 'info' && (
                        <ChannelInfoTab channel={channel} onChannelUpdated={onChannelUpdated} onChannelDeleted={onChannelDeleted} onClose={onClose} />
                    )}
                    {activeTab === 'starred' && (
                        <ChannelStarredTab channelId={channel.id} />
                    )}
                    {activeTab === 'members' && (
                        <ChannelMembersTab channel={channel} workspaceMembers={workspaceMembers} onChannelUpdated={onChannelUpdated} onSelectDM={onSelectDM} />
                    )}
                </div>

                {/* Bottom done button */}
                <div className="px-5 py-3 border-t border-zinc-200 shrink-0">
                    <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition cursor-pointer text-sm">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
