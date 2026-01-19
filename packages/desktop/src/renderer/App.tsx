import React, { useState } from 'react';
import {
    SpayceColors,
    SpayceSpacing,
    SpaceThemes,
    SpaceItemType,
    ContextMenu,
    Sidebar,
    SpacesScreen,
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
    const [spaces, setSpaces] = useState<Space[]>(DEMO_SPACES);
    // Sidebar and SpacesScreen have independent active space indices
    const [sidebarActiveSpaceIndex, setSidebarActiveSpaceIndex] = useState(0);
    const [spacesScreenActiveSpaceIndex, setSpacesScreenActiveSpaceIndex] = useState(0);
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>('fixed');
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [activeTab, setActiveTab] = useState<SidebarTabId>('spaces');
    // Focus context: 'sidebar' or 'spacesScreen'
    // Rule 0: Default to 'sidebar' on app open
    const [focusContext, setFocusContext] = useState<'sidebar' | 'spacesScreen'>('sidebar');

    /**
     * KEYBOARD NAVIGATION FOCUS RULES:
     * 
     * Rule 0: On app open, focus defaults to Sidebar (regardless of mode)
     * Rule 1: Click on Sidebar or any item within -> focus moves to Sidebar
     * Rule 2: Click on SpacesScreen or any item within -> focus moves to SpacesScreen
     * Rule 3: In Floating mode, when sidebar opens -> focus moves to Sidebar
     * Rule 4: In Floating mode, when sidebar closes AND Spaces tab is active -> focus moves to SpacesScreen
     */

    // Handle sidebar visibility changes (Rule 3 & 4)
    const handleSidebarVisibilityChange = (visible: boolean) => {
        setSidebarVisible(visible);
        if (sidebarMode === 'floating') {
            if (visible) {
                // Rule 3: Floating sidebar opened -> focus to sidebar
                setFocusContext('sidebar');
            } else {
                // Rule 4: Floating sidebar closed -> focus to SpacesScreen if Spaces tab active
                if (activeTab === 'spaces') {
                    setFocusContext('spacesScreen');
                }
            }
        }
    };
    const [contextMenu, setContextMenu] = useState<{
        item: SpaceItem;
        spaceId: string;
        position: { x: number; y: number };
    } | null>(null);
    const [hasClipboard] = useState(false); // Demo: no clipboard

    const handleItemClick = (item: SpaceItem, spaceId: string) => {
        console.log('Item clicked:', item.name, 'in space:', spaceId);
        setSelectedId(item.id);
        setFocusContext('sidebar'); // Sidebar item click sets focus to sidebar
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
        setSidebarMode((prev: SidebarMode) => (prev === 'fixed' ? 'floating' : 'fixed'));
    };

    const handleAddFolder = (spaceId: string) => {
        console.log('Add folder to space:', spaceId);
    };

    const handleAddLink = (spaceId: string) => {
        console.log('Add link to space:', spaceId);
    };

    const handleCreateSpace = (spaceData: {
        name: string;
        iconName: string;
        accentColor: string;
    }) => {
        const newSpace: Space = {
            id: `space-${Date.now()}`,
            profileId: 'profile-1',
            userId: 'user-1',
            name: spaceData.name,
            accentColor: spaceData.accentColor,
            iconName: spaceData.iconName,
            order: spaces.length,
            isExpanded: true,
            createdAt: new Date(),
            rootItems: [],
        };

        setSpaces(prevSpaces => [...prevSpaces, newSpace]);
        setSidebarActiveSpaceIndex(spaces.length); // Switch to the new space in sidebar
        console.log('Created new space:', newSpace);
    };

    const handleUpdateSpace = (space: Space, spaceData: {
        name: string;
        iconName: string;
        accentColor: string;
    }) => {
        setSpaces(prevSpaces => prevSpaces.map(s =>
            s.id === space.id
                ? { ...s, name: spaceData.name, iconName: spaceData.iconName, accentColor: spaceData.accentColor }
                : s
        ));
        console.log('Updated space:', space.name, 'to', spaceData);
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
            {/* Sidebar with F001 component - position absolute when floating to not take space */}
            <div
                style={{
                    boxShadow: sidebarMode === 'floating' && !sidebarVisible
                        ? 'none'
                        : '10px 0 30px -5px rgba(0, 0, 0, 0.5)',
                    ...(sidebarMode === 'floating' ? {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 100,
                        pointerEvents: sidebarVisible ? 'auto' : 'none',
                    } : {}),
                }}
            >
                <Sidebar
                    spaces={spaces}
                    activeSpaceIndex={sidebarActiveSpaceIndex}
                    selectedItemId={selectedId}
                    mode={sidebarMode}
                    activeTab={activeTab}
                    userName="dishant ghai"
                    isVisible={sidebarVisible}
                    hasFocus={focusContext === 'sidebar'}
                    onSpaceSelect={setSidebarActiveSpaceIndex}
                    onTabChange={setActiveTab}
                    onModeToggle={handleModeToggle}
                    onVisibilityChange={handleSidebarVisibilityChange}
                    onItemClick={handleItemClick}
                    onItemContextMenu={handleContextMenu}
                    onCreateSpace={handleCreateSpace}
                    onAddFolder={handleAddFolder}
                    onAddLink={handleAddLink}
                    onEditSpace={handleUpdateSpace}
                    onSettingsClick={handleSettingsClick}
                    onFocusChange={(hasFocus) => {
                        if (hasFocus) setFocusContext('sidebar');
                    }}
                />
            </div>

            {/* Main content area */}
            <main
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: SpayceColors.backgroundDark,
                    overflow: 'hidden',
                }}
            >
                {activeTab === 'spaces' ? (
                    <SpacesScreen
                        spaces={spaces}
                        activeSpaceIndex={spacesScreenActiveSpaceIndex}
                        selectedItemId={null}
                        hasFocus={focusContext === 'spacesScreen'}
                        onSpaceSelect={setSpacesScreenActiveSpaceIndex}
                        onItemClick={(item, spaceId) => {
                            console.log('SpacesScreen item clicked:', item.name, 'in space:', spaceId);
                        }}
                        onItemContextMenu={handleContextMenu}
                        onAddSpace={() => {
                            // Trigger create space view in sidebar
                            console.log('Add space clicked from SpacesScreen');
                        }}
                        onAddFolder={handleAddFolder}
                        onAddLink={handleAddLink}
                        onReorderSpaces={(oldIndex, newIndex) => {
                            setSpaces(prevSpaces => {
                                const newSpaces = [...prevSpaces];
                                const [removed] = newSpaces.splice(oldIndex, 1);
                                newSpaces.splice(newIndex, 0, removed);
                                return newSpaces.map((s, i) => ({ ...s, order: i }));
                            });
                        }}
                        onFocusChange={(hasFocus) => {
                            if (hasFocus) setFocusContext('spacesScreen');
                        }}
                    />
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <h2
                                style={{
                                    fontSize: 24,
                                    fontWeight: 600,
                                    color: SpayceColors.textPrimary,
                                }}
                            >
                                {activeTab === 'browser' ? 'Browser View' :
                                    activeTab === 'workspace' ? 'Workspace View' :
                                        'Settings'}
                            </h2>
                            <p
                                style={{
                                    fontSize: 14,
                                    color: SpayceColors.textSecondary,
                                    marginTop: 8,
                                }}
                            >
                                {activeTab === 'browser' ? 'Web browser content will appear here' :
                                    activeTab === 'workspace' ? 'Code workspace will appear here' :
                                        'Application settings'}
                            </p>
                        </div>
                    </div>
                )}
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
