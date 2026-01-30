import { ipcMain, clipboard } from 'electron';
import {
    serviceRegistry,
    SERVICE_KEYS,
    MetadataExtractionService
} from '@spayce/infrastructure';
import type { SpacesFacade, SpaceItemsFacade, SearchFacade } from '@spayce/core/application';
import { LocalFileSystemService } from '../services/LocalFileSystemService';

export function registerIpcHandlers(): void {
    // Spaces operations
    ipcMain.handle('spaces:getAll', async (_, profileId: string) => {
        const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
        return facade.getSpaces(profileId);
    });

    ipcMain.handle('spaces:create', async (_, input: {
        profileId: string;
        userId: string;
        name: string;
        iconName: string;
        accentColor: string;
    }) => {
        const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
        return facade.createSpace(input);
    });

    ipcMain.handle('spaces:delete', async (_, spaceId: string, profileId: string) => {
        const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
        return facade.deleteSpace(spaceId, profileId);
    });

    ipcMain.handle('spaces:rename', async (_, spaceId: string, newName: string) => {
        const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
        return facade.renameSpace(spaceId, newName);
    });

    ipcMain.handle('spaces:update', async (_, spaceId: string, updates: {
        name?: string;
        iconName?: string;
        accentColor?: string;
        isExpanded?: boolean;
    }) => {
        const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
        return facade.updateSpace({ spaceId, ...updates });
    });

    ipcMain.handle('spaces:reorder', async (_, profileId: string, spaceIds: string[]) => {
        const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
        return facade.reorderSpaces(profileId, spaceIds);
    });

    // Space items operations
    ipcMain.handle('items:getBySpace', async (_, spaceId: string) => {
        const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        return facade.getItems(spaceId);
    });

    ipcMain.handle('items:create', async (_, input: {
        spaceId: string;
        name: string;
        type: string;
        path: string;
        parentId?: string;
        faviconUrl?: string | null;
    }) => {
        const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        // Cast type to SpaceItemType enum
        return facade.createItem({
            ...input,
            type: input.type as any, // Type will be validated by facade
            parentId: input.parentId ?? null,
        });
    });

    ipcMain.handle('items:delete', async (_, itemId: string) => {
        const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        return facade.deleteItem(itemId);
    });

    // TODO: Paste item handler - duplicates item recursively
    // Disabled until duplicateItem is implemented in SpaceItemsFacade
    // ipcMain.handle('items:pasteItem', async (_, { sourceItem, targetId, position, action }) => {
    //     try {
    //         const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
    //         // Duplicate the item at target location
    //         const newItem = await facade.duplicateItem(sourceItem, targetId, position);
    //
    //         // If it was a cut operation, delete the original
    //         if (action === 'cut') {
    //             await facade.deleteItem(sourceItem.id);
    //         }
    //
    //         return { success: true, item: newItem };
    //     } catch (error) {
    //         console.error('Failed to paste item:', error);
    //         return { success: false, error: error instanceof Error ? error.message : 'Failed to paste item' };
    //     }
    // });

    // TODO: Refresh local folder handler
    // Disabled until refreshLocalFolder is implemented in SpaceItemsFacade
    // ipcMain.handle('items:refreshLocalFolder', async (_, itemId: string) => {
    //     try {
    //         const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
    //         // Refresh local folder contents - this would re-scan the folder
    //         await facade.refreshLocalFolder(itemId);
    //         return { success: true };
    //     } catch (error) {
    //         console.error('Failed to refresh local folder:', error);
    //         return { success: false, error: error instanceof Error ? error.message : 'Failed to refresh folder' };
    //     }
    // });

    ipcMain.handle('items:move', async (_, itemId: string, targetSpaceId: string, targetParentId?: string, toPosition?: number) => {
        const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        return facade.moveItem({
            itemId,
            toSpaceId: targetSpaceId,
            toParentId: targetParentId ?? null,
            toPosition: toPosition ?? 0,
        });
    });

    ipcMain.handle('items:rename', async (_, itemId: string, newName: string) => {
        const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        return facade.renameItem(itemId, newName);
    });

    ipcMain.handle('items:reorder', async (_, spaceId: string, parentId: string | null, orderedItemIds: string[]) => {
        const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        return facade.reorderItems({ spaceId, parentId, orderedItemIds });
    });

    ipcMain.handle('items:incrementVisit', async (_, itemId: string) => {
        const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        return facade.incrementVisitCount(itemId);
    });

    ipcMain.handle('items:updateMetadata', async (_, itemId: string, metadata: {
        name?: string;
        description?: string | null;
        faviconUrl?: string | null;
        isExpanded?: boolean;
    }) => {
        const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        return facade.updateItemMetadata({ itemId, ...metadata });
    });

    // Pin operations
    ipcMain.handle('items:pin', async (_, itemId: string, position?: number) => {
        const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        return facade.pinItem(itemId, position);
    });

    ipcMain.handle('items:unpin', async (_, itemId: string) => {
        const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        return facade.unpinItem(itemId);
    });

    ipcMain.handle('items:reorderPins', async (_, spaceId: string, orderedItemIds: string[]) => {
        const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
        return facade.reorderPins(spaceId, orderedItemIds);
    });

    // Search operations - using default profile for now
    const DEFAULT_PROFILE_ID = 'default-profile';

    ipcMain.handle('search:items', async (_, query: string) => {
        const facade = serviceRegistry.get<SearchFacade>(SERVICE_KEYS.SEARCH_FACADE);
        return facade.search(DEFAULT_PROFILE_ID, query);
    });

    ipcMain.handle('search:recent', async (_, limit?: number) => {
        const facade = serviceRegistry.get<SearchFacade>(SERVICE_KEYS.SEARCH_FACADE);
        return facade.getRecent(DEFAULT_PROFILE_ID, limit);
    });

    ipcMain.handle('search:mostVisited', async (_, limit?: number) => {
        const facade = serviceRegistry.get<SearchFacade>(SERVICE_KEYS.SEARCH_FACADE);
        return facade.getMostVisited(DEFAULT_PROFILE_ID, limit);
    });

    // Metadata extraction operations
    const metadataService = new MetadataExtractionService();

    ipcMain.handle('metadata:extract', async (_, url: string) => {
        try {
            const metadata = await metadataService.extractMetadata(url);
            return { success: true, data: metadata };
        } catch (error) {
            console.error('[IPC] metadata:extract error:', error);
            return {
                success: false,
                error: {
                    type: 'system',
                    message: error instanceof Error ? error.message : 'Failed to extract metadata'
                }
            };
        }
    });

    ipcMain.handle('metadata:extractFavicon', async (_, url: string) => {
        try {
            return { success: true, data: await metadataService.extractFavicon(url) };
        } catch (error) {
            return {
                success: false,
                error: {
                    type: 'system',
                    message: error instanceof Error ? error.message : 'Failed to extract favicon'
                }
            };
        }
    });

    // File system operations
    const fileSystemService = new LocalFileSystemService();

    ipcMain.handle('fs:selectFolder', async () => {
        try {
            const path = await fileSystemService.selectFolder();
            return { success: true, data: path };
        } catch (error) {
            return {
                success: false,
                error: {
                    type: 'system',
                    message: error instanceof Error ? error.message : 'Failed to select folder'
                }
            };
        }
    });

    ipcMain.handle('fs:selectFile', async () => {
        try {
            const path = await fileSystemService.selectFile();
            return { success: true, data: path };
        } catch (error) {
            return {
                success: false,
                error: {
                    type: 'system',
                    message: error instanceof Error ? error.message : 'Failed to select file'
                }
            };
        }
    });

    ipcMain.handle('fs:loadFolderChildren', async (_, folderPath: string) => {
        try {
            const children = await fileSystemService.loadFolderChildren(folderPath);
            return { success: true, data: children };
        } catch (error) {
            return {
                success: false,
                error: {
                    type: 'system',
                    message: error instanceof Error ? error.message : 'Failed to load folder children'
                }
            };
        }
    });

    // App info
    ipcMain.handle('app:getVersion', () => {
        return process.env.npm_package_version || '0.1.0';
    });

    ipcMain.handle('app:getPlatform', () => {
        return process.platform;
    });

    // Clipboard operations
    ipcMain.handle('clipboard:readText', () => {
        return clipboard.readText();
    });

    ipcMain.handle('clipboard:writeText', (_, text: string) => {
        clipboard.writeText(text);
        return true;
    });

    console.log('IPC handlers registered');
}
