# Spec 020: Sidebar Overlay WebContentsView

## Overview

Implement a true sidebar overlay for the browser view using multiple WebContentsViews with z-index ordering. In floating mode, the sidebar will render as a separate WebContentsView positioned ON TOP of the browser WebContentsView, achieving Arc browser-like behavior where the browser content never moves or resizes when the sidebar opens/closes.

> **CRITICAL**: This spec solves a fundamental Electron architecture constraint: WebContentsView ALWAYS renders ON TOP of HTML/React content. The only solution for true overlay behavior is to make the sidebar itself a WebContentsView at a higher z-index than the browser.

## Problem Statement

### Current Behavior (Spec 019)
- In floating mode, the sidebar (React/HTML) attempts to overlay the browser
- But WebContentsView is a native Chromium component that renders above all HTML content
- Result: Browser must be resized/moved to avoid covering the sidebar
- This causes flickering and layout shifts when sidebar opens/closes

### Target Behavior (This Spec)
- Browser WebContentsView stays at **fixed bounds** (never moves or resizes)
- Sidebar renders as a **separate WebContentsView** at a higher z-index
- Sidebar slides in/out over the browser as a true overlay
- Browser content remains 100% stable - no flicker, no movement

## Dependencies & Scope Coordination

**Dependencies:**
- **Spec 017**: BrowserService (WebContentsView management, IPC patterns)
- **Spec 019**: Single Tab Browser MVP (browser component foundation)
- **Spec 002**: Sidebar Navigation (existing sidebar UI components)

**Integration Points:**
- Extends main process with SidebarOverlayService
- Creates separate renderer entry point for sidebar WebContentsView
- Adds IPC channels for state synchronization
- Modifies BrowserService for fixed bounds
- Updates Vite build config for multi-entry points

**This Spec Covers:**
- SidebarOverlayService (main process) for managing sidebar WebContentsView
- Sidebar renderer entry point (sidebar.html, sidebar.tsx)
- IPC handlers for sidebar overlay communication
- State synchronization between main renderer and sidebar overlay
- BrowserService modifications for fixed bounds (no sidebar offset)
- Preload API extension for sidebar overlay
- Animation for sidebar slide in/out
- Vite multi-entry build configuration

**Out of Scope:**
- Multi-tab support (Spec 020+)
- Sidebar drag-resize (future enhancement)
- Sidebar persistence (future spec)
- Additional overlay panels

### Related Documents

| Document | Purpose |
|----------|---------|
| [plan.md](./plan.md) | Implementation phases and timeline |
| [status.json](./status.json) | Metadata, dependencies, and tracking |

### References
- **HiFi Design**: `project_ops/HIFI_UI_DESIGN_SCREENS/Browser View.png`
- **Flutter Reference**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/`
- **Arc Browser Behavior**: Sidebar overlays browser content seamlessly

## User Stories

### US-020-001: Stable Browser Content
- **As a user**, I want the browser content to remain completely stable when I open/close the sidebar so that my browsing experience is smooth and uninterrupted
- **Acceptance Criteria:**
  - Given I'm viewing a web page in the browser
  - When I open the floating sidebar
  - Then the browser content does NOT move or resize
  - And the sidebar slides in ON TOP of the browser content
  - And there is no flicker or visual glitch

### US-020-002: Sidebar Overlay Interaction
- **As a user**, I want to interact with the sidebar overlay normally so that I can navigate my spaces while browsing
- **Acceptance Criteria:**
  - Given the sidebar overlay is visible
  - When I click on spaces, items, or actions in the sidebar
  - Then the actions execute correctly
  - And the sidebar responds to all interactions as expected
  - And keyboard shortcuts work as expected

### US-020-003: Sidebar Slide Animation
- **As a user**, I want to see a smooth slide animation when the sidebar opens/closes so that the transition feels polished
- **Acceptance Criteria:**
  - Given the sidebar is closed
  - When I trigger the sidebar to open
  - Then the sidebar slides in from the left with a smooth animation
  - And the animation duration matches the existing 250ms transition
  - And the browser content behind remains visible and stable

### US-020-004: State Synchronization
- **As a user**, I want my sidebar to show accurate data when I interact with it so that I can trust the information displayed
- **Acceptance Criteria:**
  - Given I have spaces and items in my data
  - When the sidebar overlay opens
  - Then it displays the correct spaces, items, and selections
  - And any changes I make in the sidebar are reflected immediately
  - And creating/editing items works correctly

### US-020-005: Context Menu Support
- **As a user**, I want context menus to work correctly in the sidebar overlay so that I can perform all actions
- **Acceptance Criteria:**
  - Given the sidebar overlay is visible
  - When I right-click on a space or item
  - Then the context menu appears correctly positioned
  - And all context menu actions function as expected

## MVP Scope

### Included:
- SidebarOverlayService with create/show/hide/destroy methods
- Sidebar WebContentsView managed by main process
- IPC handlers for sidebar overlay operations
- State synchronization via IPC (spaces, active space, selections)
- Action forwarding from sidebar overlay to main renderer
- Sidebar slide-in/slide-out animation via bounds changes
- Browser bounds fixed at full width (never changes)
- Vite multi-entry build (main + sidebar)
- Preload API extension for sidebar overlay
- Integration with existing Sidebar React component

### Excluded:
- Sidebar resize via drag
- Sidebar width persistence
- Multiple overlay panels
- Sidebar on right side
- Sidebar as BrowserView (using WebContentsView)

## Requirements

### R1: SidebarOverlayService (Main Process)

#### 1.1 Service Implementation

```typescript
// packages/desktop/src/main/services/SidebarOverlayService.ts

