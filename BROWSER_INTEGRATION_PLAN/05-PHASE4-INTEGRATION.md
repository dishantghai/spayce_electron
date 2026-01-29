# Phase 4: Spaces-Browser Integration

> **Specs**: 026, 027, 028
> **Goal**: Deep integration between browser tabs and Spaces
> **Estimated Sessions**: 2-3 Claude Opus 4.5 sessions
> **Prerequisites**: Phase 3 complete (Specs 023-025)

---

## Phase Overview

Phase 4 creates the deep integration between browser tabs and Spaces, enabling bidirectional linking and seamless content organization.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 4 DELIVERABLES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 026: Tab-Space Origin Tracking               │    │
│  │                                                                      │    │
│  │  - Track which Space item opened a tab                              │    │
│  │  - Detect when tab navigates away from origin URL                   │    │
│  │  - Highlight active Space item in sidebar                           │    │
│  │  - Space item → Tab association                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 027: Add to Space Flow                       │    │
│  │                                                                      │    │
│  │  packages/react-ui/src/components/browser/AddToSpaceDialog.tsx      │    │
│  │  - Dialog to save current page to a Space                           │    │
│  │  - Space selection with search                                      │    │
│  │  - Folder path selection                                            │    │
│  │  - Auto-extract page metadata                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Spec 028: Link Click Handling                     │    │
│  │                                                                      │    │
│  │  - Space item click opens/switches to tab                           │    │
│  │  - Duplicate tab detection and reuse                                │    │
│  │  - Increment visit count on open                                    │    │
│  │  - Update lastVisited timestamp                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 026: Tab-Space Origin Tracking

### Overview

Implement bidirectional tracking between browser tabs and Space items, enabling the UI to show which Space item a tab originated from and vice versa.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Store origin Space ID and Item ID on tab | P0 |
| FR-2 | Track when tab navigates away from origin URL | P0 |
| FR-3 | Provide method to check if Space item has active tab | P0 |
| FR-4 | Highlight Space item when its tab is active | P1 |
| FR-5 | Show indicator on tab if tracked vs untracked | P2 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Origin lookup <10ms | P1 |
| NFR-2 | URL comparison normalized | P0 |

### Technical Design

#### Tab Entity Extension

Already defined in Spec 018:
```typescript
interface TabEntity {
  // ... other fields
  readonly originSpaceId: string | null;
  readonly originSpaceItemId: string | null;
  readonly isTracked: boolean;  // False if navigated away from origin URL
}
```

#### Origin Tracking Service

```typescript
// packages/react-ui/src/services/tabOriginService.ts

import { useTabStore } from '../stores/tabStore';

/**
 * Check if a Space item has an active tab
 */
export function getTabForSpaceItem(spaceItemId: string): string | null {
  const tabs = useTabStore.getState().tabs;
  const tab = tabs.find(
    t => t.originSpaceItemId === spaceItemId && t.isTracked
  );
  return tab?.id ?? null;
}

/**
 * Check if a Space item's tab is currently active
 */
export function isSpaceItemTabActive(spaceItemId: string): boolean {
  const { tabs, activeTabId } = useTabStore.getState();
  const tab = tabs.find(t => t.originSpaceItemId === spaceItemId && t.isTracked);
  return tab?.id === activeTabId;
}

/**
 * Normalize URLs for comparison
 */
export function normalizeUrl(url: string): string {
  let normalized = url.toLowerCase().trim();
  
  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '');
  
  // Remove www. prefix
  if (normalized.startsWith('www.')) {
    normalized = normalized.substring(4);
  }
  
  // Remove trailing slash
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  // Remove fragment
  const hashIndex = normalized.indexOf('#');
  if (hashIndex !== -1) {
    normalized = normalized.substring(0, hashIndex);
  }
  
  return normalized;
}

/**
 * Check if two URLs match (normalized comparison)
 */
export function urlsMatch(url1: string, url2: string): boolean {
  return normalizeUrl(url1) === normalizeUrl(url2);
}
```

#### URL Tracking in BrowserService

