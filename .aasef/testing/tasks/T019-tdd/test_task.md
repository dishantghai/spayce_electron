# TDD Test Task: Spec 019 - 019

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

# Spec 019: Single Tab Browser - MVP Prototype

## Overview

Create a minimal viable browser integration that displays a single tab within the Spayce application. This spec integrates the BrowserService (Spec 017) with the React UI layer, establishing the full vertical slice from user interaction to browser view rendering. By the end of this spec, users can load URLs and browse the web within the application.

> **CRITICAL**: This is the first user-visible browser feature. It must work flawlessly as it validates the entire browser architecture before adding multi-tab complexity.

## Dependencies & Scope Coordination

**Dependencies:**
- **Spec 017**: BrowserService (WebContentsView management, IPC handlers)
- **Spec 018**: Tab domain layer (TabEntity, facade - for state modeling)
- **Spec 010**: React UI integration (hooks patterns, error boundaries)
- **Spec 002**: Sidebar navigation (layout integration)

**Integration Points:**
- Extends preload/index.ts with browser API
- Integrates with existing sidebar layout (respects sidebar width)
- Uses design tokens from @spayce/react-ui/theme
- Follows existing component patterns (CSS Modules)

**This Spec Covers:**
- Preload API extension for browser operations
- BrowserArea React component (container for WebContentsView)
- BrowserLoadingBar component (loading progress indicator)
- browserUiStore (Zustand store for browser UI state)
- IPC event subscriptions for state synchronization
- Layout integration with sidebar
- Basic error handling UI

**Out of Scope:**
- Tab bar UI (Spec 020)
- Navigation bar UI (Spec 021)
- Multi-tab support (Spec 020)
- Tab persistence (infrastructure spec)
- Address bar (Spec 021)

### Related Documents

| Document | Purpose |
|----------|---------|
| [plan.md](./plan.md) | Implementation phases and timeline |
| [status.json](./status.json) | Metadata, dependencies, and tracking |
| [accessibility-review.md](./accessibility-review.md) | WCAG compliance, ARIA requirements |
| [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) | Step-by-step implementation instructions |

### References
- **HiFi Design**: `project_ops/HIFI_UI_DESIGN_SCREENS/Browser View.png`
- **Flutter Reference**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/`

> **For Implementation**: Follow plan.md phases. Consult accessibility-review.md when building UI components.

## User Stories

### US-019-001: View Browser Content
- **As a user**, I want to see web content displayed in my application so that I can browse the web alongside my Spaces
- **Acceptance Criteria:**
  - Given I launch the application
  - When the browser area is visible
  - Then I see a web page loaded (default: google.com)
  - And the browser fills the area beside the sidebar
  - And the browser respects the sidebar width

### US-019-002: See Loading Progress
- **As a user**, I want to see loading progress so that I know a page is loading
- **Acceptance Criteria:**
  - Given a page is loading
  - When loading is in progress
  - Then I see a thin progress bar at the top of the browser area
  - And the progress bar animates smoothly
  - And the progress bar disappears when loading completes

### US-019-003: Resize with Window
- **As a user**, I want the browser to resize with the window so that content is always properly sized
- **Acceptance Criteria:**
  - Given I resize the application window
  - When the window dimensions change
  - Then the browser area resizes accordingly
  - And there is no visual tearing or delay
  - And the browser maintains proper aspect ratio

### US-019-004: Navigate via IPC
- **As a developer**, I want to trigger navigation from the renderer so that future UI can control the browser
- **Acceptance Criteria:**
  - Given I call window.electronAPI.browser.loadURL(id, url)
  - When the URL is valid
  - Then the browser navigates to that URL
  - And navigation events are received in the UI

### US-019-005: Handle Errors Gracefully
- **As a user**, I want to see meaningful error messages when pages fail to load so that I understand what went wrong
- **Acceptance Criteria:**
  - Given a page fails to load
  - When an error occurs
  - Then I see an error indicator
  - And the error message is user-friendly
  - And I can attempt to retry or navigate elsewhere

## MVP Scope

### Included:
- Preload API extension (browser object with all methods)
- Type definitions for window.electronAPI.browser
- BrowserArea component (container with bounds calculation)
- BrowserLoadingBar component (animated progress)
- browserUiStore (Zustand store for UI state)
- IPC event subscriptions (loading, navigated, title, error)
- Layout integration (sidebar offset)
- CSS Modules styling with design tokens
- Basic error state display

### Excluded:
- Tab bar (Spec 020)
- Navigation bar (Spec 021)
- Multiple tabs
- Address input
- Forward/back buttons (UI - functionality exists in BrowserService)

## Requirements

### R1: Preload API Extension

#### 1.1 Browser API Type Definitions

```typescript
// packages/desktop/src/preload/types.ts

import type { ViewBounds, BrowserViewState, CreateViewOptions } from '../types/browser';

/**
 * Browser API exposed to renderer via contextBridge
 */
export interface BrowserAPI {
  // View management
  createView: (id: string, options?: CreateViewOptions) => Promise<{ success: boolean; viewId?: string; error?: string }>;
  destroyView: (id: string) => Promise<{ success: boolean; error?: string }>;
  setActiveView: (id: string) => Promise<{ success: boolean; error?: string }>;
  getActiveViewId: () => Promise<{ success: boolean; viewId: string | null }>;
  
