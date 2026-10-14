# Local folder Refresh does nothing because refreshLocalFolder IPC is missing

## Why
The folder menu shows "Refresh" (main renderer) or "Refresh Folder" (overlay) for local folders, and
the handlers call `electronAPI.items.refreshLocalFolder`. The preload doesn't expose that method, and
the `items:refreshLocalFolder` IPC handler is commented out in `main/ipc/handlers.ts`, so the menu
item silently does nothing. Found while seeding living specs from F005 during the SPEKY v3 migration;
see context-menus-R1.

## Capabilities
- Either Refresh re-reads a local folder's contents, or the entry isn't offered.

## Non-goals
- No file watching (`isWatching`) or security-bookmark work.

## Design
<!-- Which design this implements, so nobody guesses during implementation:
     - Screens: IDs from the screen catalogue (screen:<id>) or design files in the repo, per state
       (default, empty, error, loading).
     - Design system: `.speky/context/design_system.md`
     Look for an existing design first (`speky design status`, the screen catalogue). If there is none,
     write "To be designed" and `speky next` runs the design step. If nothing visual changes, write
     "No new design needed: <why>". -->
No new design needed: the existing Refresh entry on local folders (`project_ops/HIFI_UI_DESIGN_SCREENS/Sidebar with Local Imported Folders.png`) starts working, or is hidden.

## Requirements

### R1: Refresh works or is not offered
For a `localFolder` item, the Refresh entry SHALL either re-scan the folder path and update its
children, or be removed or disabled in both menus until a refresh use case exists.

#### Scenario: refresh offered
- GIVEN a local folder whose directory gained a file since import
- WHEN the user chooses Refresh
- THEN the new file appears as a child

#### Scenario: refresh not implemented
- GIVEN no refresh use case exists
- WHEN the user right-clicks a local folder
- THEN Refresh is absent or disabled, never a silent no-op

## Assumptions
- Local folders can't currently be created from the UI (import actions are disabled), so this is
  low priority.