```typescript
// In BrowserService.ts - update navigation handler

view.webContents.on('did-navigate', async (_, newUrl) => {
  const tabsRepo = serviceRegistry.get<ITabsRepository>(SERVICE_KEYS.TABS_REPOSITORY);
  const tab = await tabsRepo.getById(id);
  
  if (tab && tab.originSpaceItemId) {
    // Get original item URL
    const itemsRepo = serviceRegistry.get<ISpaceItemsRepository>(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY);
    const item = await itemsRepo.getById(tab.originSpaceItemId);
    
    if (item) {
      // Check if still on the origin URL
      const isTracked = urlsMatch(newUrl, item.path);
      
      // Update tracking status
      await tabsRepo.update({
        id,
        url: newUrl,
        isTracked,
      });
    }
  }
  
  // ... rest of navigation handling
});
```

#### Space Item Highlighting Hook

```typescript
// packages/react-ui/src/hooks/useSpaceItemHighlight.ts

import { useMemo } from 'react';
import { useTabStore } from '../stores/tabStore';

/**
 * Hook to determine if a Space item should be highlighted
 * (its tab is active and tracked)
 */
export function useSpaceItemHighlight(spaceItemId: string): boolean {
  const { tabs, activeTabId } = useTabStore();
  
  return useMemo(() => {
    if (!activeTabId) return false;
    
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return false;
    
    return activeTab.originSpaceItemId === spaceItemId && activeTab.isTracked;
  }, [tabs, activeTabId, spaceItemId]);
}
```

#### TreeView Item Highlight Integration

```tsx
// In TreeItem.tsx - add highlight styling

import { useSpaceItemHighlight } from '../../hooks/useSpaceItemHighlight';

function TreeItem({ item }: { item: SpaceItemEntity }) {
  const isHighlighted = useSpaceItemHighlight(item.id);
  
  return (
    <div className={`${styles.treeItem} ${isHighlighted ? styles.highlighted : ''}`}>
      {/* ... */}
    </div>
  );
}
```

### Implementation Steps

1. **Create tabOriginService** with utility functions
2. **Update BrowserService** to track URL changes
3. **Create useSpaceItemHighlight hook**
4. **Integrate highlighting** into TreeItem component
5. **Add visual indicator** for tracked/untracked tabs
6. **Write unit tests**

### Acceptance Criteria

- [ ] Tabs store origin Space ID and Item ID
- [ ] isTracked updates when navigating away from origin
- [ ] Space items highlight when their tab is active
- [ ] URL comparison handles protocol, www, trailing slashes
- [ ] Highlighting updates immediately on tab switch

### Dependencies

- **Depends on**: Spec 018 (TabEntity), Spec 021 (TabsRepository)
- **Blocks**: Spec 028 (link click handling)

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/domain/tab_model.dart`

Lines 85-116: Origin tracking and URL matching

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/data/tab_manager.dart`

Lines 491-507: `shouldHighlightSpaceItem` method

---

## Spec 027: Add to Space Flow

### Overview

Create the "Add to Space" dialog that allows users to save the current browser page to a Space.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Show dialog with Space list | P0 |
| FR-2 | Search/filter Spaces | P0 |
| FR-3 | Select destination folder within Space | P1 |
| FR-4 | Auto-extract page metadata (title, favicon) | P0 |
| FR-5 | Create new Space from dialog | P2 |
| FR-6 | Show success/error feedback | P0 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Dialog opens <100ms | P1 |
| NFR-2 | Follow design system | P0 |

### Technical Design

#### File Structure

```
packages/react-ui/src/components/browser/
├── AddToSpaceDialog.tsx          # Main dialog component
├── AddToSpaceDialog.module.css   # Dialog styles
├── SpaceSelector.tsx             # Space list with search
├── FolderSelector.tsx            # Folder tree for destination
```

#### AddToSpaceDialog Component

