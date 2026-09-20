import { describe, it, expect } from 'vitest';
import reducer, {
  setWorkspaces,
  addWorkspace,
  deleteWorkspace,
} from '../workspaceSlice.js';

describe('workspaceSlice reducer', () => {
  const initialState = {
    workspaces: [],
    currentWorkspace: null,
    loading: false,
  };

  it('should return initial state when passed empty action', () => {
    expect(reducer(undefined, { type: undefined })).toEqual(initialState);
  });

  it('handles setWorkspaces correctly', () => {
    const workspaces = [{ id: 'ws-1', name: 'Workspace 1' }];
    const nextState = reducer(initialState, setWorkspaces(workspaces));
    expect(nextState.workspaces).toEqual(workspaces);
  });

  it('handles addWorkspace correctly', () => {
    const ws = { id: 'ws-1', name: 'New WS' };
    const nextState = reducer(initialState, addWorkspace(ws));
    expect(nextState.workspaces).toHaveLength(1);
    expect(nextState.currentWorkspace).toEqual(ws);
  });

  it('handles deleteWorkspace correctly', () => {
    const state = {
      workspaces: [
        { id: 'ws-1', name: 'WS 1' },
        { id: 'ws-2', name: 'WS 2' },
      ],
      currentWorkspace: { id: 'ws-1', name: 'WS 1' },
      loading: false,
    };

    const nextState = reducer(state, deleteWorkspace('ws-1'));
    expect(nextState.workspaces).toHaveLength(1);
    expect(nextState.currentWorkspace?.id).toBe('ws-2');
  });
});
