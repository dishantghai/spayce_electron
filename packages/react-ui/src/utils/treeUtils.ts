/**
 * Tree utility functions for multi-selection support (F018)
 */
import type { SpaceItem } from '../types';
import { SpaceItemType } from '../types';

/**
 * Checks if an item is a folder type (folder or localFolder)
 */
function isFolderType(item: SpaceItem): boolean {
    return item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder;
}

/**
 * Flattens a tree of items into a flat array, respecting expanded state.
 * Only includes items that are currently visible (parent is expanded).
 * 
 * @param items - Root level items to flatten
 * @param expandedIds - Set of expanded folder IDs
 * @returns Flat array of visible items in tree order
 */
export function flattenVisibleItems(
    items: SpaceItem[],
    expandedIds: Set<string>
): SpaceItem[] {
    const result: SpaceItem[] = [];

    function flatten(nodes: SpaceItem[]) {
        for (const item of nodes) {
            result.push(item);

            // Only recurse into children if this folder is expanded
            const isExpanded = expandedIds.has(item.id);
            if (isFolderType(item) && isExpanded && item.children && item.children.length > 0) {
                flatten(item.children);
            }
        }
    }

    flatten(items);
    return result;
}

/**
 * Returns array of visible item IDs in tree order.
 * 
 * @param items - Root level items
 * @param expandedIds - Set of expanded folder IDs
 * @returns Array of visible item IDs
 */
export function getVisibleItemIds(
    items: SpaceItem[],
    expandedIds: Set<string>
): string[] {
    return flattenVisibleItems(items, expandedIds).map(item => item.id);
}

/**
 * Finds items by their IDs from a tree structure.
 * Searches recursively through all levels.
 * 
 * @param items - Root level items to search
 * @param ids - Array of IDs to find
 * @returns Array of found SpaceItems
 */
export function getItemsByIds(
    items: SpaceItem[],
    ids: string[]
): SpaceItem[] {
    const result: SpaceItem[] = [];
    const idSet = new Set(ids);

    function collect(nodes: SpaceItem[]) {
        for (const item of nodes) {
            if (idSet.has(item.id)) {
                result.push(item);
            }
            if (item.children && item.children.length > 0) {
                collect(item.children);
            }
        }
    }

    collect(items);
    return result;
}
