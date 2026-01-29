# Phase 2: Multi-Tab Browser

> **Specs**: 020, 021, 022
> **Goal**: Full multi-tab browser functionality with tab bar UI
> **Estimated Sessions**: 3-4 Claude Opus 4.5 sessions
> **Prerequisites**: Phase 1 complete (Specs 017-019)

---

## Phase Overview

Phase 2 adds multi-tab support with a tab bar UI component. Users will be able to create, switch between, and close multiple browser tabs.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 2 DELIVERABLES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 020: Tab Bar UI Component                    │    │
│  │                                                                      │    │
│  │  packages/react-ui/src/components/browser/TabBar.tsx                │    │
│  │  - Tab items with title, favicon, close button                      │    │
│  │  - Active tab indicator                                             │    │
│  │  - New tab button                                                   │    │
│  │  - Drag-and-drop reordering                                         │    │
│  │  - Scrollable when many tabs                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 021: Tab CRUD Operations                     │    │
│  │                                                                      │    │
│  │  packages/infrastructure/src/persistence/sqlite/SqliteTabsRepo.ts   │    │
│  │  packages/desktop/src/main/ipc/tabHandlers.ts                       │    │
│  │  - Create new tabs                                                  │    │
│  │  - Close tabs with adjacent activation                              │    │
│  │  - Switch between tabs                                              │    │
│  │  - Tab limit enforcement (max 20)                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 022: Tab State Management                    │    │
│  │                                                                      │    │
│  │  packages/react-ui/src/stores/tabStore.ts                           │    │
│  │  - Zustand store for tab UI state                                   │    │
│  │  - IndexedStack-style view switching                                │    │
│  │  - IPC event synchronization                                        │    │
│  │  - Optimistic updates                                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 020: Tab Bar UI Component

### Overview

Create the tab bar UI component that displays all open tabs with support for drag-and-drop reordering, matching the design from the Flutter Spayce app.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Display tabs with title and favicon | P0 |
| FR-2 | Visual indication of active tab | P0 |
| FR-3 | Close button on each tab (visible on hover/active) | P0 |
| FR-4 | New tab button (+ icon) | P0 |
| FR-5 | Click to switch tabs | P0 |
| FR-6 | Drag-and-drop to reorder tabs | P1 |
| FR-7 | Horizontal scroll when tabs overflow | P1 |
| FR-8 | Auto-scroll to keep active tab visible | P1 |
| FR-9 | Loading spinner for tabs in loading state | P1 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Follow design system tokens exactly | P0 |
| NFR-2 | Smooth hover and transition animations | P1 |
| NFR-3 | Tab switch visual feedback <50ms | P1 |

### Technical Design

#### File Structure

```
packages/react-ui/src/components/browser/
├── TabBar.tsx                    # Main tab bar component
├── TabBar.module.css             # Tab bar styles
├── TabItem.tsx                   # Individual tab component
├── TabItem.module.css            # Tab item styles
├── NewTabButton.tsx              # + button component
├── index.ts                      # Barrel export
```

#### TabBar Component

```tsx
// packages/react-ui/src/components/browser/TabBar.tsx

import { useRef, useEffect, useCallback } from 'react';
import { useTabStore } from '../../stores/tabStore';
import { TabItem } from './TabItem';
import { NewTabButton } from './NewTabButton';
import styles from './TabBar.module.css';

export function TabBar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tabs, activeTabId, createTab, switchTab, closeTab, reorderTabs } = useTabStore();

  // Auto-scroll to active tab
  useEffect(() => {
    if (!scrollRef.current || !activeTabId) return;
    
    const activeElement = scrollRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTabId]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    e.dataTransfer.setData('text/plain', tabId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    const sourceTabId = e.dataTransfer.getData('text/plain');
    if (sourceTabId && sourceTabId !== targetTabId) {
      const sourceIndex = tabs.findIndex(t => t.id === sourceTabId);
      const targetIndex = tabs.findIndex(t => t.id === targetTabId);
      if (sourceIndex !== -1 && targetIndex !== -1) {
        reorderTabs(sourceIndex, targetIndex);
      }
    }
  }, [tabs, reorderTabs]);

  return (
    <div className={styles.tabBar}>
      {/* New Tab Button - Fixed position */}
      <NewTabButton onClick={() => createTab()} />
      
      {/* Scrollable Tabs Area */}
      <div ref={scrollRef} className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSelect={() => switchTab(tab.id)}
            onClose={() => closeTab(tab.id)}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, tab.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### TabBar Styles

```css
/* packages/react-ui/src/components/browser/TabBar.module.css */

