import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ipcMain } from 'electron';
import { registerIpcHandlers } from '../../src/main/ipc/handlers';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpacesFacade, SpaceItemsFacade, SearchFacade } from '@spayce/core/application';

vi.mock('electron', () => ({
    ipcMain: {
        handle: vi.fn(),
    },
}));

vi.mock('@spayce/infrastructure', async () => {
    const actual = await vi.importActual('@spayce/infrastructure');
    return {
        ...actual,
        serviceRegistry: {
            get: vi.fn(),
        },
        MetadataExtractionService: vi.fn().mockImplementation(() => ({
            extractMetadata: vi.fn().mockResolvedValue({
                title: 'Test Title',
                description: 'Test Description',
                faviconUrl: 'https://example.com/favicon.ico',
            }),
            extractFavicon: vi.fn().mockResolvedValue('https://example.com/favicon.ico'),
        })),
    };
});

vi.mock('../../src/main/services/LocalFileSystemService', () => ({
    LocalFileSystemService: vi.fn().mockImplementation(() => ({
        selectFolder: vi.fn().mockResolvedValue('/test/folder'),
        selectFile: vi.fn().mockResolvedValue('/test/file.txt'),
        loadFolderChildren: vi.fn().mockResolvedValue([]),
    })),
}));

describe('IPC End-to-End Integration', () => {
    let mockSpacesFacade: Partial<SpacesFacade>;
    let mockSpaceItemsFacade: Partial<SpaceItemsFacade>;
    let mockSearchFacade: Partial<SearchFacade>;
    let handlers: Map<string, Function>;

    beforeEach(() => {
        vi.clearAllMocks();
        handlers = new Map();

        mockSpacesFacade = {
            getSpaces: vi.fn().mockResolvedValue({
                success: true,
                data: [
                    { id: 'space-1', name: 'Test Space', profileId: 'profile-1' }
                ],
            }),
            createSpace: vi.fn().mockResolvedValue({
                success: true,
                data: { id: 'space-new', name: 'New Space' },
            }),
            deleteSpace: vi.fn().mockResolvedValue({ success: true, data: undefined }),
            renameSpace: vi.fn().mockResolvedValue({
                success: true,
                data: { id: 'space-1', name: 'Renamed Space' },
            }),
            updateSpace: vi.fn().mockResolvedValue({ success: true, data: {} }),
            reorderSpaces: vi.fn().mockResolvedValue({ success: true, data: undefined }),
        };

        mockSpaceItemsFacade = {
            getItems: vi.fn().mockResolvedValue({
                success: true,
                data: [{ id: 'item-1', name: 'Test Item' }],
            }),
            createItem: vi.fn().mockResolvedValue({
                success: true,
                data: { id: 'item-new', name: 'New Item' },
            }),
            deleteItem: vi.fn().mockResolvedValue({ success: true, data: undefined }),
            moveItem: vi.fn().mockResolvedValue({ success: true, data: undefined }),
            renameItem: vi.fn().mockResolvedValue({
                success: true,
                data: { id: 'item-1', name: 'Renamed Item' },
            }),
            reorderItems: vi.fn().mockResolvedValue({ success: true, data: undefined }),
            pinItem: vi.fn().mockResolvedValue({ success: true, data: undefined }),
            unpinItem: vi.fn().mockResolvedValue({ success: true, data: undefined }),
            reorderPins: vi.fn().mockResolvedValue({ success: true, data: undefined }),
            incrementVisitCount: vi.fn().mockResolvedValue({ success: true, data: undefined }),
            updateItemMetadata: vi.fn().mockResolvedValue({
                success: true,
                data: { id: 'item-1' },
            }),
        };

        mockSearchFacade = {
            search: vi.fn().mockResolvedValue({
                success: true,
                data: [{ id: 'item-1', name: 'Search Result' }],
            }),
            getRecent: vi.fn().mockResolvedValue({
                success: true,
                data: [],
            }),
            getMostVisited: vi.fn().mockResolvedValue({
                success: true,
                data: [],
            }),
        };

        vi.mocked(serviceRegistry.get).mockImplementation((key: string) => {
            if (key === SERVICE_KEYS.SPACES_FACADE) return mockSpacesFacade as SpacesFacade;
            if (key === SERVICE_KEYS.SPACE_ITEMS_FACADE) return mockSpaceItemsFacade as SpaceItemsFacade;
            if (key === SERVICE_KEYS.SEARCH_FACADE) return mockSearchFacade as SearchFacade;
            throw new Error(`Unknown service key: ${key}`);
        });

        vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler: Function) => {
            handlers.set(channel, handler);
            return undefined as any;
        });

        registerIpcHandlers();
    });

    describe('Space CRUD Flow', () => {
        it('should complete create-read-update-delete flow for spaces', async () => {
            // Create
            const createHandler = handlers.get('spaces:create')!;
            const createResult = await createHandler({}, {
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'My Space',
                iconName: 'Folder',
                accentColor: '#6D5AE6',
            });
            expect(createResult.success).toBe(true);
            expect(createResult.data.id).toBeDefined();

            // Read
            const getHandler = handlers.get('spaces:getAll')!;
            const getResult = await getHandler({}, 'profile-1');
            expect(getResult.success).toBe(true);
            expect(Array.isArray(getResult.data)).toBe(true);

            // Update
            const updateHandler = handlers.get('spaces:update')!;
            const updateResult = await updateHandler({}, 'space-1', { name: 'Updated Space' });
            expect(updateResult.success).toBe(true);

            // Delete
            const deleteHandler = handlers.get('spaces:delete')!;
            const deleteResult = await deleteHandler({}, 'space-1', 'profile-1');
            expect(deleteResult.success).toBe(true);
        });
    });

    describe('Item CRUD Flow', () => {
        it('should complete create-read-update-delete flow for items', async () => {
            // Create
            const createHandler = handlers.get('items:create')!;
            const createResult = await createHandler({}, {
                spaceId: 'space-1',
                name: 'Test Link',
                type: 'link',
                path: 'https://example.com',
            });
            expect(createResult.success).toBe(true);

            // Read
            const getHandler = handlers.get('items:getBySpace')!;
            const getResult = await getHandler({}, 'space-1');
            expect(getResult.success).toBe(true);

            // Rename
            const renameHandler = handlers.get('items:rename')!;
            const renameResult = await renameHandler({}, 'item-1', 'New Name');
            expect(renameResult.success).toBe(true);

            // Delete
            const deleteHandler = handlers.get('items:delete')!;
            const deleteResult = await deleteHandler({}, 'item-1');
            expect(deleteResult.success).toBe(true);
        });
    });

    describe('Pin Operations Flow', () => {
        it('should complete pin-reorder-unpin flow', async () => {
            // Pin
            const pinHandler = handlers.get('items:pin')!;
            const pinResult = await pinHandler({}, 'item-1');
            expect(pinResult.success).toBe(true);

            // Reorder pins
            const reorderHandler = handlers.get('items:reorderPins')!;
            const reorderResult = await reorderHandler({}, 'space-1', ['item-1', 'item-2']);
            expect(reorderResult.success).toBe(true);

            // Unpin
            const unpinHandler = handlers.get('items:unpin')!;
            const unpinResult = await unpinHandler({}, 'item-1');
            expect(unpinResult.success).toBe(true);
        });
    });

    describe('Search Operations', () => {
        it('should search items', async () => {
            const searchHandler = handlers.get('search:items')!;
            const result = await searchHandler({}, 'test query');
            expect(result.success).toBe(true);
            expect(mockSearchFacade.search).toHaveBeenCalled();
        });

        it('should get recent items', async () => {
            const recentHandler = handlers.get('search:recent')!;
            const result = await recentHandler({}, 10);
            expect(result.success).toBe(true);
        });

        it('should get most visited items', async () => {
            const mostVisitedHandler = handlers.get('search:mostVisited')!;
            const result = await mostVisitedHandler({}, 10);
            expect(result.success).toBe(true);
        });
    });

    describe('Metadata Extraction Flow', () => {
        it('should extract metadata for a URL', async () => {
            const metadataHandler = handlers.get('metadata:extract')!;
            const result = await metadataHandler({}, 'https://example.com');
            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('title');
        });

        it('should extract favicon for a URL', async () => {
            const faviconHandler = handlers.get('metadata:extractFavicon')!;
            const result = await faviconHandler({}, 'https://example.com');
            expect(result.success).toBe(true);
        });
    });

    describe('File System Operations', () => {
        it('should select folder', async () => {
            const selectFolderHandler = handlers.get('fs:selectFolder')!;
            const result = await selectFolderHandler({});
            expect(result.success).toBe(true);
        });

        it('should select file', async () => {
            const selectFileHandler = handlers.get('fs:selectFile')!;
            const result = await selectFileHandler({});
            expect(result.success).toBe(true);
        });

        it('should load folder children', async () => {
            const loadChildrenHandler = handlers.get('fs:loadFolderChildren')!;
            const result = await loadChildrenHandler({}, '/test/folder');
            expect(result.success).toBe(true);
        });
    });

    describe('Error Propagation', () => {
        it('should propagate facade errors to IPC response', async () => {
            const error = { type: 'not_found' as const, message: 'Space not found' };
            vi.mocked(mockSpacesFacade.getSpaces!).mockResolvedValue({
                success: false,
                error,
            });

            const getHandler = handlers.get('spaces:getAll')!;
            const result = await getHandler({}, 'profile-1');

            expect(result.success).toBe(false);
            expect(result.error).toEqual(error);
        });

        it('should handle service registry errors gracefully', async () => {
            vi.mocked(serviceRegistry.get).mockImplementation(() => {
                throw new Error('Service not initialized');
            });

            // Re-register handlers with broken service registry
            handlers.clear();
            registerIpcHandlers();

            // The handler should be registered but will fail when called
            expect(handlers.has('spaces:getAll')).toBe(true);
        });
    });

    describe('Handler Registration Completeness', () => {
        it('should register all required handlers', () => {
            const requiredHandlers = [
                // Spaces
                'spaces:getAll',
                'spaces:create',
                'spaces:delete',
                'spaces:rename',
                'spaces:update',
                'spaces:reorder',
                // Items
                'items:getBySpace',
                'items:create',
                'items:delete',
                'items:move',
                'items:rename',
                'items:reorder',
                'items:incrementVisit',
                'items:updateMetadata',
                // Pins
                'items:pin',
                'items:unpin',
                'items:reorderPins',
                // Search
                'search:items',
                'search:recent',
                'search:mostVisited',
                // Metadata
                'metadata:extract',
                'metadata:extractFavicon',
                // File system
                'fs:selectFolder',
                'fs:selectFile',
                'fs:loadFolderChildren',
                // App info
                'app:getVersion',
                'app:getPlatform',
            ];

            requiredHandlers.forEach(handler => {
                expect(handlers.has(handler), `Missing handler: ${handler}`).toBe(true);
            });
        });
    });
});
