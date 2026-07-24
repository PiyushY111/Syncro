import { prisma } from '../config/prisma.js';

export const hasProjectAccess = async (projectId, userId) => {
    try {
        if (!projectId || !userId) return false;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                workspace: {
                    include: {
                        members: { where: { userId } }
                    }
                },
                members: { where: { userId } },
                subTeams: {
                    include: {
                        members: { where: { userId } }
                    }
                }
            }
        });

        if (!project) return false;

        // 1. Check if user is Workspace Owner
        if (project.workspace.ownerId === userId) return true;

        // 2. Check if user has Workspace Role OWNER, ADMIN, or MANAGER
        const wsMember = project.workspace.members[0];
        if (wsMember && ['OWNER', 'ADMIN', 'MANAGER'].includes(wsMember.role)) {
            return true;
        }

        // 3. Check if user is the project lead (team_lead)
        if (project.team_lead === userId) return true;

        // 4. Check if user is directly added to project members
        if (project.members.length > 0) return true;

        // 5. Check if user is part of any sub-team assigned to this project
        const inSubTeam = project.subTeams.some(subTeam => subTeam.members.length > 0);
        if (inSubTeam) return true;

        return false;
    } catch (err) {
        console.error("[PROJECT ACCESS CHECK ERROR]", err);
        return false;
    }
};

export const checkProjectAccessMiddleware = async (req, res, next) => {
    const userId = req.user.id;
    const projectId = req.params.projectId || req.params.id || req.query.projectId || req.body.projectId || req.body.id;

    if (!projectId) {
        return res.status(400).json({ message: "projectId is required for access check" });
    }

    const hasAccess = await hasProjectAccess(projectId, userId);
    if (!hasAccess) {
        return res.status(403).json({ message: "Access denied: You are not a member of this project" });
    }

    next();
};