.tabBar {
  display: flex;
  align-items: stretch;
  height: 40px;
  background-color: var(--color-bg-sidebar);
  border-bottom: 1px solid var(--color-border-subtle);
  user-select: none;
}

.tabsContainer {
  display: flex;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none; /* Firefox */
}

.tabsContainer::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
```

#### TabItem Component

```tsx
// packages/react-ui/src/components/browser/TabItem.tsx

import { useState, memo } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { TabEntity } from '@spayce/core';
import styles from './TabItem.module.css';

interface TabItemProps {
  tab: TabEntity;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const TabItem = memo(function TabItem({
  tab,
  isActive,
  onSelect,
  onClose,
  onDragStart,
  onDragOver,
  onDrop,
}: TabItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      data-tab-id={tab.id}
      className={`${styles.tabItem} ${isActive ? styles.active : ''}`}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Favicon or Loading Spinner */}
      <div className={styles.icon}>
        {tab.isLoading ? (
          <Loader2 size={16} className={styles.spinner} />
        ) : tab.faviconUrl ? (
          <img 
            src={tab.faviconUrl} 
            alt="" 
            className={styles.favicon}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className={styles.defaultIcon} />
        )}
      </div>

      {/* Title */}
      <span className={styles.title} title={tab.title}>
        {tab.title || 'New Tab'}
      </span>

      {/* Close Button */}
      {(isHovered || isActive) && (
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close tab"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
});
```

#### TabItem Styles

```css
/* packages/react-ui/src/components/browser/TabItem.module.css */

.tabItem {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 120px;
  max-width: 200px;
  padding: 0 var(--spacing-sm);
  padding-right: var(--spacing-xs);
  cursor: pointer;
  transition: background-color var(--duration-hover) ease;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  position: relative;
}

.tabItem:hover {
  background-color: var(--color-bg-accent);
}

.tabItem.active {
  background-color: var(--color-bg-surface);
}

.tabItem.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-primary);
}

.icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.favicon {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.defaultIcon {
  width: 16px;
  height: 16px;
  background-color: var(--color-text-muted);
  border-radius: 2px;
  opacity: 0.5;
}

.spinner {
  animation: spin 1s linear infinite;
  color: var(--color-text-muted);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tabItem.active .title {
  color: var(--color-text-primary);
}

.closeButton {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-xs);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--duration-quick) ease;
}

.closeButton:hover {
  background-color: var(--color-border-dark);
  color: var(--color-text-primary);
}
```

### Implementation Steps

1. **Create TabBar component** with scrollable container
2. **Create TabItem component** with all states (active, hover, loading)
3. **Create NewTabButton component**
4. **Add drag-and-drop functionality** for reordering
5. **Implement auto-scroll** to active tab
6. **Style with CSS Modules** using design tokens
7. **Add keyboard accessibility** (Tab, Enter, Delete)
8. **Write component tests**

### Acceptance Criteria

- [ ] Tabs display with title and favicon
- [ ] Active tab has visual indicator (top border + background)
- [ ] Close button visible on hover and active tabs
- [ ] New tab button creates new tab
- [ ] Clicking tab switches to it
- [ ] Drag-and-drop reorders tabs
- [ ] Tab bar scrolls horizontally when needed
- [ ] Active tab auto-scrolls into view
- [ ] Loading spinner shows during page load
- [ ] All design tokens used correctly

### Dependencies

- **Depends on**: Spec 019 (browser area integration)
- **Blocks**: Spec 022 (state management integration)

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/tabbed_browser_screen.dart`

