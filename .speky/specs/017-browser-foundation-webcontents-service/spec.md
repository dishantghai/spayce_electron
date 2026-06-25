# Spec 017: Browser Foundation - WebContentsView Service

## Overview

Implement the core browser management service in Electron's main process using the modern WebContentsView API (Electron 30+). This service is the foundation for all browser functionality, handling the creation, positioning, lifecycle management, and control of browser views with secure defaults and proper event forwarding.

> **CRITICAL**: This is a foundational spec that blocks ALL subsequent browser features. Implementation must be production-grade with robust error handling, memory management, and security hardening.

## Dependencies & Scope Coordination

**Dependencies:**
- **Spec 001**: Project foundation (Electron setup, TypeScript configuration)
- **Spec 007**: Core domain layer (entity patterns, error handling patterns)
- **Spec 008**: Infrastructure layer (service patterns, event bus)

**Integration Points:**
- Provides browser view management for Spec 018 (Tab Domain Layer)
- Provides IPC bridge for Spec 019 (Single Tab MVP)
- Foundation for Specs 020-031 (all multi-tab and advanced browser features)

**This Spec Covers:**
- BrowserService class with WebContentsView management
- Secure WebContentsView configuration (context isolation, sandbox, no node integration)
- Bounds calculation and positioning relative to sidebar
- Navigation control (loadURL, back, forward, reload, stop)
- Event forwarding from WebContents to renderer process
- View lifecycle management (create, destroy, show, hide)
- User agent configuration for compatibility
- URL validation and sanitization

**Out of Scope:**
- Tab bar UI (Spec 020)
- Tab persistence/storage (Spec 018)
- Multi-tab switching (Spec 020)
- Navigation bar UI (Spec 021)
- Ad blocking (future spec)

### Related Documents

| Document | Purpose |
|----------|---------|
| [plan.md](./plan.md) | Implementation phases and timeline |
| [status.json](./status.json) | Metadata, dependencies, and tracking |
| [security-review.md](./security-review.md) | Threat model, CSRs, compliance checklist |
| [performance-review.md](./performance-review.md) | Performance targets, optimization strategies |
| [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) | Step-by-step implementation instructions |

> **For Implementation**: Start with [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) which directs you to the relevant sections of each document.

## User Stories

### US-017-001: Create Browser View
- **As a developer**, I want to create a WebContentsView instance with secure defaults so that web content can be safely displayed within the application
- **Acceptance Criteria:**
  - Given I call `browserService.createView(id, url)`
  - When the view is created
  - Then it has context isolation enabled, node integration disabled, and sandbox enabled
  - And it uses a Safari-compatible user agent string
  - And it loads the specified URL (defaulting to google.com if none provided)

### US-017-002: Position Browser View
- **As a developer**, I want to update browser view bounds so that the browser area correctly fills the space beside the sidebar
- **Acceptance Criteria:**
  - Given I call `browserService.setBounds({ x, y, width, height })`
  - When the main window resizes
  - Then the active view bounds update to fill the designated area
  - And the view respects the sidebar width offset
  - And bounds updates occur within 16ms (60fps capable)

### US-017-003: Navigate Browser View
- **As a developer**, I want to control navigation in a browser view so that users can browse the web
- **Acceptance Criteria:**
  - Given I have an active browser view
  - When I call `loadURL`, `goBack`, `goForward`, `reload`, or `stop`
  - Then the navigation action executes within 100ms
  - And navigation history state (canGoBack, canGoForward) updates correctly
  - And invalid URLs are rejected with clear error messages

### US-017-004: Forward Browser Events
- **As a developer**, I want browser events forwarded to the renderer so that the UI can display current state
- **Acceptance Criteria:**
  - Given a browser view is loading a page
  - When page events occur (loading start/stop, progress, title change, navigation)
  - Then events are forwarded to the renderer via IPC
  - And events include the viewId for multi-tab support
  - And event payloads are properly typed

