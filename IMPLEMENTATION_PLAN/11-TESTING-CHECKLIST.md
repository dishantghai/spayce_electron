# Testing & Verification Checklist

Use this checklist to manually test each feature after implementation.

---

## Phase 1: Core Item Management

### US-001: Create Folder via Inline Input
- [ ] Click "+" folder button in space header → inline input appears at root
- [ ] Click folder icon on folder hover → inline input appears inside folder
- [ ] Input auto-focuses on appearance
- [ ] Type name, press Enter → folder created with correct name
- [ ] Press Escape → input cancelled, no folder created
- [ ] Click outside with content → folder created
- [ ] Click outside without content → input cancelled
- [ ] Parent folder auto-expands when adding subfolder
- [ ] Folder appears in correct tree position
- [ ] Folder persists after app refresh

### US-002: Create Link via Inline Input
- [ ] Copy URL in browser first
- [ ] Click link icon in space header → inline input with URL pre-filled
- [ ] Click link icon on folder hover → inline input inside folder
- [ ] Type partial URL (google.com), press Enter → https:// auto-added
- [ ] Domain extracted as link name (e.g., "google.com")
- [ ] Favicon URL generated and displayed
- [ ] Link appears in correct tree position
- [ ] Non-URL clipboard text NOT auto-pasted

### US-003: Inline Rename Items
- [ ] Right-click item → select "Rename" → inline input appears
- [ ] Input pre-filled with current name
- [ ] All text selected on focus
- [ ] Type new name, press Enter → name updated
- [ ] Press Escape → reverted to original name
- [ ] Click outside with changes → name updated
- [ ] Try empty name → validation prevents save
- [ ] Rename persists after app refresh

### US-004: Folder Hover Actions
- [ ] Hover over folder → 3 icons appear (folder+, link, more)
- [ ] Hover over link → 1 icon appears (more)
- [ ] Icons fade in smoothly (~150ms)
- [ ] Leave hover → icons fade out
- [ ] Click FolderPlus → inline folder input inside
- [ ] Click Link → inline link input inside
- [ ] Click MoreVertical → context menu opens
- [ ] No icons visible during rename mode

---

## Phase 2: Context Menu Enhancement

### US-005: Enhanced Folder Context Menu
- [ ] Right-click folder → menu appears at cursor position
- [ ] Menu items in correct order (see spec)
- [ ] "New Folder" → inline folder input inside
- [ ] "Add Link" → inline link input inside
- [ ] "Rename" → inline rename active
- [ ] "Copy Folder" → folder in internal clipboard
- [ ] "Copy All Links" → all nested URLs in system clipboard
- [ ] "Paste" visible only when clipboard has items
- [ ] "Delete" → confirmation then deletion
- [ ] Arrow keys navigate menu
- [ ] Enter selects highlighted item
- [ ] Escape closes menu
- [ ] Click outside closes menu

### US-006: Enhanced Link Context Menu
- [ ] Right-click link → menu appears
- [ ] "Rename" → inline rename active
- [ ] "Copy Link" → URL in system clipboard (paste in browser to verify)
- [ ] "Pin to Top" visible for unpinned links → link appears in pins grid
- [ ] "Unpin" visible for pinned links → link removed from pins grid
- [ ] "Delete" → link removed from tree
- [ ] Menu shows correct Pin/Unpin based on current state

---

## Phase 3: Copy/Paste Operations

### US-007: Copy Single Item
- [ ] "Copy Link" from context menu → URL in system clipboard
- [ ] "Copy Link" → item in internal clipboard (verify via paste)
- [ ] "Copy Folder" → folder in internal clipboard
- [ ] "Copy All Links" → all nested URLs in system clipboard (newline separated)
- [ ] Internal clipboard persists until new copy or paste

### US-008: Paste Items
- [ ] Copy folder → "Paste" in different folder → folder duplicated
- [ ] Pasted folder has NEW ID (not same as original)
- [ ] Paste into selected folder → items appear inside
- [ ] Paste with nothing selected → items appear at root
- [ ] Children copied recursively (nested items preserved)
- [ ] Target folder auto-expands to show pasted items
- [ ] Pasted items persist after refresh

