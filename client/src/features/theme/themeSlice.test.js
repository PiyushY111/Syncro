import { describe, it, expect } from 'vitest';
import reducer, { setTheme } from '../themeSlice.js';

describe('themeSlice reducer', () => {
  it('should initialize with light theme', () => {
    expect(reducer(undefined, { type: undefined })).toEqual({ theme: 'light' });
  });

  it('handles setTheme correctly', () => {
    const nextState = reducer({ theme: 'light' }, setTheme('dark'));
    expect(nextState.theme).toBe('dark');
  });
});
