# Foundational Specs (Required)

These specs must be implemented before feature stories can proceed.

> **Implementation Order**: Specs 012-016 are ordered for incremental development. Each spec builds on previous ones, with SPEC-012 (Inline Input) serving as the foundation.

---

## SPEC-012: Inline Input State Management

**Priority:** P0 - Critical  
**Dependencies:** SPEC-010  
**Estimated Effort:** 2 hours

> **Foundation Spec**: This is the base state management spec for the 012-016 sequence.

### Description

Implement state management for inline folder/link creation inputs.

### Requirements

1. **Inline Input Store** (Zustand)
   - Track active inline input (spaceId, parentId, type)
   - Separate state for sidebar vs space cards
   - Clear state on submit/cancel

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| InlineInputType Enum | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart` | 108-109 |
| InlineInputState Class | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart` | 111-121 |
| inlineInputProvider | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart` | 123 |
| Card Inline Input | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart` | 42-58 |

### Flutter Code Reference

```dart
// From main_layout_final.dart:108-123
enum InlineInputType { folder, link }

class InlineInputState {
  final String spaceId;
  final String? parentId; // null for root level
  final InlineInputType type;

  const InlineInputState({
    required this.spaceId,
    required this.type,
    this.parentId,
  });
}

final inlineInputProvider = StateProvider<InlineInputState?>((ref) => null);
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/stores/inlineInputStore.ts
```

**TypeScript Interface:**
```typescript
// inlineInputStore.ts
import { create } from 'zustand';

type InlineInputType = 'folder' | 'link';

interface InlineInputState {
  spaceId: string;
  parentId: string | null;
  type: InlineInputType;
}

interface InlineInputStore {
  // Sidebar inline input
  sidebarInput: InlineInputState | null;
  setSidebarInput: (state: InlineInputState | null) => void;
  clearSidebarInput: () => void;
  
  // Space card inline input
  cardInput: InlineInputState | null;
  setCardInput: (state: InlineInputState | null) => void;
  clearCardInput: () => void;
  
  // Rename state (combined)
  sidebarRenameItemId: string | null;
  setSidebarRenameItemId: (id: string | null) => void;
  
  cardRenameItemId: string | null;
  setCardRenameItemId: (id: string | null) => void;
}

export const useInlineInputStore = create<InlineInputStore>((set) => ({
  sidebarInput: null,
  setSidebarInput: (state) => set({ sidebarInput: state }),
  clearSidebarInput: () => set({ sidebarInput: null }),
  
  cardInput: null,
  setCardInput: (state) => set({ cardInput: state }),
  clearCardInput: () => set({ cardInput: null }),
  
  sidebarRenameItemId: null,
  setSidebarRenameItemId: (id) => set({ sidebarRenameItemId: id }),
  
  cardRenameItemId: null,
  setCardRenameItemId: (id) => set({ cardRenameItemId: id }),
}));
```

### Acceptance Criteria

- [ ] InlineInputStore created
- [ ] Sidebar input state (spaceId, parentId, type)
- [ ] Card input state (spaceId, parentId, type)
- [ ] Rename item ID state for sidebar
- [ ] Rename item ID state for cards
- [ ] Clear methods work correctly

---

## SPEC-013: Multi-Selection State Management

**Priority:** P1 - High  
**Dependencies:** SPEC-010  
**Estimated Effort:** 3 hours

### Description

Implement multi-selection state for Ctrl+Click and Shift+Click operations.

### Requirements

1. **Multi-Selection Store**
   - Selected item IDs per space
   - Last selected ID (anchor for shift-click)
   - Selection mode tracking

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| MultiSelectionState Class | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart` | 75-95 |
| multiSelectionProvider | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart` | 95-97 |
| Ctrl+Click Handler | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart` | 1817-1843 |
| Shift+Click Handler | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart` | 1845-1874 |

### Flutter Code Reference

