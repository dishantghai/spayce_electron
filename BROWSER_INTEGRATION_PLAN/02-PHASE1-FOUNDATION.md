# Phase 1: Browser Foundation

> **Specs**: 017, 018, 019
> **Goal**: Establish core browser infrastructure with single-tab prototype
> **Estimated Sessions**: 3-4 Claude Opus 4.5 sessions

---

## Phase Overview

Phase 1 establishes the foundational browser infrastructure in the Electron main process. By the end of this phase, we'll have a working single-tab browser that can load URLs and navigate pages.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 1 DELIVERABLES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 017: WebContentsView Service                 │    │
│  │                                                                      │    │
│  │  packages/desktop/src/main/services/BrowserService.ts               │    │
│  │  - Create/manage WebContentsView instances                          │    │
│  │  - Bounds calculation and positioning                               │    │
│  │  - Navigation control (loadURL, back, forward, reload)              │    │
│  │  - Event forwarding to renderer                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 018: Tab Domain Layer                        │    │
│  │                                                                      │    │
│  │  packages/core/src/domain/entities/TabEntity.ts                     │    │
│  │  packages/core/src/domain/repositories/ITabsRepository.ts           │    │
│  │  packages/core/src/application/use-cases/tabs/                      │    │
│  │  - Tab entity with readonly properties                              │    │
│  │  - Repository interface for persistence                             │    │
│  │  - Basic use cases (Create, Get, Delete)                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 019: Single Tab Browser MVP                  │    │
│  │                                                                      │    │
│  │  packages/react-ui/src/components/browser/BrowserView.tsx           │    │
│  │  packages/desktop/src/main/ipc/browserHandlers.ts                   │    │
│  │  packages/desktop/src/preload/index.ts (extend)                     │    │
│  │  - Basic browser area component                                     │    │
│  │  - IPC handlers for browser operations                              │    │
│  │  - Loading state and progress indicator                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 017: Browser Foundation - WebContentsView Service

### Overview

Create the core browser management service in Electron's main process using the modern WebContentsView API (Electron 30+). This service handles creating, positioning, and controlling browser views.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Create WebContentsView instances with secure defaults | P0 |
| FR-2 | Calculate and set view bounds based on layout | P0 |
| FR-3 | Navigate to URLs with validation | P0 |
| FR-4 | Support back/forward/reload/stop navigation | P0 |
| FR-5 | Forward page events to renderer (title, URL, loading) | P0 |
| FR-6 | Handle WebContentsView lifecycle (create/destroy) | P0 |
| FR-7 | Support view visibility toggling | P1 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Secure web preferences (context isolation, no node integration) | P0 |
| NFR-2 | Memory-efficient view management | P1 |
| NFR-3 | <100ms response for navigation commands | P1 |

### Technical Design

#### File Structure

```
packages/desktop/src/main/
├── services/
│   └── BrowserService.ts          # NEW: WebContentsView management
├── ipc/
│   ├── handlers.ts                # Existing handlers
│   └── browserHandlers.ts         # NEW: Browser-specific handlers
└── index.ts                       # Register browser handlers
```

#### BrowserService Interface

```typescript
// packages/desktop/src/main/services/BrowserService.ts

import { BrowserWindow, WebContentsView } from 'electron';

export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BrowserViewState {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  loadingProgress: number;
  canGoBack: boolean;
  canGoForward: boolean;
}

export class BrowserService {
  private views: Map<string, WebContentsView> = new Map();
  private activeViewId: string | null = null;
  private mainWindow: BrowserWindow | null = null;

  /**
   * Initialize the browser service with the main window
   */
  initialize(mainWindow: BrowserWindow): void;

  /**
   * Create a new WebContentsView
   * @returns The view ID
   */
  createView(id: string, url?: string): string;

  /**
   * Get a view by ID
   */
  getView(id: string): WebContentsView | undefined;

  /**
   * Destroy a view
   */
  destroyView(id: string): void;

  /**
   * Set the active view (shown in the browser area)
   */
  setActiveView(id: string): void;

  /**
   * Update view bounds
   */
  setBounds(bounds: ViewBounds): void;

  /**
   * Navigate to URL
   */
  loadURL(id: string, url: string): Promise<void>;

  /**
   * Navigation controls
   */
  goBack(id: string): Promise<void>;
  goForward(id: string): Promise<void>;
  reload(id: string): Promise<void>;
  stop(id: string): Promise<void>;

  /**
   * Get current state of a view
   */
  getViewState(id: string): BrowserViewState | null;

  /**
   * Set visibility of view
   */
  setViewVisibility(id: string, visible: boolean): void;
}
```

