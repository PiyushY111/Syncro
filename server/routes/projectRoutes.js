import express from 'express'
import { addMember, createProject, updateProject, updateProjectStages, deleteProject } from '../controllers/projectController.js';
import { checkProjectAccessMiddleware } from '../middlewares/projectAccessCheck.js';

const projectRouter = express.Router();

projectRouter.post('/', createProject);
projectRouter.put('/', checkProjectAccessMiddleware, updateProject);
projectRouter.delete('/:id', checkProjectAccessMiddleware, deleteProject);
projectRouter.put('/:id/stages', checkProjectAccessMiddleware, updateProjectStages);
projectRouter.post('/:projectId/addMember', checkProjectAccessMiddleware, addMember);

export default projectRouter;
