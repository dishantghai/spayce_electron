# Phase 5: Session Persistence & Performance

> **Specs**: 029, 030, 031
> **Goal**: Production-ready browser with session persistence and optimized performance
> **Estimated Sessions**: 2-3 Claude Opus 4.5 sessions
> **Prerequisites**: Phase 4 complete (Specs 026-028)

---

## Phase Overview

Phase 5 adds session persistence (tabs survive app restart) and performance optimizations including tab hibernation for memory management.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 5 DELIVERABLES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 029: Session Persistence                     │    │
│  │                                                                      │    │
│  │  - Save tab state on app quit                                       │    │
│  │  - Restore tabs on app launch                                       │    │
│  │  - Handle crash recovery                                            │    │
│  │  - Optional: Multiple session slots                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 030: Tab Hibernation                         │    │
│  │                                                                      │    │
│  │  - Hibernate inactive tabs to save memory                           │    │
│  │  - Keep N most recent tabs active (default: 5)                      │    │
│  │  - Lazy load hibernated tabs on switch                              │    │
│  │  - Preserve scroll position on hibernate                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 031: Performance Optimization                │    │
│  │                                                                      │    │
│  │  - Debounce IPC state updates                                       │    │
│  │  - Batch DOM updates in tab bar                                     │    │
│  │  - Optimize re-renders with memoization                             │    │
│  │  - Memory usage monitoring and limits                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 029: Session Persistence

### Overview

Implement session persistence so that browser tabs are automatically saved when the app closes and restored when it reopens.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Save tab state on app quit | P0 |
| FR-2 | Restore tabs on app launch | P0 |
| FR-3 | Restore active tab selection | P0 |
| FR-4 | Handle partial restore on errors | P1 |
| FR-5 | Periodic auto-save (every 30s) | P1 |
| FR-6 | Clear session on demand | P2 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Session save <500ms | P1 |
| NFR-2 | Session restore <2s for 10 tabs | P1 |
| NFR-3 | Graceful degradation on corrupt data | P0 |

### Technical Design

#### Session Data Model

```typescript
// packages/core/src/domain/entities/BrowserSession.ts

export interface BrowserSession {
  readonly id: string;
  readonly tabs: SessionTab[];
  readonly activeTabId: string | null;
  readonly createdAt: Date;
  readonly isCurrent: boolean;
}

export interface SessionTab {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly faviconUrl: string | null;
  readonly originSpaceId: string | null;
  readonly originSpaceItemId: string | null;
  readonly position: number;
  readonly scrollPosition?: { x: number; y: number };
}
```

#### Session Service

