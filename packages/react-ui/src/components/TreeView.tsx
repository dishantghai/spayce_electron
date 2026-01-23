import React, { useState, useCallback } from 'react';
import type { SpaceItem } from '../types';
import { SpayceColors } from '../theme';
import { TreeItem } from './TreeItem';
import styles from './TreeView.module.css';

export interface TreeViewProps {
    /** Array of root-level items to display */
    items: SpaceItem[];
    /** Currently selected item ID */
    selectedId?: string | null;
    /** Currently active item ID (shows accent border) */
    activeId?: string | null;
    /** Space accent color for active item border */
    accentColor?: string;
    /** IDs of items that should be expanded (controlled mode) */
    expandedIds?: Set<string>;
    /** Called when an item is clicked */
    onItemClick?: (item: SpaceItem) => void;
    /** Called when right-clicking an item */
    onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
    /** Called when a folder is expanded or collapsed */
    onItemExpand?: (item: SpaceItem, expanded: boolean) => void;
    /** Called when expanded state changes (uncontrolled mode) */
    onExpandedChange?: (expandedIds: Set<string>) => void;
}

/**
 * TreeView - A reusable tree component for displaying hierarchical SpaceItems.
 * 
 * Used in:
 * - Sidebar (full tree of all spaces)
 * - Space Cards (tree of single space's items)
 * 
 * Features:
 * - Infinite nesting levels
 * - Multiple item types (folders, links, local folders, files)
 * - Animated expand/collapse with chevron rotation
 * - Keyboard navigation
 * - ARIA tree role for accessibility
 */
export function TreeView({
    items,
    selectedId = null,
    activeId = null,
    accentColor = SpayceColors.primary,
    expandedIds: controlledExpandedIds,
    onItemClick,
    onItemContextMenu,
    onItemExpand,
    onExpandedChange,
}: TreeViewProps): React.ReactElement {
    // Internal expanded state (uncontrolled mode)
    const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(
        () => new Set<string>()
    );

    // Use controlled or uncontrolled mode
    const expandedIds = controlledExpandedIds ?? internalExpandedIds;

    const handleItemExpand = useCallback(
        (item: SpaceItem, expanded: boolean) => {
            const newExpandedIds = new Set(expandedIds);
            if (expanded) {
                newExpandedIds.add(item.id);
            } else {
                newExpandedIds.delete(item.id);
            }

            // Update internal state if uncontrolled
            if (!controlledExpandedIds) {
                setInternalExpandedIds(newExpandedIds);
            }

            // Notify parent
            onExpandedChange?.(newExpandedIds);
            onItemExpand?.(item, expanded);
        },
        [expandedIds, controlledExpandedIds, onExpandedChange, onItemExpand]
    );

    if (!items || items.length === 0) {
        return <div className={styles.tree} role="tree" aria-label="Empty tree" />;
    }

    return (
        <div className={styles.tree} role="tree">
            {items.map((item) => (
                <TreeItem
                    key={item.id}
                    item={item}
                    depth={0}
                    selectedId={selectedId}
                    activeId={activeId}
                    expandedIds={expandedIds}
                    accentColor={accentColor}
                    onItemClick={onItemClick}
                    onItemContextMenu={onItemContextMenu}
                    onItemExpand={handleItemExpand}
                />
            ))}
        </div>
    );
}

// Re-export related components for convenience
export { TreeItem } from './TreeItem';
export { TreeItemIcon } from './TreeItemIcon';
