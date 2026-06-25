---
id: F015
title: Auto-Expand Folders on Drag Hover
type: feature
priority: P1
status: pending
related_specs: []
affected_files:
  - packages/react-ui/src/components/drag-drop/DroppableTreeItem.tsx
  - packages/react-ui/src/stores/dragDropUiStore.ts
  - packages/react-ui/src/components/TreeView.tsx
estimated_hours: 4
---

# F015: Auto-Expand Folders on Drag Hover

## User Story

> As a user, I want folders to auto-expand when I hover over them while dragging, so I can drop into nested folders without manual expansion.

## Context

When dragging an item and hovering over a collapsed folder, the folder should automatically expand after a short delay (500ms). This allows users to navigate deep folder hierarchies during drag operations without manually expanding each folder first.

The expansion is temporary - if the user drags away, the folder collapses back. Only one folder can be drag-expanded at a time to avoid visual clutter.

## Acceptance Criteria

- [ ] Hover over closed folder for 500ms → folder expands
- [ ] Only one folder drag-expanded at a time
- [ ] Leave folder subtree → folder collapses (150ms debounce)
- [ ] Drop inside folder → folder stays expanded permanently
- [ ] Quick hover (< 500ms) → folder does NOT expand
- [ ] Re-enter quickly after leaving → cancels collapse timer
- [ ] Drag cancel/end → drag-expanded folder collapses

## Technical Implementation

### State Management

```typescript
// dragDropUiStore already has:
interface DragDropUiState {
    dragExpandedFolderId: string | null;
    setDragExpandedFolder: (id: string | null) => void;
}

// Visual expansion state computed as:
// isExpanded = userExpandedIds.has(id) || dragExpandedFolderId === id
```

### Timer Logic in DroppableTreeItem

```typescript
// In DroppableTreeItem.tsx
const expandTimerRef = useRef<NodeJS.Timeout | null>(null);
const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);

const EXPAND_DELAY = 500;   // ms to wait before expanding
const COLLAPSE_DELAY = 150; // ms to wait before collapsing

const handleDragEnter = () => {
    const isFolder = item.type === 'folder' || item.type === 'localFolder';
    const isCollapsed = !expandedIds.has(item.id) && dragExpandedFolderId !== item.id;
    
    // Cancel any pending collapse
    if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
    }
    
    // Start expand timer for collapsed folders
    if (isFolder && isCollapsed && !expandTimerRef.current) {
        expandTimerRef.current = setTimeout(() => {
            setDragExpandedFolder(item.id);
            expandTimerRef.current = null;
        }, EXPAND_DELAY);
    }
};

const handleDragLeave = (e: React.DragEvent) => {
    // Only process if actually leaving this element
    if (ref.current?.contains(e.relatedTarget as Node)) {
        return;
    }
    
    // Cancel expand timer
    if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
    }
    
    // Start collapse timer if this was drag-expanded
    if (dragExpandedFolderId === item.id) {
        collapseTimerRef.current = setTimeout(() => {
            setDragExpandedFolder(null);
            collapseTimerRef.current = null;
        }, COLLAPSE_DELAY);
    }
};

// On successful drop inside folder, persist expansion
const handleDrop = () => {
    if (dropPosition === 'inside' && dragExpandedFolderId === item.id) {
        // Add to user-expanded set
        onExpandFolder(item.id);
        // Clear drag-expanded state
        setDragExpandedFolder(null);
    }
};

// Cleanup on unmount
useEffect(() => {
    return () => {
        if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
        if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
}, []);
```

### TreeView Integration

```typescript
// In TreeView.tsx
const { dragExpandedFolderId } = useDragDropUiStore();

// Compute effective expanded state
const isEffectivelyExpanded = (itemId: string) => {
    return expandedIds.has(itemId) || dragExpandedFolderId === itemId;
};

// Pass to TreeItem
<TreeItem
    isExpanded={isEffectivelyExpanded(item.id)}
    onDragExpandFolder={(id) => setDragExpandedFolder(id)}
    ...
/>
```

### Design System Tokens

```typescript
// Timing
expandDelay: 500ms    // Time to hover before expanding
collapseDelay: 150ms  // Debounce before collapsing
```

## Flutter Reference

```dart
// Auto-expand timer (draggable_tree_item.dart:396-409)
Timer? _autoExpandTimer;

void _startAutoExpandTimer() {
    if (!widget.item.isExpanded &&
        (widget.item.type == SpaceItemType.folder ||
         widget.item.type == SpaceItemType.localFolder)) {
        _autoExpandTimer?.cancel();
        _autoExpandTimer = Timer(const Duration(milliseconds: 500), () {
            ref.read(dragExpandedFolderProvider.notifier).expand(widget.item.id);
        });
    }
}

// Collapse with debounce (draggable_tree_item.dart:300-336)
Timer? _collapseDebounceTimer;

void _onDragLeave() {
    _autoExpandTimer?.cancel();
    
    final dragExpandedId = ref.read(dragExpandedFolderProvider);
    if (dragExpandedId == widget.item.id) {
        _collapseDebounceTimer = Timer(const Duration(milliseconds: 150), () {
            ref.read(dragExpandedFolderProvider.notifier).collapse();
        });
    }
}

// DragExpandedFolder provider (drag_drop_provider.dart:195-216)
// Single source of truth for drag-expanded folder
// Only one folder can be drag-expanded at a time
```

## Testing Checklist

### Unit Tests
- [ ] Expand timer starts after 500ms hover on collapsed folder
- [ ] Expand timer cancelled on drag leave before 500ms
- [ ] Collapse timer starts on drag leave of drag-expanded folder
- [ ] Collapse timer cancelled on quick re-enter
- [ ] Only one folder can be drag-expanded at a time
- [ ] Drop inside persists expansion to user-expanded set

### Integration Tests
- [ ] Hover over collapsed folder → expands after 500ms
- [ ] Leave folder before 500ms → no expansion
- [ ] Leave expanded folder → collapses after 150ms
- [ ] Re-enter within 150ms → cancels collapse
- [ ] Drop inside folder → folder stays expanded

### Manual Testing
- [ ] Drag over collapsed folder → wait → folder expands
- [ ] Quick hover (< 500ms) → folder does NOT expand
- [ ] Leave folder subtree → folder collapses
- [ ] Re-enter quickly → folder stays expanded
- [ ] Only one folder auto-expands at a time
- [ ] Drop inside → folder stays expanded permanently
- [ ] Cancel drag → folder collapses