import { BrowserWindow, WebContentsView } from 'electron';
import * as path from 'path';

/**
 * Sidebar overlay configuration
 */
export interface SidebarOverlayConfig {
  width: number;          // Sidebar width in pixels
  animationDuration: number; // Animation duration in ms
}

const DEFAULT_CONFIG: SidebarOverlayConfig = {
  width: 320,
  animationDuration: 250,
};

/**
 * SidebarOverlayService manages the sidebar WebContentsView overlay
 *
 * The sidebar is rendered as a separate WebContentsView that floats
 * above the browser WebContentsView, achieving true overlay behavior.
 */
export class SidebarOverlayService {
  private sidebarView: WebContentsView | null = null;
  private mainWindow: BrowserWindow | null = null;
  private config: SidebarOverlayConfig;
  private isVisible = false;
  private isAnimating = false;

  constructor(config: Partial<SidebarOverlayConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the service with the main window
   */
  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
    this.createSidebarView();
  }

  /**
   * Create the sidebar WebContentsView
   */
  private createSidebarView(): void {
    if (!this.mainWindow) return;

    this.sidebarView = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    // Load sidebar-specific entry point
    if (process.env.NODE_ENV === 'development') {
      this.sidebarView.webContents.loadURL('http://localhost:5173/sidebar.html');
    } else {
      this.sidebarView.webContents.loadFile(
        path.join(__dirname, '../renderer/sidebar.html')
      );
    }

    // Set initial bounds (off-screen to the left)
    this.updateBounds(-this.config.width);
  }

  /**
   * Show the sidebar overlay with animation
   */
  async show(): Promise<void> {
    if (!this.sidebarView || !this.mainWindow || this.isVisible || this.isAnimating) {
      return;
    }

    this.isAnimating = true;

    // Add to window at index 1 (above browser at index 0)
    this.mainWindow.contentView.addChildView(this.sidebarView, 1);

    // Animate from off-screen to visible
    await this.animateBounds(-this.config.width, 0);

    this.isVisible = true;
    this.isAnimating = false;
  }

  /**
   * Hide the sidebar overlay with animation
   */
  async hide(): Promise<void> {
    if (!this.sidebarView || !this.mainWindow || !this.isVisible || this.isAnimating) {
      return;
    }

    this.isAnimating = true;

    // Animate from visible to off-screen
    await this.animateBounds(0, -this.config.width);

    // Remove from window
    this.mainWindow.contentView.removeChildView(this.sidebarView);

    this.isVisible = false;
    this.isAnimating = false;
  }

  /**
   * Toggle sidebar visibility
   */
  async toggle(): Promise<boolean> {
    if (this.isVisible) {
      await this.hide();
    } else {
      await this.show();
    }
    return this.isVisible;
  }

  /**
   * Update sidebar bounds
   */
  private updateBounds(x: number): void {
    if (!this.sidebarView || !this.mainWindow) return;

    const [width, height] = this.mainWindow.getSize();

    // Account for traffic lights on macOS
    const topOffset = process.platform === 'darwin' ? 0 : 0;

    this.sidebarView.setBounds({
      x: x,
      y: topOffset,
      width: this.config.width,
      height: height - topOffset,
    });
  }

