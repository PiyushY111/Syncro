import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
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
import EventDetailModal from '@/components/calendar/EventDetailModal';

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
    const [, setLoadingMeetings] = useState(false);

    // Simulated Google Calendar Events state
    const [gcalEvents, setGcalEvents] = useState([]);
    const [isSyncingGcal, setIsSyncingGcal] = useState(false);

    const today = useMemo(() => new Date(), []);
    const workspaceId = currentWorkspace?.id;
    const projects = useMemo(() => currentWorkspace?.projects || [], [currentWorkspace?.projects]);

    // Fetch workspace meetings
    const fetchMeetings = useCallback(async () => {
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
    }, [workspaceId]);

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
    }, [fetchMeetings]);

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
            await api.patch(`/api/meetings/${meetingId}/rsvp`, { status });
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
            <EventDetailModal
                selectedEvent={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                currentUser={user}
                currentUserRsvp={currentUserRsvp}
                onUpdateRsvp={handleUpdateRsvp}
                onDeleteMeeting={handleDeleteMeeting}
            />
        </div>
    );
}
