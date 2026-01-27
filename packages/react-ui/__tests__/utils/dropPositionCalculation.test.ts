/**
 * Comprehensive Drag-Drop Position Calculation Tests
 * 
 * These tests verify the position calculation logic used in App.tsx handleItemDrop
 * and the corresponding backend shift logic.
 * 
 * Test Scenarios Cover:
 * 1. Same-parent moves (reordering within a list)
 * 2. Different-parent moves (moving between folders)
 * 3. Edge cases (first, last, adjacent swaps)
 * 4. Frontend calculation + backend shift simulation
 */

import { describe, test, expect, beforeEach } from 'vitest';

// Simulate the data structure
interface Item {
    id: string;
    name: string;
    parentId: string | null;
    sortOrder: number;
    spaceId: string;
}

/**
 * Simulates the frontend position calculation logic from App.tsx
 */
function calculateFrontendPosition(
    draggedIndex: number,
    targetIndex: number,
    position: 'before' | 'after' | 'inside',
    isSameParent: boolean
): number {
    if (position === 'inside') {
        return 0;
    }

    let toPosition: number;
    if (position === 'before') {
        toPosition = targetIndex;
        if (isSameParent && draggedIndex < targetIndex) {
            toPosition = targetIndex - 1;
        }
    } else {
        // after
        toPosition = targetIndex + 1;
        if (isSameParent && draggedIndex < targetIndex) {
            toPosition = targetIndex;
        }
    }
    return toPosition;
}

/**
 * Simulates the backend moveItem logic from SqliteSpaceItemsRepository
 */
function simulateBackendMove(
    items: Item[],
    itemId: string,
    newSpaceId: string,
    newParentId: string | null,
    newOrder: number
): Item[] {
    const result = items.map(item => ({ ...item }));
    const movingItem = result.find(item => item.id === itemId);

    if (!movingItem) {
        throw new Error(`Item not found: ${itemId}`);
    }

    const currentSpaceId = movingItem.spaceId;
    const currentParentId = movingItem.parentId;
    const currentOrder = movingItem.sortOrder;
    const isSameParent = currentSpaceId === newSpaceId && currentParentId === newParentId;

    if (isSameParent) {
        // Moving within the same parent
        if (newOrder > currentOrder) {
            // Moving down: shift items between old+1 and new down by 1
            result.forEach(item => {
                if (item.spaceId === newSpaceId &&
                    item.parentId === newParentId &&
                    item.sortOrder > currentOrder &&
                    item.sortOrder <= newOrder &&
                    item.id !== itemId) {
                    item.sortOrder -= 1;
                }
            });
        } else if (newOrder < currentOrder) {
            // Moving up: shift items between new and old-1 up by 1
            result.forEach(item => {
                if (item.spaceId === newSpaceId &&
                    item.parentId === newParentId &&
                    item.sortOrder >= newOrder &&
                    item.sortOrder < currentOrder &&
                    item.id !== itemId) {
                    item.sortOrder += 1;
                }
            });
        }
    } else {
        // Moving to a different parent
        // First, shift items down in the old parent to fill the gap
        result.forEach(item => {
            if (item.spaceId === currentSpaceId &&
                item.parentId === currentParentId &&
                item.sortOrder > currentOrder) {
                item.sortOrder -= 1;
            }
        });

        // Then, shift items up in the new parent to make room
        result.forEach(item => {
            if (item.spaceId === newSpaceId &&
                item.parentId === newParentId &&
                item.sortOrder >= newOrder) {
                item.sortOrder += 1;
            }
        });
    }

    // Finally, move the item to its new location
    movingItem.spaceId = newSpaceId;
    movingItem.parentId = newParentId;
    movingItem.sortOrder = newOrder;

    return result;
}

/**
 * Helper to get items in order for a parent
 */
