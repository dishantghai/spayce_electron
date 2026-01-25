# Implementation Plan

## Tasks

### Task 1: Enhance Context Menu Structure and Conditional Logic
- **Estimate**: 1.5 hours
- **Description**: Update `getContextMenuItems` function in App.tsx to return complete folder context menu with proper ordering, dividers, and conditional visibility based on folder type and clipboard state. Add helper functions for nested link detection.
- **Files**: 
  - `packages/desktop/src/renderer/App.tsx`

### Task 2: Implement Core Action Handlers
- **Estimate**: 2 hours
- **Description**: Update `handleContextMenuItemClick` function to handle all new folder actions: new_folder, new_link, copy_folder, copy_links, paste, and refresh. Integrate with existing inline input and clipboard stores.
- **Files**:
  - `packages/desktop/src/renderer/App.tsx`
  - `packages/react-ui/src/stores/clipboardStore.ts`

### Task 3: Add Backend Support for Paste and Refresh Operations
- **Estimate**: 1.5 hours
- **Description**: Implement IPC handlers for paste operations and local folder refresh. Add itemsService methods for recursive item duplication and local folder scanning.
- **Files**:
  - `packages/desktop/src/main/ipc/handlers.ts`
  - `packages/core/src/services/itemsService.ts`

### Task 4: Enhance Clipboard Store with Full Paste Implementation
- **Estimate**: 1 hour
- **Description**: Complete the pasteItems method in clipboardStore to handle recursive pasting of folder structures and proper cleanup after cut operations.
- **Files**:
  - `packages/react-ui/src/stores/clipboardStore.ts`

## Implementation Notes

- **Recursive Operations**: Both copy_links and paste actions need to handle deeply nested folder structures
- **Auto-Expand**: Folders should auto-expand when adding new items or pasting to show the new content
- **System Clipboard**: copy_links writes URLs to system clipboard (navigator.clipboard) for external sharing
- **Conditional Visibility**: Menu items appear/disappear based on folder type (regular vs local) and clipboard state
- **Future-Proofing**: Import and workspace actions are included but disabled for future implementation

## Testing Checklist

- [ ] Right-click folder shows complete context menu with correct item order
- [ ] "Copy All Links" only appears for folders containing nested links
- [ ] "Paste" only appears when clipboard has items
- [ ] "Refresh" only appears for localFolder type items
- [ ] All actions properly integrate with inline input and clipboard systems
- [ ] Keyboard navigation works (arrows, Enter, Escape)
- [ ] Menu positioning adjusts correctly near viewport edges
- [ ] Destructive actions (Delete) display in red styling