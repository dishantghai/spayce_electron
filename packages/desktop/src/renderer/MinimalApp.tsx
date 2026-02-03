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

// Mock data - no IPC calls
const MOCK_SPACES: Space[] = [
    {
        id: 'space-1',
        profileId: 'default-profile',
        userId: 'default-user',
        name: 'Test Space',
        accentColor: '#6D5AE6',
        iconName: 'Folder',
        order: 0,
        isExpanded: true,
        createdAt: new Date(),
        rootItems: [],
    }
];

export function MinimalApp(): React.ReactElement {
    const [spaces] = useState<Space[]>(MOCK_SPACES);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sidebarActiveSpaceIndex, setSidebarActiveSpaceIndex] = useState(0);
    const [spacesScreenActiveSpaceIndex, setSpacesScreenActiveSpaceIndex] = useState(0);
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>('fixed');
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [activeTab, setActiveTab] = useState<SidebarTabId>('spaces');
    const [focusContext, setFocusContext] = useState<'sidebar' | 'spacesScreen'>('sidebar');
    const [contextMenu, setContextMenu] = useState<{
        item: SpaceItem;
        spaceId: string;
        position: { x: number; y: number };
    } | null>(null);

    console.log('[MinimalApp] Rendering with', spaces.length, 'spaces');

    const handleItemClick = (item: SpaceItem, spaceId: string) => {
        console.log('[MinimalApp] Item clicked:', item.name);
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
        console.log('[MinimalApp] Context menu action:', itemId);
        setContextMenu(null);
    };

    const handleModeToggle = () => {
        setSidebarMode((prev: SidebarMode) => (prev === 'fixed' ? 'floating' : 'fixed'));
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
            <div
                style={{
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
                    userName="Test User"
                    isVisible={sidebarVisible}
                    hasFocus={focusContext === 'sidebar'}
                    onSpaceSelect={setSidebarActiveSpaceIndex}
                    onTabChange={setActiveTab}
                    onModeToggle={handleModeToggle}
                    onVisibilityChange={setSidebarVisible}
                    onItemClick={handleItemClick}
                    onItemContextMenu={handleContextMenu}
                    onCreateSpace={(data) => console.log('[MinimalApp] Create space:', data)}
                    onAddFolder={(spaceId) => console.log('[MinimalApp] Add folder:', spaceId)}
                    onAddLink={(spaceId) => console.log('[MinimalApp] Add link:', spaceId)}
                    onEditSpace={(space, data) => console.log('[MinimalApp] Edit space:', space.name, data)}
                    onSettingsClick={() => console.log('[MinimalApp] Settings clicked')}
                    onFocusChange={(hasFocus) => { if (hasFocus) setFocusContext('sidebar'); }}
                />
            </div>

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
                        onItemClick={handleItemClick}
                        onItemContextMenu={handleContextMenu}
                        onAddSpace={() => console.log('[MinimalApp] Add space')}
                        onAddFolder={(spaceId) => console.log('[MinimalApp] Add folder:', spaceId)}
                        onAddLink={(spaceId) => console.log('[MinimalApp] Add link:', spaceId)}
                        onReorderSpaces={(oldIdx, newIdx) => console.log('[MinimalApp] Reorder:', oldIdx, newIdx)}
                        onFocusChange={(hasFocus) => { if (hasFocus) setFocusContext('spacesScreen'); }}
                    />
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <h2 style={{ fontSize: 24, color: SpayceColors.textPrimary }}>
                            {activeTab === 'browser' ? 'Browser View' : 'Workspace View'}
                        </h2>
                    </div>
                )}
            </main>

            {contextMenu && (
                <ContextMenu
                    items={[
                        { id: 'delete', label: 'Delete', icon: LucideIcons.Trash2, isDestructive: true }
                    ]}
                    position={contextMenu.position}
                    onItemClick={handleContextMenuItemClick}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}
