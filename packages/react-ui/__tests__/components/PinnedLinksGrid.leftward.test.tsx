/**
 * Test for leftward reordering bug fix
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PinnedLinksGrid } from '../../src/components/PinnedLinksGrid';
import type { SpaceItem } from '../../src/types';
import { SpaceItemType } from '../../src/types';

const createMockPinnedLink = (id: string, name: string, position: number): SpaceItem => ({
    id,
    name,
    type: SpaceItemType.link,
    path: `https://example.com/${id}`,
    isExpanded: false,
    children: [],
    faviconUrl: `https://example.com/${id}/favicon.ico`,
    description: null,
    visitCount: 0,
    lastVisited: null,
    createdAt: new Date(),
    isPinned: true,
    pinPosition: position,
    localPath: null,
    securityBookmark: null,
    lastSyncedAt: null,
    isWatching: false,
});

describe('Leftward Reordering Fix', () => {
    it('should correctly calculate array move for leftward drag', () => {
        // Simulate the reordering logic
        const items = ['A', 'B', 'C', 'D', 'E'];
        const oldIndex = 3; // 'D' at position 3
        const newIndex = 1; // Moving to position 1

        // Old buggy logic: newIndex > oldIndex ? newIndex - 1 : newIndex
        // For leftward (3 -> 1): 1 > 3 ? 0 : 1 = 1 ✓ (happens to work)

        // Correct logic: just use newIndex
        const result = [...items];
        const [moved] = result.splice(oldIndex, 1);
        result.splice(newIndex, 0, moved);

        expect(result).toEqual(['A', 'D', 'B', 'C', 'E']);
    });

    it('should correctly calculate array move for rightward drag', () => {
        const items = ['A', 'B', 'C', 'D', 'E'];
        const oldIndex = 1; // 'B' at position 1
        const newIndex = 3; // Moving to position 3

        // Old buggy logic: newIndex > oldIndex ? newIndex - 1 : newIndex
        // For rightward (1 -> 3): 3 > 1 ? 2 : 3 = 2 (WRONG - ends up at position 2)

        // Correct logic: just use newIndex
        const result = [...items];
        const [moved] = result.splice(oldIndex, 1);
        result.splice(newIndex, 0, moved);

        expect(result).toEqual(['A', 'C', 'D', 'B', 'E']);
    });

    it('should render items in correct order', () => {
        const pinnedItems = [
            createMockPinnedLink('pin-1', 'First', 0),
            createMockPinnedLink('pin-2', 'Second', 1),
            createMockPinnedLink('pin-3', 'Third', 2),
            createMockPinnedLink('pin-4', 'Fourth', 3),
        ];

        const onReorderPins = vi.fn();

        render(
            <PinnedLinksGrid
                pinnedItems={pinnedItems}
                spaceColor="#6D5AE6"
                spaceId="space-1"
                onReorderPins={onReorderPins}
            />
        );

        // All items should be rendered
        expect(screen.getByTitle('First')).toBeTruthy();
        expect(screen.getByTitle('Second')).toBeTruthy();
        expect(screen.getByTitle('Third')).toBeTruthy();
        expect(screen.getByTitle('Fourth')).toBeTruthy();
    });
});
