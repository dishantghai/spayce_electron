# keyboard-navigation

Seeded from completed item 006 (and keyboard parts of F010, F033) during the SPEKY v3 migration
(2026-10-14). Describes the code as it is today.

## Purpose

The sidebar and the Spaces screen can be driven by the keyboard. Only one of them handles keys at a
time; which one is set by a persisted focus context.

<!-- speky:next-id 6 -->
## Requirements

### keyboard-navigation-R1: Focus context
`focusContext` is `sidebar` or `spacesScreen`, persisted, and defaults to `sidebar`. Clicking an item,
selecting a space or focusing a view moves focus to that view. In floating mode, showing the sidebar
focuses it; hiding it on the Spaces tab focuses the Spaces screen. Keys are ignored while an input or
textarea has focus.

#### Scenario: click moves focus
- WHEN the sidebar has focus and the user clicks an item on a space card
- THEN the Spaces screen has focus and arrow keys move within the card

### keyboard-navigation-R2: Tree navigation
ArrowUp and ArrowDown move focus through visible items. ArrowRight expands a folder or enters it;
ArrowLeft collapses it or goes to the parent. Enter toggles a folder, or activates (selects) a link.

#### Scenario: expand with arrow
- WHEN a collapsed folder is focused and the user presses ArrowRight
- THEN the folder expands

### keyboard-navigation-R3: Switching spaces
Tab / Shift+Tab and `]` / `[` cycle to the next or previous space, wrapping around. In the sidebar,
keys 1–9 jump to that space.

#### Scenario: wrap
- WHEN the last space is active and the user presses `]`
- THEN the first space becomes active

### keyboard-navigation-R4: Shortcuts
Cmd/Ctrl+C copies and Cmd/Ctrl+V pastes (clipboard capability). Cmd/Ctrl+N opens Create Space from the
sidebar. Cmd/Ctrl+B toggles the sidebar. Escape clears focus and the multi-selection.

#### Scenario: toggle sidebar
- WHEN the user presses Cmd+B
- THEN the sidebar is hidden, or shown if it was hidden

### keyboard-navigation-R5: Not bound
Ctrl/Cmd+A (select all), Shift+Arrow (extend selection) and Cmd/Ctrl+X (cut) have no handler.

#### Scenario: Cmd+A
- WHEN the sidebar has focus and the user presses Cmd+A
- THEN the selection doesn't change
