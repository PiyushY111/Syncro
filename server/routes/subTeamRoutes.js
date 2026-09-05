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
import { validate } from '../middlewares/validate.js';
import { 
    validateCreateSubTeam, 
    validateUpdateSubTeam, 
    validateAddSubTeamMember 
} from '../validators/subTeamValidators.js';

const subTeamRouter = express.Router();

subTeamRouter.use(protect);

subTeamRouter.post('/', validate(validateCreateSubTeam), createSubTeam);
subTeamRouter.get('/workspace/:workspaceId', getWorkspaceSubTeams);
subTeamRouter.put('/:id', validate(validateUpdateSubTeam), updateSubTeam);
subTeamRouter.delete('/:id', deleteSubTeam);
subTeamRouter.post('/:id/members', validate(validateAddSubTeamMember), addSubTeamMember);
subTeamRouter.delete('/:id/members/:userId', removeSubTeamMember);

export default subTeamRouter;
