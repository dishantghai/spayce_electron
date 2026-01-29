# Phase 3: Browser Navigation

> **Specs**: 023, 024, 025
> **Goal**: Complete navigation experience with URL bar and history
> **Estimated Sessions**: 2-3 Claude Opus 4.5 sessions
> **Prerequisites**: Phase 2 complete (Specs 020-022)

---

## Phase Overview

Phase 3 adds the navigation bar with URL input, back/forward/reload controls, and history management.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 3 DELIVERABLES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 023: Navigation Bar Component                │    │
│  │                                                                      │    │
│  │  packages/react-ui/src/components/browser/NavigationBar.tsx         │    │
│  │  - Back/Forward/Reload/Stop buttons                                 │    │
│  │  - URL bar slot                                                     │    │
│  │  - Add to Space button                                              │    │
│  │  - Responsive layout                                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 024: URL Bar with Validation                 │    │
│  │                                                                      │    │
│  │  packages/react-ui/src/components/browser/UrlBar.tsx                │    │
│  │  - URL input with validation                                        │    │
│  │  - Search fallback to Google                                        │    │
│  │  - Security indicator (HTTPS)                                       │    │
│  │  - Select all on focus                                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 025: History Management                      │    │
│  │                                                                      │    │
│  │  packages/core/src/domain/entities/HistoryEntry.ts                  │    │
│  │  packages/infrastructure/src/persistence/sqlite/HistoryRepo.ts      │    │
│  │  - Navigation history tracking                                      │    │
│  │  - Back/forward stack per tab                                       │    │
│  │  - History clearing                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 023: Navigation Bar Component

### Overview

Create the browser navigation bar with navigation controls, URL bar slot, and action buttons.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Back button (disabled when can't go back) | P0 |
| FR-2 | Forward button (disabled when can't go forward) | P0 |
| FR-3 | Reload/Stop button (toggles based on loading) | P0 |
| FR-4 | URL bar integration slot | P0 |
| FR-5 | "Add to Space" button | P0 |
| FR-6 | Keyboard shortcuts (Cmd+Left, Cmd+Right, Cmd+R) | P1 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Follow design system tokens | P0 |
| NFR-2 | Button state feedback <50ms | P1 |

### Technical Design

#### File Structure

```
packages/react-ui/src/components/browser/
├── NavigationBar.tsx             # Main nav bar component
├── NavigationBar.module.css      # Styles
├── NavButton.tsx                 # Reusable nav button
├── NavButton.module.css          # Button styles
```

#### NavigationBar Component

```tsx
// packages/react-ui/src/components/browser/NavigationBar.tsx

import { useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, X, Plus } from 'lucide-react';
import { NavButton } from './NavButton';
import { UrlBar } from './UrlBar';
import { useTabStore } from '../../stores/tabStore';
import { useBrowserStore } from '../../stores/browserUiStore';
import styles from './NavigationBar.module.css';

interface NavigationBarProps {
  onAddToSpace?: () => void;
}

export function NavigationBar({ onAddToSpace }: NavigationBarProps) {
  const { getActiveTab } = useTabStore();
  const { goBack, goForward, reload, stop, loadURL } = useBrowserStore();
  
  const activeTab = getActiveTab();
  const canGoBack = activeTab?.canGoBack ?? false;
  const canGoForward = activeTab?.canGoForward ?? false;
  const isLoading = activeTab?.isLoading ?? false;
  const currentUrl = activeTab?.url ?? '';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      
      if (isMod && e.key === 'ArrowLeft' && canGoBack) {
        e.preventDefault();
        goBack();
      } else if (isMod && e.key === 'ArrowRight' && canGoForward) {
        e.preventDefault();
        goForward();
      } else if (isMod && e.key === 'r') {
        e.preventDefault();
        if (isLoading) {
          stop();
        } else {
          reload();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, canGoForward, isLoading, goBack, goForward, reload, stop]);

  const handleUrlSubmit = useCallback((url: string) => {
    loadURL(url);
  }, [loadURL]);

  const handleReloadStop = useCallback(() => {
    if (isLoading) {
      stop();
    } else {
      reload();
    }
  }, [isLoading, reload, stop]);

  return (
    <div className={styles.navigationBar}>
      {/* Navigation Buttons */}
      <div className={styles.navButtons}>
        <NavButton
          icon={ChevronLeft}
          onClick={goBack}
          disabled={!canGoBack}
          tooltip="Back (⌘←)"
        />
        <NavButton
          icon={ChevronRight}
          onClick={goForward}
          disabled={!canGoForward}
          tooltip="Forward (⌘→)"
        />
        <NavButton
          icon={isLoading ? X : RotateCw}
          onClick={handleReloadStop}
          tooltip={isLoading ? 'Stop (Esc)' : 'Reload (⌘R)'}
          className={isLoading ? styles.stopButton : undefined}
        />
      </div>

      {/* URL Bar */}
      <div className={styles.urlBarContainer}>
        <UrlBar
          value={currentUrl}
          onSubmit={handleUrlSubmit}
          isLoading={isLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <NavButton
          icon={Plus}
          onClick={onAddToSpace}
          tooltip="Add to Space"
        />
      </div>
    </div>
  );
}
```

#### NavigationBar Styles

```css
/* packages/react-ui/src/components/browser/NavigationBar.module.css */

.navigationBar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  height: 48px;
  padding: 0 var(--spacing-md);
  padding-left: 32px; /* Account for traffic lights on macOS */
  background-color: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-subtle);
}

.navButtons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.urlBarContainer {
  flex: 1;
  min-width: 200px;
}

.actionButtons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.stopButton {
  color: var(--color-error);
}
```

#### NavButton Component

```tsx
// packages/react-ui/src/components/browser/NavButton.tsx

import { useState, memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './NavButton.module.css';

interface NavButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}

export const NavButton = memo(function NavButton({
  icon: Icon,
  onClick,
  disabled = false,
  tooltip,
  className,
}: NavButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`${styles.navButton} ${disabled ? styles.disabled : ''} ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={tooltip}
    >
      <Icon size={16} />
    </button>
  );
});
```

#### NavButton Styles

```css
/* packages/react-ui/src/components/browser/NavButton.module.css */

.navButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-quick) ease;
}

.navButton:hover:not(.disabled) {
  background-color: var(--color-bg-accent);
  color: var(--color-text-primary);
}

.navButton:active:not(.disabled) {
  transform: scale(0.95);
}

.navButton.disabled {
  color: var(--color-text-muted);
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Implementation Steps

1. **Create NavButton component** with all states
2. **Create NavigationBar layout** with slots
3. **Add keyboard shortcut handlers**
4. **Integrate with tab store** for state
5. **Style with design tokens**
6. **Write component tests**

### Acceptance Criteria

- [ ] Back button disabled when can't go back
- [ ] Forward button disabled when can't go forward
- [ ] Reload shows during idle, Stop shows during loading
- [ ] Add to Space button triggers callback
- [ ] Keyboard shortcuts work (Cmd+←, Cmd+→, Cmd+R)
- [ ] Buttons show hover and active states

### Dependencies

- **Depends on**: Spec 022 (tab store)
- **Blocks**: Spec 024 (URL bar integration)

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/tabbed_browser_screen.dart`

Lines 304-386: `_buildNavigationBar` method

### HiFi Design Reference

> **For Pixel-Perfect UI Implementation:**
>
> | Design | File Path |
> |--------|----------|
> | Browser View (Navigation Bar) | `project_ops/HIFI_UI_DESIGN_SCREENS/Browser View.png` |
>
> **Key UI Elements to Match:**
> - Navigation bar height: 48px
> - Background color: `--color-bg-surface` (#1A1628)
> - Left padding: 32px (for macOS traffic lights)
> - Nav buttons: 32x32px with 8px border-radius
> - Button icon size: 16px
> - Button hover state: `--color-bg-accent` background
> - Gap between nav buttons: 2px
> - Gap between button groups: 8px

---

## Spec 024: URL Bar with Validation

### Overview

Create the URL input bar with validation, search fallback, and security indicator.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Accept URL input | P0 |
| FR-2 | Validate URLs on submit | P0 |
| FR-3 | Search fallback for non-URL text | P0 |
| FR-4 | Display current URL | P0 |
| FR-5 | Select all text on focus | P0 |
| FR-6 | Security indicator (lock icon for HTTPS) | P1 |
| FR-7 | Show loading state | P1 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Follow design system tokens | P0 |
| NFR-2 | Validation <10ms | P1 |

### Technical Design

#### UrlBar Component

```tsx
// packages/react-ui/src/components/browser/UrlBar.tsx

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Lock, Globe, Search, Loader2 } from 'lucide-react';
import { validateAndNormalizeUrl, isSecureUrl } from '../../utils/urlValidator';
import styles from './UrlBar.module.css';

