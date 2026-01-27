import React, { useState, useCallback } from 'react';
import type { NodeRendererProps } from 'react-arborist';
import { FolderPlus, Link, MoreVertical } from 'lucide-react';
import type { SpaceItem } from '../../../types';
import { SpaceItemType } from '../../../types';
import { TreeItemIcon } from '../../TreeItemIcon';
import { InlineRenameInput } from '../../InlineRenameInput';
import { SpayceColors } from '../../../theme';
import styles from './SpayceTree.module.css';

export interface SpayceTreeNodeExtraProps {
    spaceId: string;
    accentColor?: string;
    renameItemId?: string | null;
    activeId?: string | null;
    onItemClick?: (item: SpaceItem) => void;
    onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
    onAddSubfolder?: (item: SpaceItem) => void;
    onAddLink?: (item: SpaceItem) => void;
    onRenameSubmit?: (itemId: string, newName: string) => void;
    onRenameCancel?: () => void;
}

type SpayceTreeNodeProps = NodeRendererProps<SpaceItem> & SpayceTreeNodeExtraProps;

/**
 * SpayceTreeNode - Custom node renderer for React Arborist
 * 
 * Renders each tree item with:
 * - Icon (folder/link with favicon support)
 * - Name text
 * - Hover actions (add subfolder, add link, context menu)
 * - Inline rename support
 * - Drag handle integration
 */
export function SpayceTreeNode({
    node,
    style,
    dragHandle,
    spaceId,
    accentColor = SpayceColors.primary,
    renameItemId,
    activeId,
    onItemClick,
    onItemContextMenu,
    onAddSubfolder,
    onAddLink,
    onRenameSubmit,
    onRenameCancel,
}: SpayceTreeNodeProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);
    const item = node.data;
    const isFolder = item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder;
    const isRenaming = renameItemId === item.id;
    const isSelected = node.isSelected;
    const isActive = activeId === item.id;

    // Get file extension for file icons
    const extension = item.type === SpaceItemType.file || item.type === SpaceItemType.localFile
        ? getExtension(item.name)
        : undefined;

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isRenaming) return;

        // Toggle expand/collapse for folders
        if (isFolder) {
            node.toggle();
        }

        // Notify parent for selection/focus
        onItemClick?.(item);
    }, [node, item, isFolder, isRenaming, onItemClick]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isRenaming) return;
        onItemClick?.(item);
        onItemContextMenu?.(item, e);
    }, [item, isRenaming, onItemClick, onItemContextMenu]);

    const handleAddSubfolder = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onAddSubfolder?.(item);
    }, [item, onAddSubfolder]);

    const handleAddLink = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onAddLink?.(item);
    }, [item, onAddLink]);

    const handleMoreOptions = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        handleContextMenu(e);
    }, [handleContextMenu]);

    // Build class names
    const classNames = [
        styles.treeItem,
        isSelected && styles.treeItemSelected,
        isActive && styles.treeItemActive,
    ].filter(Boolean).join(' ');

    return (
        <div
            ref={dragHandle}
            style={{
                ...style,
                '--tree-accent-color': accentColor,
            } as React.CSSProperties}
            className={classNames}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="treeitem"
            aria-expanded={isFolder ? node.isOpen : undefined}
            aria-selected={isSelected}
        >
            {/* Item icon */}
            <span className={styles.itemIcon}>
                <TreeItemIcon
                    type={item.type}
                    isExpanded={node.isOpen}
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

            {/* Context icons on hover */}
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
                        onClick={handleMoreOptions}
                        title="More options"
                    >
                        <MoreVertical size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

function getExtension(filename: string): string | undefined {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot > 0) {
        return filename.substring(lastDot).toLowerCase();
    }
    return undefined;
}
