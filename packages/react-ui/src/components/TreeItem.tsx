import React, { useCallback, useState, useMemo } from 'react';
import { FolderPlus, Link, MoreVertical } from 'lucide-react';
import type { SpaceItem, InlineInputState } from '../types';
import { SpaceItemType } from '../types';
import { SpayceColors } from '../theme';
import { TreeItemIcon } from './TreeItemIcon';
import { InlineInput } from './InlineInput';
import { InlineRenameInput } from './InlineRenameInput';
import { DraggableTreeItem, DroppableTreeItem, FlashItem } from './drag-drop';
import type { DragSource, DropPosition } from '../stores/dragDropUiStore';
import { useSelectionStore } from '../stores/selectionStore';
import { getItemsByIds } from '../utils/treeUtils';
import styles from './TreeView.module.css';

interface TreeItemProps {
    item: SpaceItem;
    depth: number;
    selectedId: string | null;
    activeId: string | null;
    expandedIds: Set<string>;
    accentColor: string;
    spaceId: string;
    inlineInput?: InlineInputState | null;
    renameItemId?: string | null;
    /** Context for drag-drop operations - 'sidebar' or 'spaceCard' */
    dragDropContext?: DragSource;
    /** F018: All visible item IDs for range selection */
    allVisibleIds?: string[];
    /** F020: All items in the tree for looking up selected items */
    allItems?: SpaceItem[];
    onItemClick?: (item: SpaceItem) => void;
    onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
    onItemExpand?: (item: SpaceItem, expanded: boolean) => void;
    onAddSubfolder?: (parentItem: SpaceItem) => void;
    onAddLink?: (parentItem: SpaceItem) => void;
    onInlineInputSubmit?: (value: string, type: 'folder' | 'link', parentId: string | null) => void;
    onInlineInputCancel?: () => void;
    onRenameSubmit?: (itemId: string, newName: string) => void;
    onRenameCancel?: () => void;
    onItemDrop?: (itemId: string, targetId: string, position: DropPosition, spaceId: string) => void;
}

/**
 * TreeItem - A single row in the tree view.
 * Handles indentation, icons, expand/collapse, and state styling.
 */
