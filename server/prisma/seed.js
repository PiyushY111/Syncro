/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Enterprise Database Seeding...');

  // 1. Password Hashing
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 2. Create Users
  console.log('👤 Seeding Enterprise Users...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@syncro.io' },
    update: { passwordHash },
    create: {
      name: 'Alex Mercer (Admin)',
      email: 'admin@syncro.io',
      passwordHash,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const leadUser = await prisma.user.upsert({
    where: { email: 'lead@syncro.io' },
    update: { passwordHash },
    create: {
      name: 'Sarah Chen (Tech Lead)',
      email: 'lead@syncro.io',
      passwordHash,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const devUser = await prisma.user.upsert({
    where: { email: 'dev@syncro.io' },
    update: { passwordHash },
    create: {
      name: 'David Kim (Senior Engineer)',
      email: 'dev@syncro.io',
      passwordHash,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  console.log(`✅ Users created: ${adminUser.email}, ${leadUser.email}, ${devUser.email}`);

  // 3. Create Enterprise Workspace
  console.log('🏢 Seeding Main Workspace...');
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'syncro-enterprise' },
    update: {},
    create: {
      name: 'Syncro Enterprise Systems',
      slug: 'syncro-enterprise',
      description: 'Primary engineering and product development workspace.',
      ownerId: adminUser.id,
      settings: {
        allowGuestAccess: false,
        require2FA: true,
        defaultTheme: 'dark',
      },
    },
  });

  // 4. Create Workspace Memberships
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: adminUser.id, workspaceId: workspace.id } },
    update: { role: 'OWNER' },
    create: { userId: adminUser.id, workspaceId: workspace.id, role: 'OWNER' },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: leadUser.id, workspaceId: workspace.id } },
    update: { role: 'ADMIN' },
    create: { userId: leadUser.id, workspaceId: workspace.id, role: 'ADMIN' },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: devUser.id, workspaceId: workspace.id } },
    update: { role: 'MEMBER' },
    create: { userId: devUser.id, workspaceId: workspace.id, role: 'MEMBER' },
  });

  // 5. Create Core Project
  console.log('📁 Seeding Enterprise Project...');
  let project = await prisma.project.findFirst({
    where: { workspaceId: workspace.id, name: 'Syncro Engine Core' },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Syncro Engine Core',
        description: 'Next-generation project management backend infrastructure.',
        priority: 'HIGH',
        status: 'ACTIVE',
        team_lead: leadUser.id,
        workspaceId: workspace.id,
        stages: 'BACKLOG,TODO,IN_PROGRESS,REVIEW,DONE',
      },
    });
  }

  // 6. Project Members
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: leadUser.id, projectId: project.id } },
    update: {},
    create: { userId: leadUser.id, projectId: project.id },
  });

  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: devUser.id, projectId: project.id } },
    update: {},
    create: { userId: devUser.id, projectId: project.id },
  });

  // 7. Seed Stages
  console.log('🎯 Seeding Project Stages & Milestones...');
  const stageNames = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Completed'];
  const stages = [];
  for (let i = 0; i < stageNames.length; i++) {
    const sName = stageNames[i];
    const stage = await prisma.stage.upsert({
      where: { projectId_name: { projectId: project.id, name: sName } },
      update: { order: i },
      create: { projectId: project.id, name: sName, order: i },
    });
    stages.push(stage);
  }

  // 8. Epics & Sprints
  console.log('⚡ Seeding Epics and Sprints...');
  let epic = await prisma.epic.findFirst({ where: { projectId: project.id } });
  if (!epic) {
    epic = await prisma.epic.create({
      data: {
        name: 'Database & Infrastructure Hardening',
        description: 'Composite indexing, connection pooling, and L2 caching resilience.',
        color: '#6366F1',
        projectId: project.id,
      },
    });
  }

  let sprint = await prisma.sprint.findFirst({ where: { projectId: project.id } });
  if (!sprint) {
    sprint = await prisma.sprint.create({
      data: {
        name: 'Sprint 1 - Core Platform Optimization',
        goal: 'Upgrade DB architecture, indexing, telemetry, and soft-delete engine.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        projectId: project.id,
      },
    });
  }

  // 9. Seed High-Priority Tasks
  console.log('📌 Seeding Enterprise Tasks...');
  const sampleTasks = [
    {
      title: 'Implement Database Composite Indexes',
      description: 'Add composite indexes for Task, Message, and AuditLog tables.',
      type: 'FEATURE',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assigneeId: devUser.id,
      stageId: stages[2].id,
      storyPoints: 5,
    },
    {
      title: 'Setup Prisma Client Extensions & Soft Delete Interceptor',
      description: 'Configure transparent soft-delete filtering and query latency tracing.',
      type: 'TASK',
      priority: 'HIGH',
      status: 'DONE',
      assigneeId: leadUser.id,
      stageId: stages[4].id,
      storyPoints: 8,
    },
    {
      title: 'Database Connection Pool Diagnostics & Health Probes',
      description: 'Implement low-overhead SELECT 1 latency probe on /health/db.',
      type: 'IMPROVEMENT',
      priority: 'MEDIUM',
      status: 'TODO',
      assigneeId: devUser.id,
      stageId: stages[1].id,
      storyPoints: 3,
    },
  ];

  for (const t of sampleTasks) {
    const existingTask = await prisma.task.findFirst({
      where: { projectId: project.id, title: t.title },
    });

    if (!existingTask) {
      await prisma.task.create({
        data: {
          ...t,
          projectId: project.id,
          sprintId: sprint.id,
          epicId: epic.id,
        },
      });
    }
  }

  // 10. Seed Communication Channels & Initial Audit Event
  console.log('💬 Seeding Channels & Initial Audit Logs...');
  let channel = await prisma.channel.findFirst({
    where: { workspaceId: workspace.id, name: 'general' },
  });

  if (!channel) {
    channel = await prisma.channel.create({
      data: {
        name: 'general',
        description: 'Company-wide announcements and engineering discussions.',
        workspaceId: workspace.id,
        creatorId: adminUser.id,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: adminUser.id,
      action: 'CREATE',
      severity: 'INFO',
      entityType: 'WORKSPACE',
      entityId: workspace.id,
      entityName: workspace.name,
      details: { message: 'Database enterprise seeding completed successfully.' },
    },
  });

  console.log('🎉 Enterprise Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