### US-009: Paste from System Clipboard
- [ ] Copy URL from browser address bar
- [ ] "Paste" in Spayce (internal clipboard empty) → link created
- [ ] Domain extracted as link name
- [ ] Favicon generated
- [ ] Copy multiple URLs (newline separated) → multiple links created
- [ ] Copy partial URL (google.com) → https:// added
- [ ] Copy non-URL text → nothing pasted

### US-010: Keyboard Shortcuts
- [ ] Select item → Cmd+C (Mac) / Ctrl+C (Win) → item copied
- [ ] Cmd+V → items pasted
- [ ] Multi-select items → Cmd+C → all items copied
- [ ] Cmd+C on link → URL also in system clipboard
- [ ] Shortcuts only work when sidebar has focus
- [ ] Shortcuts don't interfere with text input fields

---

## Phase 4: Drag and Drop (Within Space)

### US-011: Drag Tree Items
- [ ] Click and drag item → drag preview appears
- [ ] Preview shows item icon and name
- [ ] Source item fades to 40% opacity
- [ ] Preview follows cursor smoothly
- [ ] Release outside valid target → item returns to original position
- [ ] Multi-select items → drag shows count badge

### US-012: Drop Indicators
- [ ] Drag over item → horizontal line appears
- [ ] Line indentation matches tree level
- [ ] Line color matches space accent color
- [ ] Line fades in/out smoothly (~150ms)
- [ ] Line disappears when drag leaves

### US-013: Drop Target Hit Zones
- [ ] Drag over folder TOP 20% → "before" indicator (line above)
- [ ] Drag over folder MIDDLE 60% → "inside" indicator (folder highlights)
- [ ] Drag over folder BOTTOM 20% → "after" indicator (line below)
- [ ] Drag over link TOP 50% → "before" indicator
- [ ] Drag over link BOTTOM 50% → "after" indicator
- [ ] Drop at indicated position → item moves correctly
- [ ] Drop inside folder → item becomes child of folder

### US-014: Drop Validation
- [ ] Drag item over itself → no indicator, cursor "not-allowed"
- [ ] Drag folder over its own child → no indicator
- [ ] Drag folder over its grandchild → no indicator
- [ ] Drag to same position (no-op) → no indicator
- [ ] Valid drops → indicator shows normally

### US-015: Auto-Expand Folders on Drag Hover
- [ ] Drag over collapsed folder → wait 500ms → folder expands
- [ ] Leave before 500ms → folder doesn't expand
- [ ] Leave expanded folder → collapses after ~150ms
- [ ] Re-enter quickly → cancels collapse timer
- [ ] Only one folder auto-expanded at a time
- [ ] Drop inside auto-expanded folder → folder stays expanded

### US-016: Flash Animation on Drop
- [ ] Drop item → dropped item briefly flashes with accent color
- [ ] Flash lasts approximately 700ms
- [ ] Flash auto-clears (no permanent highlight)

---

## Phase 5: Multi-Selection

### US-017: Ctrl+Click Toggle Selection
- [ ] Click item → single selection (item highlighted)
- [ ] Cmd+Click (Mac) / Ctrl+Click (Win) second item → both selected
- [ ] Cmd+Click selected item → item deselected
- [ ] Regular click → clears multi-selection, selects single
- [ ] Switch to different space → selection cleared

### US-018: Shift+Click Range Selection
- [ ] Click item A (anchor set)
- [ ] Shift+Click item C → A, B, C all selected
- [ ] Shift+Click item above anchor → range reverses direction
- [ ] Collapsed folder's children NOT included in range
- [ ] Shift+Click after Ctrl+Click → uses last clicked as anchor

### US-019: Multi-Selection Visual Feedback
- [ ] Multi-selected items have tinted background
- [ ] Background uses space accent color at ~10% opacity
- [ ] Left border indicator visible on selected items
- [ ] Hover state slightly darker
- [ ] Selection visually distinct from single focus

### US-020: Multi-Select Drag
- [ ] Select multiple items → drag one → all selected items drag together
- [ ] Drag preview shows count badge (e.g., "3")
- [ ] Drop → all items move to target position
- [ ] Relative order of items maintained
- [ ] Selection cleared after drop

