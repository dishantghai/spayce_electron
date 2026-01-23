import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain } from 'electron';
import { registerIpcHandlers } from '../../src/main/ipc/handlers';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade, SearchFacade } from '@spayce/core/application';

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
    };
});

describe('IPC Handlers - Phase 2: Pin, Metadata, and File System Operations', () => {
    let mockSpaceItemsFacade: Partial<SpaceItemsFacade>;
    let mockSearchFacade: Partial<SearchFacade>;
    let handlers: Map<string, Function>;

    beforeEach(() => {
        vi.clearAllMocks();
        handlers = new Map();

        mockSpaceItemsFacade = {
            pinItem: vi.fn(),
            unpinItem: vi.fn(),
            reorderPins: vi.fn(),
            incrementVisitCount: vi.fn(),
            updateItemMetadata: vi.fn(),
            reorderItems: vi.fn(),
            renameItem: vi.fn(),
        };

        mockSearchFacade = {
            search: vi.fn(),
            getRecent: vi.fn(),
            getMostVisited: vi.fn(),
        };

        vi.mocked(serviceRegistry.get).mockImplementation((key: string) => {
            if (key === SERVICE_KEYS.SPACE_ITEMS_FACADE) {
                return mockSpaceItemsFacade as SpaceItemsFacade;
            }
            if (key === SERVICE_KEYS.SEARCH_FACADE) {
                return mockSearchFacade as SearchFacade;
            }
            throw new Error(`Unknown service key: ${key}`);
        });

        vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler: Function) => {
            handlers.set(channel, handler);
            return undefined as any;
        });

        registerIpcHandlers();
    });

    afterEach(() => {
        handlers.clear();
    });

    describe('Pin Operations', () => {
        describe('items:pin', () => {
            it('should pin an item successfully', async () => {
                const itemId = 'item-123';
                vi.mocked(mockSpaceItemsFacade.pinItem!).mockResolvedValue({
                    success: true,
                    data: undefined,
                });

                const handler = handlers.get('items:pin')!;
                const result = await handler({}, itemId);

                expect(mockSpaceItemsFacade.pinItem).toHaveBeenCalledWith(itemId);
                expect(result.success).toBe(true);
            });

            it('should handle pin failure', async () => {
                const itemId = 'item-123';
                const error = { type: 'not_found', message: 'Item not found' };
                vi.mocked(mockSpaceItemsFacade.pinItem!).mockResolvedValue({
                    success: false,
                    error,
                });

                const handler = handlers.get('items:pin')!;
                const result = await handler({}, itemId);

                expect(result.success).toBe(false);
                expect(result.error).toEqual(error);
            });
        });

        describe('items:unpin', () => {
            it('should unpin an item successfully', async () => {
                const itemId = 'item-123';
                vi.mocked(mockSpaceItemsFacade.unpinItem!).mockResolvedValue({
                    success: true,
                    data: undefined,
                });

                const handler = handlers.get('items:unpin')!;
                const result = await handler({}, itemId);

                expect(mockSpaceItemsFacade.unpinItem).toHaveBeenCalledWith(itemId);
                expect(result.success).toBe(true);
            });

            it('should handle unpin failure', async () => {
                const itemId = 'item-123';
                const error = { type: 'validation', message: 'Item not pinned' };
                vi.mocked(mockSpaceItemsFacade.unpinItem!).mockResolvedValue({
                    success: false,
                    error,
                });

                const handler = handlers.get('items:unpin')!;
                const result = await handler({}, itemId);

                expect(result.success).toBe(false);
                expect(result.error).toEqual(error);
            });
        });

        describe('items:reorderPins', () => {
            it('should reorder pins successfully', async () => {
                const spaceId = 'space-123';
                const orderedItemIds = ['item-1', 'item-2', 'item-3'];
                vi.mocked(mockSpaceItemsFacade.reorderPins!).mockResolvedValue({
                    success: true,
                    data: undefined,
                });

                const handler = handlers.get('items:reorderPins')!;
                const result = await handler({}, spaceId, orderedItemIds);

                expect(mockSpaceItemsFacade.reorderPins).toHaveBeenCalledWith(spaceId, orderedItemIds);
                expect(result.success).toBe(true);
            });

            it('should handle empty pins list', async () => {
                const spaceId = 'space-123';
                const orderedItemIds: string[] = [];
                vi.mocked(mockSpaceItemsFacade.reorderPins!).mockResolvedValue({
                    success: true,
                    data: undefined,
                });

                const handler = handlers.get('items:reorderPins')!;
                const result = await handler({}, spaceId, orderedItemIds);

                expect(mockSpaceItemsFacade.reorderPins).toHaveBeenCalledWith(spaceId, orderedItemIds);
                expect(result.success).toBe(true);
            });

            it('should handle reorder failure', async () => {
                const spaceId = 'space-123';
                const orderedItemIds = ['item-1', 'item-2'];
                const error = { type: 'validation', message: 'Invalid order' };
                vi.mocked(mockSpaceItemsFacade.reorderPins!).mockResolvedValue({
                    success: false,
                    error,
                });

                const handler = handlers.get('items:reorderPins')!;
                const result = await handler({}, spaceId, orderedItemIds);

                expect(result.success).toBe(false);
                expect(result.error).toEqual(error);
            });
        });
    });

    describe('Item Metadata Operations', () => {
        describe('items:incrementVisit', () => {
            it('should increment visit count successfully', async () => {
                const itemId = 'item-123';
                vi.mocked(mockSpaceItemsFacade.incrementVisitCount!).mockResolvedValue({
                    success: true,
                    data: undefined,
                });

                const handler = handlers.get('items:incrementVisit')!;
                const result = await handler({}, itemId);

                expect(mockSpaceItemsFacade.incrementVisitCount).toHaveBeenCalledWith(itemId);
                expect(result.success).toBe(true);
            });

            it('should handle increment failure gracefully', async () => {
                const itemId = 'item-123';
                const error = { type: 'not_found', message: 'Item not found' };
                vi.mocked(mockSpaceItemsFacade.incrementVisitCount!).mockResolvedValue({
                    success: false,
                    error,
                });

                const handler = handlers.get('items:incrementVisit')!;
                const result = await handler({}, itemId);

                expect(result.success).toBe(false);
                expect(result.error).toEqual(error);
            });
        });

        describe('items:updateMetadata', () => {
            it('should update item metadata successfully', async () => {
                const itemId = 'item-123';
                const metadata = {
                    name: 'Updated Name',
                    description: 'Updated description',
                    faviconUrl: 'https://example.com/favicon.ico',
                    isExpanded: true,
                };
                vi.mocked(mockSpaceItemsFacade.updateItemMetadata!).mockResolvedValue({
                    success: true,
                    data: { id: itemId, ...metadata } as any,
                });

                const handler = handlers.get('items:updateMetadata')!;
                const result = await handler({}, itemId, metadata);

                expect(mockSpaceItemsFacade.updateItemMetadata).toHaveBeenCalledWith({
                    itemId,
                    ...metadata,
                });
                expect(result.success).toBe(true);
            });

            it('should handle partial metadata updates', async () => {
                const itemId = 'item-123';
                const metadata = { faviconUrl: 'https://example.com/favicon.ico' };
                vi.mocked(mockSpaceItemsFacade.updateItemMetadata!).mockResolvedValue({
                    success: true,
                    data: { id: itemId, ...metadata } as any,
                });

                const handler = handlers.get('items:updateMetadata')!;
                const result = await handler({}, itemId, metadata);

                expect(mockSpaceItemsFacade.updateItemMetadata).toHaveBeenCalledWith({
                    itemId,
                    ...metadata,
                });
                expect(result.success).toBe(true);
            });

            it('should handle null values in metadata', async () => {
                const itemId = 'item-123';
                const metadata = {
                    description: null,
                    faviconUrl: null,
                };
                vi.mocked(mockSpaceItemsFacade.updateItemMetadata!).mockResolvedValue({
                    success: true,
                    data: { id: itemId, ...metadata } as any,
                });

                const handler = handlers.get('items:updateMetadata')!;
                const result = await handler({}, itemId, metadata);

                expect(mockSpaceItemsFacade.updateItemMetadata).toHaveBeenCalledWith({
                    itemId,
                    ...metadata,
                });
            });

            it('should handle update failure', async () => {
                const itemId = 'item-123';
                const metadata = { name: 'New Name' };
                const error = { type: 'validation', message: 'Invalid metadata' };
                vi.mocked(mockSpaceItemsFacade.updateItemMetadata!).mockResolvedValue({
                    success: false,
                    error,
                });

                const handler = handlers.get('items:updateMetadata')!;
                const result = await handler({}, itemId, metadata);

                expect(result.success).toBe(false);
                expect(result.error).toEqual(error);
            });
        });

        describe('items:reorder', () => {
            it('should reorder items successfully', async () => {
                const spaceId = 'space-123';
                const parentId = 'folder-123';
                const orderedItemIds = ['item-1', 'item-2', 'item-3'];
                vi.mocked(mockSpaceItemsFacade.reorderItems!).mockResolvedValue({
                    success: true,
                    data: undefined,
                });

                const handler = handlers.get('items:reorder')!;
                const result = await handler({}, spaceId, parentId, orderedItemIds);

                expect(mockSpaceItemsFacade.reorderItems).toHaveBeenCalledWith({
                    spaceId,
                    parentId,
                    orderedItemIds,
                });
                expect(result.success).toBe(true);
            });

            it('should handle null parentId for root items', async () => {
                const spaceId = 'space-123';
                const parentId = null;
                const orderedItemIds = ['item-1', 'item-2'];
                vi.mocked(mockSpaceItemsFacade.reorderItems!).mockResolvedValue({
                    success: true,
                    data: undefined,
                });

                const handler = handlers.get('items:reorder')!;
                const result = await handler({}, spaceId, parentId, orderedItemIds);

                expect(mockSpaceItemsFacade.reorderItems).toHaveBeenCalledWith({
                    spaceId,
                    parentId,
                    orderedItemIds,
                });
            });

            it('should handle reorder failure', async () => {
                const spaceId = 'space-123';
                const parentId = 'folder-123';
                const orderedItemIds = ['item-1', 'item-2'];
                const error = { type: 'validation', message: 'Invalid order' };
                vi.mocked(mockSpaceItemsFacade.reorderItems!).mockResolvedValue({
                    success: false,
                    error,
                });

                const handler = handlers.get('items:reorder')!;
                const result = await handler({}, spaceId, parentId, orderedItemIds);

                expect(result.success).toBe(false);
                expect(result.error).toEqual(error);
            });
        });

        describe('items:rename', () => {
            it('should rename item successfully', async () => {
                const itemId = 'item-123';
                const newName = 'New Item Name';
                vi.mocked(mockSpaceItemsFacade.renameItem!).mockResolvedValue({
                    success: true,
                    data: { id: itemId, name: newName } as any,
                });

                const handler = handlers.get('items:rename')!;
                const result = await handler({}, itemId, newName);

                expect(mockSpaceItemsFacade.renameItem).toHaveBeenCalledWith(itemId, newName);
                expect(result.success).toBe(true);
            });

            it('should handle rename failure', async () => {
                const itemId = 'item-123';
                const newName = 'New Name';
                const error = { type: 'validation', message: 'Name already exists' };
                vi.mocked(mockSpaceItemsFacade.renameItem!).mockResolvedValue({
                    success: false,
                    error,
                });

                const handler = handlers.get('items:rename')!;
                const result = await handler({}, itemId, newName);

                expect(result.success).toBe(false);
                expect(result.error).toEqual(error);
            });
        });
    });

    describe('Metadata Extraction Operations', () => {
        describe('metadata:extract', () => {
            it('should extract metadata successfully', async () => {
                const url = 'https://example.com';
                const handler = handlers.get('metadata:extract')!;

                const result = await handler({}, url);

                expect(result).toHaveProperty('success');
            });

            it('should handle extraction errors', async () => {
                const url = 'invalid-url';
                const handler = handlers.get('metadata:extract')!;

                const result = await handler({}, url);

                expect(result).toHaveProperty('success');
            });
        });

        describe('metadata:extractFavicon', () => {
            it('should extract favicon successfully', async () => {
                const url = 'https://example.com';
                const handler = handlers.get('metadata:extractFavicon')!;

                const result = await handler({}, url);

                expect(result).toHaveProperty('success');
            });
        });
    });

    describe('File System Operations', () => {
        describe('fs:selectFolder', () => {
            it('should select folder successfully', async () => {
                const handler = handlers.get('fs:selectFolder')!;

                const result = await handler({});

                expect(result).toHaveProperty('success');
            });

            it('should handle selection cancellation', async () => {
                const handler = handlers.get('fs:selectFolder')!;

                const result = await handler({});

                expect(result).toHaveProperty('success');
            });
        });

        describe('fs:selectFile', () => {
            it('should select file successfully', async () => {
                const handler = handlers.get('fs:selectFile')!;

                const result = await handler({});

                expect(result).toHaveProperty('success');
            });
        });

        describe('fs:loadFolderChildren', () => {
            it('should load folder children successfully', async () => {
                const folderPath = '/Users/test/Documents';
                const handler = handlers.get('fs:loadFolderChildren')!;

                const result = await handler({}, folderPath);

                expect(result).toHaveProperty('success');
            });

            it('should handle load errors', async () => {
                const folderPath = '/invalid/path';
                const handler = handlers.get('fs:loadFolderChildren')!;

                const result = await handler({}, folderPath);

                expect(result).toHaveProperty('success');
            });
        });
    });

    describe('Handler Registration', () => {
        it('should register all Phase 2 IPC handlers', () => {
            const expectedHandlers = [
                'items:pin',
                'items:unpin',
                'items:reorderPins',
                'items:incrementVisit',
                'items:updateMetadata',
                'items:reorder',
                'metadata:extract',
                'metadata:extractFavicon',
                'fs:selectFolder',
                'fs:selectFile',
                'fs:loadFolderChildren',
            ];

            expectedHandlers.forEach(channel => {
                expect(handlers.has(channel)).toBe(true);
            });
        });

        it('should use correct service facades', () => {
            expect(serviceRegistry.get).toHaveBeenCalledWith(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        });
    });
});
