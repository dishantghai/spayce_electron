# Implementation Plan

## Tasks

### Task 1: Create InlineRenameInput Component
- **Estimate**: 1.5 hours
- **Description**: Build the core inline rename input component with auto-focus, text selection, keyboard handling (Enter/Escape), and validation for non-empty names
- **Files**: 
  - `packages/react-ui/src/components/InlineRenameInput.tsx`
  - `packages/react-ui/src/components/InlineRenameInput.module.css`

### Task 2: Update TreeItem for Inline Rendering
- **Estimate**: 45 minutes
- **Description**: Modify TreeItem to conditionally render InlineRenameInput when item is in rename state, using existing `inlineInputStore.isRenaming()` check
- **Files**: 
  - `packages/react-ui/src/components/TreeItem.tsx`

### Task 3: Add Context Menu Rename Action
- **Estimate**: 30 minutes
- **Description**: Wire up "Rename" context menu option to set appropriate rename state in inlineInputStore (sidebar vs card context)
- **Files**: 
  - `packages/react-ui/src/components/ContextMenu.tsx`

### Task 4: Implement Rename Logic & Testing
- **Estimate**: 1 hour
- **Description**: Add rename persistence logic, blur handling (save if changed/cancel if not), and comprehensive testing for all interaction paths
- **Files**: 
  - Integration with existing rename mutation
  - Unit tests for component behavior

## Implementation Notes
- Leverage existing `inlineInputStore` with `sidebarRenameItemId`/`cardRenameItemId` states
- For links: preserve URL/path, only update display name
- Use `onComplete` callback pattern to clear rename state
- Match existing tree item styling for seamless integration

## Testing Checklist
- [ ] Text pre-selected on rename activation
- [ ] Enter saves, Escape cancels
- [ ] Blur with changes saves, without changes cancels
- [ ] Empty names rejected
- [ ] Link URLs preserved after rename
- [ ] Works in both sidebar and card contexts