---

## Phase 6: Advanced Drag Operations

### US-021: Cross-Space Drag via Bottom Bar
- [ ] Drag item → hover over different space icon → icon highlights
- [ ] Hover same space icon → no highlight (can't drop to same space)
- [ ] Hover 500ms → view switches to that space
- [ ] Drop on space icon → item moves to target space root
- [ ] Both spaces update (source shows removal, target shows addition)
- [ ] Multi-select drag to different space works

### US-022: Drag to Pins Grid
- [ ] Drag link to pins grid → grid accepts, shows drop position
- [ ] Drag folder to pins grid → rejected (cursor "not-allowed")
- [ ] Drop position indicator shows between existing pins
- [ ] Drop → link pinned at indicated position
- [ ] Pins grid full (15 pins) → new links rejected
- [ ] Already-pinned links can still be reordered in full grid

### US-023: Reorder Pins in Grid
- [ ] Drag existing pin within grid → shows drop position
- [ ] Drop → pin moves to new position
- [ ] Order persists after app refresh
- [ ] Animation smooth

### US-024: Pinned Link Context Menu
- [ ] Right-click pin → context menu appears
- [ ] "Rename" → inline rename (or modal)
- [ ] "Copy Link" → URL in system clipboard
- [ ] "Unpin" → removes from grid, link stays in tree
- [ ] "Delete" → removes from grid AND tree

### US-025: Smart Drag Preview (Square for Pins)
- [ ] Drag link normally → rectangle preview with name
- [ ] Hover over pins grid → preview morphs to square with favicon
- [ ] Leave pins grid → preview morphs back to rectangle
- [ ] Transition smooth (~150ms)

---

## Phase 7: Space Cards Features

### US-026: Inline Creation in Space Cards
- [ ] Click folder+ in card header → inline input at card root
- [ ] Click link+ in card header → inline input with auto-paste
- [ ] Create folder in card → appears in card tree
- [ ] Hover folder in card → shows action buttons
- [ ] Create subfolder via hover action works
- [ ] Uses separate state from sidebar (both can be active)

### US-027: Inline Rename in Space Cards
- [ ] Right-click item in card → Rename → inline input appears
- [ ] Enter saves, Escape cancels
- [ ] Rename persists after refresh
- [ ] Card rename independent from sidebar rename

### US-028: Context Menus in Space Cards
- [ ] Right-click item in card → full context menu appears
- [ ] All menu items functional
- [ ] Actions use card state (not sidebar state)
- [ ] Paste works in card context

### US-029: Drag Within Space Card
- [ ] Drag item within card → preview appears
- [ ] Drop indicators show in card tree
- [ ] Hit zones work same as sidebar (20/60/20 for folders)
- [ ] Reorder persists after refresh

### US-030: Drag Across Space Cards
- [ ] Drag item from card A → hover card B → card B border highlights
- [ ] Drop → item moves from card A to card B
- [ ] Card A updates (item removed)
- [ ] Card B updates (item added at root)
- [ ] Cannot drop to same card (no highlight)

---

## General Verification

### Data Persistence
- [ ] All created items persist after app restart
- [ ] All renames persist after app restart
- [ ] All moves/reorders persist after app restart
- [ ] All pin states persist after app restart

### Error Handling
- [ ] Network timeout during save → error message shown
- [ ] Invalid data → appropriate validation error
- [ ] Concurrent edit → handled gracefully

### Performance
- [ ] Large tree (100+ items) → drag is smooth
- [ ] Multi-select 20 items → drag preview responsive
- [ ] Rapid clicks → no UI freeze

### Keyboard Accessibility
- [ ] Tab navigation through interactive elements
- [ ] Enter activates focused element
- [ ] Escape closes modals/menus
- [ ] Arrow keys work in tree navigation

---

## Sign-off

| Phase | Tester | Date | Status |
|-------|--------|------|--------|
| Phase 1 | | | |
| Phase 2 | | | |
| Phase 3 | | | |
| Phase 4 | | | |
| Phase 5 | | | |
| Phase 6 | | | |
| Phase 7 | | | |
| General | | | |
