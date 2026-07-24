import express from 'express'
import { addMember, createProject, updateProject, updateProjectStages, deleteProject } from '../controllers/projectController.js';

const projectRouter = express.Router();

projectRouter.post('/', createProject);
projectRouter.put('/', updateProject);
projectRouter.delete('/:id', deleteProject);
projectRouter.put('/:id/stages', updateProjectStages);
projectRouter.post('/:projectId/addMember', addMember);

export default projectRouter;