### US-017-005: Manage View Lifecycle
- **As a developer**, I want proper view lifecycle management so that resources are cleaned up and memory is managed efficiently
- **Acceptance Criteria:**
  - Given I destroy a browser view
  - When the view is removed
  - Then all event listeners are removed
  - And the WebContentsView is properly disposed
  - And no memory leaks occur (verified via heap snapshots)

## MVP Scope

### Included:
- BrowserService class with singleton pattern
- createView() with secure WebContentsView configuration
- destroyView() with proper cleanup
- setActiveView() for view switching
- setBounds() for positioning
- loadURL() with URL validation
- goBack(), goForward(), reload(), stop() navigation
- getViewState() for state queries
- setViewVisibility() for show/hide
- Event forwarding: loading, navigated, title, progress, error
- User agent configuration (Safari macOS)
- Web preferences security hardening

### Excluded (Future Specs):
- Tab persistence
- Session/cookie management
- Download handling
- Permission management beyond defaults
- DevTools integration
- Print functionality
- Find in page

## Requirements

### R1: BrowserService Class

#### 1.1 Service Interface

```typescript
// packages/desktop/src/main/services/BrowserService.ts

import { BrowserWindow, WebContentsView } from 'electron';

/**
 * View bounds specification for positioning WebContentsView
 */
export interface ViewBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Current state of a browser view for UI synchronization
 */
export interface BrowserViewState {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly isLoading: boolean;
  readonly loadingProgress: number;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly isSecure: boolean;
  readonly errorCode: number | null;
  readonly errorDescription: string | null;
}

/**
 * Options for creating a new browser view
 */
export interface CreateViewOptions {
  readonly url?: string;
  readonly userAgent?: string;
  readonly partition?: string;
}

/**
 * Browser view event types for IPC forwarding
 */
export type BrowserEventType = 
  | 'browser:loading'
  | 'browser:navigated'
  | 'browser:title'
  | 'browser:progress'
  | 'browser:error'
  | 'browser:favicon';

/**
 * Core browser service interface
 */
export interface IBrowserService {
  initialize(mainWindow: BrowserWindow): void;
  createView(id: string, options?: CreateViewOptions): string;
  getView(id: string): WebContentsView | undefined;
  destroyView(id: string): void;
  destroyAllViews(): void;
  setActiveView(id: string): boolean;
  getActiveViewId(): string | null;
  setBounds(bounds: ViewBounds): void;
  loadURL(id: string, url: string): Promise<void>;
  goBack(id: string): Promise<void>;
  goForward(id: string): Promise<void>;
  reload(id: string): Promise<void>;
  stop(id: string): void;
  getViewState(id: string): BrowserViewState | null;
  setViewVisibility(id: string, visible: boolean): void;
  getViewCount(): number;
}
```

#### 1.2 BrowserService Implementation