Key patterns:
- Lines 188-243: Tab bar build method
- Lines 754-886: TabItem widget
- Lines 946-1147: DraggableTabList widget

### HiFi Design Reference

- `project_ops/HIFI_UI_DESIGN_SCREENS/Browser Tab Bar.png`

---

## Spec 021: Tab CRUD Operations

### Overview

Implement the tab CRUD (Create, Read, Update, Delete) operations in the infrastructure layer with SQLite persistence and IPC handlers.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Create new tab with default URL (google.com) | P0 |
| FR-2 | Create tab with specific URL and metadata | P0 |
| FR-3 | Close tab and activate adjacent tab | P0 |
| FR-4 | Switch between tabs | P0 |
| FR-5 | Enforce tab limit (max 20) with LRU eviction | P1 |
| FR-6 | Duplicate detection by Space item ID | P1 |
| FR-7 | Duplicate detection by URL | P1 |
| FR-8 | Reorder tabs | P1 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Tab operations <100ms | P1 |
| NFR-2 | Atomic database transactions | P0 |

### Technical Design

#### File Structure

```
packages/infrastructure/src/
├── persistence/
│   └── sqlite/
│       ├── SqliteTabsRepository.ts    # NEW
│       └── migrations/
│           └── 002_browser_tabs.sql   # NEW
├── di/
│   └── ServiceRegistry.ts             # Add TABS_REPOSITORY key
└── bootstrap/
    └── ServiceBootstrap.ts            # Register tabs repository

packages/desktop/src/main/
├── ipc/
│   └── tabHandlers.ts                 # NEW: Tab IPC handlers
└── index.ts                           # Register tab handlers
```

#### Database Migration

```sql
-- packages/infrastructure/src/persistence/sqlite/migrations/002_browser_tabs.sql

CREATE TABLE IF NOT EXISTS browser_tabs (
  id TEXT PRIMARY KEY,
  tab_type TEXT NOT NULL DEFAULT 'web',
  url TEXT NOT NULL,
  title TEXT,
  favicon_url TEXT,
  origin_space_id TEXT,
  origin_space_item_id TEXT,
  is_tracked INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 0,
  is_loading INTEGER NOT NULL DEFAULT 0,
  loading_progress REAL NOT NULL DEFAULT 0,
  can_go_back INTEGER NOT NULL DEFAULT 0,
  can_go_forward INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_accessed_at INTEGER,
  FOREIGN KEY (origin_space_id) REFERENCES spaces(id) ON DELETE SET NULL,
  FOREIGN KEY (origin_space_item_id) REFERENCES space_items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_browser_tabs_position ON browser_tabs(position);
CREATE INDEX IF NOT EXISTS idx_browser_tabs_space_item ON browser_tabs(origin_space_item_id);
CREATE INDEX IF NOT EXISTS idx_browser_tabs_active ON browser_tabs(is_active);
```

#### SqliteTabsRepository