```tsx
// packages/react-ui/src/components/browser/AddToSpaceDialog.tsx

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Folder, Check } from 'lucide-react';
import { useSpaces } from '../../hooks/useSpaces';
import { useCreateItem } from '../../hooks/mutations/useCreateItem';
import { SpaceSelector } from './SpaceSelector';
import { FolderSelector } from './FolderSelector';
import styles from './AddToSpaceDialog.module.css';

interface PageMetadata {
  url: string;
  title: string;
  faviconUrl?: string;
}

interface AddToSpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pageMetadata: PageMetadata;
}

type Step = 'select-space' | 'select-folder' | 'success';

export function AddToSpaceDialog({
  isOpen,
  onClose,
  pageMetadata,
}: AddToSpaceDialogProps) {
  const [step, setStep] = useState<Step>('select-space');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { spaces, isLoading: spacesLoading } = useSpaces();
  const { createItem, isLoading: saving } = useCreateItem();

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('select-space');
      setSelectedSpaceId(null);
      setSelectedFolderId(null);
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen]);

  const handleSpaceSelect = useCallback((spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setStep('select-folder');
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedSpaceId) return;

    try {
      setError(null);
      
      await createItem({
        spaceId: selectedSpaceId,
        parentId: selectedFolderId ?? undefined,
        name: pageMetadata.title || pageMetadata.url,
        type: 'link',
        path: pageMetadata.url,
        faviconUrl: pageMetadata.faviconUrl,
      });

      setStep('success');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }, [selectedSpaceId, selectedFolderId, pageMetadata, createItem, onClose]);

  const handleBack = useCallback(() => {
    if (step === 'select-folder') {
      setStep('select-space');
      setSelectedSpaceId(null);
    }
  }, [step]);

  if (!isOpen) return null;

  const selectedSpace = spaces?.find(s => s.id === selectedSpaceId);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {step === 'success' ? 'Saved!' : 'Add to Space'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Page Preview */}
        <div className={styles.pagePreview}>
          {pageMetadata.faviconUrl && (
            <img 
              src={pageMetadata.faviconUrl} 
              alt="" 
              className={styles.favicon}
            />
          )}
          <div className={styles.pageInfo}>
            <div className={styles.pageTitle}>{pageMetadata.title}</div>
            <div className={styles.pageUrl}>{pageMetadata.url}</div>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {step === 'select-space' && (
            <SpaceSelector
              spaces={spaces ?? []}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelect={handleSpaceSelect}
              isLoading={spacesLoading}
            />
          )}

          {step === 'select-folder' && selectedSpace && (
            <FolderSelector
              spaceId={selectedSpaceId!}
              spaceName={selectedSpace.name}
              selectedFolderId={selectedFolderId}
              onSelect={setSelectedFolderId}
              onBack={handleBack}
            />
          )}

          {step === 'success' && (
            <div className={styles.successMessage}>
              <Check size={48} className={styles.successIcon} />
              <p>Added to {selectedSpace?.name}</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {/* Footer */}
        {step === 'select-folder' && (
          <div className={styles.footer}>
            <button 
              className={styles.cancelButton} 
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              className={styles.saveButton} 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### SpaceSelector Component

```tsx
// packages/react-ui/src/components/browser/SpaceSelector.tsx

import { useMemo } from 'react';
import { Search } from 'lucide-react';
import type { SpaceEntity } from '@spayce/core';
import styles from './AddToSpaceDialog.module.css';