```dart
// From main_layout_final.dart:75-97
class MultiSelectionState {
  final String spaceId;
  final Set<String> selectedIds;
  final String lastSelectedId; // Anchor for shift-click range

  const MultiSelectionState({
    required this.spaceId,
    required this.selectedIds,
    required this.lastSelectedId,
  });
}

final multiSelectionProvider = StateProvider<MultiSelectionState?>((ref) => null);
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/stores/selectionStore.ts
```

**TypeScript Interface:**
```typescript
// selectionStore.ts
import { create } from 'zustand';

interface SelectionState {
  spaceId: string | null;
  selectedIds: Set<string>;
  lastSelectedId: string | null;  // Anchor for shift-click
  
  // Actions
  selectSingle: (spaceId: string, itemId: string) => void;
  toggleSelection: (spaceId: string, itemId: string) => void;  // Ctrl+Click
  selectRange: (spaceId: string, itemId: string, allVisibleIds: string[]) => void;  // Shift+Click
  clearSelection: () => void;
  isSelected: (itemId: string) => boolean;
  getSelectedItems: () => string[];
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  spaceId: null,
  selectedIds: new Set(),
  lastSelectedId: null,
  
  selectSingle: (spaceId, itemId) => set({
    spaceId,
    selectedIds: new Set([itemId]),
    lastSelectedId: itemId,
  }),
  
  toggleSelection: (spaceId, itemId) => {
    const state = get();
    // If different space, start fresh
    if (state.spaceId !== spaceId) {
      set({
        spaceId,
        selectedIds: new Set([itemId]),
        lastSelectedId: itemId,
      });
      return;
    }
    
    const newSelected = new Set(state.selectedIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    
    set({
      selectedIds: newSelected,
      lastSelectedId: itemId,
    });
  },
  
  selectRange: (spaceId, itemId, allVisibleIds) => {
    const state = get();
    const anchor = state.lastSelectedId;
    
    if (!anchor || state.spaceId !== spaceId) {
      // No anchor, just select single
      set({
        spaceId,
        selectedIds: new Set([itemId]),
        lastSelectedId: itemId,
      });
      return;
    }
    
    // Find range between anchor and clicked item
    const anchorIndex = allVisibleIds.indexOf(anchor);
    const clickedIndex = allVisibleIds.indexOf(itemId);
    
    if (anchorIndex === -1 || clickedIndex === -1) {
      set({
        spaceId,
        selectedIds: new Set([itemId]),
        lastSelectedId: itemId,
      });
      return;
    }
    
    const start = Math.min(anchorIndex, clickedIndex);
    const end = Math.max(anchorIndex, clickedIndex);
    const rangeIds = allVisibleIds.slice(start, end + 1);
    
    set({
      spaceId,
      selectedIds: new Set(rangeIds),
      // Keep anchor the same for shift-click
    });
  },
  
  clearSelection: () => set({
    spaceId: null,
    selectedIds: new Set(),
    lastSelectedId: null,
  }),
  
  isSelected: (itemId) => get().selectedIds.has(itemId),
  
  getSelectedItems: () => Array.from(get().selectedIds),
}));
```

### Acceptance Criteria

- [ ] SelectionStore created
- [ ] selectSingle clears previous and selects one
- [ ] toggleSelection adds/removes (Ctrl+Click)
- [ ] selectRange selects between anchor and target (Shift+Click)
- [ ] clearSelection resets all state
- [ ] Selection clears on space switch
- [ ] isSelected helper works

---

## SPEC-014: Enhanced Drag-Drop State Management

**Priority:** P0 - Critical  
**Dependencies:** SPEC-010  
**Estimated Effort:** 4 hours

### Description

Enhance existing dragDropUiStore with full drag operation tracking.

### Requirements

1. **Enhanced DragData**
   - Multiple items support
   - Source tracking (sidebar/spaceCard)
   - Ancestor chain for folder validation

