# TDD Test Task: Spec F025 - Smart Drag Preview (Square for Pins)

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

---
id: F025
title: Smart Drag Preview (Square for Pins)
type: feature
priority: P2
status: pending
related_specs: []
affected_files:
  - packages/react-ui/src/components/drag-drop/DragPreview.tsx
  - packages/react-ui/src/components/drag-drop/DragPreview.module.css
  - packages/react-ui/src/components/drag-drop/SmartDragPreview.tsx
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/stores/dragDropUiStore.ts
estimated_hours: 3
---

# F025: Smart Drag Preview (Square for Pins)

## User Story

> As a user, I want the drag preview to change shape when hovering over the pins grid, so I can see how it will appear when pinned.

## Context

When dragging a link, the preview should adapt to the drop target context:
- **Default (sidebar/tree)**: Rectangle preview showing icon + name
- **Over pins grid**: Square preview showing only favicon (48x48)

This provides intuitive visual feedback - the preview morphs to match the target's appearance, helping users understand what will happen on drop.

This feature enhances the existing DragPreview component and integrates with the `isOverPinsGrid` state from dragDropUiStore.

## Acceptance Criteria

- [ ] Normal drag → rectangle preview with icon + name
- [ ] Hover over pins grid → preview morphs to square with favicon only
- [ ] Smooth 150ms transition between shapes
- [ ] Square preview matches pin card dimensions (48x48)
- [ ] Accent color border on square preview matches space theme
- [ ] Multi-item drag → square preview shows first item + count badge
- [ ] Preview position offset maintained during morph

## Technical Implementation

### SmartDragPreview Component

Create a new component that watches `isOverPinsGrid` state and renders the appropriate preview shape:

```typescript
// SmartDragPreview.tsx
import React from 'react';
import { useDragDropUiStore } from '../../stores/dragDropUiStore';
import type { SpaceItem } from '../../types';
import { SpaceItemType } from '../../types';
import styles from './DragPreview.module.css';

interface SmartDragPreviewProps {
  items: SpaceItem[];
  accentColor: string;
}

export function SmartDragPreview({ 
  items, 
  accentColor 
}: SmartDragPreviewProps): React.ReactElement {
  const isOverPinsGrid = useDragDropUiStore(state => state.isOverPinsGrid);
  const item = items[0];
  
  // Only show square preview for links over pins grid
  const showSquare = isOverPinsGrid && item?.type === SpaceItemType.link;
  
  if (items.length === 0) {
    return <div data-testid="smart-drag-preview" />;
  }
  
  return (
    <div 
      data-testid="smart-drag-preview"
      className={styles.smartPreviewContainer}
    >
      <div 
        className={cn(
          styles.previewWrapper,
          showSquare ? styles.squareMode : styles.rectangleMode
        )}
      >
        {showSquare ? (
          <SquarePreview item={item} accentColor={accentColor} />
        ) : (
          <RectanglePreview items={items} accentColor={accentColor} />
        )}
        {items.length > 1 && (
          <CountBadge count={items.length} accentColor={accentColor} />
        )}
      </div>
    </div>
  );
}

function SquarePreview({ 
  item, 
  accentColor 
}: { item: SpaceItem; accentColor: string }) {
  return (
    <div
      data-testid="square-preview"
      className={styles.squarePreview}
      style={{
        borderColor: accentColor,
        backgroundColor: `${accentColor}33`, // 20% opacity
      }}
    >
      {item.faviconUrl ? (
        <img
          src={item.faviconUrl}
          alt=""
          className={styles.squareFavicon}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <LinkIcon size={24} color={accentColor} />
      )}
    </div>
  );
}

function RectanglePreview({ 
  items, 
  accentColor 
}: { items: SpaceItem[]; accentColor: string }) {
  const item = items[0];
  const isFolder = item.type === SpaceItemType.folder || 
                   item.type === SpaceItemType.localFolder;
  
  return (
    <div
      data-testid="rectangle-preview"
      className={styles.rectanglePreview}
      style={{
        borderColor: `${accentColor}80`, // 50% opacity
      }}
    >
      <span className={styles.icon}>
        {isFolder ? (
          <Folder size={16} color={accentColor} />
        ) : (
          <LinkIcon size={16} color={SpayceColors.textSecondary} />
        )}
      </span>
      <span className={styles.name}>{item.name}</span>
    </div>
  );
}

function CountBadge({ 
  count, 
  accentColor 
}: { count: number; accentColor: string }) {
  return (
    <div
      className={styles.countBadge}
      style={{ backgroundColor: accentColor }}
    >
      {count}
    </div>
  );
}
```

