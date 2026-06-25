---
id: F018
title: Shift+Click Range Selection
type: feature
priority: P1
status: pending
related_specs:
  - "013"
affected_files:
  - packages/react-ui/src/stores/selectionStore.ts
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/components/TreeView.tsx
  - packages/react-ui/src/utils/treeUtils.ts
estimated_hours: 4
---

# F018: Shift+Click Range Selection

## User Story

> As a user, I want to Shift+Click to select all items between my last selection and the clicked item, so I can quickly select a contiguous range.

## Context

This feature extends multi-selection (F017) with range selection. When the user Shift+Clicks an item, all visible items between the anchor (last selected item) and the clicked item are selected. This follows standard OS file manager behavior.

The range is calculated based on **visible items only** - collapsed folder children are not included. This requires a utility function to flatten the visible tree structure.

## Acceptance Criteria

- [ ] Shift+Click selects range from anchor to clicked item
- [ ] Anchor is the last selected item (from Ctrl+Click or regular click)
- [ ] Range includes items in tree order (visible items only)
- [ ] Range respects expanded state (collapsed children not included)
- [ ] If no anchor exists, Shift+Click just selects the clicked item
- [ ] Shift+Click after Ctrl+Click uses the Ctrl+Click item as anchor
- [ ] Range selection works in both directions (up and down)
- [ ] Anchor is preserved after range selection (for subsequent Shift+Clicks)

## Technical Implementation

### Files to Create

1. **treeUtils.ts** - Utility functions for tree operations
   - `flattenVisibleItems(items, expandedIds)` - Returns flat array of visible items
   - `getVisibleItemIds(items, expandedIds)` - Returns array of visible item IDs

### Files to Update

1. **selectionStore.ts** - Already has `selectRange` method
2. **TreeItem.tsx** - Add Shift+Click handling to click handler
3. **TreeView.tsx** - Compute and pass visible item IDs to TreeItem

### Tree Utility Functions

```typescript
// packages/react-ui/src/utils/treeUtils.ts
import type { SpaceItem } from '../types';

/**
 * Flattens a tree of items into a flat array, respecting expanded state.
 * Only includes items that are currently visible (parent is expanded).
 */
export function flattenVisibleItems(
    items: SpaceItem[],
    expandedIds: Set<string>
): SpaceItem[] {
    const result: SpaceItem[] = [];
    
    function flatten(nodes: SpaceItem[]) {
        for (const item of nodes) {
            result.push(item);
            
            // Only recurse into children if this folder is expanded
            const isExpanded = expandedIds.has(item.id);
            if (isExpanded && item.children && item.children.length > 0) {
                flatten(item.children);
            }
        }
    }
    
    flatten(items);
    return result;
}

/**
 * Returns array of visible item IDs in tree order.
 */
export function getVisibleItemIds(
    items: SpaceItem[],
    expandedIds: Set<string>
): string[] {
    return flattenVisibleItems(items, expandedIds).map(item => item.id);
}
```

### Click Handler Update (TreeItem.tsx)

```typescript
const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isRenaming) return;
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
    const isShift = e.shiftKey;
    
    if (isCtrlOrCmd) {
        // Toggle selection (F017)
        useSelectionStore.getState().toggleSelection(spaceId, item.id);
    } else if (isShift) {
        // Range selection
        useSelectionStore.getState().selectRange(spaceId, item.id, allVisibleIds);
    } else {
        // Regular click - clear multi-selection and select single
        useSelectionStore.getState().clearSelection();
        onItemClick?.(item);
    }
    
    // Toggle expand/collapse for folders
    if (isFolder) {
        onItemExpand?.(item, !isExpanded);
    }
}, [item, spaceId, isFolder, isExpanded, isRenaming, allVisibleIds, onItemClick, onItemExpand]);
```

### TreeView Updates

```typescript
// In TreeView.tsx
import { getVisibleItemIds } from '../utils/treeUtils';

// Compute visible IDs once per render
const visibleIds = useMemo(
    () => getVisibleItemIds(items, expandedIds),
    [items, expandedIds]
);

// Pass to TreeItem
<TreeItem
    ...
    allVisibleIds={visibleIds}
/>
```

