import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/configs/api';
import {
    addProjectHelper,
    updateProjectHelper,
    addTaskHelper,
    updateTaskHelper,
    deleteTaskHelper,
    addSprintHelper,
    updateSprintHelper,
    deleteSprintHelper,
    addEpicHelper,
    updateEpicHelper,
    deleteEpicHelper,
    updateCapacityHelper
} from '@/features/workspaceHelpers';

export const fetchWorkspaces = createAsyncThunk('workspace/fetchWorkspaces', async () => {
    try {
        const { data } = await api.get('/api/workspaces');
        const payload = data?.data || data;
        return payload.workspaces || [];
    } catch (error) {
        console.log(error?.response?.data?.message || error.message);
        return [];
    }
});

const initialState = {
    workspaces: [],
    currentWorkspace: null,
    loading: false,
};

const workspaceSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        setWorkspaces: (state, action) => {
            state.workspaces = action.payload || [];
        },
        setCurrentWorkspace: (state, action) => {
            if (!action.payload) return;
            localStorage.setItem("currentWorkspaceId", action.payload);
            state.currentWorkspace = state.workspaces.find((w) => w.id === action.payload) || null;
        },
        addWorkspace: (state, action) => {
            if (!action.payload) return;
            const exists = state.workspaces.some((w) => w?.id === action.payload.id);
            if (!exists) {
                state.workspaces.push(action.payload);
            }
            if (state.currentWorkspace?.id !== action.payload.id) {
                state.currentWorkspace = action.payload;
            }
        },
        updateWorkspace: (state, action) => {
            state.workspaces = state.workspaces.map((w) =>
                w.id === action.payload.id ? action.payload : w
            );
            if (state.currentWorkspace?.id === action.payload.id) {
                state.currentWorkspace = action.payload;
            }
        },
        deleteWorkspace: (state, action) => {
            state.workspaces = state.workspaces.filter((w) => w.id !== action.payload);
            if (state.currentWorkspace?.id === action.payload) {
                if (state.workspaces.length > 0) {
                    state.currentWorkspace = state.workspaces[0];
                    localStorage.setItem("currentWorkspaceId", state.workspaces[0].id);
                } else {
                    state.currentWorkspace = null;
                    localStorage.removeItem("currentWorkspaceId");
                }
            }
        },

        addProject: addProjectHelper,
        updateProject: updateProjectHelper,
        addTask: addTaskHelper,
        updateTask: updateTaskHelper,
        deleteTask: deleteTaskHelper,
        addSprint: addSprintHelper,
        updateSprint: updateSprintHelper,
        deleteSprint: deleteSprintHelper,
        addEpic: addEpicHelper,
        updateEpic: updateEpicHelper,
        deleteEpic: deleteEpicHelper,
        updateCapacity: updateCapacityHelper,
    },
    extraReducers: (builder) => {
        builder.addCase(fetchWorkspaces.pending, (state) => {
            if (state.workspaces.length === 0) {
                state.loading = true;
            }
        });
        builder.addCase(fetchWorkspaces.fulfilled, (state, action) => {
            state.workspaces = action.payload || [];
            if (state.workspaces.length > 0) {
                const approvedWorkspaces = state.workspaces.filter((w) => w.approvalStatus !== 'PENDING');
                const defaultCandidate = approvedWorkspaces.length > 0 ? approvedWorkspaces[0] : state.workspaces[0];
                const localStorageCurrentWorkspaceId = localStorage.getItem("currentWorkspaceId");
                if (localStorageCurrentWorkspaceId) {
                    const findWorkspace = state.workspaces.find((w) => w.id === localStorageCurrentWorkspaceId);
                    if (findWorkspace) {
                        state.currentWorkspace = findWorkspace;
                    } else {
                        state.currentWorkspace = defaultCandidate;
                    }
                } else {
                    state.currentWorkspace = defaultCandidate;
                }
            } else {
                state.currentWorkspace = null;
            }
            state.loading = false;
        });
        builder.addCase(fetchWorkspaces.rejected, (state) => {
            state.loading = false;
        });
    }
});

export const {
    setWorkspaces,
    setCurrentWorkspace,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addProject,
    updateProject,
    addTask,
    updateTask,
    deleteTask,
    addSprint,
    updateSprint,
    deleteSprint,
    addEpic,
    updateEpic,
    deleteEpic,
    updateCapacity
} = workspaceSlice.actions;

export default workspaceSlice.reducer;