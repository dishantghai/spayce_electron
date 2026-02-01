# Context Menu Testing Matrix - Complete Validation

## 🎯 Critical Fixes Applied

1. ✅ **Action ID Standardization** - All IDs now use hyphens consistently
2. ✅ **Inline Input Store Sync** - Store state syncs from main to overlay via IPC
3. ✅ **Context Menu in Overlay** - Renders at correct z-index naturally
4. ✅ **Comprehensive Logging** - Trace every step of action execution

---

## 📋 COMPLETE ACTION TESTING MATRIX

Test each action and mark with ✅ or ❌

### FOLDER CONTEXT MENU ACTIONS

| Action | Test Steps | Expected Console Log Pattern | Visual Result | Status |
|--------|------------|------------------------------|---------------|--------|
| **New Folder** | Right-click folder → "New Folder" | `action: new-folder` → `Setting sidebar input` → `Syncing inline input` | Inline input appears in folder | [ ] |
| **New Link** | Right-click folder → "New Link" | `action: new-link` → `Setting sidebar input` → `Syncing inline input` | Inline input appears in folder | [ ] |
| **Rename** | Right-click folder → "Rename" | `action: rename` → `Setting rename item ID` → `Syncing rename itemId` | Inline rename input with name selected | [ ] |
| **Copy Folder** | Right-click folder → "Copy Folder" | `action: copy-folder` → `Copying folder` → `Action completed` | No visual change (clipboard updated) | [ ] |
| **Copy All Links** | Right-click folder with links → "Copy All Links" | `action: copy-all-links` → `Collecting links` → `Copied N link(s)` | URLs in system clipboard | [ ] |
| **Paste** | Copy item, right-click folder → "Paste" | `action: paste` → `Pasting into folder` → `Action completed` | Item appears in folder | [ ] |
| **Refresh** | Right-click local folder → "Refresh" | `action: refresh` → `Refreshing local folder` → `Folder refreshed` | Folder contents update | [ ] |
| **Delete** | Right-click folder → "Delete" | `action: delete` → `Deleting item` → Confirmation dialog → `Item deleted` | Folder disappears | [ ] |

### LINK CONTEXT MENU ACTIONS

| Action | Test Steps | Expected Console Log Pattern | Visual Result | Status |
|--------|------------|------------------------------|---------------|--------|
| **Rename** | Right-click link → "Rename" | `action: rename` → `Setting rename item ID` → `Syncing rename itemId` | Inline rename input appears | [ ] |
| **Copy Link** | Right-click link → "Copy Link" | `action: copy-link` → `Copying link URL` → `Link copied` | URL in system clipboard | [ ] |
| **Pin to Top** | Right-click unpinned link → "Pin to Top" | `action: pin-to-top` → `Pinning item` → `Item pinned` | Link appears in pinned section | [ ] |
| **Unpin** | Right-click pinned link → "Unpin" | `action: unpin` → `Unpinning item` → `Item unpinned` | Link removed from pinned section | [ ] |
| **Delete** | Right-click link → "Delete" | `action: delete` → `Deleting item` → `Item deleted` (no confirmation for links) | Link disappears | [ ] |

### ROOT CONTEXT MENU ACTIONS

| Action | Test Steps | Expected Console Log Pattern | Visual Result | Status |
|--------|------------|------------------------------|---------------|--------|
| **New Folder** | Right-click empty space → "New Folder" | `action: new-folder` → `Setting sidebar input` → `Syncing inline input` | Inline input at root | [ ] |
| **New Link** | Right-click empty space → "New Link" | `action: new-link` → `Setting sidebar input` → `Syncing inline input` | Inline input at root | [ ] |
| **Paste** | Copy item, right-click empty → "Paste" | `action: paste` → `Pasting into folder` → Paste completes | Item appears at root | [ ] |

---

## 🔴 CRITICAL LOG PATTERNS TO VERIFY

### SUCCESS Pattern (What You SHOULD See)

```
[SidebarOverlay] Context menu action: rename ECommerce
    ↓
[App] CONTEXT_MENU_ACTION received: {actionId: 'rename', itemId: '...', spaceId: '...', context: 'sidebar'}
    ↓
[App] 🎯 Executing action: rename on item: ECommerce
    ↓
[App] → Setting rename item ID: [item-id]
    ↓
[SidebarOverlay] Syncing rename itemId: [item-id]
    ↓
[App] ✅ Action completed: rename
```

