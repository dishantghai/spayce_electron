# Tree Component Migration Plan - Transactional & Safe

> **Branch:** `tree-component`  
> **Strategy:** Parallel implementation with feature flag, transactional backend, full rollback capability  
> **Risk Level:** LOW (existing code preserved until final switch)  
> **Last Updated:** January 27, 2026

---

## 🚀 IMPLEMENTATION PROGRESS

### ✅ COMPLETED PHASES

| Phase | Status | Notes |
|-------|--------|-------|
| **1.1** Install React Arborist | ✅ DONE | `pnpm add react-arborist` |
| **1.2** Create directory structure | ✅ DONE | `tree/arborist/` created |
| **1.3** Create Arborist components | ✅ DONE | SpayceTree, SpayceTreeNode |
| **1.4** Create feature flag config | ✅ DONE | `config/features.ts` |
| **1.5** Verify TypeScript compilation | ✅ DONE | Vite build: 387KB |
| **2.1** Update Sidebar.tsx | ✅ DONE | Feature flag toggle added |
| **2.2** Update SpaceCard.tsx | ✅ DONE | Feature flag toggle added |
| **2.3** Update SpacesScreen.tsx | ✅ DONE | New prop passed |
| **2.4** Create Arborist handler in App.tsx | ✅ DONE | `handleItemMoveArborist` |
| **3** Verify Vite build | ✅ DONE | Build successful |
| **4** Backend transaction safety | ✅ DONE | Sibling shifting + rollback |
| **BUG FIX** moveItem database error | ✅ FIXED | Added transaction with sibling shifting |

### 🔄 READY FOR TESTING

| Phase | Status | Notes |
|-------|--------|-------|
| **5** Testing with legacy (default) | ✅ READY | Feature flag OFF by default |
| **6** Testing with `?arborist=true` | 🔄 PENDING | URL param enables new tree |
| **7** Full validation & cleanup | 🔄 PENDING | After testing |

### Files Created/Modified

**NEW FILES:**
- `packages/react-ui/src/components/tree/arborist/SpayceTree.tsx`
- `packages/react-ui/src/components/tree/arborist/SpayceTreeNode.tsx`
- `packages/react-ui/src/components/tree/arborist/SpayceTree.module.css`
- `packages/react-ui/src/components/tree/arborist/index.ts`
- `packages/react-ui/src/components/tree/index.ts`
- `packages/react-ui/src/config/features.ts`
- `packages/react-ui/src/config/index.ts`

**MODIFIED FILES:**
- `packages/react-ui/src/components/Sidebar.tsx` - Feature flag toggle
- `packages/react-ui/src/components/spaces/SpaceCard.tsx` - Feature flag toggle
- `packages/react-ui/src/components/spaces/SpacesScreen.tsx` - New prop
- `packages/desktop/src/renderer/App.tsx` - Arborist move handler
- `packages/infrastructure/src/persistence/sqlite/SqliteSpaceItemsRepository.ts` - Transaction safety

### How to Test

1. **Start dev server:** `pnpm dev`
2. **Open browser:** `http://localhost:5173?arborist=true`
3. **Test drag-drop** in sidebar and space cards
4. **Verify** items move to correct positions

### Rollback Instructions

```bash
# Instant rollback - just disable feature flag
# In packages/react-ui/src/config/features.ts:
USE_ARBORIST_TREE: false  # Change to false

# Full rollback - revert to main branch
git checkout main
```

---

## Core Principles

1. **Non-Breaking:** Old tree continues to work during entire migration
2. **Feature Flag:** Toggle between old/new implementation for testing
3. **Transactional Backend:** All position updates in atomic transactions with rollback
4. **UI-First:** React Arborist computes positions, backend validates & persists
5. **Safety Net:** Ability to instantly rollback to old implementation

---

## Phase Overview

| Phase | Duration | Risk | Rollback Strategy |
|-------|----------|------|-------------------|
| **Phase 1:** Install & Setup | 1 hour | None | Delete package |
| **Phase 2:** Build Components | 8 hours | None | Feature flag off |
| **Phase 3:** Feature Flag Integration | 2 hours | Low | Flag = false |
| **Phase 4:** Testing & Validation | 6 hours | Low | Flag = false |
| **Phase 5:** Backend Transactions | 4 hours | Medium | Database backup |
| **Phase 6:** Switch & Cleanup | 2 hours | Low | Git revert |
| **Total** | ~23 hours | **LOW** | Multiple layers |