### CSS Transitions for Morphing

```css
/* DragPreview.module.css additions */

.smartPreviewContainer {
  position: relative;
  pointer-events: none;
}

.previewWrapper {
  transition: all 150ms ease;
  transform-origin: top left;
}

.squareMode {
  /* Animating to square */
}

.rectangleMode {
  /* Animating to rectangle */
}

/* Smooth morph between shapes */
.squarePreview {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 2px solid;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transition: all 150ms ease;
}

.rectanglePreview {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 280px;
  min-width: 150px;
  padding: 8px 12px;
  background-color: rgba(26, 22, 40, 0.95);
  border-radius: 8px;
  border: 1.5px solid;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  transition: all 150ms ease;
}

/* Count badge positioning adapts to shape */
.squareMode .countBadge {
  position: absolute;
  top: -6px;
  right: -6px;
}

.rectangleMode .countBadge {
  position: absolute;
  top: -4px;
  right: -8px;
}
```

### Integration with DraggableTreeItem

Update DraggableTreeItem to use SmartDragPreview:

```typescript
// In DraggableTreeItem.tsx or TreeItem.tsx

const createDragImage = (items: SpaceItem[], accentColor: string) => {
  // Create a container for the preview
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-1000px';
  container.style.left = '-1000px';
  document.body.appendChild(container);
  
  // Render SmartDragPreview into container
  const root = createRoot(container);
  root.render(
    <SmartDragPreview items={items} accentColor={accentColor} />
  );
  
  return { container, cleanup: () => {
    root.unmount();
    document.body.removeChild(container);
  }};
};
```

**Note**: The HTML5 drag image is set once at drag start and cannot be dynamically updated. To achieve the morphing effect, we need an alternative approach:

### Custom Drag Layer Approach

Since native drag images can't morph, implement a custom drag layer:

```typescript
// CustomDragLayer.tsx
import { useDragDropUiStore } from '../../stores/dragDropUiStore';

export function CustomDragLayer() {
  const { isDragging, dragData } = useDragDropUiStore();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX + 16, y: e.clientY + 8 });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDragging]);
  
  if (!isDragging || !dragData) return null;
  
  return (
    <div
      className={styles.customDragLayer}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <SmartDragPreview 
        items={dragData.items} 
        accentColor={getSpaceColor(dragData.spaceId)} 
      />
    </div>
  );
}
```

Then hide native drag image:
```typescript
// In drag start handler
e.dataTransfer.setDragImage(emptyImage, 0, 0);
```

### Design System Tokens

```typescript
// Preview dimensions
const SMART_PREVIEW = {
  // Square mode (pins grid)
  squareSize: 48,           // Match pin card
  squareBorderRadius: 10,   // SpayceRadius.lg - 2
  squareBorderWidth: 2,
  squareFaviconSize: 24,
  
  // Rectangle mode (tree)
  rectangleMaxWidth: 280,
  rectangleMinWidth: 150,
  rectanglePadding: '8px 12px',
  rectangleBorderRadius: 8,  // SpayceRadius.md
  rectangleBorderWidth: 1.5,
  rectangleIconSize: 16,
  rectangleFontSize: 13,
  
  // Animation
  morphDuration: 150,        // SpayceAnimations.hover
  morphEasing: 'ease',
  
  // Shadows
  squareShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
  rectangleShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
};

// Colors
backgroundColor: SpayceColors.surfaceDark + 'F2',  // 95% opacity
borderColorSquare: spaceColor,                      // 100%
borderColorRectangle: spaceColor + '80',            // 50% opacity
backgroundSquare: spaceColor + '33',                // 20% opacity
```

## Flutter Reference