2. **Drop Indicator State**
   - Target item ID
   - Drop position (before/after/inside)
   - Parent tracking for nested folders

3. **Auto-Expand Tracking**
   - Currently drag-expanded folder
   - Timer management for expand/collapse

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| DragSource Enum | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart` | 6-7 |
| DropPosition Enum | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart` | 9-10 |
| DragOperation Class | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart` | 12-43 |
| DropIndicatorState | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart` | 45-75 |
| DragData Class | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart` | 77-98 |
| Auto-Expand Provider | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart` | 195-217 |

### Flutter Code Reference

```dart
// From drag_drop_provider.dart
enum DragSource { sidebar, spaceCard }
enum DropPosition { before, after, inside }

class DragOperation {
  final List<SpaceItem> items;
  final String sourceSpaceId;
  final String? sourceParentId;
  final DragSource source;
  final DateTime startTime;
}

class DropIndicatorState {
  final String targetId;
  final DropPosition position;
  final String spaceId;
  final int targetIndex;
  final String? targetParentId;
  final List<String> ancestorIds;
}

class DragData {
  final SpaceItem item;
  final List<SpaceItem> items; // For multi-select
  final String spaceId;
  final String? parentId;
  final int sourceIndex;
}
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/stores/dragDropUiStore.ts
packages/react-ui/src/types/index.ts
```

**Enhanced TypeScript Interface:**
```typescript
// types/index.ts - Add these types
export type DragSource = 'sidebar' | 'spaceCard';
export type DropPosition = 'before' | 'after' | 'inside';

export interface DragData {
  item: SpaceItem;
  items: SpaceItem[];        // For multi-select
  spaceId: string;
  parentId: string | null;
  sourceIndex: number;
  source: DragSource;
  ancestorIds: string[];     // For validation
}

export interface DropIndicatorState {
  targetId: string;
  position: DropPosition;
  spaceId: string;
  targetIndex: number;
  targetParentId: string | null;
}

// dragDropUiStore.ts - Enhanced store
interface DragDropUiState {
  // Drag state
  isDragging: boolean;
  dragData: DragData | null;
  
  // Drop indicator
  dropIndicator: DropIndicatorState | null;
  
  // Auto-expand
  dragExpandedFolderId: string | null;
  
  // Flash animation
  flashItemId: string | null;
  
  // Pins grid hover
  isOverPinsGrid: boolean;
  pinsDropIndex: number | null;
  
  // Actions
  startDrag: (data: DragData) => void;
  setDropIndicator: (indicator: DropIndicatorState | null) => void;
  endDrag: () => void;
  setDragExpandedFolder: (id: string | null) => void;
  setFlashItem: (id: string | null) => void;
  setOverPinsGrid: (isOver: boolean, dropIndex?: number | null) => void;
}
```

### Acceptance Criteria

- [ ] DragData supports multiple items array
- [ ] DragData tracks source (sidebar/spaceCard)
- [ ] DragData includes ancestorIds for validation
- [ ] DropIndicatorState tracks position (before/after/inside)
- [ ] dragExpandedFolderId for auto-expand
- [ ] flashItemId for drop animation
- [ ] isOverPinsGrid and pinsDropIndex for pins grid

---

## SPEC-015: Inline Rename State Management

**Priority:** P0 - Critical  
**Dependencies:** SPEC-012  
**Estimated Effort:** 1 hour

### Description

Inline rename state is combined with SPEC-012 (InlineInputStore).

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Rename Provider (Sidebar) | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart` | 144-145 |
| Rename Provider (Card) | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart` | 38-39 |

### Implementation

Already included in SPEC-012's `useInlineInputStore`:
- `sidebarRenameItemId: string | null`
- `cardRenameItemId: string | null`

### Acceptance Criteria

- [ ] sidebarRenameItemId state in inlineInputStore
- [ ] cardRenameItemId state in inlineInputStore
- [ ] setSidebarRenameItemId method works
- [ ] setCardRenameItemId method works

