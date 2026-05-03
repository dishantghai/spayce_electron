/**
 * BrowserTabBar Component
 * Story F039: Multi-Tab Bar UI Enhancement
 *
 * Horizontal tab bar with drag-and-drop reordering, auto-scroll,
 * keyboard support, and pixel-perfect match to Flutter app design.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Plus, X, Globe } from 'lucide-react';
import styles from './BrowserTabBar.module.css';

export interface BrowserTab {
    /** Unique identifier for the tab */
    id: string;
    /** Tab title */
    title: string;
    /** Favicon URL (optional) */
    faviconUrl?: string | null;
    /** Whether the tab is loading */
    isLoading?: boolean;
}

export interface BrowserTabBarProps {
    /** List of tabs to display */
    tabs: BrowserTab[];
    /** ID of the currently active tab */
    activeTabId: string | null;
    /** Callback when a tab is clicked */
    onTabClick: (tabId: string) => void;
    /** Callback when a tab's close button is clicked */
    onTabClose?: (tabId: string) => void;
    /** Callback when new tab button is clicked */
    onNewTab?: () => void;
    /** Callback when tabs are reordered via drag-and-drop */
    onReorder?: (orderedIds: string[]) => void;
    /** Optional className for styling */
    className?: string;
    /**
     * B025: When true, disables -webkit-app-region: drag on the tab bar.
     * This prevents the drag region from intercepting clicks on the sidebar
     * overlay WebContentsView that floats above this component.
     */
    sidebarOverlayActive?: boolean;
}

export const BrowserTabBar: React.FC<BrowserTabBarProps> = ({
    tabs,
    activeTabId,
    onTabClick,
    onTabClose,
    onNewTab,
    onReorder,
    className,
    sidebarOverlayActive = false,
}) => {
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
    const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

    // Auto-scroll active tab into view when activeTabId changes
    useEffect(() => {
        if (!activeTabId || !tabsContainerRef.current) return;

        const container = tabsContainerRef.current;
        const activeElement = container.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement | null;

        if (activeElement) {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }, [activeTabId]);

    // Close tab handler
    const handleTabClose = useCallback((e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        onTabClose?.(tabId);
    }, [onTabClose]);

    // Keyboard handler
    const handleKeyDown = useCallback((e: React.KeyboardEvent, tabId: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTabClick(tabId);
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && onTabClose && tabs.length > 1) {
            e.preventDefault();
            onTabClose(tabId);
        }
    }, [onTabClick, onTabClose, tabs.length]);

    // Drag-and-drop handlers
    const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
        setDraggedTabId(tabId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tabId);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, tabId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (tabId !== draggedTabId) {
            setDragOverTabId(tabId);
        }
    }, [draggedTabId]);

    const handleDragLeave = useCallback(() => {
        setDragOverTabId(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, dropTargetId: string) => {
        e.preventDefault();
        setDragOverTabId(null);
        setDraggedTabId(null);

        if (!draggedTabId || draggedTabId === dropTargetId || !onReorder) return;

        const currentIds = tabs.map(t => t.id);
        const draggedIndex = currentIds.indexOf(draggedTabId);
        const dropIndex = currentIds.indexOf(dropTargetId);

        if (draggedIndex === -1 || dropIndex === -1) return;

        // Remove dragged and insert at drop position
        const newIds = [...currentIds];
        newIds.splice(draggedIndex, 1);
        newIds.splice(dropIndex, 0, draggedTabId);

        onReorder(newIds);
    }, [draggedTabId, tabs, onReorder]);

    const handleDragEnd = useCallback(() => {
        setDraggedTabId(null);
        setDragOverTabId(null);
    }, []);

    // B025: When sidebar overlay is active, disable drag regions to prevent
    // them from intercepting clicks on the overlay WebContentsView
    const noDragStyle = sidebarOverlayActive
        ? { WebkitAppRegion: 'no-drag' as const }
        : undefined;

    return (
        <div
            className={`${styles.tabBar} ${className || ''}`}
            style={noDragStyle}
            data-drag-disabled={sidebarOverlayActive || undefined}
        >
            {/* New tab button */}
            {onNewTab && (
                <button
                    className={styles.newTabButton}
                    onClick={onNewTab}
                    aria-label="Open new tab"
                    title="New tab"
                >
                    <Plus size={16} />
                </button>
            )}

            {/* Tabs */}
            <div
                ref={tabsContainerRef}
                className={styles.tabsContainer}
                role="tablist"
            >
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    const isDragging = tab.id === draggedTabId;
                    const isDragOver = tab.id === dragOverTabId;

                    return (
                        <div
                            key={tab.id}
                            data-tab-id={tab.id}
                            className={[
                                styles.tab,
                                isActive ? styles.tabActive : '',
                                isDragging ? styles.tabDragging : '',
                                isDragOver ? styles.tabDragOver : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => onTabClick(tab.id)}
                            onKeyDown={(e) => handleKeyDown(e, tab.id)}
                            role="tab"
                            aria-selected={isActive}
                            tabIndex={isActive ? 0 : -1}
                            draggable={!!onReorder}
                            onDragStart={(e) => handleDragStart(e, tab.id)}
                            onDragOver={(e) => handleDragOver(e, tab.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, tab.id)}
                            onDragEnd={handleDragEnd}
                        >
                            {/* Favicon */}
                            <span className={styles.tabFavicon}>
                                {tab.isLoading ? (
                                    <span className={styles.loadingSpinner} />
                                ) : tab.faviconUrl ? (
                                    <img
                                        src={tab.faviconUrl}
                                        alt=""
                                        className={styles.faviconImage}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <Globe size={14} />
                                )}
                            </span>

                            {/* Title */}
                            <span className={styles.tabTitle}>{tab.title || 'New Tab'}</span>

                            {/* Close button - visible on hover and active tabs */}
                            {onTabClose && tabs.length > 1 && (
                                <button
                                    className={styles.tabCloseButton}
                                    onClick={(e) => handleTabClose(e, tab.id)}
                                    aria-label={`Close ${tab.title}`}
                                    title="Close tab"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Spacer for drag region */}
            <div
                className={styles.tabBarSpacer}
                style={noDragStyle}
                data-drag-disabled={sidebarOverlayActive || undefined}
            />
        </div>
    );
};
