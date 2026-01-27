---
id: F019
title: Multi-Selection Visual Feedback
type: feature
priority: P1
status: pending
related_specs:
  - "013"
affected_files:
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/components/TreeView.module.css
  - packages/react-ui/src/stores/selectionStore.ts
estimated_hours: 2
---

# F019: Multi-Selection Visual Feedback

## User Story

> As a user, I want selected items to be visually highlighted, so I can see my selection clearly.

## Context

This feature provides visual feedback for multi-selected items in the tree view. When items are selected via Ctrl+Click (F017) or Shift+Click (F018), they should display a distinct visual style that:
1. Clearly indicates selection state
2. Uses the space's accent color for consistency
3. Is visually distinct from hover and focus states

The styling follows the Flutter implementation: a tinted background using the accent color at low opacity, plus a left border indicator.

## Acceptance Criteria

- [ ] Selected items have tinted background (accent color at 10% opacity)
- [ ] Selected items have left border indicator (2px solid accent color)
- [ ] Hover state on selected items is slightly darker (15% opacity)
- [ ] Selection visual is distinct from focus/active state
- [ ] Selection visual works with any space accent color
- [ ] Selection visual works at any nesting level
- [ ] Multiple selected items all show the same visual treatment

## Technical Implementation

### Files to Update

1. **TreeView.module.css** - Add multi-selection styles
2. **TreeItem.tsx** - Apply selection class based on store state

### CSS Styles

```css
/* packages/react-ui/src/components/TreeView.module.css */

/* Multi-selection highlight */
.treeItem.multiSelected {
    background-color: var(--selection-bg, rgba(109, 90, 230, 0.1));
    border-left: 2px solid var(--tree-accent-color, #6D5AE6);
    padding-left: calc(var(--item-padding-left, 8px) - 2px); /* Compensate for border */
}

.treeItem.multiSelected:hover {
    background-color: var(--selection-bg-hover, rgba(109, 90, 230, 0.15));
}

/* Ensure selection doesn't conflict with active state */
.treeItem.multiSelected.treeItemActive {
    /* Active state takes precedence for the left border */
    border-left-color: var(--tree-accent-color, #6D5AE6);
}
```

### TreeItem Component Update

```typescript
// In TreeItem.tsx
import { useSelectionStore } from '../stores/selectionStore';

// Inside TreeItem component
const { selectedIds, spaceId: selectionSpaceId } = useSelectionStore();
const isMultiSelected = selectionSpaceId === spaceId && selectedIds.has(item.id);

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// In the render
const rowClasses = [
    styles.treeItem,
    isChild && styles.treeItemChild,
    isSelected && styles.treeItemSelected,
    isActive && styles.treeItemActive,
    isMultiSelected && styles.multiSelected,
]
    .filter(Boolean)
    .join(' ');

// Apply CSS custom properties for accent color
<div
    className={rowClasses}
    style={{
        paddingLeft: `${itemPaddingLeft}px`,
        '--tree-accent-color': accentColor,
        '--selection-bg': hexToRgba(accentColor, 0.1),
        '--selection-bg-hover': hexToRgba(accentColor, 0.15),
        '--item-padding-left': `${itemPaddingLeft}px`,
    } as React.CSSProperties}
    ...
>
```

### Selection Store Hook Usage

```typescript
// Efficient subscription - only re-render when selection changes
const isMultiSelected = useSelectionStore((state) => 
    state.spaceId === spaceId && state.selectedIds.has(item.id)
);
```

## Design System Tokens

```typescript
// Selection visual tokens
const SELECTION_TOKENS = {
    // Background opacity levels
    backgroundOpacity: 0.1,      // 10% - normal state
    backgroundHoverOpacity: 0.15, // 15% - hover state
    
    // Border
    borderWidth: 2,              // 2px left border
    borderStyle: 'solid',
    
    // Uses space accent color (dynamic)
    // accentColor: SpaceThemes[spaceIndex]
};

// CSS custom properties
// --tree-accent-color: The space's accent color (e.g., #6D5AE6)
// --selection-bg: rgba(accent, 0.1)
// --selection-bg-hover: rgba(accent, 0.15)
```

## Flutter Reference

```dart
// main_layout_final.dart:2424-2458 (selection styling)
// The Flutter implementation uses:
// - Background: accentColor.withOpacity(0.1)
// - Border: 2px left border with accent color
// - Hover: accentColor.withOpacity(0.15)

// Example from Flutter:
Container(
    decoration: BoxDecoration(
        color: isMultiSelected 
            ? accentColor.withOpacity(0.1)
            : null,
        border: isMultiSelected
            ? Border(left: BorderSide(color: accentColor, width: 2))
            : null,
    ),
    child: ...
)
```

## Visual States Matrix

| State | Background | Left Border | Notes |
|-------|------------|-------------|-------|
| Normal | transparent | none | Default state |
| Hover | accentDark (#2D2645) | none | Standard hover |
| Selected (single) | accentDark | none | Focus indicator |
| Active | accentDark | 2px accent | Currently open item |
| Multi-selected | accent@10% | 2px accent | Multi-selection |
| Multi-selected + Hover | accent@15% | 2px accent | Hover on selected |

## Testing Checklist

### Unit Tests

- [ ] `hexToRgba` converts hex to rgba correctly
- [ ] `hexToRgba` handles 3-digit hex codes
- [ ] Selection class applied when item is in selectedIds
- [ ] Selection class not applied when spaceId differs
- [ ] Selection class removed when item deselected

### Integration Tests

- [ ] Ctrl+Click item → visual highlight appears
- [ ] Ctrl+Click again → visual highlight removed
- [ ] Multiple items selected → all show highlight
- [ ] Hover over selected item → darker highlight
- [ ] Switch space → highlights cleared

### Manual Testing

- [ ] Selected items have visible tinted background
- [ ] Left border indicator visible on selected items
- [ ] Hover state darker than normal selection
- [ ] Works with different space accent colors
- [ ] Selection visual distinct from active state
- [ ] Works at all nesting levels
- [ ] Smooth transition on selection change

## Dependencies

- F017 (Ctrl+Click Toggle Selection) - Selection logic
- F018 (Shift+Click Range Selection) - Range selection logic

## Notes

- The left border adds 2px, so we subtract 2px from padding to maintain alignment
- CSS custom properties allow dynamic accent color without inline styles for everything
- Use Zustand selector to minimize re-renders (only when this item's selection changes)
- The `hexToRgba` helper should be added to a utils file or inline in the component
