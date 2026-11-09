/**
 * Sidebar rail behaviour: collapsed by default, expands on hover/keyboard focus, and can be locked open.
 * The lock choice is remembered per browser; hover uses small delays so passing the cursor over doesn't flicker.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export const SIDEBAR_LOCK_KEY = 'sidebar_locked';
export const HOVER_OPEN_DELAY_MS = 90;
export const HOVER_CLOSE_DELAY_MS = 220;

/** Fades rail text in/out; always visible in the mobile drawer. */
export const railText = (isExpanded) =>
    cn('whitespace-nowrap transition-opacity duration-200 max-sm:opacity-100', isExpanded ? 'opacity-100 delay-75' : 'opacity-0');

export const readLocked = () => {
    try {
        return localStorage.getItem(SIDEBAR_LOCK_KEY) === '1';
    } catch {
        return false;
    }
};

const writeLocked = (isLocked) => {
    try {
        localStorage.setItem(SIDEBAR_LOCK_KEY, isLocked ? '1' : '0');
    } catch {
        // Storage can be unavailable (private mode); the lock still works for this session.
    }
};

export function useSidebarRail() {
    const [isLocked, setIsLocked] = useState(readLocked);
    const [isHovered, setIsHovered] = useState(false);
    const [hasFocus, setHasFocus] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const timerRef = useRef(null);
    const pointerInsideRef = useRef(false);

    const clearTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
    };

    useEffect(() => clearTimer, []);

    const onPointerEnter = useCallback(() => {
        pointerInsideRef.current = true;
        clearTimer();
        timerRef.current = setTimeout(() => setIsHovered(true), HOVER_OPEN_DELAY_MS);
    }, []);

    const onPointerLeave = useCallback(() => {
        pointerInsideRef.current = false;
        clearTimer();
        timerRef.current = setTimeout(() => setIsHovered(false), HOVER_CLOSE_DELAY_MS);
    }, []);

    // Keyboard focus only: a mouse click also focuses the link, which must not pin the rail open.
    const onFocus = useCallback((event) => {
        if (event.target?.matches?.(':focus-visible')) setHasFocus(true);
    }, []);
    const onBlur = useCallback((event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
    }, []);

    // Workspace/account menus render in a portal outside the rail: keep it open while they are,
    // then collapse once they close if the pointer has already left.
    const onMenuOpenChange = useCallback((open) => {
        setIsMenuOpen(open);
        if (!open && !pointerInsideRef.current) setIsHovered(false);
    }, []);

    const toggleLock = useCallback(() => {
        setIsLocked((prev) => {
            const next = !prev;
            writeLocked(next);
            return next;
        });
        // Unlocking with the cursor still over the rail should feel instant, not snap shut.
        setIsHovered(pointerInsideRef.current);
    }, []);

    return {
        isLocked,
        isExpanded: isLocked || isHovered || hasFocus || isMenuOpen,
        toggleLock,
        onMenuOpenChange,
        railHandlers: { onPointerEnter, onPointerLeave, onFocus, onBlur },
    };
}
