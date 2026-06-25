# TDD Test Task: Spec 014 - 014

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

# Spec 014: Enhanced Drag-Drop State Management

## Overview
Enhance existing dragDropUiStore with full drag operation tracking, drop indicators, auto-expand functionality, and pins grid integration.

## Out of Scope

This specification does not include:

- Physical drag-and-drop UI components and visual feedback (handled by UI layer)
- Keyboard navigation during drag operations (covered by SPEC-006)
- Database persistence of drag-drop operations (covered by SPEC-001)
- General state management patterns and store architecture (covered by SPEC-012)
- Multi-selection UI interactions and keyboard shortcuts (covered by SPEC-013)
- Space navigation and routing logic (covered by SPEC-015, 016)

### Handled by Other Specs:
- Multi-selection state management: See SPEC-013
- Keyboard navigation: See SPEC-006
- Database setup/configuration: See SPEC-001
- General store patterns: See SPEC-012
- Space navigation: See SPEC-015, 016

## State Management Standards

This specification follows the unified Zustand store patterns established in SPEC-012. All state management must adhere to these standards:

### Store Structure Pattern
```typescript
// Follow SPEC-012 store pattern:
export const useDragDropUiStore = create<DragDropUiState>((set, get) => ({
  // State properties first
  isDragging: false,
  dragData: null,
  // ... other state
  
  // Action methods second
  startDrag: (data: DragData) => {
    set({ isDragging: true, dragData: data });
  },
  // ... other actions
}));
```

### Naming Conventions (from SPEC-012)
- Store names: `use[Feature]Store` (e.g., `useDragDropUiStore`)
- State properties: camelCase descriptive names
- Action methods: verb-based names (startDrag, setDropIndicator, endDrag)
- Boolean flags: `is[State]` or `has[Property]` prefixes

### Cross-Store Integration Rules
- Reference other stores via imports, not direct state sharing
- Use store selectors to prevent unnecessary re-renders
- Follow the store registry pattern to prevent duplicate state management
- See SPEC-012 for complete store implementation guidelines and error handling patterns

## Requirements

### R1: Enhanced DragData Interface
- Support multiple items for multi-selection drag
- Track source context (sidebar/spaceCard)
- Include ancestor chain for folder validation
- Store source index and parent ID
- Track drag start time

### R2: Drop Indicator State
- Track target item ID for drop indicator
- Support drop positions (before/after/inside)
- Store target index for ordering
- Track target parent ID for nested drops
- Include ancestor IDs for validation

### R3: Auto-Expand Tracking
- Track currently drag-expanded folder ID
- Timer management for expand on hover
- Auto-collapse on drag end
- 800ms hover delay before expand

### Timer Management

#### Timer Lifecycle
- **Creation**: setTimeout created on hover with 800ms delay
- **Clearing**: Timer cleared on:
  - Mouse leave before delay completion
  - Component unmount
  - Manual collapse action
  - Focus change to different item
- **Storage**: Timer IDs stored in component state (not global store)
- **Cleanup**: useEffect cleanup function handles timer disposal

#### Implementation Pattern
```javascript
const [expandTimer, setExpandTimer] = useState(null);

// Clear existing timer before setting new one
const clearExpandTimer = () => {
  if (expandTimer) {
    clearTimeout(expandTimer);
    setExpandTimer(null);
  }
};
```

#### Integration with Related Specs:
- **Dependency**: References SPEC-006 for focus context changes that should clear timers
- **State coordination**: Timer clearing should respect inline input states from SPEC-012/015

#### Why not in store:
Timer management is UI-specific behavior, not application state. Keep timers in component scope to avoid unnecessary re-renders and complexity.

### Timer Lifecycle Management

#### Cleanup Triggers (Priority Order)
1. **Component Unmount**: Immediate cleanup of all active timers
   - Triggered by: useEffect cleanup function
   - Implementation: clearTimeout for all tracked timer IDs
   - Required: Must execute before component destruction

2. **Navigation Changes**: Context-specific cleanup based on route changes
   - Triggered by: Route change events, space navigation (SPEC-015, 016)
   - Implementation: Clear timers when leaving space or changing context
   - Integration: Listen to navigation events from SPEC-006

