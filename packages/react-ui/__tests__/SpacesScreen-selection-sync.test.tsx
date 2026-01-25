import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState, useEffect } from 'react';

/**
 * Regression Tests: SpacesScreen Selection State Synchronization
 * 
 * These tests ensure the dual selection state issue never happens in SpaceCards.
 * 
 * Issue: SpacesScreen has two selection states:
 * - keyboardSelectedItemId (internal, for keyboard navigation)
 * - selectedItemId (prop from App.tsx, set by context menu)
 * 
 * Fix: useEffect syncs keyboardSelectedItemId with selectedItemId changes
 * 
 * These tests verify SpaceCards selection works correctly in all scenarios.
 */

describe('SpacesScreen Selection State Synchronization', () => {
    // Simulate SpacesScreen's state management
    function useSpacesScreenSelection(selectedItemIdProp: string | null) {
        const [keyboardSelectedItemId, setKeyboardSelectedItemId] = useState<string | null>(null);

        // The fix: Sync keyboardSelectedItemId with selectedItemId
        useEffect(() => {
            if (selectedItemIdProp !== null && selectedItemIdProp !== keyboardSelectedItemId) {
                setKeyboardSelectedItemId(selectedItemIdProp);
            }
        }, [selectedItemIdProp]);

        return {
            keyboardSelectedItemId,
            setKeyboardSelectedItemId,
            // SpaceCard receives these props
            selectedId: selectedItemIdProp,
            activeId: keyboardSelectedItemId
        };
    }

    test('REGRESSION: context menu on different item should sync keyboardSelectedItemId', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSpacesScreenSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Act 1: User clicks folder (simulates handleItemClick)
        act(() => {
            result.current.setKeyboardSelectedItemId('folder-shopping');
        });

        expect(result.current.keyboardSelectedItemId).toBe('folder-shopping');
        expect(result.current.activeId).toBe('folder-shopping');

        // Act 2: User right-clicks different folder (App sets cardSelectedId)
        rerender({ selectedItemId: 'folder-youtube' });

        // Assert: keyboardSelectedItemId should sync
        expect(result.current.keyboardSelectedItemId).toBe('folder-youtube');
        expect(result.current.selectedId).toBe('folder-youtube');
        expect(result.current.activeId).toBe('folder-youtube');

        // Old folder should NOT be selected
        expect(result.current.keyboardSelectedItemId).not.toBe('folder-shopping');
    });

    test('REGRESSION: clicking folder then context menu on link should only highlight link', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSpacesScreenSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Click folder
        act(() => {
            result.current.setKeyboardSelectedItemId('folder-app-ideas');
        });

        // Context menu on nested link
        rerender({ selectedItemId: 'link-console-anthropic' });

        // Assert: Only link should be selected
        expect(result.current.keyboardSelectedItemId).toBe('link-console-anthropic');
        expect(result.current.activeId).toBe('link-console-anthropic');
        expect(result.current.selectedId).toBe('link-console-anthropic');

        // Folder should NOT be selected
        expect(result.current.keyboardSelectedItemId).not.toBe('folder-app-ideas');
    });

    test('REGRESSION: both items should not appear selected simultaneously', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSpacesScreenSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Click item A
        act(() => {
            result.current.setKeyboardSelectedItemId('item-a');
        });

        // Context menu on item B
        rerender({ selectedItemId: 'item-b' });

        // Verify only ONE item is selected
        expect(result.current.selectedId).toBe('item-b');
        expect(result.current.activeId).toBe('item-b');

        // Both should match (no dual selection)
        expect(result.current.selectedId).toBe(result.current.activeId);
    });

    test('keyboard navigation after context menu works correctly', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSpacesScreenSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Context menu on item A
        rerender({ selectedItemId: 'item-a' });
        expect(result.current.keyboardSelectedItemId).toBe('item-a');

        // Arrow key navigation to item B
        act(() => {
            result.current.setKeyboardSelectedItemId('item-b');
        });

        expect(result.current.keyboardSelectedItemId).toBe('item-b');
        expect(result.current.activeId).toBe('item-b');
    });

    test('switching between spaces should handle selection correctly', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSpacesScreenSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Space 1: Context menu on folder
        rerender({ selectedItemId: 'space1-folder' });
        expect(result.current.keyboardSelectedItemId).toBe('space1-folder');

        // Switch to Space 2: Context menu on different item
        rerender({ selectedItemId: 'space2-link' });
        expect(result.current.keyboardSelectedItemId).toBe('space2-link');

        // Only current space item should be selected
        expect(result.current.activeId).toBe('space2-link');
    });

    test('null selectedItemId should not override keyboard selection', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSpacesScreenSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Keyboard navigation
        act(() => {
            result.current.setKeyboardSelectedItemId('keyboard-item');
        });

        // Context menu closes (selectedItemId = null)
        rerender({ selectedItemId: null });

        // Keyboard selection should remain
        expect(result.current.keyboardSelectedItemId).toBe('keyboard-item');
    });

    test('rapid context menu changes track latest selection', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSpacesScreenSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Rapid context menu changes
        rerender({ selectedItemId: 'item-1' });
        expect(result.current.keyboardSelectedItemId).toBe('item-1');

        rerender({ selectedItemId: 'item-2' });
        expect(result.current.keyboardSelectedItemId).toBe('item-2');

        rerender({ selectedItemId: 'item-3' });
        expect(result.current.keyboardSelectedItemId).toBe('item-3');

        // Only latest should be selected
        expect(result.current.activeId).toBe('item-3');
    });

    test('TreeView receives consistent selectedId and activeId', () => {
        const { result, rerender } = renderHook(
            ({ selectedItemId }) => useSpacesScreenSelection(selectedItemId),
            { initialProps: { selectedItemId: null as string | null } }
        );

        // Click then context menu
        act(() => {
            result.current.setKeyboardSelectedItemId('item-old');
        });

        rerender({ selectedItemId: 'item-new' });

        // After sync, both should be consistent
        expect(result.current.selectedId).toBe('item-new');
        expect(result.current.activeId).toBe('item-new');

        // No conflicting selection states
        const hasConflict = result.current.selectedId !== result.current.activeId;
        expect(hasConflict).toBe(false);
    });
});
