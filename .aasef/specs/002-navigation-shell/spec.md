# Spec 002: Navigation Shell

## Overview
Implement the main layout with 320px sidebar, bottom tab bar (60px), and keyboard navigation system.

## Requirements

### R1: Sidebar Container
- Fixed width: 320px
- Border-radius: 16px top-right/bottom-right
- Shadow: `0 0 40px rgba(0,0,0,0.5)`
- Background: SpayceColors.sidebarDark (#131020)

### R2: Bottom Tab Bar (60px height)
- Space icons: 32px circular with space accent color
- Nav dots: 4px, scale 1.5× on hover (100ms animation)
- Add button: 40px circular with primary color
- User profile section: Avatar (32px) + name + email/plan

### R3: Tab Navigation
- Tabs: browser, spaces, workspace, settings
- Active tab indicator with primary color
- Smooth transition between tabs (250ms)

### R4: Keyboard Navigation
- `KeyboardFocusContext` enum: sidebar | spacesScreen
- Arrow keys navigate between Space cards in spacesScreen
- Enter opens selected Space
- Escape returns focus to sidebar
- Tab moves between focusable elements

### R5: Floating Sidebar Mode
- Shows on hover (cursor < 10px from left edge)
- Also opens when dragging near left edge (12px zone)
- Border-radius 12px on right side
- Primary color border (30% opacity)
- Stays open when context menu or pins grid is active

## Acceptance Criteria
- [ ] Sidebar renders at exactly 320px width
- [ ] Bottom bar is exactly 60px tall
- [ ] Nav dots animate on hover
- [ ] Keyboard navigation works in spacesScreen context
- [ ] Floating sidebar shows/hides correctly

## Dependencies
- 001-project-foundation

## Reference Files
- Old: `spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`
- Old Tests: `spayce/frontend/test/widget/navigation/`