3. **Manual State Resets**: User-initiated or programmatic state clearing
   - Triggered by: Explicit state reset actions, drag operation cancellation
   - Implementation: Call clearExpandTimer() in endDrag and reset methods
   - Required: Must be synchronous to prevent race conditions

4. **Error States**: Cleanup on unrecoverable errors
   - Triggered by: Validation errors, system failures
   - Implementation: Emergency cleanup in error handlers
   - Fallback: Prevent memory leaks even during error conditions

#### Cleanup Implementation Patterns
```javascript
// Component-level cleanup registry
const useTimerCleanup = () => {
  const timers = useRef(new Set());
  
  const registerTimer = (timerId) => {
    timers.current.add(timerId);
    return timerId;
  };
  
  const clearTimer = (timerId) => {
    if (timerId) {
      clearTimeout(timerId);
      timers.current.delete(timerId);
    }
  };
  
  const clearAllTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  };
  
  // Cleanup on unmount
  useEffect(() => clearAllTimers, []);
  
  return { registerTimer, clearTimer, clearAllTimers };
};
```

#### Error Handling During Cleanup
- **Log cleanup failures** without throwing exceptions
- **Graceful degradation** if cleanup partially fails
- **Memory leak prevention** through backup cleanup strategies
- **Silent failure handling** to prevent UI disruption

#### Integration with Related Specs
- **SPEC-012 (Inline Input)**: Reference this spec's cleanup patterns for input timeout timers
- **SPEC-015 (Inline Rename)**: Reference for rename operation timeouts  
- **SPEC-006 (Keyboard Navigation)**: Reference for focus timeout cleanup
- **SPEC-015, 016 (Navigation)**: Integration with route change cleanup triggers

### R4: Pins Grid Integration
- Track hover state over pins grid
- Track drop index in pins grid
- Support reordering within pins grid
- Visual feedback for valid drop targets

### R5: Flash Animation State
- Track recently dropped item ID
- 500ms flash duration
- Auto-clear after animation

### Animation Coordination

Flash animations must coordinate with existing UI state changes to prevent visual conflicts and ensure smooth user experience.

#### State Change Integration
- **Query active UI states** from related specs before triggering flash animations
- **Check inline input states** (SPEC-012, SPEC-015) - defer flash if user is actively editing
- **Respect focus context** (SPEC-006) - flash animations should not interfere with keyboard navigation
- **Coordinate with clipboard feedback** (SPEC-016) - prevent overlapping visual feedback

#### Animation Priority Order
1. **User input states** (inline editing, rename operations) - highest priority
2. **Flash feedback** (drop confirmation, state changes) - medium priority  
3. **Ambient animations** (hover effects, transitions) - lowest priority

#### Conflict Resolution
```typescript
// Flash animation coordination interface
interface AnimationCoordinator {
  canTriggerFlash(itemId: string): boolean;
  deferFlashUntilReady(itemId: string, callback: () => void): void;
  clearConflictingAnimations(itemId: string): void;
}

// Implementation pattern
const triggerFlashAnimation = (itemId: string) => {
  // Check for conflicting states before triggering
  const { isInlineEditing } = useInlineInputStore();
  const { isRenaming } = useRenameStore();
  const { hasFocus } = useFocusStore();
  
  // Defer flash if conflicting states are active
  if (isInlineEditing(itemId) || isRenaming(itemId) || hasFocus(itemId)) {
    // Queue flash for when states clear
    deferFlashUntilReady(itemId, () => setFlashItem(itemId));
    return;
  }
  
  // Safe to trigger flash animation
  setFlashItem(itemId);
  setTimeout(() => setFlashItem(null), 500);
};
```

#### Integration Dependencies
- **SPEC-012**: Query inline input active states before flash
- **SPEC-015**: Check rename operation status  
- **SPEC-006**: Respect focus management boundaries
- **SPEC-016**: Coordinate with clipboard operation feedback

#### Animation Queue Management
- **Single item focus**: Only one flash animation per item at a time
- **Global coordination**: Prevent system-wide animation conflicts
- **Graceful degradation**: Fall back to immediate flash if coordination fails
- **Memory cleanup**: Clear deferred animation callbacks on component unmount

