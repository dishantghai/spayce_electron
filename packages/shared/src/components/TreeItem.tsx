import React, { useCallback, useState } from 'react';
import { Copy, Link2, MoreVertical } from 'lucide-react';
import type { SpaceItem } from '../types';
import { SpaceItemType } from '../types';
import { SpayceColors } from '../theme';
import { TreeItemIcon } from './TreeItemIcon';
import styles from './TreeView.module.css';

interface TreeItemProps {
    item: SpaceItem;
    depth: number;
    selectedId: string | null;
    activeId: string | null;
    expandedIds: Set<string>;
    accentColor: string;
    onItemClick?: (item: SpaceItem) => void;
    onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
    onItemExpand?: (item: SpaceItem, expanded: boolean) => void;
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
    onItemClick,
    onItemContextMenu,
    onItemExpand,
}: TreeItemProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);
    const isFolder = item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder;
    const isExpanded = expandedIds.has(item.id);
    const isSelected = selectedId === item.id;
    const isActive = activeId === item.id;
    const hasChildren = item.children && item.children.length > 0;

    // Indentation: First level 0px, subfolders align icon with parent name
    // Parent has 8px padding + 16px icon = 24px, so subfolders need 24px base + 16px per additional level
    const indentPx = depth === 0 ? 0 : 24 + (depth - 1) * 16;

    const handleClick = useCallback(() => {
        if (isFolder && hasChildren) {
            onItemExpand?.(item, !isExpanded);
        }
        onItemClick?.(item);
    }, [item, isFolder, hasChildren, isExpanded, onItemClick, onItemExpand]);

    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            onItemContextMenu?.(item, e);
        },
        [item, onItemContextMenu]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
            if (e.key === 'ArrowRight' && isFolder && !isExpanded) {
                e.preventDefault();
                onItemExpand?.(item, true);
            }
            if (e.key === 'ArrowLeft' && isFolder && isExpanded) {
                e.preventDefault();
                onItemExpand?.(item, false);
            }
        },
        [handleClick, isFolder, isExpanded, item, onItemExpand]
    );

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
                onKeyDown={handleKeyDown}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                role="treeitem"
                aria-expanded={isFolder ? isExpanded : undefined}
                aria-selected={isSelected}
                tabIndex={0}
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

                {/* Item name */}
                <span className={styles.itemText}>{item.name}</span>

                {/* Folder context icons on hover */}
                {isFolder && isHovered && (
                    <div className={styles.contextIcons}>
                        <button
                            className={styles.contextIcon}
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log('Copy folder');
                            }}
                            title="Copy Folder"
                        >
                            <Copy size={14} />
                        </button>
                        <button
                            className={styles.contextIcon}
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log('Copy all links');
                            }}
                            title="Copy All Links"
                        >
                            <Link2 size={14} />
                        </button>
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
            {isFolder && hasChildren && (
                <div
                    className={`${styles.children} ${!isExpanded ? styles.childrenCollapsed : ''}`}
                    style={{
                        '--folder-line-color': accentColor,
                        '--folder-line-left': `${depth === 0 ? 16 : indentPx + 8}px`,
                    } as React.CSSProperties}
                    role="group"
                >
                    {isExpanded &&
                        item.children.map((child) => (
                            <TreeItem
                                key={child.id}
                                item={child}
                                depth={depth + 1}
                                selectedId={selectedId}
                                activeId={activeId}
                                expandedIds={expandedIds}
                                accentColor={accentColor}
                                onItemClick={onItemClick}
                                onItemContextMenu={onItemContextMenu}
                                onItemExpand={onItemExpand}
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