### Selection Store (Already Implemented)

The `selectRange` method in `selectionStore.ts` already handles:
- Finding anchor and clicked indices in the visible IDs array
- Calculating the range (min to max index)
- Setting the selected IDs to the range
- Preserving the anchor (lastSelectedId) for subsequent Shift+Clicks

```typescript
// Already in selectionStore.ts
selectRange: (spaceId, itemId, allVisibleIds) => {
    const state = get();
    const anchor = state.lastSelectedId;
    
    if (!anchor || state.spaceId !== spaceId) {
        // No anchor, just select clicked item
        set({
            spaceId,
            selectedIds: new Set([itemId]),
            lastSelectedId: itemId,
        });
        return;
    }
    
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
        // Keep anchor the same for subsequent shift-clicks
    });
};
```

## Flutter Reference

```dart
// main_layout_final.dart:1845-1874
void _handleShiftClick() {
    final currentSelection = ref.read(multiSelectionProvider);
    final selectedItem = ref.read(selectedSpaceItemProvider);
    
    // Get the anchor item (last selected)
    String? anchorId = currentSelection?.lastSelectedId ?? selectedItem?.item.id;
    
    if (anchorId == null) {
        // No anchor, just select this item
        ref.read(multiSelectionProvider.notifier).state = MultiSelectionState(
            spaceId: widget.spaceId,
            selectedIds: {widget.item.id},
            lastSelectedId: widget.item.id,
        );
        return;
    }
    
    // Get range of items between anchor and this item
    final range = _getItemRange(anchorId, widget.item.id);
    final newSelection = Set<String>.from(currentSelection?.selectedIds ?? {});
    newSelection.addAll(range);
    
    ref.read(multiSelectionProvider.notifier).state = MultiSelectionState(
        spaceId: widget.spaceId,
        selectedIds: newSelection,
        lastSelectedId: widget.item.id,
    );
}

// main_layout_final.dart:1894-1902
List<SpaceItem> _flattenVisibleItems(List<SpaceItem> items) {
    final result = <SpaceItem>[];
    for (final item in items) {
        result.add(item);
        if (item.isExpanded && item.children.isNotEmpty) {
            result.addAll(_flattenVisibleItems(item.children));
        }
    }
    return result;
}
```

## Design System Tokens

No new visual tokens needed. Visual feedback is handled by F019.

## Testing Checklist

### Unit Tests

- [ ] `flattenVisibleItems` returns all items when all expanded
- [ ] `flattenVisibleItems` excludes collapsed folder children
- [ ] `flattenVisibleItems` handles empty tree
- [ ] `flattenVisibleItems` handles deeply nested items
- [ ] `getVisibleItemIds` returns IDs in correct order
- [ ] `selectRange` selects correct range (anchor before clicked)
- [ ] `selectRange` selects correct range (anchor after clicked)
- [ ] `selectRange` handles missing anchor gracefully
- [ ] `selectRange` preserves anchor for subsequent calls

### Integration Tests

- [ ] Click item A → Shift+Click item C → A, B, C selected
- [ ] Shift+Click with no anchor → only clicked item selected
- [ ] Ctrl+Click item A → Shift+Click item C → range from A to C
- [ ] Collapse folder → Shift+Click excludes collapsed children
- [ ] Shift+Click above anchor → range reverses correctly

### Manual Testing

- [ ] Click item → Shift+Click below → range selected
- [ ] Click item → Shift+Click above → range selected
- [ ] Ctrl+Click → Shift+Click → uses Ctrl+Click as anchor
- [ ] Collapse folder → Shift+Click → collapsed items excluded
- [ ] Multiple Shift+Clicks → anchor preserved, range updates
- [ ] Works at any nesting level

## Dependencies

- F017 (Ctrl+Click Toggle Selection) - Must be implemented first
- Spec 013 (Selection Store) - Already implemented

## Notes

- The `lastSelectedId` (anchor) is NOT updated on Shift+Click to allow extending the range
- Range selection replaces the current selection (doesn't add to it)
- If anchor is no longer visible (parent collapsed), treat as no anchor
