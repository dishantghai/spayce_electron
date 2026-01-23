import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Folder,
    FolderOpen,
    FolderInput,
    FolderPlus,
    Link,
    FileText,
    FileCode,
    FileCog,
    FileImage,
    FileVideo,
    FileAudio,
    FileArchive,
    File,
    MoreVertical,
    Upload,
    X,
    Globe,
} from 'lucide-react';
import type { Space, SpaceItem } from '../../types';
import { SpaceItemType } from '../../types';
import styles from './SpaceCard.module.css';

export interface SpaceCardProps {
    space: Space;
    spaceIndex: number;
    isSelected?: boolean;
    selectedItemId?: string | null;
    keyboardSelectedItemId?: string | null;
    expandedIds?: Set<string>;
    onSelect?: () => void;
    onItemClick?: (item: SpaceItem, spaceId: string) => void;
    onItemContextMenu?: (item: SpaceItem, spaceId: string, event: React.MouseEvent) => void;
    onExpandedChange?: (expandedIds: Set<string>) => void;
    onAddFolder?: (spaceId: string, parentId?: string | null) => void;
    onAddLink?: (spaceId: string, parentId?: string | null) => void;
}

export function SpaceCard({
    space,
    spaceIndex,
    isSelected = false,
    selectedItemId = null,
    keyboardSelectedItemId = null,
    expandedIds: controlledExpandedIds,
    onSelect,
    onItemClick,
    onItemContextMenu,
    onExpandedChange,
    onAddFolder,
    onAddLink,
}: SpaceCardProps): React.ReactElement {
    const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(() => new Set());
    const expandedIds = controlledExpandedIds ?? internalExpandedIds;

    const handleExpandChange = useCallback((itemId: string, expanded: boolean) => {
        const newSet = new Set(expandedIds);
        if (expanded) {
            newSet.add(itemId);
        } else {
            newSet.delete(itemId);
        }
        if (!controlledExpandedIds) {
            setInternalExpandedIds(newSet);
        }
        onExpandedChange?.(newSet);
    }, [expandedIds, controlledExpandedIds, onExpandedChange]);

    const cardClasses = [
        styles.spaceCard,
        isSelected && styles.spaceCardSelected,
    ].filter(Boolean).join(' ');

    return (
        <div
            className={cardClasses}
            style={{ '--space-accent-color': space.accentColor } as React.CSSProperties}
            onClick={onSelect}
        >
            {/* Header */}
            <CardHeader space={space} />

            {/* Content - Tree View */}
            <div className={styles.cardContent}>
                {space.rootItems.length === 0 ? (
                    <div className={styles.emptyState}>No items yet</div>
                ) : (
                    space.rootItems.map((item) => (
                        <CardTreeItem
                            key={item.id}
                            item={item}
                            level={0}
                            spaceId={space.id}
                            spaceIndex={spaceIndex}
                            spaceColor={space.accentColor}
                            selectedItemId={selectedItemId}
                            keyboardSelectedItemId={keyboardSelectedItemId}
                            expandedIds={expandedIds}
                            onItemClick={onItemClick}
                            onItemContextMenu={onItemContextMenu}
                            onExpandChange={handleExpandChange}
                            onAddFolder={onAddFolder}
                            onAddLink={onAddLink}
                        />
                    ))
                )}
            </div>

            {/* Actions Bar - only show for selected card */}
            {isSelected && (
                <SpaceActionsBar
                    spaceId={space.id}
                    spaceColor={space.accentColor}
                    onAddFolder={onAddFolder}
                    onAddLink={onAddLink}
                />
            )}
        </div>
    );
}

interface CardHeaderProps {
    space: Space;
}

function CardHeader({ space }: CardHeaderProps): React.ReactElement {
    const IconComponent = getSpaceIconComponent(space.iconName);

    return (
        <div className={styles.cardHeader}>
            <span className={styles.headerIcon}>
                <IconComponent size={20} style={{ color: space.accentColor }} />
            </span>
            <span className={styles.headerTitle}>{space.name}</span>
        </div>
    );
}

interface CardTreeItemProps {
    item: SpaceItem;
    level: number;
    spaceId: string;
    spaceIndex: number;
    spaceColor: string;
    selectedItemId: string | null;
    keyboardSelectedItemId: string | null;
    expandedIds: Set<string>;
    parentFolderIds?: string[];
    onItemClick?: (item: SpaceItem, spaceId: string) => void;
    onItemContextMenu?: (item: SpaceItem, spaceId: string, event: React.MouseEvent) => void;
    onExpandChange: (itemId: string, expanded: boolean) => void;
    onAddFolder?: (spaceId: string, parentId?: string | null) => void;
    onAddLink?: (spaceId: string, parentId?: string | null) => void;
}

