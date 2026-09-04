import express from 'express'
import { addComment, getComments } from '../controllers/commentController.js';
import { validate } from '../middlewares/validate.js';
import { validateAddComment } from '../validators/commentValidators.js';

const commentRouter = express.Router();

commentRouter.post('/', validate(validateAddComment), addComment);
commentRouter.get('/:taskId', getComments);
 
export default commentRouter;
