import type { SpaceItemEntity } from '../entities/SpaceItem';

export interface ISpaceItemsRepository {
    getItemsBySpaceId(spaceId: string): Promise<SpaceItemEntity[]>;
    getItemById(id: string): Promise<SpaceItemEntity | null>;
    getItemChildren(parentId: string): Promise<SpaceItemEntity[]>;
    getPinnedItems(spaceId: string): Promise<SpaceItemEntity[]>;
    searchItems(profileId: string, query: string): Promise<SpaceItemEntity[]>;
    getRecentItems(profileId: string, limit: number): Promise<SpaceItemEntity[]>;
    getMostVisitedItems(profileId: string, limit: number): Promise<SpaceItemEntity[]>;

    createItem(item: Omit<SpaceItemEntity, 'createdAt'>): Promise<SpaceItemEntity>;
    updateItem(item: SpaceItemEntity): Promise<void>;
    deleteItem(id: string): Promise<void>;
    moveItem(
        itemId: string,
        newSpaceId: string,
        newParentId: string | null,
        newOrder: number
    ): Promise<void>;
    reorderItems(parentId: string | null, orderedIds: string[]): Promise<void>;

    pinItem(itemId: string, position: number): Promise<void>;
    unpinItem(itemId: string): Promise<void>;
    reorderPins(spaceId: string, orderedIds: string[]): Promise<void>;

    incrementVisitCount(itemId: string): Promise<void>;

    deleteItemsBySpaceId(spaceId: string): Promise<void>;
    isDuplicateUrl(profileId: string, url: string): Promise<boolean>;
    renameItem(itemId: string, newName: string): Promise<void>;
}
