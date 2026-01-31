/**
 * BrowserTabBar Component
 * Spec 019: Single Tab Browser MVP
 *
 * Horizontal tab bar for browser tabs.
 */

import React from 'react';
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
    /** Optional className for styling */
    className?: string;
}

export const BrowserTabBar: React.FC<BrowserTabBarProps> = ({
    tabs,
    activeTabId,
    onTabClick,
    onTabClose,
    onNewTab,
    className,
}) => {
    const handleTabClose = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        onTabClose?.(tabId);
    };

    return (
        <div className={`${styles.tabBar} ${className || ''}`}>
            {/* Tabs */}
            <div className={styles.tabsContainer} role="tablist">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`${styles.tab} ${tab.id === activeTabId ? styles.tabActive : ''}`}
                        onClick={() => onTabClick(tab.id)}
                        role="tab"
                        aria-selected={tab.id === activeTabId}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onTabClick(tab.id);
                            }
                        }}
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

                        {/* Close button */}
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
                ))}
            </div>

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

            {/* Spacer for drag region */}
            <div className={styles.tabBarSpacer} />
        </div>
    );
};