function getItemsInOrder(items: Item[], spaceId: string, parentId: string | null): string[] {
    return items
        .filter(item => item.spaceId === spaceId && item.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(item => item.name);
}

/**
 * Simulates the full drag-drop flow from frontend to backend
 */
function simulateFullDragDrop(
    items: Item[],
    draggedId: string,
    targetId: string,
    position: 'before' | 'after' | 'inside',
    targetSpaceId: string
): Item[] {
    const draggedItem = items.find(item => item.id === draggedId);
    const targetItem = items.find(item => item.id === targetId);

    if (!draggedItem || !targetItem) {
        throw new Error('Item not found');
    }

    // Get siblings to calculate indices
    const draggedSiblings = items
        .filter(item => item.spaceId === draggedItem.spaceId && item.parentId === draggedItem.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const targetSiblings = items
        .filter(item => item.spaceId === targetItem.spaceId && item.parentId === targetItem.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const draggedIndex = draggedSiblings.findIndex(item => item.id === draggedId);
    const targetIndex = targetSiblings.findIndex(item => item.id === targetId);

    // Determine target parent
    let targetParentId: string | null;
    if (position === 'inside') {
        targetParentId = targetId;
    } else {
        targetParentId = targetItem.parentId;
    }

    const isSameParent = draggedItem.spaceId === targetSpaceId && draggedItem.parentId === targetParentId;

    // Calculate frontend position
    const toPosition = calculateFrontendPosition(draggedIndex, targetIndex, position, isSameParent);

    // Apply backend move
    return simulateBackendMove(items, draggedId, targetSpaceId, targetParentId, toPosition);
}

describe('Drop Position Calculation - Comprehensive Tests', () => {

    // ===========================================
    // SCENARIO 1: Same-Parent Moves (Root Level)
    // ===========================================

    describe('Scenario 1: Same-Parent Moves at Root Level', () => {
        let items: Item[];

        beforeEach(() => {
            // Setup: [A, B, C, D, E] at root level
            items = [
                { id: 'a', name: 'A', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'b', name: 'B', parentId: null, sortOrder: 1, spaceId: 'space1' },
                { id: 'c', name: 'C', parentId: null, sortOrder: 2, spaceId: 'space1' },
                { id: 'd', name: 'D', parentId: null, sortOrder: 3, spaceId: 'space1' },
                { id: 'e', name: 'E', parentId: null, sortOrder: 4, spaceId: 'space1' },
            ];
        });

        test('1.1: Move B to after D (moving down)', () => {
            // User drags B and drops AFTER D
            // Visual: [A, B, C, D, E] -> [A, C, D, B, E]
            const result = simulateFullDragDrop(items, 'b', 'd', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['A', 'C', 'D', 'B', 'E']);
        });

        test('1.2: Move D to before B (moving up)', () => {
            // User drags D and drops BEFORE B
            // Visual: [A, B, C, D, E] -> [A, D, B, C, E]
            const result = simulateFullDragDrop(items, 'd', 'b', 'before', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['A', 'D', 'B', 'C', 'E']);
        });

        test('1.3: Move A to last position (first to last)', () => {
            // User drags A and drops AFTER E
            // Visual: [A, B, C, D, E] -> [B, C, D, E, A]
            const result = simulateFullDragDrop(items, 'a', 'e', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['B', 'C', 'D', 'E', 'A']);
        });

        test('1.4: Move E to first position (last to first)', () => {
            // User drags E and drops BEFORE A
            // Visual: [A, B, C, D, E] -> [E, A, B, C, D]
            const result = simulateFullDragDrop(items, 'e', 'a', 'before', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['E', 'A', 'B', 'C', 'D']);
        });

        test('1.5: Move C to between A and B', () => {
            // User drags C and drops AFTER A
            // Visual: [A, B, C, D, E] -> [A, C, B, D, E]
            const result = simulateFullDragDrop(items, 'c', 'a', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['A', 'C', 'B', 'D', 'E']);
        });

        test('1.6: Move B to same position (no-op)', () => {
            // User drags B and drops at same position (before C)
            // Visual: [A, B, C, D, E] -> [A, B, C, D, E]
            const result = simulateFullDragDrop(items, 'b', 'c', 'before', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['A', 'B', 'C', 'D', 'E']);
        });

        test('1.7: Move middle item down one position', () => {
            // User drags C and drops AFTER D
            // Visual: [A, B, C, D, E] -> [A, B, D, C, E]
            const result = simulateFullDragDrop(items, 'c', 'd', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['A', 'B', 'D', 'C', 'E']);
        });

        test('1.8: Move middle item up one position', () => {
            // User drags C and drops BEFORE B
            // Visual: [A, B, C, D, E] -> [A, C, B, D, E]
            const result = simulateFullDragDrop(items, 'c', 'b', 'before', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['A', 'C', 'B', 'D', 'E']);
        });
    });

    // ===========================================
    // SCENARIO 2: Moving Items INTO Folders
    // ===========================================

    describe('Scenario 2: Moving Items Into Folders', () => {
        let items: Item[];

        beforeEach(() => {
            // Setup: Root: [Folder1, A, B, C]
            //        Folder1: [X, Y]
            items = [
                { id: 'folder1', name: 'Folder1', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'a', name: 'A', parentId: null, sortOrder: 1, spaceId: 'space1' },
                { id: 'b', name: 'B', parentId: null, sortOrder: 2, spaceId: 'space1' },
                { id: 'c', name: 'C', parentId: null, sortOrder: 3, spaceId: 'space1' },
                { id: 'x', name: 'X', parentId: 'folder1', sortOrder: 0, spaceId: 'space1' },
                { id: 'y', name: 'Y', parentId: 'folder1', sortOrder: 1, spaceId: 'space1' },
            ];
        });

        test('2.1: Move B into Folder1 (inside drop)', () => {
            // User drops B INSIDE Folder1 (becomes first child)
            // Root: [Folder1, A, C], Folder1: [B, X, Y]
            const result = simulateFullDragDrop(items, 'b', 'folder1', 'inside', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['Folder1', 'A', 'C']);
            expect(getItemsInOrder(result, 'space1', 'folder1')).toEqual(['B', 'X', 'Y']);
        });

        test('2.2: Move A into Folder1 (inside drop)', () => {
            // User drops A INSIDE Folder1
            // Root: [Folder1, B, C], Folder1: [A, X, Y]
            const result = simulateFullDragDrop(items, 'a', 'folder1', 'inside', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['Folder1', 'B', 'C']);
            expect(getItemsInOrder(result, 'space1', 'folder1')).toEqual(['A', 'X', 'Y']);
        });

        test('2.3: Move C into Folder1 (inside drop)', () => {
            // User drops C INSIDE Folder1
            // Root: [Folder1, A, B], Folder1: [C, X, Y]
            const result = simulateFullDragDrop(items, 'c', 'folder1', 'inside', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['Folder1', 'A', 'B']);
            expect(getItemsInOrder(result, 'space1', 'folder1')).toEqual(['C', 'X', 'Y']);
        });
    });

    // ===========================================
    // SCENARIO 3: Moving Items OUT OF Folders
    // ===========================================

    describe('Scenario 3: Moving Items Out of Folders', () => {
        let items: Item[];

        beforeEach(() => {
            // Setup: Root: [Folder1, A]
            //        Folder1: [X, Y, Z]
            items = [
                { id: 'folder1', name: 'Folder1', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'a', name: 'A', parentId: null, sortOrder: 1, spaceId: 'space1' },
                { id: 'x', name: 'X', parentId: 'folder1', sortOrder: 0, spaceId: 'space1' },
                { id: 'y', name: 'Y', parentId: 'folder1', sortOrder: 1, spaceId: 'space1' },
                { id: 'z', name: 'Z', parentId: 'folder1', sortOrder: 2, spaceId: 'space1' },
            ];
        });

        test('3.1: Move Y out of Folder1 to root (after Folder1)', () => {
            // User drags Y and drops AFTER Folder1 at root
            // Root: [Folder1, Y, A], Folder1: [X, Z]
            const result = simulateFullDragDrop(items, 'y', 'folder1', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['Folder1', 'Y', 'A']);
            expect(getItemsInOrder(result, 'space1', 'folder1')).toEqual(['X', 'Z']);
        });

        test('3.2: Move X out of Folder1 to root (after A)', () => {
            // User drags X and drops AFTER A at root
            // Root: [Folder1, A, X], Folder1: [Y, Z]
            const result = simulateFullDragDrop(items, 'x', 'a', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['Folder1', 'A', 'X']);
            expect(getItemsInOrder(result, 'space1', 'folder1')).toEqual(['Y', 'Z']);
        });

        test('3.3: Move Z out of Folder1 to root (before Folder1)', () => {
            // User drags Z and drops BEFORE Folder1
            // Root: [Z, Folder1, A], Folder1: [X, Y]
            const result = simulateFullDragDrop(items, 'z', 'folder1', 'before', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['Z', 'Folder1', 'A']);
            expect(getItemsInOrder(result, 'space1', 'folder1')).toEqual(['X', 'Y']);
        });
    });

    // ===========================================
    // SCENARIO 4: Nested Folder Moves
    // ===========================================

    describe('Scenario 4: Nested Folder Moves (Multi-Level)', () => {
        let items: Item[];

        beforeEach(() => {
            // Setup: Root: [Folder1]
            //        Folder1: [Folder2, A]
            //        Folder2: [X, Y]
            items = [
                { id: 'folder1', name: 'Folder1', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'folder2', name: 'Folder2', parentId: 'folder1', sortOrder: 0, spaceId: 'space1' },
                { id: 'a', name: 'A', parentId: 'folder1', sortOrder: 1, spaceId: 'space1' },
                { id: 'x', name: 'X', parentId: 'folder2', sortOrder: 0, spaceId: 'space1' },
                { id: 'y', name: 'Y', parentId: 'folder2', sortOrder: 1, spaceId: 'space1' },
            ];
        });

        test('4.1: Move X from Folder2 to Folder1 (after A)', () => {
            // User drags X from Folder2 and drops AFTER A in Folder1
            // Folder1: [Folder2, A, X], Folder2: [Y]
            const result = simulateFullDragDrop(items, 'x', 'a', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', 'folder1')).toEqual(['Folder2', 'A', 'X']);
            expect(getItemsInOrder(result, 'space1', 'folder2')).toEqual(['Y']);
        });

        test('4.2: Move A from Folder1 into Folder2 (inside drop)', () => {
            // User drags A and drops INSIDE Folder2
            // Folder1: [Folder2], Folder2: [A, X, Y]
            const result = simulateFullDragDrop(items, 'a', 'folder2', 'inside', 'space1');
            expect(getItemsInOrder(result, 'space1', 'folder1')).toEqual(['Folder2']);
            expect(getItemsInOrder(result, 'space1', 'folder2')).toEqual(['A', 'X', 'Y']);
        });

        test('4.3: Move Y from Folder2 to root level (after Folder1)', () => {
            // User drags Y and drops AFTER Folder1 at root
            // Root: [Folder1, Y], Folder2: [X]
            const result = simulateFullDragDrop(items, 'y', 'folder1', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['Folder1', 'Y']);
            expect(getItemsInOrder(result, 'space1', 'folder2')).toEqual(['X']);
        });
    });

    // ===========================================
    // SCENARIO 5: Cross-Space Moves
    // ===========================================

    describe('Scenario 5: Cross-Space Moves', () => {
        let items: Item[];

        beforeEach(() => {
            // Setup: 
            // Space1 Root: [A, B, C]
            // Space2 Root: [X, Y]
            items = [
                { id: 'a', name: 'A', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'b', name: 'B', parentId: null, sortOrder: 1, spaceId: 'space1' },
                { id: 'c', name: 'C', parentId: null, sortOrder: 2, spaceId: 'space1' },
                { id: 'x', name: 'X', parentId: null, sortOrder: 0, spaceId: 'space2' },
                { id: 'y', name: 'Y', parentId: null, sortOrder: 1, spaceId: 'space2' },
            ];
        });

        test('5.1: Move B from Space1 to Space2 (before X)', () => {
            // User drags B from Space1 and drops BEFORE X in Space2
            // Space1: [A, C], Space2: [B, X, Y]
            const result = simulateFullDragDrop(items, 'b', 'x', 'before', 'space2');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['A', 'C']);
            expect(getItemsInOrder(result, 'space2', null)).toEqual(['B', 'X', 'Y']);
        });

        test('5.2: Move A from Space1 to Space2 (after X)', () => {
            // User drags A from Space1 and drops AFTER X in Space2
            // Space1: [B, C], Space2: [X, A, Y]
            const result = simulateFullDragDrop(items, 'a', 'x', 'after', 'space2');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['B', 'C']);
            expect(getItemsInOrder(result, 'space2', null)).toEqual(['X', 'A', 'Y']);
        });

        test('5.3: Move X from Space2 to Space1 (after C)', () => {
            // User drags X from Space2 and drops AFTER C in Space1
            // Space1: [A, B, C, X], Space2: [Y]
            const result = simulateFullDragDrop(items, 'x', 'c', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['A', 'B', 'C', 'X']);
            expect(getItemsInOrder(result, 'space2', null)).toEqual(['Y']);
        });
    });

    // ===========================================
    // SCENARIO 6: Edge Cases
    // ===========================================

    describe('Scenario 6: Edge Cases', () => {
        test('6.1: Move into empty folder', () => {
            const items: Item[] = [
                { id: 'folder1', name: 'EmptyFolder', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'a', name: 'A', parentId: null, sortOrder: 1, spaceId: 'space1' },
            ];

            const result = simulateFullDragDrop(items, 'a', 'folder1', 'inside', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['EmptyFolder']);
            expect(getItemsInOrder(result, 'space1', 'folder1')).toEqual(['A']);
        });

        test('6.2: Move only item in folder out', () => {
            const items: Item[] = [
                { id: 'folder1', name: 'Folder1', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'x', name: 'X', parentId: 'folder1', sortOrder: 0, spaceId: 'space1' },
            ];

            const result = simulateFullDragDrop(items, 'x', 'folder1', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['Folder1', 'X']);
            expect(getItemsInOrder(result, 'space1', 'folder1')).toEqual([]);
        });

        test('6.3: Swap two adjacent items (A, B -> B, A)', () => {
            const items: Item[] = [
                { id: 'a', name: 'A', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'b', name: 'B', parentId: null, sortOrder: 1, spaceId: 'space1' },
            ];

            // Move A after B
            const result = simulateFullDragDrop(items, 'a', 'b', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['B', 'A']);
        });

        test('6.4: Swap two adjacent items reverse (A, B -> B, A via B before A)', () => {
            const items: Item[] = [
                { id: 'a', name: 'A', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'b', name: 'B', parentId: null, sortOrder: 1, spaceId: 'space1' },
            ];

            // Move B before A
            const result = simulateFullDragDrop(items, 'b', 'a', 'before', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['B', 'A']);
        });

        test('6.5: Sequential moves maintain correct order', () => {
            let items: Item[] = [
                { id: 'a', name: 'A', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'b', name: 'B', parentId: null, sortOrder: 1, spaceId: 'space1' },
                { id: 'c', name: 'C', parentId: null, sortOrder: 2, spaceId: 'space1' },
            ];

            // Move A to end: [B, C, A]
            items = simulateFullDragDrop(items, 'a', 'c', 'after', 'space1');
            expect(getItemsInOrder(items, 'space1', null)).toEqual(['B', 'C', 'A']);

            // Move A back to beginning: [A, B, C]
            items = simulateFullDragDrop(items, 'a', 'b', 'before', 'space1');
            expect(getItemsInOrder(items, 'space1', null)).toEqual(['A', 'B', 'C']);

            // Move C to middle: [A, C, B]
            items = simulateFullDragDrop(items, 'c', 'b', 'before', 'space1');
            expect(getItemsInOrder(items, 'space1', null)).toEqual(['A', 'C', 'B']);
        });

        test('6.6: Move item to position 0 in sibling list', () => {
            const items: Item[] = [
                { id: 'a', name: 'A', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'b', name: 'B', parentId: null, sortOrder: 1, spaceId: 'space1' },
                { id: 'c', name: 'C', parentId: null, sortOrder: 2, spaceId: 'space1' },
            ];

            // Move C before A (to position 0)
            const result = simulateFullDragDrop(items, 'c', 'a', 'before', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['C', 'A', 'B']);
        });

        test('6.7: Move item to last position in sibling list', () => {
            const items: Item[] = [
                { id: 'a', name: 'A', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'b', name: 'B', parentId: null, sortOrder: 1, spaceId: 'space1' },
                { id: 'c', name: 'C', parentId: null, sortOrder: 2, spaceId: 'space1' },
            ];

            // Move A after C (to last position)
            const result = simulateFullDragDrop(items, 'a', 'c', 'after', 'space1');
            expect(getItemsInOrder(result, 'space1', null)).toEqual(['B', 'C', 'A']);
        });
    });

    // ===========================================
    // SCENARIO 7: Complex Multi-Operation Sequences
    // ===========================================

    describe('Scenario 7: Complex Multi-Operation Sequences', () => {
        test('7.1: Multiple items moved in sequence', () => {
            let items: Item[] = [
                { id: 'a', name: 'A', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'b', name: 'B', parentId: null, sortOrder: 1, spaceId: 'space1' },
                { id: 'c', name: 'C', parentId: null, sortOrder: 2, spaceId: 'space1' },
                { id: 'd', name: 'D', parentId: null, sortOrder: 3, spaceId: 'space1' },
                { id: 'e', name: 'E', parentId: null, sortOrder: 4, spaceId: 'space1' },
            ];

            // Move E to position 1: [A, E, B, C, D]
            items = simulateFullDragDrop(items, 'e', 'b', 'before', 'space1');
            expect(getItemsInOrder(items, 'space1', null)).toEqual(['A', 'E', 'B', 'C', 'D']);

            // Move A to position 3: [E, B, C, A, D]
            items = simulateFullDragDrop(items, 'a', 'c', 'after', 'space1');
            expect(getItemsInOrder(items, 'space1', null)).toEqual(['E', 'B', 'C', 'A', 'D']);

            // Move D to position 0: [D, E, B, C, A]
            items = simulateFullDragDrop(items, 'd', 'e', 'before', 'space1');
            expect(getItemsInOrder(items, 'space1', null)).toEqual(['D', 'E', 'B', 'C', 'A']);
        });

        test('7.2: Move items between folders in sequence', () => {
            let items: Item[] = [
                { id: 'folder1', name: 'F1', parentId: null, sortOrder: 0, spaceId: 'space1' },
                { id: 'folder2', name: 'F2', parentId: null, sortOrder: 1, spaceId: 'space1' },
                { id: 'a', name: 'A', parentId: 'folder1', sortOrder: 0, spaceId: 'space1' },
                { id: 'b', name: 'B', parentId: 'folder1', sortOrder: 1, spaceId: 'space1' },
                { id: 'x', name: 'X', parentId: 'folder2', sortOrder: 0, spaceId: 'space1' },
            ];

            // Move A to folder2
            items = simulateFullDragDrop(items, 'a', 'folder2', 'inside', 'space1');
            expect(getItemsInOrder(items, 'space1', 'folder1')).toEqual(['B']);
            expect(getItemsInOrder(items, 'space1', 'folder2')).toEqual(['A', 'X']);

            // Move X to folder1
            items = simulateFullDragDrop(items, 'x', 'folder1', 'inside', 'space1');
            expect(getItemsInOrder(items, 'space1', 'folder1')).toEqual(['X', 'B']);
            expect(getItemsInOrder(items, 'space1', 'folder2')).toEqual(['A']);

            // Move B to root
            items = simulateFullDragDrop(items, 'b', 'folder2', 'after', 'space1');
            expect(getItemsInOrder(items, 'space1', null)).toEqual(['F1', 'F2', 'B']);
            expect(getItemsInOrder(items, 'space1', 'folder1')).toEqual(['X']);
        });
    });

    // ===========================================
    // SCENARIO 8: Position Calculation Unit Tests
    // ===========================================

    describe('Scenario 8: Frontend Position Calculation Unit Tests', () => {
        test('8.1: before - same parent, dragged < target', () => {
            // [A(0), B(1), C(2)] - drag A before C
            // After removal of A: [B(0), C(1)]
            // Insert before C (now at 1) -> position 1
            // But we calculate this BEFORE removal, so target is still at 2
            // Adjustment: 2 - 1 = 1
            expect(calculateFrontendPosition(0, 2, 'before', true)).toBe(1);
        });

        test('8.2: before - same parent, dragged > target', () => {
            // [A(0), B(1), C(2)] - drag C before A
            // No adjustment needed: position 0
            expect(calculateFrontendPosition(2, 0, 'before', true)).toBe(0);
        });

        test('8.3: after - same parent, dragged < target', () => {
            // [A(0), B(1), C(2)] - drag A after C
            // After removal of A: [B(0), C(1)]
            // Insert after C (now at 1) -> position 2
            // But we calculate this BEFORE removal, so target is still at 2
            // Adjustment: 2 (not 3)
            expect(calculateFrontendPosition(0, 2, 'after', true)).toBe(2);
        });

        test('8.4: after - same parent, dragged > target', () => {
            // [A(0), B(1), C(2)] - drag C after A
            // No adjustment needed: position 1
            expect(calculateFrontendPosition(2, 0, 'after', true)).toBe(1);
        });

        test('8.5: before - different parent', () => {
            // No adjustment needed for different parent
            expect(calculateFrontendPosition(0, 2, 'before', false)).toBe(2);
        });

        test('8.6: after - different parent', () => {
            // No adjustment needed for different parent
            expect(calculateFrontendPosition(0, 2, 'after', false)).toBe(3);
        });

        test('8.7: inside - always returns 0', () => {
            expect(calculateFrontendPosition(0, 2, 'inside', true)).toBe(0);
            expect(calculateFrontendPosition(2, 0, 'inside', false)).toBe(0);
        });
    });
});