---

## Phase 1: Install & Setup (Non-Breaking)

### Objectives
- Install React Arborist
- Create new directory structure
- No changes to existing code

### Tasks

#### 1.1 Install Dependencies
```bash
pnpm add react-arborist
pnpm add -D @types/react-window  # If needed
```

#### 1.2 Create New Directory Structure
```
packages/react-ui/src/components/
├── tree/                           ← NEW DIRECTORY
│   ├── arborist/                   ← React Arborist implementation
│   │   ├── SpayceTree.tsx          ← Wrapper component
│   │   ├── SpayceTreeNode.tsx      ← Custom node renderer
│   │   ├── SpayceTree.module.css   ← Arborist-specific styles
│   │   └── index.ts                ← Exports
│   └── legacy/                     ← Move existing components here
│       ├── TreeView.tsx            ← Existing (unchanged)
│       ├── TreeItem.tsx            ← Existing (unchanged)
│       ├── drag-drop/              ← Existing (unchanged)
│       └── index.ts                ← Exports
```

#### 1.3 Move Existing Components (No Changes)
```bash
# Create new directories
mkdir -p packages/react-ui/src/components/tree/legacy
mkdir -p packages/react-ui/src/components/tree/arborist

# Move existing components
mv packages/react-ui/src/components/TreeView.tsx packages/react-ui/src/components/tree/legacy/
mv packages/react-ui/src/components/TreeItem.tsx packages/react-ui/src/components/tree/legacy/
mv packages/react-ui/src/components/drag-drop packages/react-ui/src/components/tree/legacy/
```

#### 1.4 Create Barrel Exports
```typescript
// packages/react-ui/src/components/tree/legacy/index.ts
export { TreeView } from './TreeView';
export { TreeItem } from './TreeItem';
export * from './drag-drop';

// packages/react-ui/src/components/tree/index.ts
export * from './legacy';  // Default to legacy for now
```

#### 1.5 Update Import Paths
- Update all imports in Sidebar.tsx, SpaceCard.tsx to use new path
- No functionality changes, just path updates

### Success Criteria
- ✅ Application runs exactly as before
- ✅ All existing tests pass
- ✅ No visual changes
- ✅ TypeScript compiles

### Rollback
- Delete `tree/` directory
- Restore original file locations
- Revert import paths

---

## Phase 2: Build Arborist Components (Parallel)

### Objectives
- Build new tree components using React Arborist
- Match existing design system exactly
- No integration with App yet

### Tasks

#### 2.1 Create SpayceTreeNode Component

**File:** `packages/react-ui/src/components/tree/arborist/SpayceTreeNode.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import type { NodeRendererProps } from 'react-arborist';
import { FolderPlus, Link, MoreVertical } from 'lucide-react';
import type { SpaceItem } from '../../../types';
import { SpaceItemType } from '../../../types';
import { TreeItemIcon } from '../../TreeItemIcon';
import { InlineRenameInput } from '../../InlineRenameInput';
import { SpayceColors } from '../../../theme';
import styles from './SpayceTree.module.css';

interface SpayceTreeNodeProps extends NodeRendererProps<SpaceItem> {
  spaceId: string;
  accentColor?: string;
  renameItemId?: string | null;
  onItemClick?: (item: SpaceItem) => void;
  onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
  onAddSubfolder?: (item: SpaceItem) => void;
  onAddLink?: (item: SpaceItem) => void;
  onRenameSubmit?: (itemId: string, newName: string) => void;
  onRenameCancel?: () => void;
}

export function SpayceTreeNode({
  node,
  style,
  dragHandle,
  spaceId,
  accentColor = SpayceColors.primary,
  renameItemId,
  onItemClick,
  onItemContextMenu,
  onAddSubfolder,
  onAddLink,
  onRenameSubmit,
  onRenameCancel,
}: SpayceTreeNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const item = node.data;
  const isFolder = item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder;
  const isRenaming = renameItemId === item.id;
  const isSelected = node.isSelected;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isRenaming) return;
    if (isFolder) {
      node.toggle();  // Arborist's built-in toggle
    }
    onItemClick?.(item);
  }, [node, item, isFolder, isRenaming, onItemClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRenaming) return;
    onItemClick?.(item);
    onItemContextMenu?.(item, e);
  }, [item, isRenaming, onItemClick, onItemContextMenu]);

  return (
    <div
      ref={dragHandle}  // Arborist's drag handle
      style={style}     // Arborist's positioning
      className={`${styles.treeItem} ${isSelected ? styles.selected : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="treeitem"
      aria-expanded={isFolder ? node.isOpen : undefined}
      aria-selected={isSelected}
    >
      <span className={styles.itemIcon}>
        <TreeItemIcon
          type={item.type}
          isExpanded={node.isOpen}
          accentColor={accentColor}
          faviconUrl={item.faviconUrl}
          itemUrl={item.type === 'link' ? item.path : undefined}
        />
      </span>

      {isRenaming ? (
        <InlineRenameInput
          item={item}
          onSave={(newName) => onRenameSubmit?.(item.id, newName)}
          onCancel={() => onRenameCancel?.()}
        />
      ) : (
        <span className={styles.itemText}>{item.name}</span>
      )}

      {isHovered && !isRenaming && (
        <div className={styles.contextIcons}>
          {isFolder && (
            <>
              <button
                className={styles.contextIcon}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSubfolder?.(item);
                }}
                title="Add Subfolder"
              >
                <FolderPlus size={14} />
              </button>
              <button
                className={styles.contextIcon}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddLink?.(item);
                }}
                title="Add Link"
              >
                <Link size={14} />
              </button>
            </>
          )}
          <button
            className={styles.contextIcon}
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e as any);
            }}
            title="More options"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
