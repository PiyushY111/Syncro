import express from 'express'
import { createTask, updateTask, deleteTask } from '../controllers/taskController.js';
import { checkProjectAccessMiddleware } from '../middlewares/projectAccessCheck.js';
import { validate } from '../middlewares/validate.js';
import { validateCreateTask, validateUpdateTask } from '../validators/taskValidators.js';

export const taskRouter = express.Router();

taskRouter.post('/', checkProjectAccessMiddleware, validate(validateCreateTask), createTask);
taskRouter.put('/:id', validate(validateUpdateTask), updateTask);
taskRouter.post('/delete', deleteTask);