```dart
// SmartDragPreview (drag_preview_widget.dart:11-123)
class SmartDragPreview extends ConsumerWidget {
  final SpaceItem item;
  final Color accentColor;
  final int itemCount;

  Widget build(BuildContext context, WidgetRef ref) {
    // Watch pins grid state
    final isPinsGridActive = ref.watch(pinsGridDropActiveProvider);
    
    // Show square icon when over pins grid (links only)
    if (isPinsGridActive && item.type == SpaceItemType.link) {
      return _buildSquarePreview();
    }
    
    // Default rectangle preview
    return _buildRectanglePreview();
  }
  
  Widget _buildSquarePreview() {
    return Material(
      elevation: 8,
      shadowColor: Colors.black.withOpacity(0.4),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: accentColor.withOpacity(0.2),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: accentColor, width: 2),
        ),
        child: Center(
          child: FaviconIcon(
            faviconUrl: item.faviconUrl ?? FaviconService.getFaviconUrl(item.path),
            size: 24,
            fallbackColor: accentColor,
          ),
        ),
      ),
    );
  }
  
  Widget _buildRectanglePreview() {
    return Material(
      elevation: 8,
      shadowColor: Colors.black.withOpacity(0.3),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        constraints: BoxConstraints(maxWidth: 280, minWidth: 150),
        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: SpayceColors.surfaceDark.withOpacity(0.95),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: accentColor.withOpacity(0.5), width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(item.type.icon, size: 16),
            SizedBox(width: 8),
            Flexible(child: Text(item.name, maxLines: 1, overflow: TextOverflow.ellipsis)),
            if (itemCount > 1) CountBadge(count: itemCount, color: accentColor),
          ],
        ),
      ),
    );
  }
}
```

## Testing Checklist

### Unit Tests
- [ ] SmartDragPreview renders rectangle by default
- [ ] SmartDragPreview renders square when isOverPinsGrid=true
- [ ] SmartDragPreview renders rectangle for folders even over pins grid
- [ ] SquarePreview shows favicon when available
- [ ] SquarePreview shows fallback icon when no favicon
- [ ] CountBadge displays correct count
- [ ] CSS transitions apply 150ms duration

### Integration Tests
- [ ] Drag link in sidebar → rectangle preview
- [ ] Drag link over pins grid → preview morphs to square
- [ ] Drag link away from pins grid → preview morphs back to rectangle
- [ ] Drag folder over pins grid → stays rectangle (folders can't be pinned)
- [ ] Multi-item drag → shows count badge in both modes

### Manual Testing
- [ ] Drag link → rectangle preview follows cursor
- [ ] Move over pins grid → smooth morph to square (150ms)
- [ ] Move away from pins grid → smooth morph back to rectangle
- [ ] Square preview shows correct favicon
- [ ] Rectangle preview shows icon + name
- [ ] Preview offset maintained during morph (16px right, 8px down)
- [ ] Multi-select shows count badge in corner

## Dependencies

- F022: Drag to Pins Grid (provides `isOverPinsGrid` state)
- F011: Drag Tree Items (provides drag infrastructure)

## Implementation Notes

1. **Native vs Custom Drag Layer**: HTML5 drag images are static. For true morphing, use a custom drag layer that follows mouse position and reads `isOverPinsGrid` state.

2. **Performance**: The custom drag layer approach requires tracking mouse position during drag. Use `requestAnimationFrame` for smooth updates.

3. **Z-Index**: Ensure custom drag layer renders above all other content (z-index: 9999).

4. **Cleanup**: Remove event listeners and unmount custom drag layer when drag ends.


## Acceptance Criteria to Cover

1. [ ] [ ] Normal drag → rectangle preview with icon + name
2. [ ] [ ] Hover over pins grid → preview morphs to square with favicon only
3. [ ] [ ] Smooth 150ms transition between shapes
4. [ ] [ ] Square preview matches pin card dimensions (48x48)
5. [ ] [ ] Accent color border on square preview matches space theme
6. [ ] [ ] Multi-item drag → square preview shows first item + count badge
7. [ ] [ ] Preview position offset maintained during morph

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
describe('Feature: Smart Drag Preview (Square for Pins)')
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

1. **Link tests to spec**: `aasef test link <test-file> --spec F025`
2. **Run RED phase**: `aasef test tdd-red F025`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
