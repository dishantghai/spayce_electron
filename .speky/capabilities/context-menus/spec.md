# context-menus

Seeded from completed items 004, F005, F006, F024, F028, F034, F035, B001, B002 during the SPEKY v3
migration (2026-10-14). Describes the code as it is today.

## Purpose

Right-click menus on tree items, pinned links and empty tree areas, in the sidebar, space cards and the
overlay sidebar. The menu definitions live in `App.tsx` (main renderer) and are duplicated in
`renderer/sidebar.tsx` (overlay); the two copies differ slightly (context-menus-R5).

<!-- speky:next-id 7 -->
## Requirements

### context-menus-R1: Folder menu (main renderer)
A folder's menu offers New Folder, Add Link, Import Local Folder (disabled), Import Local File
(disabled), Rename, Copy Folder, Copy All Links (only when the folder contains links at any depth),
Paste (always shown), Refresh (local folders only), Open in Workspace (disabled) and Delete. Refresh
currently has no main-process handler, so it does nothing.

#### Scenario: folder without links
- WHEN the user right-clicks a folder that has no links in its subtree
- THEN "Copy All Links" is not in the menu

### context-menus-R2: Link menu
A link's menu offers Rename, Copy Link, Pin to Top or Unpin (whichever matches its state) and Delete.
When the menu is opened from the pins grid, Rename is left out.

#### Scenario: pinned link in the grid
- WHEN the user right-clicks a link in the pins grid
- THEN the menu has no Rename entry and shows Unpin

### context-menus-R3: Root menu on empty area
Right-clicking empty space in a sidebar tree or space card opens a root menu: New Folder, Add Link,
Import Local Folder (disabled), Import Local File (disabled), and Paste when the internal clipboard has
items. Its actions apply at the space root.

#### Scenario: new folder at root
- WHEN the user chooses New Folder from the root menu of space "Work"
- THEN an inline folder input opens at the root of "Work"

### context-menus-R4: Menu selects its item
Opening an item's menu selects that item in its context (sidebar, card or pins-grid). In the overlay,
it also clears any open inline input or rename first.

#### Scenario: selection follows menu
- WHEN the user right-clicks link "Docs" in the sidebar
- THEN "Docs" becomes the sidebar's selected item

### context-menus-R5: Overlay sidebar menu
In overlay mode (floating sidebar over the browser) the overlay renders its own menu. Rename, New
Folder and Add Link are handled inside the overlay. Copy Folder, Copy All Links, Copy Link, Paste,
Refresh Folder, Pin/Unpin to Top (offered for folders as well as links) and Delete are forwarded to
the main renderer as `CONTEXT_MENU_ACTION`. Paste is gated on a `hasClipboard` flag that the main
renderer never sends today, so the overlay never shows Paste.

#### Scenario: forwarded delete
- WHEN the user chooses Delete on a link in the overlay sidebar
- THEN the main renderer deletes the link and refreshes both sidebars

### context-menus-R6: Menus never clipped by the browser view
In fixed sidebar mode and in overlay mode, the browser WebContentsView stays visible while a menu is
open, because the menu does not overlap it. In any other browser-tab layout the browser view is hidden
while a menu is open, so the native view doesn't cover the menu.

#### Scenario: fixed mode
- WHEN the sidebar is fixed, the Browser tab is active and the user opens a sidebar menu
- THEN the web page stays visible and the menu is fully drawn
