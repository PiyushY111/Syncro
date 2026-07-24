import express from 'express'
import { createTask, updateTask, deleteTask, triggerRecurTask } from '../controllers/taskController.js';
import { checkProjectAccessMiddleware } from '../middlewares/projectAccessCheck.js';

export const taskRouter = express.Router();

taskRouter.post('/', checkProjectAccessMiddleware, createTask)
taskRouter.put('/:id', updateTask)
taskRouter.post('/delete', deleteTask)
taskRouter.post('/:id/recur-test', triggerRecurTask)

