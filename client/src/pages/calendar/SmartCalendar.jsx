import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, isBefore, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import api from '@/configs/api';
import toast from 'react-hot-toast';

// Subcomponents
import SmartCalendarToolbar from '@/components/calendar/SmartCalendarToolbar';
import SmartCalendarFilters from '@/components/calendar/SmartCalendarFilters';
import { MonthView, WeekView, DayView, AgendaView } from '@/components/calendar/SmartCalendarViews';
import ScheduleMeetingDialog from '@/components/calendar/ScheduleMeetingDialog';
import GoogleSyncDialog from '@/components/calendar/GoogleSyncDialog';
import CreateTaskDialog from '@/components/task/CreateTaskDialog';

// Lucide icons
import { X, Calendar, Video, MapPin, Users, Trash2, Clock, Check, HelpCircle, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';

export default function SmartCalendar() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);

    // Navigation & View States
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarView, setCalendarView] = useState("month");

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProject, setSelectedProject] = useState("ALL");
    const [showTasks, setShowTasks] = useState(true);
    const [showMeetings, setShowMeetings] = useState(true);
    const [showGCal, setShowGCal] = useState(true);

    // Dialog States
    const [showScheduleMeeting, setShowScheduleMeeting] = useState(false);
    const [showGoogleSync, setShowGoogleSync] = useState(false);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [initialDueDate, setInitialDueDate] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null); // Displays details of clicked event

    // Meetings Data
    const [meetings, setMeetings] = useState([]);
    const [loadingMeetings, setLoadingMeetings] = useState(false);

    // Simulated Google Calendar Events state
    const [gcalEvents, setGcalEvents] = useState([]);
    const [isSyncingGcal, setIsSyncingGcal] = useState(false);

    const today = useMemo(() => new Date(), []);
    const workspaceId = currentWorkspace?.id;
    const projects = currentWorkspace?.projects || [];

    // Fetch workspace meetings
    const fetchMeetings = async () => {
        if (!workspaceId) return;
        setLoadingMeetings(true);
        try {
            const { data } = await api.get(`/api/meetings?workspaceId=${workspaceId}`);
            setMeetings(data.meetings || []);
        } catch (error) {
            console.error('Error fetching meetings:', error);
            toast.error('Failed to load meetings');
        } finally {
            setLoadingMeetings(false);
        }
    };

    // Handle OAuth Callback redirect query parameter
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('sync') === 'success') {
            toast.success('Successfully connected with Google Calendar!');
            navigate('/calendar', { replace: true });
        } else if (searchParams.get('sync') === 'error') {
            toast.error('Google Calendar authorization failed.');
            navigate('/calendar', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        fetchMeetings();
    }, [workspaceId]);

    // Google Calendar Events fetcher (fetches real GCal events if connected, with fallback)
    useEffect(() => {
        const fetchRealGcal = async () => {
            if (user?.googleCalendarSync) {
                setIsSyncingGcal(true);
                try {
                    const { data } = await api.get('/api/google-calendar/events');
                    if (data.events && data.events.length > 0) {
                        setGcalEvents(data.events);
                    } else {
                        // Fallback mock events for preview
                        const baseDate = new Date();
                        setGcalEvents([
                            {
                                id: 'gcal-1',
                                title: 'Sprint Kickoff (Google Calendar)',
                                description: 'Google Calendar synced event: Align on deliverables.',
                                date: addDays(baseDate, 1),
                                start_time: new Date(addDays(baseDate, 1).setHours(10, 0, 0, 0)).toISOString(),
                                end_time: new Date(addDays(baseDate, 1).setHours(11, 0, 0, 0)).toISOString(),
                                location: 'Google Meet',
                                type: 'gcal'
                            }
                        ]);
                    }
                } catch (err) {
                    console.error('Error fetching real Google events:', err);
                } finally {
                    setIsSyncingGcal(false);
                }
            } else {
                setGcalEvents([]);
            }
        };

        fetchRealGcal();
    }, [user?.googleCalendarSync]);

    // Format all events into a unified structure
    const allEvents = useMemo(() => {
        const list = [];

        // 1. Process Tasks
        projects.forEach((proj) => {
            const projTasks = proj.tasks || [];
            projTasks.forEach((t) => {
                list.push({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    type: 'task',
                    date: new Date(t.due_date),
                    status: t.status,
                    projectId: proj.id,
                    projectName: proj.name,
                    originalItem: t
                });
            });
        });

        // 2. Process Meetings
        meetings.forEach((meet) => {
            list.push({
                id: meet.id,
                title: meet.title,
                description: meet.description,
                type: 'meeting',
                date: new Date(meet.start_time),
                projectId: meet.projectId || null,
                originalItem: meet
            });
        });

        // 3. Process GCal Events
        gcalEvents.forEach((gc) => {
            list.push({
                id: gc.id,
                title: gc.title,
                description: gc.description,
                type: 'gcal',
                date: new Date(gc.date),
                originalItem: gc
            });
        });

        return list;
    }, [projects, meetings, gcalEvents]);

    // Apply filters
    const filteredEvents = useMemo(() => {
        return allEvents.filter((evt) => {
            // Search Query Filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const titleMatch = evt.title?.toLowerCase().includes(query);
                const descMatch = evt.description?.toLowerCase().includes(query);
                if (!titleMatch && !descMatch) return false;
            }

            // Project Filter
            if (selectedProject !== "ALL" && evt.projectId !== selectedProject) {
                return false;
            }

            // Type Checkboxes Filter
            if (evt.type === 'task' && !showTasks) return false;
            if (evt.type === 'meeting' && !showMeetings) return false;
            if (evt.type === 'gcal' && !showGCal) return false;

            return true;
        });
    }, [allEvents, searchQuery, selectedProject, showTasks, showMeetings, showGCal]);

    // Pagination controls
    const handlePrev = () => {
        setCurrentMonth((prev) => {
            if (calendarView === "week") return subWeeks(prev, 1);
            if (calendarView === "day") return subDays(prev, 1);
            return subMonths(prev, 1);
        });
        setSelectedDate((prev) => {
            if (calendarView === "week") return subWeeks(prev, 1);
            if (calendarView === "day") return subDays(prev, 1);
            return subMonths(prev, 1);
        });
    };

    const handleNext = () => {
        setCurrentMonth((prev) => {
            if (calendarView === "week") return addWeeks(prev, 1);
            if (calendarView === "day") return addDays(prev, 1);
            return addMonths(prev, 1);
        });
        setSelectedDate((prev) => {
            if (calendarView === "week") return addWeeks(prev, 1);
            if (calendarView === "day") return addDays(prev, 1);
            return addMonths(prev, 1);
        });
    };

    const handleToday = () => {
        setCurrentMonth(new Date());
        setSelectedDate(new Date());
    };

    // Quick Task Adding
    const handleAddTaskForDate = (dateStr) => {
        setInitialDueDate(dateStr);
        setShowCreateTask(true);
    };

    // Meeting updates callback
    const handleMeetingScheduled = (newMeeting) => {
        setMeetings((prev) => [...prev, newMeeting]);
    };

    // RSVP Action handler
    const handleUpdateRsvp = async (meetingId, status) => {
        try {
            const { data } = await api.patch(`/api/meetings/${meetingId}/rsvp`, { status });
            toast.success(`RSVP updated: ${status.toLowerCase()}`);
            
            // Update meetings state
            setMeetings((prev) =>
                prev.map((m) => {
                    if (m.id !== meetingId) return m;
                    const updatedInvites = m.invites.map((inv) =>
                        inv.userId === user.id ? { ...inv, status } : inv
                    );
                    return { ...m, invites: updatedInvites };
                })
            );

            // Update details modal state if open
            if (selectedEvent && selectedEvent.id === meetingId) {
                setSelectedEvent((prev) => {
                    const updatedInvites = prev.originalItem.invites.map((inv) =>
                        inv.userId === user.id ? { ...inv, status } : inv
                    );
                    return {
                        ...prev,
                        originalItem: {
                            ...prev.originalItem,
                            invites: updatedInvites
                        }
                    };
                });
            }
        } catch (error) {
            console.error('Error updating RSVP:', error);
            toast.error(error.response?.data?.message || 'Failed to update RSVP');
        }
    };

    // Delete Meeting handler
    const handleDeleteMeeting = async (meetingId) => {
        if (!window.confirm('Are you sure you want to cancel and delete this meeting?')) return;
        try {
            await api.delete(`/api/meetings/${meetingId}`);
            toast.success('Meeting cancelled successfully');
            
            setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
            setSelectedEvent(null);
        } catch (error) {
            console.error('Error deleting meeting:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel meeting');
        }
    };

    // Event details modal toggle
    const handleEventClick = (evt) => {
        if (evt.type === 'task') {
            // Navigate directly to task details page
            navigate(`/taskDetails?projectId=${evt.projectId}&taskId=${evt.id}`);
        } else {
            // Open modal for meetings or google events
            setSelectedEvent(evt);
        }
    };

    // Default project for adding tasks
    const defaultProjectId = useMemo(() => {
        if (selectedProject !== "ALL") return selectedProject;
        return projects[0]?.id || "";
    }, [selectedProject, projects]);

    // Current user's RSVP status for the selected meeting details modal
    const currentUserRsvp = useMemo(() => {
        if (!selectedEvent || selectedEvent.type !== 'meeting') return null;
        const invite = selectedEvent.originalItem.invites?.find(
            (inv) => inv.userId === user?.id
        );
        return invite?.status || 'PENDING';
    }, [selectedEvent, user?.id]);

    return (
        <div className="space-y-6 text-left">
            {/* Header Toolbar */}
            <SmartCalendarToolbar
                currentMonth={currentMonth}
                calendarView={calendarView}
                setCalendarView={setCalendarView}
                handlePrev={handlePrev}
                handleNext={handleNext}
                handleToday={handleToday}
                onAddMeeting={() => setShowScheduleMeeting(true)}
                onAddTask={() => {
                    if (!projects.length) {
                        toast.error('Please create a project first before creating tasks');
                        return;
                    }
                    setInitialDueDate("");
                    setShowCreateTask(true);
                }}
                onOpenGoogleSync={() => setShowGoogleSync(true)}
                googleSyncEnabled={user?.googleCalendarSync || false}
                googleSyncEmail={user?.googleCalendarEmail || ''}
                isSyncing={isSyncingGcal}
            />

            {/* Filter Bar */}
            <SmartCalendarFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                projects={projects}
                showTasks={showTasks}
                setShowTasks={setShowTasks}
                showMeetings={showMeetings}
                setShowMeetings={setShowMeetings}
                showGCal={showGCal}
                setShowGCal={setShowGCal}
            />

            {/* Calendar Core Views */}
            {calendarView === "agenda" ? (
                <AgendaView
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                    today={today}
                />
            ) : calendarView === "week" ? (
                <WeekView
                    currentMonth={currentMonth}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    events={filteredEvents}
                    today={today}
                    onEventClick={handleEventClick}
                    onAddTaskForDate={handleAddTaskForDate}
                />
            ) : calendarView === "day" ? (
                <DayView
                    selectedDate={selectedDate}
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                    onAddTaskForDate={handleAddTaskForDate}
                />
            ) : (
                <MonthView
                    currentMonth={currentMonth}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    events={filteredEvents}
                    today={today}
                    onEventClick={handleEventClick}
                    onAddTaskForDate={handleAddTaskForDate}
                />
            )}

            {/* Modals */}
            {showScheduleMeeting && (
                <ScheduleMeetingDialog
                    isOpen={showScheduleMeeting}
                    onClose={() => setShowScheduleMeeting(false)}
                    workspace={currentWorkspace}
                    onMeetingScheduled={handleMeetingScheduled}
                    initialDate={selectedDate}
                />
            )}

            {showGoogleSync && (
                <GoogleSyncDialog
                    isOpen={showGoogleSync}
                    onClose={() => setShowGoogleSync(false)}
                />
            )}

            {showCreateTask && (
                <CreateTaskDialog
                    showCreateTask={showCreateTask}
                    setShowCreateTask={setShowCreateTask}
                    projectId={defaultProjectId}
                    initialDueDate={initialDueDate}
                />
            )}

            {/* Detailed Event Viewer Modal (Meetings / GCal) */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="absolute right-4 top-4 p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        >
                            <X className="size-5" />
                        </button>

                        {/* Title and details */}
                        <div className="flex items-start gap-3 mb-4">
                            <div className={`p-2 rounded-lg mt-1 shrink-0 ${
                                selectedEvent.type === 'meeting'
                                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                            }`}>
                                {selectedEvent.type === 'meeting' ? <Video className="size-5" /> : <Sparkles className="size-5" />}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white truncate">
                                    {selectedEvent.title}
                                </h2>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {selectedEvent.type === 'meeting' ? 'Workspace Team Meeting' : 'Synced Google Calendar Event'}
                                </p>
                            </div>
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
                            {(selectedEvent.originalItem.location || selectedEvent.originalItem.meetingLink) && (
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
                            {selectedEvent.originalItem.agenda && (
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
                                            let statusIcon = HelpCircle;

                                            if (inv.status === 'ACCEPTED') {
                                                statusColor = "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20";
                                                statusIcon = Check;
                                            } else if (inv.status === 'DECLINED') {
                                                statusColor = "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/20";
                                                statusIcon = AlertCircle;
                                            } else if (inv.status === 'TENTATIVE') {
                                                statusColor = "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20";
                                                statusIcon = Clock;
                                            }

                                            return (
                                                <div key={inv.id} className="flex items-center justify-between p-1.5 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <img
                                                            src={invitee.image || `https://api.dicebear.com/7.x/initials/svg?seed=${invitee.name}`}
                                                            alt={invitee.name}
                                                            className="size-6 rounded-full border border-zinc-200"
                                                        />
                                                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                                            {invitee.name}
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
                                                onClick={() => handleUpdateRsvp(selectedEvent.id, 'ACCEPTED')}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                                                    currentUserRsvp === 'ACCEPTED'
                                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                                }`}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleUpdateRsvp(selectedEvent.id, 'TENTATIVE')}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                                                    currentUserRsvp === 'TENTATIVE'
                                                        ? 'bg-amber-600 text-white shadow-2xs'
                                                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                                }`}
                                            >
                                                Maybe
                                            </button>
                                            <button
                                                onClick={() => handleUpdateRsvp(selectedEvent.id, 'DECLINED')}
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
                            {selectedEvent.type === 'meeting' && selectedEvent.originalItem.creatorId === user?.id ? (
                                <button
                                    onClick={() => handleDeleteMeeting(selectedEvent.id)}
                                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-lg transition cursor-pointer"
                                >
                                    <Trash2 className="size-4" />
                                    Cancel Meeting
                                </button>
                            ) : (
                                <div></div>
                            )}

                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 text-xs font-bold rounded-lg border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
