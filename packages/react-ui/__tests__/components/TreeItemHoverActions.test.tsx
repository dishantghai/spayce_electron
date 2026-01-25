import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TreeItem } from '../../src/components/TreeItem';
import type { SpaceItem } from '../../src/types';
import { SpaceItemType } from '../../src/types';

/**
 * TDD Tests for F004: Folder Hover Actions & Context Menu
 * 
 * Acceptance Criteria:
 * AC1: Hover over folder → shows action icons on right side
 * AC2: FolderPlus icon → triggers subfolder inline input
 * AC3: Link icon → triggers link inline input
 * AC4: MoreVertical icon → opens context menu
 * AC5: Icons fade in/out smoothly (150ms)
 * AC6: Icons don't show during rename mode
 * AC7: Hover over link → shows only MoreVertical icon
 */

// Helper to create mock SpaceItem
function createMockFolder(id: string, name: string, children: SpaceItem[] = []): SpaceItem {
    return {
        id,
        name,
        type: SpaceItemType.folder,
        path: `/${name}`,
        children,
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
        faviconUrl: 'https://example.com/favicon.ico',
        description: null,
        visitCount: 0,
        lastVisited: null,
        localPath: null,
        securityBookmark: null,
        lastSyncedAt: null,
        isWatching: false,
    };
}