```

#### 2.2 Create SpayceTree Component

**File:** `packages/react-ui/src/components/tree/arborist/SpayceTree.tsx`

```typescript
import React, { useRef, useCallback } from 'react';
import { Tree, TreeApi } from 'react-arborist';
import type { SpaceItem, InlineInputState } from '../../../types';
import { SpayceColors, SpayceSpacing } from '../../../theme';
import { SpayceTreeNode } from './SpayceTreeNode';
import { InlineInput } from '../../InlineInput';
import styles from './SpayceTree.module.css';

export interface SpayceTreeProps {
  items: SpaceItem[];
  spaceId: string;
  selectedId?: string | null;
  activeId?: string | null;
  accentColor?: string;
  inlineInput?: InlineInputState | null;
  renameItemId?: string | null;
  width?: number;
  height?: number;
  onItemClick?: (item: SpaceItem) => void;
  onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
  onItemMove?: (draggedItemId: string, newParentId: string | null, newIndex: number) => Promise<void>;
  onAddSubfolder?: (parentItem: SpaceItem) => void;
  onAddLink?: (parentItem: SpaceItem) => void;
  onInlineInputSubmit?: (value: string, type: 'folder' | 'link', parentId: string | null) => void;
  onInlineInputCancel?: () => void;
  onRenameSubmit?: (itemId: string, newName: string) => void;
  onRenameCancel?: () => void;
}

export function SpayceTree({
  items,
  spaceId,
  selectedId = null,
  activeId = null,
  accentColor = SpayceColors.primary,
  inlineInput,
  renameItemId,
  width = SpayceSpacing.sidebarWidth,
  height = 600,
  onItemClick,
  onItemContextMenu,
  onItemMove,
  onAddSubfolder,
  onAddLink,
  onInlineInputSubmit,
  onInlineInputCancel,
  onRenameSubmit,
  onRenameCancel,
}: SpayceTreeProps) {
  const treeRef = useRef<TreeApi<SpaceItem>>(null);

  // Arborist's onMove callback - UI has already updated, we just persist
  const handleMove = useCallback(async ({ dragIds, parentId, index }) => {
    console.log('[Arborist] onMove:', { dragIds, parentId, index });
    if (onItemMove) {
      try {
        await onItemMove(dragIds[0], parentId, index);
        console.log('[Arborist] Backend update successful');
      } catch (error) {
        console.error('[Arborist] Backend update failed:', error);
        // Arborist already updated UI, we need to refresh to restore
        // This will be handled by refetch in App.tsx
      }
    }
  }, [onItemMove]);

  const showRootInlineInput = inlineInput && inlineInput.parentId === null;

  return (
    <div className={styles.treeContainer}>
      {showRootInlineInput && (
        <InlineInput
          type={inlineInput!.type}
          spaceId={spaceId}
          parentId={null}
          level={0}
          accentColor={accentColor}
          onSubmit={(value) => onInlineInputSubmit?.(value, inlineInput!.type, null)}
          onCancel={() => onInlineInputCancel?.()}
        />
      )}

      <Tree
        ref={treeRef}
        data={items}
        idAccessor="id"
        childrenAccessor="children"
        width={width}
        height={height}
        indent={SpayceSpacing.treeIndent}
        rowHeight={32}
        overscanCount={5}
        selection={selectedId}
        onMove={handleMove}
        disableEdit={true}  // We handle rename ourselves
        disableDrag={false}
        disableDrop={false}
      >
        {(props) => (
          <SpayceTreeNode
            {...props}
            spaceId={spaceId}
            accentColor={accentColor}
            renameItemId={renameItemId}
            onItemClick={onItemClick}
            onItemContextMenu={onItemContextMenu}
            onAddSubfolder={onAddSubfolder}
            onAddLink={onAddLink}
            onRenameSubmit={onRenameSubmit}
            onRenameCancel={onRenameCancel}
          />
        )}
      </Tree>
    </div>
  );
}
```

#### 2.3 Create Styles

**File:** `packages/react-ui/src/components/tree/arborist/SpayceTree.module.css`

```css
/* Port existing TreeView.module.css styles */
.treeContainer {
  width: 100%;
  height: 100%;
}