---

## SPEC-016: Clipboard State Management

**Priority:** P0 - Critical  
**Dependencies:** SPEC-007, SPEC-010, SPEC-012, SPEC-013, SPEC-014  
**Estimated Effort:** 4 hours

> **Note**: This spec is positioned last in the 012-016 sequence because it depends on Inline Input (012), Multi-Selection (013), and Drag-Drop (014) state management.

### Description

Implement internal clipboard state management for copy/paste operations of SpaceItems.

### Requirements

1. **Clipboard Store** (Zustand)
   - Store copied items with source space ID
   - Track clipboard action (copy/cut)
   - Clear clipboard on paste or timeout

2. **IPC Integration**
   - System clipboard read/write for URLs
   - Detect URL pattern in system clipboard

3. **Multi-Selection Integration**
   - Uses SPEC-013's getSelectedItems() for multi-item operations
   - Coordinates state clearing with selection store

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Clipboard State | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart` | 125-142 |
| ClipboardAction Enum | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart` | 127-128 |

### Flutter Code Reference

```dart
// From main_layout_final.dart:125-142
enum ClipboardAction { copy, cut }

class SpaceClipboardState {
  final List<SpaceItem> items;
  final String sourceSpaceId;
  final ClipboardAction action;

  const SpaceClipboardState({
    required this.items,
    required this.sourceSpaceId,
    required this.action,
  });
}

final spaceClipboardProvider = StateProvider<SpaceClipboardState?>((ref) => null);
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/stores/clipboardStore.ts
```

**TypeScript Interface:**
```typescript
// clipboardStore.ts
import { create } from 'zustand';
import type { SpaceItem } from '../types';

type ClipboardAction = 'copy' | 'cut';

interface ClipboardState {
  items: SpaceItem[];
  sourceSpaceId: string | null;
  action: ClipboardAction | null;
  
  // Actions
  copyItems: (items: SpaceItem[], spaceId: string) => void;
  cutItems: (items: SpaceItem[], spaceId: string) => void;
  pasteItems: (targetId: string, position?: 'before' | 'after' | 'inside') => Promise<void>;
  canPaste: (targetId: string) => boolean;
  clear: () => void;
  hasItems: () => boolean;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  items: [],
  sourceSpaceId: null,
  action: null,
  
  copyItems: (items, spaceId) => set({
    items,
    sourceSpaceId: spaceId,
    action: 'copy',
  }),
  
  cutItems: (items, spaceId) => set({
    items,
    sourceSpaceId: spaceId,
    action: 'cut',
  }),
  
  pasteItems: async (targetId, position = 'inside') => {
    // Implementation will integrate with SpaceItem operations
    // and clear both clipboard and selection state after paste
  },
  
  canPaste: (targetId) => {
    const state = get();
    return state.items.length > 0;
    // Add target validation logic
  },
  
  clear: () => set({
    items: [],
    sourceSpaceId: null,
    action: null,
  }),
  
  hasItems: () => get().items.length > 0,
}));
```

**IPC Handlers to Add:**
```typescript
// packages/desktop/src/main/ipc/handlers.ts
ipcMain.handle('clipboard:readText', () => {
  return clipboard.readText();
});

ipcMain.handle('clipboard:writeText', (_, text: string) => {
  clipboard.writeText(text);
});
```

### Acceptance Criteria

- [ ] ClipboardStore created with items, sourceSpaceId, action
- [ ] copyItems and cutItems methods work
- [ ] pasteItems method executes paste with position support
- [ ] canPaste method validates target compatibility
- [ ] clear method works
- [ ] IPC handlers for system clipboard read/write
- [ ] URL detection regex: `/^https?:\/\/|^[^\s]+\.[^\s]+$/`
- [ ] Integration with SPEC-013 selection state for multi-item operations
