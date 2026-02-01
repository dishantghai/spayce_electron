# Context Menu Z-Index Fix - Complete Solution

## Root Cause Analysis

### Problem 1: Browser Goes Blank
**Cause**: Original logic hides browser when any context menu opens
```typescript
// OLD (BROKEN):
const shouldShowBrowser = activeTab === 'browser' && !contextMenu && !rootContextMenu;
```
In overlay mode, browser should stay visible (overlay handles z-index).

### Problem 2: Context Menu Below Sidebar
**Cause**: Sidebar WebContentsView at z-index 1 renders above HTML context menu

### Problem 3: Context Menu Disappears (Auto-Show Interference)
**Cause**: When overlay hides for context menu, mouse is still over left edge
- Mouse tracking detects hover → triggers auto-show
- Overlay appears on top of context menu
- Context menu becomes invisible

## The Complete Fix

### 1. Keep Browser Visible in Overlay Mode
**File**: `App.tsx:279`
```typescript
const shouldShowBrowser = activeTab === 'browser' && 
    ((!contextMenu && !rootContextMenu) || useOverlayMode);
```
**Result**: Browser stays visible as backdrop ✅

### 2. Hide Overlay When Context Menu Opens
**File**: `App.tsx:1556` (in ITEM_CONTEXT_MENU handler)
```typescript
// Set context menu state FIRST
setContextMenu({ item, spaceId, position, context: 'sidebar' });

// THEN hide overlay after next frame
requestAnimationFrame(() => {
    window.electronAPI.sidebarOverlay.hideInstant()
        .then(() => setOverlayActuallyVisible(false));
});
```
**Result**: Context menu renders before overlay hides ✅

### 3. Disable Mouse Tracking When Context Menu Open
**File**: `App.tsx:389`
```typescript
const hasContextMenu = contextMenu !== null || rootContextMenu !== null;
window.electronAPI.sidebarOverlay.syncState({
    // ... other state
    contextMenuOpen: hasContextMenu, // NEW!
});
```

**File**: `sidebarOverlayHandlers.ts:115`
```typescript
const shouldEnableMouseTracking = isOverlayMode && !contextMenuOpen;
service.setFloatingMode(shouldEnableMouseTracking);
```
**Result**: Auto-show doesn't interfere with context menu ✅

### 4. Show Overlay When Context Menu Closes
**File**: `App.tsx:1793` (useEffect)
```typescript
if (!hasContextMenu && hadContextMenu && sidebarVisible) {
    await window.electronAPI.sidebarOverlay.show();
    setOverlayActuallyVisible(true);
}
```
**Result**: Overlay restored after context menu dismissed ✅

## How to Test

### Test Case 1: Context Menu Opens Correctly
1. **In browser mode, unpin sidebar** (floating mode)
2. **Hover left edge** → overlay shows
3. **Right-click on any item** in sidebar
4. **Expected**:
   - ✅ Browser content stays visible (not blank)
   - ✅ Context menu appears on top
   - ✅ Overlay is hidden

### Test Case 2: Context Menu Doesn't Auto-Hide
1. **Context menu is open**
2. **Move mouse around** (including over left edge)
3. **Expected**:
   - ✅ Overlay stays hidden
   - ✅ Context menu remains visible
   - ✅ No auto-show interference

### Test Case 3: Overlay Restores After Context Menu
1. **Context menu is open**
2. **Click outside to dismiss** (or select an option)
3. **Expected**:
   - ✅ Context menu closes
   - ✅ Overlay reappears smoothly
   - ✅ Sidebar is interactive again

## Console Logs to Verify

When you right-click, you should see:
```
[App] Overlay action received: ITEM_CONTEXT_MENU
[App] Found space: Work
[App] Found item: ECommerce
[App] Setting context menu: {itemName: 'ECommerce', position: {...}}
[App] ⚡ CONTEXT MENU STATE CHANGED
[App] contextMenu: {itemId, itemName, position}
[App] useOverlayMode: true
[App] Scheduling overlay hide for context menu...
[App] Hiding overlay for context menu
[SidebarOverlayHandlers] Setting floating mode: {
    isOverlayMode: true,
    contextMenuOpen: true,
    shouldEnableMouseTracking: false  ← CRITICAL!
}
[App] Overlay hidden for context menu
```

**CRITICAL**: `shouldEnableMouseTracking: false` when context menu is open!

When you dismiss the context menu:
```
[App] Context menu onClose called
[App] ⚡ CONTEXT MENU STATE CHANGED
[App] contextMenu: NULL
[App] Context menu effect: {hasContextMenu: false, hadContextMenu: true, willShowOverlay: true}
[App] Context menu closed - showing sidebar overlay
[SidebarOverlayHandlers] Setting floating mode: {
    isOverlayMode: true,
    contextMenuOpen: false,
    shouldEnableMouseTracking: true  ← Mouse tracking re-enabled
}
```

## Files Modified

1. `packages/desktop/src/renderer/App.tsx`
   - Browser visibility logic (line 279)
   - Context menu state sync with contextMenuOpen flag (line 389)
   - ITEM_CONTEXT_MENU handler (line 1510-1565)
   - PINNED_ITEM_CONTEXT_MENU handler
   - ROOT_CONTEXT_MENU handler
   - Context menu close effect (line 1793)
   - Extensive debugging logs

2. `packages/desktop/src/main/ipc/sidebarOverlayHandlers.ts`
   - Check contextMenuOpen to disable mouse tracking (line 115)

3. `packages/desktop/src/preload/types.ts`
   - Added contextMenuOpen to SidebarStatePayload interface

## Test Files Created

- `overlay-context-menu-zindex.test.tsx` - TDD RED phase
- `overlay-context-menu-integration.test.tsx` - TDD GREEN phase  
- `overlay-context-menu-action-handler.test.tsx` - Action handler tests

## Key Insights

1. **WebContentsView always renders above HTML** - This is an Electron limitation
2. **Solution**: Temporarily hide overlay when HTML needs to be on top
3. **Critical detail**: Must disable mouse tracking or it re-shows overlay immediately
4. **Timing**: Context menu state set first, overlay hide after (requestAnimationFrame)

This fix ensures context menus work correctly in overlay mode while maintaining the Arc-browser-like experience!