.treeItem {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px;
  color: var(--color-text-primary, #E5E7EB);
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 150ms ease;
  user-select: none;
}

.treeItem:hover {
  background-color: var(--color-bg-accent, #2D2645);
}

.treeItem.selected {
  background-color: var(--color-bg-accent, #2D2645);
}

.itemIcon {
  display: flex;
  align-items: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.itemText {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contextIcons {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 150ms ease;
}

.treeItem:hover .contextIcons {
  opacity: 1;
}

.contextIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--color-text-muted, #6B7280);
  cursor: pointer;
  transition: all 150ms ease;
}

.contextIcon:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary, #E5E7EB);
}
```

### Success Criteria
- ✅ Components compile without errors
- ✅ Storybook/isolated testing shows correct rendering
- ✅ Design system compliance verified
- ✅ No impact on running application

### Rollback
- Delete `tree/arborist/` directory
- Application continues using legacy components

---

## Phase 3: Feature Flag Integration

### Objectives
- Add feature flag to toggle between old/new tree
- Wire up new components to App.tsx
- Default to old implementation (safe)

### Tasks

#### 3.1 Create Feature Flag

**File:** `packages/react-ui/src/config/features.ts` (NEW)

```typescript
export const FeatureFlags = {
  // Toggle between legacy TreeView and React Arborist
  USE_ARBORIST_TREE: false,  // Default to legacy for safety
};

// Environment override (for testing)
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('arborist') === 'true') {
    FeatureFlags.USE_ARBORIST_TREE = true;
  }
}
```

#### 3.2 Update App.tsx with Conditional Rendering

```typescript
import { FeatureFlags } from '@spayce/react-ui/config/features';
import { TreeView as LegacyTreeView } from '@spayce/react-ui/components/tree/legacy';
import { SpayceTree } from '@spayce/react-ui/components/tree/arborist';

// In Sidebar render:
{FeatureFlags.USE_ARBORIST_TREE ? (
  <SpayceTree
    items={rootItems}
    spaceId={currentSpace.id}
    selectedId={sidebarSelectedId}
    activeId={sidebarSelectedId}
    accentColor={currentSpace.accentColor}
    onItemClick={handleItemClick}
    onItemContextMenu={handleItemContextMenu}
    onItemMove={handleItemMoveArborist}  // New handler
    // ... other props
  />
) : (
  <LegacyTreeView
    items={rootItems}
    spaceId={currentSpace.id}
    selectedId={sidebarSelectedId}
    activeId={sidebarSelectedId}
    accentColor={currentSpace.accentColor}
    onItemClick={handleItemClick}
    onItemContextMenu={handleItemContextMenu}
    onItemDrop={handleItemDrop}  // Existing handler
    // ... other props
  />
)}
```

#### 3.3 Create New Arborist Move Handler

```typescript
const handleItemMoveArborist = useCallback(async (
  draggedItemId: string,
  newParentId: string | null,
  newIndex: number
) => {
  console.log('[Arborist Move]', { draggedItemId, newParentId, newIndex });
  
  // Direct call - Arborist already computed position
  const result = await itemsApi.move(
    draggedItemId,
    currentSpace.id,
    newParentId || undefined,
    newIndex
  );

  if (result?.success) {
    await refetch();  // Refresh UI
  } else {
    console.error('[Arborist Move] Backend failed, refreshing to rollback UI');
    await refetch();  // Rollback to backend state
  }
}, [currentSpace, refetch]);
```

### Success Criteria
- ✅ App runs with flag = false (legacy mode)
- ✅ All existing functionality works
- ✅ URL param `?arborist=true` switches to new tree
- ✅ Can toggle between implementations without crashes

### Rollback
- Set `FeatureFlags.USE_ARBORIST_TREE = false`
- Remove conditional code (keep legacy only)

---

## Phase 4: Testing & Validation

### Objectives
- Test new implementation extensively
- Compare behavior with legacy
- Identify any issues before switch

### Tasks

#### 4.1 Manual Testing Checklist

**Test with:** `?arborist=true` URL parameter

| Test Case | Legacy | Arborist | Status |
|-----------|--------|----------|--------|
| **Display & Rendering** |
| Tree renders correctly | ✅ | ⬜ | |
| Icons display (folders, links, favicons) | ✅ | ⬜ | |
| Indentation correct | ✅ | ⬜ | |
| Expand/collapse animation | ✅ | ⬜ | |
| **Selection** |
| Click to select item | ✅ | ⬜ | |
| Selected state visual | ✅ | ⬜ | |
| Active item border | ✅ | ⬜ | |
| **Drag & Drop** |
| Drag item before another | ✅ | ⬜ | |
| Drag item after another | ✅ | ⬜ | |
| Drag item into folder | ✅ | ⬜ | |
| Drag from root to nested | ✅ | ⬜ | |
| Drag from nested to root | ✅ | ⬜ | |
| Drag between folders | ✅ | ⬜ | |
| Auto-expand folder on hover | ✅ | ⬜ | |
| Prevent drag into self | ✅ | ⬜ | |
| Prevent drag into descendant | ✅ | ⬜ | |
| **Context Menu** |
| Right-click shows menu | ✅ | ⬜ | |
| Hover actions (add subfolder/link) | ✅ | ⬜ | |
| **Inline Operations** |
| Add folder at root | ✅ | ⬜ | |
| Add folder in folder | ✅ | ⬜ | |
| Add link | ✅ | ⬜ | |
| Rename (F2) | ✅ | ⬜ | |
| Cancel inline input (Esc) | ✅ | ⬜ | |
| **Performance** |
| Render 100+ items | ✅ | ⬜ | |
| Smooth scrolling | ✅ | ⬜ | |
| No flicker on drag | ⚠️ | ⬜ | |

#### 4.2 Automated Tests

**File:** `packages/react-ui/__tests__/components/tree/arborist/SpayceTree.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SpayceTree } from '../../../../src/components/tree/arborist/SpayceTree';

