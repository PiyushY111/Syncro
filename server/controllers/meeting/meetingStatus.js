import { prisma } from '../../config/prisma.js';

// Update RSVP status for a meeting
export const updateRsvpStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params; // Meeting ID
        const { status } = req.body; // ACCEPTED, DECLINED, TENTATIVE

        if (!status) {
            return res.status(400).json({ message: 'RSVP status is required' });
        }

        const validStatuses = ['ACCEPTED', 'DECLINED', 'TENTATIVE'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid RSVP status. Must be ACCEPTED, DECLINED, or TENTATIVE' });
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
            return res.status(404).json({ message: 'You have not been invited to this meeting' });
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
    } catch (error) {
        console.error('Error in updateRsvpStatus:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
