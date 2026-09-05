import React from 'react';
import { format } from 'date-fns';
import { 
    X, 
    Calendar, 
    Video, 
    MapPin, 
    Users, 
    Trash2, 
    Clock, 
    Check, 
    HelpCircle, 
    ChevronRight, 
    AlertCircle 
} from 'lucide-react';

export default function EventDetailModal({
    selectedEvent,
    onClose,
    currentUser,
    currentUserRsvp,
    onUpdateRsvp,
    onDeleteMeeting
}) {
    if (!selectedEvent) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${selectedEvent.type === 'meeting' ? 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'}`}>
                            {selectedEvent.type === 'meeting' ? <Video className="size-5" /> : <Calendar className="size-5" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                                {selectedEvent.title}
                            </h3>
                            <p className="text-xs text-zinc-500 font-medium">
                                {selectedEvent.type === 'meeting' ? 'Workspace Team Meeting' : 'Synced Google Calendar Event'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Details Grid */}
                <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
                    {/* Date/Time */}
                    <div className="flex items-center gap-3">
                        <Clock className="size-4 text-zinc-400 shrink-0" />
                        <div>
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {selectedEvent.date && !isNaN(new Date(selectedEvent.date).getTime())
                                    ? format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')
                                    : 'Scheduled Event'}
                            </p>
                            {selectedEvent.originalItem?.start_time && !isNaN(new Date(selectedEvent.originalItem.start_time).getTime()) && (
                                <p className="text-xs text-zinc-500">
                                    {format(new Date(selectedEvent.originalItem.start_time), 'hh:mm a')}
                                    {selectedEvent.originalItem.end_time && !isNaN(new Date(selectedEvent.originalItem.end_time).getTime()) && ` - ${format(new Date(selectedEvent.originalItem.end_time), 'hh:mm a')}`}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Location / Meeting link */}
                    {(selectedEvent.originalItem?.location || selectedEvent.originalItem?.meetingLink) && (
                        <div className="flex items-start gap-3">
                            <MapPin className="size-4 text-zinc-400 shrink-0 mt-0.5" />
                            <div>
                                {selectedEvent.originalItem.location && (
                                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                                        {selectedEvent.originalItem.location}
                                    </p>
                                )}
                                {selectedEvent.originalItem.meetingLink && (
                                    <a
                                        href={selectedEvent.originalItem.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 mt-0.5"
                                    >
                                        Join Meeting Link
                                        <ChevronRight className="size-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Agenda */}
                    {selectedEvent.originalItem?.agenda && (
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                Meeting Agenda
                            </h4>
                            <p className="text-xs leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                                {selectedEvent.originalItem.agenda}
                            </p>
                        </div>
                    )}

                    {/* Description */}
                    {selectedEvent.description && (
                        <div>
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                Description
                            </h4>
                            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                {selectedEvent.description}
                            </p>
                        </div>
                    )}

                    {/* Guests List (for Meetings) */}
                    {selectedEvent.type === 'meeting' && (
                        <div className="border-t border-zinc-150 dark:border-zinc-800/80 pt-4">
                            <div className="flex items-center gap-1 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                                <Users className="size-3.5" />
                                Guests RSVP list ({selectedEvent.originalItem.invites?.length || 0})
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                                {selectedEvent.originalItem.invites?.map((inv) => {
                                    const invitee = inv.user;
                                    let statusColor = "text-zinc-500 bg-zinc-100 dark:bg-zinc-800";

                                    if (inv.status === 'ACCEPTED') {
                                        statusColor = "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20";
                                    } else if (inv.status === 'DECLINED') {
                                        statusColor = "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/20";
                                    } else if (inv.status === 'TENTATIVE') {
                                        statusColor = "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20";
                                    }

                                    return (
                                        <div key={inv.id} className="flex items-center justify-between p-1.5 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <img
                                                    src={invitee?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${invitee?.name || 'User'}`}
                                                    alt={invitee?.name}
                                                    className="size-6 rounded-full border border-zinc-200"
                                                />
                                                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                                    {invitee?.name}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${statusColor}`}>
                                                {inv.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Action - RSVP Options for current user */}
                            <div className="mt-5 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                        Your RSVP Status
                                    </p>
                                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                                        Currently: <span className="font-bold text-blue-600 dark:text-blue-400">{currentUserRsvp}</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => onUpdateRsvp(selectedEvent.id, 'ACCEPTED')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                                            currentUserRsvp === 'ACCEPTED'
                                                ? 'bg-emerald-600 text-white shadow-2xs'
                                                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                        }`}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => onUpdateRsvp(selectedEvent.id, 'TENTATIVE')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                                            currentUserRsvp === 'TENTATIVE'
                                                ? 'bg-amber-600 text-white shadow-2xs'
                                                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                        }`}
                                    >
                                        Maybe
                                    </button>
                                    <button
                                        onClick={() => onUpdateRsvp(selectedEvent.id, 'DECLINED')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                                            currentUserRsvp === 'DECLINED'
                                                ? 'bg-red-600 text-white shadow-2xs'
                                                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                        }`}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Cancel buttons */}
                <div className="flex items-center justify-between border-t border-zinc-150 dark:border-zinc-850/80 pt-4 mt-6">
                    {selectedEvent.type === 'meeting' && selectedEvent.originalItem?.creatorId === currentUser?.id ? (
                        <button
                            onClick={() => onDeleteMeeting(selectedEvent.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-lg transition cursor-pointer"
                        >
                            <Trash2 className="size-4" />
                            Cancel Meeting
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold rounded-lg border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
