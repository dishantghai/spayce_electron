---
id: F014
title: Drop Validation
type: feature
priority: P0
status: pending
related_specs: []
affected_files:
  - packages/react-ui/src/utils/dragDropValidation.ts
  - packages/react-ui/src/components/drag-drop/DroppableTreeItem.tsx
  - packages/react-ui/src/stores/dragDropUiStore.ts
estimated_hours: 3
---

# F014: Drop Validation

## User Story

> As a user, I want to be prevented from dropping a folder into itself or its children, so I don't accidentally break my structure.

## Context

This feature implements validation rules for drag-and-drop operations. It prevents invalid drops that would create circular references or result in no-op operations. When a drop is invalid, the indicator doesn't show and the cursor changes to "not-allowed".

This builds on F013 (Drop Target Hit Zones) and is critical for data integrity.

## Acceptance Criteria

- [ ] Cannot drop on itself
- [ ] Cannot drop folder into its own descendants (circular reference)
- [ ] Cannot drop to same position (no-op)
- [ ] Cannot drop multi-selection that contains the target
- [ ] Invalid drop shows no indicator
- [ ] Invalid drop shows "not-allowed" cursor (via dropEffect)
- [ ] Validation errors are tracked in store for debugging

## Technical Implementation

### Files to Create

1. **dragDropValidation.ts** - Validation utility functions
   - `isValidDrop(dragData, targetItem, targetAncestorIds, targetIndex, position): ValidationResult`
   - `isDescendant(parentItem, childId): boolean`
   - Returns structured validation result with error message

### Files to Update

1. **DroppableTreeItem.tsx**
   - Call `isValidDrop` in dragOver handler
   - Set `e.dataTransfer.dropEffect = 'none'` for invalid drops
   - Clear dropIndicator for invalid drops
   - Track validation error in store

2. **dragDropUiStore.ts**
   - Already has `validateCircularReference` method
   - Already has `validationError` state
   - Ensure validation is called when setting drop indicator

### Validation Rules

```typescript
// dragDropValidation.ts
export interface ValidationResult {
    valid: boolean;
    error?: string;
    errorType?: 'self_drop' | 'circular_reference' | 'no_op' | 'multi_contains_target';
}

export function isValidDrop(
    dragData: DragData | null,
    targetItem: SpaceItem,
    targetAncestorIds: string[],
    targetIndex: number,
    position: DropPosition
): ValidationResult {
    if (!dragData) {
        return { valid: false, error: 'No drag data' };
    }
    
    // Rule 1: Cannot drop on itself
    if (dragData.item.id === targetItem.id) {
        return { 
            valid: false, 
            error: 'Cannot drop item on itself',
            errorType: 'self_drop'
        };
    }
    
    // Rule 2: Cannot drop folder into its own descendants
    if (position === 'inside') {
        for (const item of dragData.items) {
            if (targetAncestorIds.includes(item.id)) {
                return { 
                    valid: false, 
                    error: 'Cannot move folder into its descendant',
                    errorType: 'circular_reference'
                };
            }
        }
    }
    
    // Rule 3: Cannot drop multi-selection containing target
    if (dragData.items.some(item => item.id === targetItem.id)) {
        return { 
            valid: false, 
            error: 'Cannot drop selection containing target',
            errorType: 'multi_contains_target'
        };
    }
    
    // Rule 4: Cannot drop to same position (no-op)
    if (dragData.parentId === targetItem.parentId &&
        dragData.spaceId === targetItem.spaceId) {
        // Dropping before adjacent item above = no change
        if (position === 'before' && dragData.sourceIndex === targetIndex - 1) {
            return { valid: false, error: 'Same position', errorType: 'no_op' };
        }
        // Dropping after adjacent item below = no change
        if (position === 'after' && dragData.sourceIndex === targetIndex + 1) {
            return { valid: false, error: 'Same position', errorType: 'no_op' };
        }
        // Dropping on itself
        if (dragData.sourceIndex === targetIndex) {
            return { valid: false, error: 'Same position', errorType: 'no_op' };
        }
    }
    
    return { valid: true };
}

// Helper: Check if childId is a descendant of parent
export function isDescendant(parent: SpaceItem, childId: string): boolean {
    if (!parent.children) return false;
    for (const child of parent.children) {
        if (child.id === childId) return true;
        if (isDescendant(child, childId)) return true;
    }
    return false;
}
```

### Usage in DroppableTreeItem

```typescript
const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    const position = calculateDropPosition(e);
    const validation = isValidDrop(
        dragData,
        item,
        ancestorIds,
        index,
        position
    );
    
    if (!validation.valid) {
        e.dataTransfer.dropEffect = 'none';
        setDropIndicator(null);
        setValidationError({
            type: validation.errorType!,
            message: validation.error!,
            context: { ... }
        });
        return;
    }
    
    e.dataTransfer.dropEffect = 'move';
    clearValidationError();
    setDropIndicator({ ... });
};
```

## Flutter Reference

```dart
// Drop validation (draggable_tree_item.dart:411-456)
bool _isValidDrop(DragData data, DropPosition position) {
    // Cannot drop on itself
    if (data.item.id == widget.item.id) return false;
    
    // Cannot drop into same position (no-op)
    if (data.spaceId == widget.spaceId && data.parentId == widget.parentId) {
        if (position == DropPosition.before && data.sourceIndex == widget.index - 1) {
            return false;
        }
        if (position == DropPosition.after && data.sourceIndex == widget.index + 1) {
            return false;
        }
    }
    
    // Cannot drop folder into its own descendants
    if (position == DropPosition.inside) {
        for (final draggedItem in data.items) {
            if (widget.ancestorIds.contains(draggedItem.id)) {
                return false;
            }
        }
    }
    
    return true;
}

// Descendant check (draggable_tree_item.dart:450-456)
bool _isDescendant(SpaceItem parent, String childId) {
    for (final child in parent.children) {
        if (child.id == childId) return true;
        if (_isDescendant(child, childId)) return true;
    }
    return false;
}
```

## Testing Checklist

### Unit Tests
- [ ] isValidDrop returns false when dropping on self
- [ ] isValidDrop returns false for circular reference (folder into descendant)
- [ ] isValidDrop returns false for no-op (same position)
- [ ] isValidDrop returns false when multi-selection contains target
- [ ] isValidDrop returns true for valid drop positions
- [ ] isDescendant correctly identifies descendants
- [ ] isDescendant returns false for non-descendants
- [ ] Validation result includes correct error type

### Integration Tests
- [ ] Invalid drop clears drop indicator
- [ ] Invalid drop sets dropEffect to 'none'
- [ ] Invalid drop tracks error in store
- [ ] Valid drop shows indicator and sets dropEffect to 'move'

### Manual Testing
- [ ] Drag folder over itself → no indicator, cursor "not-allowed"
- [ ] Drag folder into its child → no indicator
- [ ] Drag folder into grandchild → no indicator
- [ ] Drag to same position → no indicator
- [ ] Valid drops → indicator shows normally
