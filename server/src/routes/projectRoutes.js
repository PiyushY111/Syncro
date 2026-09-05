import express from 'express'
import { addMember, createProject, updateProject, updateProjectStages, deleteProject } from '../controllers/projectController.js';
import { checkProjectAccessMiddleware } from '../middlewares/projectAccessCheck.js';
import { validate } from '../middlewares/validate.js';
import { validateCreateProject, validateUpdateProject } from '../validators/projectValidators.js';

const projectRouter = express.Router();

projectRouter.post('/', validate(validateCreateProject), createProject);
projectRouter.put('/', checkProjectAccessMiddleware, validate(validateUpdateProject), updateProject);
projectRouter.delete('/:id', checkProjectAccessMiddleware, deleteProject);
projectRouter.put('/:id/stages', checkProjectAccessMiddleware, updateProjectStages);
projectRouter.post('/:projectId/addMember', checkProjectAccessMiddleware, addMember);

export default projectRouter;