  // Bounds
  setBounds: (bounds: ViewBounds) => Promise<{ success: boolean; error?: string }>;
  
  // Navigation
  loadURL: (id: string, url: string) => Promise<{ success: boolean; error?: string }>;
  goBack: (id: string) => Promise<{ success: boolean; error?: string }>;
  goForward: (id: string) => Promise<{ success: boolean; error?: string }>;
  reload: (id: string) => Promise<{ success: boolean; error?: string }>;
  stop: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // State
  getViewState: (id: string) => Promise<{ success: boolean; state?: BrowserViewState; error?: string }>;
  setVisibility: (id: string, visible: boolean) => Promise<{ success: boolean; error?: string }>;
  getViewCount: () => Promise<{ success: boolean; count?: number }>;
  
  // Event listeners (return unsubscribe function)
  onLoading: (callback: (data: BrowserLoadingEvent) => void) => () => void;
  onNavigated: (callback: (data: BrowserNavigatedEvent) => void) => () => void;
  onTitle: (callback: (data: BrowserTitleEvent) => void) => () => void;
  onFavicon: (callback: (data: BrowserFaviconEvent) => void) => () => void;
  onProgress: (callback: (data: BrowserProgressEvent) => void) => () => void;
  onError: (callback: (data: BrowserErrorEvent) => void) => () => void;
}

/**
 * Event payload types
 */
export interface BrowserLoadingEvent {
  viewId: string;
  isLoading: boolean;
}

export interface BrowserNavigatedEvent {
  viewId: string;
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isSecure: boolean;
}

export interface BrowserTitleEvent {
  viewId: string;
  title: string;
}

export interface BrowserFaviconEvent {
  viewId: string;
  faviconUrl: string | null;
}

export interface BrowserProgressEvent {
  viewId: string;
  progress: number;
}

export interface BrowserErrorEvent {
  viewId: string;
  errorCode: number;
  errorDescription: string;
  failedUrl: string;
}

/**
 * Extended ElectronAPI with browser support
 */
