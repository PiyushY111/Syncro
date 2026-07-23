import express from 'express';
import { 
    addMember, 
    acceptWorkspaceInvitation, 
    createWorkspace, 
    getUserWorkspaces, 
    sendWorkspaceInvitationEmail,
    updateWorkspace,
    deleteWorkspace,
    updateMemberRole,
    removeMember
} from '../controllers/workspaceControllers.js';

const workspaceRouter = express.Router();

workspaceRouter.get('/', getUserWorkspaces);
workspaceRouter.post('/', createWorkspace);
workspaceRouter.put('/:id', updateWorkspace);
workspaceRouter.delete('/:id', deleteWorkspace);
workspaceRouter.post('/add-member', addMember);
workspaceRouter.post('/invite-email', sendWorkspaceInvitationEmail);
workspaceRouter.post('/accept-invitation', acceptWorkspaceInvitation);
workspaceRouter.put('/:id/members/:memberId', updateMemberRole);
workspaceRouter.delete('/:id/members/:memberId', removeMember);

export default workspaceRouter;