interface UrlBarProps {
  value: string;
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

export const UrlBar = memo(function UrlBar({
  value,
  onSubmit,
  isLoading = false,
}: UrlBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Sync external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value);
    }
  }, [value, isFocused]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Select all text
    requestAnimationFrame(() => {
      inputRef.current?.select();
    });
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Reset to current URL if unchanged
    setInputValue(value);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const normalizedUrl = validateAndNormalizeUrl(inputValue);
      if (normalizedUrl) {
        onSubmit(normalizedUrl);
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setInputValue(value);
      inputRef.current?.blur();
    }
  }, [inputValue, value, onSubmit]);

  const isSecure = isSecureUrl(value);

  // Determine which icon to show
  const renderIcon = () => {
    if (isLoading) {
      return <Loader2 size={14} className={styles.spinner} />;
    }
    if (isFocused) {
      return <Search size={14} />;
    }
    if (isSecure) {
      return <Lock size={14} className={styles.secureIcon} />;
    }
    return <Globe size={14} />;
  };

  return (
    <div className={`${styles.urlBar} ${isFocused ? styles.focused : ''}`}>
      <div className={styles.icon}>
        {renderIcon()}
      </div>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search or enter URL"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
});
```

#### URL Validator Utility

```typescript
// packages/react-ui/src/utils/urlValidator.ts

/**
 * URL validation utilities
 * Based on Flutter url_validator.dart
 */

/**
 * Validates and normalizes a URL or search query
 * - Valid URLs are returned as-is (with https:// added if needed)
 * - Search queries are converted to Google search URLs
 */
export function validateAndNormalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return null;
  }

  // If it already has a scheme, validate directly
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      if (url.host) {
        return trimmed;
      }
    } catch {
      return null;
    }
  }

  // Check if it looks like a URL (has a dot, no spaces)
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    // Try adding https://
    const withScheme = `https://${trimmed}`;
    try {
      const url = new URL(withScheme);
      if (url.host) {
        return withScheme;
      }
    } catch {
      // Fall through to search
    }
  }

  // Treat as search query
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

/**
 * Check if URL uses HTTPS
 */
export function isSecureUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL for display
 */
