import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { SpaceItem, InlineInputState } from '../types';
import { SpayceColors } from '../theme';
import { TreeItem } from './TreeItem';
import { InlineInput } from './InlineInput';
import type { DragSource, DropPosition } from '../stores/dragDropUiStore';
import { useDragDropUiStore } from '../stores/dragDropUiStore';
import { useSelectionStore } from '../stores/selectionStore';
import { getVisibleItemIds } from '../utils/treeUtils';
import styles from './TreeView.module.css';

export interface TreeViewProps {
    /** Array of root-level items to display */
    items: SpaceItem[];
    /** Space ID for inline input */
    spaceId: string;
    /** Currently selected item ID */
    selectedId?: string | null;
    /** Currently active item ID (shows accent border) */
    activeId?: string | null;
    /** Space accent color for active item border */
    accentColor?: string;
    /** IDs of items that should be expanded (controlled mode) */
    expandedIds?: Set<string>;
    /** Inline input state for creating folders/links */
    inlineInput?: InlineInputState | null;
    /** Item ID being renamed */
    renameItemId?: string | null;
    /** Called when an item is clicked */
    onItemClick?: (item: SpaceItem) => void;
    /** Called when right-clicking an item */
    onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
    /** Called when a folder is expanded or collapsed */
    onItemExpand?: (item: SpaceItem, expanded: boolean) => void;
    /** Called when expanded state changes (uncontrolled mode) */
    onExpandedChange?: (expandedIds: Set<string>) => void;
    /** Called when add subfolder button is clicked */
    onAddSubfolder?: (parentItem: SpaceItem) => void;
    /** Called when add link button is clicked */
    onAddLink?: (parentItem: SpaceItem) => void;
    /** Called when inline input is submitted */
    onInlineInputSubmit?: (value: string, type: 'folder' | 'link', parentId: string | null) => void;
    /** Called when inline input is cancelled */
    onInlineInputCancel?: () => void;
    /** Called when rename is submitted */
    onRenameSubmit?: (itemId: string, newName: string) => void;
    /** Called when rename is cancelled */
    onRenameCancel?: () => void;
    /** Context for drag-drop operations - 'sidebar' or 'spaceCard' */
    dragDropContext?: DragSource;
    /** Called when item is dropped to move it */
    onItemDrop?: (itemId: string, targetId: string, position: DropPosition, spaceId: string) => void;
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
    spaceId,
    selectedId = null,
    activeId = null,
    accentColor = SpayceColors.primary,
    expandedIds: controlledExpandedIds,
    inlineInput,
    renameItemId,
    onItemClick,
    onItemContextMenu,
    onItemExpand,
    onExpandedChange,
    onAddSubfolder,
    onAddLink,
    onInlineInputSubmit,
    onInlineInputCancel,
    onRenameSubmit,
    onRenameCancel,
    dragDropContext = 'sidebar',
    onItemDrop,
}: TreeViewProps): React.ReactElement {
    // Internal expanded state (uncontrolled mode)
    const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(
        () => new Set<string>()
    );

    // Get drag-expanded folder IDs from store (for auto-expand during drag)
    const dragExpandedFolderIds = useDragDropUiStore((state) => state.dragExpandedFolderIds);

    // Use controlled or uncontrolled mode, and add drag-expanded folders
    const expandedIds = useMemo(() => {
        const base = controlledExpandedIds ?? internalExpandedIds;
        if (dragExpandedFolderIds.size > 0) {
            const augmented = new Set(base);
            dragExpandedFolderIds.forEach(id => augmented.add(id));
            return augmented;
        }
        return base;
    }, [controlledExpandedIds, internalExpandedIds, dragExpandedFolderIds]);

    // F018: Compute visible item IDs for range selection
    const allVisibleIds = useMemo(
        () => getVisibleItemIds(items, expandedIds),
        [items, expandedIds]
    );

    // Check if inline input should appear at root level
    const showRootInlineInput = inlineInput && inlineInput.parentId === null;

    const handleItemExpand = useCallback(
        (item: SpaceItem, expanded: boolean) => {
            console.log(`[TreeView handleItemExpand] ========== EXPAND/COLLAPSE ==========`);
            console.log(`[TreeView handleItemExpand] Item: ${item.name} (${item.id})`);
            console.log(`[TreeView handleItemExpand] Target state: ${expanded ? 'EXPAND' : 'COLLAPSE'}`);

            // IMPORTANT: Use BASE expandedIds, not the augmented one with dragExpandedFolderIds
            // Otherwise, drag-expanded folders get permanently copied into the state
            const baseExpandedIds = controlledExpandedIds ?? internalExpandedIds;
            console.log(`[TreeView handleItemExpand] Current baseExpandedIds:`, Array.from(baseExpandedIds));
            console.log(`[TreeView handleItemExpand] Was in baseExpandedIds: ${baseExpandedIds.has(item.id)}`);

            const newExpandedIds = new Set(baseExpandedIds);
            if (expanded) {
                console.log(`[TreeView handleItemExpand] Adding to expandedIds`);
                newExpandedIds.add(item.id);
            } else {
                console.log(`[TreeView handleItemExpand] Removing from expandedIds`);
                newExpandedIds.delete(item.id);
            }

            console.log(`[TreeView handleItemExpand] New expandedIds:`, Array.from(newExpandedIds));

            // Update internal state if uncontrolled
            if (!controlledExpandedIds) {
                console.log(`[TreeView handleItemExpand] Updating internal state`);
                setInternalExpandedIds(newExpandedIds);
            }

            // Notify parent
            console.log(`[TreeView handleItemExpand] Notifying parent`);
            onExpandedChange?.(newExpandedIds);
            onItemExpand?.(item, expanded);
        },
        [controlledExpandedIds, internalExpandedIds, onExpandedChange, onItemExpand]
    );

    // Ref to track folders that need to be committed after drop
    // This survives across re-renders caused by async refetch operations
    const pendingExpandedFoldersRef = useRef<Set<string> | null>(null);

    // Effect to commit pending expanded folders after render stabilizes
    // This runs AFTER all state updates from refetch() are applied
    // Uses a ref check pattern to avoid running on every render while still catching state stabilization
    useEffect(() => {
        if (pendingExpandedFoldersRef.current && pendingExpandedFoldersRef.current.size > 0) {
            const foldersToCommit = pendingExpandedFoldersRef.current;
            pendingExpandedFoldersRef.current = null; // Clear ref first to prevent loops

            // Get current base expandedIds
            const baseExpandedIds = controlledExpandedIds ?? internalExpandedIds;

            // Check if folders are already in the base set
            const needsCommit = Array.from(foldersToCommit).some(id => !baseExpandedIds.has(id));

            if (needsCommit) {
                const newExpandedIds = new Set(baseExpandedIds);
                foldersToCommit.forEach(id => newExpandedIds.add(id));

                // Update internal state if uncontrolled
                if (!controlledExpandedIds) {
                    setInternalExpandedIds(newExpandedIds);
                }

                // Notify parent to persist
                onExpandedChange?.(newExpandedIds);
            }
        }
    }, [controlledExpandedIds, internalExpandedIds, onExpandedChange]); // Proper dependencies to run only when state changes

    // Handle drop: store folders to commit and let useEffect handle the actual commit
    const handleDrop = useCallback(
        (itemId: string, targetId: string, position: DropPosition, dropSpaceId: string) => {
            console.log(`[TreeView handleDrop] ========== DROP - STORING PENDING FOLDERS ==========`);

            // Get current drag-expanded folders from store BEFORE they get cleared by endDrag()
            const currentDragExpanded = dragExpandedFolderIds;
            console.log(`[TreeView handleDrop] Drag-expanded folders:`, Array.from(currentDragExpanded));

            if (currentDragExpanded.size > 0) {
                // Store in ref - will be committed by useEffect after renders stabilize
                // Also include any folders that were already expanded
                const baseExpandedIds = controlledExpandedIds ?? internalExpandedIds;
                const allFoldersToPreserve = new Set(baseExpandedIds);
                currentDragExpanded.forEach(id => allFoldersToPreserve.add(id));

                pendingExpandedFoldersRef.current = allFoldersToPreserve;
                console.log(`[TreeView handleDrop] Stored pending folders:`, Array.from(allFoldersToPreserve));
            }

            // Call the parent's drop handler - this will trigger async refetch
            console.log(`[TreeView handleDrop] Calling parent onItemDrop`);
            onItemDrop?.(itemId, targetId, position, dropSpaceId);
        },
        [controlledExpandedIds, internalExpandedIds, dragExpandedFolderIds, onItemDrop]
    );

    if (!items || items.length === 0) {
        return (
            <div className={styles.tree} role="tree" aria-label="Empty tree">
                {/* Show inline input even in empty tree */}
                {showRootInlineInput && (
                    <InlineInput
                        type={inlineInput!.type}
                        spaceId={spaceId}
                        parentId={null}
                        level={0}
                        accentColor={accentColor}
                        onSubmit={(value) => onInlineInputSubmit?.(value, inlineInput!.type, null)}
                        onCancel={() => onInlineInputCancel?.()}
                    />
                )}
            </div>
        );
    }

    // Handle clicks on empty space to clear multi-selection
    const handleContainerClick = useCallback((e: React.MouseEvent) => {
        // Only clear if clicking directly on the container (not on child elements)
        if (e.target === e.currentTarget) {
            useSelectionStore.getState().clearSelection();
        }
    }, []);

    return (
        <div className={styles.tree} role="tree" onClick={handleContainerClick}>
            {/* Root level inline input */}
            {showRootInlineInput && (
                <InlineInput
                    type={inlineInput!.type}
                    spaceId={spaceId}
                    parentId={null}
                    level={0}
                    accentColor={accentColor}
                    onSubmit={(value) => onInlineInputSubmit?.(value, inlineInput!.type, null)}
                    onCancel={() => onInlineInputCancel?.()}
                />
            )}
            {items.map((item) => (
                <TreeItem
                    key={item.id}
                    item={item}
                    depth={0}
                    selectedId={selectedId}
                    activeId={activeId}
                    expandedIds={expandedIds}
                    accentColor={accentColor}
                    spaceId={spaceId}
                    inlineInput={inlineInput}
                    renameItemId={renameItemId}
                    dragDropContext={dragDropContext}
                    allVisibleIds={allVisibleIds}
                    allItems={items}
                    onItemClick={onItemClick}
                    onItemContextMenu={onItemContextMenu}
                    onItemExpand={handleItemExpand}
                    onAddSubfolder={onAddSubfolder}
                    onAddLink={onAddLink}
                    onInlineInputSubmit={onInlineInputSubmit}
                    onInlineInputCancel={onInlineInputCancel}
                    onRenameSubmit={onRenameSubmit}
                    onRenameCancel={onRenameCancel}
                    onItemDrop={handleDrop}
                />
            ))}
        </div>
    );
}

// Re-export related components for convenience
export { TreeItem } from './TreeItem';
export { TreeItemIcon } from './TreeItemIcon';
