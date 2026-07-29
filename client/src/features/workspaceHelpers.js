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
            ...w, projects: (w.projects || []).map((p) => ({
                ...p, tasks: (p.tasks || []).filter((t) => !action.payload.includes(t.id))
            }))
        } : w
    );
};

export const addSprintHelper = (state, action) => {
    const { projectId, sprint } = action.payload;
    if (state.currentWorkspace) {
        state.currentWorkspace.projects = (state.currentWorkspace.projects || []).map((p) => {
            if (p.id === projectId) {
                p.sprints = p.sprints || [];
                p.sprints.push(sprint);
            }
            return p;
        });
    }
    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? {
            ...w, projects: (w.projects || []).map((p) =>
                p.id === projectId ? { ...p, sprints: (p.sprints || []).concat(sprint) } : p
            )
        } : w
    );
};

export const updateSprintHelper = (state, action) => {
    const { projectId, sprint } = action.payload;
    if (state.currentWorkspace) {
        state.currentWorkspace.projects = (state.currentWorkspace.projects || []).map((p) => {
            if (p.id === projectId) {
                p.sprints = (p.sprints || []).map(s => s.id === sprint.id ? { ...s, ...sprint } : s);
            }
            return p;
        });
    }
    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? {
            ...w, projects: (w.projects || []).map((p) =>
                p.id === projectId ? {
                    ...p, sprints: (p.sprints || []).map(s => s.id === sprint.id ? { ...s, ...sprint } : s)
                } : p
            )
        } : w
    );
};

export const deleteSprintHelper = (state, action) => {
    const { projectId, sprintId } = action.payload;
    if (state.currentWorkspace) {
        state.currentWorkspace.projects = (state.currentWorkspace.projects || []).map((p) => {
            if (p.id === projectId) {
                p.sprints = (p.sprints || []).filter(s => s.id !== sprintId);
                p.tasks = (p.tasks || []).map(t => t.sprintId === sprintId ? { ...t, sprintId: null } : t);
            }
            return p;
        });
    }
    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? {
            ...w, projects: (w.projects || []).map((p) =>
                p.id === projectId ? {
                    ...p,
                    sprints: (p.sprints || []).filter(s => s.id !== sprintId),
                    tasks: (p.tasks || []).map(t => t.sprintId === sprintId ? { ...t, sprintId: null } : t)
                } : p
            )
        } : w
    );
};

export const addEpicHelper = (state, action) => {
    const { projectId, epic } = action.payload;
    if (state.currentWorkspace) {
        state.currentWorkspace.projects = (state.currentWorkspace.projects || []).map((p) => {
            if (p.id === projectId) {
                p.epics = p.epics || [];
                p.epics.push(epic);
            }
            return p;
        });
    }
    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? {
            ...w, projects: (w.projects || []).map((p) =>
                p.id === projectId ? { ...p, epics: (p.epics || []).concat(epic) } : p
            )
        } : w
    );
};

export const updateEpicHelper = (state, action) => {
    const { projectId, epic } = action.payload;
    if (state.currentWorkspace) {
        state.currentWorkspace.projects = (state.currentWorkspace.projects || []).map((p) => {
            if (p.id === projectId) {
                p.epics = (p.epics || []).map(e => e.id === epic.id ? { ...e, ...epic } : e);
            }
            return p;
        });
    }
    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? {
            ...w, projects: (w.projects || []).map((p) =>
                p.id === projectId ? {
                    ...p, epics: (p.epics || []).map(e => e.id === epic.id ? { ...e, ...epic } : e)
                } : p
            )
        } : w
    );
};

export const deleteEpicHelper = (state, action) => {
    const { projectId, epicId } = action.payload;
    if (state.currentWorkspace) {
        state.currentWorkspace.projects = (state.currentWorkspace.projects || []).map((p) => {
            if (p.id === projectId) {
                p.epics = (p.epics || []).filter(e => e.id !== epicId);
                p.tasks = (p.tasks || []).map(t => t.epicId === epicId ? { ...t, epicId: null } : t);
            }
            return p;
        });
    }
    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? {
            ...w, projects: (w.projects || []).map((p) =>
                p.id === projectId ? {
                    ...p,
                    epics: (p.epics || []).filter(e => e.id !== epicId),
                    tasks: (p.tasks || []).map(t => t.epicId === epicId ? { ...t, epicId: null } : t)
                } : p
            )
        } : w
    );
};

export const updateCapacityHelper = (state, action) => {
    const { projectId, sprintId, capacity } = action.payload;
    if (state.currentWorkspace) {
        state.currentWorkspace.projects = (state.currentWorkspace.projects || []).map((p) => {
            if (p.id === projectId) {
                p.sprints = (p.sprints || []).map(s => {
                    if (s.id === sprintId) {
                        s.capacities = s.capacities || [];
                        const idx = s.capacities.findIndex(c => c.userId === capacity.userId);
                        if (idx !== -1) {
                            s.capacities[idx] = capacity;
                        } else {
                            s.capacities.push(capacity);
                        }
                    }
                    return s;
                });
            }
            return p;
        });
    }
    state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id ? {
            ...w, projects: (w.projects || []).map((p) => {
                if (p.id === projectId) {
                    return {
                        ...p,
                        sprints: (p.sprints || []).map(s => {
                            if (s.id === sprintId) {
                                const caps = [...(s.capacities || [])];
                                const idx = caps.findIndex(c => c.userId === capacity.userId);
                                if (idx !== -1) {
                                    caps[idx] = capacity;
                                } else {
                                    caps.push(capacity);
                                }
                                return { ...s, capacities: caps };
                            }
                            return s;
                        })
                    };
                }
                return p;
            })
        } : w
    );
};

