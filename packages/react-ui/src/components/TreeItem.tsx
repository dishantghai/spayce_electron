import React, { useCallback, useState } from 'react';
import { FolderPlus, Link, MoreVertical } from 'lucide-react';
import type { SpaceItem, InlineInputState } from '../types';
import { SpaceItemType } from '../types';
import { SpayceColors } from '../theme';
import { TreeItemIcon } from './TreeItemIcon';
import { InlineInput } from './InlineInput';
import { InlineRenameInput } from './InlineRenameInput';
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
    onItemClick?: (item: SpaceItem) => void;
    onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
    onItemExpand?: (item: SpaceItem, expanded: boolean) => void;
    onAddSubfolder?: (parentItem: SpaceItem) => void;
    onAddLink?: (parentItem: SpaceItem) => void;
    onInlineInputSubmit?: (value: string, type: 'folder' | 'link', parentId: string | null) => void;
    onInlineInputCancel?: () => void;
    onRenameSubmit?: (itemId: string, newName: string) => void;
    onRenameCancel?: () => void;
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
    onItemClick,
    onItemContextMenu,
    onItemExpand,
    onAddSubfolder,
    onAddLink,
    onInlineInputSubmit,
    onInlineInputCancel,
    onRenameSubmit,
    onRenameCancel,
}: TreeItemProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);
    const isFolder = item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder;
    const isExpanded = expandedIds.has(item.id);
    const isSelected = selectedId === item.id;
    const isActive = activeId === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isRenaming = renameItemId === item.id;

    // Check if inline input should appear inside this folder
    const showInlineInputInside = inlineInput && inlineInput.parentId === item.id;

    // Indentation: First level 0px, subfolders align icon with parent name
    // Parent has 8px padding + 16px icon = 24px, so subfolders need 24px base + 16px per additional level
    const indentPx = depth === 0 ? 0 : 24 + (depth - 1) * 16;

    // Click handler - expand/collapse folders AND notify parent for focus
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (isRenaming) return; // Don't handle clicks during rename
        // Toggle expand/collapse for folders with children
        if (isFolder && hasChildren) {
            onItemExpand?.(item, !isExpanded);
        }
        // Always notify parent to update focus state
        onItemClick?.(item);
    }, [item, isFolder, hasChildren, isExpanded, isRenaming, onItemClick, onItemExpand]);

    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            if (isRenaming) return;
            onItemContextMenu?.(item, e);
        },
        [item, isRenaming, onItemContextMenu]
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

    const rowClasses = [
        styles.treeItem,
        isSelected && styles.treeItemSelected,
        isActive && styles.treeItemActive,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <>
            <div
                className={rowClasses}
                style={{
                    paddingLeft: `${indentPx + 8}px`,
                    '--tree-accent-color': accentColor,
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
                                handleContextMenu(e as any);
                            }}
                            title="More options"
                        >
                            <MoreVertical size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Children (recursive) with vertical line */}
            {isFolder && (hasChildren || showInlineInputInside) && (
                <div
                    className={`${styles.children} ${!isExpanded && !showInlineInputInside ? styles.childrenCollapsed : ''}`}
                    style={{
                        '--folder-line-color': accentColor,
                        '--folder-line-left': `${depth === 0 ? 16 : indentPx + 8}px`,
                    } as React.CSSProperties}
                    role="group"
                >
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
                                onItemClick={onItemClick}
                                onItemContextMenu={onItemContextMenu}
                                onItemExpand={onItemExpand}
                                onAddSubfolder={onAddSubfolder}
                                onAddLink={onAddLink}
                                onInlineInputSubmit={onInlineInputSubmit}
                                onInlineInputCancel={onInlineInputCancel}
                                onRenameSubmit={onRenameSubmit}
                                onRenameCancel={onRenameCancel}
                            />
                        ))}
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
