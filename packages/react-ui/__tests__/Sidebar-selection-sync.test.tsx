import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState, useEffect } from 'react';

/**
 * Regression Tests: Sidebar Selection State Synchronization
 * 
 * These tests ensure the dual selection state issue never happens again.
 * 
 * Issue: Sidebar has two selection states:
 * - focusedItemId (internal, for keyboard navigation)
 * - selectedItemId (prop from App.tsx, set by context menu)
 * 
 * Fix: useEffect syncs focusedItemId with selectedItemId changes
 * 
 * These tests verify the synchronization works correctly in all scenarios.
 */

describe('Sidebar Selection State Synchronization', () => {
    // Simulate Sidebar's state management
    function useSidebarSelection(selectedItemIdProp: string | null) {
        const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

        // The fix: Sync focusedItemId with selectedItemId
        useEffect(() => {
            if (selectedItemIdProp !== null && selectedItemIdProp !== focusedItemId) {
                setFocusedItemId(selectedItemIdProp);
            }
        }, [selectedItemIdProp]);

        // Calculate what TreeView receives
        const effectiveSelectedId = focusedItemId || selectedItemIdProp;
        const effectiveActiveId = focusedItemId;

        return { focusedItemId, setFocusedItemId, effectiveSelectedId, effectiveActiveId };
    }

    test('REGRESSION: context menu on different folder should sync focusedItemId', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSidebarSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Act 1: User clicks folder A (simulates handleItemClick)
        act(() => {
            result.current.setFocusedItemId('folder-ai-providers');
        });

        expect(result.current.focusedItemId).toBe('folder-ai-providers');
        expect(result.current.effectiveSelectedId).toBe('folder-ai-providers');

        // Act 2: User right-clicks folder B (App sets selectedItemId via context menu)
        rerender({ selectedItemId: 'folder-youtube' });

        // Assert: focusedItemId should sync to selectedItemId
        expect(result.current.focusedItemId).toBe('folder-youtube');
        expect(result.current.effectiveSelectedId).toBe('folder-youtube');
        expect(result.current.effectiveActiveId).toBe('folder-youtube');

        // OLD folder should NOT be selected anymore
        expect(result.current.focusedItemId).not.toBe('folder-ai-providers');
    });

    test('REGRESSION: only context menu folder should be selected', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSidebarSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Arrange: Click folder A
        act(() => {
            result.current.setFocusedItemId('folder-app-ideas');
        });

        // Act: Context menu on folder B
        rerender({ selectedItemId: 'folder-good-work' });

        // Assert: Only folder B should be in effectiveSelectedId
        expect(result.current.effectiveSelectedId).toBe('folder-good-work');

        // Verify no dual selection
        const isFolderASelected = result.current.effectiveSelectedId === 'folder-app-ideas';
        const isFolderBSelected = result.current.effectiveSelectedId === 'folder-good-work';

        expect(isFolderASelected).toBe(false);
        expect(isFolderBSelected).toBe(true);
    });

    test('keyboard navigation after context menu should work correctly', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSidebarSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Context menu on folder A
        rerender({ selectedItemId: 'folder-a' });
        expect(result.current.focusedItemId).toBe('folder-a');

        // User presses arrow key to navigate to folder B
        act(() => {
            result.current.setFocusedItemId('folder-b');
        });

        expect(result.current.effectiveSelectedId).toBe('folder-b');
        expect(result.current.focusedItemId).toBe('folder-b');
    });

    test('clicking item after context menu should update selection', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSidebarSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Context menu on folder A
        rerender({ selectedItemId: 'folder-a' });
        expect(result.current.focusedItemId).toBe('folder-a');

        // User clicks folder B (handleItemClick)
        act(() => {
            result.current.setFocusedItemId('folder-b');
        });

        expect(result.current.effectiveSelectedId).toBe('folder-b');
    });

    test('selectedItemId becomes null should not override focusedItemId', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSidebarSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // User clicks folder
        act(() => {
            result.current.setFocusedItemId('folder-clicked');
        });

        // Context menu closes (selectedItemId becomes null)
        rerender({ selectedItemId: null });

        // focusedItemId should remain - null doesn't trigger sync
        expect(result.current.focusedItemId).toBe('folder-clicked');
        expect(result.current.effectiveSelectedId).toBe('folder-clicked');
    });

    test('rapid context menu changes should track latest selection', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSidebarSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Context menu on folder A
        rerender({ selectedItemId: 'folder-a' });
        expect(result.current.focusedItemId).toBe('folder-a');

        // Context menu on folder B (without closing A)
        rerender({ selectedItemId: 'folder-b' });
        expect(result.current.focusedItemId).toBe('folder-b');

        // Context menu on folder C
        rerender({ selectedItemId: 'folder-c' });
        expect(result.current.focusedItemId).toBe('folder-c');

        // Only latest should be selected
        expect(result.current.effectiveSelectedId).toBe('folder-c');
    });

    test('same item selected again should not cause issues', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSidebarSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Context menu on folder A
        rerender({ selectedItemId: 'folder-a' });
        expect(result.current.focusedItemId).toBe('folder-a');

        // Context menu on same folder A again
        rerender({ selectedItemId: 'folder-a' });

        // Should still be selected (no issues)
        expect(result.current.focusedItemId).toBe('folder-a');
        expect(result.current.effectiveSelectedId).toBe('folder-a');
    });

    test('effectiveSelectedId should never show dual selection', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSidebarSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Click folder A
        act(() => {
            result.current.setFocusedItemId('folder-a');
        });

        // Context menu on folder B
        rerender({ selectedItemId: 'folder-b' });

        // After sync, effectiveSelectedId should be exactly one value
        expect(result.current.effectiveSelectedId).toBe('folder-b');
        expect(result.current.effectiveActiveId).toBe('folder-b');

        // Both should be in sync (no dual selection)
        expect(result.current.effectiveSelectedId).toBe(result.current.effectiveActiveId);
    });
});
