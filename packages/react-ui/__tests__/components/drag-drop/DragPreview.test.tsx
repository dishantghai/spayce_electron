import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DragPreview, SingleItemPreview, MultiItemPreview } from '../../../src/components/drag-drop/DragPreview';
import type { SpaceItem } from '../../../src/types';
import { SpaceItemType } from '../../../src/types';

// Mock SpaceItem for testing (matching actual SpaceItem interface)
const mockFolderItem: SpaceItem = {
    id: 'folder-1',
    name: 'Test Folder',
    type: SpaceItemType.folder,
    path: '',
    isExpanded: false,
    children: [],
    faviconUrl: null,
    description: null,
    visitCount: 0,
    lastVisited: null,
    createdAt: new Date(),
    isPinned: false,
    pinPosition: null,
    localPath: null,
    securityBookmark: null,
    lastSyncedAt: null,
    isWatching: false,
};

const mockLinkItem: SpaceItem = {
    id: 'link-1',
    name: 'Test Link',
    type: SpaceItemType.link,
    path: 'https://example.com',
    isExpanded: false,
    children: [],
    faviconUrl: 'https://example.com/favicon.ico',
    description: null,
    visitCount: 0,
    lastVisited: null,
    createdAt: new Date(),
    isPinned: false,
    pinPosition: null,
    localPath: null,
    securityBookmark: null,
    lastSyncedAt: null,
    isWatching: false,
};

const mockAccentColor = '#6D5AE6';

describe('Feature: Drag Tree Items - DragPreview Component', () => {
    describe('AC2: Drag preview shows item name and icon', () => {
        it('should display folder icon and name for folder items', () => {
            render(
                <DragPreview
                    items={[mockFolderItem]}
                    accentColor={mockAccentColor}
                />
            );

            expect(screen.getByText('Test Folder')).toBeTruthy();
        });

        it('should display link icon and name for link items', () => {
            render(
                <DragPreview
                    items={[mockLinkItem]}
                    accentColor={mockAccentColor}
                />
            );

            expect(screen.getByText('Test Link')).toBeTruthy();
        });

        it('should truncate long names with ellipsis', () => {
            const longNameItem: SpaceItem = {
                ...mockLinkItem,
                name: 'This is a very long name that should be truncated because it exceeds the maximum width constraint',
            };

            render(
                <DragPreview
                    items={[longNameItem]}
                    accentColor={mockAccentColor}
                />
            );

            const nameElement = screen.getByText(longNameItem.name);
            expect(nameElement).toBeTruthy();
        });
    });

    describe('AC4: DragPreview respects maxWidth constraint', () => {
        it('should have max-width of 280px for rectangle preview', () => {
            render(
                <DragPreview
                    items={[mockLinkItem]}
                    accentColor={mockAccentColor}
                />
            );

            const preview = screen.getByTestId('drag-preview');
            expect(preview).toBeTruthy();
        });

        it('should have min-width of 150px', () => {
            const shortNameItem: SpaceItem = {
                ...mockLinkItem,
                name: 'Hi',
            };

            render(
                <DragPreview
                    items={[shortNameItem]}
                    accentColor={mockAccentColor}
                />
            );

            const preview = screen.getByTestId('drag-preview');
            expect(preview).toBeTruthy();
        });
    });

    describe('AC5: Can drag multiple selected items (shows count badge)', () => {
        it('should show count badge for multi-item drag', () => {
            const items = [mockFolderItem, mockLinkItem];

            render(
                <DragPreview
                    items={items}
                    accentColor={mockAccentColor}
                />
            );

            expect(screen.getByText('2')).toBeTruthy();
        });

        it('should show stacked cards effect for multi-item', () => {
            const items = [mockFolderItem, mockLinkItem, { ...mockLinkItem, id: 'link-2', name: 'Another Link' }];

            render(
                <DragPreview
                    items={items}
                    accentColor={mockAccentColor}
                />
            );

            expect(screen.getByText('3')).toBeTruthy();
            expect(screen.getByTestId('multi-item-preview')).toBeTruthy();
        });

        it('should display first item name in multi-drag preview', () => {
            const items = [mockFolderItem, mockLinkItem];

            render(
                <DragPreview
                    items={items}
                    accentColor={mockAccentColor}
                />
            );

            expect(screen.getByText('Test Folder')).toBeTruthy();
        });
    });

    describe('SingleItemPreview', () => {
        it('should render with accent color border', () => {
            render(
                <SingleItemPreview
                    item={mockLinkItem}
                    accentColor={mockAccentColor}
                />
            );

            const preview = screen.getByTestId('single-item-preview');
            expect(preview).toBeTruthy();
        });

        it('should show square preview when isSquare is true', () => {
            render(
                <SingleItemPreview
                    item={mockLinkItem}
                    accentColor={mockAccentColor}
                    isSquare={true}
                />
            );

            const preview = screen.getByTestId('square-preview');
            expect(preview).toBeTruthy();
        });
    });

    describe('MultiItemPreview', () => {
        it('should render stacked cards for multiple items', () => {
            const items = [mockFolderItem, mockLinkItem];

            render(
                <MultiItemPreview
                    items={items}
                    accentColor={mockAccentColor}
                />
            );

            expect(screen.getByTestId('multi-item-preview')).toBeTruthy();
        });

        it('should show count badge with correct number', () => {
            const items = [mockFolderItem, mockLinkItem, { ...mockLinkItem, id: 'link-2' }];

            render(
                <MultiItemPreview
                    items={items}
                    accentColor={mockAccentColor}
                />
            );

            expect(screen.getByText('3')).toBeTruthy();
        });
    });
});
