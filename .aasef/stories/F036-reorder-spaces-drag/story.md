---
id: F036
title: Reorder Spaces by Dragging Sidebar Circles
type: feature
priority: P1
status: pending
related_specs: []
dependencies: []
affected_files:
  - packages/react-ui/src/components/sidebar/SpaceCircle.tsx
  - packages/react-ui/src/components/sidebar/SpaceCircle.module.css
  - packages/react-ui/src/components/Sidebar.tsx
  - packages/react-ui/src/hooks/mutations/useReorderSpaces.ts
  - packages/core/src/application/use-cases/spaces/ReorderSpacesUseCase.ts
  - packages/infrastructure/src/persistence/sqlite/SqliteSpacesRepository.ts
estimated_hours: 4
---

# F036: Reorder Spaces by Dragging Sidebar Circles

## User Story

> As a user, I want to drag space circles in the sidebar to reorder them, so I can organize my spaces in my preferred sequence.

## Context

This feature enables users to customize the order of their spaces by dragging the space circles in the sidebar's bottom bar. The reorder persists across app restarts and is reflected in both the sidebar and the Spaces Screen card order.

## Flutter Reference

The Flutter implementation uses:
- `Draggable<Space>` wrapper around space circles
- `DragTarget<Space>` for drop detection
- Scaled feedback (1.2x) during drag
- Opacity reduction (0.4) on source during drag
- Drop indicator line between circles
- `reorderSpaces` method in provider with optimistic update

**Key Flutter Files:**
- `spaces_provider.dart:143-186` - `reorderSpaces` method with optimistic update
- Space circle widget with Draggable/DragTarget pattern

**Flutter reorder implementation:**
```dart
// Draggable space circle pattern
Draggable<Space>(
  data: widget.space,
  feedback: Transform.scale(
    scale: 1.2,
    child: SpaceCircle(space: widget.space, size: 32),
  ),
  childWhenDragging: Opacity(
    opacity: 0.4,
    child: widget.child,
  ),
  child: DragTarget<Space>(
    onWillAcceptWithDetails: (details) => details.data.id != widget.space.id,
    onAcceptWithDetails: (details) {
      ref.read(spacesProvider.notifier).reorderSpace(
        details.data.id,
        targetIndex: widget.index,
      );
    },
    builder: (context, candidateData, rejectedData) {
      return widget.child;
    },
  ),
)

// Provider reorder method (spaces_provider.dart:143-186)
Future<void> reorderSpaces(int oldIndex, int newIndex) async {
  if (_isReordering) return;
  if (oldIndex == newIndex) return;
  
  _isReordering = true;
  
  try {
    final spaces = List<Space>.from(currentState);
    final space = spaces.removeAt(oldIndex);
    spaces.insert(newIndex, space);
    
    // Update order values
    for (int i = 0; i < spaces.length; i++) {
      spaces[i].order = i;
    }
    
    // Optimistic update
    state = AsyncData(spaces);
    
    // Persist in background
    await _persistOrder(spaces);
  } finally {
    _isReordering = false;
  }
}
```

## Acceptance Criteria

- [ ] Space circles in sidebar bottom bar are draggable
- [ ] Drag feedback shows scaled (1.2x) space circle
- [ ] Source circle shows reduced opacity (0.4) during drag
- [ ] Drop indicator line shows between circles during hover
- [ ] Drop reorders spaces immediately (optimistic update)
- [ ] Reorder persists across app restarts
- [ ] Spaces Screen card order reflects new order
- [ ] Cannot drop space onto itself (no-op)
- [ ] Smooth animations during drag (200ms transitions)
- [ ] Active space can be reordered without losing selection

## Technical Implementation

### Create DraggableSpaceCircle Component

```typescript
// packages/react-ui/src/components/sidebar/SpaceCircle.tsx

interface DraggableSpaceCircleProps {
  space: Space;
  index: number;
  isActive: boolean;
  onReorder: (spaceId: string, targetIndex: number) => void;
  onClick: () => void;
}

export function DraggableSpaceCircle({ 
  space, 
  index, 
  isActive,
  onReorder,
  onClick 
}: DraggableSpaceCircleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dropIndicator, setDropIndicator] = useState<'before' | 'after' | null>(null);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      spaceId: space.id, 
      sourceIndex: index 
    }));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    
    // Create custom drag image (scaled circle)
    const dragImage = createDragImage(space);
    e.dataTransfer.setDragImage(dragImage, 16, 16);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Determine drop position (before or after)
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    setDropIndicator(e.clientY < midpoint ? 'before' : 'after');
  };
  
  const handleDragLeave = () => {
    setDropIndicator(null);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropIndicator(null);
    
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    
    if (data.spaceId === space.id) return; // Cannot drop on self
    
    // Calculate target index based on drop position
    const targetIndex = dropIndicator === 'before' ? index : index + 1;
    
    // Adjust for removal of source item
    const adjustedIndex = data.sourceIndex < index 
      ? targetIndex - 1 
      : targetIndex;
    
    onReorder(data.spaceId, adjustedIndex);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  return (
    <div className={styles.draggableContainer}>
      {/* Drop indicator before */}
      {dropIndicator === 'before' && (
        <div 
          className={styles.dropIndicator} 
          style={{ backgroundColor: space.accentColor }} 
        />
      )}
      
      {/* Space circle */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onClick={onClick}
        className={cn(
          styles.spaceCircle,
          isActive && styles.active,
          isDragging && styles.dragging
        )}
        style={{ backgroundColor: space.accentColor }}
        title={space.name}
      >
        <span className={styles.circleInitial}>
          {space.name[0].toUpperCase()}
        </span>
      </div>
      
      {/* Drop indicator after */}
      {dropIndicator === 'after' && (
        <div 
          className={styles.dropIndicator} 
          style={{ backgroundColor: space.accentColor }} 
        />
      )}
    </div>
  );
}
```