export function TreeItem({
    item,
    depth,
    selectedId,
    activeId,
    expandedIds,
    accentColor,
    spaceId,
    inlineInput,
    renameItemId,
    dragDropContext = 'sidebar',
    allVisibleIds = [],
    allItems = [],
    onItemClick,
    onItemContextMenu,
    onItemExpand,
    onAddSubfolder,
    onAddLink,
    onInlineInputSubmit,
    onInlineInputCancel,
    onRenameSubmit,
    onRenameCancel,
    onItemDrop,
}: TreeItemProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);
    const isFolder = item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder;
    const isExpanded = expandedIds.has(item.id);
    const isSelected = selectedId === item.id;
    const isActive = activeId === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isRenaming = renameItemId === item.id;

    // F019: Check if item is multi-selected using efficient selector
    const isMultiSelected = useSelectionStore((state) =>
        state.spaceId === spaceId && state.context === dragDropContext && state.selectedIds.has(item.id)
    );

    // F020: Get selected IDs for computing drag items
    const selectedIds = useSelectionStore((state) => state.selectedIds);
    const selectionSpaceId = useSelectionStore((state) => state.spaceId);
    const selectionContext = useSelectionStore((state) => state.context);

    // F020: Compute selected items for multi-drag
    const selectedItemsForDrag = useMemo(() => {
        // Only compute if we have multiple selections in the same space and context
        if (selectedIds.size <= 1 || selectionSpaceId !== spaceId || selectionContext !== dragDropContext) {
            return undefined;
        }
        // Get actual SpaceItem objects for selected IDs
        const foundItems = getItemsByIds(allItems, Array.from(selectedIds));
        return foundItems.length > 0 ? foundItems : undefined;
    }, [selectedIds, selectionSpaceId, selectionContext, spaceId, dragDropContext, allItems]);

    // Check if inline input should appear inside this folder
    const showInlineInputInside = inlineInput && inlineInput.parentId === item.id;

    // Indentation for vertical line positioning
    // Each level adds 20px of indent
    const indentPx = depth * 20;

    // Click handler - expand/collapse folders AND notify parent for focus
    // F017: Supports Ctrl+Click (Cmd+Click on Mac) for multi-selection toggle
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to TreeView container

        if (isRenaming) {
            return;
        }

        // F017: Detect platform for Cmd vs Ctrl
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
        const isShift = e.shiftKey;

        if (isCtrlOrCmd) {
            // F017: Toggle selection (add/remove from multi-selection)
            const selectionContext = dragDropContext === 'pins-grid' ? 'spaceCard' : dragDropContext;
            useSelectionStore.getState().toggleSelection(spaceId, item.id, selectionContext);
            // Don't expand/collapse folders on Ctrl+Click - just toggle selection
        } else if (isShift) {
            // F018: Range selection - select all items between anchor and clicked item
            const selectionContext = dragDropContext === 'pins-grid' ? 'spaceCard' : dragDropContext;
            useSelectionStore.getState().selectRange(spaceId, item.id, allVisibleIds, selectionContext);
            // Don't expand/collapse folders on Shift+Click - just select range
        } else {
            // Regular click - clear multi-selection and select single
            useSelectionStore.getState().clearSelection();

            // Toggle expand/collapse for all folders (including empty ones)
            if (isFolder) {
                onItemExpand?.(item, !isExpanded);
            }

            // Notify parent to update focus state
            onItemClick?.(item);
        }
    }, [item, spaceId, isFolder, isExpanded, isRenaming, allVisibleIds, onItemClick, onItemExpand]);

    const handleContextMenu = useCallback(
        (e: React.MouseEvent, setFocus = true) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling to parent folder
            if (isRenaming) return;
            // Set focus on item when context menu opens (unless called from hover button)
            if (setFocus) {
                onItemClick?.(item);
            }
            onItemContextMenu?.(item, e);
        },
        [item, isRenaming, onItemClick, onItemContextMenu]
    );

    const handleAddSubfolder = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onAddSubfolder?.(item);
    }, [item, onAddSubfolder]);

    const handleAddLink = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onAddLink?.(item);
    }, [item, onAddLink]);

    // Get file extension for file icons
    const extension = item.type === SpaceItemType.file || item.type === SpaceItemType.localFile
        ? getExtension(item.name)
        : undefined;

    // Calculate padding - child icons align with parent's text start
    // Parent text starts at: parentPadding + 16 (icon) + 8 (margin)
    // Root (depth 0): 8px
    // Level 1: parent at 8px, text at 32px, so child icon at 32px
    // Level 2: parent at 32px, text at 56px, so child icon at 56px
    // Formula: depth 0 = 8px, depth > 0 = 8 + (depth * 24)
    const itemPaddingLeft = depth === 0 ? 8 : 8 + (depth * 24);
    const isChild = depth > 0;

    // Child highlight offset: set to 0 since itemPaddingLeft already positions items correctly
    // The highlight will start at the item's padding position
    const childHighlightOffset = 0;

    const rowClasses = [
        styles.treeItem,
        isChild && styles.treeItemChild,
        isSelected && styles.treeItemSelected,
        isActive && styles.treeItemActive,
        isMultiSelected && styles.treeItemMultiSelected,
    ]
        .filter(Boolean)
        .join(' ');

    // Placeholder values for drag-drop (will be properly passed from TreeView)
    const ancestorIds: string[] = [];

    return (
        <>
            <FlashItem itemId={item.id} accentColor={accentColor}>
                <DroppableTreeItem
                    item={item}
                    spaceId={spaceId}
                    parentId={null}
                    index={0}
                    level={depth}
                    accentColor={accentColor}
                    ancestorIds={ancestorIds}
                    isExpanded={isExpanded}
                    dropContext={dragDropContext}
                    onDrop={(targetId, position) => {
                        // This is called when something is dropped on this item
                        // We don't know the dragged item ID here - it will be handled upstream
                        // Just pass the drop event info up
                        onItemDrop?.(targetId, targetId, position, spaceId);
                    }}
                >
                    <DraggableTreeItem
                        item={item}
                        spaceId={spaceId}
                        parentId={null}
                        index={0}
                        level={depth}
                        accentColor={accentColor}
                        ancestorIds={ancestorIds}
                        selectedItems={selectedItemsForDrag || []}
                        dragSource={dragDropContext}
                    >
                        <div
                            className={rowClasses}
                            style={{
                                paddingLeft: isMultiSelected ? `${itemPaddingLeft - 2}px` : `${itemPaddingLeft}px`,
                                '--tree-accent-color': accentColor,
                                '--child-highlight-offset': `${childHighlightOffset}px`,
                                '--item-padding-left': `${itemPaddingLeft}px`,
                                '--selection-bg': hexToRgba(accentColor, 0.1),
                                '--selection-bg-hover': hexToRgba(accentColor, 0.15),
                            } as React.CSSProperties}
                            onClick={handleClick}
                            onContextMenu={handleContextMenu}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            role="treeitem"
                            aria-expanded={isFolder ? isExpanded : undefined}
                            aria-selected={isSelected}
                        >
                            {/* Item icon */}
                            <span className={styles.itemIcon}>
                                <TreeItemIcon
                                    type={item.type}
                                    isExpanded={isExpanded}
                                    extension={extension}
                                    accentColor={accentColor}
                                    faviconUrl={item.faviconUrl}
                                    itemUrl={item.type === 'link' ? item.path : undefined}
                                />
                            </span>

                            {/* Item name or rename input */}
                            {isRenaming ? (
                                <InlineRenameInput
                                    item={item}
                                    onSave={(newName) => onRenameSubmit?.(item.id, newName)}
                                    onCancel={() => onRenameCancel?.()}
                                />
                            ) : (
                                <span className={styles.itemText}>{item.name}</span>
                            )}

                            {/* Context icons on hover - for both folders and links */}
                            {isHovered && !isRenaming && (
                                <div className={styles.contextIcons}>
                                    {isFolder && (
                                        <>
                                            <button
                                                className={styles.contextIcon}
                                                onClick={handleAddSubfolder}
                                                title="Add Subfolder"
                                            >
                                                <FolderPlus size={14} />
                                            </button>
                                            <button
                                                className={styles.contextIcon}
                                                onClick={handleAddLink}
                                                title="Add Link"
                                            >
                                                <Link size={14} />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className={styles.contextIcon}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleContextMenu(e as any, false);
                                        }}
                                        title="More options"
                                    >
                                        <MoreVertical size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </DraggableTreeItem>
                </DroppableTreeItem>
            </FlashItem>

            {/* Children (recursive) with vertical line */}
            {isFolder && (hasChildren || showInlineInputInside) && (
                <div
                    className={`${styles.children} ${!isExpanded && !showInlineInputInside ? styles.childrenCollapsed : ''}`}
                    style={{
                        // Vertical line centered with folder icon (icon is 16px wide)
                        // Center is at paddingLeft + 8px
                        '--folder-line-left': `${itemPaddingLeft + 8}px`,
                    } as React.CSSProperties}
                    role="group"
                >
                    {/* Inner wrapper for CSS grid height animation */}
                    <div className={styles.childrenInner}>
                        {/* Inline input inside this folder */}
                        {showInlineInputInside && (
                            <InlineInput
                                type={inlineInput!.type}
                                spaceId={spaceId}
                                parentId={item.id}
                                level={depth + 1}
                                accentColor={accentColor}
                                onSubmit={(value) => onInlineInputSubmit?.(value, inlineInput!.type, item.id)}
                                onCancel={() => onInlineInputCancel?.()}
                            />
                        )}
                        {(isExpanded || showInlineInputInside) &&
                            item.children.map((child) => (
                            <TreeItem
                                key={child.id}
                                item={child}
                                depth={depth + 1}
                                selectedId={selectedId}
                                activeId={activeId}
                                expandedIds={expandedIds}
                                accentColor={accentColor}
                                spaceId={spaceId}
                                inlineInput={inlineInput}
                                renameItemId={renameItemId}
                                dragDropContext={dragDropContext}
                                allVisibleIds={allVisibleIds}
                                allItems={allItems}
                                onItemClick={onItemClick}
                                onItemContextMenu={onItemContextMenu}
                                onItemExpand={onItemExpand}
                                onAddSubfolder={onAddSubfolder}
                                onAddLink={onAddLink}
                                onInlineInputSubmit={onInlineInputSubmit}
                                onInlineInputCancel={onInlineInputCancel}
                                onRenameSubmit={onRenameSubmit}
                                onRenameCancel={onRenameCancel}
                                onItemDrop={onItemDrop}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

function getExtension(filename: string): string | undefined {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot > 0) {
        return filename.substring(lastDot).toLowerCase();
    }
    return undefined;
}

/**
 * F019: Convert hex color to rgba with specified alpha
 */
function hexToRgba(hex: string, alpha: number): string {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