function CardTreeItem({
    item,
    level,
    spaceId,
    spaceIndex,
    spaceColor,
    selectedItemId,
    keyboardSelectedItemId,
    expandedIds,
    parentFolderIds = [],
    onItemClick,
    onItemContextMenu,
    onExpandChange,
    onAddFolder,
    onAddLink,
}: CardTreeItemProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);

    const isFolder = item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder;
    const isExpanded = expandedIds.has(item.id);
    const isSelected = !isFolder && selectedItemId === item.id;
    const isKeyboardSelected = keyboardSelectedItemId === item.id;
    const hasChildren = item.children && item.children.length > 0;

    const indentPx = 8 + level * 16;

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFolder) {
            onExpandChange(item.id, !isExpanded);
        }
        onItemClick?.(item, spaceId);
    }, [item, spaceId, isFolder, isExpanded, onItemClick, onExpandChange]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onItemContextMenu?.(item, spaceId, e);
    }, [item, spaceId, onItemContextMenu]);

    const handleAddSubfolder = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        // Expand folder first
        if (!isExpanded) {
            onExpandChange(item.id, true);
        }
        onAddFolder?.(spaceId, item.id);
    }, [spaceId, item.id, isExpanded, onExpandChange, onAddFolder]);

    const handleAddLink = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        // Expand folder first
        if (!isExpanded) {
            onExpandChange(item.id, true);
        }
        onAddLink?.(spaceId, item.id);
    }, [spaceId, item.id, isExpanded, onExpandChange, onAddLink]);

    const rowClasses = [
        styles.treeItem,
        isSelected && styles.treeItemSelected,
        isKeyboardSelected && styles.treeItemKeyboardSelected,
    ].filter(Boolean).join(' ');

    return (
        <>
            <div
                className={rowClasses}
                style={{ paddingLeft: `${indentPx}px` }}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Icon */}
                <span className={styles.itemIcon}>
                    <TreeItemIcon
                        type={item.type}
                        isExpanded={isExpanded}
                        faviconUrl={item.faviconUrl}
                        fileName={item.name}
                        accentColor={spaceColor}
                    />
                </span>

                {/* Name */}
                <span className={styles.itemName}>{item.name}</span>

                {/* Hover Actions */}
                {isHovered && (
                    <div className={styles.hoverActions}>
                        {isFolder && (
                            <>
                                <button
                                    className={styles.hoverAction}
                                    onClick={handleAddSubfolder}
                                    title="Add Subfolder"
                                >
                                    <FolderPlus size={14} />
                                </button>
                                <button
                                    className={styles.hoverAction}
                                    onClick={handleAddLink}
                                    title="Add Link"
                                >
                                    <Link size={14} />
                                </button>
                            </>
                        )}
                        <button
                            className={styles.hoverAction}
                            onClick={handleContextMenu}
                            title="More options"
                        >
                            <MoreVertical size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Children */}
            {isFolder && hasChildren && (
                <div className={`${styles.children} ${!isExpanded ? styles.childrenCollapsed : ''}`}>
                    {isExpanded && item.children.map((child) => (
                        <CardTreeItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            spaceId={spaceId}
                            spaceIndex={spaceIndex}
                            spaceColor={spaceColor}
                            selectedItemId={selectedItemId}
                            keyboardSelectedItemId={keyboardSelectedItemId}
                            expandedIds={expandedIds}
                            parentFolderIds={[...parentFolderIds, item.id]}
                            onItemClick={onItemClick}
                            onItemContextMenu={onItemContextMenu}
                            onExpandChange={onExpandChange}
                            onAddFolder={onAddFolder}
                            onAddLink={onAddLink}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

interface TreeItemIconProps {
    type: SpaceItemType;
    isExpanded: boolean;
    faviconUrl?: string | null;
    fileName?: string;
    accentColor: string;
}

function TreeItemIcon({
    type,
    isExpanded,
    faviconUrl,
    fileName,
    accentColor,
}: TreeItemIconProps): React.ReactElement {
    // Local folder
    if (type === SpaceItemType.localFolder) {
        const Icon = isExpanded ? FolderOpen : FolderInput;
        return <Icon size={16} style={{ color: isExpanded ? accentColor : '#6B7280' }} />;
    }

    // Local file
    if (type === SpaceItemType.localFile) {
        const Icon = getFileIcon(fileName || '');
        return <Icon size={16} style={{ color: '#6B7280' }} />;
    }

    // Regular folder
    if (type === SpaceItemType.folder) {
        const Icon = isExpanded ? FolderOpen : Folder;
        return <Icon size={16} style={{ color: isExpanded ? accentColor : '#6B7280' }} />;
    }

    // Link - show favicon
    if (faviconUrl) {
        return (
            <img
                src={faviconUrl}
                alt=""
                className={styles.faviconIcon}
                onError={(e) => {
                    // Fallback to globe icon on error
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove(styles.hidden);
                }}
            />
        );
    }

    return (
        <span className={styles.faviconPlaceholder}>
            <Globe size={14} style={{ color: accentColor }} />
        </span>
    );
}

function getFileIcon(fileName: string): React.ComponentType<any> {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    switch (ext) {
        case 'dart':
        case 'js':
        case 'ts':
        case 'tsx':
        case 'jsx':
        case 'py':
        case 'java':
        case 'swift':
        case 'kt':
        case 'go':
        case 'rs':
        case 'c':
        case 'cpp':
        case 'h':
            return FileCode;
        case 'txt':
        case 'md':
        case 'rtf':
            return FileText;
        case 'json':
        case 'yaml':
        case 'yml':
        case 'xml':
        case 'toml':
            return FileCog;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
            return FileImage;
        case 'mp4':
        case 'mov':
        case 'avi':
        case 'mkv':
            return FileVideo;
        case 'mp3':
        case 'wav':
        case 'flac':
        case 'm4a':
            return FileAudio;
        case 'zip':
        case 'tar':
        case 'gz':
        case 'rar':
            return FileArchive;
        case 'pdf':
            return FileText;
        default:
            return File;
    }
}

interface SpaceActionsBarProps {
    spaceId: string;
    spaceColor: string;
    onAddFolder?: (spaceId: string, parentId?: string | null) => void;
    onAddLink?: (spaceId: string, parentId?: string | null) => void;
}

function SpaceActionsBar({
    spaceId,
    spaceColor,
    onAddFolder,
    onAddLink,
}: SpaceActionsBarProps): React.ReactElement {
    return (
        <div className={styles.actionsBar}>
            <button
                className={styles.actionButton}
                onClick={() => onAddFolder?.(spaceId, null)}
                title="Add Folder"
            >
                <FolderPlus />
            </button>
            <button
                className={styles.actionButton}
                onClick={() => { }}
                title="Add Note (Coming Soon)"
                disabled
            >
                <FileText />
            </button>
            <button
                className={styles.actionButton}
                onClick={() => onAddLink?.(spaceId, null)}
                title="Add Link"
            >
                <Link />
            </button>
            <button
                className={styles.actionButton}
                onClick={() => { }}
                title="Import Folder (Coming Soon)"
                disabled
            >
                <FolderInput />
            </button>
            <button
                className={styles.actionButton}
                onClick={() => { }}
                title="Import File (Coming Soon)"
                disabled
            >
                <Upload />
            </button>
        </div>
    );
}

// Helper to get space icon component
import * as LucideIcons from 'lucide-react';

function getSpaceIconComponent(iconName: string): React.ComponentType<{ size?: number; style?: React.CSSProperties }> {
    const iconMap: Record<string, React.ComponentType<any>> = {
        'briefcase': LucideIcons.Briefcase,
        'building': LucideIcons.Building,
        'laptop': LucideIcons.Laptop,
        'calendar': LucideIcons.Calendar,
        'clipboard': LucideIcons.Clipboard,
        'home': LucideIcons.Home,
        'heart': LucideIcons.Heart,
        'user': LucideIcons.User,
        'users': LucideIcons.Users,
        'smile': LucideIcons.Smile,
        'code': LucideIcons.Code,
        'terminal': LucideIcons.Terminal,
        'database': LucideIcons.Database,
        'cpu': LucideIcons.Cpu,
        'git-branch': LucideIcons.GitBranch,
        'palette': LucideIcons.Palette,
        'image': LucideIcons.Image,
        'music': LucideIcons.Music,
        'video': LucideIcons.Video,
        'camera': LucideIcons.Camera,
        'folder': LucideIcons.Folder,
        'layers': LucideIcons.Layers,
        'archive': LucideIcons.Archive,
        'bookmark': LucideIcons.Bookmark,
        'star': LucideIcons.Star,
        'book': LucideIcons.Book,
        'graduation-cap': LucideIcons.GraduationCap,
        'lightbulb': LucideIcons.Lightbulb,
        'brain': LucideIcons.Brain,
        'shopping-cart': LucideIcons.ShoppingCart,
        'dollar-sign': LucideIcons.DollarSign,
        'credit-card': LucideIcons.CreditCard,
        'mail': LucideIcons.Mail,
        'message-circle': LucideIcons.MessageCircle,
        'phone': LucideIcons.Phone,
        'plane': LucideIcons.Plane,
        'map': LucideIcons.Map,
        'compass': LucideIcons.Compass,
        'activity': LucideIcons.Activity,
        'dumbbell': LucideIcons.Dumbbell,
        'rocket': LucideIcons.Rocket,
        'trophy': LucideIcons.Trophy,
        'target': LucideIcons.Target,
        'zap': LucideIcons.Zap,
        'flame': LucideIcons.Flame,
    };
    return iconMap[iconName] || LucideIcons.Layers;
}

export { getSpaceIconComponent };