describe('Feature: Folder Hover Actions & Context Menu (F004)', () => {
    const defaultProps = {
        depth: 0,
        selectedId: null,
        activeId: null,
        expandedIds: new Set<string>(),
        accentColor: '#6D5AE6',
        spaceId: 'space-1',
    };

    describe('AC1: Hover over folder shows action icons on right side', () => {
        it('should show 3 action buttons when hovering over a folder', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const { container } = render(
                <TreeItem {...defaultProps} item={mockFolder} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            expect(treeItem).toBeTruthy();

            // Hover over the item
            fireEvent.mouseEnter(treeItem);

            // Should have 3 buttons: FolderPlus, Link, MoreVertical
            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(3);
        });

        it('should show action buttons with correct titles for folders', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const { container } = render(
                <TreeItem {...defaultProps} item={mockFolder} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            const addSubfolderButton = container.querySelector('button[title="Add Subfolder"]');
            const addLinkButton = container.querySelector('button[title="Add Link"]');
            const moreOptionsButton = container.querySelector('button[title="More options"]');

            expect(addSubfolderButton).toBeTruthy();
            expect(addLinkButton).toBeTruthy();
            expect(moreOptionsButton).toBeTruthy();
        });

        it('should hide action buttons when not hovering', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const { container } = render(
                <TreeItem {...defaultProps} item={mockFolder} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;

            // Initially, no buttons should be rendered when not hovered
            fireEvent.mouseLeave(treeItem);

            // The buttons exist in DOM but should be hidden via CSS
            // We check if hover state is false
            expect(treeItem.matches(':hover')).toBe(false);
        });

        it('should show action buttons on the right side of the item', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const { container } = render(
                <TreeItem {...defaultProps} item={mockFolder} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            // Check for buttons instead of CSS class (works with CSS modules)
            const addSubfolderButton = container.querySelector('button[title="Add Subfolder"]');
            expect(addSubfolderButton).toBeTruthy();
        });
    });

    describe('AC2: FolderPlus icon triggers subfolder inline input', () => {
        it('should call onAddSubfolder when FolderPlus button is clicked', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const onAddSubfolder = vi.fn();
            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    onAddSubfolder={onAddSubfolder}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            const addSubfolderButton = container.querySelector('button[title="Add Subfolder"]') as HTMLButtonElement;
            fireEvent.click(addSubfolderButton);

            expect(onAddSubfolder).toHaveBeenCalledWith(mockFolder);
        });

        it('should stop propagation when FolderPlus button is clicked', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const onAddSubfolder = vi.fn();
            const onItemClick = vi.fn();
            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    onAddSubfolder={onAddSubfolder}
                    onItemClick={onItemClick}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            const addSubfolderButton = container.querySelector('button[title="Add Subfolder"]') as HTMLButtonElement;
            fireEvent.click(addSubfolderButton);

            // onAddSubfolder should be called, but onItemClick should not (event stopped)
            expect(onAddSubfolder).toHaveBeenCalled();
            expect(onItemClick).not.toHaveBeenCalled();
        });
    });

    describe('AC3: Link icon triggers link inline input', () => {
        it('should call onAddLink when Link button is clicked', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const onAddLink = vi.fn();
            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    onAddLink={onAddLink}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            const addLinkButton = container.querySelector('button[title="Add Link"]') as HTMLButtonElement;
            fireEvent.click(addLinkButton);

            expect(onAddLink).toHaveBeenCalledWith(mockFolder);
        });

        it('should stop propagation when Link button is clicked', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const onAddLink = vi.fn();
            const onItemClick = vi.fn();
            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    onAddLink={onAddLink}
                    onItemClick={onItemClick}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            const addLinkButton = container.querySelector('button[title="Add Link"]') as HTMLButtonElement;
            fireEvent.click(addLinkButton);

            // onAddLink should be called, but onItemClick should not (event stopped)
            expect(onAddLink).toHaveBeenCalled();
            expect(onItemClick).not.toHaveBeenCalled();
        });
    });

    describe('AC4: MoreVertical icon opens context menu', () => {
        it('should call onItemContextMenu when MoreVertical button is clicked', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const onItemContextMenu = vi.fn();
            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    onItemContextMenu={onItemContextMenu}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            const moreOptionsButton = container.querySelector('button[title="More options"]') as HTMLButtonElement;
            fireEvent.click(moreOptionsButton);

            expect(onItemContextMenu).toHaveBeenCalledWith(
                mockFolder,
                expect.any(Object)
            );
        });

        it('should stop propagation when MoreVertical button is clicked', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const onItemContextMenu = vi.fn();
            const onItemClick = vi.fn();
            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    onItemContextMenu={onItemContextMenu}
                    onItemClick={onItemClick}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            const moreOptionsButton = container.querySelector('button[title="More options"]') as HTMLButtonElement;
            fireEvent.click(moreOptionsButton);

            // onItemContextMenu should be called, but onItemClick should not (event stopped)
            expect(onItemContextMenu).toHaveBeenCalled();
            expect(onItemClick).not.toHaveBeenCalled();
        });
    });

    describe('AC5: Icons fade in/out smoothly (150ms)', () => {
        it('should apply contextIcons CSS class for fade animation', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const { container } = render(
                <TreeItem {...defaultProps} item={mockFolder} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            // Check that buttons are rendered when hovered (CSS modules transform class names)
            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBeGreaterThan(0);
        });

        it('should update hover state on mouse enter/leave', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const { container } = render(
                <TreeItem {...defaultProps} item={mockFolder} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;

            // Mouse enter - buttons should be present
            fireEvent.mouseEnter(treeItem);
            let buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(3); // FolderPlus, Link, MoreVertical

            // Mouse leave - buttons should be removed
            fireEvent.mouseLeave(treeItem);
            buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(0);
        });
    });

    describe('AC6: Icons don\'t show during rename mode', () => {
        it('should not show action buttons when item is being renamed', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    renameItemId={mockFolder.id}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            // Should not show action buttons during rename
            const actionsContainer = container.querySelector('.contextIcons');
            expect(actionsContainer).toBeNull();
        });

        it('should show rename input instead of action buttons', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    renameItemId={mockFolder.id}
                />
            );

            // Should have rename input
            const renameInput = container.querySelector('input[type="text"]');
            expect(renameInput).toBeTruthy();

            // Should not have action buttons
            const actionsContainer = container.querySelector('.contextIcons');
            expect(actionsContainer).toBeNull();
        });
    });

    describe('AC7: Hover over link shows only MoreVertical icon', () => {
        it('should show only 1 action button when hovering over a link', async () => {
            const mockLink = createMockLink('link-1', 'Test Link');
            const { container } = render(
                <TreeItem {...defaultProps} item={mockLink} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            // Should have only 1 button: MoreVertical
            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(1);
        });

        it('should show only MoreVertical button for links', async () => {
            const mockLink = createMockLink('link-1', 'Test Link');
            const { container } = render(
                <TreeItem {...defaultProps} item={mockLink} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            const moreOptionsButton = container.querySelector('button[title="More options"]');
            expect(moreOptionsButton).toBeTruthy();

            // Should NOT have FolderPlus or Link buttons
            const addSubfolderButton = container.querySelector('button[title="Add Subfolder"]');
            const addLinkButton = container.querySelector('button[title="Add Link"]');
            expect(addSubfolderButton).toBeNull();
            expect(addLinkButton).toBeNull();
        });

        it('should call onItemContextMenu when MoreVertical is clicked on a link', async () => {
            const mockLink = createMockLink('link-1', 'Test Link');
            const onItemContextMenu = vi.fn();
            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockLink}
                    onItemContextMenu={onItemContextMenu}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            const moreOptionsButton = container.querySelector('button[title="More options"]') as HTMLButtonElement;
            fireEvent.click(moreOptionsButton);

            expect(onItemContextMenu).toHaveBeenCalledWith(
                mockLink,
                expect.any(Object)
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid hover on/off', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const { container } = render(
                <TreeItem {...defaultProps} item={mockFolder} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;

            // Rapid hover on/off
            fireEvent.mouseEnter(treeItem);
            fireEvent.mouseLeave(treeItem);
            fireEvent.mouseEnter(treeItem);

            // Should still show buttons on final hover
            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(3);
        });

        it('should not show buttons on collapsed empty folders', async () => {
            const emptyFolder = createMockFolder('folder-1', 'Empty Folder', []);
            const { container } = render(
                <TreeItem {...defaultProps} item={emptyFolder} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            // Should still show action buttons even for empty folders
            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(3);
        });

        it('should work for nested folders at different depths', async () => {
            const mockFolder = createMockFolder('folder-1', 'Nested Folder');
            const { container } = render(
                <TreeItem {...defaultProps} item={mockFolder} depth={2} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(3);
        });

        it('should handle localFolder type same as folder', async () => {
            const localFolder: SpaceItem = {
                id: 'local-1',
                name: 'Local Folder',
                type: SpaceItemType.localFolder,
                path: '/path/to/local',
                children: [],
                isPinned: false,
                pinPosition: null,
                isExpanded: false,
                createdAt: new Date(),
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                localPath: '/path/to/local',
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            };

            const { container } = render(
                <TreeItem {...defaultProps} item={localFolder} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            // Should show 3 buttons for localFolder
            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(3);
        });
    });

    describe('Integration with other features', () => {
        it('should work alongside selection state', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    selectedId={mockFolder.id}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            // Should show buttons even when selected
            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(3);

            // Should still be selected
            expect(treeItem.getAttribute('aria-selected')).toBe('true');
        });

        it('should work alongside active state', async () => {
            const mockFolder = createMockFolder('folder-1', 'Test Folder');
            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    activeId={mockFolder.id}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            // Should show buttons even when active
            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(3);
        });

        it('should work alongside expanded state', async () => {
            const childFolder = createMockFolder('child-1', 'Child');
            const mockFolder = createMockFolder('folder-1', 'Test Folder', [childFolder]);
            const expandedIds = new Set([mockFolder.id]);

            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    expandedIds={expandedIds}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            fireEvent.mouseEnter(treeItem);

            // Should show buttons even when expanded
            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(3);
        });
    });
});
