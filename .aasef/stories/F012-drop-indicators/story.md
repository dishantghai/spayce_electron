---
id: F012
title: Drop Indicators
type: feature
priority: P0
status: pending
related_specs: []
affected_files:
  - packages/react-ui/src/components/drag-drop/DropIndicatorLine.tsx
  - packages/react-ui/src/components/drag-drop/DropIndicatorLine.module.css
  - packages/react-ui/src/components/TreeView.tsx
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/stores/dragDropUiStore.ts
estimated_hours: 4
---

# F012: Drop Indicators

## User Story

> As a user, I want to see a visual indicator showing where my dragged item will land, so I can drop it precisely.

## Context

When dragging items in the tree view, users need clear visual feedback about where the item will be placed. This feature implements a horizontal line indicator that appears between items to show the insertion point. The line respects tree indentation and uses the space's accent color.

This builds on F011 (Drag Tree Items) and is required by F013 (Drop Target Hit Zones).

## Acceptance Criteria

- [ ] Horizontal line shows drop position (before/after)
- [ ] Line matches tree indentation level
- [ ] Line color matches space accent color
- [ ] Smooth fade in/out animation (100-150ms)
- [ ] Terminal circle at line start (Arc Browser style)
- [ ] Line has 2px height with rounded ends
- [ ] Line disappears when drag ends or leaves target

## Technical Implementation

### Components to Create

1. **DropIndicatorLine.tsx** - Visual drop position indicator
   - Props: `visible`, `level`, `accentColor`
   - Horizontal line with terminal circle at start
   - Respects tree indentation (level * 16px or 24px)
   - Animated opacity transition

2. **DropIndicatorLine.module.css** - Styles for drop indicator
   - Line: 2px height, rounded ends
   - Terminal circle: 8px diameter, bleeds 4px left
   - Fade animation: 100-150ms ease

### Components to Update

1. **TreeItem.tsx**
   - Render DropIndicatorLine before/after item based on dropIndicator state
   - Pass level for correct indentation
   - Pass accentColor for line color

2. **TreeView.tsx**
   - Subscribe to dropIndicator from dragDropUiStore
   - Pass dropIndicator state down to TreeItem

3. **dragDropUiStore.ts**
   - dropIndicator already exists with targetId, position, etc.
   - Ensure setDropIndicator/clear work correctly

### State Management

```typescript
// DropIndicatorState (already in dragDropUiStore.ts)
interface DropIndicatorState {
    targetId: string;
    position: DropPosition;  // 'before' | 'after' | 'inside'
    spaceId: string;
    targetIndex: number;
    targetParentId: string | null;
}

// Show indicator
useDragDropUiStore.getState().setDropIndicator({
    targetId: item.id,
    position: 'before',
    spaceId,
    targetIndex: index,
    targetParentId: parentId,
});

// Hide indicator
useDragDropUiStore.getState().setDropIndicator(null);
```

### Design System Tokens

```typescript
// Line dimensions
lineHeight: 2px
lineMinWidth: 50px
lineBorderRadius: 1px (half of height)

// Terminal circle
terminalSize: 8px
terminalOffset: -4px (bleeds left)

// Animation
fadeInDuration: 100ms
fadeOutDuration: 100ms
easing: ease

// Colors
lineColor: accentColor (space accent)

// Indentation
indentPerLevel: 24px (matches TreeItem)
```

## Flutter Reference

```dart
// DropIndicatorLine (drop_indicator_line.dart:6-56)
// Key elements:
// - SizedBox height: lineWidth + 6 (padding for visibility)
// - Terminal circle: 8px, positioned with Transform.translate(-4, 0)
// - Horizontal line: Expanded, rounded border radius

// AnimatedDropIndicatorLine (drop_indicator_line.dart:60-92)
// - AnimatedOpacity: 100ms duration
// - AnimatedContainer for height animation
// - Shows/hides based on visible prop

// Usage in DroppableTreeItem (draggable_tree_item.dart:354-391)
// - Rendered in Column: [indicatorBefore, item, indicatorAfter]
// - Indent calculated as: level * 16.0
// - Color from space accentColor
```

## Testing Checklist

### Unit Tests
- [ ] DropIndicatorLine renders with correct color
- [ ] DropIndicatorLine respects indent level
- [ ] DropIndicatorLine visible state controls opacity
- [ ] Terminal circle is positioned correctly
- [ ] Animation duration is correct

### Integration Tests
- [ ] Indicator appears when dropIndicator state is set
- [ ] Indicator disappears when dropIndicator is cleared
- [ ] Indicator matches correct item (targetId)
- [ ] Position 'before' shows line above item
- [ ] Position 'after' shows line below item

### Manual Testing
- [ ] Drag over item → line appears
- [ ] Line at correct indentation
- [ ] Line color matches space accent color
- [ ] Smooth fade in animation
- [ ] Line disappears when drag leaves
- [ ] Smooth fade out animation
- [ ] Terminal circle visible at line start