### R6: Enhanced State Interface
```typescript
type DragSource = 'sidebar' | 'spaceCard';
type DropPosition = 'before' | 'after' | 'inside';

interface DragData {
  item: SpaceItem;
  items: SpaceItem[];        // For multi-select
  spaceId: string;
  parentId: string | null;
  sourceIndex: number;
  source: DragSource;
  ancestorIds: string[];     // For validation
}

interface DropIndicatorState {
  targetId: string;
  position: DropPosition;
  spaceId: string;
  targetIndex: number;
  targetParentId: string | null;
}

interface DragDropUiState {
  isDragging: boolean;
  dragData: DragData | null;
  dropIndicator: DropIndicatorState | null;
  dragExpandedFolderId: string | null;
  flashItemId: string | null;
  isOverPinsGrid: boolean;
  pinsDropIndex: number | null;
  
  startDrag: (data: DragData) => void;
  setDropIndicator: (indicator: DropIndicatorState | null) => void;
  endDrag: () => void;
  setDragExpandedFolder: (id: string | null) => void;
  setFlashItem: (id: string | null) => void;
  setOverPinsGrid: (isOver: boolean, dropIndex?: number | null) => void;
}
```

## Performance Constraints

### Drag Operation Throttling
- **Update frequency**: Limit drag position updates to 60fps (16.67ms intervals)
- **Multi-selection limits**: Maximum 100 items per drag operation
- **Visual feedback throttling**: Update drag preview every 33ms during active drag

### Resource Management
- **Memory bounds**: Release drag state immediately on drop/cancel
- **Event debouncing**: Throttle drag enter/leave events to prevent excessive re-renders
- **Large selection handling**: Show count indicator instead of individual previews for >10 items

### Performance Integration
- **Reference SPEC-016**: Follow clipboard-state-management patterns for consistent state cleanup
- **Reference SPEC-006**: Integrate with keyboard-navigation focus management during drag operations
- **Memory cleanup**: Ensure drag state cleanup aligns with existing store memory management patterns

## Circular Reference Prevention

### Validation Logic
Prevent circular references when moving folders by validating against ancestor chains before allowing drop operations.

#### Core Validation Function
```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateCircularReference(
  draggedItemId: string,
  targetFolderId: string | null,
  ancestorIds: string[]
): ValidationResult {
  // 1. Direct self-reference check
  if (draggedItemId === targetFolderId) {
    return { valid: false, error: "Cannot move folder into itself" };
  }
  
  // 2. Ancestor chain check - prevent moving into descendants
  if (targetFolderId && ancestorIds.includes(targetFolderId)) {
    return { valid: false, error: "Cannot move folder into its descendant" };
  }
  
  // 3. Multi-item validation for batch operations
  for (const item of dragData.items) {
    if (item.type === 'folder' && item.ancestorIds?.includes(targetFolderId)) {
      return { valid: false, error: `Cannot move ${item.name} into its descendant` };
    }
  }
  
  return { valid: true };
}
```

#### Integration with Drop Operations
```typescript
// In setDropIndicator method
const setDropIndicator = (indicator: DropIndicatorState | null) => {
  if (indicator && dragData) {
    const validation = validateCircularReference(
      dragData.item.id,
      indicator.targetParentId,
      dragData.ancestorIds
    );
    
    if (!validation.valid) {
      // Reject invalid drop - don't set indicator
      return;
    }
  }
  
  set({ dropIndicator: indicator });
};
```

#### Ancestor Chain Building
```typescript
// Utility function to build ancestor chain for validation
function buildAncestorChain(itemId: string, allItems: SpaceItem[]): string[] {
  const ancestors: string[] = [];
  let currentItem = allItems.find(item => item.id === itemId);
  
  while (currentItem?.parentId) {
    ancestors.push(currentItem.parentId);
    currentItem = allItems.find(item => item.id === currentItem.parentId);
  }
  
  return ancestors;
}
```

#### Validation Triggers
- **Before setting drop indicator**: Validate target before showing visual feedback
- **Before drag operation**: Pre-validate source items have complete ancestor chains
- **During multi-selection**: Validate each selected folder in batch operations
- **Real-time feedback**: Update drop indicator validity as user hovers

