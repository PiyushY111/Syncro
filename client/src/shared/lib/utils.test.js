import { describe, it, expect } from 'vitest';
import { cn } from './utils.js';

describe('cn utility', () => {
  it('merges classnames correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('resolves conflicting tailwind classes with twMerge', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles conditional falsy expressions', () => {
    const isActive = false;
    expect(cn('btn', isActive && 'btn-active', null, undefined, 'text-sm')).toBe('btn text-sm');
  });
});
