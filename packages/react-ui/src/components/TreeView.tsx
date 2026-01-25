import React, { useState, useCallback } from 'react';
import type { SpaceItem, InlineInputState } from '../types';
import { SpayceColors } from '../theme';
import { TreeItem } from './TreeItem';
import { InlineInput } from './InlineInput';
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
}: TreeViewProps): React.ReactElement {
    // Internal expanded state (uncontrolled mode)
    const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(
        () => new Set<string>()
    );

    // Use controlled or uncontrolled mode
    const expandedIds = controlledExpandedIds ?? internalExpandedIds;

    // Check if inline input should appear at root level
    const showRootInlineInput = inlineInput && inlineInput.parentId === null;

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

    return (
        <div className={styles.tree} role="tree">
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
                    onItemClick={onItemClick}
                    onItemContextMenu={onItemContextMenu}
                    onItemExpand={handleItemExpand}
                    onAddSubfolder={onAddSubfolder}
                    onAddLink={onAddLink}
                    onInlineInputSubmit={onInlineInputSubmit}
                    onInlineInputCancel={onInlineInputCancel}
                    onRenameSubmit={onRenameSubmit}
                    onRenameCancel={onRenameCancel}
                />
            ))}
        </div>
    );
}

// Re-export related components for convenience
export { TreeItem } from './TreeItem';
export { TreeItemIcon } from './TreeItemIcon';
