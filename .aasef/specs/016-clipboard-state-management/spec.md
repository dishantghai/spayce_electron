# Spec 016: Clipboard State Management

## Overview
Implement internal clipboard state management for copy/paste operations of SpaceItems, supporting both internal clipboard and system clipboard integration.

## Requirements

### R1: Clipboard Store (Zustand)
- Store copied items with source space ID
- Track clipboard action (copy/cut)
- Clear clipboard on paste or timeout
- Support multiple items for multi-selection
- Maintain clipboard state per space

### R2: System Clipboard Integration
- IPC handlers for system clipboard read/write
- Detect URL pattern in system clipboard
- Write URLs to system clipboard on copy
- Read URLs from system clipboard on paste
- URL detection regex: `/^https?:\/\/|^[^\s]+\.[^\s]+$/`

### R2.1: URL Validation Flow
- **Trigger**: Validate URLs when reading from system clipboard on paste
- **Location**: Handle validation in the ClipboardStore methods
- **Process**:
  1. Read text from system clipboard via IPC
  2. Apply regex pattern validation to detect URLs
  3. If valid URL detected, create SpaceItem with URL type
  4. If invalid or no URL pattern, treat as plain text
  5. Update clipboard state accordingly

### R2.2: URL Validation Error Handling
- Invalid clipboard content: Log warning and skip URL creation
- Clipboard read errors: Fallback to internal clipboard only
- URL pattern mismatch: Treat as plain text content
- Integration with SPEC-012 InlineInputStore for consistent validation patterns

### R3: Paste Operations
- **pasteItems**: Execute paste operation to target location
- **canPaste**: Validate paste target compatibility with clipboard content
- **Position handling**: Support 'before', 'after', and 'inside' positioning
- **Operation handling**: Move items for cut operations, duplicate for copy operations
- **Clear clipboard**: Reset clipboard state after successful paste
- **Target validation**: Ensure paste target can accept clipboard content type
- **Keyboard integration**: Support Ctrl+V shortcut handling
- **Context menu**: Enable paste option when clipboard has items
- **Visual feedback**: Show paste indicators when items are available for pasting

### R4: Clipboard State Interface
```typescript
interface ClipboardState {
  items: SpaceItem[];
  sourceSpaceId: string | null;
  action: 'copy' | 'cut' | null;
  
  copyItems: (items: SpaceItem[], spaceId: string) => void;
  cutItems: (items: SpaceItem[], spaceId: string) => void;
  pasteItems: (targetId: string, position?: 'before' | 'after' | 'inside') => Promise<void>;
  canPaste: (targetId: string) => boolean;
  clear: () => void;
  hasItems: () => boolean;
}
```

### R5: IPC Clipboard Handlers
```typescript
ipcMain.handle('clipboard:readText', () => clipboard.readText());
ipcMain.handle('clipboard:writeText', (_, text: string) => clipboard.writeText(text));
```

### R6: Multi-selection Integration
- **Selection State Consumption**: Clipboard operations must use SPEC-013's getSelectedItems() and clearSelection() methods rather than maintaining separate selection tracking
- **Interface Contract**: ClipboardStore.copyItems() and ClipboardStore.cutItems() will receive items from SPEC-013's selection state
- **State Coordination**: After successful paste operations, both clipboard state and selection state must be cleared to maintain consistency
- **Shared Operations**: Multi-item clipboard operations will delegate to SPEC-013's selection management for determining which items to copy/cut

## Out of Scope
- Clipboard history/multiple clipboard entries (planned for future version)
- Cross-application clipboard sharing beyond basic URL/text
- Clipboard persistence across application restarts
- Rich media clipboard support (images, files)
- Clipboard encryption or security features
- Clipboard synchronization across multiple devices
- Advanced clipboard formatting preservation
- Clipboard analytics or usage tracking
- Third-party clipboard manager integration
- Clipboard size limitations or compression

## Acceptance Criteria
- [ ] ClipboardStore created at `packages/react-ui/src/stores/clipboardStore.ts`
- [ ] Store tracks items, sourceSpaceId, and action (copy/cut)
- [ ] copyItems method stores items and sets action to 'copy'
- [ ] cutItems method stores items and sets action to 'cut'
- [ ] pasteItems method executes paste operation with position support
- [ ] canPaste method validates paste target compatibility
- [ ] Paste operations handle both copy (duplicate) and cut (move) scenarios
- [ ] clear method resets all state
- [ ] hasItems helper returns true if items exist
- [ ] Clipboard state cleared after successful paste operation
- [ ] IPC handlers for clipboard:readText and clipboard:writeText
- [ ] URL detection regex validates URLs correctly
- [ ] URL validation occurs when reading from system clipboard
- [ ] Invalid URLs are handled gracefully with fallback to plain text
- [ ] Keyboard shortcut support for paste operations
- [ ] Context menu paste option enabled when clipboard has items
- [ ] Visual paste indicators shown when items are available
- [ ] Integration with SPEC-013 selection state for multi-item operations
- [ ] Selection state cleared after successful clipboard operations
- [ ] Unit tests for all clipboard operations including paste
- [ ] Integration tests for IPC clipboard handlers

## Dependencies & Validation
- SPEC-007 SpaceItem entity MUST include: `id`, `title`, `content`, `type`, `metadata.lastModified`, `parentId`
- Validation: Verify SpaceItem.serialize() output matches clipboard data schema before implementation
- Validation: Confirm SpaceItem constructor supports URL type creation for system clipboard integration
- Validation: Ensure SpaceItem entity supports all required fields for clipboard operations (copy/cut/paste)

## Dependencies
- SPEC-007: Core Domain Layer (SpaceItem entity)
- SPEC-010: React UI Integration (Zustand stores)
- SPEC-012: Inline Input Store (for consistent validation patterns)
- SPEC-014: Drag-drop (for shared drop validation logic)
- SPEC-013: Multi-selection (for paste with multi-selected content and shared state management)

## Estimated Duration
4 hours

## Reference Files

### Flutter Source
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:125-142` - ClipboardAction enum and SpaceClipboardState class
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:127-128` - ClipboardAction enum definition

### Electron Target
- `packages/react-ui/src/stores/clipboardStore.ts` - Create this file
- `packages/desktop/src/main/ipc/handlers.ts` - Add clipboard IPC handlers
- `packages/desktop/src/preload/index.ts` - Expose clipboard API

## Implementation Notes
- Use Zustand for state management (consistent with existing stores)
- Clipboard operations should be instant (no async delays)
- System clipboard integration requires IPC to main process
- Consider clearing clipboard after successful paste
- URL regex should match both http(s):// and domain.tld patterns
- URL validation should integrate with SPEC-012's validation system for consistency
- Paste operations should validate target compatibility before execution
- Share drop validation logic with SPEC-014 for consistent behavior
- Support multi-item paste operations from SPEC-013 multi-selection
- Clipboard operations must consume SPEC-013's selection state rather than maintaining separate item tracking
- Coordinate state clearing between clipboard and selection stores to prevent inconsistencies