export interface ElectronAPI {
  // ... existing APIs ...
  browser: BrowserAPI;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

#### 1.2 Preload Implementation

```typescript
// packages/desktop/src/preload/index.ts (additions)

import { contextBridge, ipcRenderer } from 'electron';
import type { ViewBounds, CreateViewOptions } from '../types/browser';

// Browser API
const browserAPI = {
  // View management
  createView: (id: string, options?: CreateViewOptions) =>
    ipcRenderer.invoke('browser:createView', id, options),
  destroyView: (id: string) =>
    ipcRenderer.invoke('browser:destroyView', id),
  setActiveView: (id: string) =>
    ipcRenderer.invoke('browser:setActiveView', id),
  getActiveViewId: () =>
    ipcRenderer.invoke('browser:getActiveViewId'),

  // Bounds
  setBounds: (bounds: ViewBounds) =>
    ipcRenderer.invoke('browser:setBounds', bounds),

  // Navigation
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

  // State
  getViewState: (id: string) =>
    ipcRenderer.invoke('browser:getViewState', id),
  setVisibility: (id: string, visible: boolean) =>
    ipcRenderer.invoke('browser:setVisibility', id, visible),
  getViewCount: () =>
    ipcRenderer.invoke('browser:getViewCount'),

  // Event listeners
  onLoading: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('browser:loading', handler);
    return () => ipcRenderer.removeListener('browser:loading', handler);
  },
  onNavigated: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('browser:navigated', handler);
    return () => ipcRenderer.removeListener('browser:navigated', handler);
  },
  onTitle: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('browser:title', handler);
    return () => ipcRenderer.removeListener('browser:title', handler);
  },
  onFavicon: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('browser:favicon', handler);
    return () => ipcRenderer.removeListener('browser:favicon', handler);
  },
  onProgress: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('browser:progress', handler);
    return () => ipcRenderer.removeListener('browser:progress', handler);
  },
  onError: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('browser:error', handler);
    return () => ipcRenderer.removeListener('browser:error', handler);
  },
};

// Expose to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs ...
  browser: browserAPI,
});
```

---

### R2: Browser UI Store

#### 2.1 Zustand Store

```typescript
// packages/react-ui/src/stores/browserUiStore.ts

import { create } from 'zustand';

/**
 * Browser view state for UI
 */
export interface BrowserViewUiState {
  id: string;
  url: string;
  title: string;
  faviconUrl: string | null;
  isLoading: boolean;
  loadingProgress: number;
  canGoBack: boolean;
  canGoForward: boolean;
  isSecure: boolean;
  errorCode: number | null;
  errorDescription: string | null;
}

/**
 * Browser UI store state
 */
interface BrowserUiState {
  // State
  activeViewId: string | null;
  views: Map<string, BrowserViewUiState>;
  isInitialized: boolean;
  initError: string | null;
  
  // Computed getters
  activeView: BrowserViewUiState | null;
  isLoading: boolean;
  loadingProgress: number;
  
  // Actions
  initialize: () => Promise<void>;
  createView: (url?: string) => Promise<string | null>;
  destroyView: (id: string) => Promise<void>;
  setActiveView: (id: string) => Promise<void>;
  loadURL: (url: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  reload: () => Promise<void>;
  stop: () => Promise<void>;
  updateBounds: (bounds: { x: number; y: number; width: number; height: number }) => void;
  
  // State updates (called from IPC events)
  handleLoadingEvent: (viewId: string, isLoading: boolean) => void;
  handleNavigatedEvent: (viewId: string, url: string, canGoBack: boolean, canGoForward: boolean, isSecure: boolean) => void;
  handleTitleEvent: (viewId: string, title: string) => void;
  handleFaviconEvent: (viewId: string, faviconUrl: string | null) => void;
  handleProgressEvent: (viewId: string, progress: number) => void;
  handleErrorEvent: (viewId: string, errorCode: number, errorDescription: string) => void;
  clearError: (viewId: string) => void;
}

/**
 * Create default view state
 */
function createDefaultViewState(id: string, url: string = 'https://www.google.com'): BrowserViewUiState {
  return {
    id,
    url,
    title: 'New Tab',
    faviconUrl: null,
    isLoading: true,
    loadingProgress: 0,
    canGoBack: false,
    canGoForward: false,
    isSecure: url.startsWith('https://'),
    errorCode: null,
    errorDescription: null,
  };
}

export const useBrowserStore = create<BrowserUiState>((set, get) => ({
  // Initial state
  activeViewId: null,
  views: new Map(),
  isInitialized: false,
  initError: null,

  // Computed getters
  get activeView() {
    const state = get();
    if (!state.activeViewId) return null;
    return state.views.get(state.activeViewId) ?? null;
  },

  get isLoading() {
    const activeView = get().activeView;
    return activeView?.isLoading ?? false;
  },

  get loadingProgress() {
    const activeView = get().activeView;
    return activeView?.loadingProgress ?? 0;
  },

  // Actions
  initialize: async () => {
    // Check if already initialized
    if (get().isInitialized) return;

    try {
      // Create initial view
      const id = crypto.randomUUID();
      const url = 'https://www.google.com';
      
      const result = await window.electronAPI.browser.createView(id, { url });
      
      if (!result.success) {
        set({ initError: result.error ?? 'Failed to create initial browser view', isInitialized: true });
        return;
      }

      // Set as active view
      await window.electronAPI.browser.setActiveView(id);

      // Update state
      const views = new Map(get().views);
      views.set(id, createDefaultViewState(id, url));
      
      set({
        activeViewId: id,
        views,
        isInitialized: true,
        initError: null,
      });

      console.log('[BrowserStore] Initialized with view:', id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ initError: message, isInitialized: true });
      console.error('[BrowserStore] Initialization error:', message);
    }
  },

  createView: async (url = 'https://www.google.com') => {
    try {
      const id = crypto.randomUUID();
      const result = await window.electronAPI.browser.createView(id, { url });
      
      if (!result.success) {
        console.error('[BrowserStore] Failed to create view:', result.error);
        return null;
      }

      // Set as active
      await window.electronAPI.browser.setActiveView(id);

      // Update state
      const views = new Map(get().views);
      views.set(id, createDefaultViewState(id, url));
      
      set({ activeViewId: id, views });
      
      console.log('[BrowserStore] Created view:', id);
      return id;
    } catch (error) {
      console.error('[BrowserStore] Create view error:', error);
      return null;
    }
  },

  destroyView: async (id: string) => {
    try {
      await window.electronAPI.browser.destroyView(id);
      
      const views = new Map(get().views);
      views.delete(id);
      
      const newActiveId = get().activeViewId === id 
        ? (views.size > 0 ? views.keys().next().value : null)
        : get().activeViewId;
      
      set({ views, activeViewId: newActiveId });
      
      console.log('[BrowserStore] Destroyed view:', id);
    } catch (error) {
      console.error('[BrowserStore] Destroy view error:', error);
    }
  },

  setActiveView: async (id: string) => {
    try {
      const result = await window.electronAPI.browser.setActiveView(id);
      if (result.success) {
        set({ activeViewId: id });
      }
    } catch (error) {
      console.error('[BrowserStore] Set active view error:', error);
    }
  },

  loadURL: async (url: string) => {
    const activeViewId = get().activeViewId;
    if (!activeViewId) {
      console.warn('[BrowserStore] No active view to load URL');
      return;
    }

    try {
      // Clear any existing error
      get().clearError(activeViewId);
      
      const result = await window.electronAPI.browser.loadURL(activeViewId, url);
      if (!result.success) {
        console.error('[BrowserStore] Load URL failed:', result.error);
      }
    } catch (error) {
      console.error('[BrowserStore] Load URL error:', error);
    }
  },

  goBack: async () => {
    const activeViewId = get().activeViewId;
    if (!activeViewId) return;

    try {
      await window.electronAPI.browser.goBack(activeViewId);
    } catch (error) {
      console.error('[BrowserStore] Go back error:', error);
    }
  },

  goForward: async () => {
    const activeViewId = get().activeViewId;
    if (!activeViewId) return;

    try {
      await window.electronAPI.browser.goForward(activeViewId);
    } catch (error) {
      console.error('[BrowserStore] Go forward error:', error);
    }
  },

  reload: async () => {
    const activeViewId = get().activeViewId;
    if (!activeViewId) return;

    try {
      get().clearError(activeViewId);
      await window.electronAPI.browser.reload(activeViewId);
    } catch (error) {
      console.error('[BrowserStore] Reload error:', error);
    }
  },

  stop: async () => {
    const activeViewId = get().activeViewId;
    if (!activeViewId) return;

    try {
      await window.electronAPI.browser.stop(activeViewId);
    } catch (error) {
      console.error('[BrowserStore] Stop error:', error);
    }
  },

  updateBounds: (bounds) => {
    // Fire and forget - no need to await
    window.electronAPI.browser.setBounds(bounds).catch((error) => {
      console.error('[BrowserStore] Set bounds error:', error);
    });
  },

  // Event handlers
  handleLoadingEvent: (viewId, isLoading) => {
    const views = new Map(get().views);
    const view = views.get(viewId);
    if (view) {
      views.set(viewId, {
        ...view,
        isLoading,
        loadingProgress: isLoading ? view.loadingProgress : 1,
      });
      set({ views });
    }
  },

  handleNavigatedEvent: (viewId, url, canGoBack, canGoForward, isSecure) => {
    const views = new Map(get().views);
    const view = views.get(viewId);
    if (view) {
      views.set(viewId, {
        ...view,
        url,
        canGoBack,
        canGoForward,
        isSecure,
        // Clear error on successful navigation
        errorCode: null,
        errorDescription: null,
      });
      set({ views });
    }
  },

  handleTitleEvent: (viewId, title) => {
    const views = new Map(get().views);
    const view = views.get(viewId);
    if (view) {
      views.set(viewId, { ...view, title });
      set({ views });
    }
  },

  handleFaviconEvent: (viewId, faviconUrl) => {
    const views = new Map(get().views);
    const view = views.get(viewId);
    if (view) {
      views.set(viewId, { ...view, faviconUrl });
      set({ views });
    }
  },

  handleProgressEvent: (viewId, progress) => {
    const views = new Map(get().views);
    const view = views.get(viewId);
    if (view) {
      views.set(viewId, { ...view, loadingProgress: progress });
      set({ views });
    }
  },

  handleErrorEvent: (viewId, errorCode, errorDescription) => {
    const views = new Map(get().views);
    const view = views.get(viewId);
    if (view) {
      views.set(viewId, {
        ...view,
        errorCode,
        errorDescription,
        isLoading: false,
      });
      set({ views });
    }
  },

  clearError: (viewId) => {
    const views = new Map(get().views);
    const view = views.get(viewId);
    if (view) {
      views.set(viewId, {
        ...view,
        errorCode: null,
        errorDescription: null,
      });
      set({ views });
    }
  },
}));

/**
 * Initialize IPC event subscriptions
 * Call this once when the app mounts
 */
export function initializeBrowserEventSubscriptions(): () => void {
  const unsubscribers: (() => void)[] = [];

  // Loading events
  unsubscribers.push(
    window.electronAPI.browser.onLoading(({ viewId, isLoading }) => {
      useBrowserStore.getState().handleLoadingEvent(viewId, isLoading);
    })
  );

  // Navigation events
  unsubscribers.push(
    window.electronAPI.browser.onNavigated(({ viewId, url, canGoBack, canGoForward, isSecure }) => {
      useBrowserStore.getState().handleNavigatedEvent(viewId, url, canGoBack, canGoForward, isSecure);
    })
  );

  // Title events
  unsubscribers.push(
    window.electronAPI.browser.onTitle(({ viewId, title }) => {
      useBrowserStore.getState().handleTitleEvent(viewId, title);
    })
  );

  // Favicon events
  unsubscribers.push(
    window.electronAPI.browser.onFavicon(({ viewId, faviconUrl }) => {
      useBrowserStore.getState().handleFaviconEvent(viewId, faviconUrl);
    })
  );

  // Progress events
  unsubscribers.push(
    window.electronAPI.browser.onProgress(({ viewId, progress }) => {
      useBrowserStore.getState().handleProgressEvent(viewId, progress);
    })
  );

  // Error events
  unsubscribers.push(
    window.electronAPI.browser.onError(({ viewId, errorCode, errorDescription }) => {
      useBrowserStore.getState().handleErrorEvent(viewId, errorCode, errorDescription);
    })
  );

  console.log('[BrowserStore] Event subscriptions initialized');

  // Return cleanup function
  return () => {
    unsubscribers.forEach((unsub) => unsub());
    console.log('[BrowserStore] Event subscriptions cleaned up');
  };
}
```

---

### R3: BrowserArea Component

#### 3.1 Component Implementation

```typescript
// packages/react-ui/src/components/browser/BrowserArea.tsx

import { useEffect, useRef, useCallback, useState } from 'react';
import { useBrowserStore, initializeBrowserEventSubscriptions } from '../../stores/browserUiStore';
import { BrowserLoadingBar } from './BrowserLoadingBar';
import { BrowserErrorOverlay } from './BrowserErrorOverlay';
import styles from './BrowserArea.module.css';

export interface BrowserAreaProps {
  /** Width of the sidebar in pixels */
  sidebarWidth: number;
  /** Height of any top chrome (tab bar, nav bar) in pixels */
  topOffset?: number;
  /** Additional class name */
  className?: string;
}

/**
 * Container for the browser WebContentsView
 * 
 * The actual web content is rendered by the main process WebContentsView,
 * positioned to match this component's bounds. This component:
 * 1. Calculates and reports bounds to main process
 * 2. Shows loading progress
 * 3. Shows error overlay when needed
 * 4. Initializes browser on mount
 */
export function BrowserArea({ 
  sidebarWidth, 
  topOffset = 0,
  className,
}: BrowserAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  const { 
    activeViewId,
    isInitialized,
    initError,
    initialize,
    updateBounds,
  } = useBrowserStore();

  // Get active view state
  const activeView = useBrowserStore((state) => {
    if (!state.activeViewId) return null;
    return state.views.get(state.activeViewId) ?? null;
  });

  // Calculate and send bounds to main process
  const sendBounds = useCallback(() => {
    if (!containerRef.current || !activeViewId) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Only update if we have valid dimensions
    if (rect.width > 0 && rect.height > 0) {
      updateBounds({
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }
  }, [activeViewId, updateBounds]);

  // Initialize browser and event subscriptions on mount
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setup = async () => {
      // Initialize event subscriptions
      cleanup = initializeBrowserEventSubscriptions();
      
      // Initialize browser store (creates first view)
      await initialize();
      
      setIsReady(true);
    };

    setup();

    return () => {
      if (cleanup) cleanup();
    };
  }, [initialize]);

  // Update bounds when container size changes
  useEffect(() => {
    if (!isReady) return;

    // Initial bounds
    sendBounds();

    // Listen for resize
    const handleResize = () => {
      requestAnimationFrame(sendBounds);
    };

    window.addEventListener('resize', handleResize);

    // ResizeObserver for container-specific changes
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(sendBounds);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [isReady, sendBounds]);

  // Update bounds when sidebar width or top offset changes
  useEffect(() => {
    if (isReady) {
      sendBounds();
    }
  }, [sidebarWidth, topOffset, isReady, sendBounds]);

  // Show initialization error
  if (initError) {
    return (
      <div 
        className={`${styles.browserArea} ${styles.error} ${className ?? ''}`}
        style={{ left: sidebarWidth, top: topOffset }}
      >
        <div className={styles.errorContent}>
          <h3>Failed to initialize browser</h3>
          <p>{initError}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while initializing
  if (!isInitialized || !isReady) {
    return (
      <div 
        className={`${styles.browserArea} ${styles.loading} ${className ?? ''}`}
        style={{ left: sidebarWidth, top: topOffset }}
      >
        <div className={styles.loadingContent}>
          <div className={styles.spinner} />
          <span>Initializing browser...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.browserArea} ${className ?? ''}`}
      style={{
        left: sidebarWidth,
        top: topOffset,
        right: 0,
        bottom: 0,
      }}
      data-testid="browser-area"
    >
      {/* Loading progress bar */}
      {activeView?.isLoading && (
        <BrowserLoadingBar progress={activeView.loadingProgress} />
      )}

      {/* Error overlay */}
      {activeView?.errorCode && (
        <BrowserErrorOverlay
          errorCode={activeView.errorCode}
          errorDescription={activeView.errorDescription ?? 'Unknown error'}
          url={activeView.url}
        />
      )}

      {/* 
        Placeholder div - the actual WebContentsView is positioned by the main process
        to match this container's bounds. This div exists to:
        1. Provide layout context
        2. Allow click-through to WebContentsView
        3. Show when no view is active
      */}
      {!activeViewId && (
        <div className={styles.placeholder}>
          <span>No browser view active</span>
        </div>
      )}
    </div>
  );
}
```

#### 3.2 BrowserArea Styles

```css
/* packages/react-ui/src/components/browser/BrowserArea.module.css */

