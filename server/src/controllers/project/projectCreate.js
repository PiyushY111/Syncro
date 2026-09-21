import { prisma } from "../../config/prisma.js";
import { executeTransaction } from "../../services/db/dbService.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { eventBus } from "../../services/eventBus.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";
import { ApiResponse } from "../../utils/response/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import logger from "../../utils/logger/logger.js";

export const createProject = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { workspaceId, description, name, status, start_date, end_date, team_members, team_lead, progress, priority } = req.body;

  if (!workspaceId) {
    throw new BadRequestError("workspaceId is required!");
  }
  if (!name) {
    throw new BadRequestError("name is required!");
  }
  if (!team_lead) {
    throw new BadRequestError("team_lead is required!");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: { include: { user: true } } },
  });

  if (!workspace) {
    throw new NotFoundError("Workspace not found");
  }

  const canCreate = await hasWorkspacePermission(userId, workspaceId, "createProject");
  if (!canCreate) {
    throw new ForbiddenError("You do not have permission to create a project in this workspace");
  }

  const teamLead = await prisma.user.findUnique({
    where: { email: team_lead },
    select: { id: true },
  });

  if (!teamLead) {
    throw new NotFoundError("Team lead not found");
  }

  const projectWithMembers = await executeTransaction(async (tx) => {
    const createdProject = await tx.project.create({
      data: {
        name,
        description,
        status,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        progress,
        priority,
        workspace: { connect: { id: workspaceId } },
        owner: { connect: { id: teamLead.id } },
      },
    });

    if (team_members && team_members.length > 0) {
      const membersToAdd = [];
      workspace.members.forEach((member) => {
        if (team_members.includes(member.user.email)) {
          membersToAdd.push(member.user.id);
        }
      });
      if (membersToAdd.length > 0) {
        await tx.projectMember.createMany({
          data: membersToAdd.map((memberId) => ({
            projectId: createdProject.id,
            userId: memberId,
          })),
        });
      }
    }

    return await tx.project.findUnique({
      where: { id: createdProject.id },
      include: {
        owner: true,
        members: { include: { user: true } },
        tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
      },
    });
  });

  await eventBus
    .publish("app/project.created", {
      project: projectWithMembers,
      workspaceId,
      auditContext: {
        workspaceId,
        userId,
        ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      },
    })
    .catch((err) => logger.error("[createProject] Event publication error:", { error: err.message, userId, requestId: req.headers["x-request-id"] }));

  return ApiResponse.created(res, {
    data: { project: projectWithMembers },
    message: "Project created successfully",
  });
});

export default createProject;
