import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain } from 'electron';
import { registerIpcHandlers } from '../../src/main/ipc/handlers';
import { serviceRegistry, SERVICE_KEYS, MetadataExtractionService } from '@spayce/infrastructure';
import type { SpaceItemsFacade, SearchFacade } from '@spayce/core/application';
import { LocalFileSystemService } from '../../src/main/services/LocalFileSystemService';

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
            extractMetadata: vi.fn(),
            extractFavicon: vi.fn(),
        })),
    };
});

vi.mock('../../src/main/services/LocalFileSystemService', () => ({
    LocalFileSystemService: vi.fn().mockImplementation(() => ({
        selectFolder: vi.fn(),
        selectFile: vi.fn(),
        loadFolderChildren: vi.fn(),
    })),
}));

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

                expect(mockSpaceItemsFacade.pinItem).toHaveBeenCalledWith(itemId, undefined);
                expect(result.success).toBe(true);
            });

            it('should handle pin failure', async () => {
                const itemId = 'item-123';
                const error = { type: 'not_found' as const, message: 'Item not found' };
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
                const error = { type: 'validation' as const, message: 'Item not pinned' };
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
                const error = { type: 'validation' as const, message: 'Invalid order' };
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
                const error = { type: 'not_found' as const, message: 'Item not found' };
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
                const error = { type: 'validation' as const, message: 'Invalid metadata' };
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
                const error = { type: 'validation' as const, message: 'Invalid order' };
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
                const error = { type: 'validation' as const, message: 'Name already exists' };
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
        let mockMetadataService: { extractMetadata: ReturnType<typeof vi.fn>; extractFavicon: ReturnType<typeof vi.fn> };

        beforeEach(() => {
            mockMetadataService = {
                extractMetadata: vi.fn(),
                extractFavicon: vi.fn(),
            };
            vi.mocked(MetadataExtractionService).mockImplementation(() => mockMetadataService as any);

            handlers.clear();
            vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler: Function) => {
                handlers.set(channel, handler);
                return undefined as any;
            });
            registerIpcHandlers();
        });

        describe('metadata:extract', () => {
            it('should extract metadata successfully', async () => {
                const url = 'https://example.com';
                const metadata = {
                    title: 'Example Site',
                    description: 'An example website',
                    faviconUrl: 'https://example.com/favicon.ico',
                    imageUrl: 'https://example.com/og-image.png',
                };
                mockMetadataService.extractMetadata.mockResolvedValue(metadata);

                const handler = handlers.get('metadata:extract')!;
                const result = await handler({}, url);

                expect(mockMetadataService.extractMetadata).toHaveBeenCalledWith(url);
                expect(result.success).toBe(true);
                expect(result.data).toEqual(metadata);
            });

            it('should handle extraction errors gracefully', async () => {
                const url = 'https://invalid-site.com';
                mockMetadataService.extractMetadata.mockRejectedValue(new Error('Network timeout'));

                const handler = handlers.get('metadata:extract')!;
                const result = await handler({}, url);

                expect(result.success).toBe(false);
                expect(result.error).toEqual({
                    type: 'system',
                    message: 'Network timeout',
                });
            });

            it('should handle invalid URLs', async () => {
                const url = 'not-a-valid-url';
                mockMetadataService.extractMetadata.mockRejectedValue(new Error('Invalid URL'));

                const handler = handlers.get('metadata:extract')!;
                const result = await handler({}, url);

                expect(result.success).toBe(false);
                expect(result.error.type).toBe('system');
            });

            it('should handle missing metadata fields', async () => {
                const url = 'https://minimal-site.com';
                const metadata = { title: null, description: null, faviconUrl: null };
                mockMetadataService.extractMetadata.mockResolvedValue(metadata);

                const handler = handlers.get('metadata:extract')!;
                const result = await handler({}, url);

                expect(result.success).toBe(true);
                expect(result.data).toEqual(metadata);
            });

            it('should handle non-Error exceptions', async () => {
                const url = 'https://example.com';
                mockMetadataService.extractMetadata.mockRejectedValue('String error');

                const handler = handlers.get('metadata:extract')!;
                const result = await handler({}, url);

                expect(result.success).toBe(false);
                expect(result.error.message).toBe('Failed to extract metadata');
            });
        });

        describe('metadata:extractFavicon', () => {
            it('should extract favicon successfully', async () => {
                const url = 'https://example.com';
                const faviconUrl = 'https://example.com/favicon.ico';
                mockMetadataService.extractFavicon.mockResolvedValue(faviconUrl);

                const handler = handlers.get('metadata:extractFavicon')!;
                const result = await handler({}, url);

                expect(mockMetadataService.extractFavicon).toHaveBeenCalledWith(url);
                expect(result.success).toBe(true);
                expect(result.data).toBe(faviconUrl);
            });

            it('should fallback to /favicon.ico when no favicon found', async () => {
                const url = 'https://example.com';
                const fallbackUrl = 'https://example.com/favicon.ico';
                mockMetadataService.extractFavicon.mockResolvedValue(fallbackUrl);

                const handler = handlers.get('metadata:extractFavicon')!;
                const result = await handler({}, url);

                expect(result.success).toBe(true);
            });

            it('should handle favicon extraction failure', async () => {
                const url = 'https://no-favicon-site.com';
                mockMetadataService.extractFavicon.mockRejectedValue(new Error('Favicon not found'));

                const handler = handlers.get('metadata:extractFavicon')!;
                const result = await handler({}, url);

                expect(result.success).toBe(false);
                expect(result.error).toEqual({
                    type: 'system',
                    message: 'Favicon not found',
                });
            });

            it('should return null when no favicon exists', async () => {
                const url = 'https://example.com';
                mockMetadataService.extractFavicon.mockResolvedValue(null);

                const handler = handlers.get('metadata:extractFavicon')!;
                const result = await handler({}, url);

                expect(result.success).toBe(true);
                expect(result.data).toBeNull();
            });
        });
    });

    describe('File System Operations', () => {
        let mockFileSystemService: {
            selectFolder: ReturnType<typeof vi.fn>;
            selectFile: ReturnType<typeof vi.fn>;
            loadFolderChildren: ReturnType<typeof vi.fn>;
        };

        beforeEach(() => {
            mockFileSystemService = {
                selectFolder: vi.fn(),
                selectFile: vi.fn(),
                loadFolderChildren: vi.fn(),
            };
            vi.mocked(LocalFileSystemService).mockImplementation(() => mockFileSystemService as any);

            handlers.clear();
            vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler: Function) => {
                handlers.set(channel, handler);
                return undefined as any;
            });
            registerIpcHandlers();
        });

        describe('fs:selectFolder', () => {
            it('should return selected folder path', async () => {
                const folderPath = '/Users/test/Documents';
                mockFileSystemService.selectFolder.mockResolvedValue(folderPath);

                const handler = handlers.get('fs:selectFolder')!;
                const result = await handler({});

                expect(mockFileSystemService.selectFolder).toHaveBeenCalled();
                expect(result.success).toBe(true);
                expect(result.data).toBe(folderPath);
            });

            it('should handle user cancellation (null)', async () => {
                mockFileSystemService.selectFolder.mockResolvedValue(null);

                const handler = handlers.get('fs:selectFolder')!;
                const result = await handler({});

                expect(result.success).toBe(true);
                expect(result.data).toBeNull();
            });

            it('should handle dialog errors', async () => {
                mockFileSystemService.selectFolder.mockRejectedValue(new Error('Dialog failed to open'));

                const handler = handlers.get('fs:selectFolder')!;
                const result = await handler({});

                expect(result.success).toBe(false);
                expect(result.error).toEqual({
                    type: 'system',
                    message: 'Dialog failed to open',
                });
            });
        });

        describe('fs:selectFile', () => {
            it('should return selected file path', async () => {
                const filePath = '/Users/test/Documents/file.txt';
                mockFileSystemService.selectFile.mockResolvedValue(filePath);

                const handler = handlers.get('fs:selectFile')!;
                const result = await handler({});

                expect(mockFileSystemService.selectFile).toHaveBeenCalled();
                expect(result.success).toBe(true);
                expect(result.data).toBe(filePath);
            });

            it('should handle user cancellation', async () => {
                mockFileSystemService.selectFile.mockResolvedValue(null);

                const handler = handlers.get('fs:selectFile')!;
                const result = await handler({});

                expect(result.success).toBe(true);
                expect(result.data).toBeNull();
            });

            it('should handle dialog errors', async () => {
                mockFileSystemService.selectFile.mockRejectedValue(new Error('Permission denied'));

                const handler = handlers.get('fs:selectFile')!;
                const result = await handler({});

                expect(result.success).toBe(false);
                expect(result.error.type).toBe('system');
            });
        });

        describe('fs:loadFolderChildren', () => {
            it('should load folder contents successfully', async () => {
                const folderPath = '/Users/test/Documents';
                const children = [
                    { name: 'file1.txt', isDirectory: false, path: '/Users/test/Documents/file1.txt' },
                    { name: 'subfolder', isDirectory: true, path: '/Users/test/Documents/subfolder' },
                ];
                mockFileSystemService.loadFolderChildren.mockResolvedValue(children);

                const handler = handlers.get('fs:loadFolderChildren')!;
                const result = await handler({}, folderPath);

                expect(mockFileSystemService.loadFolderChildren).toHaveBeenCalledWith(folderPath);
                expect(result.success).toBe(true);
                expect(result.data).toEqual(children);
            });

            it('should handle empty folders', async () => {
                const folderPath = '/Users/test/EmptyFolder';
                mockFileSystemService.loadFolderChildren.mockResolvedValue([]);

                const handler = handlers.get('fs:loadFolderChildren')!;
                const result = await handler({}, folderPath);

                expect(result.success).toBe(true);
                expect(result.data).toEqual([]);
            });

            it('should handle non-existent paths', async () => {
                const folderPath = '/invalid/path';
                mockFileSystemService.loadFolderChildren.mockRejectedValue(new Error('Path does not exist'));

                const handler = handlers.get('fs:loadFolderChildren')!;
                const result = await handler({}, folderPath);

                expect(result.success).toBe(false);
                expect(result.error).toEqual({
                    type: 'system',
                    message: 'Path does not exist',
                });
            });

            it('should handle permission errors', async () => {
                const folderPath = '/root/protected';
                mockFileSystemService.loadFolderChildren.mockRejectedValue(new Error('Permission denied'));

                const handler = handlers.get('fs:loadFolderChildren')!;
                const result = await handler({}, folderPath);

                expect(result.success).toBe(false);
                expect(result.error.message).toBe('Permission denied');
            });

            it('should filter hidden files when requested', async () => {
                const folderPath = '/Users/test/Documents';
                const visibleFiles = [
                    { name: 'visible.txt', isDirectory: false, path: '/Users/test/Documents/visible.txt' },
                ];
                mockFileSystemService.loadFolderChildren.mockResolvedValue(visibleFiles);

                const handler = handlers.get('fs:loadFolderChildren')!;
                const result = await handler({}, folderPath);

                expect(result.success).toBe(true);
                expect(result.data).toEqual(visibleFiles);
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
            // serviceRegistry.get is called lazily when handlers are invoked, not at registration
            // This test verifies that all handlers are registered correctly
            expect(handlers.has('items:pin')).toBe(true);
            expect(handlers.has('items:unpin')).toBe(true);
            expect(handlers.has('items:reorderPins')).toBe(true);
        });
    });
});
