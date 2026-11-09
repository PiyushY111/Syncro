import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSidebarRail, SIDEBAR_LOCK_KEY, HOVER_OPEN_DELAY_MS, HOVER_CLOSE_DELAY_MS } from './useSidebarRail';

describe('useSidebarRail', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });
    afterEach(() => vi.useRealTimers());

    it('starts collapsed and expands only after the hover delay', () => {
        const { result } = renderHook(() => useSidebarRail());
        expect(result.current.isExpanded).toBe(false);

        act(() => result.current.railHandlers.onPointerEnter());
        expect(result.current.isExpanded).toBe(false);
        act(() => vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS));
        expect(result.current.isExpanded).toBe(true);

        act(() => result.current.railHandlers.onPointerLeave());
        act(() => vi.advanceTimersByTime(HOVER_CLOSE_DELAY_MS));
        expect(result.current.isExpanded).toBe(false);
    });

    it('ignores a quick pass of the cursor', () => {
        const { result } = renderHook(() => useSidebarRail());
        act(() => result.current.railHandlers.onPointerEnter());
        act(() => result.current.railHandlers.onPointerLeave());
        act(() => vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS + HOVER_CLOSE_DELAY_MS));
        expect(result.current.isExpanded).toBe(false);
    });

    it('stays open while locked and remembers the lock', () => {
        const { result } = renderHook(() => useSidebarRail());
        act(() => result.current.toggleLock());
        expect(result.current.isLocked).toBe(true);
        expect(result.current.isExpanded).toBe(true);
        expect(localStorage.getItem(SIDEBAR_LOCK_KEY)).toBe('1');

        const { result: reloaded } = renderHook(() => useSidebarRail());
        expect(reloaded.current.isExpanded).toBe(true);
    });

    it('stays open while a menu is open, then closes if the pointer has left', () => {
        const { result } = renderHook(() => useSidebarRail());
        act(() => result.current.onMenuOpenChange(true));
        expect(result.current.isExpanded).toBe(true);
        act(() => result.current.onMenuOpenChange(false));
        expect(result.current.isExpanded).toBe(false);
    });
});