```typescript
// packages/infrastructure/src/persistence/sqlite/SqliteTabsRepository.ts

import type Database from 'better-sqlite3';
import type {
  ITabsRepository,
  TabEntity,
  CreateTabInput,
  UpdateTabInput,
} from '@spayce/core';
import { v4 as uuid } from 'uuid';

interface TabRow {
  id: string;
  tab_type: string;
  url: string;
  title: string | null;
  favicon_url: string | null;
  origin_space_id: string | null;
  origin_space_item_id: string | null;
  is_tracked: number;
  is_active: number;
  is_loading: number;
  loading_progress: number;
  can_go_back: number;
  can_go_forward: number;
  position: number;
  created_at: number;
  updated_at: number;
  last_accessed_at: number | null;
}

export class SqliteTabsRepository implements ITabsRepository {
  constructor(private readonly db: Database.Database) {}

  private mapRowToEntity(row: TabRow): TabEntity {
    return {
      id: row.id,
      tabType: row.tab_type as 'web' | 'note' | 'localFile',
      url: row.url,
      title: row.title ?? 'New Tab',
      faviconUrl: row.favicon_url,
      originSpaceId: row.origin_space_id,
      originSpaceItemId: row.origin_space_item_id,
      isTracked: Boolean(row.is_tracked),
      isActive: Boolean(row.is_active),
      isLoading: Boolean(row.is_loading),
      loadingProgress: row.loading_progress,
      canGoBack: Boolean(row.can_go_back),
      canGoForward: Boolean(row.can_go_forward),
      position: row.position,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : null,
    };
  }

  async getAll(): Promise<TabEntity[]> {
    const rows = this.db.prepare(`
      SELECT * FROM browser_tabs ORDER BY position ASC
    `).all() as TabRow[];
    return rows.map(this.mapRowToEntity);
  }

  async getById(id: string): Promise<TabEntity | null> {
    const row = this.db.prepare(`
      SELECT * FROM browser_tabs WHERE id = ?
    `).get(id) as TabRow | undefined;
    return row ? this.mapRowToEntity(row) : null;
  }

  async getActive(): Promise<TabEntity | null> {
    const row = this.db.prepare(`
      SELECT * FROM browser_tabs WHERE is_active = 1 LIMIT 1
    `).get() as TabRow | undefined;
    return row ? this.mapRowToEntity(row) : null;
  }

  async getBySpaceItemId(spaceItemId: string): Promise<TabEntity | null> {
    const row = this.db.prepare(`
      SELECT * FROM browser_tabs WHERE origin_space_item_id = ?
    `).get(spaceItemId) as TabRow | undefined;
    return row ? this.mapRowToEntity(row) : null;
  }

  async getByUrl(url: string): Promise<TabEntity | null> {
    // Normalize URL for comparison
    const normalized = this.normalizeUrl(url);
    const rows = this.db.prepare(`
      SELECT * FROM browser_tabs
    `).all() as TabRow[];
    
    const matching = rows.find(row => this.normalizeUrl(row.url) === normalized);
    return matching ? this.mapRowToEntity(matching) : null;
  }

  private normalizeUrl(url: string): string {
    let normalized = url.toLowerCase().trim();
    normalized = normalized.replace(/^https?:\/\//, '');
    if (normalized.startsWith('www.')) {
      normalized = normalized.substring(4);
    }
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    const hashIndex = normalized.indexOf('#');
    if (hashIndex !== -1) {
      normalized = normalized.substring(0, hashIndex);
    }
    return normalized;
  }

  async create(input: CreateTabInput): Promise<TabEntity> {
    const now = Date.now();
    const id = uuid();
    
    // Get next position
    const maxPos = this.db.prepare(`
      SELECT COALESCE(MAX(position), -1) as max_pos FROM browser_tabs
    `).get() as { max_pos: number };
    const position = maxPos.max_pos + 1;

    this.db.prepare(`
      INSERT INTO browser_tabs (
        id, tab_type, url, title, favicon_url,
        origin_space_id, origin_space_item_id, is_tracked,
        is_active, position, created_at, updated_at, last_accessed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(
      id,
      input.tabType ?? 'web',
      input.url ?? 'https://www.google.com',
      input.title ?? 'New Tab',
      input.faviconUrl ?? null,
      input.originSpaceId ?? null,
      input.originSpaceItemId ?? null,
      input.originSpaceId ? 1 : 0,
      position,
      now,
      now,
      now
    );

    // Deactivate other tabs
    this.db.prepare(`
      UPDATE browser_tabs SET is_active = 0 WHERE id != ?
    `).run(id);

    return (await this.getById(id))!;
  }

  async update(input: UpdateTabInput): Promise<TabEntity> {
    const now = Date.now();
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (input.url !== undefined) {
      updates.push('url = ?');
      values.push(input.url);
    }
    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }
    if (input.faviconUrl !== undefined) {
      updates.push('favicon_url = ?');
      values.push(input.faviconUrl);
    }
    if (input.isTracked !== undefined) {
      updates.push('is_tracked = ?');
      values.push(input.isTracked ? 1 : 0);
    }
    if (input.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(input.isActive ? 1 : 0);
    }
    if (input.isLoading !== undefined) {
      updates.push('is_loading = ?');
      values.push(input.isLoading ? 1 : 0);
    }
    if (input.loadingProgress !== undefined) {
      updates.push('loading_progress = ?');
      values.push(input.loadingProgress);
    }
    if (input.canGoBack !== undefined) {
      updates.push('can_go_back = ?');
      values.push(input.canGoBack ? 1 : 0);
    }
    if (input.canGoForward !== undefined) {
      updates.push('can_go_forward = ?');
      values.push(input.canGoForward ? 1 : 0);
    }
    if (input.position !== undefined) {
      updates.push('position = ?');
      values.push(input.position);
    }
    if (input.lastAccessedAt !== undefined) {
      updates.push('last_accessed_at = ?');
      values.push(input.lastAccessedAt?.getTime() ?? null);
    }

    values.push(input.id);

    this.db.prepare(`
      UPDATE browser_tabs SET ${updates.join(', ')} WHERE id = ?
    `).run(...values);

    return (await this.getById(input.id))!;
  }

  async delete(id: string): Promise<void> {
    const tab = await this.getById(id);
    if (!tab) return;

    const wasActive = tab.isActive;
    const position = tab.position;

    // Delete the tab
    this.db.prepare(`DELETE FROM browser_tabs WHERE id = ?`).run(id);

    // Reorder remaining tabs
    this.db.prepare(`
      UPDATE browser_tabs SET position = position - 1 WHERE position > ?
    `).run(position);

    // If deleted tab was active, activate adjacent tab
    if (wasActive) {
      const tabs = await this.getAll();
      if (tabs.length > 0) {
        const newActiveIndex = Math.min(position, tabs.length - 1);
        await this.setActive(tabs[newActiveIndex].id);
      }
    }
  }

  async setActive(id: string): Promise<void> {
    const now = Date.now();
    
    // Deactivate all tabs
    this.db.prepare(`UPDATE browser_tabs SET is_active = 0`).run();
    
    // Activate the specified tab
    this.db.prepare(`
      UPDATE browser_tabs SET is_active = 1, last_accessed_at = ? WHERE id = ?
    `).run(now, id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    const transaction = this.db.transaction(() => {
      orderedIds.forEach((id, index) => {
        this.db.prepare(`
          UPDATE browser_tabs SET position = ? WHERE id = ?
        `).run(index, id);
      });
    });
    transaction();
  }

  async count(): Promise<number> {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM browser_tabs
    `).get() as { count: number };
    return result.count;
  }

  async deleteOldestInactive(): Promise<void> {
    const oldest = this.db.prepare(`
      SELECT id FROM browser_tabs 
      WHERE is_active = 0 
      ORDER BY last_accessed_at ASC, created_at ASC 
      LIMIT 1
    `).get() as { id: string } | undefined;

    if (oldest) {
      await this.delete(oldest.id);
    }
  }
}
```

#### Tab IPC Handlers

```typescript
// packages/desktop/src/main/ipc/tabHandlers.ts

import { ipcMain } from 'electron';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { TabsFacade } from '@spayce/core/application';
import { BrowserService } from '../services/BrowserService';

export function registerTabHandlers(browserService: BrowserService): void {
  const tabsFacade = serviceRegistry.get<TabsFacade>(SERVICE_KEYS.TABS_FACADE);

  // Get all tabs
  ipcMain.handle('tabs:getAll', async () => {
    const result = await tabsFacade.getTabs();
    return result;
  });

  // Get active tab
  ipcMain.handle('tabs:getActive', async () => {
    const result = await tabsFacade.getActiveTab();
    return result;
  });

  // Create new tab
  ipcMain.handle('tabs:create', async (_, input?: {
    url?: string;
    title?: string;
    originSpaceId?: string;
    originSpaceItemId?: string;
    faviconUrl?: string;
  }) => {
    const result = await tabsFacade.createTab(input ?? {});
    
    if (result.ok) {
      // Create corresponding WebContentsView
      browserService.createView(result.value.id, result.value.url);
      browserService.setActiveView(result.value.id);
    }
    
    return result;
  });

  // Close tab
  ipcMain.handle('tabs:close', async (_, tabId: string) => {
    // Destroy WebContentsView first
    browserService.destroyView(tabId);
    
    const result = await tabsFacade.closeTab(tabId);
    
    // If closing was successful and there's still an active tab, show it
    if (result.ok) {
      const activeResult = await tabsFacade.getActiveTab();
      if (activeResult.ok && activeResult.value) {
        browserService.setActiveView(activeResult.value.id);
      }
    }
    
    return result;
  });

  // Switch to tab
  ipcMain.handle('tabs:switch', async (_, tabId: string) => {
    const result = await tabsFacade.switchTab(tabId);
    
    if (result.ok) {
      browserService.setActiveView(tabId);
    }
    
    return result;
  });

  // Update tab
  ipcMain.handle('tabs:update', async (_, input: {
    id: string;
    url?: string;
    title?: string;
    faviconUrl?: string;
    isTracked?: boolean;
  }) => {
    return tabsFacade.updateTab(input);
  });

  // Reorder tabs
  ipcMain.handle('tabs:reorder', async (_, orderedIds: string[]) => {
    const tabsRepo = serviceRegistry.get(SERVICE_KEYS.TABS_REPOSITORY);
    await tabsRepo.reorder(orderedIds);
    return { ok: true };
  });

  console.log('[Spayce] Tab IPC handlers registered');
}
```

### Implementation Steps

1. **Create database migration** for browser_tabs table
2. **Implement SqliteTabsRepository** with all methods
3. **Register repository** in ServiceRegistry and ServiceBootstrap
4. **Create tabHandlers.ts** with IPC handlers
5. **Register handlers** in main process
6. **Extend preload** with tabs API
7. **Write repository tests**
8. **Write IPC handler tests**

### Acceptance Criteria

- [ ] Can create new tabs via IPC
- [ ] Can close tabs with proper adjacent activation
- [ ] Can switch between tabs
- [ ] Tab limit (20) enforced with LRU eviction
- [ ] Duplicate tabs by Space item ID reuse existing tab
- [ ] Duplicate tabs by URL reuse existing tab
- [ ] Can reorder tabs
- [ ] All operations persist to SQLite
- [ ] WebContentsView lifecycle synced with tab CRUD

### Dependencies

- **Depends on**: Spec 017 (BrowserService), Spec 018 (domain layer)
- **Blocks**: Spec 022 (state sync)

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/data/tab_manager.dart`

Key patterns:
- Lines 47-99: Initialization and restore
- Lines 134-187: createTab method
- Lines 243-291: createTabFromSpace with duplicate detection
- Lines 310-343: closeTab with adjacent activation

---

## Spec 022: Tab State Management

### Overview

Create the Zustand store for tab state management in the renderer process with IPC synchronization and optimistic updates.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Store tab list state | P0 |
| FR-2 | Track active tab ID | P0 |
| FR-3 | Sync state with main process via IPC | P0 |
| FR-4 | Optimistic updates for UI responsiveness | P1 |
| FR-5 | Handle IPC events for state updates | P1 |
| FR-6 | Initialize from persisted state on mount | P1 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | State updates <16ms (60fps) | P1 |
| NFR-2 | No redundant re-renders | P1 |

### Technical Design

#### File Structure

```
packages/react-ui/src/
├── stores/
│   └── tabStore.ts                # Tab state management
└── hooks/
    └── useTabs.ts                 # Custom hook for tab operations
```

#### Tab Store

```typescript
// packages/react-ui/src/stores/tabStore.ts

import { create } from 'zustand';
import type { TabEntity } from '@spayce/core';

interface TabState {
  tabs: TabEntity[];
  activeTabId: string | null;
  isInitialized: boolean;
  
  // Derived getters
  getActiveTab: () => TabEntity | undefined;
  getTabById: (id: string) => TabEntity | undefined;
  
  // Actions
  initialize: () => Promise<void>;
  createTab: (options?: { url?: string; title?: string }) => Promise<TabEntity | null>;
  closeTab: (tabId: string) => Promise<void>;
  switchTab: (tabId: string) => Promise<void>;
  updateTab: (tabId: string, updates: Partial<TabEntity>) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => Promise<void>;
  
  // Internal state setters
  setTabs: (tabs: TabEntity[]) => void;
  setActiveTabId: (tabId: string | null) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  isInitialized: false,

  // Derived getters
  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find(t => t.id === activeTabId);
  },

  getTabById: (id) => {
    return get().tabs.find(t => t.id === id);
  },

  // Initialize from main process
  initialize: async () => {
    try {
      const result = await window.electronAPI.tabs.getAll();
      if (result.ok) {
        const tabs = result.value;
        const activeTab = tabs.find((t: TabEntity) => t.isActive);
        
        set({
          tabs,
          activeTabId: activeTab?.id ?? (tabs.length > 0 ? tabs[0].id : null),
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error('Failed to initialize tabs:', error);
      set({ isInitialized: true });
    }
  },

  // Create new tab
  createTab: async (options) => {
    try {
      const result = await window.electronAPI.tabs.create(options);
      
      if (result.ok) {
        const newTab = result.value;
        
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));
        
        return newTab;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to create tab:', error);
      return null;
    }
  },

  // Close tab
  closeTab: async (tabId) => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    
    if (tabIndex === -1) return;

    // Optimistic update
    const newTabs = tabs.filter(t => t.id !== tabId);
    let newActiveId = activeTabId;
    
    if (activeTabId === tabId && newTabs.length > 0) {
      // Activate adjacent tab
      const newIndex = Math.min(tabIndex, newTabs.length - 1);
      newActiveId = newTabs[newIndex].id;
    } else if (newTabs.length === 0) {
      newActiveId = null;
    }
    
    set({ tabs: newTabs, activeTabId: newActiveId });

    try {
      await window.electronAPI.tabs.close(tabId);
    } catch (error) {
      console.error('Failed to close tab:', error);
      // Rollback on failure
      await get().initialize();
    }
  },

  // Switch to tab
  switchTab: async (tabId) => {
    const { tabs, activeTabId } = get();
    
    if (tabId === activeTabId) return;
    if (!tabs.find(t => t.id === tabId)) return;

    // Optimistic update
    set({ activeTabId: tabId });

    try {
      await window.electronAPI.tabs.switch(tabId);
    } catch (error) {
      console.error('Failed to switch tab:', error);
      // Rollback on failure
      set({ activeTabId });
    }
  },

  // Update tab properties (from IPC events)
  updateTab: (tabId, updates) => {
    set((state) => ({
      tabs: state.tabs.map(tab =>
        tab.id === tabId
          ? { ...tab, ...updates }
          : tab
      ),
    }));
  },

  // Reorder tabs
  reorderTabs: async (fromIndex, toIndex) => {
    const { tabs } = get();
    
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= tabs.length) return;
    if (toIndex < 0 || toIndex > tabs.length) return;

    // Optimistic reorder
    const newTabs = [...tabs];
    const [movedTab] = newTabs.splice(fromIndex, 1);
    const adjustedIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
    newTabs.splice(adjustedIndex, 0, movedTab);
    
    set({ tabs: newTabs });

    try {
      await window.electronAPI.tabs.reorder(newTabs.map(t => t.id));
    } catch (error) {
      console.error('Failed to reorder tabs:', error);
      // Rollback on failure
      await get().initialize();
    }
  },

  // Internal setters
  setTabs: (tabs) => set({ tabs }),
  setActiveTabId: (activeTabId) => set({ activeTabId }),
}));