interface SpaceSelectorProps {
  spaces: SpaceEntity[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (spaceId: string) => void;
  isLoading: boolean;
}

export function SpaceSelector({
  spaces,
  searchQuery,
  onSearchChange,
  onSelect,
  isLoading,
}: SpaceSelectorProps) {
  const filteredSpaces = useMemo(() => {
    if (!searchQuery) return spaces;
    const query = searchQuery.toLowerCase();
    return spaces.filter(s => s.name.toLowerCase().includes(query));
  }, [spaces, searchQuery]);

  return (
    <div className={styles.spaceSelector}>
      {/* Search */}
      <div className={styles.searchBox}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search spaces..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className={styles.searchInput}
          autoFocus
        />
      </div>

      {/* Space List */}
      <div className={styles.spaceList}>
        {isLoading ? (
          <div className={styles.loading}>Loading spaces...</div>
        ) : filteredSpaces.length === 0 ? (
          <div className={styles.empty}>No spaces found</div>
        ) : (
          filteredSpaces.map(space => (
            <button
              key={space.id}
              className={styles.spaceItem}
              onClick={() => onSelect(space.id)}
            >
              <div 
                className={styles.spaceIcon}
                style={{ backgroundColor: space.accentColor }}
              >
                {space.iconName.charAt(0).toUpperCase()}
              </div>
              <span className={styles.spaceName}>{space.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
```

#### Dialog Styles

```css
/* packages/react-ui/src/components/browser/AddToSpaceDialog.module.css */

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  width: 400px;
  max-height: 500px;
  background-color: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-dropdown);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-subtle);
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.closeButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
}

.closeButton:hover {
  background-color: var(--color-bg-accent);
  color: var(--color-text-primary);
}

.pagePreview {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--color-bg-dark);
  border-bottom: 1px solid var(--color-border-subtle);
}

.favicon {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-xs);
}

.pageInfo {
  flex: 1;
  min-width: 0;
}

.pageTitle {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pageUrl {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.searchBox {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-dark);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.searchIcon {
  color: var(--color-text-muted);
}

.searchInput {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;
}

.spaceList {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.spaceItem {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: background-color var(--duration-hover) ease;
}

.spaceItem:hover {
  background-color: var(--color-bg-accent);
}

.spaceIcon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.spaceName {
  font-size: 14px;
  color: var(--color-text-primary);
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border-subtle);
}

.cancelButton {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-dark);
  background: transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.saveButton {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background-color: var(--color-primary);
  border-radius: var(--radius-md);
  color: white;
  font-weight: 500;
  cursor: pointer;
}

.saveButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.successMessage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.successIcon {
  color: var(--color-success);
  margin-bottom: var(--spacing-md);
}

.error {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  font-size: 13px;
  border-radius: var(--radius-sm);
  margin: 0 var(--spacing-md) var(--spacing-md);
}
```

### Implementation Steps

1. **Create AddToSpaceDialog component** with steps flow
2. **Create SpaceSelector component** with search
3. **Create FolderSelector component** for destination
4. **Integrate with NavigationBar** "Add to Space" button
5. **Connect to createItem mutation**
6. **Add success/error feedback**
7. **Style with design tokens**
8. **Write component tests**

### Acceptance Criteria

- [ ] Dialog shows Spaces list
- [ ] Can search/filter Spaces
- [ ] Can select destination folder
- [ ] Page metadata auto-populates
- [ ] Item created in selected Space
- [ ] Success message shows
- [ ] Dialog closes on success

### Dependencies

- **Depends on**: Spec 023 (NavigationBar), existing useSpaces hook
- **Blocks**: None

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/tabbed_browser_screen.dart`

Lines 694-751: `_showAddToSpaceDialog` method

---

## Spec 028: Link Click Handling

### Overview

Implement the flow for when a user clicks a link item in a Space, opening or switching to the corresponding browser tab.

### Requirements

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Click on link item opens in browser | P0 |
| FR-2 | Reuse existing tab if same Space item | P0 |
| FR-3 | Reuse existing tab if same URL | P1 |
| FR-4 | Increment visit count on open | P0 |
| FR-5 | Update lastVisited timestamp | P0 |
| FR-6 | Switch to existing tab instead of creating duplicate | P0 |

#### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Tab switch <500ms | P1 |
| NFR-2 | Duplicate detection reliable | P0 |

### Technical Design

#### Link Click Handler

```typescript
// packages/react-ui/src/hooks/useOpenLink.ts

import { useCallback } from 'react';
import { useTabStore } from '../stores/tabStore';
import { useBrowserStore } from '../stores/browserUiStore';
import type { SpaceItemEntity } from '@spayce/core';

export function useOpenLink() {
  const { tabs, activeTabId, createTab, switchTab } = useTabStore();
  const { loadURL } = useBrowserStore();

  const openLink = useCallback(async (item: SpaceItemEntity) => {
    if (item.type !== 'link' || !item.path) {
      return;
    }

    // Increment visit count
    await window.electronAPI.items.incrementVisit?.(item.id);

    // Check for existing tab by Space item ID (most reliable)
    const existingByItem = tabs.find(
      t => t.originSpaceItemId === item.id && t.isTracked
    );
    
    if (existingByItem) {
      // Switch to existing tab
      await switchTab(existingByItem.id);
      return;
    }

    // Check for existing tab by URL
    const normalizedUrl = normalizeUrl(item.path);
    const existingByUrl = tabs.find(
      t => normalizeUrl(t.url) === normalizedUrl
    );
    
    if (existingByUrl) {
      // Switch to existing tab and update origin tracking
      await switchTab(existingByUrl.id);
      // Update the tab to associate with this Space item
      await window.electronAPI.tabs.update(existingByUrl.id, {
        originSpaceId: item.spaceId,
        originSpaceItemId: item.id,
        isTracked: true,
      });
      return;
    }

    // Create new tab with origin tracking
    await createTab({
      url: item.path,
      title: item.name,
      originSpaceId: item.spaceId,
      originSpaceItemId: item.id,
      faviconUrl: item.faviconUrl ?? undefined,
    });
  }, [tabs, createTab, switchTab]);

  return { openLink };
}

function normalizeUrl(url: string): string {
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
```

#### TreeItem Click Integration

```tsx
// In TreeItem.tsx - handle link clicks

import { useOpenLink } from '../../hooks/useOpenLink';

function TreeItem({ item }: { item: SpaceItemEntity }) {
  const { openLink } = useOpenLink();
  const isHighlighted = useSpaceItemHighlight(item.id);

  const handleClick = useCallback(() => {
    if (item.type === 'link') {
      openLink(item);
    } else if (item.type === 'folder') {
      // Toggle expand
      toggleExpanded(item.id);
    }
  }, [item, openLink]);

  return (
    <div 
      className={`${styles.treeItem} ${isHighlighted ? styles.highlighted : ''}`}
      onClick={handleClick}
    >
      {/* ... */}
    </div>
  );
}
```

#### Highlight Styles for TreeItem

```css
/* Add to TreeItem.module.css */

.treeItem.highlighted {
  background-color: var(--color-bg-accent);
}

.treeItem.highlighted::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--color-primary);
}
```

### Implementation Steps

1. **Create useOpenLink hook** with duplicate detection
2. **Add incrementVisit IPC handler** if not exists
3. **Integrate with TreeItem** click handler
4. **Add visual highlighting** for active item
5. **Test duplicate detection** scenarios
6. **Write integration tests**

### Acceptance Criteria

- [ ] Clicking link opens browser tab
- [ ] Existing tab reused if same Space item
- [ ] Existing tab reused if same URL
- [ ] Visit count increments on click
- [ ] Active Space item highlighted in tree
- [ ] Tab switch is smooth and fast

### Dependencies

- **Depends on**: Spec 026 (origin tracking), Spec 021 (tab CRUD)
- **Blocks**: None

### Flutter Reference

Source: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/data/tab_manager.dart`

Lines 243-291: `createTabFromSpace` method with duplicate detection

---

## Phase 4 Summary

### Files Created/Modified

| Package | File | Action |
|---------|------|--------|
| react-ui | `src/services/tabOriginService.ts` | Create |
| react-ui | `src/hooks/useSpaceItemHighlight.ts` | Create |
| react-ui | `src/hooks/useOpenLink.ts` | Create |
| react-ui | `src/components/browser/AddToSpaceDialog.tsx` | Create |
| react-ui | `src/components/browser/AddToSpaceDialog.module.css` | Create |
| react-ui | `src/components/browser/SpaceSelector.tsx` | Create |
| react-ui | `src/components/browser/FolderSelector.tsx` | Create |
| react-ui | `src/components/TreeItem.tsx` | Modify (add highlighting, click) |
| react-ui | `src/components/TreeItem.module.css` | Modify (add highlight styles) |
| desktop | `src/main/services/BrowserService.ts` | Modify (origin tracking) |
| desktop | `src/main/ipc/handlers.ts` | Modify (incrementVisit) |

### Phase 4 Completion Checklist

- [ ] Spec 026: Tab-Space Origin Tracking complete
- [ ] Spec 027: Add to Space Flow complete
- [ ] Spec 028: Link Click Handling complete
- [ ] All unit tests passing
- [ ] Tabs track origin Space items
- [ ] "Add to Space" saves current page
- [ ] Link clicks open/switch tabs
- [ ] Duplicate tabs prevented
- [ ] Active items highlighted

### Next Phase

Proceed to **Phase 5: Polish** (Specs 029-031) to add session persistence and performance optimization.
