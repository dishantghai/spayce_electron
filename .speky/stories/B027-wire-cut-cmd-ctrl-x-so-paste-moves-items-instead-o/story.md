# Wire Cut (Cmd/Ctrl+X) so paste moves items instead of duplicating

## Why
Spec 016 specified copy/cut/paste with "move for cut, duplicate for copy" and Ctrl+X. The store has
`cutItems` / `cutFromSelection`, but no key binding or menu calls them, and every paste in `App.tsx`
duplicates. Users can't move items by cut and paste. Found during the SPEKY v3 migration; see
clipboard-R5.

## Capabilities
- Cmd/Ctrl+X cuts the selection; the next paste moves the items (`items:move`) instead of re-creating
  them.

## Non-goals
- No dimmed or ghost styling for cut items in this story.
- No cut of pinned items from the pins grid.

## Design
<!-- Which design this implements, so nobody guesses during implementation:
     - Screens: IDs from the screen catalogue (screen:<id>) or design files in the repo, per state
       (default, empty, error, loading).
     - Design system: `.speky/design/system.md`
     Look for an existing design first (`speky design status`, the screen catalogue). If there is none,
     write "To be designed" and `speky next` runs the design step. If nothing visual changes, write
     "No new design needed: <why>". -->
No new design needed: a key binding and move-on-paste. If a Cut entry is added to item menus it follows the existing context menu (screen:spaces-card-folder-context-menu).

## Requirements

### R1: Cut shortcut
Cmd/Ctrl+X in the sidebar or Spaces screen SHALL put the selected items (multi-selection, else the
focused item) on the internal clipboard as a cut.

#### Scenario: cut a link
- GIVEN link "A" is focused in the sidebar
- WHEN the user presses Cmd+X
- THEN the clipboard holds "A" marked as a cut

### R2: Paste after cut moves
Paste after a cut SHALL move each item to the target (folder or root) with its subtree and keep its
ID, then clear the clipboard. Pasting a folder into itself or one of its descendants SHALL be refused.

#### Scenario: move by cut and paste
- GIVEN folder "Docs" was cut in space "Work"
- WHEN the user pastes into folder "Archive" in space "Home"
- THEN "Docs" (same ID, same children) is inside "Archive" and no longer in "Work"

#### Scenario: into own descendant
- GIVEN folder "Docs" was cut
- WHEN the user pastes into "Docs/Specs"
- THEN nothing moves and the clipboard keeps the cut
