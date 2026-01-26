import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { TreeView } from './TreeView';
import { SidebarTabs, type SidebarTabId } from './SidebarTabs';
import { PinnedLinksGrid } from './PinnedLinksGrid';
import { SpaceHeader } from './SpaceHeader';
import { BottomBar } from './BottomBar';
import { CreateSpaceView } from './CreateSpaceView';
import type { Space, SpaceItem } from '../types';
import { SpaceItemType } from '../types';
import { useInlineInputStore } from '../stores/inlineInputStore';
import { normalizeUrl } from '../utils/url';
import styles from './Sidebar.module.css';

// Helper to check if item is a folder type
const isFolderType = (item: SpaceItem): boolean =>
    item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder;

export type SidebarMode = 'fixed' | 'floating';
export type SidebarViewMode = 'normal' | 'createSpace' | 'editSpace';

export interface SidebarProps {
    spaces: Space[];
    activeSpaceIndex: number;
    selectedItemId: string | null;
    mode?: SidebarMode;
    activeTab?: SidebarTabId;
    userName?: string;
    isVisible?: boolean;
    hasFocus?: boolean;
    onSpaceSelect?: (index: number) => void;
    onTabChange?: (tab: SidebarTabId) => void;
    onModeToggle?: () => void;
    onVisibilityChange?: (visible: boolean) => void;
    onItemClick?: (item: SpaceItem, spaceId: string) => void;
    onItemContextMenu?: (item: SpaceItem, spaceId: string, event: React.MouseEvent) => void;
    onCreateSpace?: (spaceData: { name: string; iconName: string; accentColor: string }) => void;
    onAddFolder?: (spaceId: string) => void;
    onAddLink?: (spaceId: string) => void;
    onCreateItem?: (input: { spaceId: string; parentId: string | null; name: string; path: string; type: string; faviconUrl?: string | null }) => Promise<void>;
    onRenameItem?: (itemId: string, newName: string) => Promise<void>;
    onEditSpace?: (space: Space, spaceData: { name: string; iconName: string; accentColor: string }) => void;
    onSettingsClick?: () => void;
    onFocusChange?: (hasFocus: boolean) => void;
    onCopySelected?: (focusedItemId: string | null) => void;
    onPasteToSelected?: (focusedItemId: string | null) => Promise<void>;
}

/**
 * Sidebar - Main navigation sidebar showing spaces and their tree structures.
 * Includes navigation tabs, pinned links grid, space header, tree view, and bottom bar.
 */
