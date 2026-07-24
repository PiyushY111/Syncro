import express from 'express';
import { 
    createSubTeam, 
    getWorkspaceSubTeams, 
    updateSubTeam, 
    deleteSubTeam, 
    addSubTeamMember, 
    removeSubTeamMember 
} from '../controllers/subTeamController.js';
import { protect } from '../middlewares/authMiddleware.js';

const subTeamRouter = express.Router();

subTeamRouter.use(protect);

subTeamRouter.post('/', createSubTeam);
subTeamRouter.get('/workspace/:workspaceId', getWorkspaceSubTeams);
subTeamRouter.put('/:id', updateSubTeam);
subTeamRouter.delete('/:id', deleteSubTeam);
subTeamRouter.post('/:id/members', addSubTeamMember);
subTeamRouter.delete('/:id/members/:userId', removeSubTeamMember);

export default subTeamRouter;