#### Error Handling
- **UI feedback**: Invalid drop targets should show visual rejection (red indicator, crossed-out cursor)
- **Error messages**: Specific error messages for different circular reference scenarios
- **Graceful degradation**: Fall back to rejecting drop silently if validation fails

## Performance Optimization

### Validation Caching System

To avoid redundant ancestor chain calculations during drag operations, implement a validation cache that stores computed results for reuse.

#### Cache Interface
```typescript
interface ValidationCache {
  ancestorChains: Map<string, string[]>; // itemId -> ancestor path
  lastUpdated: number;
  spaceId: string; // Cache scope
  invalidateOnStructureChange(): void;
}

interface CachedValidationResult {
  result: ValidationResult;
  timestamp: number;
  dependentItems: string[]; // Items that affect this validation
}
```

#### Cache Implementation
```typescript
class DragValidationCache {
  private ancestorCache = new Map<string, string[]>();
  private validationCache = new Map<string, CachedValidationResult>();
  private currentSpaceId: string | null = null;
  private lastStructureUpdate = 0;
  
  getAncestorChain(itemId: string): string[] | null {
    return this.ancestorCache.get(itemId) || null;
  }
  
  setAncestorChain(itemId: string, chain: string[]): void {
    this.ancestorCache.set(itemId, chain);
  }
  
  getCachedValidation(key: string): ValidationResult | null {
    const cached = this.validationCache.get(key);
    
    // Invalidate if structure changed after cache creation
    if (!cached || cached.timestamp < this.lastStructureUpdate) {
      this.validationCache.delete(key);
      return null;
    }
    
    return cached.result;
  }
  
  setCachedValidation(
    key: string, 
    result: ValidationResult, 
    dependentItems: string[]
  ): void {
    this.validationCache.set(key, {
      result,
      timestamp: Date.now(),
      dependentItems
    });
  }
  
  invalidate(): void {
    this.ancestorCache.clear();
    this.validationCache.clear();
    this.lastStructureUpdate = Date.now();
  }
  
  invalidateForSpace(spaceId: string): void {
    if (this.currentSpaceId !== spaceId) {
      this.invalidate();
      this.currentSpaceId = spaceId;
    }
  }
  
  invalidateItem(itemId: string): void {
    // Remove direct cache entries
    this.ancestorCache.delete(itemId);
    
    // Remove validation cache entries that depend on this item
    for (const [key, cached] of this.validationCache.entries()) {
      if (cached.dependentItems.includes(itemId)) {
        this.validationCache.delete(key);
      }
    }
  }
}
```

#### Enhanced Validation with Caching
```typescript
// Global cache instance (scoped to drag session)
let validationCache = new DragValidationCache();

function validateCircularReferenceWithCache(
  draggedItemId: string,
  targetFolderId: string | null,
  spaceId: string,
  allItems: SpaceItem[]
): ValidationResult {
  // Ensure cache is valid for current space
  validationCache.invalidateForSpace(spaceId);
  
  // Create cache key for this validation
  const cacheKey = `${draggedItemId}->${targetFolderId}`;
  
  // Check cache first
  const cachedResult = validationCache.getCachedValidation(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Get or compute ancestor chain with caching
  let ancestorIds = validationCache.getAncestorChain(draggedItemId);
  if (!ancestorIds) {
    ancestorIds = buildAncestorChain(draggedItemId, allItems);
    validationCache.setAncestorChain(draggedItemId, ancestorIds);
  }
  
  // Perform validation
  const result = validateCircularReference(draggedItemId, targetFolderId, ancestorIds);
  
  // Cache result with dependencies
  const dependentItems = [draggedItemId, ...(targetFolderId ? [targetFolderId] : [])];
  validationCache.setCachedValidation(cacheKey, result, dependentItems);
  
  return result;
}
```

#### Cache Integration Points
- **Drag Start**: Initialize cache for current space
- **Structure Changes**: Invalidate cache on move, delete, create operations
- **Space Navigation**: Clear cache when changing spaces
- **Drag End**: Clear cache to free memory
- **Multi-Selection**: Leverage cache for batch validation operations