#### Secure WebContentsView Configuration

```typescript
// In BrowserService.createView()

const view = new WebContentsView({
  webPreferences: {
    // Security settings (same as Flutter browser_screen.dart)
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    
    // No preload for browser views - fully isolated
    preload: undefined,
    
    // Web standards
    javascript: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    
    // Storage
    domStorageEnabled: true,
    databaseEnabled: true,
    
    // Media
    autoplayPolicy: 'user-gesture-required',
  },
});

// Set user agent (Safari for macOS compatibility)
view.webContents.setUserAgent(
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
);
```

#### Event Forwarding

```typescript
// Forward events to renderer process

view.webContents.on('did-start-loading', () => {
  this.mainWindow?.webContents.send('browser:loading', {
    viewId: id,
    isLoading: true,
  });
});

view.webContents.on('did-stop-loading', () => {
  this.mainWindow?.webContents.send('browser:loading', {
    viewId: id,
    isLoading: false,
  });
});

view.webContents.on('did-navigate', (_, url) => {
  this.mainWindow?.webContents.send('browser:navigated', {
    viewId: id,
    url,
    canGoBack: view.webContents.canGoBack(),
    canGoForward: view.webContents.canGoForward(),
  });
});

view.webContents.on('page-title-updated', (_, title) => {
  this.mainWindow?.webContents.send('browser:title', {
    viewId: id,
    title,
  });
});

view.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
  this.mainWindow?.webContents.send('browser:error', {
    viewId: id,
    errorCode,
    errorDescription,
  });
});
```

### Implementation Steps

1. **Create BrowserService class** with view management methods
2. **Add secure WebContentsView configuration** based on Flutter settings
3. **Implement bounds calculation** for sidebar + browser layout
4. **Set up event forwarding** from WebContentsView to renderer
5. **Add IPC handlers** in browserHandlers.ts
6. **Register handlers** in main process initialization
7. **Write unit tests** for BrowserService

### Acceptance Criteria

- [ ] Can create a WebContentsView instance
- [ ] View loads URLs correctly
- [ ] Navigation controls (back/forward/reload) work
- [ ] Events forwarded to renderer process
- [ ] View bounds update when window resizes
- [ ] Secure web preferences applied
- [ ] Memory properly cleaned up on view destroy

### Dependencies

- **Depends on**: None (foundation spec)
- **Blocks**: Specs 018, 019, 020

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/browser_screen.dart`

Key settings to replicate:
- Lines 204-298: InAppWebViewSettings configuration
- Lines 300-324: Event handlers setup
- Lines 454-484: URL scheme handling

---

## Spec 018: Browser Domain Layer - Tab Entities

### Overview

Create the domain layer for browser tabs following Clean Architecture principles. This includes tab entities, repository interfaces, and basic use cases.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Define immutable TabEntity with all properties | P0 |
| FR-2 | Define ITabsRepository interface | P0 |
| FR-3 | Create basic tab use cases (Create, Get, Delete) | P0 |
| FR-4 | Support origin tracking (Space item reference) | P1 |
| FR-5 | Support URL tracking state | P1 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Zero dependencies in domain layer | P0 |
| NFR-2 | All properties readonly | P0 |
| NFR-3 | Date fields use Date type, not strings | P0 |

### Technical Design

#### File Structure

```
packages/core/src/
├── domain/
│   ├── entities/
│   │   ├── TabEntity.ts           # NEW
│   │   └── index.ts               # Update barrel
│   ├── repositories/
│   │   ├── ITabsRepository.ts     # NEW
│   │   └── index.ts               # Update barrel
│   └── index.ts                   # Update barrel
├── application/
│   ├── use-cases/
│   │   ├── tabs/                  # NEW directory
│   │   │   ├── CreateTabUseCase.ts
│   │   │   ├── GetTabsUseCase.ts
│   │   │   ├── DeleteTabUseCase.ts
│   │   │   ├── UpdateTabUseCase.ts
│   │   │   └── index.ts
│   │   └── index.ts               # Update barrel
│   └── facades/
│       ├── TabsFacade.ts          # NEW
│       └── index.ts               # Update barrel
└── index.ts                       # Update barrel
```

#### TabEntity Definition

```typescript
// packages/core/src/domain/entities/TabEntity.ts

