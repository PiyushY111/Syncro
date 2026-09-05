import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getInbox = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { filter = "ALL", search = "", unreadOnly = "false" } = req.query;

    // Get user inbox cache version (or initialize if not present)
    const versionKey = `inbox:version:${userId}`;
    let version = await redisCache.get(versionKey);
    if (!version) {
        version = "1";
        await redisCache.set(versionKey, version, 86400 * 30); // 30 days version persistence
    }

    const cacheKey = `inbox:${userId}:${version}:${filter}:${search}:${unreadOnly}`;
    try {
        const cached = await redisCache.get(cacheKey);
        if (cached) return res.status(200).json(JSON.parse(cached));
    } catch {}

    const storedNotifications = await prisma.notification.findMany({
        where: {
            userId,
            isArchived: false,
            ...(unreadOnly === "true" ? { isRead: false } : {})
        },
        orderBy: { createdAt: "desc" },
        take: 50
    });

    // Dynamic Task items assigned to user
    const userTasks = await prisma.task.findMany({
        where: { assigneeId: userId, status: { not: "DONE" } },
        include: { project: { select: { id: true, name: true } } },
        take: 15
    });

    // Dynamic Meeting invites
    const userMeetings = await prisma.meetingInvite.findMany({
        where: { userId },
        include: {
            meeting: { select: { id: true, title: true, start_time: true, end_time: true, meetingLink: true } }
        },
        take: 10
    });

    const dynamicTaskNotifications = userTasks.map(task => ({
        id: `task-dyn-${task.id}`,
        userId,
        type: "TASK_ASSIGNED",
        title: `Task: ${task.title}`,
        content: `Project: ${task.project?.name || "General"} • Priority: ${task.priority}`,
        entityType: "TASK",
        entityId: task.id,
        isRead: false,
        isArchived: false,
        priority: task.priority,
        createdAt: task.createdAt
    }));

    const dynamicMeetingNotifications = userMeetings.map(inv => ({
        id: `meeting-dyn-${inv.id}`,
        userId,
        type: "MEETING_INVITE",
        title: `Meeting: ${inv.meeting.title}`,
        content: `Status: ${inv.status} • Start: ${new Date(inv.meeting.start_time).toLocaleString()}`,
        entityType: "MEETING",
        entityId: inv.meeting.id,
        isRead: inv.status !== "PENDING",
        isArchived: false,
        priority: "HIGH",
        createdAt: inv.createdAt
    }));

    const allNotifications = [...storedNotifications, ...dynamicTaskNotifications, ...dynamicMeetingNotifications];

    let filtered = allNotifications;
    if (filter !== "ALL") {
        if (filter === "TASKS") filtered = allNotifications.filter(n => n.type.startsWith("TASK"));
        else if (filter === "MESSAGES") filtered = allNotifications.filter(n => n.type === "CHAT_MESSAGE" || n.type === "COMMENT_MENTION");
        else if (filter === "MEETINGS") filtered = allNotifications.filter(n => n.type === "MEETING_INVITE");
        else if (filter === "SYSTEM") filtered = allNotifications.filter(n => n.type === "SYSTEM" || n.type === "MILESTONE_ALERT");
    }

    if (search) {
        filtered = filtered.filter(n =>
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            (n.content && n.content.toLowerCase().includes(search.toLowerCase()))
        );
    }

    const unreadCount = filtered.filter(n => !n.isRead).length;
    const responsePayload = { notifications: filtered, unreadCount };

    try {
        await redisCache.set(cacheKey, JSON.stringify(responsePayload), 10); // Cache for 10 seconds
    } catch {}

    return res.status(200).json(responsePayload);
});
