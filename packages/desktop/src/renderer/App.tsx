import React, { useState } from 'react';
import {
    SpayceColors,
    SpayceSpacing,
    SpaceThemes,
    SpaceItemType,
    ContextMenu,
    Sidebar,
} from '@spayce/shared';
import type { SpaceItem, ContextMenuItem, Space, SidebarMode, SidebarTabId } from '@spayce/shared';
import * as LucideIcons from 'lucide-react';

// Sample space data matching the hi-fi screenshot
const DEMO_SPACES: Space[] = [
    {
        id: 'space-1',
        profileId: 'profile-1',
        userId: 'user-1',
        name: 'Projects',
        accentColor: SpaceThemes[0], // Violet
        iconName: 'briefcase',
        order: 0,
        isExpanded: true,
        createdAt: new Date(),
        rootItems: [
            {
                id: '1',
                name: 'Local Projects',
                path: '/local-projects',
                type: SpaceItemType.localFolder,
                isExpanded: true,
                children: [
                    {
                        id: '1a',
                        name: 'alexygrigorev',
                        path: '/local-projects/alexygrigorev',
                        type: SpaceItemType.folder,
                        isExpanded: false,
                        children: [],
                        faviconUrl: null,
                        description: null,
                        visitCount: 0,
                        lastVisited: null,
                        createdAt: new Date(),
                        isPinned: false,
                        pinPosition: null,
                        localPath: null,
                        securityBookmark: null,
                        lastSyncedAt: null,
                        isWatching: false,
                    },
                    {
                        id: '1b',
                        name: 'bootdev',
                        path: '/local-projects/bootdev',
                        type: SpaceItemType.folder,
                        isExpanded: false,
                        children: [],
                        faviconUrl: null,
                        description: null,
                        visitCount: 0,
                        lastVisited: null,
                        createdAt: new Date(),
                        isPinned: false,
                        pinPosition: null,
                        localPath: null,
                        securityBookmark: null,
                        lastSyncedAt: null,
                        isWatching: false,
                    },
                    {
                        id: '1c',
                        name: 'task-manager-sample',
                        path: '/local-projects/task-manager-sample',
                        type: SpaceItemType.folder,
                        isExpanded: false,
                        children: [],
                        faviconUrl: null,
                        description: null,
                        visitCount: 0,
                        lastVisited: null,
                        createdAt: new Date(),
                        isPinned: false,
                        pinPosition: null,
                        localPath: null,
                        securityBookmark: null,
                        lastSyncedAt: null,
                        isWatching: false,
                    },
                ],
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                createdAt: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: '/Users/demo/projects',
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: true,
            },
            {
                id: '2',
                name: 'mom_hack',
                path: '/mom_hack',
                type: SpaceItemType.folder,
                isExpanded: false,
                children: [],
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                createdAt: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            },
            {
                id: '3',
                name: 'colab.research.google.com',
                path: 'https://colab.research.google.com',
                type: SpaceItemType.link,
                isExpanded: false,
                children: [],
                faviconUrl: null,
                description: 'Google Colab',
                visitCount: 15,
                lastVisited: new Date(),
                createdAt: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            },
            {
                id: '4',
                name: 'Routine',
                path: '/routine',
                type: SpaceItemType.folder,
                isExpanded: true,
                children: [
                    {
                        id: '4a',
                        name: 'mixpanel.com',
                        path: 'https://mixpanel.com',
                        type: SpaceItemType.link,
                        isExpanded: false,
                        children: [],
                        faviconUrl: null,
                        description: 'Mixpanel Analytics',
                        visitCount: 8,
                        lastVisited: new Date(),
                        createdAt: new Date(),
                        isPinned: false,
                        pinPosition: null,
                        localPath: null,
                        securityBookmark: null,
                        lastSyncedAt: null,
                        isWatching: false,
                    },
                    {
                        id: '4b',
                        name: 'streamyard.com',
                        path: 'https://streamyard.com',
                        type: SpaceItemType.link,
                        isExpanded: false,
                        children: [],
                        faviconUrl: null,
                        description: 'StreamYard',
                        visitCount: 3,
                        lastVisited: new Date(),
                        createdAt: new Date(),
                        isPinned: false,
                        pinPosition: null,
                        localPath: null,
                        securityBookmark: null,
                        lastSyncedAt: null,
                        isWatching: false,
                    },
                ],
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                createdAt: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            },
            {
                id: '5',
                name: 'github.com',
                path: 'https://github.com',
                type: SpaceItemType.link,
                isExpanded: false,
                children: [],
                faviconUrl: null,
                description: 'GitHub',
                visitCount: 42,
                lastVisited: new Date(),
                createdAt: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            },
        ],
    },
    {
        id: 'space-2',
        profileId: 'profile-1',
        userId: 'user-1',
        name: 'Workshops',
        accentColor: SpaceThemes[4], // Pink
        iconName: 'rocket',
        order: 1,
        isExpanded: true,
        createdAt: new Date(),
        rootItems: [
            {
                id: 'pinned-1',
                name: 'GitHub',
                path: 'https://github.com',
                type: SpaceItemType.link,
                isExpanded: false,
                children: [],
                faviconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
                description: null,
                visitCount: 42,
                lastVisited: new Date(),
                createdAt: new Date(),
                isPinned: true,
                pinPosition: 0,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            },
            {
                id: 'pinned-2',
                name: 'Stack Overflow',
                path: 'https://stackoverflow.com',
                type: SpaceItemType.link,
                isExpanded: false,
                children: [],
                faviconUrl: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico',
                description: null,
                visitCount: 28,
                lastVisited: new Date(),
                createdAt: new Date(),
                isPinned: true,
                pinPosition: 1,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            },
            {
                id: 'w1',
                name: 'mom_hack',
                path: '/workshops/mom_hack',
                type: SpaceItemType.folder,
                isExpanded: false,
                children: [],
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                createdAt: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            },
            {
                id: 'w2',
                name: 'memmachine_hack',
                path: '/workshops/memmachine_hack',
                type: SpaceItemType.folder,
                isExpanded: false,
                children: [],
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                createdAt: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            },
            {
                id: 'w3',
                name: 'colab.research.google.com',
                path: 'https://colab.research.google.com',
                type: SpaceItemType.link,
                isExpanded: false,
                children: [],
                faviconUrl: 'https://colab.research.google.com/favicon.ico',
                description: null,
                visitCount: 15,
                lastVisited: new Date(),
                createdAt: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            },
            {
                id: 'w4',
                name: 'Routine',
                path: '/workshops/routine',
                type: SpaceItemType.folder,
                isExpanded: true,
                children: [
                    {
                        id: 'w4a',
                        name: 'mixpanel.com',
                        path: 'https://mixpanel.com',
                        type: SpaceItemType.link,
                        isExpanded: false,
                        children: [],
                        faviconUrl: 'https://mixpanel.com/favicon.ico',
                        description: null,
                        visitCount: 8,
                        lastVisited: new Date(),
                        createdAt: new Date(),
                        isPinned: false,
                        pinPosition: null,
                        localPath: null,
                        securityBookmark: null,
                        lastSyncedAt: null,
                        isWatching: false,
                    },
                    {
                        id: 'w4b',
                        name: 'streamyard.com',
                        path: 'https://streamyard.com',
                        type: SpaceItemType.link,
                        isExpanded: false,
                        children: [],
                        faviconUrl: 'https://streamyard.com/favicon.ico',
                        description: null,
                        visitCount: 5,
                        lastVisited: new Date(),
                        createdAt: new Date(),
                        isPinned: false,
                        pinPosition: null,
                        localPath: null,
                        securityBookmark: null,
                        lastSyncedAt: null,
                        isWatching: false,
                    },
                ],
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                createdAt: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            },
        ],
    },
];