// Subscribe to IPC events for real-time updates
export function setupTabStoreListeners(): () => void {
  if (typeof window === 'undefined' || !window.electronAPI?.browser) {
    return () => {};
  }

  const unsubscribers: (() => void)[] = [];

  // Listen for tab state updates from browser events
  unsubscribers.push(
    window.electronAPI.browser.onTitle(({ viewId, title }) => {
      useTabStore.getState().updateTab(viewId, { title });
    })
  );

  unsubscribers.push(
    window.electronAPI.browser.onNavigated(({ viewId, url, canGoBack, canGoForward }) => {
      useTabStore.getState().updateTab(viewId, { url, canGoBack, canGoForward });
    })
  );

  unsubscribers.push(
    window.electronAPI.browser.onLoading(({ viewId, isLoading }) => {
      useTabStore.getState().updateTab(viewId, { isLoading });
    })
  );

  unsubscribers.push(
    window.electronAPI.browser.onProgress(({ viewId, progress }) => {
      useTabStore.getState().updateTab(viewId, { loadingProgress: progress });
    })
  );

  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
}
```

#### Preload Extension

```typescript
// packages/desktop/src/preload/index.ts (additions to electronAPI)

tabs: {
  getAll: () => ipcRenderer.invoke('tabs:getAll'),
  getActive: () => ipcRenderer.invoke('tabs:getActive'),
  create: (input?: { url?: string; title?: string; originSpaceId?: string; originSpaceItemId?: string }) =>
    ipcRenderer.invoke('tabs:create', input),
  close: (tabId: string) => ipcRenderer.invoke('tabs:close', tabId),
  switch: (tabId: string) => ipcRenderer.invoke('tabs:switch', tabId),
  update: (tabId: string, updates: any) => ipcRenderer.invoke('tabs:update', { id: tabId, ...updates }),
  reorder: (orderedIds: string[]) => ipcRenderer.invoke('tabs:reorder', orderedIds),
},
```

### Implementation Steps

1. **Create tabStore.ts** with Zustand store
2. **Add IPC event listeners** for real-time updates
3. **Create useTabs hook** for components
4. **Extend preload** with tabs API
5. **Integrate store** with TabBar component
6. **Add initialization** on app mount
7. **Test optimistic updates** and rollback
8. **Write store tests**

### Acceptance Criteria

- [ ] Tab store initializes from persisted state
- [ ] Create/close/switch update store optimistically
- [ ] IPC events update tab properties in real-time
- [ ] Reorder updates immediately with persistence
- [ ] Failed operations roll back state
- [ ] No redundant re-renders
- [ ] Tab bar reflects store state accurately

### Dependencies

- **Depends on**: Spec 020 (TabBar component), Spec 021 (IPC handlers)
- **Blocks**: Phase 3 (Navigation)

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/data/tab_manager.dart`