/**
 * Tab content types
 */
export type TabType = 'web' | 'note' | 'localFile';

/**
 * Browser tab entity - immutable
 * Based on Flutter tab_model.dart
 */
export interface TabEntity {
  readonly id: string;
  readonly tabType: TabType;
  readonly url: string;
  readonly title: string;
  readonly faviconUrl: string | null;
  
  // Origin tracking for Spaces integration
  readonly originSpaceId: string | null;
  readonly originSpaceItemId: string | null;
  readonly isTracked: boolean;  // False if navigated away from origin URL
  
  // State
  readonly isActive: boolean;
  readonly isLoading: boolean;
  readonly loadingProgress: number;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  
  // Position
  readonly position: number;
  
  // Timestamps
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastAccessedAt: Date | null;
}

/**
 * Input for creating a new tab
 */
export interface CreateTabInput {
  url?: string;
  title?: string;
  tabType?: TabType;
  originSpaceId?: string | null;
  originSpaceItemId?: string | null;
  faviconUrl?: string | null;
}

/**
 * Input for updating a tab
 */
export interface UpdateTabInput {
  id: string;
  url?: string;
  title?: string;
  faviconUrl?: string | null;
  isTracked?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  loadingProgress?: number;
  canGoBack?: boolean;
  canGoForward?: boolean;
  position?: number;
  lastAccessedAt?: Date | null;
}
```

#### ITabsRepository Interface

```typescript
// packages/core/src/domain/repositories/ITabsRepository.ts

import type { TabEntity, CreateTabInput, UpdateTabInput } from '../entities/TabEntity';

export interface ITabsRepository {
  /**
   * Get all tabs ordered by position
   */
  getAll(): Promise<TabEntity[]>;

  /**
   * Get a tab by ID
   */
  getById(id: string): Promise<TabEntity | null>;

  /**
   * Get the active tab
   */
  getActive(): Promise<TabEntity | null>;

  /**
   * Get tab by Space item ID (for duplicate detection)
   */
  getBySpaceItemId(spaceItemId: string): Promise<TabEntity | null>;

  /**
   * Get tab by URL (for duplicate detection)
   */
  getByUrl(url: string): Promise<TabEntity | null>;

  /**
   * Create a new tab
   */
  create(input: CreateTabInput): Promise<TabEntity>;

  /**
   * Update a tab
   */
  update(input: UpdateTabInput): Promise<TabEntity>;

  /**
   * Delete a tab
   */
  delete(id: string): Promise<void>;

  /**
   * Set active tab (deactivates all others)
   */
  setActive(id: string): Promise<void>;

  /**
   * Reorder tabs
   */
  reorder(orderedIds: string[]): Promise<void>;

  /**
   * Get tab count
   */
  count(): Promise<number>;

  /**
   * Delete oldest inactive tab (for tab limit)
   */
  deleteOldestInactive(): Promise<void>;
}
```

#### TabsFacade

```typescript
// packages/core/src/application/facades/TabsFacade.ts

import type { Result } from '../common/Result';
import type { TabEntity, CreateTabInput, UpdateTabInput } from '../../domain/entities/TabEntity';
import type { ITabsRepository } from '../../domain/repositories/ITabsRepository';

export class TabsFacade {
  private readonly MAX_TABS = 20;

  constructor(private readonly tabsRepository: ITabsRepository) {}