export function Sidebar({
    spaces,
    activeSpaceIndex,
    selectedItemId,
    mode = 'fixed',
    activeTab = 'spaces',
    userName,
    isVisible = true,
    hasFocus = true,
    onSpaceSelect,
    onTabChange,
    onModeToggle,
    onVisibilityChange,
    onItemClick,
    onItemContextMenu,
    onCreateSpace,
    onAddFolder,
    onAddLink,
    onCreateItem,
    onRenameItem,
    onEditSpace,
    onSettingsClick,
    onFocusChange,
    onCopySelected,
    onPasteToSelected,
}: SidebarProps): React.ReactElement {
    const sidebarRef = useRef<HTMLElement>(null);
    const [viewMode, setViewMode] = useState<SidebarViewMode>('normal');
    const [editingSpace, setEditingSpace] = useState<Space | null>(null);
    const activeSpace = spaces[activeSpaceIndex] || spaces[0];

    // Inline input and rename state
    const {
        sidebarInput,
        setSidebarInput,
        clearSidebarInput,
        sidebarRenameItemId,
        setSidebarRenameItemId,
    } = useInlineInputStore();

    // Track expandedIds per space to preserve state across refetches
    const [expandedIdsMap, setExpandedIdsMap] = useState<Map<string, Set<string>>>(new Map());
    const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

    // Get expandedIds for current space, initializing from space data if needed
    const expandedIds = React.useMemo(() => {
        if (!activeSpace) return new Set<string>();

        // If we already have expandedIds for this space, use them
        if (expandedIdsMap.has(activeSpace.id)) {
            return expandedIdsMap.get(activeSpace.id)!;
        }

        // Initialize from space data (isExpanded flags)
        const ids = new Set<string>();
        const collectExpanded = (items: SpaceItem[]) => {
            for (const item of items) {
                if (isFolderType(item) && item.isExpanded) {
                    ids.add(item.id);
                }
                if (item.children.length > 0) {
                    collectExpanded(item.children);
                }
            }
        };
        collectExpanded(activeSpace.rootItems);
        return ids;
    }, [activeSpace, expandedIdsMap]);

    // Update expandedIds for current space
    const setExpandedIds = useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
        if (!activeSpace) return;
        setExpandedIdsMap(prev => {
            const newMap = new Map(prev);
            const currentIds = prev.get(activeSpace.id) || new Set<string>();
            const newIds = typeof updater === 'function' ? updater(currentIds) : updater;
            newMap.set(activeSpace.id, newIds);
            return newMap;
        });
    }, [activeSpace]);

    // Clear focus when switching spaces
    useEffect(() => {
        setFocusedItemId(null);
    }, [activeSpaceIndex]);

    // Sync focusedItemId with selectedItemId when it changes externally (e.g., from context menu)
    // This prevents dual selection where focusedItemId overrides selectedItemId
    useEffect(() => {
        if (selectedItemId !== null && selectedItemId !== focusedItemId) {
            setFocusedItemId(selectedItemId);
        }
    }, [selectedItemId]);

    // Get pinned items from active space
    const pinnedItems = activeSpace?.rootItems.filter((item) => item.isPinned) || [];

    // Get non-pinned items for tree view
    const treeItems = activeSpace?.rootItems.filter((item) => !item.isPinned) || [];

    // Handle add space button click - switch to create view
    const handleAddSpace = useCallback(() => {
        setViewMode('createSpace');
        setEditingSpace(null);
    }, []);

    // Handle edit space - switch to edit view
    const handleEditSpace = useCallback((space: Space) => {
        setViewMode('editSpace');
        setEditingSpace(space);
    }, []);

    // Handle create/edit space success
    const handleSpaceSuccess = useCallback((spaceData: { name: string; iconName: string; accentColor: string }) => {
        if (viewMode === 'editSpace' && editingSpace) {
            onEditSpace?.(editingSpace, spaceData);
        } else {
            onCreateSpace?.(spaceData);
        }
        setViewMode('normal');
        setEditingSpace(null);
    }, [viewMode, editingSpace, onCreateSpace, onEditSpace]);

    // Handle cancel create/edit
    const handleCancel = useCallback(() => {
        setViewMode('normal');
        setEditingSpace(null);
    }, []);

    // Helper: Get flat list of visible items for navigation
    const getVisibleItems = useCallback((): SpaceItem[] => {
        const result: SpaceItem[] = [];
        const collectItems = (items: SpaceItem[]) => {
            for (const item of items) {
                result.push(item);
                // Recurse into both folder and localFolder types when expanded
                if (isFolderType(item) && expandedIds.has(item.id) && item.children.length > 0) {
                    collectItems(item.children);
                }
            }
        };
        collectItems(treeItems);
        return result;
    }, [treeItems, expandedIds]);

    // Helper: Find parent of an item
    const findParentItem = useCallback((targetId: string, items: SpaceItem[], parent: SpaceItem | null = null): SpaceItem | null => {
        for (const item of items) {
            if (item.id === targetId) return parent;
            if (item.children.length > 0) {
                const found = findParentItem(targetId, item.children, item);
                if (found !== undefined) return found;
            }
        }
        return null;
    }, []);

    // Arrow Up - Select previous item
    const selectPreviousItem = useCallback(() => {
        const visibleItems = getVisibleItems();
        if (visibleItems.length === 0) return;

        if (!focusedItemId) {
            setFocusedItemId(visibleItems[visibleItems.length - 1].id);
            return;
        }

        const currentIndex = visibleItems.findIndex(item => item.id === focusedItemId);
        if (currentIndex > 0) {
            setFocusedItemId(visibleItems[currentIndex - 1].id);
        }
    }, [focusedItemId, getVisibleItems]);

    // Arrow Down - Select next item
    const selectNextItem = useCallback(() => {
        const visibleItems = getVisibleItems();
        if (visibleItems.length === 0) return;

        if (!focusedItemId) {
            setFocusedItemId(visibleItems[0].id);
            return;
        }

        const currentIndex = visibleItems.findIndex(item => item.id === focusedItemId);
        if (currentIndex < visibleItems.length - 1) {
            setFocusedItemId(visibleItems[currentIndex + 1].id);
        }
    }, [focusedItemId, getVisibleItems]);

    // Arrow Right - Expand folder or move to first child
    const handleRightArrow = useCallback(() => {
        if (!focusedItemId) return;
        const visibleItems = getVisibleItems();
        const item = visibleItems.find(i => i.id === focusedItemId);
        if (!item) return;

        // Only handle folder types (folder and localFolder)
        if (isFolderType(item)) {
            if (!expandedIds.has(item.id)) {
                // Expand the folder
                setExpandedIds(prev => new Set([...prev, item.id]));
            } else if (item.children.length > 0) {
                // Move to first child
                setFocusedItemId(item.children[0].id);
            }
        }
        // For links/files, ArrowRight does nothing
    }, [focusedItemId, expandedIds, getVisibleItems]);

    // Arrow Left - Collapse folder or move to parent
    const handleLeftArrow = useCallback(() => {
        if (!focusedItemId) return;
        const visibleItems = getVisibleItems();
        const item = visibleItems.find(i => i.id === focusedItemId);
        if (!item) return;

        // If it's an expanded folder, collapse it
        if (isFolderType(item) && expandedIds.has(item.id)) {
            setExpandedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });
        } else {
            // Move to parent (works for any item type)
            const parent = findParentItem(focusedItemId, treeItems);
            if (parent) {
                setFocusedItemId(parent.id);
            }
        }
    }, [focusedItemId, expandedIds, treeItems, findParentItem, getVisibleItems]);

    // Enter - Open link or toggle folder
    const handleEnterKey = useCallback(() => {
        if (!focusedItemId || !activeSpace) return;
        const visibleItems = getVisibleItems();
        const item = visibleItems.find(i => i.id === focusedItemId);
        if (!item) return;

        if (item.type === 'folder') {
            // Toggle expand/collapse
            setExpandedIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(item.id)) {
                    newSet.delete(item.id);
                } else {
                    newSet.add(item.id);
                }
                return newSet;
            });
        } else {
            // Click the item (open link)
            onItemClick?.(item, activeSpace.id);
        }
    }, [focusedItemId, activeSpace, getVisibleItems, onItemClick]);

    // Keyboard navigation - matching Flutter behavior
    useEffect(() => {
        console.log('[F010-Sidebar] useEffect triggered - viewMode:', viewMode, 'hasFocus:', hasFocus);

        if (viewMode !== 'normal') {
            console.log('[F010-Sidebar] Skipping keyboard nav - viewMode is not normal:', viewMode);
            return;
        }
        if (!hasFocus) {
            console.log('[F010-Sidebar] Skipping keyboard nav - sidebar does not have focus');
            return;
        }

        console.log('[F010-Sidebar] Setting up keyboard listener - onCopySelected:', !!onCopySelected, 'onPasteToSelected:', !!onPasteToSelected);

        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if user is in an input field
            if (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement) {
                console.log('[F010-Sidebar] Ignoring keydown - target is input/textarea');
                return;
            }

            const isCtrlOrCmd = e.metaKey || e.ctrlKey;
            console.log('[F010-Sidebar] KeyDown:', e.key, 'metaKey:', e.metaKey, 'ctrlKey:', e.ctrlKey, 'isCtrlOrCmd:', isCtrlOrCmd);

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    selectPreviousItem();
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    selectNextItem();
                    break;

                case 'ArrowRight':
                    e.preventDefault();
                    handleRightArrow();
                    break;

                case 'ArrowLeft':
                    e.preventDefault();
                    handleLeftArrow();
                    break;

                case 'Enter':
                    e.preventDefault();
                    handleEnterKey();
                    break;

                case 'Tab':
                    // Tab/Shift+Tab - Navigate between spaces
                    e.preventDefault();
                    if (e.shiftKey) {
                        const prevIndex = activeSpaceIndex > 0 ? activeSpaceIndex - 1 : spaces.length - 1;
                        onSpaceSelect?.(prevIndex);
                    } else {
                        const nextIndex = activeSpaceIndex < spaces.length - 1 ? activeSpaceIndex + 1 : 0;
                        onSpaceSelect?.(nextIndex);
                    }
                    break;

                case '[':
                    e.preventDefault();
                    const prevIdx = activeSpaceIndex > 0 ? activeSpaceIndex - 1 : spaces.length - 1;
                    onSpaceSelect?.(prevIdx);
                    break;

                case ']':
                    e.preventDefault();
                    const nextIdx = activeSpaceIndex < spaces.length - 1 ? activeSpaceIndex + 1 : 0;
                    onSpaceSelect?.(nextIdx);
                    break;

                case 'n':
                    if (isCtrlOrCmd) {
                        e.preventDefault();
                        handleAddSpace();
                    }
                    break;

                case 'c':
                    if (isCtrlOrCmd) {
                        console.log('[F010-Sidebar] Cmd+C detected! focusedItemId:', focusedItemId);
                        e.preventDefault();
                        if (onCopySelected) {
                            console.log('[F010-Sidebar] Calling onCopySelected with focusedItemId:', focusedItemId);
                            onCopySelected(focusedItemId);
                        }
                    }
                    break;

                case 'v':
                    if (isCtrlOrCmd) {
                        console.log('[F010-Sidebar] Cmd+V detected! focusedItemId:', focusedItemId);
                        e.preventDefault();
                        if (onPasteToSelected) {
                            console.log('[F010-Sidebar] Calling onPasteToSelected with focusedItemId:', focusedItemId);
                            onPasteToSelected(focusedItemId);
                        }
                    }
                    break;

                case 'Escape':
                    e.preventDefault();
                    setFocusedItemId(null);
                    break;

                case '1': case '2': case '3': case '4': case '5':
                case '6': case '7': case '8': case '9':
                    if (!isCtrlOrCmd) {
                        const spaceIndex = parseInt(e.key) - 1;
                        if (spaceIndex < spaces.length) {
                            e.preventDefault();
                            onSpaceSelect?.(spaceIndex);
                        }
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [viewMode, activeSpaceIndex, spaces.length, onSpaceSelect, handleAddSpace, selectPreviousItem, selectNextItem, handleRightArrow, handleLeftArrow, handleEnterKey, hasFocus, onCopySelected, onPasteToSelected]);

    const handleItemClick = useCallback(
        (item: SpaceItem) => {
            // Sync mouse click with keyboard focus state
            setFocusedItemId(item.id);
            onFocusChange?.(true); // Sidebar takes focus on item click
            if (activeSpace) {
                onItemClick?.(item, activeSpace.id);
            }
        },
        [activeSpace, onItemClick, onFocusChange]
    );

    const handleItemContextMenu = useCallback(
        (item: SpaceItem, event: React.MouseEvent) => {
            if (activeSpace) {
                onItemContextMenu?.(item, activeSpace.id, event);
            }
        },
        [activeSpace, onItemContextMenu]
    );

    const handlePinnedItemClick = useCallback(
        (item: SpaceItem) => {
            // Sync mouse click with keyboard focus state
            setFocusedItemId(item.id);
            if (activeSpace) {
                onItemClick?.(item, activeSpace.id);
            }
        },
        [activeSpace, onItemClick]
    );

    // Inline input handlers
    const handleAddFolderClick = useCallback((spaceId: string) => {
        setSidebarInput({ spaceId, parentId: null, type: 'folder' });
        onAddFolder?.(spaceId);
    }, [setSidebarInput, onAddFolder]);

    const handleAddLinkClick = useCallback((spaceId: string) => {
        setSidebarInput({ spaceId, parentId: null, type: 'link' });
        onAddLink?.(spaceId);
    }, [setSidebarInput, onAddLink]);

    const handleAddSubfolder = useCallback((parentItem: SpaceItem) => {
        if (!activeSpace) return;
        setExpandedIds(prev => new Set([...prev, parentItem.id]));
        setSidebarInput({ spaceId: activeSpace.id, parentId: parentItem.id, type: 'folder' });
    }, [activeSpace, setSidebarInput]);

    const handleAddLinkToFolder = useCallback((parentItem: SpaceItem) => {
        if (!activeSpace) return;
        setExpandedIds(prev => new Set([...prev, parentItem.id]));
        setSidebarInput({ spaceId: activeSpace.id, parentId: parentItem.id, type: 'link' });
    }, [activeSpace, setSidebarInput]);

    const handleInlineInputSubmit = useCallback(async (
        value: string,
        type: 'folder' | 'link',
        parentId: string | null
    ) => {
        if (!activeSpace || !onCreateItem) return;

        if (type === 'folder') {
            await onCreateItem({
                spaceId: activeSpace.id,
                parentId,
                name: value,
                path: value,
                type: 'folder',
            });
        } else {
            const url = normalizeUrl(value);

            // Create link immediately with URL as name (non-blocking)
            // Metadata (title + favicon) will be fetched asynchronously by App.tsx
            await onCreateItem({
                spaceId: activeSpace.id,
                parentId,
                name: url,
                path: url,
                type: 'link',
            });
        }
        clearSidebarInput();
    }, [activeSpace, onCreateItem, clearSidebarInput]);

    const handleInlineInputCancel = useCallback(() => {
        clearSidebarInput();
    }, [clearSidebarInput]);

    const handleRenameSubmit = useCallback(async (itemId: string, newName: string) => {
        if (onRenameItem) {
            await onRenameItem(itemId, newName);
        }
        setSidebarRenameItemId(null);
    }, [onRenameItem, setSidebarRenameItemId]);

    const handleRenameCancel = useCallback(() => {
        setSidebarRenameItemId(null);
    }, [setSidebarRenameItemId]);

    // Auto-close floating sidebar on mouse leave
    useEffect(() => {
        if (mode !== 'floating') return;

        const handleMouseLeave = (e: MouseEvent) => {
            const sidebar = sidebarRef.current;
            if (!sidebar) return;

            const rect = sidebar.getBoundingClientRect();
            const { clientX, clientY } = e;

            // Check if mouse is outside sidebar bounds
            if (
                clientX < rect.left ||
                clientX > rect.right ||
                clientY < rect.top ||
                clientY > rect.bottom
            ) {
                onVisibilityChange?.(false);
            }
        };

        const sidebar = sidebarRef.current;
        if (sidebar && isVisible) {
            sidebar.addEventListener('mouseleave', handleMouseLeave as any);
            return () => {
                sidebar.removeEventListener('mouseleave', handleMouseLeave as any);
            };
        }
    }, [mode, isVisible, onVisibilityChange]);

    const sidebarClasses = [
        styles.sidebar,
        mode === 'floating' && styles.floating,
        mode === 'floating' && !isVisible && styles.collapsed,
    ]
        .filter(Boolean)
        .join(' ');

    if (!activeSpace) {
        return (
            <>
                {mode === 'floating' && !isVisible && (
                    <div
                        className={styles.hoverTrigger}
                        onMouseEnter={() => onVisibilityChange?.(true)}
                    />
                )}
                <aside
                    ref={sidebarRef}
                    className={sidebarClasses}
                    onClick={() => onFocusChange?.(true)}
                >
                    <div className={styles.emptyState}>No spaces available</div>
                </aside>
            </>
        );
    }

    return (
        <>
            {mode === 'floating' && !isVisible && (
                <div
                    className={styles.hoverTrigger}
                    onMouseEnter={() => onVisibilityChange?.(true)}
                />
            )}
            <aside
                ref={sidebarRef}
                className={sidebarClasses}
                onClick={() => onFocusChange?.(true)}
            >
                {viewMode !== 'normal' ? (
                    <CreateSpaceView
                        existingSpaces={spaces}
                        existingSpace={editingSpace}
                        onCancel={handleCancel}
                        onSuccess={handleSpaceSuccess}
                    />
                ) : (
                    <>
                        {/* Top icons - pin toggle */}
                        <div className={styles.topIcons}>
                            <button
                                className={styles.pinButton}
                                onClick={onModeToggle}
                                title={mode === 'fixed' ? 'Unpin sidebar' : 'Pin sidebar'}
                            >
                                {mode === 'fixed' ? <Pin size={16} /> : <PinOff size={16} />}
                            </button>
                        </div>

                        {/* Navigation tabs */}
                        <SidebarTabs
                            activeTab={activeTab}
                            onTabChange={onTabChange || (() => { })}
                        />

                        <div className={styles.tabSpacer} />

                        {/* Pinned links grid */}
                        <PinnedLinksGrid
                            pinnedItems={pinnedItems}
                            spaceColor={activeSpace.accentColor}
                            onItemClick={handlePinnedItemClick}
                            onItemContextMenu={handleItemContextMenu}
                        />

                        {/* Space header */}
                        <SpaceHeader
                            space={activeSpace}
                            onEditSpace={handleEditSpace}
                            onAddFolder={handleAddFolderClick}
                            onAddLink={handleAddLinkClick}
                        />

                        {/* Tree view */}
                        <div className={styles.treeContainer}>
                            <TreeView
                                items={treeItems}
                                spaceId={activeSpace.id}
                                selectedId={focusedItemId || selectedItemId}
                                activeId={focusedItemId}
                                expandedIds={expandedIds}
                                accentColor={activeSpace.accentColor}
                                inlineInput={sidebarInput}
                                renameItemId={sidebarRenameItemId}
                                onItemClick={handleItemClick}
                                onItemContextMenu={handleItemContextMenu}
                                onExpandedChange={setExpandedIds}
                                onAddSubfolder={handleAddSubfolder}
                                onAddLink={handleAddLinkToFolder}
                                onInlineInputSubmit={handleInlineInputSubmit}
                                onInlineInputCancel={handleInlineInputCancel}
                                onRenameSubmit={handleRenameSubmit}
                                onRenameCancel={handleRenameCancel}
                            />
                        </div>

                        {/* Bottom bar */}
                        <BottomBar
                            spaces={spaces}
                            activeSpaceIndex={activeSpaceIndex}
                            onSpaceSelect={onSpaceSelect || (() => { })}
                            onAddSpace={handleAddSpace}
                            onSettingsClick={onSettingsClick}
                            userName={userName}
                        />
                    </>
                )}
            </aside>
        </>
    );
}
