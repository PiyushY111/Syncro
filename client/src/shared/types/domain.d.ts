/**
 * Core Domain Entities & Contract Definitions for Syncro Client
 */

export type RoleType = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  isSuperAdmin?: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: RoleType;
  customRole?: string;
  user: User;
}

export interface Workspace {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  ownerId: string;
  owner?: User;
  members: WorkspaceMember[];
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  settings?: {
    rolePermissions?: Record<string, Record<string, boolean>>;
    customPendingMessage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  team_lead: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  members?: { id: string; userId: string; user?: User }[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  workspaceId: string;
  assigneeId?: string;
  assignee?: User;
  creatorId: string;
  creator?: User;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  version: number;
  epicId?: string;
  sprintId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Epic {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  color?: string;
  status?: string;
  tasks?: Task[];
}

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  capacity?: number;
  tasks?: Task[];
}

export interface MeetingInvite {
  id: string;
  meetingId: string;
  userId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
  user?: User;
}

export interface Meeting {
  id: string;
  title: string;
  agenda?: string;
  description?: string;
  workspaceId: string;
  creatorId: string;
  creator?: User;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  meetingLink?: string;
  invites: MeetingInvite[];
}

export interface Whiteboard {
  id: string;
  name: string;
  workspaceId: string;
  creatorId: string;
  isPrivate: boolean;
  version: number;
  data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: Record<string, any>;
}