#### Cache Lifecycle Management
```typescript
// Integration with existing drag operations
const startDrag = (data: DragData) => {
  // Initialize validation cache for drag session
  validationCache.invalidateForSpace(data.spaceId);
  
  set({ isDragging: true, dragData: data });
};

const endDrag = () => {
  // Clear validation cache to free memory
  validationCache.invalidate();
  
  set({ 
    isDragging: false, 
    dragData: null, 
    dropIndicator: null,
    dragExpandedFolderId: null 
  });
};

// Structure change invalidation
const onItemStructureChange = (itemId: string) => {
  validationCache.invalidateItem(itemId);
};
```

#### Performance Benefits
- **Reduced Traversals**: Avoid recalculating ancestor chains for same items
- **Batch Operations**: Cache benefits multiply with multi-selection operations  
- **Real-time Validation**: Faster response during drag hover operations
- **Memory Efficiency**: Automatic cache invalidation prevents memory leaks

#### Integration with SPEC-016
This caching system follows the clipboard-state-management patterns from SPEC-016 for consistent state management and shares caching strategies for item operations, ensuring unified performance optimization across related features.

## Error Handling & UI Integration

### Validation Error Interface

Define standardized error propagation patterns from validation logic to UI components, ensuring consistent error handling across all drag-drop operations.

```typescript
interface DragDropValidationError {
  type: 'circular_reference' | 'invalid_target' | 'permission_denied' | 'system_error';
  message: string;
  context: DragDropContext;
  targetItemId?: string;
  sourceItemId?: string;
}

interface DragDropContext {
  operation: 'move' | 'reorder' | 'pin';
  source: DragSource;
  spaceId: string;
  timestamp: number;
}

interface ValidationErrorHandler {
  onValidationError: (error: DragDropValidationError) => void;
  onValidationSuccess: (context: DragDropContext) => void;
  onValidationClear: () => void;
}
```

### Error Propagation Patterns

#### Store-Level Error Handling
```typescript
interface DragDropUiState {
  // ... existing state
  validationError: DragDropValidationError | null;
  
  // ... existing methods
  setValidationError: (error: DragDropValidationError | null) => void;
  clearValidationError: () => void;
}

// Enhanced setDropIndicator with error handling
const setDropIndicator = (indicator: DropIndicatorState | null) => {
  if (indicator && dragData) {
    const validation = validateCircularReference(
      dragData.item.id,
      indicator.targetParentId,
      dragData.ancestorIds
    );
    
    if (!validation.valid) {
      const error: DragDropValidationError = {
        type: 'circular_reference',
        message: validation.error!,
        context: {
          operation: 'move',
          source: dragData.source,
          spaceId: dragData.spaceId,
          timestamp: Date.now()
        },
        sourceItemId: dragData.item.id,
        targetItemId: indicator.targetId
      };
      
      set({ validationError: error, dropIndicator: null });
      return;
    }
    
    // Clear any existing errors on successful validation
    set({ validationError: null });
  }
  
  set({ dropIndicator: indicator });
};
```

### UI Action Specifications

#### Error Display Actions
- **Visual Feedback**: Invalid drop indicators show red highlight with crossed-out cursor
- **Error Messages**: Toast notifications for validation errors with specific context
- **Drop Rejection**: Visual animation showing rejected drop (bounce back effect)
- **Cursor Updates**: System cursor changes to indicate invalid drop zones

#### Error Clearing Triggers
- **Successful Validation**: Clear errors when valid drop target is found
- **Drag End**: Clear all validation errors when drag operation completes
- **Target Change**: Clear previous errors when hovering over new valid targets
- **Timeout**: Auto-clear validation errors after 3 seconds for non-critical issues

#### Integration with Existing Specs
- **SPEC-012**: Leverage `InlineInputStore` patterns for error state management
- **SPEC-015**: Use rename context patterns for error scoping and cleanup
- **SPEC-006**: Integrate with focus management for error highlighting and accessibility

