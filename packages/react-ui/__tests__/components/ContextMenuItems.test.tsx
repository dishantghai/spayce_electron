import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContextMenu, ContextMenuItem } from '../../src/components/ContextMenu';
import {
    FolderPlus,
    Link,
    Pencil,
    Copy,
    Link2,
    Trash2,
    Pin,
    PinOff,
    FolderInput,
    FileInput,
    PanelLeft
} from 'lucide-react';

/**
 * TDD Tests for F004: Context Menu Items
 * 
 * Acceptance Criteria:
 * AC1: Context menu renders correct items for folders
 * AC2: Context menu renders correct items for links
 * AC3: Context menu actions execute correctly
 * AC4: Disabled items are not clickable
 * AC5: Destructive items are styled differently
 */

describe('Feature: Context Menu Items (F004)', () => {
    const defaultPosition = { x: 100, y: 100 };

    describe('AC1: Context menu renders correct items for folders', () => {
        it('should render all folder context menu items', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'new_folder', label: 'New Nested Folder', icon: FolderPlus },
                { id: 'add_link', label: 'Add Link', icon: Link },
                { id: 'divider1', label: '', icon: FolderPlus, isDivider: true },
                { id: 'import_folder', label: 'Import Local Folder', icon: FolderInput, isDisabled: true },
                { id: 'import_file', label: 'Import Local File', icon: FileInput, isDisabled: true },
                { id: 'divider2', label: '', icon: FolderPlus, isDivider: true },
                { id: 'rename', label: 'Rename', icon: Pencil },
                { id: 'copy_folder', label: 'Copy Folder', icon: Copy },
                { id: 'copy_links', label: 'Copy All Links', icon: Link2 },
                { id: 'divider3', label: '', icon: FolderPlus, isDivider: true },
                { id: 'open_workspace', label: 'Open in Workspace', icon: PanelLeft, isDisabled: true },
                { id: 'delete', label: 'Delete', icon: Trash2, isDestructive: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            // Check for key menu items
            expect(screen.getByText('New Nested Folder')).toBeTruthy();
            expect(screen.getByText('Add Link')).toBeTruthy();
            expect(screen.getByText('Rename')).toBeTruthy();
            expect(screen.getByText('Copy Folder')).toBeTruthy();
            expect(screen.getByText('Copy All Links')).toBeTruthy();
            expect(screen.getByText('Delete')).toBeTruthy();
        });

        it('should render dividers between menu sections', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'new_folder', label: 'New Nested Folder', icon: FolderPlus },
                { id: 'divider1', label: '', icon: FolderPlus, isDivider: true },
                { id: 'rename', label: 'Rename', icon: Pencil },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            // ContextMenu uses createPortal to document.body, so query from document
            const menu = document.querySelector('[role="menu"]');
            const menuItems = document.querySelectorAll('[role="menuitem"]');
            expect(menuItems.length).toBe(2); // 2 menu items, 1 divider is a div not a menuitem
            // Total children should be 3 (2 buttons + 1 divider div)
            expect(menu?.children.length).toBe(3);
        });

        it('should mark disabled items as not clickable', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'import_folder', label: 'Import Local Folder', icon: FolderInput, isDisabled: true },
                { id: 'import_file', label: 'Import Local File', icon: FileInput, isDisabled: true },
                { id: 'open_workspace', label: 'Open in Workspace', icon: PanelLeft, isDisabled: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const importFolderButton = screen.getByText('Import Local Folder').closest('button');
            const importFileButton = screen.getByText('Import Local File').closest('button');
            const openWorkspaceButton = screen.getByText('Open in Workspace').closest('button');

            expect(importFolderButton?.hasAttribute('disabled')).toBe(true);
            expect(importFileButton?.hasAttribute('disabled')).toBe(true);
            expect(openWorkspaceButton?.hasAttribute('disabled')).toBe(true);
        });

        it('should mark Delete as destructive', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'delete', label: 'Delete', icon: Trash2, isDestructive: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            const { container } = render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const deleteButton = screen.getByText('Delete').closest('button');
            expect(deleteButton?.className).toContain('menuItemDestructive');
        });
    });

    describe('AC2: Context menu renders correct items for links', () => {
        it('should render all link context menu items (unpinned)', () => {
            const linkMenuItems: ContextMenuItem[] = [
                { id: 'rename', label: 'Rename', icon: Pencil },
                { id: 'copy_link', label: 'Copy Link', icon: Copy },
                { id: 'divider1', label: '', icon: Pencil, isDivider: true },
                { id: 'pin', label: 'Pin to Top', icon: Pin },
                { id: 'divider2', label: '', icon: Pencil, isDivider: true },
                { id: 'remove', label: 'Remove', icon: Trash2, isDestructive: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={linkMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            expect(screen.getByText('Rename')).toBeTruthy();
            expect(screen.getByText('Copy Link')).toBeTruthy();
            expect(screen.getByText('Pin to Top')).toBeTruthy();
            expect(screen.getByText('Remove')).toBeTruthy();
        });

        it('should show Unpin option for pinned links', () => {
            const linkMenuItems: ContextMenuItem[] = [
                { id: 'rename', label: 'Rename', icon: Pencil },
                { id: 'copy_link', label: 'Copy Link', icon: Copy },
                { id: 'divider1', label: '', icon: Pencil, isDivider: true },
                { id: 'unpin', label: 'Unpin', icon: PinOff },
                { id: 'divider2', label: '', icon: Pencil, isDivider: true },
                { id: 'remove', label: 'Remove', icon: Trash2, isDestructive: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={linkMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            expect(screen.getByText('Unpin')).toBeTruthy();
        });

        it('should mark Remove as destructive for links', () => {
            const linkMenuItems: ContextMenuItem[] = [
                { id: 'remove', label: 'Remove', icon: Trash2, isDestructive: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            const { container } = render(
                <ContextMenu
                    items={linkMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const removeButton = screen.getByText('Remove').closest('button');
            expect(removeButton?.className).toContain('menuItemDestructive');
        });
    });

    describe('AC3: Context menu actions execute correctly', () => {
        it('should call onItemClick when New Nested Folder is clicked', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'new_folder', label: 'New Nested Folder', icon: FolderPlus },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('New Nested Folder');
            fireEvent.click(button);

            expect(onItemClick).toHaveBeenCalledWith('new_folder');
        });

        it('should call onItemClick when Add Link is clicked', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'add_link', label: 'Add Link', icon: Link },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Add Link');
            fireEvent.click(button);

            expect(onItemClick).toHaveBeenCalledWith('add_link');
        });

        it('should call onItemClick when Rename is clicked', () => {
            const menuItems: ContextMenuItem[] = [
                { id: 'rename', label: 'Rename', icon: Pencil },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={menuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Rename');
            fireEvent.click(button);

            expect(onItemClick).toHaveBeenCalledWith('rename');
        });

        it('should call onItemClick when Copy Folder is clicked', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'copy_folder', label: 'Copy Folder', icon: Copy },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Copy Folder');
            fireEvent.click(button);

            expect(onItemClick).toHaveBeenCalledWith('copy_folder');
        });

        it('should call onItemClick when Copy All Links is clicked', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'copy_links', label: 'Copy All Links', icon: Link2 },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Copy All Links');
            fireEvent.click(button);

            expect(onItemClick).toHaveBeenCalledWith('copy_links');
        });

        it('should call onItemClick when Delete is clicked', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'delete', label: 'Delete', icon: Trash2, isDestructive: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Delete');
            fireEvent.click(button);

            expect(onItemClick).toHaveBeenCalledWith('delete');
        });

        it('should call onItemClick when Copy Link is clicked', () => {
            const linkMenuItems: ContextMenuItem[] = [
                { id: 'copy_link', label: 'Copy Link', icon: Copy },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={linkMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Copy Link');
            fireEvent.click(button);

            expect(onItemClick).toHaveBeenCalledWith('copy_link');
        });

        it('should call onItemClick when Pin to Top is clicked', () => {
            const linkMenuItems: ContextMenuItem[] = [
                { id: 'pin', label: 'Pin to Top', icon: Pin },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={linkMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Pin to Top');
            fireEvent.click(button);

            expect(onItemClick).toHaveBeenCalledWith('pin');
        });

        it('should call onItemClick when Unpin is clicked', () => {
            const linkMenuItems: ContextMenuItem[] = [
                { id: 'unpin', label: 'Unpin', icon: PinOff },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={linkMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Unpin');
            fireEvent.click(button);

            expect(onItemClick).toHaveBeenCalledWith('unpin');
        });

        it('should call onItemClick when Remove is clicked', () => {
            const linkMenuItems: ContextMenuItem[] = [
                { id: 'remove', label: 'Remove', icon: Trash2, isDestructive: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={linkMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Remove');
            fireEvent.click(button);

            expect(onItemClick).toHaveBeenCalledWith('remove');
        });

        it('should close menu after item is clicked', () => {
            const menuItems: ContextMenuItem[] = [
                { id: 'rename', label: 'Rename', icon: Pencil },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={menuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Rename');
            fireEvent.click(button);

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('AC4: Disabled items are not clickable', () => {
        it('should not call onItemClick when disabled item is clicked', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'import_folder', label: 'Import Local Folder', icon: FolderInput, isDisabled: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Import Local Folder');
            fireEvent.click(button);

            expect(onItemClick).not.toHaveBeenCalled();
        });

        it('should apply disabled class to disabled items', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'import_folder', label: 'Import Local Folder', icon: FolderInput, isDisabled: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const button = screen.getByText('Import Local Folder').closest('button');
            expect(button?.className).toContain('menuItemDisabled');
        });
    });

    describe('AC5: Destructive items are styled differently', () => {
        it('should apply destructive class to Delete action', () => {
            const folderMenuItems: ContextMenuItem[] = [
                { id: 'delete', label: 'Delete', icon: Trash2, isDestructive: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            const { container } = render(
                <ContextMenu
                    items={folderMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const deleteButton = screen.getByText('Delete').closest('button');
            expect(deleteButton?.className).toContain('menuItemDestructive');
        });

        it('should apply destructive class to Remove action', () => {
            const linkMenuItems: ContextMenuItem[] = [
                { id: 'remove', label: 'Remove', icon: Trash2, isDestructive: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            const { container } = render(
                <ContextMenu
                    items={linkMenuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            const removeButton = screen.getByText('Remove').closest('button');
            expect(removeButton?.className).toContain('menuItemDestructive');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty menu items array', () => {
            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={[]}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            // ContextMenu uses createPortal to document.body, so query from document
            const menu = document.querySelector('[role="menu"]');
            expect(menu).toBeTruthy();
            expect(menu?.children.length).toBe(0);
        });

        it('should handle menu with only dividers', () => {
            const menuItems: ContextMenuItem[] = [
                { id: 'divider1', label: '', icon: FolderPlus, isDivider: true },
                { id: 'divider2', label: '', icon: FolderPlus, isDivider: true },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={menuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            // ContextMenu uses createPortal to document.body, so query from document
            const menu = document.querySelector('[role="menu"]');
            // Should have 2 children (2 divider divs)
            expect(menu?.children.length).toBe(2);
            // Should have no menuitem buttons
            const menuItemButtons = document.querySelectorAll('[role="menuitem"]');
            expect(menuItemButtons.length).toBe(0);
        });

        it('should close menu on Escape key', () => {
            const menuItems: ContextMenuItem[] = [
                { id: 'rename', label: 'Rename', icon: Pencil },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={menuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onClose).toHaveBeenCalled();
        });

        it('should close menu on click outside', async () => {
            const menuItems: ContextMenuItem[] = [
                { id: 'rename', label: 'Rename', icon: Pencil },
            ];

            const onItemClick = vi.fn();
            const onClose = vi.fn();

            render(
                <ContextMenu
                    items={menuItems}
                    position={defaultPosition}
                    onItemClick={onItemClick}
                    onClose={onClose}
                />
            );

            // Click outside the menu
            fireEvent.mouseDown(document.body);

            await waitFor(() => {
                expect(onClose).toHaveBeenCalled();
            });
        });
    });
});
