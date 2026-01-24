// Core types for Spayce UI
// Note: Some types like SidebarMode, SidebarTab, DragData, DropPosition are defined in stores

export enum SpaceItemType {
    link = 'link',
    file = 'file',
    folder = 'folder',
    localFolder = 'localFolder',
    localFile = 'localFile',
}

export interface SpaceItem {
    id: string;
    name: string;
    path: string;
    type: SpaceItemType;
    isExpanded: boolean;
    children: SpaceItem[];

    // Link metadata
    faviconUrl: string | null;
    description: string | null;
    visitCount: number;
    lastVisited: Date | null;
    createdAt: Date;

    // Pin fields
    isPinned: boolean;
    pinPosition: number | null;

    // Local file system
    localPath: string | null;
    securityBookmark: string | null;
    lastSyncedAt: Date | null;
    isWatching: boolean;
}

export interface Space {
    id: string;
    profileId: string;
    userId: string;
    name: string;
    rootItems: SpaceItem[];
    createdAt: Date;
    isExpanded: boolean;
    accentColor: string;
    iconName: string;
    order: number;
}

export enum KeyboardFocusContext {
    sidebar = 'sidebar',
    spacesScreen = 'spacesScreen',
}

export enum DragSource {
    sidebar = 'sidebar',
    spaceCard = 'spaceCard',
}

export interface DragOperation {
    items: SpaceItem[];
    sourceSpaceId: string;
    sourceParentId: string | null;
    source: DragSource;
    startTime: Date;
}

export enum TabType {
    web = 'web',
    note = 'note',
    localFile = 'localFile',
}

export interface BrowserTab {
    id: string;
    tabType: TabType;
    url: string;
    title: string;
    faviconUrl: string | null;

    // Origin tracking
    originSpaceId: string | null;
    originSpaceItemId: string | null;
    isTracked: boolean;

    // State
    isActive: boolean;
    isLoading: boolean;
    loadingProgress: number;
    canGoBack: boolean;
    canGoForward: boolean;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt: Date | null;
}

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

export type InlineInputType = 'folder' | 'link';

export interface InlineInputState {
    spaceId: string;
    parentId: string | null;
    type: InlineInputType;
}