.browserArea {
  position: absolute;
  background-color: var(--color-bg-dark, #0F0B1A);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Loading state */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loadingContent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md, 16px);
  color: var(--color-text-secondary, #9CA3AF);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border-subtle, #2D2640);
  border-top-color: var(--color-primary, #6D5AE6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error state */
.error {
  display: flex;
  align-items: center;
  justify-content: center;
}

.errorContent {
  text-align: center;
  padding: var(--spacing-xl, 32px);
  max-width: 400px;
}

.errorContent h3 {
  color: var(--color-text-primary, #FFFFFF);
  margin: 0 0 var(--spacing-sm, 8px) 0;
  font-size: 18px;
  font-weight: 600;
}

.errorContent p {
  color: var(--color-text-secondary, #9CA3AF);
  margin: 0 0 var(--spacing-lg, 24px) 0;
  font-size: 14px;
  line-height: 1.5;
}

.retryButton {
  background-color: var(--color-primary, #6D5AE6);
  color: white;
  border: none;
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-sm, 8px) var(--spacing-lg, 24px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.retryButton:hover {
  background-color: var(--color-primary-hover, #5B4ACC);
}

/* Placeholder */
.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary, #6B7280);
  font-size: 14px;
}
```

---

### R4: BrowserLoadingBar Component

#### 4.1 Component Implementation

```typescript
// packages/react-ui/src/components/browser/BrowserLoadingBar.tsx

import { useEffect, useState } from 'react';
import styles from './BrowserLoadingBar.module.css';

export interface BrowserLoadingBarProps {
  /** Loading progress from 0 to 1 */
  progress: number;
  /** Height in pixels (default: 2) */
  height?: number;
}

/**
 * Animated loading progress bar
 * 
 * Features:
 * - Smooth animation between progress values
 * - Indeterminate animation when progress is 0
 * - Fades out when progress reaches 1
 */
export function BrowserLoadingBar({ progress, height = 2 }: BrowserLoadingBarProps) {
  const [displayProgress, setDisplayProgress] = useState(progress);
  const [isVisible, setIsVisible] = useState(true);

  // Smooth progress animation
  useEffect(() => {
    // Always move forward, never backward (looks janky)
    if (progress > displayProgress) {
      setDisplayProgress(progress);
    } else if (progress === 0) {
      // Reset for new load
      setDisplayProgress(0);
    }
  }, [progress, displayProgress]);

  // Handle fade out when complete
  useEffect(() => {
    if (displayProgress >= 1) {
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 200); // Brief delay before fade out

      return () => clearTimeout(timeout);
    } else {
      setIsVisible(true);
    }
  }, [displayProgress]);

  if (!isVisible) return null;

  const isIndeterminate = displayProgress === 0;

  return (
    <div 
      className={styles.loadingBar}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(displayProgress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`${styles.progress} ${isIndeterminate ? styles.indeterminate : ''}`}
        style={{
          width: isIndeterminate ? '30%' : `${displayProgress * 100}%`,
        }}
      />
    </div>
  );
}
```

#### 4.2 BrowserLoadingBar Styles

```css
/* packages/react-ui/src/components/browser/BrowserLoadingBar.module.css */

.loadingBar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: transparent;
  z-index: 100;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: var(--color-primary, #6D5AE6);
  border-radius: 0 1px 1px 0;
  transition: width 200ms ease-out;
}

/* Indeterminate animation */
.indeterminate {
  animation: indeterminate 1.5s ease-in-out infinite;
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(200%);
  }
  100% {
    transform: translateX(-100%);
  }
}
```

---

### R5: BrowserErrorOverlay Component

#### 5.1 Component Implementation

```typescript
// packages/react-ui/src/components/browser/BrowserErrorOverlay.tsx

import { useBrowserStore } from '../../stores/browserUiStore';
import styles from './BrowserErrorOverlay.module.css';

export interface BrowserErrorOverlayProps {
  errorCode: number;
  errorDescription: string;
  url: string;
}

/**
 * Error overlay shown when page fails to load
 */
export function BrowserErrorOverlay({ 
  errorCode, 
  errorDescription, 
  url 
}: BrowserErrorOverlayProps) {
  const { reload, loadURL } = useBrowserStore();

  // Get user-friendly error message
  const getUserMessage = (): string => {
    // Common Chromium error codes
    switch (errorCode) {
      case -2: // ERR_FAILED
        return 'The page failed to load.';
      case -3: // ERR_ABORTED
        return 'The page load was cancelled.';
      case -6: // ERR_FILE_NOT_FOUND
        return 'The file could not be found.';
      case -7: // ERR_TIMED_OUT
        return 'The page took too long to load.';
      case -21: // ERR_NETWORK_CHANGED
        return 'Your network connection changed.';
      case -100: // ERR_CONNECTION_CLOSED
        return 'The connection was closed.';
      case -101: // ERR_CONNECTION_RESET
        return 'The connection was reset.';
      case -102: // ERR_CONNECTION_REFUSED
        return 'The connection was refused.';
      case -103: // ERR_CONNECTION_ABORTED
        return 'The connection was aborted.';
      case -104: // ERR_CONNECTION_FAILED
        return 'Could not connect to the server.';
      case -105: // ERR_NAME_NOT_RESOLVED
        return 'The server could not be found.';
      case -106: // ERR_INTERNET_DISCONNECTED
        return 'You are not connected to the internet.';
      case -107: // ERR_SSL_PROTOCOL_ERROR
        return 'There was an SSL protocol error.';
      case -109: // ERR_ADDRESS_UNREACHABLE
        return 'The server address is unreachable.';
      case -118: // ERR_CONNECTION_TIMED_OUT
        return 'The connection timed out.';
      case -200: // ERR_CERT_COMMON_NAME_INVALID
      case -201: // ERR_CERT_DATE_INVALID
      case -202: // ERR_CERT_AUTHORITY_INVALID
        return 'There was a security certificate error.';
      case -324: // ERR_EMPTY_RESPONSE
        return 'The server sent an empty response.';
      default:
        return errorDescription || 'An unexpected error occurred.';
    }
  };

  const handleRetry = () => {
    reload();
  };

  const handleGoHome = () => {
    loadURL('https://www.google.com');
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.icon}>⚠️</div>
        <h2 className={styles.title}>This page isn't working</h2>
        <p className={styles.message}>{getUserMessage()}</p>
        <p className={styles.url}>{url}</p>
        {errorCode && (
          <p className={styles.errorCode}>Error code: {errorCode}</p>
        )}
        <div className={styles.actions}>
          <button 
            className={styles.primaryButton}
            onClick={handleRetry}
          >
            Try again
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={handleGoHome}
          >
            Go to Google
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 5.2 BrowserErrorOverlay Styles

```css
/* packages/react-ui/src/components/browser/BrowserErrorOverlay.module.css */

.overlay {
  position: absolute;
  inset: 0;
  background-color: var(--color-bg-dark, #0F0B1A);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.content {
  text-align: center;
  padding: var(--spacing-xl, 32px);
  max-width: 450px;
}

.icon {
  font-size: 48px;
  margin-bottom: var(--spacing-lg, 24px);
}

.title {
  color: var(--color-text-primary, #FFFFFF);
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 var(--spacing-md, 16px) 0;
}

.message {
  color: var(--color-text-secondary, #9CA3AF);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 var(--spacing-sm, 8px) 0;
}

.url {
  color: var(--color-text-tertiary, #6B7280);
  font-size: 12px;
  word-break: break-all;
  margin: 0 0 var(--spacing-sm, 8px) 0;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
}

.errorCode {
  color: var(--color-text-tertiary, #6B7280);
  font-size: 11px;
  margin: 0 0 var(--spacing-lg, 24px) 0;
}

.actions {
  display: flex;
  gap: var(--spacing-sm, 8px);
  justify-content: center;
}

.primaryButton {
  background-color: var(--color-primary, #6D5AE6);
  color: white;
  border: none;
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-sm, 8px) var(--spacing-lg, 24px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.primaryButton:hover {
  background-color: var(--color-primary-hover, #5B4ACC);
}

.secondaryButton {
  background-color: transparent;
  color: var(--color-text-secondary, #9CA3AF);
  border: 1px solid var(--color-border-subtle, #2D2640);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-sm, 8px) var(--spacing-lg, 24px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.secondaryButton:hover {
  background-color: var(--color-bg-elevated, #1A1425);
  border-color: var(--color-border-default, #3D3450);
  color: var(--color-text-primary, #FFFFFF);
}
```

---

### R6: Barrel Exports

```typescript
// packages/react-ui/src/components/browser/index.ts

export { BrowserArea } from './BrowserArea';
export type { BrowserAreaProps } from './BrowserArea';

export { BrowserLoadingBar } from './BrowserLoadingBar';
export type { BrowserLoadingBarProps } from './BrowserLoadingBar';

export { BrowserErrorOverlay } from './BrowserErrorOverlay';
export type { BrowserErrorOverlayProps } from './BrowserErrorOverlay';
```

---

### R7: Layout Integration

#### 7.1 App Layout Integration

```typescript
// packages/desktop/src/renderer/App.tsx (integration example)

import { useEffect } from 'react';
import { BrowserArea } from '@spayce/react-ui';
import { useNavigationStore } from '@spayce/react-ui/stores';
// ... other imports

export function App() {
  const { sidebarWidth, isSidebarVisible } = useNavigationStore();
  
  // Calculate effective sidebar width
  const effectiveSidebarWidth = isSidebarVisible ? sidebarWidth : 0;
  
  // Top offset (for future tab bar + nav bar)
  const topOffset = 0; // Will be updated in Spec 020/021

  return (
    <div className="app-container">
      {/* Sidebar */}
      {isSidebarVisible && <Sidebar />}
      
      {/* Browser Area */}
      <BrowserArea 
        sidebarWidth={effectiveSidebarWidth}
        topOffset={topOffset}
      />
    </div>
  );
}
```

---

## Acceptance Criteria

### Preload API
- [ ] All browser methods exposed via contextBridge
- [ ] Type definitions complete and accurate
- [ ] Event listeners return unsubscribe functions
- [ ] IPC calls return consistent response format
- [ ] window.electronAPI.browser accessible in renderer

### Browser UI Store
- [ ] Store initializes on app mount
- [ ] View state tracked correctly
- [ ] All IPC events handled
- [ ] Actions update state correctly
- [ ] Computed getters (activeView, isLoading) work
- [ ] Error state managed properly

### BrowserArea Component
- [ ] Renders in correct position (respects sidebar)
- [ ] Reports bounds to main process
- [ ] Updates bounds on resize
- [ ] Shows loading state during init
- [ ] Shows error state on init failure
- [ ] Shows loading bar when page loading
- [ ] Shows error overlay on page errors

### BrowserLoadingBar
- [ ] Shows progress from 0 to 1
- [ ] Smooth animation between values
- [ ] Indeterminate animation when progress is 0
- [ ] Fades out when complete
- [ ] Uses design system colors

### BrowserErrorOverlay
- [ ] Shows user-friendly error message
- [ ] Displays failed URL
- [ ] Retry button reloads page
- [ ] Go home button navigates to Google
- [ ] Styled with design system tokens

### Layout Integration
- [ ] Browser area fills space beside sidebar
- [ ] Respects sidebar width changes
- [ ] No visual gaps or overlaps
- [ ] Smooth resize behavior

### Performance
- [ ] Bounds update at 60fps during resize
- [ ] No memory leaks from event subscriptions
- [ ] Store updates don't cause unnecessary renders

---

## File Structure

```
packages/desktop/src/
├── preload/
│   ├── types.ts                        # NEW: Type definitions
│   └── index.ts                        # UPDATE: Add browser API
└── renderer/
    └── App.tsx                         # UPDATE: Integrate BrowserArea

packages/react-ui/src/
├── components/
│   └── browser/                        # NEW: Browser components
│       ├── BrowserArea.tsx
│       ├── BrowserArea.module.css
│       ├── BrowserLoadingBar.tsx
│       ├── BrowserLoadingBar.module.css
│       ├── BrowserErrorOverlay.tsx
│       ├── BrowserErrorOverlay.module.css
│       └── index.ts
├── stores/
│   ├── browserUiStore.ts               # NEW: Browser UI store
│   └── index.ts                        # UPDATE: Export browserUiStore
└── index.ts                            # UPDATE: Export browser components
```

---

## Testing Strategy

### Unit Tests

```typescript
// packages/react-ui/__tests__/stores/browserUiStore.test.ts

describe('browserUiStore', () => {
  describe('state management', () => {
    it('should initialize with default state');
    it('should create view and set as active');
    it('should handle loading events');
    it('should handle navigation events');
    it('should handle error events');
    it('should clear errors on reload');
  });
});
```

### Component Tests

```typescript
// packages/react-ui/__tests__/components/browser/BrowserLoadingBar.test.tsx

describe('BrowserLoadingBar', () => {
  it('should render progress bar');
  it('should animate progress changes');
  it('should show indeterminate animation at 0');
  it('should fade out at 100%');
});
```

### Integration Tests

```typescript
// packages/desktop/__tests__/integration/browser-ui.integration.test.ts

describe('Browser UI Integration', () => {
  it('should create view and display content');
  it('should update bounds on resize');
  it('should show loading progress');
  it('should handle page errors');
});
```

---

## Dependencies

- **017** (browser-foundation) - BrowserService, IPC handlers
- **018** (browser-domain-layer) - Tab state models
- **010** (react-ui-integration) - Component patterns
- **002** (sidebar-navigation) - Layout integration

## Blocks

- **020** (tab-bar-ui) - Needs BrowserArea foundation
- **021** (navigation-bar-ui) - Needs browser state
- **022-031** (advanced features)

## Estimated Duration

2-3 days

## Flutter Reference

**Source**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/browser_screen.dart`

Key patterns:
- Lines 82-186: Build method layout → App.tsx layout integration
- Lines 143-152: Loading indicator → BrowserLoadingBar
- Lines 163-179: Error overlay → BrowserErrorOverlay

**Source**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/data/browser_controller.dart`

Key patterns:
- State notifier pattern → Zustand store
- Event handling → IPC event subscriptions

## HiFi Design Reference

| Design | File Path |
|--------|-----------|
| Browser View | `project_ops/HIFI_UI_DESIGN_SCREENS/Browser View.png` |

**Key UI Elements:**
- Browser area background: `--color-bg-dark` (#0F0B1A)
- Loading bar: 2px height, primary color, top position
- Error overlay: centered, dark background
- Smooth transitions on all state changes

## Tech Decisions Update

After completing this spec, update `.aasef/context/tech_decisions.md`:

```markdown
### 12. Single Tab Browser MVP (Spec 019)

| Decision | Value | Rationale |
|----------|-------|-----------|
| State Management | Zustand store (browserUiStore) | Consistent with app patterns |
| Event Subscriptions | Initialize on mount, cleanup on unmount | Prevent memory leaks |
| Bounds Reporting | ResizeObserver + requestAnimationFrame | 60fps capable |
| Error Display | Overlay with user-friendly messages | Better UX than raw codes |
| Loading Bar | Animated progress with indeterminate | Visual feedback |
```


## Acceptance Criteria to Cover

1. [ ] Given I launch the application
2. [ ] When the browser area is visible
3. [ ] Then I see a web page loaded (default: google.com)
4. [ ] And the browser fills the area beside the sidebar
5. [ ] And the browser respects the sidebar width

## Tech Stack

```json
Not specified
```

## Required Test Files

- Create in appropriate test directory

## Test Requirements

### For Each Acceptance Criterion

Create tests that:
1. **Test the happy path** - Normal expected behavior
2. **Test edge cases** - Boundary conditions, empty inputs
3. **Test error handling** - Invalid inputs, network failures
4. **Use appropriate mocking** - Don't hit real APIs/databases

### Test Structure

```
describe('Feature: 019')
  describe('AC1: [Acceptance Criterion 1]')
    test('should [expected behavior]')
    test('should handle [edge case]')
    test('should throw error when [error condition]')
  
  describe('AC2: [Acceptance Criterion 2]')
    ...
```

## Guidelines

1. **Tests MUST FAIL initially** - We haven't implemented yet!
2. Follow existing test patterns in the codebase
3. Use the project's testing frameworks
4. Ensure tests are deterministic (no flaky tests)
5. Add appropriate setup/teardown
6. Use descriptive test names
7. Group related tests logically

## After Creating Tests

1. **Link tests to spec**: `aasef test link <test-file> --spec 019`
2. **Run RED phase**: `aasef test tdd-red 019`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
