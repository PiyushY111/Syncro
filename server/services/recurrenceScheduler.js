import { prisma } from '../config/prisma.js';

export const startRecurrenceScheduler = () => {
    console.log("[Scheduler] Recurring task scheduler active (running checks every 1 minute).");
    setInterval(async () => {
        try {
            const now = new Date();
            const recurringTasks = await prisma.task.findMany({
                where: {
                    isRecurring: true,
                    recurrence: { in: ["DAILY", "WEEKLY", "MONTHLY"] }
                }
            });

            for (const task of recurringTasks) {
                const referenceDate = task.lastRecurredAt || task.createdAt;
                const diffTime = now.getTime() - new Date(referenceDate).getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                let shouldRecur = false;
                if (task.recurrence === "DAILY" && diffDays >= 1) {
                    shouldRecur = true;
                } else if (task.recurrence === "WEEKLY" && diffDays >= 7) {
                    shouldRecur = true;
                } else if (task.recurrence === "MONTHLY" && diffDays >= 30) {
                    shouldRecur = true;
                }

                if (shouldRecur) {
                    // Create new cloned task
                    await prisma.task.create({
                        data: {
                            title: `${task.title} (Recurring)`,
                            description: task.description,
                            type: task.type,
                            status: "TODO",
                            priority: task.priority,
                            project: { connect: { id: task.projectId } },
                            assignee: task.assigneeId ? { connect: { id: task.assigneeId } } : undefined,
                            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000 * (task.recurrence === "DAILY" ? 1 : task.recurrence === "WEEKLY" ? 7 : 30)),
                            isRecurring: false,
                            recurrence: "NONE"
                        }
                    });

                    // Update parent lastRecurredAt
                    await prisma.task.update({
                        where: { id: task.id },
                        data: { lastRecurredAt: now }
                    });

                    console.log(`[Scheduler] Cloned task "${task.title}" successfully.`);
                }
            }
        } catch (error) {
            console.error("[Scheduler] Error running recurrence job:", error);
        }
    }, 60000); // 60 seconds
};