  /**
   * Animate bounds from start to end x position
   */
  private animateBounds(startX: number, endX: number): Promise<void> {
    return new Promise((resolve) => {
      const duration = this.config.animationDuration;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentX = startX + (endX - startX) * eased;
        this.updateBounds(Math.round(currentX));

        if (progress < 1) {
          setImmediate(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Get visibility state
   */
  getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Get sidebar WebContents for IPC communication
   */
  getWebContents(): Electron.WebContents | null {
    return this.sidebarView?.webContents ?? null;
  }

  /**
   * Handle window resize - update sidebar bounds
   */
  handleWindowResize(): void {
    if (this.isVisible) {
      this.updateBounds(0);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.sidebarView && this.mainWindow) {
      try {
        this.mainWindow.contentView.removeChildView(this.sidebarView);
      } catch {
        // View may not be attached
      }
    }
    this.sidebarView = null;
    this.mainWindow = null;
  }
}

// Singleton instance
let sidebarOverlayService: SidebarOverlayService | null = null;

export function getSidebarOverlayService(): SidebarOverlayService {
  if (!sidebarOverlayService) {
    sidebarOverlayService = new SidebarOverlayService();
  }
  return sidebarOverlayService;
}
```

---

### R2: IPC Handlers for Sidebar Overlay

#### 2.1 Sidebar Overlay IPC Handlers

```typescript
// packages/desktop/src/main/ipc/sidebarOverlayHandlers.ts

import { ipcMain, BrowserWindow } from 'electron';
import { getSidebarOverlayService } from '../services/SidebarOverlayService';

/**
 * State payload for sidebar overlay synchronization
 */
export interface SidebarStatePayload {
  spaces: Array<{
    id: string;
    name: string;
    icon: string;
    color?: string;
  }>;
  activeSpaceId: string | null;
  activeSpaceIndex: number;
  selectedItemId: string | null;
  expandedIds: string[];
  sidebarMode: 'floating' | 'fixed';
  activeTab: string;
}

/**
 * Action payload from sidebar overlay
 */
export interface SidebarActionPayload {
  type: string;
  payload: unknown;
}

/**
 * Register sidebar overlay IPC handlers
 */
export function registerSidebarOverlayHandlers(mainWindow: BrowserWindow): void {
  const service = getSidebarOverlayService();

  // Initialize service with main window
  service.initialize(mainWindow);

  // Handle window resize
  mainWindow.on('resize', () => {
    service.handleWindowResize();
  });

  // Show sidebar overlay
  ipcMain.handle('sidebar-overlay:show', async () => {
    await service.show();
    return { success: true, isVisible: service.getIsVisible() };
  });

  // Hide sidebar overlay
  ipcMain.handle('sidebar-overlay:hide', async () => {
    await service.hide();
    return { success: true, isVisible: service.getIsVisible() };
  });

  // Toggle sidebar overlay
  ipcMain.handle('sidebar-overlay:toggle', async () => {
    const isVisible = await service.toggle();
    return { success: true, isVisible };
  });

  // Get visibility state
  ipcMain.handle('sidebar-overlay:getVisibility', () => {
    return { success: true, isVisible: service.getIsVisible() };
  });

  // Sync state from main renderer to sidebar overlay
  ipcMain.on('sidebar-overlay:sync-state', (_event, state: SidebarStatePayload) => {
    const sidebarWebContents = service.getWebContents();
    if (sidebarWebContents) {
      sidebarWebContents.send('sidebar:state-update', state);
    }
  });

  // Forward action from sidebar overlay to main renderer
  ipcMain.on('sidebar-overlay:action', (_event, action: SidebarActionPayload) => {
    mainWindow.webContents.send('sidebar:action', action);
  });
}

/**
 * Cleanup handlers
 */
export function unregisterSidebarOverlayHandlers(): void {
  const service = getSidebarOverlayService();
  service.destroy();

  ipcMain.removeHandler('sidebar-overlay:show');
  ipcMain.removeHandler('sidebar-overlay:hide');
  ipcMain.removeHandler('sidebar-overlay:toggle');
  ipcMain.removeHandler('sidebar-overlay:getVisibility');
  ipcMain.removeAllListeners('sidebar-overlay:sync-state');
  ipcMain.removeAllListeners('sidebar-overlay:action');
}
```

---

### R3: Preload API Extension

#### 3.1 Sidebar Overlay Preload API

```typescript
// packages/desktop/src/preload/index.ts (additions)

/**
 * Sidebar overlay API
 */
const sidebarOverlayAPI = {
  show: () => ipcRenderer.invoke('sidebar-overlay:show'),
  hide: () => ipcRenderer.invoke('sidebar-overlay:hide'),
  toggle: () => ipcRenderer.invoke('sidebar-overlay:toggle'),
  getVisibility: () => ipcRenderer.invoke('sidebar-overlay:getVisibility'),

  // Sync state from main renderer to sidebar overlay
  syncState: (state: unknown) => {
    ipcRenderer.send('sidebar-overlay:sync-state', state);
  },

  // Forward action from sidebar overlay to main renderer
  sendAction: (action: unknown) => {
    ipcRenderer.send('sidebar-overlay:action', action);
  },

  // Listen for state updates (sidebar overlay only)
  onStateUpdate: (callback: (state: unknown) => void) => {
    const handler = (_: unknown, state: unknown) => callback(state);
    ipcRenderer.on('sidebar:state-update', handler);
    return () => ipcRenderer.removeListener('sidebar:state-update', handler);
  },

  // Listen for actions (main renderer only)
  onAction: (callback: (action: unknown) => void) => {
    const handler = (_: unknown, action: unknown) => callback(action);
    ipcRenderer.on('sidebar:action', handler);
    return () => ipcRenderer.removeListener('sidebar:action', handler);
  },
};

// Add to contextBridge exposure
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs ...
  sidebarOverlay: sidebarOverlayAPI,
});
```

#### 3.2 Type Definitions

```typescript
// packages/desktop/src/preload/types.ts (additions)

/**
 * Sidebar overlay API exposed to renderer
 */
export interface SidebarOverlayAPI {
  show: () => Promise<{ success: boolean; isVisible: boolean }>;
  hide: () => Promise<{ success: boolean; isVisible: boolean }>;
  toggle: () => Promise<{ success: boolean; isVisible: boolean }>;
  getVisibility: () => Promise<{ success: boolean; isVisible: boolean }>;
  syncState: (state: SidebarStatePayload) => void;
  sendAction: (action: SidebarActionPayload) => void;
  onStateUpdate: (callback: (state: SidebarStatePayload) => void) => () => void;
  onAction: (callback: (action: SidebarActionPayload) => void) => () => void;
}

/**
 * State synced to sidebar overlay
 */
export interface SidebarStatePayload {
  spaces: Array<{
    id: string;
    name: string;
    icon: string;
    color?: string;
  }>;
  activeSpaceId: string | null;
  activeSpaceIndex: number;
  selectedItemId: string | null;
  expandedIds: string[];
  sidebarMode: 'floating' | 'fixed';
  activeTab: string;
}

/**
 * Action from sidebar overlay
 */
export interface SidebarActionPayload {
  type:
    | 'SELECT_SPACE'
    | 'SELECT_ITEM'
    | 'EXPAND_ITEM'
    | 'COLLAPSE_ITEM'
    | 'CREATE_ITEM'
    | 'RENAME_ITEM'
    | 'DELETE_ITEM'
    | 'MOVE_ITEM'
    | 'OPEN_CONTEXT_MENU'
    | 'CLOSE_SIDEBAR';
  payload: unknown;
}

// Update ElectronAPI interface
export interface ElectronAPI {
  // ... existing APIs ...
  sidebarOverlay: SidebarOverlayAPI;
}
```

---

### R4: Sidebar Renderer Entry Point

#### 4.1 HTML Entry Point

```html
<!-- packages/desktop/src/renderer/sidebar.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';">
    <title>Spayce Sidebar</title>
  </head>
  <body>
    <div id="sidebar-root"></div>
    <script type="module" src="./sidebar.tsx"></script>
  </body>
</html>
```

#### 4.2 Sidebar React Entry Point

```typescript
// packages/desktop/src/renderer/sidebar.tsx

import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar } from '@spayce/react-ui';
import { useSidebarOverlayStore } from './stores/sidebarOverlayStore';
import './sidebar.css';

/**
 * Sidebar Overlay Application
 *
 * This is a separate React application that runs in the sidebar WebContentsView.
 * It receives state updates from the main renderer via IPC and forwards
 * user actions back.
 */
function SidebarOverlayApp() {
  const {
    spaces,
    activeSpaceIndex,
    selectedItemId,
    expandedIds,
    activeTab,
    initializeSubscriptions,
    handleSpaceSelect,
    handleItemSelect,
    handleItemExpand,
    handleItemCollapse,
    handleCloseSidebar,
  } = useSidebarOverlayStore();

  // Initialize IPC subscriptions on mount
  useEffect(() => {
    const cleanup = initializeSubscriptions();
    return cleanup;
  }, [initializeSubscriptions]);

  // Close sidebar handler
  const handleClose = () => {
    handleCloseSidebar();
    window.electronAPI.sidebarOverlay.hide();
  };

  return (
    <div className="sidebar-overlay-container">
      <Sidebar
        spaces={spaces}
        activeSpaceIndex={activeSpaceIndex}
        selectedItemId={selectedItemId}
        expandedIds={expandedIds}
        mode="floating"
        isVisible={true}
        onSpaceSelect={handleSpaceSelect}
        onItemSelect={handleItemSelect}
        onItemExpand={handleItemExpand}
        onItemCollapse={handleItemCollapse}
        onClose={handleClose}
        // Additional props as needed
      />
    </div>
  );
}

// Mount React app
const container = document.getElementById('sidebar-root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <SidebarOverlayApp />
    </React.StrictMode>
  );
}
```

#### 4.3 Sidebar Overlay Styles

```css
/* packages/desktop/src/renderer/sidebar.css */

/* Reset and base styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#sidebar-root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: transparent;
}

.sidebar-overlay-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
```

---

### R5: Sidebar Overlay Store

#### 5.1 Zustand Store for Sidebar Overlay

```typescript
// packages/desktop/src/renderer/stores/sidebarOverlayStore.ts

import { create } from 'zustand';
import type { SidebarStatePayload, SidebarActionPayload } from '../../preload/types';

/**
 * Sidebar overlay state store
 *
 * This store receives state from the main renderer via IPC
 * and forwards user actions back.
 */
interface SidebarOverlayState {
  // Synced state
  spaces: SidebarStatePayload['spaces'];
  activeSpaceId: string | null;
  activeSpaceIndex: number;
  selectedItemId: string | null;
  expandedIds: string[];
  sidebarMode: 'floating' | 'fixed';
  activeTab: string;

