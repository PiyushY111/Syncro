export const addProjectHelper = (state, action) => {
    if (state.currentWorkspace) {
        state.currentWorkspace.projects = state.currentWorkspace.projects || [];
        state.currentWorkspace.projects.push(action.payload);
    }
    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? { ...w, projects: (w.projects || []).concat(action.payload) } : w
    );
};

export const updateProjectHelper = (state, action) => {
    if (state.currentWorkspace) {
        state.currentWorkspace.projects = (state.currentWorkspace.projects || []).map((p) =>
            p.id === action.payload.id ? { ...p, ...action.payload } : p
        );
    }
    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? {
            ...w, projects: (w.projects || []).map((p) =>
                p.id === action.payload.id ? { ...p, ...action.payload } : p
            )
        } : w
    );
};

export const addTaskHelper = (state, action) => {
    if (state.currentWorkspace) {
        state.currentWorkspace.projects = (state.currentWorkspace.projects || []).map((p) => {
            if (p.id === action.payload.projectId) {
                p.tasks = p.tasks || [];
                p.tasks.push(action.payload);
            }
            return p;
        });
    }

    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? {
            ...w, projects: (w.projects || []).map((p) =>
                p.id === action.payload.projectId ? { ...p, tasks: (p.tasks || []).concat(action.payload) } : p
            )
        } : w
    );
};

export const updateTaskHelper = (state, action) => {
    if (state.currentWorkspace) {
        state.currentWorkspace.projects.forEach((p) => {
            if (p.id === action.payload.projectId) {
                p.tasks = (p.tasks || []).map((t) =>
                    t.id === action.payload.id ? action.payload : t
                );
            }
        });
    }
    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? {
            ...w, projects: (w.projects || []).map((p) =>
                p.id === action.payload.projectId ? {
                    ...p, tasks: (p.tasks || []).map((t) =>
                        t.id === action.payload.id ? action.payload : t
                    )
                } : p
            )
        } : w
    );
};

export const deleteTaskHelper = (state, action) => {
    if (state.currentWorkspace) {
        state.currentWorkspace.projects.forEach((p) => {
            p.tasks = (p.tasks || []).filter((t) => !action.payload.includes(t.id));
        });
    }
    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? {
            ...w, projects: (w.projects || []).map((p) =>
                p.id === action.payload.projectId ? {
                    ...p, tasks: (p.tasks || []).filter((t) => !action.payload.includes(t.id))
                } : p
            )
        } : w
    );
};