describe('SpayceTree', () => {
  const mockItems = [
    { id: '1', name: 'Folder 1', type: 'folder', children: [] },
    { id: '2', name: 'Link 1', type: 'link', path: 'https://example.com', children: [] },
  ];

  it('renders items correctly', () => {
    render(<SpayceTree items={mockItems} spaceId="test" />);
    expect(screen.getByText('Folder 1')).toBeInTheDocument();
    expect(screen.getByText('Link 1')).toBeInTheDocument();
  });

  it('calls onItemClick when item is clicked', () => {
    const handleClick = jest.fn();
    render(<SpayceTree items={mockItems} spaceId="test" onItemClick={handleClick} />);
    fireEvent.click(screen.getByText('Folder 1'));
    expect(handleClick).toHaveBeenCalledWith(mockItems[0]);
  });

  // Add 20+ more tests covering all scenarios
});
```

Run tests:
```bash
pnpm test -- SpayceTree
```

#### 4.3 Position Calculation Validation

Re-run the 36 position calculation tests with Arborist:
```bash
pnpm test -- dropPositionCalculation
```

Compare results with legacy implementation.

### Success Criteria
- ✅ All manual tests pass for Arborist
- ✅ All automated tests pass
- ✅ Position calculations match expected results
- ✅ No regressions in functionality
- ✅ Performance equal or better than legacy

### Rollback
- Fix issues if found
- Keep flag = false if blocking issues
- Document any limitations

---

## Phase 5: Backend Transaction Safety

### Objectives
- Implement atomic transactions for move operations
- Add rollback mechanism for failed moves
- Validate position calculations before commit

### Tasks

#### 5.1 Add Transaction Support to Repository

**File:** `packages/infrastructure/src/persistence/sqlite/SqliteSpaceItemsRepository.ts`

```typescript
async moveItemTransactional(
  itemId: string,
  newSpaceId: string,
  newParentId: string | null,
  newOrder: number
): Promise<{ success: boolean; error?: string }> {
  // Start transaction
  const transaction = this.db.transaction(() => {
    try {
      // 1. Validate move is legal
      const item = this.getItemById(itemId);
      if (!item) {
        throw new Error(`Item not found: ${itemId}`);
      }

      // 2. Prevent move into self or descendant
      if (newParentId && this.isDescendant(newParentId, itemId)) {
        throw new Error('Cannot move item into itself or its descendant');
      }

      // 3. Get current state for rollback
      const currentState = {
        spaceId: item.space_id,
        parentId: item.parent_id,
        sortOrder: item.sort_order,
      };

      // 4. Perform move with sibling shifting
      this.moveItem(itemId, newSpaceId, newParentId, newOrder);

      // 5. Validate final state
      const siblings = this.getItemChildren(newParentId, newSpaceId);
      const sortOrders = siblings.map(s => s.sort_order).sort((a, b) => a - b);
      
      // Check for duplicates
      if (new Set(sortOrders).size !== sortOrders.length) {
        throw new Error('Duplicate sort_order detected after move');
      }

      // Check for gaps
      for (let i = 0; i < sortOrders.length; i++) {
        if (sortOrders[i] !== i) {
          throw new Error(`Gap in sort_order: expected ${i}, got ${sortOrders[i]}`);
        }
      }

      return { success: true };
    } catch (error) {
      // Transaction will auto-rollback on throw
      console.error('[Transaction] Move failed:', error);
      throw error;
    }
  });

  try {
    return transaction();
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

private isDescendant(potentialDescendantId: string, ancestorId: string): boolean {
  let currentId: string | null = potentialDescendantId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === ancestorId) return true;
    if (visited.has(currentId)) break; // Circular reference protection
    visited.add(currentId);

    const item = this.getItemById(currentId);
    if (!item) break;
    currentId = item.parent_id;
  }

  return false;
}
```

#### 5.2 Update Use Case with Transaction

**File:** `packages/core/src/application/use-cases/items/MoveItemUseCase.ts`

```typescript
async execute(params: MoveItemParams): Promise<MoveItemResult> {
  // Validate
  if (params.itemId === params.newParentId) {
    return { success: false, error: 'Cannot move item into itself' };
  }

  // Use transactional move
  const result = await this.spaceItemsRepository.moveItemTransactional(
    params.itemId,
    params.newSpaceId,
    params.newParentId || null,
    params.newOrder
  );

  if (!result.success) {
    console.error('[MoveItemUseCase] Transaction failed:', result.error);
    return result;
  }

  return { success: true };
}
```

#### 5.3 Add UI Rollback on Backend Failure

**File:** `packages/desktop/src/renderer/App.tsx`

```typescript
const handleItemMoveArborist = useCallback(async (
  draggedItemId: string,
  newParentId: string | null,
  newIndex: number
) => {
  console.log('[Arborist Move] Starting transaction:', { 
    draggedItemId, 
    newParentId, 
    newIndex 
  });

  try {
    // Call backend with transactional guarantee
    const result = await itemsApi.move(
      draggedItemId,
      currentSpace.id,
      newParentId || undefined,
      newIndex
    );

    if (!result?.success) {
      throw new Error(result?.error || 'Move failed');
    }

    console.log('[Arborist Move] Transaction committed successfully');
    
    // Refresh to ensure UI matches backend
    await refetch();

  } catch (error) {
    console.error('[Arborist Move] Transaction failed, rolling back UI:', error);
    
    // Show error to user
    // TODO: Add toast notification
    console.error('Failed to move item:', error);

    // Force refresh to rollback UI to backend state
    await refetch();
  }
}, [currentSpace, refetch]);
```

### Success Criteria
- ✅ All moves wrapped in SQLite transactions
- ✅ Validation prevents invalid moves
- ✅ Duplicate sort_order detection
- ✅ UI rolls back on backend failure
- ✅ No orphaned items
- ✅ No corrupted sort_order sequences

### Rollback
- Keep legacy moveItem implementation
- Switch back to non-transactional version

---

## Phase 6: Switch & Cleanup

### Objectives
- Switch to Arborist as default
- Remove legacy code
- Clean up feature flag

### Tasks

#### 6.1 Flip Feature Flag

```typescript
// packages/react-ui/src/config/features.ts
export const FeatureFlags = {
  USE_ARBORIST_TREE: true,  // ← FLIP TO TRUE
};
```

#### 6.2 Test Production Build

```bash
pnpm build
# Test built application extensively
```

#### 6.3 Remove Legacy Code (After 1 Week Soak)

```bash
# Delete legacy components
rm -rf packages/react-ui/src/components/tree/legacy/

