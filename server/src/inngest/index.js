import { inngest } from './client.js';

import { auditLogJob, authRegisteredJob, authLoginCodeJob } from './core/authJobs.js';
import { workspaceMemberInvitedJob, workspaceMemberRoleChangedJob } from './core/workspaceMemberJobs.js';
import { subTeamCreatedJob, subTeamUpdatedJob, subTeamDeletedJob, subTeamMemberAddedJob, subTeamMemberRemovedJob } from './core/subTeamJobs.js';
import { projectCreatedJob, projectUpdatedJob, projectDeletedJob } from './projects/projectJobs.js';
import { portfolioCreatedJob, portfolioUpdatedJob, portfolioDeletedJob } from './projects/portfolioJobs.js';
import { milestoneCreatedJob, milestoneUpdatedJob, milestoneDeletedJob } from './projects/milestoneJobs.js';
import { sprintCreatedJob, sprintUpdatedJob, sprintDeletedJob, epicCreatedJob, epicUpdatedJob, epicDeletedJob } from './projects/sprintEpicJobs.js';
import { retroItemAddedJob, retroItemVotedJob, retroItemDeletedJob } from './projects/retroJobs.js';
import { taskCreatedJob, taskDeletedJob } from './tasks/taskLifecycleJobs.js';
import { taskUpdatedJob } from './tasks/taskUpdateJobs.js';
import { recurrenceJob } from './tasks/taskRecurrenceJobs.js';
import { chatMessageSentJob, chatMessageDeletedJob } from './collab/chatJobs.js';
import { commentCreatedJob } from './collab/commentJobs.js';
import { whiteboardCreatedJob, whiteboardUpdatedJob, whiteboardDeletedJob } from './collab/whiteboardJobs.js';
import { meetingCreatedJob } from './collab/meetingCreatedJob.js';
import { meetingUpdatedJob, meetingDeletedJob } from './collab/meetingUpdateDeleteJobs.js';

export { inngest };

export const functions = [
    auditLogJob,
    authRegisteredJob,
    authLoginCodeJob,
    workspaceMemberInvitedJob,
    workspaceMemberRoleChangedJob,
    projectCreatedJob,
    projectUpdatedJob,
    projectDeletedJob,
    portfolioCreatedJob,
    portfolioUpdatedJob,
    portfolioDeletedJob,
    milestoneCreatedJob,
    milestoneUpdatedJob,
    milestoneDeletedJob,
    subTeamCreatedJob,
    subTeamUpdatedJob,
    subTeamDeletedJob,
    subTeamMemberAddedJob,
    subTeamMemberRemovedJob,
    whiteboardCreatedJob,
    whiteboardUpdatedJob,
    whiteboardDeletedJob,
    sprintCreatedJob,
    sprintUpdatedJob,
    sprintDeletedJob,
    epicCreatedJob,
    epicUpdatedJob,
    epicDeletedJob,
    retroItemAddedJob,
    retroItemVotedJob,
    retroItemDeletedJob,
    commentCreatedJob,
    taskCreatedJob,
    taskUpdatedJob,
    taskDeletedJob,
    recurrenceJob,
    chatMessageSentJob,
    chatMessageDeletedJob,
    meetingCreatedJob,
    meetingUpdatedJob,
    meetingDeletedJob
];