  // Actions
  initializeSubscriptions: () => () => void;
  updateState: (state: SidebarStatePayload) => void;

  // User action handlers (forward to main renderer)
  handleSpaceSelect: (spaceId: string, index: number) => void;
  handleItemSelect: (itemId: string) => void;
  handleItemExpand: (itemId: string) => void;
  handleItemCollapse: (itemId: string) => void;
  handleCreateItem: (parentId: string | null, type: string) => void;
  handleRenameItem: (itemId: string, newName: string) => void;
  handleDeleteItem: (itemId: string) => void;
  handleMoveItem: (itemId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  handleOpenContextMenu: (itemId: string, x: number, y: number) => void;
  handleCloseSidebar: () => void;
}

/**
 * Send action to main renderer via IPC
 */
function sendAction(action: SidebarActionPayload): void {
  window.electronAPI.sidebarOverlay.sendAction(action);
}

export const useSidebarOverlayStore = create<SidebarOverlayState>((set, get) => ({
  // Initial state
  spaces: [],
  activeSpaceId: null,
  activeSpaceIndex: 0,
  selectedItemId: null,
  expandedIds: [],
  sidebarMode: 'floating',
  activeTab: 'spaces',

  // Initialize IPC subscriptions
  initializeSubscriptions: () => {
    const unsubscribe = window.electronAPI.sidebarOverlay.onStateUpdate((state) => {
      get().updateState(state as SidebarStatePayload);
    });

    console.log('[SidebarOverlayStore] Subscriptions initialized');
    return unsubscribe;
  },

  // Update state from main renderer
  updateState: (state) => {
    set({
      spaces: state.spaces,
      activeSpaceId: state.activeSpaceId,
      activeSpaceIndex: state.activeSpaceIndex,
      selectedItemId: state.selectedItemId,
      expandedIds: state.expandedIds,
      sidebarMode: state.sidebarMode,
      activeTab: state.activeTab,
    });
  },

  // Action handlers
  handleSpaceSelect: (spaceId, index) => {
    sendAction({ type: 'SELECT_SPACE', payload: { spaceId, index } });
  },

  handleItemSelect: (itemId) => {
    sendAction({ type: 'SELECT_ITEM', payload: { itemId } });
  },

  handleItemExpand: (itemId) => {
    sendAction({ type: 'EXPAND_ITEM', payload: { itemId } });
  },

  handleItemCollapse: (itemId) => {
    sendAction({ type: 'COLLAPSE_ITEM', payload: { itemId } });
  },

  handleCreateItem: (parentId, type) => {
    sendAction({ type: 'CREATE_ITEM', payload: { parentId, type } });
  },

  handleRenameItem: (itemId, newName) => {
    sendAction({ type: 'RENAME_ITEM', payload: { itemId, newName } });
  },

  handleDeleteItem: (itemId) => {
    sendAction({ type: 'DELETE_ITEM', payload: { itemId } });
  },

  handleMoveItem: (itemId, targetId, position) => {
    sendAction({ type: 'MOVE_ITEM', payload: { itemId, targetId, position } });
  },

  handleOpenContextMenu: (itemId, x, y) => {
    sendAction({ type: 'OPEN_CONTEXT_MENU', payload: { itemId, x, y } });
  },

  handleCloseSidebar: () => {
    sendAction({ type: 'CLOSE_SIDEBAR', payload: {} });
  },
}));
```

---

### R6: Main Renderer Integration

#### 6.1 State Sync Hook

```typescript
// packages/desktop/src/renderer/hooks/useSidebarOverlaySync.ts

import { useEffect, useCallback } from 'react';
import { useSpacesStore, useSidebarStore, useNavigationStore } from '@spayce/react-ui/stores';
import type { SidebarStatePayload, SidebarActionPayload } from '../../preload/types';

/**
 * Hook to synchronize state with sidebar overlay
 *
 * This hook:
 * 1. Sends state updates to sidebar overlay when relevant state changes
 * 2. Handles actions received from sidebar overlay
 */
export function useSidebarOverlaySync(): void {
  const { spaces, activeSpaceId, activeSpaceIndex } = useSpacesStore();
  const { selectedItemId, expandedIds } = useSidebarStore();
  const { sidebarMode, activeTab } = useNavigationStore();

  // Build state payload
  const buildStatePayload = useCallback((): SidebarStatePayload => {
    return {
      spaces: spaces.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        color: s.color,
      })),
      activeSpaceId,
      activeSpaceIndex,
      selectedItemId,
      expandedIds: Array.from(expandedIds),
      sidebarMode,
      activeTab,
    };
  }, [spaces, activeSpaceId, activeSpaceIndex, selectedItemId, expandedIds, sidebarMode, activeTab]);

  // Sync state to sidebar overlay
  useEffect(() => {
    const state = buildStatePayload();
    window.electronAPI.sidebarOverlay.syncState(state);
  }, [buildStatePayload]);

  // Handle actions from sidebar overlay
  useEffect(() => {
    const unsubscribe = window.electronAPI.sidebarOverlay.onAction((action) => {
      const { type, payload } = action as SidebarActionPayload;

      switch (type) {
        case 'SELECT_SPACE':
          // Handle space selection
          break;
        case 'SELECT_ITEM':
          // Handle item selection
          break;
        case 'EXPAND_ITEM':
          // Handle item expand
          break;
        case 'COLLAPSE_ITEM':
          // Handle item collapse
          break;
        case 'CREATE_ITEM':
          // Handle item creation
          break;
        case 'RENAME_ITEM':
          // Handle item rename
          break;
        case 'DELETE_ITEM':
          // Handle item delete
          break;
        case 'MOVE_ITEM':
          // Handle item move
          break;
        case 'OPEN_CONTEXT_MENU':
          // Handle context menu
          break;
        case 'CLOSE_SIDEBAR':
          // Handle sidebar close
          break;
        default:
          console.warn('[SidebarOverlaySync] Unknown action type:', type);
      }
    });

    return unsubscribe;
  }, []);
}
```

#### 6.2 App.tsx Integration

```typescript
// packages/desktop/src/renderer/App.tsx (modifications)

