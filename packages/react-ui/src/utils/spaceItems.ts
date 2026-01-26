import type { SpaceItem } from '../types';
import { SpaceItemType } from '../types';

export function collectLinksRecursive(item: SpaceItem): SpaceItem[] {
    const links: SpaceItem[] = [];

    function collect(node: SpaceItem) {
        if (node.type === SpaceItemType.link) {
            links.push(node);
        }
        if (node.children && node.children.length > 0) {
            node.children.forEach(collect);
        }
    }

    collect(item);
    return links;
}

export function hasLinksRecursive(item: SpaceItem): boolean {
    if (item.type === SpaceItemType.link) {
        return true;
    }
    if (item.children && item.children.length > 0) {
        return item.children.some(hasLinksRecursive);
    }
    return false;
}
