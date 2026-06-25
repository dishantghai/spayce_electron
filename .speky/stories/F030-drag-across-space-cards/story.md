---
id: F030
title: Drag Across Space Cards
type: feature
priority: P1
status: pending
related_specs: []
dependencies:
  - F011
  - F013
affected_files:
  - packages/react-ui/src/components/spaces/SpaceCard.tsx
  - packages/react-ui/src/components/spaces/SpaceCardTreeItem.tsx
  - packages/react-ui/src/components/spaces/SpacesScreen.tsx
  - packages/react-ui/src/components/drag-drop/DroppableSpaceCard.tsx
  - packages/react-ui/src/stores/dragDropUiStore.ts
estimated_hours: 3
---

# F030: Drag Across Space Cards

## User Story

> As a user, I want to drag items from one space card to another to move them between spaces, so I can reorganize my content across different spaces efficiently.

## Context

This feature enables cross-card drag and drop on the Spaces Screen. Users can drag an item from Card A and drop it into Card B, moving the item to the target space. The target card highlights with its accent color border when a valid drop is detected.

## Flutter Reference

The Flutter implementation uses:
- `DroppableSpaceCard` wrapper component that accepts drops from any space
- Animated border highlight with space's accent color when hovering
- Box shadow glow effect during hover
- Haptic feedback on drop
- Move operation updates both source and target spaces

**Key Flutter Files:**
- `droppable_space_card.dart:1-74` - Full DroppableSpaceCard implementation
- `space_card_hifi_v2.dart:1129-1227` - DragTarget for tree items

**Flutter DroppableSpaceCard behavior:**
```dart
DragTarget<DragData>(
  onWillAcceptWithDetails: (details) {
    // Accept drops from any space (including same space for reordering)
    setState(() => _isHovering = true);
    return true;
  },
  onAcceptWithDetails: (details) async {
    setState(() => _isHovering = false);
    HapticFeedback.mediumImpact();
    await widget.onAcceptItem?.call(details.data);
  },
  builder: (context, candidateData, rejectedData) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: _isHovering
            ? Border.all(color: widget.space.accentColor, width: 2)
            : null,
        boxShadow: _isHovering
            ? [BoxShadow(
                color: widget.space.accentColor.withOpacity(0.3),
                blurRadius: 12,
                spreadRadius: 2,
              )]
            : null,
      ),
      child: widget.child,
    );
  },
)
```

## Acceptance Criteria

- [ ] Items in space cards are draggable (drag preview shows)
- [ ] Drag from card A → hover over card B → card B border highlights with accent color
- [ ] Card B shows glow shadow effect during hover
- [ ] Drop on card B → item moves to card B's root level
- [ ] Source card (A) updates to show item removed
- [ ] Target card (B) updates to show item added
- [ ] Can drop at specific position within target card tree (uses existing hit zones)
- [ ] Highlight animation is smooth (200ms transition)
- [ ] Cannot drop item onto itself
- [ ] Multi-select drag works across cards

## Technical Implementation

### Create DroppableSpaceCard Component

```typescript
// packages/react-ui/src/components/drag-drop/DroppableSpaceCard.tsx

interface DroppableSpaceCardProps {
  space: Space;
  onAcceptItem: (data: DragData) => Promise<void>;
  children: React.ReactNode;
}

export function DroppableSpaceCard({ 
  space, 
  onAcceptItem, 
  children 
}: DroppableSpaceCardProps) {
  const { dragData } = useDragDropUiStore();
  const [isHovering, setIsHovering] = useState(false);
  
  // Accept drops from any source
  const canAccept = dragData !== null;
  
  const handleDragOver = (e: React.DragEvent) => {
    if (!canAccept) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsHovering(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    // Only trigger if leaving the card entirely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsHovering(false);
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    
    if (!dragData) return;
    
    await onAcceptItem(dragData);
  };
  
  return (
    <div
      className={cn(
        styles.droppableCard,
        isHovering && styles.dropTarget
      )}
      style={{
        '--accent-color': space.accentColor,
      } as React.CSSProperties}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}
```

### CSS for DroppableSpaceCard

```css
.droppableCard {
  transition: border-color 200ms ease,
              box-shadow 200ms ease;
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
}

.dropTarget {
  border-color: var(--accent-color);
  box-shadow: 0 0 12px 2px color-mix(in srgb, var(--accent-color) 30%, transparent);
}
```

### Update SpacesScreen

```typescript
// In SpacesScreen.tsx
const handleCrossCardMove = async (dragData: DragData, targetSpaceId: string) => {
  // Move all dragged items to target space root
  for (const item of dragData.items) {
    await moveItem({
      itemId: item.id,
      newSpaceId: targetSpaceId,
      newParentId: null, // Root level
    });
  }
  
  // Invalidate both spaces
  invalidate(`space-items:${dragData.spaceId}`);
  invalidate(`space-items:${targetSpaceId}`);
};

// Render
{spaces.map((space, index) => (
  <DroppableSpaceCard
    key={space.id}
    space={space}
    onAcceptItem={(data) => handleCrossCardMove(data, space.id)}
  >
    <SpaceCard 
      space={space} 
      spaceIndex={index}
      isSelected={selectedIndex === index}
      onSelect={() => setSelectedIndex(index)}
    />
  </DroppableSpaceCard>
))}
```

### Update DragData Interface

Ensure DragData includes source information:

```typescript
interface DragData {
  item: SpaceItem;           // Primary dragged item
  items: SpaceItem[];        // All selected items (for multi-select)
  spaceId: string;           // Source space ID
  parentId: string | null;   // Source parent folder ID
  sourceIndex: number;       // Original index in parent
  source: 'sidebar' | 'spaceCard';  // Drag origin
  ancestorIds: string[];     // For drop validation
}
```

### Design System Tokens

```typescript
// Drop target styling
dropBorderWidth: '2px'
dropBorderRadius: '12px'  // var(--radius-lg)
dropTransition: '200ms ease'
dropShadowBlur: '12px'
dropShadowSpread: '2px'
dropShadowOpacity: 0.3
```

## Testing Checklist

### Unit Tests

- [ ] DroppableSpaceCard renders children
- [ ] handleDragOver sets isHovering true
- [ ] handleDragLeave sets isHovering false
- [ ] handleDrop calls onAcceptItem with dragData
- [ ] dropTarget class applied when hovering
- [ ] Accent color CSS variable applied correctly

### Integration Tests

- [ ] Drag item from card A → hover card B → highlight shows
- [ ] Drop on card B → item moves to card B
- [ ] Source card updates (item removed)
- [ ] Target card updates (item added)
- [ ] Multi-select drag moves all items

### Manual Testing

- [ ] Drag item from card A → preview shows
- [ ] Hover over card B → border highlights with accent color
- [ ] Hover over card B → glow shadow appears
- [ ] Drop → item moves to card B root
- [ ] Card A updates (item removed)
- [ ] Card B updates (item added)
- [ ] Highlight animation smooth (200ms)
- [ ] Can drag multiple selected items
- [ ] Cannot drop item onto itself
- [ ] Dropping inside card tree works with hit zones
