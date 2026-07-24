import { useState, useEffect } from 'react';
import { X, Calendar, Video, MapPin, Users, Info, FileText } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function ScheduleMeetingDialog({
    isOpen,
    onClose,
    workspace,
    onMeetingScheduled,
    initialDate = null
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [agenda, setAgenda] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('10:00');
    const [endTime, setEndTime] = useState('11:00');
    const [meetingLink, setMeetingLink] = useState('');
    const [location, setLocation] = useState('');
    const [projectId, setProjectId] = useState('');
    const [selectedInvitees, setSelectedInvitees] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Set defaults when opened
            setTitle('');
            setDescription('');
            setAgenda('');
            setMeetingLink('');
            setLocation('');
            setProjectId('');
            setSelectedInvitees([]);

            const defaultDate = initialDate ? new Date(initialDate) : new Date();
            const yyyy = defaultDate.getFullYear();
            const mm = String(defaultDate.getMonth() + 1).padStart(2, '0');
            const dd = String(defaultDate.getDate()).padStart(2, '0');
            setDate(`${yyyy}-${mm}-${dd}`);
        }
    }, [isOpen, initialDate]);

    if (!isOpen) return null;

    const members = workspace?.members || [];
    const projects = workspace?.projects || [];

    const handleToggleInvitee = (userId) => {
        setSelectedInvitees((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error('Meeting title is required');
            return;
        }

        if (!date) {
            toast.error('Date is required');
            return;
        }

        const startDateTime = new Date(`${date}T${startTime}:00`);
        const endDateTime = new Date(`${date}T${endTime}:00`);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            toast.error('Please enter valid times');
            return;
        }

        if (startDateTime >= endDateTime) {
            toast.error('End time must be after start time');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                workspaceId: workspace.id,
                projectId: projectId || undefined,
                title,
                description,
                agenda,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                meetingLink,
                location,
                invitees: selectedInvitees
            };

            const { data } = await api.post('/api/meetings', payload);
            toast.success(data.message || 'Meeting scheduled successfully!');
            if (onMeetingScheduled) {
                onMeetingScheduled(data.meeting);
            }
            onClose();
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            toast.error(error.response?.data?.message || 'Failed to schedule meeting');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-md">
                            <Calendar className="size-5" />
                        </div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Schedule Team Meeting</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-left flex-1">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                            Meeting Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Weekly Design Review"
                            className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 transition"
                            required
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                                Date *
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 transition"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                                Start Time *
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 transition"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                                End Time *
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 transition"
                                required
                            />
                        </div>
                    </div>

                    {/* Project Association */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                            Associated Project (Optional)
                        </label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 transition"
                        >
                            <option value="">No Project</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Meeting Link and Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                                <Video className="size-3.5 text-zinc-400" />
                                Video Link (Optional)
                            </label>
                            <input
                                type="url"
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                placeholder="https://meet.google.com/abc-defg-hij"
                                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 transition"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                                <MapPin className="size-3.5 text-zinc-400" />
                                Location (Optional)
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Conference Room B"
                                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 transition"
                            />
                        </div>
                    </div>

                    {/* Agenda & Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                                <FileText className="size-3.5 text-zinc-400" />
                                Agenda
                            </label>
                            <textarea
                                value={agenda}
                                onChange={(e) => setAgenda(e.target.value)}
                                placeholder="List points to discuss..."
                                rows={3}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 transition resize-none"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                                <Info className="size-3.5 text-zinc-400" />
                                Description / Notes
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Any pre-meeting context or notes..."
                                rows={3}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 transition resize-none"
                            />
                        </div>
                    </div>

                    {/* Invite Workspace Guests */}
                    <div>
                        <label className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                            <Users className="size-3.5 text-zinc-400" />
                            Invite Workspace Guests ({selectedInvitees.length} selected)
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 space-y-1 bg-zinc-50 dark:bg-zinc-950">
                            {members.length === 0 ? (
                                <div className="text-xs text-zinc-500 text-center py-2">No other workspace members</div>
                            ) : (
                                members.map((member) => (
                                    <div
                                        key={member.user.id}
                                        onClick={() => handleToggleInvitee(member.user.id)}
                                        className="flex items-center justify-between p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer transition select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={member.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${member.user.name}`}
                                                alt={member.user.name}
                                                className="size-6 rounded-full border border-zinc-200 dark:border-zinc-700"
                                            />
                                            <div>
                                                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{member.user.name}</p>
                                                <p className="text-[10px] text-zinc-500">{member.user.email}</p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={selectedInvitees.includes(member.user.id)}
                                            onChange={() => {}} // Controlled via parent onClick
                                            className="accent-purple-600 size-3.5 cursor-pointer rounded border-zinc-300"
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
