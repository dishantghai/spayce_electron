# space-tree

Seeded from completed items 003, 012, 015, F001, F002, F003, F004, F026, B016 during the SPEKY v3
migration (2026-10-14). Describes the code as it is today.

## Purpose

Each space holds a tree of folders and links (plus a `localFolder` type that only gets an icon and a
menu entry today). Users build the tree with inline inputs, rename items in place and expand or
collapse folders, in both the sidebar and the space cards. The legacy tree renders by default; a React
Arborist tree is behind the `USE_ARBORIST_TREE` flag (`?arborist=true`).

<!-- speky:next-id 7 -->
## Requirements

### space-tree-R1: Inline folder and link creation
"New Folder" or "Add Link", from a folder's hover action, the item context menu or the root context
menu, opens an inline input under the target parent and expands that parent. Sidebar and card inputs
are tracked separately (`inlineInputStore`). Enter submits the trimmed value, Escape cancels, and an
empty value never creates an item. Link input is normalised to a URL, and the link is created right
away with the URL as its name.

#### Scenario: create a folder
- WHEN the user chooses New Folder on folder "Docs", types "Specs" and presses Enter
- THEN a folder "Specs" is created as a child of "Docs" and "Docs" is expanded

#### Scenario: cancel
- WHEN the user presses Escape in an inline input
- THEN the input closes and nothing is created

#### Scenario: link without scheme
- WHEN the user enters `example.com` in an Add Link input
- THEN a link with path and name `https://example.com` is created

### space-tree-R2: Inline rename
"Rename" swaps the item label for an input pre-filled with its current name. Enter, or blur with a
changed non-empty value, saves through `items:rename`. Escape, or blur with an empty or unchanged
value, cancels. Sidebar and card renames are tracked separately.

#### Scenario: rename saved
- WHEN the user renames link "Google" to "Search" and presses Enter
- THEN the item is persisted as "Search"

#### Scenario: unchanged on blur
- WHEN the rename input loses focus with the original name
- THEN no rename request is sent

### space-tree-R3: Folder hover actions
Hovering a folder row shows quick actions to add a subfolder and add a link. Each one opens the
matching inline input inside that folder (space-tree-R1).

#### Scenario: hover add link
- WHEN the user hovers folder "Docs" and clicks the add-link action
- THEN an inline link input appears inside "Docs"

### space-tree-R4: Expand and collapse persistence
The expanded-folder IDs of the sidebar tree are kept per space and persisted to localStorage, so
expansion survives reloads and Sidebar remounts. The overlay sidebar reports expansion changes back to
the main renderer.

#### Scenario: survives reload
- WHEN the user expands "Docs" and reloads the window
- THEN "Docs" is still expanded

### space-tree-R5: Deleting items
Delete removes the item through `items:delete`. Folders (and local folders) ask for a `confirm()`
dialog first; links are deleted without confirmation.

#### Scenario: delete folder
- WHEN the user deletes folder "Docs" and confirms
- THEN the folder and its descendants are removed

#### Scenario: delete link
- WHEN the user deletes a link
- THEN it is removed immediately without a dialog

### space-tree-R6: Moving folders keeps their subtree
Moving a folder (within or across spaces, `items:move`) moves its descendants with it, including
re-homing them to the target space.

#### Scenario: cross-space folder move
- WHEN folder "Docs" with two children is moved from space A to space B
- THEN "Docs" and both children belong to space B and keep their hierarchy
