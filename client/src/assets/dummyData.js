import workspace_img_default from './images/workspace_img_default.png';
import profile_img_a from './images/profile_img_a.svg';
import profile_img_o from './images/profile_img_o.svg';
import profile_img_j from './images/profile_img_j.svg';

export const assets = {
    workspace_img_default,
    profile_img_a,
    profile_img_o,
    profile_img_j,
};

export const dummyUsers = [
    { id: "user_1", name: "Alex Smith", email: "alexsmith@example.com", image: profile_img_a, createdAt: "2025-10-06T11:04:03.485Z", updatedAt: "2025-10-06T11:04:03.485Z" },
    { id: "user_2", name: "John Warrel", email: "johnwarrel@example.com", image: profile_img_j, createdAt: "2025-10-09T13:20:24.360Z", updatedAt: "2025-10-09T13:20:24.360Z" },
    { id: "user_3", name: "Oliver Watts", email: "oliverwatts@example.com", image: profile_img_o, createdAt: "2025-09-01T04:31:22.043Z", updatedAt: "2025-09-26T09:03:37.866Z" }
];

export const dummyWorkspaces = [
    {
        id: "org_1", name: "Corp Workspace", slug: "corp-workspace", description: null, settings: {}, ownerId: "user_3",
        createdAt: "2025-10-13T06:55:44.423Z", image_url: workspace_img_default, updatedAt: "2025-10-13T07:17:36.890Z",
        members: [
            { id: "m1", userId: "user_1", workspaceId: "org_1", message: "", role: "ADMIN", user: dummyUsers[0] },
            { id: "m2", userId: "user_2", workspaceId: "org_1", message: "", role: "ADMIN", user: dummyUsers[1] },
            { id: "m3", userId: "user_3", workspaceId: "org_1", message: "", role: "ADMIN", user: dummyUsers[2] }
        ],
        projects: [
            {
                id: "p1", name: "LaunchPad CRM", description: "A next-gen CRM for startups.", priority: "HIGH", status: "ACTIVE",
                start_date: "2025-10-10T00:00:00.000Z", end_date: "2026-02-28T00:00:00.000Z", team_lead: "user_3", workspaceId: "org_1", progress: 65,
                createdAt: "2025-10-13T08:01:35.491Z", updatedAt: "2025-10-13T08:01:45.620Z",
                tasks: [
                    { id: "t1", projectId: "p1", title: "Design Dashboard UI", description: "Modern CRM layout.", status: "IN_PROGRESS", type: "FEATURE", priority: "HIGH", assigneeId: "user_1", due_date: "2025-10-31T00:00:00.000Z", createdAt: "2025-10-13T08:04:04.084Z", updatedAt: "2025-10-13T08:04:04.084Z", assignee: dummyUsers[0], comments: [] },
                    { id: "t2", projectId: "p1", title: "Integrate Email API", description: "SendGrid setup.", status: "TODO", type: "TASK", priority: "MEDIUM", assigneeId: "user_2", due_date: "2025-11-30T00:00:00.000Z", createdAt: "2025-10-13T08:10:31.922Z", updatedAt: "2025-10-13T08:10:31.922Z", assignee: dummyUsers[1], comments: [] }
                ],
                members: [{ id: "pm1", userId: "user_1", projectId: "p1", user: dummyUsers[0] }]
            }
        ],
        owner: dummyUsers[2]
    }
];