// Import the sync hook
import { useSidebarOverlaySync } from './hooks/useSidebarOverlaySync';

export function App() {
  // ... existing state and hooks ...

  // Sync state with sidebar overlay
  useSidebarOverlaySync();

  // In floating mode when browser tab is active, hide React sidebar
  // and use WebContentsView sidebar overlay instead
  const showReactSidebar = sidebarMode === 'fixed' || activeTab !== 'browser';

  return (
    <div className={styles.app}>
      {/* Only show React sidebar in fixed mode or non-browser tabs */}
      {showReactSidebar && (
        <Sidebar
          // ... existing props ...
        />
      )}

      {/* Browser area - always full width in floating mode */}
      {activeTab === 'browser' && (
        <BrowserArea
          // In floating mode: 0 (sidebar is overlay, browser full width)
          // In fixed mode: 320 (DOM layout positions content after sidebar)
          sidebarWidth={sidebarMode === 'floating' ? 0 : 320}
        />
      )}

      {/* Other tab content */}
      {activeTab !== 'browser' && (
        // ... existing content ...
      )}
    </div>
  );
}
```

---

### R7: BrowserService Modifications

#### 7.1 Fixed Bounds (No Sidebar Offset)

```typescript
// packages/desktop/src/main/services/BrowserService.ts (modifications)

