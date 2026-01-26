# TDD Test Task: Spec F011 - Drag Tree Items

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

---
id: F011
title: Drag Tree Items
type: feature
priority: P0
status: pending
related_specs: []
affected_files:
  - packages/react-ui/src/components/drag-drop/DraggableTreeItem.tsx
  - packages/react-ui/src/components/drag-drop/DragPreview.tsx
  - packages/react-ui/src/components/drag-drop/DragPreview.module.css
  - packages/react-ui/src/components/drag-drop/index.ts
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/components/TreeView.tsx
  - packages/react-ui/src/stores/dragDropUiStore.ts
estimated_hours: 8
---

# F011: Drag Tree Items

## User Story

> As a user, I want to drag items in the sidebar tree to reorder them, so I can organize my content visually.

## Context

This feature enables users to drag items (folders and links) in the sidebar tree view. When dragging begins, a visual preview follows the cursor showing what's being dragged. The source item becomes semi-transparent (ghost effect) to indicate it's being moved.

This is the foundational drag feature that F012-F016 build upon. It must work correctly before drop functionality can be implemented.

## Acceptance Criteria

- [ ] Items are draggable (both folders and links)
- [ ] Drag preview shows item name and icon
- [ ] Ghost opacity on dragged item (0.4)
- [ ] Drag feedback follows cursor with offset (16px right, 8px down)
- [ ] Can drag multiple selected items (shows count badge)
- [ ] Drag starts immediately on desktop (no long-press delay)
- [ ] Haptic feedback on drag start (if available)
- [ ] Release outside valid target → item returns to original position

## Technical Implementation

### Components to Create

1. **DraggableTreeItem.tsx** - Wrapper that makes tree items draggable
   - Props: `item`, `spaceId`, `parentId`, `index`, `level`, `accentColor`, `selectedItems`, `ancestorIds`, `children`
   - Uses HTML5 Drag and Drop API
   - Sets drag data as JSON in dataTransfer
   - Creates custom drag image using DragPreview
   - Updates dragDropUiStore on drag start/end

2. **DragPreview.tsx** - Visual feedback during drag
   - Single item: Rectangle with icon + name (max-width 280px)
   - Multi-item: Stacked cards with count badge
   - Square variant for pins grid (future-proofing)
   - Elevated shadow for floating effect

3. **DragPreview.module.css** - Styles for drag preview
   - Rectangle: 280px max-width, rounded corners, accent border
   - Square: 48x48px for pins grid mode
   - Multi-item: Stacked cards with offset positioning
   - Count badge: Accent color background, white text

### Components to Update

1. **TreeItem.tsx**
   - Wrap with DraggableTreeItem
   - Pass ancestorIds chain for validation
   - Collect selected items for multi-drag

2. **TreeView.tsx**
   - Track ancestorIds chain as tree is rendered
   - Pass selected items to TreeItem for multi-drag

3. **dragDropUiStore.ts**
   - Already has required state (isDragging, dragData, etc.)
   - Ensure startDrag/endDrag work correctly

### State Management

```typescript
// DragData interface (already in dragDropUiStore.ts)
interface DragData {
    item: SpaceItem;
    items: SpaceItem[];  // For multi-select
    spaceId: string;
    parentId: string | null;
    sourceIndex: number;
    source: DragSource;
    ancestorIds: string[];
}

// Start drag
useDragDropUiStore.getState().startDrag({
    item,
    items: selectedItems || [item],
    spaceId,
    parentId,
    sourceIndex: index,
    source: 'sidebar',
    ancestorIds,
});

// End drag
useDragDropUiStore.getState().endDrag();
```

### Design System Tokens

```typescript
// From SpayceColors
previewBackground: SpayceColors.surfaceDark,  // #1A1628
previewBorder: accentColor,                    // 0.5 opacity, 1.5px
textPrimary: SpayceColors.textPrimary,         // #E5E7EB
textSecondary: SpayceColors.textSecondary,     // #9CA3AF

// Dimensions
maxPreviewWidth: 280px
minPreviewWidth: 150px
previewPadding: 12px horizontal, 8px vertical
previewBorderRadius: 8px
iconSize: 16px
fontSize: 13px
fontWeight: 500

// Multi-item
countBadgePadding: 6px horizontal, 2px vertical
countBadgeFontSize: 11px
countBadgeBorderRadius: 10px

// Ghost effect
ghostOpacity: 0.4

// Drag image offset
dragOffsetX: 16px
dragOffsetY: 8px
```

## Flutter Reference

```dart
// DraggableTreeItem (draggable_tree_item.dart:12-125)
// Key behaviors:
// - Uses Draggable<DragData> on desktop, LongPressDraggable on mobile
// - Creates DragData with item, items (multi-select), spaceId, parentId, sourceIndex
// - Feedback widget: SmartDragPreview or MultiItemDragPreview
// - childWhenDragging: Opacity(0.4)
// - Calls dragDropStateProvider.startDrag/endDrag

// SmartDragPreview (drag_preview_widget.dart:11-123)
// - Rectangle: icon + name + optional count badge
// - Square: 48x48 favicon (when over pins grid)
// - Material elevation: 8, shadow opacity 0.3-0.4

// MultiItemDragPreview (drag_preview_widget.dart:212-266)
// - Stack of cards with offset (4px, 4px increments)
// - Shows first item with count badge
// - Max 2 stacked backgrounds visible
```

## Testing Checklist

### Unit Tests
- [ ] DraggableTreeItem renders children correctly
- [ ] DragPreview displays item icon and name
- [ ] DragPreview shows count badge for multi-item
- [ ] DragPreview respects maxWidth constraint
- [ ] dragDropUiStore.startDrag updates state correctly
- [ ] dragDropUiStore.endDrag clears all drag state

### Integration Tests
- [ ] Drag start triggers store update
- [ ] Drag preview appears near cursor
- [ ] Source item shows ghost opacity
- [ ] Drag end clears store state
- [ ] Multi-select drag includes all selected items

### Manual Testing
- [ ] Drag folder → preview shows folder icon + name
- [ ] Drag link → preview shows link icon + name
- [ ] Source item fades to 0.4 opacity during drag
- [ ] Preview follows cursor with offset
- [ ] Multi-select → preview shows stacked cards + count
- [ ] Release outside → item returns to original position
- [ ] Drag works immediately (no delay on desktop)


## Acceptance Criteria to Cover

1. [ ] [ ] Items are draggable (both folders and links)
2. [ ] [ ] Drag preview shows item name and icon
3. [ ] [ ] Ghost opacity on dragged item (0.4)
4. [ ] [ ] Drag feedback follows cursor with offset (16px right, 8px down)
5. [ ] [ ] Can drag multiple selected items (shows count badge)
6. [ ] [ ] Drag starts immediately on desktop (no long-press delay)
7. [ ] [ ] Haptic feedback on drag start (if available)
8. [ ] [ ] Release outside valid target → item returns to original position

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
describe('Feature: Drag Tree Items')
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

1. **Link tests to spec**: `aasef test link <test-file> --spec F011`
2. **Run RED phase**: `aasef test tdd-red F011`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