  async getTabs(): Promise<Result<TabEntity[], Error>> {
    try {
      const tabs = await this.tabsRepository.getAll();
      return { ok: true, value: tabs };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  async getActiveTab(): Promise<Result<TabEntity | null, Error>> {
    try {
      const tab = await this.tabsRepository.getActive();
      return { ok: true, value: tab };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  async createTab(input: CreateTabInput): Promise<Result<TabEntity, Error>> {
    try {
      // Check tab limit
      const count = await this.tabsRepository.count();
      if (count >= this.MAX_TABS) {
        await this.tabsRepository.deleteOldestInactive();
      }

      // Check for duplicate by Space item
      if (input.originSpaceItemId) {
        const existing = await this.tabsRepository.getBySpaceItemId(input.originSpaceItemId);
        if (existing) {
          await this.tabsRepository.setActive(existing.id);
          return { ok: true, value: existing };
        }
      }

      // Check for duplicate by URL
      if (input.url) {
        const existing = await this.tabsRepository.getByUrl(input.url);
        if (existing) {
          await this.tabsRepository.setActive(existing.id);
          return { ok: true, value: existing };
        }
      }

      const tab = await this.tabsRepository.create(input);
      return { ok: true, value: tab };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  async switchTab(tabId: string): Promise<Result<void, Error>> {
    try {
      await this.tabsRepository.setActive(tabId);
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  async closeTab(tabId: string): Promise<Result<void, Error>> {
    try {
      await this.tabsRepository.delete(tabId);
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  async updateTab(input: UpdateTabInput): Promise<Result<TabEntity, Error>> {
    try {
      const tab = await this.tabsRepository.update(input);
      return { ok: true, value: tab };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }
}
```

### Implementation Steps

1. **Create TabEntity** interface with all properties
2. **Create ITabsRepository** interface
3. **Create CreateTabUseCase** with validation
4. **Create GetTabsUseCase** and GetActiveTabUseCase
5. **Create DeleteTabUseCase** with adjacent tab activation
6. **Create UpdateTabUseCase** for state updates
7. **Create TabsFacade** as the application layer API
8. **Update barrel exports** in all index.ts files
9. **Write unit tests** for entities and use cases

### Acceptance Criteria

- [ ] TabEntity interface defined with all required properties
- [ ] All properties are readonly
- [ ] ITabsRepository interface covers all operations
- [ ] TabsFacade provides clean API
- [ ] Tab limit enforcement (max 20 tabs)
- [ ] Duplicate detection by Space item ID
- [ ] Duplicate detection by URL
- [ ] All exports available from @spayce/core

### Dependencies

- **Depends on**: Spec 017 (conceptual dependency for state alignment)
- **Blocks**: Specs 019, 020, 021

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/domain/tab_model.dart`

Key patterns to replicate:
- Lines 4-8: TabType enum
- Lines 12-54: BrowserTab class properties
- Lines 56-82: Factory constructors
- Lines 99-116: URL normalization for comparison

---

## Spec 019: Single Tab Browser - MVP Prototype

### Overview

Create a minimal viable browser integration that displays a single tab. This proves the architecture works before adding multi-tab complexity.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Display browser content in designated area | P0 |
| FR-2 | Load URLs via IPC from renderer | P0 |
| FR-3 | Show loading progress indicator | P0 |
| FR-4 | Display current page title and URL | P0 |
| FR-5 | Basic navigation (back/forward/reload) | P0 |
| FR-6 | Integrate with existing sidebar layout | P0 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Browser area respects sidebar width | P0 |
| NFR-2 | Smooth loading indicator | P1 |
| NFR-3 | <1s initial page load start | P1 |

### Technical Design

#### File Structure

```
packages/desktop/src/
├── main/
│   ├── ipc/
│   │   └── browserHandlers.ts     # Browser IPC handlers
│   └── services/
│       └── BrowserService.ts      # From Spec 017
├── preload/
│   └── index.ts                   # Extend with browser API
└── renderer/
    └── App.tsx                    # Integrate browser area

packages/react-ui/src/
├── components/
│   └── browser/                   # NEW directory
│       ├── BrowserArea.tsx        # Container for browser view
│       ├── BrowserArea.module.css
│       ├── BrowserLoadingBar.tsx  # Loading progress
│       └── index.ts               # Barrel export
└── stores/
    └── browserUiStore.ts          # NEW: Browser UI state
```

#### Browser IPC Handlers

```typescript
// packages/desktop/src/main/ipc/browserHandlers.ts

import { ipcMain, BrowserWindow } from 'electron';
import { BrowserService } from '../services/BrowserService';

let browserService: BrowserService;

export function registerBrowserHandlers(mainWindow: BrowserWindow): void {
  browserService = new BrowserService();
  browserService.initialize(mainWindow);

  // Create a view
  ipcMain.handle('browser:createView', async (_, id: string, url?: string) => {
    return browserService.createView(id, url);
  });

  // Destroy a view
  ipcMain.handle('browser:destroyView', async (_, id: string) => {
    browserService.destroyView(id);
  });

  // Set active view
  ipcMain.handle('browser:setActiveView', async (_, id: string) => {
    browserService.setActiveView(id);
  });

  // Update bounds
  ipcMain.handle('browser:setBounds', async (_, bounds: ViewBounds) => {
    browserService.setBounds(bounds);
  });

  // Navigate
  ipcMain.handle('browser:loadURL', async (_, id: string, url: string) => {
    await browserService.loadURL(id, url);
  });

  ipcMain.handle('browser:goBack', async (_, id: string) => {
    await browserService.goBack(id);
  });

  ipcMain.handle('browser:goForward', async (_, id: string) => {
    await browserService.goForward(id);
  });

  ipcMain.handle('browser:reload', async (_, id: string) => {
    await browserService.reload(id);
  });

  ipcMain.handle('browser:stop', async (_, id: string) => {
    await browserService.stop(id);
  });

  // Get view state
  ipcMain.handle('browser:getViewState', async (_, id: string) => {
    return browserService.getViewState(id);
  });
}
```

#### Preload API Extension

```typescript
// packages/desktop/src/preload/index.ts (additions)

const electronAPI = {
  // ... existing APIs ...

  browser: {
    createView: (id: string, url?: string) => 
      ipcRenderer.invoke('browser:createView', id, url),
    destroyView: (id: string) => 
      ipcRenderer.invoke('browser:destroyView', id),
    setActiveView: (id: string) => 
      ipcRenderer.invoke('browser:setActiveView', id),
    setBounds: (bounds: ViewBounds) => 
      ipcRenderer.invoke('browser:setBounds', bounds),
    loadURL: (id: string, url: string) => 
      ipcRenderer.invoke('browser:loadURL', id, url),
    goBack: (id: string) => 
      ipcRenderer.invoke('browser:goBack', id),
    goForward: (id: string) => 
      ipcRenderer.invoke('browser:goForward', id),
    reload: (id: string) => 
      ipcRenderer.invoke('browser:reload', id),
    stop: (id: string) => 
      ipcRenderer.invoke('browser:stop', id),
    getViewState: (id: string) => 
      ipcRenderer.invoke('browser:getViewState', id),
    
    // Event listeners
    onLoading: (callback: (data: { viewId: string; isLoading: boolean }) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on('browser:loading', handler);
      return () => ipcRenderer.removeListener('browser:loading', handler);
    },
    onNavigated: (callback: (data: { viewId: string; url: string; canGoBack: boolean; canGoForward: boolean }) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on('browser:navigated', handler);
      return () => ipcRenderer.removeListener('browser:navigated', handler);
    },
    onTitle: (callback: (data: { viewId: string; title: string }) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on('browser:title', handler);
      return () => ipcRenderer.removeListener('browser:title', handler);
    },
    onProgress: (callback: (data: { viewId: string; progress: number }) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on('browser:progress', handler);
      return () => ipcRenderer.removeListener('browser:progress', handler);
    },
    onError: (callback: (data: { viewId: string; errorCode: number; errorDescription: string }) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on('browser:error', handler);
      return () => ipcRenderer.removeListener('browser:error', handler);
    },
  },
};
```

#### BrowserArea Component

```typescript
// packages/react-ui/src/components/browser/BrowserArea.tsx

import { useEffect, useRef, useCallback } from 'react';
import { useBrowserStore } from '../../stores/browserUiStore';
import { BrowserLoadingBar } from './BrowserLoadingBar';
import styles from './BrowserArea.module.css';

interface BrowserAreaProps {
  sidebarWidth: number;
  topOffset: number;  // Height of tab bar + nav bar
}

export function BrowserArea({ sidebarWidth, topOffset }: BrowserAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeViewId, isLoading, loadingProgress, createView } = useBrowserStore();

  // Calculate and send bounds to main process
  const updateBounds = useCallback(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    window.electronAPI.browser.setBounds({
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }, []);

  // Update bounds on mount and resize
  useEffect(() => {
    updateBounds();
    
    const handleResize = () => updateBounds();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [updateBounds, sidebarWidth, topOffset]);

  // Create initial view if none exists
  useEffect(() => {
    if (!activeViewId) {
      createView('https://www.google.com');
    }
  }, [activeViewId, createView]);

  return (
    <div 
      ref={containerRef} 
      className={styles.browserArea}
      style={{
        left: sidebarWidth,
        top: topOffset,
        right: 0,
        bottom: 0,
      }}
    >
      {isLoading && <BrowserLoadingBar progress={loadingProgress} />}
      {/* WebContentsView is positioned by main process, not rendered here */}
      <div className={styles.placeholder}>
        {!activeViewId && <span>Loading browser...</span>}
      </div>
    </div>
  );
}
```

#### Browser UI Store

```typescript
// packages/react-ui/src/stores/browserUiStore.ts

import { create } from 'zustand';

interface BrowserViewState {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  loadingProgress: number;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface BrowserUiState {
  activeViewId: string | null;
  views: Map<string, BrowserViewState>;
  isLoading: boolean;
  loadingProgress: number;
  
  // Actions
  createView: (url?: string) => Promise<string>;
  destroyView: (id: string) => Promise<void>;
  setActiveView: (id: string) => Promise<void>;
  loadURL: (url: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  reload: () => Promise<void>;
  stop: () => Promise<void>;
  
  // State updates (called from IPC events)
  updateViewState: (id: string, state: Partial<BrowserViewState>) => void;
  setLoading: (isLoading: boolean, progress?: number) => void;
}

export const useBrowserStore = create<BrowserUiState>((set, get) => ({
  activeViewId: null,
  views: new Map(),
  isLoading: false,
  loadingProgress: 0,

  createView: async (url = 'https://www.google.com') => {
    const id = crypto.randomUUID();
    await window.electronAPI.browser.createView(id, url);
    
    set((state) => ({
      activeViewId: id,
      views: new Map(state.views).set(id, {
        id,
        url,
        title: 'Loading...',
        isLoading: true,
        loadingProgress: 0,
        canGoBack: false,
        canGoForward: false,
      }),
    }));
    
    return id;
  },

  destroyView: async (id) => {
    await window.electronAPI.browser.destroyView(id);
    
    set((state) => {
      const views = new Map(state.views);
      views.delete(id);
      return {
        views,
        activeViewId: state.activeViewId === id ? null : state.activeViewId,
      };
    });
  },

  setActiveView: async (id) => {
    await window.electronAPI.browser.setActiveView(id);
    set({ activeViewId: id });
  },

  loadURL: async (url) => {
    const { activeViewId } = get();
    if (!activeViewId) return;
    await window.electronAPI.browser.loadURL(activeViewId, url);
  },

  goBack: async () => {
    const { activeViewId } = get();
    if (!activeViewId) return;
    await window.electronAPI.browser.goBack(activeViewId);
  },

  goForward: async () => {
    const { activeViewId } = get();
    if (!activeViewId) return;
    await window.electronAPI.browser.goForward(activeViewId);
  },

  reload: async () => {
    const { activeViewId } = get();
    if (!activeViewId) return;
    await window.electronAPI.browser.reload(activeViewId);
  },

  stop: async () => {
    const { activeViewId } = get();
    if (!activeViewId) return;
    await window.electronAPI.browser.stop(activeViewId);
  },

  updateViewState: (id, state) => {
    set((prev) => {
      const views = new Map(prev.views);
      const existing = views.get(id);
      if (existing) {
        views.set(id, { ...existing, ...state });
      }
      return { views };
    });
  },

  setLoading: (isLoading, progress = 0) => {
    set({ isLoading, loadingProgress: progress });
  },
}));

// Subscribe to IPC events
if (typeof window !== 'undefined' && window.electronAPI?.browser) {
  window.electronAPI.browser.onLoading(({ viewId, isLoading }) => {
    useBrowserStore.getState().updateViewState(viewId, { isLoading });
    if (viewId === useBrowserStore.getState().activeViewId) {
      useBrowserStore.getState().setLoading(isLoading);
    }
  });

  window.electronAPI.browser.onNavigated(({ viewId, url, canGoBack, canGoForward }) => {
    useBrowserStore.getState().updateViewState(viewId, { url, canGoBack, canGoForward });
  });

  window.electronAPI.browser.onTitle(({ viewId, title }) => {
    useBrowserStore.getState().updateViewState(viewId, { title });
  });

  window.electronAPI.browser.onProgress(({ viewId, progress }) => {
    useBrowserStore.getState().updateViewState(viewId, { loadingProgress: progress });
    if (viewId === useBrowserStore.getState().activeViewId) {
      useBrowserStore.getState().setLoading(true, progress);
    }
  });
}
```

### Implementation Steps

1. **Create browserHandlers.ts** with IPC handlers
2. **Extend preload/index.ts** with browser API
3. **Create BrowserArea component** for view container
4. **Create BrowserLoadingBar component** for progress
5. **Create browserUiStore** for UI state
6. **Set up IPC event subscriptions** in store
7. **Integrate BrowserArea** into App.tsx layout
8. **Test single-tab browsing** end-to-end
9. **Write integration tests**

### Acceptance Criteria

- [ ] Browser view displays in the app window
- [ ] Can load any URL via IPC
- [ ] Loading progress shown during page load
- [ ] Page title updates in UI
- [ ] Browser view resizes with window
- [ ] Browser view respects sidebar width
- [ ] Navigation buttons work (back/forward/reload)
- [ ] No console errors during normal operation

### Dependencies

- **Depends on**: Spec 017 (BrowserService), Spec 018 (domain layer)
- **Blocks**: Specs 020-031 (all multi-tab and advanced features)

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/browser_screen.dart`

Key patterns:
- Lines 82-186: Build method layout structure
- Lines 143-152: Loading indicator integration
- Lines 188-536: WebView configuration and event handling

### HiFi Design Reference

> **For Pixel-Perfect UI Implementation:**
>
> | Design | File Path |
> |--------|----------|
> | Browser View (Overall Layout) | `project_ops/HIFI_UI_DESIGN_SCREENS/Browser View.png` |
>
> **Key UI Elements to Match:**
> - Browser area background color: `--color-bg-dark` (#0F0B1A)
> - Browser area sizing relative to sidebar
> - Loading progress bar: top positioning, 2-3px height, primary color
> - Integration with existing sidebar layout (respect sidebar width)

---

## Phase 1 Summary

### Files Created/Modified

| Package | File | Action |
|---------|------|--------|
| desktop | `src/main/services/BrowserService.ts` | Create |
| desktop | `src/main/ipc/browserHandlers.ts` | Create |
| desktop | `src/main/index.ts` | Modify (register handlers) |
| desktop | `src/preload/index.ts` | Modify (add browser API) |
| core | `src/domain/entities/TabEntity.ts` | Create |
| core | `src/domain/repositories/ITabsRepository.ts` | Create |
| core | `src/application/use-cases/tabs/*.ts` | Create |
| core | `src/application/facades/TabsFacade.ts` | Create |
| react-ui | `src/components/browser/BrowserArea.tsx` | Create |
| react-ui | `src/components/browser/BrowserLoadingBar.tsx` | Create |
| react-ui | `src/stores/browserUiStore.ts` | Create |

### Phase 1 Completion Checklist

- [ ] Spec 017: WebContentsView Service complete
- [ ] Spec 018: Tab Domain Layer complete
- [ ] Spec 019: Single Tab MVP complete
- [ ] All unit tests passing
- [ ] Single tab loads and navigates URLs
- [ ] Loading progress displays correctly
- [ ] Browser area resizes properly

### Next Phase

Proceed to **Phase 2: Multi-Tab** (Specs 020-022) to add tab bar UI and multi-tab management.
