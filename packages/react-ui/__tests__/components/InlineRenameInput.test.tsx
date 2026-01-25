import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InlineRenameInput } from '../../src/components/InlineRenameInput';
import type { SpaceItem } from '../../src/types';
import { SpaceItemType } from '../../src/types';

/**
 * TDD Tests for F003: Inline Rename Items
 * 
 * Acceptance Criteria:
 * AC1: Context menu "Rename" → replaces item name with text input
 * AC2: Input pre-filled with current name, all text selected
 * AC3: Press Enter → saves new name
 * AC4: Press Escape → cancels, reverts to original
 * AC5: Click outside with changes → saves
 * AC6: Click outside without changes → cancels
 * AC7: Empty name not allowed (validation)
 * AC8: For links: only name changes, path (URL) preserved
 * AC9: Works in both Sidebar and SpaceCard contexts
 */

// Helper to create mock SpaceItem
function createMockFolder(id: string, name: string): SpaceItem {
    return {
        id,
        name,
        type: SpaceItemType.folder,
        path: name,
        children: [],
        isPinned: false,
        pinPosition: null,
        isExpanded: false,
        createdAt: new Date(),
        faviconUrl: null,
        description: null,
        visitCount: 0,
        lastVisited: null,
        localPath: null,
        securityBookmark: null,
        lastSyncedAt: null,
        isWatching: false,
    };
}

function createMockLink(id: string, name: string, url: string = 'https://example.com'): SpaceItem {
    return {
        id,
        name,
        type: SpaceItemType.link,
        path: url,
        children: [],
        isPinned: false,
        pinPosition: null,
        isExpanded: false,
        createdAt: new Date(),
        faviconUrl: null,
        description: null,
        visitCount: 0,
        lastVisited: null,
        localPath: null,
        securityBookmark: null,
        lastSyncedAt: null,
        isWatching: false,
    };
}

