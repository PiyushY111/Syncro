import express from 'express';
import { 
    createChannel, 
    getWorkspaceChannels, 
    browsePublicChannels,
    joinPublicChannel,
    toggleStarChannel,
    getChannelMessages, 
    getThreadReplies,
    archiveChannel,
    deleteChannel,
    pinMessage,
    getPinnedMessages,
    deleteMessage,
    updateChannelDetails,
    addMemberToChannel,
    removeMemberFromChannel,
    clearChannelChat,
    exportChannelChat,
    toggleStarMessage,
    getStarredMessages,
    getDirectMessages,
    clearDirectMessages,
    sendMessage,
    searchMessages
} from '../controllers/chatController.js';
import { validate } from '../middlewares/validate.js';
import { 
    validateCreateChannel, 
    validateUpdateChannel, 
    validateSendMessage 
} from '../validators/chatValidators.js';

const chatRouter = express.Router();

chatRouter.get('/search', searchMessages);

chatRouter.post('/channels', validate(validateCreateChannel), createChannel);
chatRouter.get('/workspaces/:workspaceId/channels', getWorkspaceChannels);
chatRouter.get('/workspaces/:workspaceId/browse', browsePublicChannels);
chatRouter.post('/channels/:channelId/join', joinPublicChannel);
chatRouter.post('/channels/:channelId/star', toggleStarChannel);

chatRouter.post('/channels/:channelId/members', addMemberToChannel);
chatRouter.delete('/channels/:channelId/members/:memberUserId', removeMemberFromChannel);

chatRouter.delete('/channels/:channelId/clear', clearChannelChat);
chatRouter.get('/channels/:channelId/export', exportChannelChat);

chatRouter.post('/messages', validate(validateSendMessage), sendMessage);
chatRouter.post('/messages/:messageId/star', toggleStarMessage);
chatRouter.get('/channels/:channelId/starred', getStarredMessages);

chatRouter.get('/channels/:channelId/messages', getChannelMessages);
chatRouter.get('/messages/:messageId/replies', getThreadReplies);
chatRouter.delete('/messages/:messageId', deleteMessage);

chatRouter.post('/messages/:messageId/pin', pinMessage);
chatRouter.get('/channels/:channelId/pinned', getPinnedMessages);

chatRouter.get('/direct/:otherUserId/messages', getDirectMessages);
chatRouter.delete('/direct/:otherUserId/clear', clearDirectMessages);

chatRouter.patch('/channels/:channelId/archive', archiveChannel);
chatRouter.delete('/channels/:channelId', deleteChannel);
chatRouter.patch('/channels/:channelId', validate(validateUpdateChannel), updateChannelDetails);

export default chatRouter;
