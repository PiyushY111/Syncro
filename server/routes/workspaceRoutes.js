import express from 'express';
import { 
    addMember, 
    acceptWorkspaceInvitation, 
    createWorkspace, 
    getUserWorkspaces, 
    getMyWorkspaceRequests,
    deleteMyWorkspaceRequest,
    sendWorkspaceInvitationEmail,
    updateWorkspace,
    deleteWorkspace,
    updateMemberRole,
    removeMember
} from '../controllers/workspaceController.js';
import { validate } from '../middlewares/validate.js';
import { validateCreateWorkspace, validateUpdateWorkspace } from '../validators/workspaceValidators.js';

const workspaceRouter = express.Router();

workspaceRouter.get('/', getUserWorkspaces);
workspaceRouter.get('/my-requests', getMyWorkspaceRequests);
workspaceRouter.delete('/my-requests/:id', deleteMyWorkspaceRequest);
workspaceRouter.post('/', validate(validateCreateWorkspace), createWorkspace);
workspaceRouter.put('/:id', validate(validateUpdateWorkspace), updateWorkspace);
workspaceRouter.delete('/:id', deleteWorkspace);
workspaceRouter.post('/add-member', addMember);
workspaceRouter.post('/invite-email', sendWorkspaceInvitationEmail);
workspaceRouter.post('/accept-invitation', acceptWorkspaceInvitation);
workspaceRouter.put('/:id/members/:memberId', updateMemberRole);
workspaceRouter.delete('/:id/members/:memberId', removeMember);

export default workspaceRouter;