import express from 'express';
import { 
    createChannel, 
    getWorkspaceChannels, 
    sendMessage, 
    getChannelMessages, 
    getDirectMessages, 
    getThreadReplies,
    archiveChannel,
    deleteChannel,
    clearDirectMessages,
    joinChannel,
    addMemberToChannel,
    updateChannel
} from '../controllers/chatController.js';

const chatRouter = express.Router();

chatRouter.post('/channels', createChannel);
chatRouter.get('/workspaces/:workspaceId/channels', getWorkspaceChannels);
chatRouter.post('/messages', sendMessage);
chatRouter.get('/channels/:channelId/messages', getChannelMessages);
chatRouter.get('/workspaces/:workspaceId/direct/:otherUserId/messages', getDirectMessages);
chatRouter.get('/messages/:messageId/replies', getThreadReplies);

chatRouter.patch('/channels/:channelId/archive', archiveChannel);
chatRouter.delete('/channels/:channelId', deleteChannel);
chatRouter.delete('/workspaces/:workspaceId/direct/:otherUserId', clearDirectMessages);

// Channel join, member additions, and details editing
chatRouter.post('/channels/:channelId/join', joinChannel);
chatRouter.post('/channels/:channelId/members', addMemberToChannel);
chatRouter.patch('/channels/:channelId', updateChannel);

export default chatRouter;
