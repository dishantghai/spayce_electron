# Overlay sidebar never shows Paste because hasClipboard is not synced

## Why
In overlay mode (floating sidebar on the Browser tab) the overlay shows Paste in its item and root
menus only when `state.hasClipboard` is true (`renderer/sidebar.tsx`). None of the
`sidebarOverlay.syncState` payloads in `App.tsx` send `hasClipboard`, so Paste never appears there,
even after a copy. Found while checking spec 016 during the SPEKY v3 migration; see context-menus-R5.

## Capabilities
- The overlay's menus offer Paste whenever the main renderer's internal clipboard has items.

## Non-goals
- No change to the paste behaviour itself (clipboard-R3/R4).

## Design
<!-- Which design this implements, so nobody guesses during implementation:
     - Screens: IDs from the screen catalogue (screen:<id>) or design files in the repo, per state
       (default, empty, error, loading).
     - Design system: `.speky/design/system.md`
     Look for an existing design first (`speky design status`, the screen catalogue). If there is none,
     write "To be designed" and `speky next` runs the design step. If nothing visual changes, write
     "No new design needed: <why>". -->
No new design needed: the overlay's menus show the existing Paste entry, styled like the main context menu (screen:spaces-card-folder-context-menu).

## Requirements

### R1: Sync clipboard state to the overlay
Every overlay state sync SHALL include `hasClipboard`, and the main renderer SHALL re-sync when the
clipboard changes while overlay mode is active.

#### Scenario: copy then right-click in overlay
- GIVEN the overlay sidebar is visible and the user copied folder "Docs"
- WHEN the user right-clicks folder "Archive" in the overlay
- THEN the menu shows Paste, and choosing it pastes "Docs" into "Archive"

#### Scenario: empty clipboard
- GIVEN the internal clipboard is empty
- WHEN the user right-clicks empty space in the overlay tree
- THEN the root menu has no Paste entry
