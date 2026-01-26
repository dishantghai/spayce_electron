---
id: F016
title: Flash Animation on Drop
type: feature
priority: P2
status: pending
related_specs: []
affected_files:
  - packages/react-ui/src/stores/dragDropUiStore.ts
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/components/TreeView.module.css
estimated_hours: 2
---

# F016: Flash Animation on Drop

## User Story

> As a user, I want the dropped item to briefly flash, so I can see where it landed.

## Context

After a drag-and-drop operation completes, the moved item should briefly flash with the space's accent color. This provides visual confirmation of where the item landed, especially helpful in large trees or after dropping into nested folders.

The flash is subtle (30% accent color opacity) and brief (700ms) to avoid being distracting.

## Acceptance Criteria

- [ ] Dropped item background flashes with accent color
- [ ] Flash uses 30% opacity of accent color
- [ ] Animation duration: 700ms
- [ ] Flash auto-clears after animation completes
- [ ] Flash works for all item types (folders, links, files)
- [ ] Flash visible even if item is at the edge of viewport

## Technical Implementation

### State Management

```typescript
// dragDropUiStore already has:
interface DragDropUiState {
    flashItemId: string | null;
    setFlashItem: (id: string | null) => void;
}

// Trigger flash on drop
const handleDrop = async (dragData: DragData, position: DropPosition) => {
    // ... move items ...
    
    // Flash the moved item
    setFlashItem(dragData.item.id);
    setTimeout(() => setFlashItem(null), 700);
};
```

### CSS Animation

```css
/* TreeView.module.css */
@keyframes dropFlash {
    0% {
        background-color: transparent;
    }
    30% {
        background-color: var(--flash-color, rgba(109, 90, 230, 0.3));
    }
    100% {
        background-color: transparent;
    }
}

.treeItem.flash {
    animation: dropFlash 700ms ease-out;
}
```

### TreeItem Integration

```typescript
// In TreeItem.tsx
const { flashItemId } = useDragDropUiStore();
const isFlashing = flashItemId === item.id;

// Compute flash color from accent color
const flashColor = isFlashing 
    ? `${accentColor}4D`  // 30% opacity (hex 4D = 77/255 ≈ 0.30)
    : undefined;

return (
    <div
        className={cn(styles.treeItem, isFlashing && styles.flash)}
        style={{
            '--flash-color': flashColor,
            ...otherStyles
        }}
    >
        ...
    </div>
);
```

### Design System Tokens

```typescript
// Flash animation
flashDuration: 700ms
flashOpacity: 0.3  // 30%
flashPeakTime: 30%  // Peak brightness at 30% of duration
flashEasing: ease-out
```

## Flutter Reference

```dart
// FlashItemId provider (drag_drop_provider.dart:157-172)
@riverpod
class FlashItemId extends _$FlashItemId {
    @override
    String? build() => null;
    
    void flash(String itemId) {
        state = itemId;
        // Auto-clear after animation duration (700ms)
        Future.delayed(const Duration(milliseconds: 700), () {
            if (state == itemId) {
                state = null;
            }
        });
    }
}

// Visual effect in DroppableTreeItem (draggable_tree_item.dart:376-378)
// Container decoration:
color: shouldFlash
    ? widget.accentColor.withOpacity(0.3)
    : showCombine
        ? widget.accentColor.withOpacity(0.1)
        : null,

// Trigger flash on drop (draggable_tree_item.dart:348)
ref.read(flashItemIdProvider.notifier).flash(details.data.item.id);
```

## Testing Checklist

### Unit Tests
- [ ] setFlashItem updates flashItemId in store
- [ ] Flash auto-clears after 700ms
- [ ] Multiple rapid flashes → latest wins
- [ ] Flash state doesn't affect other store state

### Integration Tests
- [ ] Drop item → flash animation plays
- [ ] Flash class applied to correct TreeItem
- [ ] Flash class removed after animation
- [ ] Flash color derived from accent color

### Manual Testing
- [ ] Drop item → brief highlight flash
- [ ] Flash lasts approximately 700ms
- [ ] Flash uses space accent color
- [ ] Flash is visible but not distracting
- [ ] Flash works for folders and links
- [ ] Flash auto-clears (no stuck highlight)
