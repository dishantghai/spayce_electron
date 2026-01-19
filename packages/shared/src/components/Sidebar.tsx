import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { TreeView } from './TreeView';
import { SidebarTabs, type SidebarTabId } from './SidebarTabs';
import { PinnedLinksGrid } from './PinnedLinksGrid';
import { SpaceHeader } from './SpaceHeader';
import { BottomBar } from './BottomBar';
import type { Space, SpaceItem, SpaceItemType } from '../types';
import styles from './Sidebar.module.css';

export type SidebarMode = 'fixed' | 'floating';

export interface SidebarProps {
    spaces: Space[];
    activeSpaceIndex: number;
    selectedItemId: string | null;
    mode?: SidebarMode;
    activeTab?: SidebarTabId;
    userName?: string;
    isVisible?: boolean;
    onSpaceSelect?: (index: number) => void;
    onTabChange?: (tab: SidebarTabId) => void;
    onModeToggle?: () => void;
    onVisibilityChange?: (visible: boolean) => void;
    onItemClick?: (item: SpaceItem, spaceId: string) => void;
    onItemContextMenu?: (item: SpaceItem, spaceId: string, event: React.MouseEvent) => void;
    onAddSpace?: () => void;
    onAddFolder?: (spaceId: string) => void;
    onAddLink?: (spaceId: string) => void;
    onEditSpace?: (space: Space) => void;
    onSettingsClick?: () => void;
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
    onSpaceSelect,
    onTabChange,
    onModeToggle,
    onVisibilityChange,
    onItemClick,
    onItemContextMenu,
    onAddSpace,
    onAddFolder,
    onAddLink,
    onEditSpace,
    onSettingsClick,
}: SidebarProps): React.ReactElement {
    const sidebarRef = useRef<HTMLElement>(null);
    const activeSpace = spaces[activeSpaceIndex] || spaces[0];

    // Get pinned items from active space
    const pinnedItems = activeSpace?.rootItems.filter((item) => item.isPinned) || [];

    // Get non-pinned items for tree view
    const treeItems = activeSpace?.rootItems.filter((item) => !item.isPinned) || [];

    const handleItemClick = useCallback(
        (item: SpaceItem) => {
            if (activeSpace) {
                onItemClick?.(item, activeSpace.id);
            }
        },
        [activeSpace, onItemClick]
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
            if (activeSpace) {
                onItemClick?.(item, activeSpace.id);
            }
        },
        [activeSpace, onItemClick]
    );

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
                <aside ref={sidebarRef} className={sidebarClasses}>
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
            <aside ref={sidebarRef} className={sidebarClasses}>
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
                    onEditSpace={onEditSpace}
                    onAddFolder={onAddFolder}
                    onAddLink={onAddLink}
                />

                {/* Tree view */}
                <div className={styles.treeContainer}>
                    <TreeView
                        items={treeItems}
                        selectedId={selectedItemId}
                        activeId={null}
                        accentColor={activeSpace.accentColor}
                        onItemClick={handleItemClick}
                        onItemContextMenu={handleItemContextMenu}
                    />
                </div>

                {/* Bottom bar */}
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={activeSpaceIndex}
                    onSpaceSelect={onSpaceSelect || (() => { })}
                    onAddSpace={onAddSpace}
                    onSettingsClick={onSettingsClick}
                    userName={userName}
                />
            </aside>
        </>
    );
}