// Helper to generate context menu items based on item type
function getContextMenuItems(item: SpaceItem, hasClipboard: boolean): ContextMenuItem[] {
    const items: ContextMenuItem[] = [];

    if (item.type === SpaceItemType.folder) {
        items.push(
            { id: 'add-folder', label: 'New Nested Folder', icon: LucideIcons.FolderPlus },
            { id: 'add-link', label: 'Add Link', icon: LucideIcons.Link },
            { id: 'divider-1', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'rename', label: 'Rename', icon: LucideIcons.Pencil },
            { id: 'copy', label: 'Copy Folder', icon: LucideIcons.Copy }
        );
        if (hasClipboard) {
            items.push({ id: 'paste', label: 'Paste', icon: LucideIcons.Clipboard });
        }
        items.push(
            { id: 'divider-2', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'delete', label: 'Delete', icon: LucideIcons.Trash2, isDestructive: true }
        );
    } else if (item.type === SpaceItemType.link) {
        items.push(
            { id: 'open-new-tab', label: 'Open in New Tab', icon: LucideIcons.ExternalLink },
            { id: 'copy-url', label: 'Copy URL', icon: LucideIcons.Copy },
            { id: 'divider-1', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'rename', label: 'Rename', icon: LucideIcons.Pencil },
            { id: 'divider-2', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'delete', label: 'Delete', icon: LucideIcons.Trash2, isDestructive: true }
        );
    } else if (item.type === SpaceItemType.localFolder) {
        items.push(
            { id: 'open-workspace', label: 'Open in Workspace', icon: LucideIcons.FolderOpen },
            { id: 'refresh', label: 'Refresh', icon: LucideIcons.RefreshCw },
            { id: 'divider-1', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'import-file', label: 'Import Local File', icon: LucideIcons.FileInput },
            { id: 'import-folder', label: 'Import Local Folder', icon: LucideIcons.FolderInput },
            { id: 'divider-2', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'remove', label: 'Remove', icon: LucideIcons.FolderMinus, isDestructive: true }
        );
    }

    return items;
}

