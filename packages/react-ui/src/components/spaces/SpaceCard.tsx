import React, { useState, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import {
    FolderInput,
    FolderPlus,
    Link,
    FileText,
    Upload,
} from 'lucide-react';
import type { Space, SpaceItem, InlineInputState } from '../../types';
import { TreeView } from '../TreeView';
import { SpayceTree } from '../tree/arborist';
import { FeatureFlags } from '../../config/features';
import { useSelectionStore } from '../../stores/selectionStore';
import { useInlineInputStore } from '../../stores/inlineInputStore';
import type { DropPosition } from '../../stores/dragDropUiStore';
import styles from './SpaceCard.module.css';

export interface SpaceCardProps {
    space: Space;
    spaceIndex: number;
    isSelected?: boolean;
    selectedItemId?: string | null;
    keyboardSelectedItemId?: string | null;
    expandedIds?: Set<string>;
    renameItemId?: string | null;
    onSelect?: () => void;
    onItemClick?: (item: SpaceItem, spaceId: string) => void;
    onItemContextMenu?: (item: SpaceItem, spaceId: string, event: React.MouseEvent) => void;
    onExpandedChange?: (expandedIds: Set<string>) => void;
    onAddFolder?: (spaceId: string, parentId?: string | null) => void;
    onAddLink?: (spaceId: string, parentId?: string | null) => void;
    onRenameSubmit?: (itemId: string, newName: string) => void;
    onRenameCancel?: () => void;
    onItemDrop?: (itemId: string, targetId: string, position: DropPosition, spaceId: string) => void;
    /** Called when an item is moved via Arborist drag-drop (new implementation) */
    onItemMoveArborist?: (draggedItemId: string, newParentId: string | null, newIndex: number, spaceId: string) => Promise<boolean>;
    /** Called when inline input is submitted (for creating folders/links) */
    onInlineInputSubmit?: (value: string, type: 'folder' | 'link', parentId: string | null, spaceId: string) => void;
    /** F034: Called when right-clicking on empty area of card (root context menu) */
    onRootContextMenu?: (spaceId: string, event: React.MouseEvent) => void;
}

export function SpaceCard({
    space,
    spaceIndex,
    isSelected = false,
    selectedItemId = null,
    keyboardSelectedItemId = null,
    expandedIds: controlledExpandedIds,
    renameItemId = null,
    onSelect,
    onItemClick,
    onItemContextMenu,
    onExpandedChange,
    onAddFolder,
    onAddLink,
    onRenameSubmit,
    onRenameCancel,
    onItemDrop,
    onItemMoveArborist,
    onInlineInputSubmit,
    onRootContextMenu,
}: SpaceCardProps): React.ReactElement {
    const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(() => new Set());
    const expandedIds = controlledExpandedIds ?? internalExpandedIds;

    // Get card-specific inline input state from store
    const { cardInput, setCardInput, clearCardInput, setCardRenameItemId } = useInlineInputStore();

    // Filter cardInput to only show for this space
    const inlineInputForThisCard: InlineInputState | null =
        cardInput && cardInput.spaceId === space.id ? cardInput : null;

    // Adapter callback for TreeView's onItemClick (adds spaceId)
    const handleItemClick = useCallback((item: SpaceItem) => {
        onItemClick?.(item, space.id);
    }, [space.id, onItemClick]);

    // Adapter callback for TreeView's onItemContextMenu (adds spaceId)
    const handleItemContextMenu = useCallback((item: SpaceItem, event: React.MouseEvent) => {
        onItemContextMenu?.(item, space.id, event);
    }, [space.id, onItemContextMenu]);

    // Adapter callback for TreeView's onAddSubfolder (adds spaceId and sets inline input)
    const handleAddSubfolder = useCallback((parentItem: SpaceItem) => {
        // CRITICAL FIX: Clear stale inline states before setting new input
        console.log('[SpaceCard] Hover action: Add Subfolder - clearing stale states');
        clearCardInput();
        setCardRenameItemId(null);

        // Expand the parent folder first
        const newExpandedIds = new Set(expandedIds);
        newExpandedIds.add(parentItem.id);
        if (!controlledExpandedIds) {
            setInternalExpandedIds(newExpandedIds);
        }
        onExpandedChange?.(newExpandedIds);

        // Set card inline input state
        setCardInput({ spaceId: space.id, parentId: parentItem.id, type: 'folder' });
        onAddFolder?.(space.id, parentItem.id);
    }, [space.id, expandedIds, controlledExpandedIds, onExpandedChange, setCardInput, clearCardInput, setCardRenameItemId, onAddFolder]);

    // Adapter callback for TreeView's onAddLink (adds spaceId and sets inline input)
    const handleAddLink = useCallback((parentItem: SpaceItem) => {
        // CRITICAL FIX: Clear stale inline states before setting new input
        console.log('[SpaceCard] Hover action: Add Link - clearing stale states');
        clearCardInput();
        setCardRenameItemId(null);

        // Expand the parent folder first
        const newExpandedIds = new Set(expandedIds);
        newExpandedIds.add(parentItem.id);
        if (!controlledExpandedIds) {
            setInternalExpandedIds(newExpandedIds);
        }
        onExpandedChange?.(newExpandedIds);

        // Set card inline input state
        setCardInput({ spaceId: space.id, parentId: parentItem.id, type: 'link' });
        onAddLink?.(space.id, parentItem.id);
    }, [space.id, expandedIds, controlledExpandedIds, onExpandedChange, setCardInput, clearCardInput, setCardRenameItemId, onAddLink]);

    // Handle inline input submission
    const handleInlineInputSubmit = useCallback((value: string, type: 'folder' | 'link', parentId: string | null) => {
        onInlineInputSubmit?.(value, type, parentId, space.id);
        clearCardInput();
    }, [space.id, onInlineInputSubmit, clearCardInput]);

    // Handle inline input cancel
    const handleInlineInputCancel = useCallback(() => {
        clearCardInput();
    }, [clearCardInput]);

    // Handle expanded state changes
    const handleExpandedChange = useCallback((newExpandedIds: Set<string>) => {
        if (!controlledExpandedIds) {
            setInternalExpandedIds(newExpandedIds);
        }
        onExpandedChange?.(newExpandedIds);
    }, [controlledExpandedIds, onExpandedChange]);

    // Handle card clicks to clear multi-selection and call onSelect
    const handleCardClick = useCallback((e: React.MouseEvent) => {
        // Clear multi-selection when clicking on card background
        const target = e.target as HTMLElement;
        if (target.classList.contains(styles.spaceCard) ||
            target.classList.contains(styles.cardContent) ||
            target.classList.contains(styles.emptyState)) {
            useSelectionStore.getState().clearSelection();
        }
        onSelect?.();
    }, [onSelect]);

    // F034: Handle right-click on empty area for root context menu
    const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
        // Only trigger if clicked on background, not on items
        const target = e.target as HTMLElement;
        const isBackground = target.classList.contains(styles.cardContent) ||
            target.classList.contains(styles.emptyState);

        if (!isBackground) return;

        e.preventDefault();
        e.stopPropagation();
        onRootContextMenu?.(space.id, e);
    }, [space.id, onRootContextMenu]);

    const cardClasses = [
        styles.spaceCard,
        isSelected && styles.spaceCardSelected,
    ].filter(Boolean).join(' ');

    return (
        <div
            className={cardClasses}
            style={{ '--space-accent-color': space.accentColor } as React.CSSProperties}
            onClick={handleCardClick}
        >
            {/* Header */}
            <CardHeader space={space} />

            {/* Content - Tree View (shared component with Sidebar) */}
            <div className={styles.cardContent} onContextMenu={handleRootContextMenu}>
                {(() => {
                    // Filter out pinned items - they're shown in sidebar only
                    const unpinnedItems = space.rootItems.filter(item => !item.isPinned);

                    if (unpinnedItems.length === 0) {
                        return <div className={styles.emptyState}>No items yet</div>;
                    }

                    return FeatureFlags.USE_ARBORIST_TREE ? (
                        <SpayceTree
                            items={unpinnedItems}
                            spaceId={space.id}
                            selectedId={keyboardSelectedItemId || selectedItemId}
                            activeId={keyboardSelectedItemId}
                            accentColor={space.accentColor}
                            renameItemId={renameItemId}
                            onItemClick={handleItemClick}
                            onItemContextMenu={handleItemContextMenu}
                            onAddSubfolder={handleAddSubfolder}
                            onAddLink={handleAddLink}
                            onRenameSubmit={onRenameSubmit}
                            onRenameCancel={onRenameCancel}
                            onItemMove={onItemMoveArborist ?
                                (draggedId, parentId, index) => onItemMoveArborist(draggedId, parentId, index, space.id)
                                : undefined
                            }
                        />
                    ) : (
                        <TreeView
                            items={unpinnedItems}
                            spaceId={space.id}
                            selectedId={keyboardSelectedItemId || selectedItemId}
                            activeId={keyboardSelectedItemId}
                            accentColor={space.accentColor}
                            expandedIds={expandedIds}
                            inlineInput={inlineInputForThisCard}
                            renameItemId={renameItemId}
                            dragDropContext="spaceCard"
                            onItemClick={handleItemClick}
                            onItemContextMenu={handleItemContextMenu}
                            onExpandedChange={handleExpandedChange}
                            onAddSubfolder={handleAddSubfolder}
                            onAddLink={handleAddLink}
                            onInlineInputSubmit={handleInlineInputSubmit}
                            onInlineInputCancel={handleInlineInputCancel}
                            onRenameSubmit={onRenameSubmit}
                            onRenameCancel={onRenameCancel}
                            onItemDrop={onItemDrop}
                        />
                    );
                })()}
            </div>

            {/* Actions Bar - only show for selected card */}
            {isSelected && (
                <SpaceActionsBar
                    spaceId={space.id}
                    spaceColor={space.accentColor}
                    onAddFolder={(spaceId, parentId) => {
                        setCardInput({ spaceId, parentId: parentId ?? null, type: 'folder' });
                        onAddFolder?.(spaceId, parentId);
                    }}
                    onAddLink={(spaceId, parentId) => {
                        setCardInput({ spaceId, parentId: parentId ?? null, type: 'link' });
                        onAddLink?.(spaceId, parentId);
                    }}
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
