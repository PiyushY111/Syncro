import express from 'express';
import {
    createMeeting,
    getWorkspaceMeetings,
    updateMeeting,
    deleteMeeting,
    updateRsvpStatus
} from '../controllers/meetingController.js';
import { validate } from '../middlewares/validate.js';
import { validateCreateMeeting, validateUpdateMeeting } from '../validators/meetingValidators.js';

const meetingRouter = express.Router();

meetingRouter.post('/', validate(validateCreateMeeting), createMeeting);
meetingRouter.get('/', getWorkspaceMeetings);
meetingRouter.put('/:id', validate(validateUpdateMeeting), updateMeeting);
meetingRouter.delete('/:id', deleteMeeting);
meetingRouter.patch('/:id/rsvp', updateRsvpStatus);

export default meetingRouter;
