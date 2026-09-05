/**
 * Core Domain Contracts & Type Definitions for Syncro Server
 */

import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  jti?: string;
  isSuperAdmin?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  workspaceId?: string;
  id?: string;
}

export interface ApiResponseFormat<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: Record<string, any>;
}

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  workspaceId?: string;
  userId: string;
  payload?: any;
  prevHash?: string;
  hash?: string;
  timestamp?: Date;
}
