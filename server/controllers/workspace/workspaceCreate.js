import { prisma } from '../../config/prisma.js';
import { createWorkspaceSlug } from './workspaceHelpers.js';

export const createWorkspace = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description = '', image_url = '' } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Workspace name is required' });
        }

        const workspace = await prisma.workspace.create({
            data: {
                name: name.trim(),
                slug: createWorkspaceSlug(name),
                description: description.trim() || null,
                ownerId: userId,
                image_url: image_url.trim(),
                members: {
                    create: {
                        userId,
                        role: 'OWNER',
                    },
                },
            },
            include: {
                owner: true,
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
                        members: { include: { user: true } },
                        sprints: {
                            include: {
                                capacities: { include: { user: true } }
                            }
                        },
                        epics: true
                    },
                },
            },
        });

        return res.status(201).json({ workspace, message: 'Workspace created successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

export const getUserWorkspaces = async (req, res) => {
    try {
        const userId = req.user.id;
        const workspaceMemberships = await prisma.workspaceMember.findMany({
            where: {
                userId: userId,
            },
            include: {
                workspace: {
                    include: {
                        members: { include: { user: true } },
                        projects: {
                            include: {
                                tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
                                members: { include: { user: true } },
                                sprints: {
                                    include: {
                                        capacities: { include: { user: true } }
                                    }
                                },
                                epics: true
                            }
                        },
                        owner: true,
                    }
                }
            }
        });

        const workspaces = [];
        for (const membership of workspaceMemberships) {
            const workspace = membership.workspace;
            const userRole = membership.role;
            const isManagerOrOwner = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole) || workspace.ownerId === userId;

            if (!isManagerOrOwner) {
                const userSubTeams = await prisma.subTeam.findMany({
                    where: {
                        workspaceId: workspace.id,
                        members: { some: { userId } }
                    },
                    select: { projectId: true }
                });
                const allowedProjectIds = userSubTeams.map(s => s.projectId).filter(Boolean);

                workspace.projects = workspace.projects.filter(project => {
                    const isLead = project.team_lead === userId;
                    const isDirectMember = project.members.some(m => m.userId === userId);
                    const isSubTeamMember = allowedProjectIds.includes(project.id);
                    return isLead || isDirectMember || isSubTeamMember;
                });
            }
            workspaces.push(workspace);
        }
        return res.json({ workspaces });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