export function App(): React.ReactElement {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeSpaceIndex, setActiveSpaceIndex] = useState(0);
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>('fixed');
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [activeTab, setActiveTab] = useState<SidebarTabId>('spaces');
    const [contextMenu, setContextMenu] = useState<{
        item: SpaceItem;
        spaceId: string;
        position: { x: number; y: number };
    } | null>(null);
    const [hasClipboard] = useState(false); // Demo: no clipboard

    const handleItemClick = (item: SpaceItem, spaceId: string) => {
        console.log('Item clicked:', item.name, 'in space:', spaceId);
        setSelectedId(item.id);
    };

    const handleContextMenu = (item: SpaceItem, spaceId: string, event: React.MouseEvent) => {
        setContextMenu({
            item,
            spaceId,
            position: { x: event.clientX, y: event.clientY },
        });
    };

    const handleContextMenuItemClick = (itemId: string) => {
        console.log('Context menu action:', itemId, contextMenu?.item.name);
        setContextMenu(null);
    };

    const handleModeToggle = () => {
        setSidebarMode((prev) => (prev === 'fixed' ? 'floating' : 'fixed'));
    };

    const handleAddFolder = (spaceId: string) => {
        console.log('Add folder to space:', spaceId);
    };

    const handleAddLink = (spaceId: string) => {
        console.log('Add link to space:', spaceId);
    };

    const handleEditSpace = (space: Space) => {
        console.log('Edit space:', space.name);
    };

    const handleAddSpace = () => {
        console.log('Add new space');
    };

    const handleSettingsClick = () => {
        console.log('Settings clicked');
    };

    return (
        <div
            style={{
                display: 'flex',
                width: '100vw',
                height: '100vh',
                backgroundColor: SpayceColors.backgroundDark,
            }}
        >
            {/* Sidebar with F001 component */}
            <div
                style={{
                    boxShadow: '10px 0 30px -5px rgba(0, 0, 0, 0.5)',
                }}
            >
                <Sidebar
                    spaces={DEMO_SPACES}
                    activeSpaceIndex={activeSpaceIndex}
                    selectedItemId={selectedId}
                    mode={sidebarMode}
                    activeTab={activeTab}
                    userName="dishant ghai"
                    isVisible={sidebarVisible}
                    onSpaceSelect={setActiveSpaceIndex}
                    onTabChange={setActiveTab}
                    onModeToggle={handleModeToggle}
                    onVisibilityChange={setSidebarVisible}
                    onItemClick={handleItemClick}
                    onItemContextMenu={handleContextMenu}
                    onAddSpace={handleAddSpace}
                    onAddFolder={handleAddFolder}
                    onAddLink={handleAddLink}
                    onEditSpace={handleEditSpace}
                    onSettingsClick={handleSettingsClick}
                />
            </div>

            {/* Main content area */}
            <main
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: SpayceColors.backgroundDark,
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <h2
                        style={{
                            fontSize: 24,
                            fontWeight: 600,
                            color: SpayceColors.textPrimary,
                        }}
                    >
                        F001: Sidebar Navigation Tree
                    </h2>
                    <p
                        style={{
                            fontSize: 14,
                            color: SpayceColors.textSecondary,
                            marginTop: 8,
                        }}
                    >
                        Click items in sidebar or right-click for context menu
                    </p>
                    <p
                        style={{
                            fontSize: 12,
                            color: SpayceColors.textMuted,
                            marginTop: 16,
                        }}
                    >
                        Selected: {selectedId ?? 'None'}
                    </p>
                </div>
            </main>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    items={getContextMenuItems(contextMenu.item, hasClipboard)}
                    position={contextMenu.position}
                    onItemClick={handleContextMenuItemClick}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}

