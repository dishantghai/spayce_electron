import React, { useState } from 'react';
import {
    SpayceColors,
    SpaceItemType,
    ContextMenu,
    Sidebar,
    SpacesScreen,
} from '@spayce/react-ui';
import type { SpaceItem, ContextMenuItem, Space, SidebarMode, SidebarTabId } from '@spayce/react-ui';
import * as LucideIcons from 'lucide-react';
import { useSpacesData } from './hooks/useSpacesData';

// Loading skeleton for spaces
function SpacesLoadingSkeleton(): React.ReactElement {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: SpayceColors.textSecondary,
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: `3px solid ${SpayceColors.borderSubtle}`,
                    borderTopColor: SpayceColors.primary,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px',
                }} />
                <p>Loading spaces...</p>
            </div>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// Error display component
function SpacesError({ error, onRetry }: { error: Error; onRetry: () => void }): React.ReactElement {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: SpayceColors.textSecondary,
        }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: SpayceColors.error, marginBottom: 8 }}>Failed to load spaces</h2>
                <p style={{ marginBottom: 16 }}>{error.message}</p>
                <button
                    onClick={onRetry}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: SpayceColors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                    }}
                >
                    Retry
                </button>
            </div>
        </div>
    );
}

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
    // Use the data hook to fetch spaces from the database
    const {
        spaces,
        loading,
        error,
        refetch,
        createSpace,
        updateSpace,
        reorderSpaces,
    } = useSpacesData();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    // Sidebar and SpacesScreen have independent active space indices
    const [sidebarActiveSpaceIndex, setSidebarActiveSpaceIndex] = useState(0);
    const [spacesScreenActiveSpaceIndex, setSpacesScreenActiveSpaceIndex] = useState(0);
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>('fixed');
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [activeTab, setActiveTab] = useState<SidebarTabId>('spaces');
    // Focus context: 'sidebar' or 'spacesScreen'
    // Rule 0: Default to 'sidebar' on app open
    const [focusContext, setFocusContext] = useState<'sidebar' | 'spacesScreen'>('sidebar');

    const [contextMenu, setContextMenu] = useState<{
        item: SpaceItem;
        spaceId: string;
        position: { x: number; y: number };
    } | null>(null);
    const [hasClipboard] = useState(false);

    // Handle sidebar visibility changes (Rule 3 & 4)
    const handleSidebarVisibilityChange = (visible: boolean) => {
        setSidebarVisible(visible);
        if (sidebarMode === 'floating') {
            if (visible) {
                setFocusContext('sidebar');
            } else {
                if (activeTab === 'spaces') {
                    setFocusContext('spacesScreen');
                }
            }
        }
    };

    const handleItemClick = (item: SpaceItem, spaceId: string) => {
        console.log('Item clicked:', item.name, 'in space:', spaceId);
        setSelectedId(item.id);
        setFocusContext('sidebar');
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

    const handleCreateSpace = async (spaceData: {
        name: string;
        iconName: string;
        accentColor: string;
    }) => {
        const newSpace = await createSpace(spaceData);
        if (newSpace) {
            setSidebarActiveSpaceIndex(spaces.length);
            console.log('Created new space:', newSpace);
        }
    };

    const handleUpdateSpace = async (space: Space, spaceData: {
        name: string;
        iconName: string;
        accentColor: string;
    }) => {
        await updateSpace(space.id, spaceData);
        console.log('Updated space:', space.name, 'to', spaceData);
    };

    const handleSettingsClick = () => {
        console.log('Settings clicked');
    };

    const handleReorderSpaces = async (oldIndex: number, newIndex: number) => {
        const newOrder = [...spaces];
        const [removed] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, removed);
        await reorderSpaces(newOrder.map(s => s.id));
    };

    // Show loading state
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                width: '100vw',
                height: '100vh',
                backgroundColor: SpayceColors.backgroundDark,
            }}>
                <SpacesLoadingSkeleton />
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div style={{
                display: 'flex',
                width: '100vw',
                height: '100vh',
                backgroundColor: SpayceColors.backgroundDark,
            }}>
                <SpacesError error={error} onRetry={refetch} />
            </div>
        );
    }

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
                    onFocusChange={(hasFocus: boolean) => {
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
                        onItemClick={(item: SpaceItem, spaceId: string) => {
                            console.log('SpacesScreen item clicked:', item.name, 'in space:', spaceId);
                        }}
                        onItemContextMenu={handleContextMenu}
                        onAddSpace={() => {
                            console.log('Add space clicked from SpacesScreen');
                        }}
                        onAddFolder={handleAddFolder}
                        onAddLink={handleAddLink}
                        onReorderSpaces={handleReorderSpaces}
                        onFocusChange={(hasFocus: boolean) => {
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