# Delete old drag-drop code
rm -rf packages/react-ui/src/components/drag-drop/

# Delete drag-drop store
rm packages/react-ui/src/stores/dragDropUiStore.ts
```

#### 6.4 Remove Feature Flag (After 2 Weeks Soak)

Remove conditional rendering from App.tsx, keep only Arborist code.

#### 6.5 Update Documentation

Update README with new architecture:
- React Arborist for tree rendering
- Transactional move operations
- Simplified codebase

### Success Criteria
- ✅ Arborist is default implementation
- ✅ No legacy code remains
- ✅ Production build works perfectly
- ✅ All tests pass
- ✅ Documentation updated

### Rollback Strategy
- Git revert to before Phase 6
- Set flag back to false
- Restore legacy components from git history

---

## Safety Checklist

### Before Each Phase
- [ ] Commit current state
- [ ] All tests passing
- [ ] TypeScript compiles
- [ ] Application runs

### After Each Phase
- [ ] Test all functionality
- [ ] Check for console errors
- [ ] Verify no performance regression
- [ ] Commit changes
- [ ] Tag commit for easy rollback

### Emergency Rollback
```bash
# If anything goes wrong:
git checkout main
git branch -D tree-component
# Or revert specific commits:
git revert <commit-hash>
```

---

## Database Backup Strategy

### Before Phase 5 (Backend Transactions)

```bash
# Backup production database
cp resources/db/spaces.sqlite resources/db/spaces.sqlite.backup.$(date +%Y%m%d_%H%M%S)