```typescript
// packages/desktop/src/main/services/BrowserService.ts

export class BrowserService implements IBrowserService {
  private views: Map<string, WebContentsView> = new Map();
  private activeViewId: string | null = null;
  private mainWindow: BrowserWindow | null = null;
  private currentBounds: ViewBounds = { x: 0, y: 0, width: 800, height: 600 };
  private isInitialized = false;

  // Safari macOS user agent for maximum compatibility
  private readonly DEFAULT_USER_AGENT = 
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

  /**
   * Initialize the browser service with the main window
   * Must be called before any other methods
   */
  initialize(mainWindow: BrowserWindow): void {
    if (this.isInitialized) {
      console.warn('[BrowserService] Already initialized');
      return;
    }

    this.mainWindow = mainWindow;
    this.isInitialized = true;

    // Handle window close - cleanup all views
    mainWindow.on('closed', () => {
      this.destroyAllViews();
      this.mainWindow = null;
      this.isInitialized = false;
    });

    console.log('[BrowserService] Initialized');
  }

  /**
   * Create a new WebContentsView with secure defaults
   */
  createView(id: string, options: CreateViewOptions = {}): string {
    this.ensureInitialized();

    if (this.views.has(id)) {
      console.warn(`[BrowserService] View ${id} already exists`);
      return id;
    }

    const view = new WebContentsView({
      webPreferences: {
        // SECURITY: Critical security settings
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        
        // No preload for browser views - fully isolated from app
        preload: undefined,
        
        // Web standards
        javascript: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        
        // Storage
        domStorageEnabled: true,
        databaseEnabled: true,
        
        // Media (Arc-style: allow autoplay with gesture)
        autoplayPolicy: 'user-gesture-required',
        
        // Session partition (optional, for isolated sessions)
        partition: options.partition,
      },
    });

    // Set user agent
    view.webContents.setUserAgent(options.userAgent ?? this.DEFAULT_USER_AGENT);

    // Set up event listeners
    this.setupEventListeners(id, view);

    // Store the view
    this.views.set(id, view);

    // Load initial URL if provided
    const initialUrl = options.url ?? 'https://www.google.com';
    this.loadURLInternal(view, initialUrl).catch((error) => {
      console.error(`[BrowserService] Failed to load initial URL: ${error.message}`);
    });

    console.log(`[BrowserService] Created view: ${id}`);
    return id;
  }

  /**
   * Get a view by ID
   */
  getView(id: string): WebContentsView | undefined {
    return this.views.get(id);
  }

  /**
   * Destroy a view and cleanup resources
   */
  destroyView(id: string): void {
    const view = this.views.get(id);
    if (!view) {
      console.warn(`[BrowserService] View ${id} not found for destruction`);
      return;
    }

    // Remove from content view if currently added
    if (this.mainWindow && this.activeViewId === id) {
      try {
        this.mainWindow.contentView.removeChildView(view);
      } catch (error) {
        console.warn(`[BrowserService] Error removing view from window: ${error}`);
      }
    }

    // Remove all event listeners
    view.webContents.removeAllListeners();

    // Close the webContents
    if (!view.webContents.isDestroyed()) {
      view.webContents.close();
    }

    // Remove from map
    this.views.delete(id);

    // Update active view if necessary
    if (this.activeViewId === id) {
      this.activeViewId = null;
    }

    console.log(`[BrowserService] Destroyed view: ${id}`);
  }

  /**
   * Destroy all views (cleanup on window close)
   */
  destroyAllViews(): void {
    const viewIds = Array.from(this.views.keys());
    for (const id of viewIds) {
      this.destroyView(id);
    }
    console.log('[BrowserService] Destroyed all views');
  }

  /**
   * Set the active view (shown in browser area)
   */
  setActiveView(id: string): boolean {
    this.ensureInitialized();

    const view = this.views.get(id);
    if (!view) {
      console.warn(`[BrowserService] View ${id} not found`);
      return false;
    }

    // Remove current active view
    if (this.activeViewId && this.activeViewId !== id) {
      const currentView = this.views.get(this.activeViewId);
      if (currentView && this.mainWindow) {
        try {
          this.mainWindow.contentView.removeChildView(currentView);
        } catch (error) {
          console.warn(`[BrowserService] Error removing current view: ${error}`);
        }
      }
    }

    // Add new active view
    if (this.mainWindow) {
      try {
        this.mainWindow.contentView.addChildView(view);
        view.setBounds(this.currentBounds);
      } catch (error) {
        console.error(`[BrowserService] Error adding view to window: ${error}`);
        return false;
      }
    }

    this.activeViewId = id;
    console.log(`[BrowserService] Set active view: ${id}`);
    return true;
  }

  /**
   * Get the currently active view ID
   */
  getActiveViewId(): string | null {
    return this.activeViewId;
  }

  /**
   * Update bounds for the active view
   */
  setBounds(bounds: ViewBounds): void {
    // Validate bounds
    if (bounds.width <= 0 || bounds.height <= 0) {
      console.warn('[BrowserService] Invalid bounds: width and height must be positive');
      return;
    }

    this.currentBounds = {
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
    };

    // Apply to active view
    if (this.activeViewId) {
      const view = this.views.get(this.activeViewId);
      if (view) {
        view.setBounds(this.currentBounds);
      }
    }
  }

  /**
   * Navigate to a URL with validation
   */
  async loadURL(id: string, url: string): Promise<void> {
    const view = this.views.get(id);
    if (!view) {
      throw new Error(`View ${id} not found`);
    }

    return this.loadURLInternal(view, url);
  }

  private async loadURLInternal(view: WebContentsView, url: string): Promise<void> {
    // Validate and normalize URL
    const normalizedUrl = this.validateAndNormalizeUrl(url);
    
    if (!normalizedUrl) {
      throw new Error(`Invalid URL: ${url}`);
    }

    try {
      await view.webContents.loadURL(normalizedUrl);
    } catch (error) {
      // Re-throw with more context
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load URL ${normalizedUrl}: ${message}`);
    }
  }

  /**
   * Validate and normalize a URL
   */
  private validateAndNormalizeUrl(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    let trimmed = url.trim();

    // Handle empty string
    if (trimmed.length === 0) {
      return null;
    }

    // Block dangerous schemes
    const lowerUrl = trimmed.toLowerCase();
    if (lowerUrl.startsWith('javascript:') || 
        lowerUrl.startsWith('data:text/html') ||
        lowerUrl.startsWith('vbscript:')) {
      console.warn(`[BrowserService] Blocked dangerous URL scheme: ${trimmed}`);
      return null;
    }

    // Add https:// if no scheme present
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      // Check if it looks like a domain
      if (trimmed.includes('.') && !trimmed.includes(' ')) {
        trimmed = `https://${trimmed}`;
      } else {
        // Treat as search query
        trimmed = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
      }
    }

    // Validate URL structure
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  }

  /**
   * Navigate back in history
   */
  async goBack(id: string): Promise<void> {
    const view = this.views.get(id);
    if (!view) {
      throw new Error(`View ${id} not found`);
    }

    if (view.webContents.canGoBack()) {
      view.webContents.goBack();
    }
  }

  /**
   * Navigate forward in history
   */
  async goForward(id: string): Promise<void> {
    const view = this.views.get(id);
    if (!view) {
      throw new Error(`View ${id} not found`);
    }

    if (view.webContents.canGoForward()) {
      view.webContents.goForward();
    }
  }

  /**
   * Reload the current page
   */
  async reload(id: string): Promise<void> {
    const view = this.views.get(id);
    if (!view) {
      throw new Error(`View ${id} not found`);
    }

    view.webContents.reload();
  }

  /**
   * Stop loading the current page
   */
  stop(id: string): void {
    const view = this.views.get(id);
    if (!view) {
      console.warn(`[BrowserService] View ${id} not found for stop`);
      return;
    }

    view.webContents.stop();
  }

  /**
   * Get the current state of a view
   */
  getViewState(id: string): BrowserViewState | null {
    const view = this.views.get(id);
    if (!view) {
      return null;
    }

    const webContents = view.webContents;
    const url = webContents.getURL();

    return {
      id,
      url,
      title: webContents.getTitle() || 'New Tab',
      isLoading: webContents.isLoading(),
      loadingProgress: webContents.isLoading() ? 0.5 : 1, // Electron doesn't expose exact progress
      canGoBack: webContents.canGoBack(),
      canGoForward: webContents.canGoForward(),
      isSecure: url.startsWith('https://'),
      errorCode: null,
      errorDescription: null,
    };
  }

  /**
   * Set visibility of a view
   */
  setViewVisibility(id: string, visible: boolean): void {
    const view = this.views.get(id);
    if (!view) {
      console.warn(`[BrowserService] View ${id} not found for visibility change`);
      return;
    }

    view.setVisible(visible);
  }

  /**
   * Get the number of views
   */
  getViewCount(): number {
    return this.views.size;
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.mainWindow) {
      throw new Error('BrowserService not initialized. Call initialize() first.');
    }
  }

  /**
   * Set up event listeners for a view
   */
  private setupEventListeners(id: string, view: WebContentsView): void {
    const webContents = view.webContents;

    // Loading state events
    webContents.on('did-start-loading', () => {
      this.sendToRenderer('browser:loading', {
        viewId: id,
        isLoading: true,
      });
    });

    webContents.on('did-stop-loading', () => {
      this.sendToRenderer('browser:loading', {
        viewId: id,
        isLoading: false,
      });
    });

    // Navigation events
    webContents.on('did-navigate', (_, url) => {
      this.sendToRenderer('browser:navigated', {
        viewId: id,
        url,
        canGoBack: webContents.canGoBack(),
        canGoForward: webContents.canGoForward(),
        isSecure: url.startsWith('https://'),
      });
    });

    webContents.on('did-navigate-in-page', (_, url) => {
      this.sendToRenderer('browser:navigated', {
        viewId: id,
        url,
        canGoBack: webContents.canGoBack(),
        canGoForward: webContents.canGoForward(),
        isSecure: url.startsWith('https://'),
      });
    });

    // Title update
    webContents.on('page-title-updated', (_, title) => {
      this.sendToRenderer('browser:title', {
        viewId: id,
        title,
      });
    });

    // Favicon update
    webContents.on('page-favicon-updated', (_, favicons) => {
      this.sendToRenderer('browser:favicon', {
        viewId: id,
        faviconUrl: favicons.length > 0 ? favicons[0] : null,
      });
    });

    // Error handling
    webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL, isMainFrame) => {
      // Only report main frame errors to UI
      if (isMainFrame) {
        this.sendToRenderer('browser:error', {
          viewId: id,
          errorCode,
          errorDescription,
          failedUrl: validatedURL,
        });
      } else {
        console.warn(`[BrowserService] Sub-frame load error: ${errorDescription}`);
      }
    });

    // Certificate error handling (for development - production should be stricter)
    webContents.on('certificate-error', (event, url, error, certificate, callback) => {
      console.warn(`[BrowserService] Certificate error for ${url}: ${error}`);
      // In production, you would want to show a warning to the user
      // For development, we proceed with caution
      callback(false); // Don't ignore certificate errors by default
    });

    // New window handling (prevent popups)
    webContents.setWindowOpenHandler(({ url }) => {
      console.log(`[BrowserService] Window open blocked, loading in current view: ${url}`);
      // Load in current view instead of opening new window
      this.loadURLInternal(view, url).catch((error) => {
        console.error(`[BrowserService] Failed to load popup URL: ${error.message}`);
      });
      return { action: 'deny' };
    });

    // Permission handling
    webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      const allowedPermissions = [
        'fullscreen',
        'pointerLock',
        'clipboard-read',
        'clipboard-sanitized-write',
      ];

      const granted = allowedPermissions.includes(permission);
      console.log(`[BrowserService] Permission ${permission}: ${granted ? 'granted' : 'denied'}`);
      callback(granted);
    });
  }

  /**
   * Send event to renderer process
   */
  private sendToRenderer(channel: BrowserEventType, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

// Singleton instance
let browserServiceInstance: BrowserService | null = null;

export function getBrowserService(): BrowserService {
  if (!browserServiceInstance) {
    browserServiceInstance = new BrowserService();
  }
  return browserServiceInstance;
}

export function resetBrowserService(): void {
  if (browserServiceInstance) {
    browserServiceInstance.destroyAllViews();
    browserServiceInstance = null;
  }
}
```

---

### R2: IPC Handlers

#### 2.1 Browser IPC Handlers

```typescript
// packages/desktop/src/main/ipc/browserHandlers.ts

import { ipcMain, BrowserWindow } from 'electron';
import { getBrowserService, ViewBounds, CreateViewOptions } from '../services/BrowserService';

/**
 * Register all browser-related IPC handlers
 */
export function registerBrowserHandlers(mainWindow: BrowserWindow): void {
  const browserService = getBrowserService();
  browserService.initialize(mainWindow);

  // Create a view
  ipcMain.handle('browser:createView', async (_, id: string, options?: CreateViewOptions) => {
    try {
      return { success: true, viewId: browserService.createView(id, options) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Destroy a view
  ipcMain.handle('browser:destroyView', async (_, id: string) => {
    try {
      browserService.destroyView(id);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Set active view
  ipcMain.handle('browser:setActiveView', async (_, id: string) => {
    try {
      const result = browserService.setActiveView(id);
      return { success: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Get active view ID
  ipcMain.handle('browser:getActiveViewId', async () => {
    return { success: true, viewId: browserService.getActiveViewId() };
  });

  // Update bounds
  ipcMain.handle('browser:setBounds', async (_, bounds: ViewBounds) => {
    try {
      browserService.setBounds(bounds);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Navigate to URL
  ipcMain.handle('browser:loadURL', async (_, id: string, url: string) => {
    try {
      await browserService.loadURL(id, url);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Go back
  ipcMain.handle('browser:goBack', async (_, id: string) => {
    try {
      await browserService.goBack(id);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Go forward
  ipcMain.handle('browser:goForward', async (_, id: string) => {
    try {
      await browserService.goForward(id);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Reload
  ipcMain.handle('browser:reload', async (_, id: string) => {
    try {
      await browserService.reload(id);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Stop
  ipcMain.handle('browser:stop', async (_, id: string) => {
    try {
      browserService.stop(id);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Get view state
  ipcMain.handle('browser:getViewState', async (_, id: string) => {
    try {
      const state = browserService.getViewState(id);
      return { success: true, state };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Set visibility
  ipcMain.handle('browser:setVisibility', async (_, id: string, visible: boolean) => {
    try {
      browserService.setViewVisibility(id, visible);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Get view count
  ipcMain.handle('browser:getViewCount', async () => {
    return { success: true, count: browserService.getViewCount() };
  });

  console.log('[BrowserHandlers] Registered');
}

/**
 * Unregister browser IPC handlers (for testing/cleanup)
 */
export function unregisterBrowserHandlers(): void {
  const channels = [
    'browser:createView',
    'browser:destroyView',
    'browser:setActiveView',
    'browser:getActiveViewId',
    'browser:setBounds',
    'browser:loadURL',
    'browser:goBack',
    'browser:goForward',
    'browser:reload',
    'browser:stop',
    'browser:getViewState',
    'browser:setVisibility',
    'browser:getViewCount',
  ];

  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }

  console.log('[BrowserHandlers] Unregistered');
}
```

---

### R3: Type Definitions

#### 3.1 Browser Types

```typescript
// packages/desktop/src/types/browser.ts

/**
 * View bounds for positioning
 */
export interface ViewBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Browser view state
 */
export interface BrowserViewState {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly isLoading: boolean;
  readonly loadingProgress: number;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly isSecure: boolean;
  readonly errorCode: number | null;
  readonly errorDescription: string | null;
}

/**
 * Options for creating a view
 */
export interface CreateViewOptions {
  readonly url?: string;
  readonly userAgent?: string;
  readonly partition?: string;
}

/**
 * IPC response wrapper
 */
export interface BrowserIPCResponse<T = void> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

/**
 * Loading event payload
 */
export interface BrowserLoadingEvent {
  readonly viewId: string;
  readonly isLoading: boolean;
}

/**
 * Navigation event payload
 */
export interface BrowserNavigatedEvent {
  readonly viewId: string;
  readonly url: string;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly isSecure: boolean;
}

/**
 * Title event payload
 */
export interface BrowserTitleEvent {
  readonly viewId: string;
  readonly title: string;
}

/**
 * Favicon event payload
 */
export interface BrowserFaviconEvent {
  readonly viewId: string;
  readonly faviconUrl: string | null;
}

/**
 * Progress event payload
 */
export interface BrowserProgressEvent {
  readonly viewId: string;
  readonly progress: number;
}

/**
 * Error event payload
 */
export interface BrowserErrorEvent {
  readonly viewId: string;
  readonly errorCode: number;
  readonly errorDescription: string;
  readonly failedUrl: string;
}
```

---

### R4: Security Requirements

#### 4.1 WebContentsView Security Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| nodeIntegration | false | Prevent web pages from accessing Node.js APIs |
| contextIsolation | true | Isolate preload scripts from web content |
| sandbox | true | Run renderer in sandboxed process |
| preload | undefined | No preload for browser views |
| webSecurity | true | Enforce same-origin policy |
| allowRunningInsecureContent | false | Block mixed content |

#### 4.2 URL Validation Rules

| Rule | Action |
|------|--------|
| Empty URL | Reject with error |
| `javascript:` scheme | Block (security) |
| `data:text/html` scheme | Block (XSS vector) |
| `vbscript:` scheme | Block (security) |
| No scheme | Add `https://` if looks like domain, else treat as search |
| Invalid URL structure | Reject with error |

#### 4.3 Permission Handling

| Permission | Default |
|------------|---------|
| fullscreen | Allow |
| pointerLock | Allow |
| clipboard-read | Allow |
| clipboard-sanitized-write | Allow |
| camera | Deny (future: prompt) |
| microphone | Deny (future: prompt) |
| geolocation | Deny (future: prompt) |
| notifications | Deny (future: prompt) |

---

### R5: Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| View creation time | <50ms | Performance.now() |
| Navigation command response | <100ms | IPC round-trip |
| Bounds update latency | <16ms | Frame budget (60fps) |
| Memory per view | <100MB baseline | Chrome DevTools |
| Event forwarding latency | <5ms | IPC channel timing |

---

### R6: Error Handling

#### 6.1 Error Types

```typescript
// packages/desktop/src/main/services/errors/BrowserErrors.ts

export class BrowserError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly viewId?: string
  ) {
    super(message);
    this.name = 'BrowserError';
  }
}

export class ViewNotFoundError extends BrowserError {
  constructor(viewId: string) {
    super(`Browser view not found: ${viewId}`, 'VIEW_NOT_FOUND', viewId);
    this.name = 'ViewNotFoundError';
  }
}

export class InvalidURLError extends BrowserError {
  constructor(url: string, viewId?: string) {
    super(`Invalid URL: ${url}`, 'INVALID_URL', viewId);
    this.name = 'InvalidURLError';
  }
}

export class NavigationError extends BrowserError {
  constructor(message: string, viewId: string, public readonly failedUrl: string) {
    super(message, 'NAVIGATION_ERROR', viewId);
    this.name = 'NavigationError';
  }
}

export class ServiceNotInitializedError extends BrowserError {
  constructor() {
    super('BrowserService not initialized', 'SERVICE_NOT_INITIALIZED');
    this.name = 'ServiceNotInitializedError';
  }
}
```

---

## Acceptance Criteria

### Service Initialization
- [ ] BrowserService initializes with main window
- [ ] Service prevents double initialization
- [ ] Service cleans up on window close
- [ ] Singleton pattern works correctly

### View Creation
- [ ] WebContentsView created with secure defaults
- [ ] Node integration disabled
- [ ] Context isolation enabled
- [ ] Sandbox enabled
- [ ] User agent set to Safari macOS
- [ ] Initial URL loads correctly
- [ ] Duplicate view ID handled gracefully

### View Management
- [ ] setActiveView adds view to window content
- [ ] setActiveView removes previous active view
- [ ] destroyView removes all listeners
- [ ] destroyView closes webContents
- [ ] destroyAllViews cleans up on shutdown
- [ ] View count tracked correctly

### Bounds
- [ ] setBounds updates view position
- [ ] Invalid bounds (0 width/height) rejected
- [ ] Bounds rounded to integers
- [ ] Active view receives bounds updates

### Navigation
- [ ] loadURL validates URLs
- [ ] Dangerous schemes blocked
- [ ] No-scheme URLs get https:// added
- [ ] Search queries redirect to Google
- [ ] goBack/goForward respect history
- [ ] reload refreshes page
- [ ] stop cancels loading

### Event Forwarding
- [ ] did-start-loading → browser:loading
- [ ] did-stop-loading → browser:loading
- [ ] did-navigate → browser:navigated
- [ ] page-title-updated → browser:title
- [ ] page-favicon-updated → browser:favicon
- [ ] did-fail-load → browser:error (main frame only)

### IPC Handlers
- [ ] All handlers registered
- [ ] All handlers return consistent response format
- [ ] Errors properly caught and returned
- [ ] Handlers can be unregistered for cleanup

### Security
- [ ] Certificate errors logged and handled
- [ ] New window popups blocked and loaded in-view
- [ ] Permissions handled with allowlist
- [ ] No XSS vectors in URL handling

### Performance
- [ ] View creation <50ms
- [ ] Navigation response <100ms
- [ ] No memory leaks (heap snapshot verification)

---

## Testing Strategy

### Unit Tests

```typescript
// packages/desktop/__tests__/services/BrowserService.test.ts

describe('BrowserService', () => {
  describe('URL Validation', () => {
    it('should add https:// to bare domains');
    it('should convert search queries to Google search');
    it('should block javascript: URLs');
    it('should block data:text/html URLs');
    it('should reject empty URLs');
    it('should handle URLs with existing scheme');
  });

  describe('View Lifecycle', () => {
    it('should create view with secure defaults');
    it('should track view in map');
    it('should destroy view and cleanup listeners');
    it('should handle destroying non-existent view');
  });

  describe('Active View Management', () => {
    it('should set active view');
    it('should remove previous active view');
    it('should apply bounds to active view');
  });
});
```

### Integration Tests

```typescript
// packages/desktop/__tests__/integration/browser.integration.test.ts

describe('Browser Integration', () => {
  it('should create view and load URL');
  it('should forward navigation events to renderer');
  it('should handle navigation commands');
  it('should cleanup on window close');
});
```

---

## File Structure

```
packages/desktop/src/
├── main/
│   ├── services/
│   │   ├── BrowserService.ts           # NEW: Core service
│   │   ├── errors/
│   │   │   └── BrowserErrors.ts        # NEW: Error types
│   │   └── index.ts                    # Update: Export BrowserService
│   ├── ipc/
│   │   ├── handlers.ts                 # Existing handlers
│   │   ├── browserHandlers.ts          # NEW: Browser IPC handlers
│   │   └── index.ts                    # Update: Export browser handlers
│   └── index.ts                        # Update: Register browser handlers
├── types/
│   ├── browser.ts                      # NEW: Browser types
│   └── index.ts                        # Update: Export browser types
└── preload/
    └── index.ts                        # Update: Extend with browser API (Spec 019)
```

---

## Dependencies

- **001** (project-foundation) - Required for Electron setup
- **007** (core-domain-layer) - Error patterns, entity patterns
- **008** (infrastructure-layer) - Service patterns

## Blocks

- **018** (browser-domain-layer-tabs) - Needs view management
- **019** (single-tab-browser-mvp) - Needs IPC handlers
- **020-031** (all browser features) - Foundation dependency

## Estimated Duration

2-3 days

## Flutter Reference

**Source**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/browser_screen.dart`

Key patterns replicated:
- Lines 204-298: InAppWebViewSettings → WebContentsView webPreferences
- Lines 300-324: Event handlers → webContents event listeners
- Lines 454-484: URL scheme handling → validateAndNormalizeUrl()
- Lines 228-229: User agent configuration (Safari macOS)

## Tech Decisions Update

After completing this spec, update `.speky/context/tech_decisions.md`:

```markdown
### 10. Browser Integration - WebContentsView Service (Spec 017)

| Decision | Value | Rationale |
|----------|-------|-----------|
| API | WebContentsView (Electron 30+) | Modern API, not deprecated BrowserView |
| Security Model | sandbox + contextIsolation | Maximum isolation from app |
| User Agent | Safari macOS | Best compatibility, avoid bot detection |
| Popup Handling | Deny + load in-view | No new windows, Arc-style behavior |
| Permission Model | Allowlist | Only safe permissions by default |
| URL Validation | Scheme validation + sanitization | Block XSS, enforce https |
```


## Implementation Notes

- **Testing Patterns:**
- Comprehensive WebContents lifecycle mocking with event simulation for navigation, loading states, and errors
- Mock factories for WebContentsView creation with proper cleanup and state management
- Error boundary testing with simulated WebContents failures and recovery scenarios
