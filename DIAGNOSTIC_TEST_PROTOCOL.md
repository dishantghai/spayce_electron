# Diagnostic Test Protocol - Complete Flow Tracing

## 🎯 How to Test Properly

### IMPORTANT: We need to see logs from BOTH actions

1. **When you RIGHT-CLICK** (opens context menu) ← Need these logs!
2. **When you CLICK menu item** (executes action) ← You showed these

## 📋 Test Protocol

### Setup
1. Open DevTools Console (Cmd+Option+I)
2. Clear console (to see fresh logs)
3. In browser mode, floating sidebar
4. Hover left edge to show sidebar overlay

---

### Test Sequence 1: Reproduce the Stale State Bug

**Step 1: Trigger Rename on Link A**
```
1. Right-click "Gmail" link
2. Click "Rename"
3. DON'T type anything, DON'T press Enter
4. Rename input should appear with "Gmail" selected
```

**Expected logs:**
```
═══════════════════════════════════════════
[SidebarOverlay] 🖱️ RIGHT-CLICK on item: Gmail
[SidebarOverlay] Current inline states BEFORE clear: {sidebarRenameItemId: null, sidebarInput: null}
[SidebarOverlay] 🧹 Clearing stale inline input state locally...
[SidebarOverlay] States AFTER clear: {sidebarRenameItemId: null, sidebarInput: null}
═══════════════════════════════════════════

[SidebarOverlay] Context menu action: rename Gmail
[App] CONTEXT_MENU_ACTION received: {actionId: 'rename', ...}
[App] 🎯 Executing action: rename on item: Gmail
[App] → Setting rename item ID: [gmail-id]

[App] 📡 Syncing state to overlay: {
    selectedItemId: [gmail-id],
    sidebarInput: null,
    sidebarRenameItemId: [gmail-id]  ← Should be gmail-id now
}

[SidebarOverlay] Syncing rename itemId: [gmail-id]
```

**Step 2: Open Context Menu on Different Link**
```
1. WITHOUT submitting the rename (Gmail rename input still visible)
2. Right-click on "YouTube" link
```

**CRITICAL: Look for these logs:**
```
═══════════════════════════════════════════
[SidebarOverlay] 🖱️ RIGHT-CLICK on item: YouTube
[SidebarOverlay] Current inline states BEFORE clear: {
    sidebarRenameItemId: [gmail-id],  ← Should show Gmail ID
    sidebarInput: null
}
[SidebarOverlay] 🧹 Clearing stale inline input state locally...
[SidebarOverlay] States AFTER clear: {
    sidebarRenameItemId: null,  ← Should be NULL
    sidebarInput: null
}
═══════════════════════════════════════════
```

**Step 3: Click Delete on YouTube**
```
1. Click "Delete" in context menu
2. Confirm deletion
```

**Expected logs:**
```
[SidebarOverlay] Context menu action: delete YouTube
[App] CONTEXT_MENU_ACTION received: {actionId: 'delete', ...}
[App] 🎯 Executing action: delete on item: YouTube
[App] → Deleting item: YouTube
✅ Item deleted: YouTube

[App] 📡 Syncing state to overlay: {
    selectedItemId: [...],
    sidebarInput: null,
    sidebarRenameItemId: null  ← KEY: Should be NULL, not Gmail ID!
}
```

**Visual Check:**
- ✅ Gmail rename input should DISAPPEAR when you right-click YouTube
- ✅ After delete, NO rename input should be visible
- ✅ Focus should NOT go to Gmail

---

## 🔍 WHAT TO LOOK FOR

### If Gmail rename input DISAPPEARS when you right-click YouTube:
✅ **The fix is working!** Cleanup happening correctly.

### If Gmail rename input PERSISTS after right-clicking YouTube:
❌ **Cleanup failed** - Check these logs:

**Missing Log 1:**
```
[SidebarOverlay] 🖱️ RIGHT-CLICK on item: YouTube
```
**If missing**: Context menu handler not being called at all

**Missing Log 2:**
```
[SidebarOverlay] 🧹 Clearing stale inline input state locally...
```
**If missing**: Cleanup code not executing (error in handler?)

**Wrong State in Log 3:**
```
[SidebarOverlay] States AFTER clear: {
    sidebarRenameItemId: [gmail-id]  ← Should be NULL!
}
```
**If not null**: Store cleanup not working (store method error?)

### If Gmail rename input disappears but REAPPEARS after delete:
❌ **State re-sync issue** - Check:

```
[App] 📡 Syncing state to overlay: {
    sidebarRenameItemId: [gmail-id]  ← Should be NULL!
}
```

**If NOT null in sync**: Main renderer still has stale state
**Cause**: Cleanup not happening in main renderer OR sync reading stale store value

---

## 🔬 DETAILED LOGGING INSTRUCTIONS

### Test and Share These Logs

**Do this exact sequence:**
```
1. CLEAR CONSOLE
2. Right-click "Gmail" → Click "Rename"
3. Right-click "YouTube" (don't submit Gmail rename)
4. Click "Delete" on YouTube menu
5. COPY ALL CONSOLE LOGS
```

**Share the complete log showing:**
- First right-click (Gmail)
- Second right-click (YouTube) ← CRITICAL - need to see cleanup logs
- Delete action execution

---

## 🚨 CRITICAL QUESTIONS

After testing, answer:

1. **When you right-click YouTube, does "Gmail" rename input disappear?**
   - YES → Cleanup working, state re-sync issue
   - NO → Cleanup not working

2. **Do you see "🧹 Clearing stale inline input state" log?**
   - YES → Cleanup called
   - NO → Cleanup not being called

3. **What is "sidebarRenameItemId" AFTER clear?**
   - null → Cleanup successful
   - gmail-id → Cleanup failed

4. **What is "sidebarRenameItemId" in state sync AFTER delete?**
   - null → Correct
   - gmail-id → Main renderer has stale state

Share the logs and answers to these questions!