/**
 * Set view bounds - FIXED at full window width
 *
 * In floating mode, the browser NEVER adjusts for sidebar.
 * The sidebar is a separate WebContentsView overlay.
 */
setActiveView(id: string): boolean {
  const view = this.views.get(id);
  if (!view) return false;

  // Remove current active view if different
  if (this.activeViewId && this.activeViewId !== id) {
    const currentView = this.views.get(this.activeViewId);
    if (currentView) {
      this.mainWindow.contentView.removeChildView(currentView);
    }
  }

  // Add at index 0 (sidebar overlay will be at index 1)
  this.mainWindow.contentView.addChildView(view, 0);
  this.activeViewId = id;

  // Set bounds - FULL WIDTH, no sidebar offset
  this.updateActiveViewBounds();

  return true;
}

/**
 * Update bounds for active view
 * Browser ALWAYS uses full window width (minus toolbar height)
 */
private updateActiveViewBounds(): void {
  if (!this.activeViewId) return;

  const view = this.views.get(this.activeViewId);
  if (!view) return;

  const [width, height] = this.mainWindow.getSize();
  const toolbarHeight = 76; // Tab bar + navigation bar

  // Full window width - NO sidebar offset
  view.setBounds({
    x: 0,
    y: toolbarHeight,
    width: width,
    height: height - toolbarHeight,
  });
}
```

---

### R8: Vite Build Configuration

#### 8.1 Multi-Entry Build

```typescript
// packages/desktop/vite.config.ts (modifications)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/index.html'),
        sidebar: resolve(__dirname, 'src/renderer/sidebar.html'),
      },
    },
  },
  // ... existing config ...
});
```

---

## Acceptance Criteria

### SidebarOverlayService
- [ ] Service creates WebContentsView for sidebar
- [ ] Service adds sidebar at z-index 1 (above browser at 0)
- [ ] Show method adds sidebar to window and animates in
- [ ] Hide method animates out and removes sidebar from window
- [ ] Toggle method correctly switches visibility
- [ ] Window resize updates sidebar bounds
- [ ] Cleanup properly destroys WebContentsView

### IPC Communication
- [ ] Main renderer can show/hide/toggle sidebar overlay
- [ ] State syncs from main renderer to sidebar overlay
- [ ] Actions forward from sidebar overlay to main renderer
- [ ] No memory leaks from IPC listeners

### Sidebar Overlay Renderer
- [ ] Sidebar HTML entry point loads correctly
- [ ] React app mounts and renders sidebar
- [ ] State updates from IPC are reflected in UI
- [ ] User actions trigger IPC messages to main renderer
- [ ] All sidebar functionality works (spaces, items, context menu)

### Browser Bounds
- [ ] Browser WebContentsView uses full window width
- [ ] Browser bounds NEVER change when sidebar opens/closes
- [ ] No flicker or movement in browser content
- [ ] Browser resize works correctly with window resize

### Animation
- [ ] Sidebar slides in smoothly from left
- [ ] Sidebar slides out smoothly to left
- [ ] Animation duration matches 250ms
- [ ] Animation uses ease-out curve
- [ ] No visual glitches during animation

### State Synchronization
- [ ] Spaces list syncs correctly
- [ ] Active space syncs correctly
- [ ] Selected item syncs correctly
- [ ] Expanded items sync correctly
- [ ] Sidebar mode syncs correctly

### Integration
- [ ] Fixed mode still uses React sidebar (no overlay)
- [ ] Non-browser tabs still use React sidebar
- [ ] Floating mode + browser tab uses overlay
- [ ] Keyboard shortcuts work (Cmd+B toggle)
- [ ] All existing functionality preserved

---

## File Structure

```
packages/desktop/src/
├── main/
│   ├── services/
│   │   ├── SidebarOverlayService.ts     # NEW: Sidebar overlay management
│   │   └── BrowserService.ts            # UPDATE: Fixed bounds
│   ├── ipc/
│   │   └── sidebarOverlayHandlers.ts    # NEW: IPC handlers
│   └── index.ts                         # UPDATE: Initialize service
├── preload/
│   ├── types.ts                         # UPDATE: Add overlay types
│   └── index.ts                         # UPDATE: Add overlay API
└── renderer/
    ├── sidebar.html                     # NEW: Sidebar entry HTML
    ├── sidebar.tsx                      # NEW: Sidebar entry React
    ├── sidebar.css                      # NEW: Sidebar styles
    ├── stores/
    │   └── sidebarOverlayStore.ts       # NEW: Sidebar overlay store
    ├── hooks/
    │   └── useSidebarOverlaySync.ts     # NEW: State sync hook
    └── App.tsx                          # UPDATE: Integration