### CSS for DraggableSpaceCircle

```css
/* SpaceCircle.module.css */

.draggableContainer {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.spaceCircle {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform var(--duration-hover) ease,
              opacity var(--duration-hover) ease,
              box-shadow var(--duration-hover) ease;
  user-select: none;
}

.spaceCircle:hover {
  transform: scale(1.1);
}

.spaceCircle.active {
  box-shadow: 0 0 0 2px var(--color-bg-dark),
              0 0 0 4px currentColor;
}

.spaceCircle.dragging {
  opacity: 0.4;
}

.circleInitial {
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
}

.dropIndicator {
  width: 100%;
  height: 2px;
  border-radius: 1px;
  opacity: 0.8;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
```

### Create useReorderSpaces Hook

```typescript
// packages/react-ui/src/hooks/mutations/useReorderSpaces.ts

export function useReorderSpaces() {
  const { invalidate } = useInvalidation();
  const [isReordering, setIsReordering] = useState(false);
  
  const reorderSpaces = useCallback(async (
    spaceId: string, 
    newIndex: number
  ) => {
    if (isReordering) return;
    
    setIsReordering(true);
    
    try {
      // Call API to reorder
      const result = await window.spacesApi.reorderSpace(spaceId, newIndex);
      
      if (result.success) {
        // Invalidate spaces to refetch
        invalidate('spaces');
      }
    } catch (error) {
      console.error('Failed to reorder spaces:', error);
    } finally {
      setIsReordering(false);
    }
  }, [isReordering, invalidate]);
  
  return { reorderSpaces, isReordering };
}
```

### Add ReorderSpacesUseCase

```typescript
// packages/core/src/application/use-cases/spaces/ReorderSpacesUseCase.ts

export interface ReorderSpacesInput {
  spaceId: string;
  newIndex: number;
}

export class ReorderSpacesUseCase implements UseCase<ReorderSpacesInput, void> {
  constructor(private spacesRepository: ISpacesRepository) {}
  
  async execute(input: ReorderSpacesInput): Promise<Result<void, AppError>> {
    const { spaceId, newIndex } = input;
    
    try {
      // Get all spaces sorted by order
      const spaces = await this.spacesRepository.getAll();
      spaces.sort((a, b) => a.sortOrder - b.sortOrder);
      
      // Find current index
      const currentIndex = spaces.findIndex(s => s.id === spaceId);
      if (currentIndex === -1) {
        return err(new NotFoundError('Space not found'));
      }
      
      // No-op if same position
      if (currentIndex === newIndex) {
        return ok(undefined);
      }
      
      // Reorder array
      const [movedSpace] = spaces.splice(currentIndex, 1);
      spaces.splice(newIndex, 0, movedSpace);
      
      // Update sortOrder for all spaces
      await this.spacesRepository.updateOrder(
        spaces.map((s, i) => ({ id: s.id, sortOrder: i }))
      );
      
      return ok(undefined);
    } catch (error) {
      return err(new DatabaseError('Failed to reorder spaces'));
    }
  }
}
```

### Update SqliteSpacesRepository

```typescript
// Add updateOrder method to repository

async updateOrder(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
  const stmt = this.db.prepare(`
    UPDATE spaces SET sort_order = ? WHERE id = ?
  `);
  
  const transaction = this.db.transaction(() => {
    for (const { id, sortOrder } of updates) {
      stmt.run(sortOrder, id);
    }
  });
  
  transaction();
}
```

### Update Sidebar to Use DraggableSpaceCircle

```typescript
// In Sidebar.tsx
const { reorderSpaces } = useReorderSpaces();

// Render space circles
<div className={styles.spaceCircles}>
  {spaces.map((space, index) => (
    <DraggableSpaceCircle
      key={space.id}
      space={space}
      index={index}
      isActive={space.id === activeSpaceId}
      onReorder={reorderSpaces}
      onClick={() => setActiveSpace(space.id)}
    />
  ))}
</div>
```

### Design System Tokens

```typescript
// Space circle
circleSize: '32px'
circleRadius: 'var(--radius-full)'  // 999px
circleFontSize: '14px'
circleFontWeight: '600'

// Drag states
dragScale: 1.2
dragOpacity: 0.4

// Drop indicator
indicatorHeight: '2px'
indicatorRadius: '1px'
indicatorOpacity: 0.8

// Transitions
hoverTransition: '150ms ease'
```

## Testing Checklist

### Unit Tests

- [ ] DraggableSpaceCircle renders correctly
- [ ] handleDragStart sets drag data
- [ ] handleDragOver calculates drop position
- [ ] handleDrop calls onReorder with correct index
- [ ] Cannot drop on self (same spaceId)
- [ ] ReorderSpacesUseCase reorders correctly
- [ ] updateOrder updates all spaces in transaction

### Integration Tests

- [ ] Drag space circle → drop indicator shows
- [ ] Drop → spaces reorder
- [ ] Order persists after refresh
- [ ] Spaces Screen reflects new order
- [ ] Active space maintains selection after reorder

### Manual Testing

- [ ] Drag space circle → preview shows (scaled)
- [ ] Source circle shows reduced opacity during drag
- [ ] Hover between circles → indicator appears
- [ ] Drop → spaces reorder immediately
- [ ] Reorder persists after app restart
- [ ] Spaces Screen card order matches new order
- [ ] Active space can be reordered
- [ ] Smooth animations during drag
- [ ] Cannot drop space onto itself
