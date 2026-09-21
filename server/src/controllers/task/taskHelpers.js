import { prisma } from '../../config/prisma.js';
import sendEmail from '../../config/nodemailer.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors/appError.js';

export const notifyAssignee = async (task, origin = '') => {
    if (!task?.assignee?.email) return;

    const taskUrl = origin
        ? `${origin}/taskDetails?id=${task.id}`
        : `${process.env.CLIENT_URL || 'http://localhost:5173'}/taskDetails?id=${task.id}`;

    const subject = `New task assigned: ${task.title}`;
    const text = `You have been assigned a new task "${task.title}" in project "${task.project?.name || 'Unknown project'}".`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h3>You have a new task assignment</h3>
            <p>You have been assigned the task <strong>${task.title}</strong> in project <strong>${task.project?.name || 'Unknown project'}</strong>.</p>
            <p><a href="${taskUrl}" style="color:#2563eb">Open task</a></p>
        </div>
    `;

    await sendEmail(task.assignee.email, subject, text, html);
};

/**
 * Rejects an assigneeId that isn't the project's team lead, a direct project
 * member, or a member of a sub-team assigned to the project.
 */
export const assertAssigneeBelongsToProject = (project, assigneeId) => {
    if (!assigneeId) return;

    const hasAccess =
        project.team_lead === assigneeId ||
        project.members.some((m) => m.userId === assigneeId) ||
        project.subTeams.some((subTeam) => subTeam.members.some((m) => m.userId === assigneeId));

    if (!hasAccess) {
        throw new ForbiddenError("Assignee is not a member of this project");
    }
};

/**
 * Rejects sprintId/epicId/milestoneId/dependenciesIds that reference a
 * different project than the task itself. Sprint, Epic, and Milestone are
 * all single-project-scoped in the schema, and a task's dependencies must
 * live in the same project so per-project access checks stay meaningful.
 * Errors are generic ("not found") whether the id doesn't exist at all or
 * belongs to another project, so a caller can't use this to probe which
 * foreign IDs exist in other workspaces/projects.
 */
export const assertTaskForeignRefsBelongToProject = async ({
    projectId,
    sprintId,
    epicId,
    milestoneId,
    dependenciesIds,
}) => {
    if (sprintId) {
        const sprint = await prisma.sprint.findUnique({ where: { id: sprintId }, select: { projectId: true } });
        if (!sprint || sprint.projectId !== projectId) {
            throw new NotFoundError("Sprint not found");
        }
    }

    if (epicId) {
        const epic = await prisma.epic.findUnique({ where: { id: epicId }, select: { projectId: true } });
        if (!epic || epic.projectId !== projectId) {
            throw new NotFoundError("Epic not found");
        }
    }

    if (milestoneId) {
        const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId }, select: { projectId: true } });
        if (!milestone || milestone.projectId !== projectId) {
            throw new NotFoundError("Milestone not found");
        }
    }

    if (Array.isArray(dependenciesIds) && dependenciesIds.length > 0) {
        const uniqueIds = [...new Set(dependenciesIds)];
        const deps = await prisma.task.findMany({
            where: { id: { in: uniqueIds } },
            select: { id: true, projectId: true },
        });
        const validCount = deps.filter((d) => d.projectId === projectId).length;
        if (validCount !== uniqueIds.length) {
            throw new NotFoundError("One or more dependency tasks not found");
        }
    }
};

export const wouldCreateCycle = async (taskIdToLink, prerequisiteId) => {
    const visited = new Set();
    const dfs = async (currentId) => {
        if (currentId === taskIdToLink) return true;
        if (visited.has(currentId)) return false;
        visited.add(currentId);

        const task = await prisma.task.findUnique({
            where: { id: currentId },
            include: { dependencies: true }
        });

        if (!task || !task.dependencies) return false;

        for (const dep of task.dependencies) {
            if (await dfs(dep.id)) return true;
        }
        return false;
    };

    return await dfs(prerequisiteId);
};