packages/desktop/
└── vite.config.ts                       # UPDATE: Multi-entry build
```

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/services/SidebarOverlayService.test.ts
describe('SidebarOverlayService', () => {
  it('should create sidebar WebContentsView on initialize');
  it('should show sidebar at correct z-index');
  it('should animate sidebar in/out');
  it('should toggle visibility correctly');
  it('should handle window resize');
  it('should cleanup resources on destroy');
});
```

### Integration Tests

```typescript
// __tests__/integration/sidebar-overlay.test.ts
describe('Sidebar Overlay Integration', () => {
  it('should sync state from main renderer to overlay');
  it('should forward actions from overlay to main renderer');
  it('should not move browser when sidebar opens');
  it('should preserve all sidebar functionality');
});
```

### Manual Testing Checklist

1. **Basic Overlay**
   - [ ] Open app in floating mode with browser tab
   - [ ] Press Cmd+B to open sidebar
   - [ ] Verify sidebar slides in from left
   - [ ] Verify browser content does NOT move
   - [ ] Press Cmd+B to close sidebar
   - [ ] Verify sidebar slides out

2. **State Synchronization**
   - [ ] Create new space in sidebar overlay
   - [ ] Verify it appears in spaces list
   - [ ] Select different space
   - [ ] Verify items update