Key patterns:
- Lines 8-44: TabManagerState class
- Lines 46-108: TabManagerNotifier initialization
- Lines 345-362: switchToTab method

---

## Phase 2 Summary

### Files Created/Modified

| Package | File | Action |
|---------|------|--------|
| react-ui | `src/components/browser/TabBar.tsx` | Create |
| react-ui | `src/components/browser/TabBar.module.css` | Create |
| react-ui | `src/components/browser/TabItem.tsx` | Create |
| react-ui | `src/components/browser/TabItem.module.css` | Create |
| react-ui | `src/components/browser/NewTabButton.tsx` | Create |
| react-ui | `src/stores/tabStore.ts` | Create |
| infrastructure | `src/persistence/sqlite/SqliteTabsRepository.ts` | Create |
| infrastructure | `src/persistence/sqlite/migrations/002_browser_tabs.sql` | Create |
| infrastructure | `src/di/ServiceRegistry.ts` | Modify (add keys) |
| infrastructure | `src/bootstrap/ServiceBootstrap.ts` | Modify (register) |
| desktop | `src/main/ipc/tabHandlers.ts` | Create |
| desktop | `src/main/index.ts` | Modify (register handlers) |
| desktop | `src/preload/index.ts` | Modify (add tabs API) |

### Phase 2 Completion Checklist

- [ ] Spec 020: Tab Bar UI Component complete
- [ ] Spec 021: Tab CRUD Operations complete
- [ ] Spec 022: Tab State Management complete
- [ ] All unit tests passing
- [ ] Can create multiple tabs
- [ ] Can switch between tabs
- [ ] Can close tabs
- [ ] Tab state persists to database
- [ ] Tab bar displays correctly

### Next Phase

Proceed to **Phase 3: Navigation** (Specs 023-025) to add URL bar and navigation controls.