describe('Feature: Inline Rename Items (F003)', () => {
    describe('AC1: Context menu "Rename" replaces item name with text input', () => {
        it('should render an input element when InlineRenameInput is mounted', () => {
            const mockItem = createMockFolder('folder-1', 'My Folder');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            expect(input).toBeTruthy();
        });

        it('should replace the item name display with editable input', () => {
            const mockItem = createMockFolder('folder-1', 'Original Name');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox') as HTMLInputElement;
            expect(input.value).toBe('Original Name');
        });
    });

    describe('AC2: Input pre-filled with current name, all text selected', () => {
        it('should pre-fill input with current item name', () => {
            const mockItem = createMockFolder('folder-1', 'Test Folder Name');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox') as HTMLInputElement;
            expect(input.value).toBe('Test Folder Name');
        });

        it('should auto-focus the input on mount', async () => {
            const mockItem = createMockFolder('folder-1', 'My Folder');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            await waitFor(() => {
                const input = screen.getByRole('textbox');
                expect(document.activeElement).toBe(input);
            });
        });

        it('should select all text on mount', async () => {
            const mockItem = createMockFolder('folder-1', 'Select Me');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            await waitFor(() => {
                const input = screen.getByRole('textbox') as HTMLInputElement;
                expect(input.selectionStart).toBe(0);
                expect(input.selectionEnd).toBe('Select Me'.length);
            });
        });
    });

    describe('AC3: Press Enter saves new name', () => {
        it('should call onSave with new name when Enter is pressed', async () => {
            const mockItem = createMockFolder('folder-1', 'Old Name');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: 'New Name' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onSave).toHaveBeenCalledWith('New Name');
        });

        it('should trim whitespace from new name before saving', async () => {
            const mockItem = createMockFolder('folder-1', 'Old Name');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: '  New Name  ' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onSave).toHaveBeenCalledWith('New Name');
        });

        it('should not call onSave if name is unchanged', async () => {
            const mockItem = createMockFolder('folder-1', 'Same Name');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onSave).not.toHaveBeenCalled();
            expect(onCancel).toHaveBeenCalled();
        });
    });

    describe('AC4: Press Escape cancels, reverts to original', () => {
        it('should call onCancel when Escape is pressed', async () => {
            const mockItem = createMockFolder('folder-1', 'Original Name');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: 'Changed Name' } });
            fireEvent.keyDown(input, { key: 'Escape' });

            expect(onCancel).toHaveBeenCalled();
            expect(onSave).not.toHaveBeenCalled();
        });

        it('should not save changes when Escape is pressed', async () => {
            const mockItem = createMockFolder('folder-1', 'Original');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: 'New Value' } });
            fireEvent.keyDown(input, { key: 'Escape' });

            expect(onSave).not.toHaveBeenCalled();
        });
    });

    describe('AC5: Click outside with changes saves', () => {
        it('should call onSave when input loses focus with changes', async () => {
            const mockItem = createMockFolder('folder-1', 'Original');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: 'Changed' } });
            fireEvent.blur(input);

            expect(onSave).toHaveBeenCalledWith('Changed');
        });
    });

    describe('AC6: Click outside without changes cancels', () => {
        it('should call onCancel when input loses focus without changes', async () => {
            const mockItem = createMockFolder('folder-1', 'Same Name');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.blur(input);

            expect(onCancel).toHaveBeenCalled();
            expect(onSave).not.toHaveBeenCalled();
        });

        it('should call onCancel when blur with only whitespace changes', async () => {
            const mockItem = createMockFolder('folder-1', 'Test');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: '  Test  ' } });
            fireEvent.blur(input);

            // Trimmed value is same as original, so should cancel
            expect(onCancel).toHaveBeenCalled();
            expect(onSave).not.toHaveBeenCalled();
        });
    });

    describe('AC7: Empty name not allowed (validation)', () => {
        it('should call onCancel when trying to save empty name', async () => {
            const mockItem = createMockFolder('folder-1', 'Original Name');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onCancel).toHaveBeenCalled();
            expect(onSave).not.toHaveBeenCalled();
        });

        it('should call onCancel when name is only whitespace', async () => {
            const mockItem = createMockFolder('folder-1', 'Original');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: '   ' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onCancel).toHaveBeenCalled();
            expect(onSave).not.toHaveBeenCalled();
        });

        it('should not save empty name on blur', async () => {
            const mockItem = createMockFolder('folder-1', 'Original');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.blur(input);

            expect(onCancel).toHaveBeenCalled();
            expect(onSave).not.toHaveBeenCalled();
        });
    });

    describe('AC8: For links - only name changes, path (URL) preserved', () => {
        it('should only pass new name to onSave, not modify URL', async () => {
            const mockLink = createMockLink('link-1', 'Google', 'https://google.com');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockLink}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            // Verify initial value is the name, not URL
            expect((input as HTMLInputElement).value).toBe('Google');

            fireEvent.change(input, { target: { value: 'Search Engine' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            // onSave only receives new name, URL preservation is handled by parent
            expect(onSave).toHaveBeenCalledWith('Search Engine');
        });

        it('should display link name in input, not URL', () => {
            const mockLink = createMockLink('link-1', 'My Website', 'https://example.com/path');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockLink}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox') as HTMLInputElement;
            expect(input.value).toBe('My Website');
            expect(input.value).not.toBe('https://example.com/path');
        });
    });

    describe('AC9: Works in both Sidebar and SpaceCard contexts', () => {
        it('should work correctly with folder items', () => {
            const mockFolder = createMockFolder('folder-1', 'Sidebar Folder');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockFolder}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: 'Renamed Folder' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onSave).toHaveBeenCalledWith('Renamed Folder');
        });

        it('should work correctly with link items', () => {
            const mockLink = createMockLink('link-1', 'Card Link', 'https://test.com');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockLink}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: 'Renamed Link' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onSave).toHaveBeenCalledWith('Renamed Link');
        });
    });

    describe('Edge Cases', () => {
        it('should handle special characters in name', async () => {
            const mockItem = createMockFolder('folder-1', 'Normal');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: 'Folder & Files <test>' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onSave).toHaveBeenCalledWith('Folder & Files <test>');
        });

        it('should handle unicode characters in name', async () => {
            const mockItem = createMockFolder('folder-1', 'Normal');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: '文件夹 📁' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onSave).toHaveBeenCalledWith('文件夹 📁');
        });

        it('should handle very long names', async () => {
            const mockItem = createMockFolder('folder-1', 'Short');
            const onSave = vi.fn();
            const onCancel = vi.fn();
            const longName = 'A'.repeat(255);

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: longName } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onSave).toHaveBeenCalledWith(longName);
        });

        it('should prevent double submission', async () => {
            const mockItem = createMockFolder('folder-1', 'Original');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: 'New Name' } });

            // Rapid double Enter press
            fireEvent.keyDown(input, { key: 'Enter' });
            fireEvent.keyDown(input, { key: 'Enter' });

            // Should only save once
            expect(onSave).toHaveBeenCalledTimes(1);
        });
    });

    describe('Styling and Design System', () => {
        it('should render with correct CSS class', () => {
            const mockItem = createMockFolder('folder-1', 'Test');
            const onSave = vi.fn();
            const onCancel = vi.fn();

            const { container } = render(
                <InlineRenameInput
                    item={mockItem}
                    onSave={onSave}
                    onCancel={onCancel}
                />
            );

            const input = container.querySelector('input');
            expect(input?.className).toContain('renameInput');
        });
    });
});