# Verify backup
ls -lah resources/db/spaces.sqlite*
```

### Restore If Needed

```bash
# Find latest backup
ls -lt resources/db/spaces.sqlite.backup.*

# Restore
cp resources/db/spaces.sqlite.backup.YYYYMMDD_HHMMSS resources/db/spaces.sqlite
```

---

## Testing Protocol

### Unit Tests
```bash
pnpm test
```

### Integration Tests
```bash
pnpm test:integration
```

### Manual Test Matrix (Excel/Google Sheets)

Track each test case:
- Test Name
- Legacy Result (Pass/Fail)
- Arborist Result (Pass/Fail)
- Notes
- Assignee
- Date Tested

---

## Success Metrics

| Metric | Before | Target | Actual |
|--------|--------|--------|--------|
| Lines of Code | ~1200 | ~600 | TBD |
| Bundle Size | TBD | -10% | TBD |
| Drag-Drop Bugs | 3-4 | 0 | TBD |
| Test Coverage | ~60% | >80% | TBD |
| Move Operation Time | ~100ms | <50ms | TBD |

---

## Timeline

### Conservative Estimate
- **Week 1:** Phases 1-3 (Setup, Build, Integration)
- **Week 2:** Phase 4 (Testing & Validation)
- **Week 3:** Phase 5 (Backend Transactions)
- **Week 4:** Phase 6 (Switch & Cleanup)

### Aggressive Estimate
- **Days 1-2:** Phases 1-3
- **Days 3-4:** Phase 4
- **Day 5:** Phase 5
- **Day 6:** Phase 6

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Arborist doesn't match design | Low | Medium | Full control over node rendering |
| Performance issues | Low | High | Built-in virtualization |
| Backend transaction complexity | Medium | High | Extensive testing, rollback ready |
| User workflow disruption | Low | High | Feature flag, gradual rollout |
| Data corruption | Very Low | Critical | Database backups, transaction safety |

---

## Communication Plan

### Stakeholders
1. User (Product Owner)
2. Development Team
3. QA Team

### Updates
- Daily: Slack/Email progress updates
- Weekly: Demo of current phase
- Blockers: Immediate escalation

---

## Next Step

**Ready to start Phase 1?**

Type "start phase 1" to begin, or request modifications to the plan.