3. **Actions**
   - [ ] Click items in sidebar
   - [ ] Right-click for context menu
   - [ ] Drag items
   - [ ] Create/rename/delete items

4. **Mode Switching**
   - [ ] Switch to fixed mode
   - [ ] Verify React sidebar used (not overlay)
   - [ ] Switch back to floating mode
   - [ ] Verify overlay used again

---

## Dependencies

- **017** (browser-foundation) - BrowserService, WebContentsView patterns
- **019** (single-tab-browser) - Browser component foundation
- **002** (sidebar-navigation) - Sidebar UI components

## Blocks

- **022+** (advanced browser features) - Need stable sidebar overlay

## Estimated Duration

3-4 days

## Complexity Assessment

| Phase | Effort | Risk |
|-------|--------|------|
| SidebarOverlayService | 0.5 day | Low |
| IPC handlers | 0.5 day | Low |
| Sidebar entry point | 0.5 day | Medium |
| State synchronization | 1 day | High |
| Integration & refactoring | 1 day | Medium |
| Testing & polish | 0.5-1 day | Low |

**Primary Risk**: State synchronization complexity. All sidebar functionality must work identically in the overlay as it does in the React sidebar. Mitigation: Start with minimal state (spaces list only), add features incrementally.

## Flutter Reference

**Source**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/browser_screen.dart`

Key patterns:
- Sidebar overlay positioning
- State management across overlays
- Animation timing and curves

## Tech Decisions

After completing this spec, update `.aasef/context/tech_decisions.md`:

```markdown
### Sidebar Overlay (Spec 020)

| Decision | Value | Rationale |
|----------|-------|-----------|
| Overlay Technique | Separate WebContentsView | Only way to render above browser |
| Z-Order | Browser=0, Sidebar=1 | Sidebar floats above browser |
| Animation | Bounds-based slide | Smooth, no CSS required |
| State Sync | IPC with full payload | Simple, reliable |
| Build | Multi-entry Vite | Separate entry for overlay |
```