export function extractDomain(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
```

#### UrlBar Styles

```css
/* packages/react-ui/src/components/browser/UrlBar.module.css */

.urlBar {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 var(--spacing-sm);
  background-color: var(--color-bg-dark);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  transition: all var(--duration-hover) ease;
}

.urlBar:hover {
  border-color: var(--color-border-dark);
}

.urlBar.focused {
  border-color: var(--color-primary);
  background-color: var(--color-bg-surface);
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.secureIcon {
  color: var(--color-success);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.input {
  flex: 1;
  height: 100%;
  padding: 0 var(--spacing-xs);
  border: none;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-primary);
  outline: none;
}

.input::placeholder {
  color: var(--color-text-muted);
}

.input::selection {
  background-color: var(--color-primary);
  color: white;
}
```

### Implementation Steps

1. **Create urlValidator utility** with validation logic
2. **Create UrlBar component** with input handling
3. **Add security indicator** with lock icon
4. **Implement select-all on focus**
5. **Add search fallback** for non-URL input
6. **Style with design tokens**
7. **Write validation tests**

### Acceptance Criteria

- [ ] Valid URLs navigate directly
- [ ] Invalid URLs search Google
- [ ] HTTPS URLs show lock icon
- [ ] HTTP URLs show globe icon
- [ ] Text selects all on focus
- [ ] Escape resets to current URL
- [ ] Enter submits input
- [ ] Loading state shows spinner

### Dependencies

- **Depends on**: Spec 023 (NavigationBar)
- **Blocks**: None

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/domain/url_validator.dart`

Full file (71 lines)

### HiFi Design Reference

> **For Pixel-Perfect UI Implementation:**
>
> | Design | File Path |
> |--------|----------|
> | Browser View (URL Bar) | `project_ops/HIFI_UI_DESIGN_SCREENS/Browser View.png` |
>
> **Key UI Elements to Match:**
> - URL bar height: 32px
> - Background: `--color-bg-dark` (#0F0B1A), focused: `--color-bg-surface`
> - Border-radius: 8px (`--radius-md`)
> - Border: 1px solid `--color-border-subtle`, focused: `--color-primary`
> - Icon size: 14px (lock/globe/search)
> - Font: monospace, 13px
> - Lock icon color: `--color-success` (green) for HTTPS
> - Placeholder text color: `--color-text-muted`

---

## Spec 025: History Management

### Overview

Implement navigation history tracking for the browser, enabling back/forward navigation with proper history stacks.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Track navigation history per tab | P0 |
| FR-2 | Maintain back/forward stacks | P0 |
| FR-3 | Update canGoBack/canGoForward state | P0 |
| FR-4 | Store history entries with metadata | P1 |
| FR-5 | Clear history on demand | P2 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | History operations <50ms | P1 |
| NFR-2 | Limit history entries per tab | P1 |

### Technical Design

#### History Entity

```typescript
// packages/core/src/domain/entities/HistoryEntry.ts

export interface HistoryEntry {
  readonly id: string;
  readonly tabId: string;
  readonly url: string;
  readonly title: string | null;
  readonly faviconUrl: string | null;
  readonly visitTime: Date;
}

export interface CreateHistoryEntryInput {
  tabId: string;
  url: string;
  title?: string | null;
  faviconUrl?: string | null;
}
```

#### History Repository Interface

```typescript
// packages/core/src/domain/repositories/IHistoryRepository.ts

import type { HistoryEntry, CreateHistoryEntryInput } from '../entities/HistoryEntry';

export interface IHistoryRepository {
  /**
   * Add entry to history
   */
  addEntry(input: CreateHistoryEntryInput): Promise<HistoryEntry>;

  /**
   * Get history for a tab
   */
  getByTabId(tabId: string, limit?: number): Promise<HistoryEntry[]>;

  /**
   * Get all history entries
   */
  getAll(limit?: number): Promise<HistoryEntry[]>;

  /**
   * Clear history for a tab
   */
  clearByTabId(tabId: string): Promise<void>;

  /**
   * Clear all history
   */
  clearAll(): Promise<void>;

  /**
   * Delete old entries (older than specified days)
   */
  deleteOlderThan(days: number): Promise<number>;
}
```

#### Database Migration

```sql
-- packages/infrastructure/src/persistence/sqlite/migrations/003_browser_history.sql

CREATE TABLE IF NOT EXISTS browser_history (
  id TEXT PRIMARY KEY,
  tab_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  favicon_url TEXT,
  visit_time INTEGER NOT NULL,
  FOREIGN KEY (tab_id) REFERENCES browser_tabs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_browser_history_tab ON browser_history(tab_id);
CREATE INDEX IF NOT EXISTS idx_browser_history_time ON browser_history(visit_time DESC);
CREATE INDEX IF NOT EXISTS idx_browser_history_url ON browser_history(url);
```

#### SqliteHistoryRepository

```typescript
// packages/infrastructure/src/persistence/sqlite/SqliteHistoryRepository.ts

import type Database from 'better-sqlite3';
import type {
  IHistoryRepository,
  HistoryEntry,
  CreateHistoryEntryInput,
} from '@spayce/core';
import { v4 as uuid } from 'uuid';

interface HistoryRow {
  id: string;
  tab_id: string;
  url: string;
  title: string | null;
  favicon_url: string | null;
  visit_time: number;
}

export class SqliteHistoryRepository implements IHistoryRepository {
  private readonly MAX_ENTRIES_PER_TAB = 100;
  
  constructor(private readonly db: Database.Database) {}

  private mapRowToEntity(row: HistoryRow): HistoryEntry {
    return {
      id: row.id,
      tabId: row.tab_id,
      url: row.url,
      title: row.title,
      faviconUrl: row.favicon_url,
      visitTime: new Date(row.visit_time),
    };
  }

  async addEntry(input: CreateHistoryEntryInput): Promise<HistoryEntry> {
    const id = uuid();
    const now = Date.now();

    this.db.prepare(`
      INSERT INTO browser_history (id, tab_id, url, title, favicon_url, visit_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, input.tabId, input.url, input.title ?? null, input.faviconUrl ?? null, now);

    // Prune old entries for this tab
    this.db.prepare(`
      DELETE FROM browser_history 
      WHERE tab_id = ? 
      AND id NOT IN (
        SELECT id FROM browser_history 
        WHERE tab_id = ? 
        ORDER BY visit_time DESC 
        LIMIT ?
      )
    `).run(input.tabId, input.tabId, this.MAX_ENTRIES_PER_TAB);

    return {
      id,
      tabId: input.tabId,
      url: input.url,
      title: input.title ?? null,
      faviconUrl: input.faviconUrl ?? null,
      visitTime: new Date(now),
    };
  }

  async getByTabId(tabId: string, limit = 50): Promise<HistoryEntry[]> {
    const rows = this.db.prepare(`
      SELECT * FROM browser_history 
      WHERE tab_id = ? 
      ORDER BY visit_time DESC 
      LIMIT ?
    `).all(tabId, limit) as HistoryRow[];
    
    return rows.map(this.mapRowToEntity);
  }

  async getAll(limit = 100): Promise<HistoryEntry[]> {
    const rows = this.db.prepare(`
      SELECT * FROM browser_history 
      ORDER BY visit_time DESC 
      LIMIT ?
    `).all(limit) as HistoryRow[];
    
    return rows.map(this.mapRowToEntity);
  }

  async clearByTabId(tabId: string): Promise<void> {
    this.db.prepare(`DELETE FROM browser_history WHERE tab_id = ?`).run(tabId);
  }

  async clearAll(): Promise<void> {
    this.db.prepare(`DELETE FROM browser_history`).run();
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const result = this.db.prepare(`
      DELETE FROM browser_history WHERE visit_time < ?
    `).run(cutoff);
    
    return result.changes;
  }
}
```

#### Integration with BrowserService

The history is automatically tracked when WebContentsView navigates:

```typescript
// In BrowserService.ts - add to view creation

view.webContents.on('did-navigate', async (_, url) => {
  // Add to history
  const historyRepo = serviceRegistry.get<IHistoryRepository>(SERVICE_KEYS.HISTORY_REPOSITORY);
  const title = await view.webContents.getTitle();
  
  await historyRepo.addEntry({
    tabId: id,
    url,
    title,
  });

  // Update navigation state
  this.mainWindow?.webContents.send('browser:navigated', {
    viewId: id,
    url,
    canGoBack: view.webContents.canGoBack(),
    canGoForward: view.webContents.canGoForward(),
  });
});
```

### Implementation Steps

1. **Create HistoryEntry entity** in domain layer
2. **Create IHistoryRepository interface**
3. **Add database migration** for history table
4. **Implement SqliteHistoryRepository**
5. **Register repository** in service registry
6. **Integrate with BrowserService** for automatic tracking
7. **Add history IPC handlers** if needed
8. **Write repository tests**

### Acceptance Criteria

- [ ] Navigation automatically adds history entries
- [ ] Back/forward navigation works correctly
- [ ] canGoBack/canGoForward state updates properly
- [ ] History persists to database
- [ ] Old entries pruned automatically
- [ ] Clear history works

### Dependencies

- **Depends on**: Spec 017 (BrowserService events)
- **Blocks**: None

### Flutter Reference

WebContentsView automatically manages back/forward navigation. The Flutter implementation uses InAppWebView's built-in history management, which Electron's WebContentsView also provides natively.

---

## Phase 3 Summary

### Files Created/Modified

| Package | File | Action |
|---------|------|--------|
| react-ui | `src/components/browser/NavigationBar.tsx` | Create |
| react-ui | `src/components/browser/NavigationBar.module.css` | Create |
| react-ui | `src/components/browser/NavButton.tsx` | Create |
| react-ui | `src/components/browser/NavButton.module.css` | Create |
| react-ui | `src/components/browser/UrlBar.tsx` | Create |
| react-ui | `src/components/browser/UrlBar.module.css` | Create |
| react-ui | `src/utils/urlValidator.ts` | Create |
| core | `src/domain/entities/HistoryEntry.ts` | Create |
| core | `src/domain/repositories/IHistoryRepository.ts` | Create |
| infrastructure | `src/persistence/sqlite/SqliteHistoryRepository.ts` | Create |
| infrastructure | `src/persistence/sqlite/migrations/003_browser_history.sql` | Create |
| desktop | `src/main/services/BrowserService.ts` | Modify (history tracking) |

### Phase 3 Completion Checklist

- [ ] Spec 023: Navigation Bar Component complete
- [ ] Spec 024: URL Bar with Validation complete
- [ ] Spec 025: History Management complete
- [ ] All unit tests passing
- [ ] Back/forward/reload buttons work
- [ ] URL bar validates and navigates
- [ ] Search fallback works
- [ ] Security indicator shows correctly
- [ ] History tracks navigation

### Next Phase

Proceed to **Phase 4: Integration** (Specs 026-028) to add Spaces-browser deep integration.
