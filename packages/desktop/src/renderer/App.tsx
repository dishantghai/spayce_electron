import React, { useState, useCallback } from 'react';
import {
    SpayceColors,
    SpaceItemType,
    ContextMenu,
    Sidebar,
    SpacesScreen,
} from '@spayce/react-ui';
import { useInlineInputStore, useClipboardStore } from '@spayce/react-ui/stores';
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

// Helper to check if folder has nested links
function hasNestedLinks(item: SpaceItem): boolean {
    if (item.type === SpaceItemType.link) {
        return true;
    }
    if (item.children && item.children.length > 0) {
        return item.children.some(child => hasNestedLinks(child));
    }
    return false;
}

// Helper to recursively collect all links from folder tree
function collectAllLinks(item: SpaceItem): SpaceItem[] {
    const links: SpaceItem[] = [];

    if (item.type === SpaceItemType.link) {
        links.push(item);
    }

    if (item.children && item.children.length > 0) {
        for (const child of item.children) {
            links.push(...collectAllLinks(child));
        }
    }

    return links;
}

// Helper to generate context menu items based on item type
function getContextMenuItems(item: SpaceItem, hasClipboard: boolean): ContextMenuItem[] {
    const items: ContextMenuItem[] = [];

    if (item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder) {
        const isLocalFolder = item.type === SpaceItemType.localFolder;

        // Group 1: Creation actions
        items.push(
            { id: 'new_folder', label: 'New Folder', icon: LucideIcons.FolderPlus },
            { id: 'new_link', label: 'Add Link', icon: LucideIcons.Link },
            { id: 'divider1', label: '', icon: LucideIcons.Minus, isDivider: true },
        );

        // Group 2: Import actions (disabled for now)
        items.push(
            { id: 'import_folder', label: 'Import Local Folder', icon: LucideIcons.FolderOpen, isDisabled: true },
            { id: 'import_file', label: 'Import Local File', icon: LucideIcons.File, isDisabled: true },
            { id: 'divider2', label: '', icon: LucideIcons.Minus, isDivider: true },
        );

        // Group 3: Edit and clipboard actions
        items.push(
            { id: 'rename', label: 'Rename', icon: LucideIcons.Pencil },
            { id: 'copy_folder', label: 'Copy Folder', icon: LucideIcons.Copy },
        );

        // Conditionally add "Copy All Links" if folder has nested links
        if (hasNestedLinks(item)) {
            items.push({ id: 'copy_links', label: 'Copy All Links', icon: LucideIcons.Link2 });
        }

        // Conditionally add "Paste" if clipboard has items
        if (hasClipboard) {
            items.push({ id: 'paste', label: 'Paste', icon: LucideIcons.ClipboardPaste });
        }

        items.push({ id: 'divider3', label: '', icon: LucideIcons.Minus, isDivider: true });

        // Group 4: Advanced actions
        // Refresh only for local folders
        if (isLocalFolder) {
            items.push({ id: 'refresh', label: 'Refresh', icon: LucideIcons.RefreshCw });
        }

        items.push(
            { id: 'open_workspace', label: 'Open in Workspace', icon: LucideIcons.PanelLeft, isDisabled: true },
            { id: 'delete', label: 'Delete', icon: LucideIcons.Trash2, isDestructive: true },
        );
    } else if (item.type === SpaceItemType.link) {
        items.push(
            { id: 'rename', label: 'Rename', icon: LucideIcons.Pencil },
            { id: 'copy_link', label: 'Copy Link', icon: LucideIcons.Copy },
            { id: 'divider1', label: '', icon: LucideIcons.Minus, isDivider: true }
        );

        // Pin/Unpin based on current state
        if (item.isPinned) {
            items.push({ id: 'unpin', label: 'Unpin', icon: LucideIcons.PinOff });
        } else {
            items.push({ id: 'pin', label: 'Pin to Top', icon: LucideIcons.Pin });
        }

        items.push(
            { id: 'divider2', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'remove', label: 'Remove', icon: LucideIcons.Trash2, isDestructive: true }
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

    // Independent selection states for sidebar and space cards
    const [sidebarSelectedId, setSidebarSelectedId] = useState<string | null>(null);
    const [cardSelectedId, setCardSelectedId] = useState<string | null>(null);
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
        context: 'sidebar' | 'card';
    } | null>(null);

    // Clipboard store for copy/paste functionality
    const clipboardStore = useClipboardStore();
    const hasClipboard = clipboardStore.hasItems();

    // Inline input store for rename and create functionality
    const {
        setSidebarRenameItemId,
        setCardRenameItemId,
        setSidebarInput,
        setCardInput,
    } = useInlineInputStore();

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
        setSidebarSelectedId(item.id);
        setFocusContext('sidebar');
    };

    // Sidebar context menu handler
    const handleSidebarContextMenu = (item: SpaceItem, spaceId: string, event: React.MouseEvent) => {
        setSidebarSelectedId(item.id); // Focus the item when context menu opens
        setContextMenu({
            item,
            spaceId,
            position: { x: event.clientX, y: event.clientY },
            context: 'sidebar',
        });
    };

    // SpaceCard context menu handler
    const handleCardContextMenu = (item: SpaceItem, spaceId: string, event: React.MouseEvent) => {
        setCardSelectedId(item.id); // Focus the item when context menu opens
        setContextMenu({
            item,
            spaceId,
            position: { x: event.clientX, y: event.clientY },
            context: 'card',
        });
    };

    const handleContextMenuItemClick = async (actionId: string) => {
        if (!contextMenu) return;

        const { item, spaceId } = contextMenu;

        switch (actionId) {
            case 'new_folder': {
                // Trigger inline input for subfolder (same as hover action)
                if (contextMenu.context === 'sidebar') {
                    setSidebarInput({ spaceId, parentId: item.id, type: 'folder' });
                } else {
                    setCardInput({ spaceId, parentId: item.id, type: 'folder' });
                }
                break;
            }
            case 'add_link':
            case 'new_link': {
                // Trigger inline input for link (same as hover action)
                if (contextMenu.context === 'sidebar') {
                    setSidebarInput({ spaceId, parentId: item.id, type: 'link' });
                } else {
                    setCardInput({ spaceId, parentId: item.id, type: 'link' });
                }
                break;
            }
            case 'rename': {
                // Use inline rename instead of prompt dialog
                if (contextMenu.context === 'sidebar') {
                    setSidebarRenameItemId(item.id);
                } else {
                    setCardRenameItemId(item.id);
                }
                break;
            }
            case 'copy_folder': {
                // Copy folder to internal clipboard
                clipboardStore.copyItems([item], spaceId);
                console.log('Folder copied to clipboard');
                break;
            }
            case 'copy_links': {
                // Recursively collect all links and copy to system clipboard
                const links = collectAllLinks(item);

                if (links.length > 0) {
                    // Copy URLs to system clipboard (newline separated)
                    const urls = links.map(link => link.path).join('\n');
                    try {
                        await navigator.clipboard.writeText(urls);
                        // Also copy to internal clipboard
                        clipboardStore.copyItems(links, spaceId);
                        console.log(`Copied ${links.length} link(s) to clipboard`);
                    } catch (err) {
                        console.error('Failed to copy links:', err);
                    }
                }
                break;
            }
            case 'paste': {
                // Paste items from clipboard into folder
                if (clipboardStore.hasItems()) {
                    try {
                        await clipboardStore.pasteItems(item.id, 'inside');
                        await refetch(); // Refresh data
                        console.log('Items pasted successfully');
                    } catch (err) {
                        console.error('Failed to paste items:', err);
                    }
                }
                break;
            }
            case 'refresh': {
                // For local folders, refresh the folder contents
                if (item.type === SpaceItemType.localFolder) {
                    try {
                        await (window as any).electronAPI?.items?.refreshLocalFolder(item.id);
                        await refetch();
                        console.log('Local folder refreshed');
                    } catch (err) {
                        console.error('Failed to refresh local folder:', err);
                    }
                }
                break;
            }
            case 'copy_link': {
                // Copy link URL to clipboard
                try {
                    await navigator.clipboard.writeText(item.path);
                    console.log('Link copied to clipboard');
                } catch (err) {
                    console.error('Failed to copy link:', err);
                }
                break;
            }
            case 'pin': {
                // Pin item to top
                const result = await (window as any).electronAPI?.items?.pin(item.id);
                if (result?.success) {
                    await refetch();
                }
                break;
            }
            case 'unpin': {
                // Unpin item
                const result = await (window as any).electronAPI?.items?.unpin(item.id);
                if (result?.success) {
                    await refetch();
                }
                break;
            }
            case 'delete':
            case 'remove': {
                if (confirm(`Delete "${item.name}"?`)) {
                    const result = await (window as any).electronAPI?.items?.delete(item.id);
                    if (result?.success) {
                        await refetch();
                    }
                }
                break;
            }
            case 'copy-url': {
                if (item.path) {
                    await (window as any).electronAPI?.clipboard?.writeText(item.path);
                }
                break;
            }
            case 'open-new-tab': {
                if (item.path) {
                    window.open(item.path, '_blank');
                }
                break;
            }
            default:
                console.log('Unhandled context menu action:', actionId, item.name);
        }

        setContextMenu(null);
    };

    const handleModeToggle = () => {
        setSidebarMode((prev: SidebarMode) => (prev === 'fixed' ? 'floating' : 'fixed'));
    };

    const handleAddFolder = async (spaceId: string, parentId?: string | null) => {
        // Use inline input store - determine context based on focus
        if (focusContext === 'sidebar') {
            setSidebarInput({ spaceId, parentId: parentId ?? null, type: 'folder' });
        } else {
            setCardInput({ spaceId, parentId: parentId ?? null, type: 'folder' });
        }
    };

    const handleAddLink = async (spaceId: string, parentId?: string | null) => {
        // Use inline input store - determine context based on focus
        if (focusContext === 'sidebar') {
            setSidebarInput({ spaceId, parentId: parentId ?? null, type: 'link' });
        } else {
            setCardInput({ spaceId, parentId: parentId ?? null, type: 'link' });
        }
    };

    const handleCreateItem = async (input: {
        spaceId: string;
        parentId: string | null;
        name: string;
        path: string;
        type: string;
        faviconUrl?: string | null;
    }) => {
        const result = await (window as any).electronAPI?.items?.create({
            spaceId: input.spaceId,
            parentId: input.parentId || undefined,
            name: input.name,
            path: input.path,
            type: input.type,
        });

        if (result?.success) {
            await refetch();
        }
    };

    const handleRenameItem = async (itemId: string, newName: string) => {
        const result = await (window as any).electronAPI?.items?.rename(itemId, newName);

        if (result?.success) {
            await refetch();
        }
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
                    selectedItemId={sidebarSelectedId}
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
                    onItemContextMenu={handleSidebarContextMenu}
                    onCreateSpace={handleCreateSpace}
                    onAddFolder={handleAddFolder}
                    onAddLink={handleAddLink}
                    onCreateItem={handleCreateItem}
                    onRenameItem={handleRenameItem}
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
                        selectedItemId={cardSelectedId}
                        hasFocus={focusContext === 'spacesScreen'}
                        onSpaceSelect={setSpacesScreenActiveSpaceIndex}
                        onItemClick={(item: SpaceItem, spaceId: string) => {
                            console.log('SpacesScreen item clicked:', item.name, 'in space:', spaceId);
                            setCardSelectedId(item.id);
                            setFocusContext('spacesScreen');
                        }}
                        onItemContextMenu={handleCardContextMenu}
                        onAddSpace={() => {
                            console.log('Add space clicked from SpacesScreen');
                        }}
                        onAddFolder={handleAddFolder}
                        onAddLink={handleAddLink}
                        onRenameItem={handleRenameItem}
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