```typescript
// packages/desktop/src/main/services/SessionService.ts

import { app } from 'electron';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { ITabsRepository, TabEntity } from '@spayce/core';
import { BrowserService } from './BrowserService';

export class SessionService {
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  constructor(
    private readonly browserService: BrowserService
  ) {}

  /**
   * Initialize session management
   */
  async initialize(): Promise<void> {
    // Restore previous session
    await this.restoreSession();

    // Set up auto-save
    this.startAutoSave();

    // Save on quit
    app.on('before-quit', async (event) => {
      event.preventDefault();
      await this.saveSession();
      app.exit(0);
    });
  }

  /**
   * Save current session to database
   */
  async saveSession(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const tabsRepo = serviceRegistry.get<ITabsRepository>(SERVICE_KEYS.TABS_REPOSITORY);
      const tabs = await tabsRepo.getAll();
      
      // Tabs are already persisted in the database
      // Just ensure they're marked with current positions and state
      console.log(`[Session] Saved ${tabs.length} tabs in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[Session] Failed to save session:', error);
    }
  }

  /**
   * Restore session from database
   */
  async restoreSession(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const tabsRepo = serviceRegistry.get<ITabsRepository>(SERVICE_KEYS.TABS_REPOSITORY);
      const tabs = await tabsRepo.getAll();
      
      if (tabs.length === 0) {
        // Create default tab if no session
        await this.createDefaultTab();
        return;
      }

      // Find active tab
      const activeTab = tabs.find(t => t.isActive) ?? tabs[0];

      // Restore only the first few tabs immediately (lazy load others)
      const EAGER_LOAD_COUNT = 3;
      const tabsToLoad = tabs.slice(0, EAGER_LOAD_COUNT);
      
      for (const tab of tabsToLoad) {
        await this.browserService.createView(tab.id, tab.url);
      }

      // Set active view
      if (activeTab) {
        // Ensure active tab's view exists
        if (!tabsToLoad.find(t => t.id === activeTab.id)) {
          await this.browserService.createView(activeTab.id, activeTab.url);
        }
        this.browserService.setActiveView(activeTab.id);
      }

      console.log(`[Session] Restored ${tabs.length} tabs (${tabsToLoad.length} eager) in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[Session] Failed to restore session:', error);
      // Create default tab on failure
      await this.createDefaultTab();
    }
  }

  /**
   * Create default tab for empty session
   */
  private async createDefaultTab(): Promise<void> {
    const tabsRepo = serviceRegistry.get<ITabsRepository>(SERVICE_KEYS.TABS_REPOSITORY);
    const tab = await tabsRepo.create({
      url: 'https://www.google.com',
      title: 'New Tab',
    });
    
    await this.browserService.createView(tab.id, tab.url);
    this.browserService.setActiveView(tab.id);
  }

  /**
   * Start periodic auto-save
   */
  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      this.saveSession();
    }, this.AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Clear session (delete all tabs)
   */
  async clearSession(): Promise<void> {
    const tabsRepo = serviceRegistry.get<ITabsRepository>(SERVICE_KEYS.TABS_REPOSITORY);
    const tabs = await tabsRepo.getAll();
    
    for (const tab of tabs) {
      this.browserService.destroyView(tab.id);
      await tabsRepo.delete(tab.id);
    }
    
    await this.createDefaultTab();
  }
}
```

#### Integration with Main Process

```typescript
// In packages/desktop/src/main/index.ts

import { SessionService } from './services/SessionService';
import { BrowserService } from './services/BrowserService';

let sessionService: SessionService;

async function initialize() {
  // ... existing initialization ...

  // Initialize browser service
  const browserService = new BrowserService();
  browserService.initialize(mainWindow);

  // Initialize session service
  sessionService = new SessionService(browserService);
  await sessionService.initialize();

  // Register IPC handlers with browserService
  registerBrowserHandlers(browserService);
  registerTabHandlers(browserService);
}
```

### Implementation Steps

1. **Create SessionService** with save/restore logic
2. **Add before-quit handler** for session save
3. **Implement restore on initialize**
4. **Add auto-save interval**
5. **Handle partial restore** on errors
6. **Add clearSession IPC handler**
7. **Write integration tests**

### Acceptance Criteria

- [ ] Tabs persist across app restart
- [ ] Active tab restored correctly
- [ ] Auto-save runs every 30 seconds
- [ ] Session save completes before quit
- [ ] Corrupt session handled gracefully
- [ ] New session has default tab

### Dependencies

- **Depends on**: Spec 021 (TabsRepository)
- **Blocks**: None

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/data/tab_manager.dart`

Lines 52-99: Tab persistence and restoration logic

---

## Spec 030: Tab Hibernation

### Overview

Implement tab hibernation to manage memory usage by destroying WebContentsView for inactive tabs while preserving their state.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Keep N most recent tabs active (default: 5) | P0 |
| FR-2 | Hibernate tabs when exceeding limit | P0 |
| FR-3 | Restore hibernated tab on switch | P0 |
| FR-4 | Preserve tab metadata during hibernation | P0 |
| FR-5 | Show loading state during restore | P1 |
| FR-6 | Configurable active tab limit | P2 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Hibernation reduces memory by ~100MB per tab | P1 |
| NFR-2 | Tab restore <1s | P1 |
| NFR-3 | No visible flicker on restore | P2 |

### Technical Design

#### Hibernation Manager

```typescript
// packages/desktop/src/main/services/HibernationManager.ts

import { BrowserService } from './BrowserService';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { ITabsRepository } from '@spayce/core';

export class HibernationManager {
  private readonly MAX_ACTIVE_VIEWS = 5;
  private activeViewIds: string[] = []; // LRU order - most recent first

  constructor(private readonly browserService: BrowserService) {}

  /**
   * Track view access for LRU ordering
   */
  onViewAccessed(viewId: string): void {
    // Remove from current position
    this.activeViewIds = this.activeViewIds.filter(id => id !== viewId);
    // Add to front (most recent)
    this.activeViewIds.unshift(viewId);
    
    // Hibernate excess views
    this.enforceLimit();
  }

  /**
   * Enforce active view limit
   */
  private enforceLimit(): void {
    while (this.activeViewIds.length > this.MAX_ACTIVE_VIEWS) {
      const viewIdToHibernate = this.activeViewIds.pop();
      if (viewIdToHibernate) {
        this.hibernateView(viewIdToHibernate);
      }
    }
  }

  /**
   * Hibernate a view (destroy WebContentsView but keep tab data)
   */
  private hibernateView(viewId: string): void {
    console.log(`[Hibernation] Hibernating view: ${viewId}`);
    this.browserService.destroyView(viewId);
  }

  /**
   * Restore a hibernated view
   */
  async restoreView(viewId: string): Promise<void> {
    const tabsRepo = serviceRegistry.get<ITabsRepository>(SERVICE_KEYS.TABS_REPOSITORY);
    const tab = await tabsRepo.getById(viewId);
    
    if (!tab) {
      console.error(`[Hibernation] Tab not found: ${viewId}`);
      return;
    }

    console.log(`[Hibernation] Restoring view: ${viewId}`);
    
    // Create new WebContentsView
    await this.browserService.createView(viewId, tab.url);
    
    // Track as active
    this.onViewAccessed(viewId);
  }

  /**
   * Check if a view is active (not hibernated)
   */
  isViewActive(viewId: string): boolean {
    return this.browserService.hasView(viewId);
  }

  /**
   * Get memory usage estimate
   */
  getMemoryStats(): { activeViews: number; hibernatedTabs: number } {
    return {
      activeViews: this.activeViewIds.length,
      hibernatedTabs: 0, // Would need to query tab count
    };
  }

  /**
   * Remove view from tracking
   */
  onViewDestroyed(viewId: string): void {
    this.activeViewIds = this.activeViewIds.filter(id => id !== viewId);
  }
}
```

#### BrowserService Extension

```typescript
// Add to BrowserService

class BrowserService {
  // ... existing code ...

  /**
   * Check if a view exists
   */
  hasView(id: string): boolean {
    return this.views.has(id);
  }

  /**
   * Switch to a view, restoring if hibernated
   */
  async switchToView(id: string, hibernationManager: HibernationManager): Promise<void> {
    if (!this.hasView(id)) {
      // View is hibernated, restore it
      await hibernationManager.restoreView(id);
    }
    
    this.setActiveView(id);
    hibernationManager.onViewAccessed(id);
  }
}
```

#### Tab Store Integration

```typescript
// In tabStore.ts - update switchTab

switchTab: async (tabId) => {
  const { tabs, activeTabId } = get();
  
  if (tabId === activeTabId) return;
  if (!tabs.find(t => t.id === tabId)) return;

  // Show loading state while restoring
  set((state) => ({
    tabs: state.tabs.map(t =>
      t.id === tabId ? { ...t, isLoading: true } : t
    ),
    activeTabId: tabId,
  }));

  try {
    // This will restore the view if hibernated
    await window.electronAPI.tabs.switch(tabId);
    
    // Clear loading state
    set((state) => ({
      tabs: state.tabs.map(t =>
        t.id === tabId ? { ...t, isLoading: false } : t
      ),
    }));
  } catch (error) {
    console.error('Failed to switch tab:', error);
    set({ activeTabId });
  }
},
```

### Implementation Steps

1. **Create HibernationManager** class
2. **Add hasView method** to BrowserService
3. **Implement switchToView** with restoration
4. **Update tab switch IPC** to use HibernationManager
5. **Track LRU order** on view access
6. **Add loading state** during restoration
7. **Write memory usage tests**

### Acceptance Criteria

- [ ] Only 5 most recent tabs have active views
- [ ] Switching to hibernated tab restores it
- [ ] Restoration completes within 1 second
- [ ] Loading indicator shows during restore
- [ ] Tab data preserved during hibernation
- [ ] Memory reduced when tabs hibernated

### Dependencies

- **Depends on**: Spec 017 (BrowserService), Spec 029 (SessionService)
- **Blocks**: None

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/data/tab_manager.dart`

This feature doesn't have a direct equivalent in Flutter (Flutter uses native WebView), but the memory management diagram in the Electron architecture research describes the pattern.

---

## Spec 031: Performance Optimization

### Overview

Implement performance optimizations for smooth browser operation including debounced updates, memoization, and efficient rendering.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Debounce frequent IPC updates | P0 |
| FR-2 | Batch tab bar re-renders | P0 |
| FR-3 | Memoize expensive computations | P1 |
| FR-4 | Monitor memory usage | P2 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Tab switch <500ms | P0 |
| NFR-2 | UI responsive during loading | P0 |
| NFR-3 | Memory <1GB with 10 tabs | P1 |

### Technical Design

#### Debounced IPC Updates

```typescript
// packages/react-ui/src/utils/debounce.ts

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
```

#### Optimized Tab Store Updates

```typescript
// In tabStore.ts - batch updates

import { debounce } from '../utils/debounce';

// Debounced state sync to reduce IPC calls
const debouncedSync = debounce(async (tabs: TabEntity[]) => {
  // Sync tab positions to backend
  await window.electronAPI.tabs.reorder(tabs.map(t => t.id));
}, 500);

// Batch updates for rapid changes
let pendingUpdates: Map<string, Partial<TabEntity>> = new Map();
let updateTimeout: ReturnType<typeof setTimeout> | null = null;

const processPendingUpdates = () => {
  const updates = Array.from(pendingUpdates.entries());
  pendingUpdates.clear();
  updateTimeout = null;
  
  set((state) => ({
    tabs: state.tabs.map(tab => {
      const update = updates.find(([id]) => id === tab.id);
      return update ? { ...tab, ...update[1] } : tab;
    }),
  }));
};

const batchUpdate = (tabId: string, updates: Partial<TabEntity>) => {
  pendingUpdates.set(tabId, {
    ...pendingUpdates.get(tabId),
    ...updates,
  });
  
  if (!updateTimeout) {
    updateTimeout = setTimeout(processPendingUpdates, 16); // ~60fps
  }
};

// Use batchUpdate in IPC event handlers
window.electronAPI.browser.onProgress(({ viewId, progress }) => {
  batchUpdate(viewId, { loadingProgress: progress });
});
```

#### Memoized Components

```tsx
// packages/react-ui/src/components/browser/TabBar.tsx

import { memo, useMemo } from 'react';

// Memoize individual tab items
export const TabItem = memo(function TabItem({ tab, isActive, ... }: TabItemProps) {
  // ... implementation
});

// Memoize tab bar with shallow comparison
export const TabBar = memo(function TabBar() {
  const { tabs, activeTabId } = useTabStore(
    // Selector with shallow equality
    (state) => ({ tabs: state.tabs, activeTabId: state.activeTabId }),
    shallow
  );

  // Memoize filtered/sorted tabs if needed
  const sortedTabs = useMemo(
    () => [...tabs].sort((a, b) => a.position - b.position),
    [tabs]
  );

  return (
    <div className={styles.tabBar}>
      {sortedTabs.map(tab => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          // ... other props
        />
      ))}
    </div>
  );
});
```

#### Memory Monitoring

```typescript
// packages/desktop/src/main/services/MemoryMonitor.ts

import { app } from 'electron';

export class MemoryMonitor {
  private readonly WARNING_THRESHOLD = 800 * 1024 * 1024; // 800MB
  private readonly CRITICAL_THRESHOLD = 1024 * 1024 * 1024; // 1GB
  private checkInterval: NodeJS.Timeout | null = null;

  start(hibernationManager: HibernationManager): void {
    this.checkInterval = setInterval(() => {
      this.checkMemory(hibernationManager);
    }, 30000); // Check every 30 seconds
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private checkMemory(hibernationManager: HibernationManager): void {
    const memoryInfo = process.memoryUsage();
    const heapUsed = memoryInfo.heapUsed;

    console.log(`[Memory] Heap used: ${Math.round(heapUsed / 1024 / 1024)}MB`);

    if (heapUsed > this.CRITICAL_THRESHOLD) {
      console.warn('[Memory] Critical threshold exceeded, forcing hibernation');
      // Force hibernate oldest tabs
      this.forceHibernation(hibernationManager);
    } else if (heapUsed > this.WARNING_THRESHOLD) {
      console.warn('[Memory] Warning threshold exceeded');
    }
  }

  private forceHibernation(hibernationManager: HibernationManager): void {
    // Reduce active tab limit temporarily
    // This would need integration with HibernationManager
  }

  getStats(): { heapUsed: number; heapTotal: number } {
    const info = process.memoryUsage();
    return {
      heapUsed: info.heapUsed,
      heapTotal: info.heapTotal,
    };
  }
}
```

#### IPC Event Throttling in Main Process

```typescript
// In BrowserService.ts - throttle frequent events

import { throttle } from '../utils/throttle';

// Throttle progress updates to 60fps
const throttledProgressUpdate = throttle((mainWindow, data) => {
  mainWindow.webContents.send('browser:progress', data);
}, 16);

view.webContents.on('did-start-loading', () => {
  // Loading start is important, don't throttle
  this.mainWindow?.webContents.send('browser:loading', {
    viewId: id,
    isLoading: true,
  });
});

// But progress updates can be throttled
view.webContents.on('did-update-loading-progress', (_, progress) => {
  throttledProgressUpdate(this.mainWindow, {
    viewId: id,
    progress,
  });
});
```

### Implementation Steps

1. **Create debounce/throttle utilities**
2. **Implement batched tab store updates**
3. **Add memoization** to tab components
4. **Throttle IPC events** in main process
5. **Create MemoryMonitor** service
6. **Integrate with HibernationManager**
7. **Add performance metrics logging**
8. **Write performance tests**

### Acceptance Criteria

- [ ] Progress updates don't cause UI jank
- [ ] Tab bar renders at 60fps
- [ ] Tab switch completes <500ms
- [ ] Memory stays under 1GB with 10 tabs
- [ ] UI responsive during heavy loading
- [ ] Console shows memory warnings when appropriate

### Dependencies

- **Depends on**: Spec 030 (HibernationManager)
- **Blocks**: None

---

## Phase 5 Summary

### Files Created/Modified

| Package | File | Action |
|---------|------|--------|
| desktop | `src/main/services/SessionService.ts` | Create |
| desktop | `src/main/services/HibernationManager.ts` | Create |
| desktop | `src/main/services/MemoryMonitor.ts` | Create |
| desktop | `src/main/services/BrowserService.ts` | Modify (hibernation support) |
| desktop | `src/main/index.ts` | Modify (initialize services) |
| react-ui | `src/utils/debounce.ts` | Create |
| react-ui | `src/stores/tabStore.ts` | Modify (batch updates) |
| react-ui | `src/components/browser/TabBar.tsx` | Modify (memoization) |
| react-ui | `src/components/browser/TabItem.tsx` | Modify (memo) |

### Phase 5 Completion Checklist

- [ ] Spec 029: Session Persistence complete
- [ ] Spec 030: Tab Hibernation complete
- [ ] Spec 031: Performance Optimization complete
- [ ] All unit tests passing
- [ ] Tabs persist across restart
- [ ] Inactive tabs hibernate correctly
- [ ] Memory usage under control
- [ ] UI stays responsive

### Next Phase

Proceed to **Phase 6: Advanced Features** (Stories F002-F020) for feature parity with Flutter Spayce.
