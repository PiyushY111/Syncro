import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { requireSuperAdmin } from '../middlewares/superAdminMiddleware.js';
import {
  getGatekeeperOverview,
  updateSettings,
  getPendingRequests,
  approveUser,
  rejectUser,
  approveWorkspace,
  rejectWorkspace,
  listVipCodes,
  createVipCode,
  revokeVipCode,
  listAllUsers,
  toggleSuperAdmin,
} from '../controllers/admin/gatekeeperController.js';

const adminRouter = express.Router();

// Apply authentication and Super-Admin authorization to all admin routes
adminRouter.use(protect, requireSuperAdmin);

// Settings and Overview
adminRouter.get('/overview', getGatekeeperOverview);
adminRouter.put('/settings', updateSettings);

// Pending Approval Queues
adminRouter.get('/pending', getPendingRequests);
adminRouter.post('/users/:userId/approve', approveUser);
adminRouter.post('/users/:userId/reject', rejectUser);
adminRouter.post('/workspaces/:workspaceId/approve', approveWorkspace);
adminRouter.post('/workspaces/:workspaceId/reject', rejectWorkspace);

// VIP Invite Codes
adminRouter.get('/vip-codes', listVipCodes);
adminRouter.post('/vip-codes', createVipCode);
adminRouter.delete('/vip-codes/:id', revokeVipCode);

// User Management
adminRouter.get('/users', listAllUsers);
adminRouter.put('/users/:userId/superadmin', toggleSuperAdmin);

export default adminRouter;