### FAILURE Pattern (What indicates a problem)

```
[SidebarOverlay] Context menu action: rename ECommerce
    ↓
[App] CONTEXT_MENU_ACTION received: {actionId: 'rename', ...}
    ↓
[App] 🎯 Executing action: rename on item: ECommerce
    ↓
[App] ❌ UNKNOWN ACTION: rename ← CHECK IF THIS APPEARS!
```

If you see "UNKNOWN ACTION", the action ID is still not matching!

---

## 🔍 DUPLICATE EVENT DETECTION

### How to Check for Repeated Events

Count occurrences of these logs when you perform ONE action:

| Log Message | Should Appear | Problem if Appears |
|-------------|---------------|-------------------|
| `[SidebarOverlay] Context menu action` | **1 time** | >1 = Multiple clicks or event listener duplication |
| `[App] CONTEXT_MENU_ACTION received` | **1 time** | >1 = Action forwarded multiple times |
| `[App] 🎯 Executing action` | **1 time** | >1 = Handler called multiple times |
| `[SidebarOverlay] Syncing inline input` | **1 time** | >1 = State sync loop |
| `[SidebarOverlay] Syncing rename itemId` | **1 time** | >1 = State sync loop |

### If You See Duplicates

**Scenario A: Same log appears 2-3 times for ONE action**
- **Cause**: Event listener registered multiple times
- **Fix**: Check useEffect dependency arrays in action handler

**Scenario B: Logs appear in infinite loop**
- **Cause**: Circular state update
- **Fix**: Check if state sync triggers another state update

---

## 🛡️ REGRESSION TESTING

Make sure these still work (don't break existing functionality):

### SpacesScreen Context Menus (Should be Unchanged)
- [ ] Right-click item in SpacesScreen (not sidebar) → context menu appears
- [ ] All actions work in SpacesScreen
- [ ] Browser hides when SpacesScreen context menu opens (correct behavior)

### Overlay Core Features
- [ ] Hover left edge → sidebar appears
- [ ] Click items → items select correctly
- [ ] Expand/collapse folders → state persists
- [ ] Switch spaces → expanded folders don't collapse
- [ ] Pin/unpin sidebar → mode transitions work
- [ ] Cmd+B → toggles sidebar

---

## 📈 PERFORMANCE VERIFICATION

### Check for Excessive Re-renders

Watch console during a single right-click:

**Good (< 10 logs):**
```
[SidebarOverlay] Item context menu requested
[SidebarOverlay] Context menu action
[App] CONTEXT_MENU_ACTION received
[App] Executing action
[App] Action completed
```

**Bad (> 50 logs):**
```
[SidebarOverlay] Syncing inline input  ← Appears 20 times
[SidebarOverlay] Syncing inline input
[SidebarOverlay] Syncing inline input
... (repeated many times)
```

If you see excessive logs, there's a state update loop.

---

## 🎯 FINAL VERIFICATION

After testing all actions, answer these questions:

1. **Do ALL actions appear in console logs?** (Should see action name in logs)
2. **Do inline inputs appear for rename/new-folder/new-link?** (Visual confirmation)
3. **Do items actually get created/deleted/renamed?** (Persistence check)
4. **Is browser content always visible?** (No blank screen)
5. **Is context menu always on top?** (Z-index correct)
6. **Are there any repeated/duplicate logs?** (Event listener issues)
7. **Are there any "UNKNOWN ACTION" errors?** (ID mismatch)

If you answer **YES to 1-5** and **NO to 6-7**, the fix is complete! ✅

---

## 🚨 EMERGENCY ROLLBACK

If things are completely broken, you can revert the context menu changes:

```bash
# Check what changed
git diff packages/desktop/src/renderer/sidebar.tsx
git diff packages/desktop/src/renderer/App.tsx

# Revert if needed
git checkout HEAD -- packages/desktop/src/renderer/sidebar.tsx
git checkout HEAD -- packages/desktop/src/renderer/App.tsx
```

But test first - the fix should work! The key changes are:
1. Action IDs standardized to hyphens
2. Inline input store synced to overlay
3. Context menus render in overlay

These are fundamental fixes that make the architecture correct.