#### Component Error Handling Pattern
```typescript
const useDragDropErrorHandling = () => {
  const { validationError, clearValidationError } = useDragDropUiStore();
  
  const handleValidationError = useCallback((error: DragDropValidationError) => {
    // Show visual feedback based on error type
    switch (error.type) {
      case 'circular_reference':
        showDropRejectionAnimation(error.targetItemId);
        showToastError(error.message);
        break;
      case 'invalid_target':
        updateCursorToBlocked();
        break;
      case 'permission_denied':
        showPermissionError(error.message);
        break;
      default:
        showGenericError(error.message);
    }
    
    // Auto-clear after timeout for non-critical errors
    if (error.type !== 'permission_denied') {
      setTimeout(clearValidationError, 3000);
    }
  }, [clearValidationError]);
  
  return { validationError, handleValidationError };
};
```

#### Accessibility Considerations
- **Screen Reader Announcements**: Validation errors announced via aria-live regions
- **Keyboard Navigation**: Error states respect keyboard-only interaction patterns
- **Focus Management**: Invalid drop targets receive appropriate focus indicators
- **High Contrast**: Error states maintain visibility in high contrast modes

## Technical Requirements

### React Integration Compliance (SPEC-010)

#### Store Pattern Alignment
- **Store Registration**: dragDropUiStore must follow SPEC-010's store registration patterns
- **Component Integration**: Ensure drag/drop state updates integrate with existing React component lifecycle from SPEC-010
- **Event Handling**: Validate drag events work within established event handling architecture
- **Re-render Optimization**: Leverage SPEC-010's subscription patterns to prevent unnecessary re-renders during drag operations

#### State Management Consistency
```typescript
// Ensure compatibility with existing SPEC-010 patterns
const useDragDropUi = () => {
  // Follow established useStore() patterns from SPEC-010
  const store = useDragDropUiStore();
  
  // Maintain consistency with existing state subscription mechanisms
  return {
    isDragging: store.isDragging,
    dragData: store.dragData,
    // ... other state selectors
  };
};
```

#### Component Lifecycle Integration
- **Mount/Unmount**: Drag state cleanup must integrate with SPEC-010's component lifecycle management
- **State Updates**: Ensure drag state changes trigger React re-renders via existing subscription mechanisms
- **Event Binding**: Validate drag/drop event listeners work within current component event handling patterns
- **Memory Management**: Timer cleanup and state cleanup must follow SPEC-010's cleanup patterns

## Implementation Details

### Multi-Selection Integration with SPEC-013

#### Integration Pattern
```typescript
// Import from SPEC-013 multi-selection store
import { useSelectionStore } from './selectionStore';

// Integration interface for drag operations
interface DragIntegration {
  // Called when drag operation starts
  getSelectedItemsForDrag(): SpaceItem[];
  
  // Triggered by: onDragStart event handler
  // Returns: Currently selected items from SelectionStore
  // Fallback: Single item being dragged if no multi-selection
}

// Implementation in drag handler
const handleDragStart = (item: SpaceItem, event: DragEvent) => {
  const { getSelectedItems, isSelected } = useSelectionStore();
  
  // Get selected items from SPEC-013's SelectionStore
  const selectedItems = getSelectedItems();
  
  // Use multi-selection if current item is part of selection
  const itemsToDrag = isSelected(item.id) && selectedItems.length > 1 
    ? selectedItems 
    : [item];
  
  // Create drag data with proper item array
  const dragData: DragData = {
    item,
    items: itemsToDrag,
    spaceId: item.spaceId,
    parentId: item.parentId,
    sourceIndex: item.index,
    source: 'sidebar', // or 'spaceCard'
    ancestorIds: getAncestorIds(item)
  };
  
  startDrag(dragData);
};
```

#### Integration Requirements
- **Reference SPEC-013's SelectionStore** rather than implementing separate selection logic
- **Import the selection state** from the multi-selection module
- **Maintain consistency** with selection terminology and patterns
- **Handle single-item fallback** when no multi-selection exists

### Flash Animation Auto-Clear Mechanism
- **Location**: Component level (not store)
- **Rationale**: UI timing concerns should remain in presentation layer
- **Implementation**: Each component manages its own setTimeout for flash states
- **Store Role**: Only tracks boolean flash state, not timing logic

