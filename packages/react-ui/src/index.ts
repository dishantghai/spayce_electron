// React UI Integration - Presentation Layer
// Hooks, components, and stores for connecting React to Clean Architecture

// NOTE: Hooks are NOT exported from main index because they import @spayce/infrastructure
// which includes better-sqlite3 (Node.js native module that cannot run in browser/Electron renderer)
// For Electron apps, use IPC-based hooks from packages/desktop/src/renderer/hooks instead
// export * from './hooks';

export * from './stores';
export * from './theme';

// Types - export selectively to avoid conflicts with hooks (which re-export from @spayce/core)
export type {
    SpaceItem,
    Space,
    DragOperation,
    BrowserTab,
    User,
    AuthState,
} from './types';
export {
    SpaceItemType,
    KeyboardFocusContext,
    DragSource,
    TabType,
} from './types';

// Components - export selectively to avoid SidebarMode conflict with stores
export {
    // Error components
    DomainErrorBoundary,
    GlobalErrorBoundary,
    ErrorFallback,
    // Common components
    Skeleton,
    // Tree components
    TreeView,
    TreeItem,
    TreeItemIcon,
    // Context menu
    ContextMenu,
    // Sidebar components
    Sidebar,
    SidebarTabs,
    // Other components
    PinnedLinksGrid,
    SpaceHeader,
    BottomBar,
    CreateSpaceView,
    getIconComponent,
    // Spaces components
    SpaceCard,
    getSpaceIconComponent,
    SpacesScreen,
    SpacesBottomBar,
    // Browser components (Spec 019)
    BrowserArea,
    BrowserLoadingBar,
    BrowserErrorOverlay,
    BrowserToolbar,
    BrowserTabBar,
} from './components';

export type {
    TreeViewProps,
    ContextMenuProps,
    ContextMenuItem,
    SidebarProps,
    SidebarMode,
    SidebarViewMode,
    SidebarTabsProps,
    SidebarTabId,
    PinnedLinksGridProps,
    SpaceHeaderProps,
    BottomBarProps,
    CreateSpaceViewProps,
    SpaceCardProps,
    SpacesScreenProps,
    SpacesBottomBarProps,
    // Browser component types (Spec 019)
    BrowserAreaProps,
    BrowserLoadingBarProps,
    BrowserErrorOverlayProps,
    BrowserToolbarProps,
    BrowserTabBarProps,
    BrowserTab,
} from './components';

// Hooks removed from exports - they require Node.js environment (serviceRegistry)
// For Electron renderer, use IPC-based hooks from packages/desktop/src/renderer/hooks
// export { useSpaces, type UseSpacesResult } from './hooks/useSpaces';
// export { useSpaceItems, type UseSpaceItemsResult } from './hooks/useSpaceItems';
// export { usePinnedItems, type UsePinnedItemsResult } from './hooks/usePinnedItems';
