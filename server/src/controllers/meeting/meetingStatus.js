import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError, NotFoundError } from '../../utils/errors/appError.js';

// Update RSVP status for a meeting
export const updateRsvpStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params; // Meeting ID
    const { status } = req.body; // ACCEPTED, DECLINED, TENTATIVE

    if (!status) {
        throw new BadRequestError('RSVP status is required');
    }

    const validStatuses = ['ACCEPTED', 'DECLINED', 'TENTATIVE'];
    if (!validStatuses.includes(status)) {
        throw new BadRequestError('Invalid RSVP status. Must be ACCEPTED, DECLINED, or TENTATIVE');
    }

    // Find invite
    const invite = await prisma.meetingInvite.findUnique({
        where: {
            meetingId_userId: {
                meetingId: id,
                userId
            }
        }
    });

    if (!invite) {
        throw new NotFoundError('You have not been invited to this meeting');
    }

    // Update invite
    const updatedInvite = await prisma.meetingInvite.update({
        where: { id: invite.id },
        data: { status },
        include: {
            user: {
                select: { id: true, name: true, email: true, image: true }
            }
        }
    });

    return res.json({ message: `RSVP updated to ${status.toLowerCase()}`, invite: updatedInvite });
});