#### Component vs Store Boundary
- **Store**: Tracks `flashItemId: string | null`
- **Component**: Manages `setTimeout(() => setFlashItem(null), 500)`
- **Benefit**: Keeps timing logic testable and UI-focused

#### Integration Pattern
```javascript
const { setFlashItem } = useDragDropUiStore();

const handleFlashAnimation = (itemId) => {
  setFlashItem(itemId);
  setTimeout(() => setFlashItem(null), 500);
};
```

### Drop Position Calculation

The drag-drop state management stores only the calculated drop position result (`before/after/inside`), not the UI calculation logic itself.

#### State Management Responsibility
- Store the final drop position determination
- Track which item is the drop target
- Validate drop legality based on business rules
- Maintain drop indicator state for UI consumption

#### UI Layer Responsibility (Out of Scope)
- Mouse position to drop position calculation
- Visual drop zone detection and feedback
- Geometric calculations for drop position determination
- Real-time drop indicator positioning

#### Drop Position Interface
```typescript
interface DropPositionState {
  targetItem: SpaceItem | null;
  position: 'before' | 'after' | 'inside' | null;
  isValidDrop: boolean;
}
```

The UI layer handles mouse coordinate analysis and passes the calculated position to the state management layer.

### State Management Patterns
- Follow state management patterns established in SPEC-012 (InlineInputStore)
- Flash state should be separate from business logic state
- Timer management follows component-level pattern similar to expand timers

## Acceptance Criteria
- [ ] Enhanced dragDropUiStore at `packages/react-ui/src/stores/dragDropUiStore.ts`
- [ ] DragData supports multiple items array
- [ ] DragData tracks source (sidebar/spaceCard)
- [ ] DragData includes ancestorIds for circular reference validation
- [ ] DropIndicatorState tracks position (before/after/inside)
- [ ] DropIndicatorState includes targetIndex and targetParentId
- [ ] dragExpandedFolderId state for auto-expand folders
- [ ] flashItemId state for drop animation
- [ ] isOverPinsGrid and pinsDropIndex for pins grid drops
- [ ] startDrag method sets all drag state
- [ ] setDropIndicator updates drop indicator with circular reference validation
- [ ] endDrag clears all drag-related state
- [ ] setDragExpandedFolder manages auto-expand state
- [ ] setFlashItem triggers and auto-clears flash animation
- [ ] validateCircularReference function prevents invalid folder moves
- [ ] Integration with SPEC-013 SelectionStore for multi-item drag
- [ ] Unit tests for all store methods including validation logic
- [ ] Type definitions exported from types/index.ts
- [ ] Compliance with SPEC-010 React integration patterns verified
- [ ] Store registration follows established SPEC-010 patterns
- [ ] Component lifecycle integration validated with existing architecture
- [ ] ValidationErrorHandler interface implemented with proper error propagation
- [ ] Error display actions integrated with UI components
- [ ] Validation error auto-clearing mechanisms implemented
- [ ] Accessibility considerations for error states implemented
- [ ] Timer cleanup lifecycle management implemented for all timer types
- [ ] Component unmount cleanup patterns validated
- [ ] Navigation change cleanup integration with SPEC-006, 015, 016
- [ ] Manual state reset cleanup methods implemented
- [ ] Error state cleanup and memory leak prevention verified
- [ ] Performance constraints implemented: 60fps throttling, 100 item limit, 33ms visual feedback
- [ ] Resource management bounds verified: immediate state cleanup, event debouncing
- [ ] Large selection handling: count indicator for >10 items implemented
- [ ] Validation caching system implemented with DragValidationCache class
- [ ] Cache invalidation mechanisms integrated with structure changes
- [ ] Ancestor chain caching implemented to avoid redundant traversals
- [ ] Cache lifecycle management integrated with drag operations
- [ ] Performance optimization verified for multi-selection batch operations
- [ ] Cache integration with SPEC-016 clipboard patterns validated
- [ ] Animation coordination system implemented with conflict detection
- [ ] Flash animation deferral mechanisms integrated with related spec states
- [ ] Animation priority ordering enforced (user input > flash > ambient)
- [ ] Animation queue management implemented with proper cleanup
- [ ] Integration dependencies validated with SPEC-012, 015, 006, 016

