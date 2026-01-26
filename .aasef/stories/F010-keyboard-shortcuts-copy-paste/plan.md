# Implementation Plan

## Tasks

### Task 1: Add Keyboard Event Handlers to Components
- **Estimate**: 1 hour
- **Description**: Add keyboard event listeners to Sidebar.tsx and SpaceCard.tsx that detect Cmd+C/Ctrl+C and Cmd+V/Ctrl+V, with proper focus management to only activate when component has focus and no text inputs are active.
- **Files**: 
  - `packages/react-ui/src/components/Sidebar.tsx`
  - `packages/react-ui/src/components/spaces/SpaceCard.tsx`

### Task 2: Implement Copy/Paste Handler Functions
- **Estimate**: 45 minutes
- **Description**: Create `handleCopySelected` and `handlePasteToSelected` functions in App.tsx that integrate with existing clipboard store and selection state. Include multi-selection support and system clipboard integration for single links.
- **Files**: 
  - `packages/desktop/src/renderer/App.tsx`

### Task 3: Add Cross-Platform Keyboard Detection
- **Estimate**: 30 minutes
- **Description**: Implement platform detection logic to use Cmd key on Mac and Ctrl key on Windows/Linux. Add helper function to determine correct modifier key based on navigator.platform.
- **Files**: 
  - `packages/react-ui/src/components/Sidebar.tsx`
  - `packages/react-ui/src/components/spaces/SpaceCard.tsx`

## Implementation Notes

- **Focus Management**: Use `document.activeElement` and container refs to ensure shortcuts only fire when sidebar/card has focus
- **Text Input Prevention**: Check for INPUT/TEXTAREA elements to avoid interfering with text editing
- **Multi-Selection**: Leverage existing selection store state to copy multiple items at once
- **System Clipboard**: For single links, also copy URL to system clipboard using `window.electronApi.clipboard.writeText()`

## Testing Checklist

- [ ] Cmd+C copies selected items to clipboard store
- [ ] Cmd+V pastes items from clipboard store  
- [ ] Single link copy also adds URL to system clipboard
- [ ] Multi-selection copies all selected items
- [ ] Shortcuts only work when sidebar/card has focus
- [ ] Shortcuts ignored when typing in text inputs
- [ ] Cross-platform support (Cmd on Mac, Ctrl on Windows)
- [ ] Paste into folder when folder is selected