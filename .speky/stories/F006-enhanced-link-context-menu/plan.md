# Implementation Plan

## Tasks

### Task 1: Update Context Menu Items for Links
- **Estimate**: 45 minutes
- **Description**: Modify `getContextMenuItems` function to show proper link menu with conditional pin/unpin items. Update menu structure to match spec order and add proper icons.
- **Files**: 
  - `packages/desktop/src/renderer/App.tsx`

### Task 2: Implement Context Menu Action Handlers
- **Estimate**: 1 hour
- **Description**: Add/update handlers for rename, copy link, pin/unpin, and delete actions in `handleContextMenuItemClick`. Ensure proper clipboard integration and IPC calls.
- **Files**: 
  - `packages/desktop/src/renderer/App.tsx`

### Task 3: Add Pin/Unpin Service Methods
- **Estimate**: 45 minutes
- **Description**: Implement `pinItem` and `unpinItem` methods in itemsService with proper database updates. Verify IPC handlers exist for pin/unpin operations.
- **Files**: 
  - `packages/core/src/services/itemsService.ts`
  - `packages/desktop/src/main/ipc/handlers.ts`

### Task 4: Verify Pin State Integration
- **Estimate**: 30 minutes
- **Description**: Ensure SpaceItem interface includes `isPinned` and `pinnedAt` fields. Verify pins grid displays pinned links correctly after pin/unpin actions.
- **Files**: 
  - Type definitions (verify fields exist)
  - Database schema (verify columns exist)

## Implementation Notes

- **Pin State**: Only show "Pin to Top" OR "Unpin" - never both simultaneously
- **System Clipboard**: Copy URL directly to system clipboard (not internal clipboard)
- **No Delete Confirmation**: Single links delete without confirmation dialog
- **Rename Integration**: Reuse existing inline rename system from F003
- **Database Fields**: Ensure `isPinned` boolean and `pinnedAt` timestamp fields exist

## Testing Checklist

- [ ] Right-click link shows 5 menu items in correct order
- [ ] "Pin to Top" only shown when link is NOT pinned
- [ ] "Unpin" only shown when link IS pinned  
- [ ] "Copy Link" puts URL in system clipboard
- [ ] Pin/unpin actions update pins grid immediately
- [ ] Rename preserves URL while changing display name
- [ ] Delete removes link without confirmation
- [ ] Keyboard navigation works (arrows skip dividers, Enter executes)