## Dependencies
- SPEC-010: React UI Integration (Zustand stores)
- SPEC-007: Core Domain Layer (SpaceItem entity)
- SPEC-013: Multi-Selection State (for multi-item drag payloads via SelectionStore integration)
- SPEC-001: Database Layer (for ancestor chain queries in validation)
- SPEC-012: General State Management Patterns (for error handling integration, animation coordination)
- SPEC-015: Rename Context Patterns (for error scoping, animation coordination)
- SPEC-006: Focus Management (for error highlighting and accessibility, navigation cleanup, animation coordination)
- SPEC-015, 016: Space Navigation (for route change cleanup triggers)
- SPEC-016: Clipboard State Management (for consistent state cleanup patterns and validation caching strategies, animation coordination)

## Estimated Duration
4 hours

## Reference Files

### Flutter Source
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:6-7` - DragSource enum
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:9-10` - DropPosition enum
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:12-43` - DragOperation class
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:45-75` - DropIndicatorState class
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:77-98` - DragData class
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:195-217` - Auto-expand provider

### Electron Target
- `packages/react-ui/src/stores/dragDropUiStore.ts` - Enhance existing file
- `packages/react-ui/src/types/index.ts` - Add DragSource, DropPosition, DragData, DropIndicatorState types

## Implementation Notes
- Build on existing dragDropUiStore (don't replace entirely)
- ancestorIds prevents dragging folder into itself or descendants
- Auto-expand requires setTimeout tracking (clear on drag end)
- Flash animation should auto-clear after 500ms using setTimeout
- Drop position calculation handled by UI layer, state management stores result only
- Pins grid drops have special square preview (handled in UI layer)
- Multi-selection integration uses SPEC-013's SelectionStore as the source of truth for selected items
- Circular reference validation must be integrated into all drop indicator operations
- Error handling interface ensures consistent validation error propagation to UI components
- Validation errors trigger specific UI actions and auto-clear mechanisms
- Accessibility considerations must be maintained for all error states
- Timer cleanup lifecycle management must handle component unmount, navigation changes, and manual state resets with proper priority ordering and error handling
- Performance constraints must be enforced to maintain 60fps responsiveness and prevent memory leaks with large selections
- Validation caching system reduces redundant ancestor chain calculations during drag operations
- Cache invalidation prevents stale validation results after structure changes
- Cache integration with SPEC-016 ensures consistent performance optimization patterns across related features
- Animation coordination prevents visual conflicts between flash animations and existing UI state changes from related specs
- Flash animation deferral system ensures smooth user experience during active editing and focus operations
- Animation priority ordering maintains user input responsiveness while providing appropriate visual feedback

## Resolved Questions (Pre-Planning)
- **Should the validation cache persist across multiple drag sessions or be cleared between each drag operation?** → Clear cache on endDrag() to prevent memory leaks, but allow cache reuse within a single drag session for performance.
- **What is the exact priority order when multiple animation conflicts occur simultaneously (e.g., user is editing AND renaming AND clipboard operation is active)?** → Define strict precedence: inline editing > rename operations > clipboard feedback > flash animations, with first-active-wins for same priority level.
- **How should the system handle validation errors when dragging items across different spaces?** → Validate that cross-space operations are out of scope for this spec, or define specific validation rules for cross-space moves.
- **What happens to the drag operation if the source item is deleted or modified while dragging?** → Add drag data validation on drop and cancel drag operation if source item is no longer valid.
- **Should the 800ms auto-expand timer reset when hovering over different parts of the same folder, or only when moving to a different item entirely?** → Reset timer only when moving to a different item to prevent accidental rapid expansions.


## Acceptance Criteria to Cover

1. [ ] **Screen Reader Announcements**: Validation errors announced via aria-live regions
2. [ ] **Keyboard Navigation**: Error states respect keyboard-only interaction patterns
3. [ ] **Focus Management**: Invalid drop targets receive appropriate focus indicators
4. [ ] **High Contrast**: Error states maintain visibility in high contrast modes

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
describe('Feature: 014')
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

1. **Link tests to spec**: `speky test link <test-file> --spec 014`
2. **Run RED phase**: `speky test tdd-red 014`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
