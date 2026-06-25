# Spec 006: Keyboard Navigation

## Overview
Implement focus context management for independent keyboard navigation between sidebar and spaces screen.

## Requirements

### R1: Focus Context State
- Track which UI region has keyboard focus: 'sidebar' or 'spacesScreen'
- Default to sidebar on app open
- Update based on click interactions

### R2: Focus Rules
- **Rule 0**: On app open, focus defaults to Sidebar
- **Rule 1**: Click on Sidebar or any item within → focus moves to Sidebar
- **Rule 2**: Click on SpacesScreen or any item within → focus moves to SpacesScreen
- **Rule 3**: In Floating mode, when sidebar opens → focus moves to Sidebar
- **Rule 4**: In Floating mode, when sidebar closes AND Spaces tab active → focus moves to SpacesScreen

### R3: Active Space Independence
- Sidebar and SpacesScreen each have their own active space index
- Navigating in sidebar doesn't affect SpacesScreen active space
- Navigating in SpacesScreen doesn't affect sidebar active space

### R4: Visual Feedback
- Focused region may have subtle visual indicator (optional)
- Arrow key navigation works within focused region only

## Implemented Components

| Component | File | Status |
|-----------|------|--------|
| focusContext state | `App.tsx` | ✅ Complete |
| hasFocus prop | `Sidebar.tsx`, `SpacesScreen.tsx` | ✅ Complete |
| onFocusChange callback | `Sidebar.tsx`, `SpacesScreen.tsx` | ✅ Complete |
| Independent activeSpaceIndex | `App.tsx` | ✅ Complete |

## Implementation Notes

- ### R5: Arrow Key Navigation
- **ArrowDown/ArrowUp**: Navigate between items within the focused region's active space
- **ArrowLeft/ArrowRight**: Collapse/expand expandable items (folders, groups)
- **Enter**: Select/activate the currently highlighted item
- **Escape**: Clear current selection or close expanded items


The focus management is currently implemented at the App.tsx level with:
- `focusContext` state: 'sidebar' | 'spacesScreen'
- `sidebarActiveSpaceIndex` and `spacesScreenActiveSpaceIndex` as separate state
- Click handlers that update focus context
- `hasFocus` props passed to Sidebar and SpacesScreen

Future enhancement: Extract to `KeyboardNavigationProvider` context for cleaner architecture.

## Acceptance Criteria
- [x] Sidebar and SpacesScreen have independent active space tracking
- [x] Clicking sidebar items sets focus to sidebar
- [x] Clicking space cards sets focus to spaces screen
- [x] Focus context follows floating sidebar open/close rules
- [ ] (Future) Keyboard arrow navigation within focused region

## Dependencies
- 001-project-foundation
- 002-sidebar-navigation
- 003-spaces-module

## Reference Files
- Focus context rules documented in App.tsx comments
