// Create Project

import { prisma } from "../config/prisma.js";

export const createProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId, description, name, status, start_date, end_date, team_members, team_lead, progress, priority } = req.body;

        // Validate required fields
        if (!workspaceId) {
            return res.status(400).json({ message: "workspaceId is required!" });
        }
        if (!name) {
            return res.status(400).json({ message: "name is required!" });
        }
        if (!team_lead) {
            return res.status(400).json({ message: "team_lead is required!" });
        }

        //check if user had admin role for workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } }
        })

        if (!workspace) {
            return res.status(404).json({ message: "WorkSpace not founf" });
        }
        const userMember = workspace.members.find((member) => member.userId === userId);
        const userRole = userMember?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const canCreate = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

        if (!canCreate) {
            return res.status(403).json({ message: "You do not have permission to create a project in this workspace" });
        }

        // Get team lead using email
        const teamLead = await prisma.user.findUnique({
            where: { email: team_lead },
            select: { id: true }
        })

        if (!teamLead) {
            return res.status(404).json({ message: "Team lead not found" });
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                status,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
                progress,
                priority,
                workspace: { connect: { id: workspaceId } },
                owner: { connect: { id: teamLead?.id } },
            },
        });

        // add members to project if they are in the workspace
        if (team_members && team_members.length > 0) {
            const membersToAdd = []
            workspace.members.forEach((member) => {
                if (team_members.includes(member.user.email)) {
                    membersToAdd.push(member.user.id)
                }
            })
            await prisma.projectMember.createMany({
                data: membersToAdd.map(memberId => ({
                    projectId: project.id,
                    userId: memberId
                })),
            })
        }

        const projectWithMembers = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                owner: true,
                members: { include: { user: true } },
                tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } }
            }
        })

        res.status(201).json({ message: "Project created successfully", project: projectWithMembers });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
}

//Update Project
export const updateProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id, workspaceId, description, name, status, start_date, end_date, team_members, team_lead, progress, priority } = req.body;

        if (!id) {
            return res.status(400).json({ message: "id is required!" });
        }
        if (!workspaceId) {
            return res.status(400).json({ message: "workspaceId is required!" });
        }
        if (!name) {
            return res.status(400).json({ message: "name is required!" });
        }
        if (!team_lead) {
            return res.status(400).json({ message: "team_lead is required!" });
        }

        //check if user had admin role for workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } }
        })

        if (!workspace) {
            return res.status(404).json({ message: "WorkSpace not founf" });
        }
        const userMember = workspace.members.find(m => m.userId === userId);
        const userRole = userMember?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const hasWorkspacePermission = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

        if (!hasWorkspacePermission) {
            const project = await prisma.project.findUnique({
                where: { id }
            });
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            } else if (project.team_lead !== userId) {
                return res.status(403).json({ message: "You do not have permission to update this project" });
            }
        }
        const project = await prisma.project.update({
            where: { id },
            data: {
                workspaceId,
                name,
                description,
                status,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
                team_members,
                team_lead,
                progress,
                priority
            }
        });
        res.status(200).json({ project, message: "Project updated successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
}

// Add member to project
export const addMember = async (req, res) => {
    try {
        const userId = req.user.id;
        const { projectId } = req.params;
        const { email } = req.body;

        //check if user is project lead 
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { 
                members: { include: { user: true } },
                workspace: { include: { members: true } }
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const workspaceMembers = project.workspace.members;
        const userMember = workspaceMembers.find(m => m.userId === userId);
        const userRole = userMember?.role || (project.workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const hasWorkspacePermission = ['OWNER', 'ADMIN'].includes(userRole);

        if (project.team_lead !== userId && !hasWorkspacePermission) {
            return res.status(403).json({ message: "You do not have permission to add members to this project" });
        }

        //check if user is already a member of the project
        const existingMember = project.members.find((member) => member.user.email === email);
        if (existingMember) {
            return res.status(400).json({ message: "User is already a member of this project" });
        }
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const member = await prisma.projectMember.create({
            data: {
                userId: user.id,
                projectId,
            }
        });
        res.status(201).json({ member, message: "Member added successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const updateProjectStages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { stages } = req.body;

        if (!Array.isArray(stages) || stages.length === 0) {
            return res.status(400).json({ message: "stages must be a non-empty array of strings" });
        }

        const project = await prisma.project.findUnique({
            where: { id },
            include: { workspace: { include: { members: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const workspaceMembers = project.workspace.members;
        const userMember = workspaceMembers.find(m => m.userId === userId);
        const userRole = userMember?.role || (project.workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const hasPermission = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole) || project.team_lead === userId;

        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to configure stages for this project" });
        }

        const formattedStages = stages.map(s => s.trim()).filter(Boolean);

        // Update tasks whose status is no longer in the stages list back to TODO
        await prisma.task.updateMany({
            where: {
                projectId: id,
                NOT: {
                    status: { in: formattedStages }
                }
            },
            data: {
                status: "TODO"
            }
        });

        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                stages: formattedStages.join(","),
            },
            include: {
                owner: true,
                members: { include: { user: true } },
                tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } }
            }
        });

        return res.json({ project: updatedProject, message: "Project stages updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};