import express from 'express';
import {
    createMeeting,
    getWorkspaceMeetings,
    updateMeeting,
    deleteMeeting,
    updateRsvpStatus
} from '../controllers/meetingController.js';

const meetingRouter = express.Router();

meetingRouter.post('/', createMeeting);
meetingRouter.get('/', getWorkspaceMeetings);
meetingRouter.put('/:id', updateMeeting);
meetingRouter.delete('/:id', deleteMeeting);
meetingRouter.patch('/:id/rsvp', updateRsvpStatus);

export default meetingRouter;
