# Context Menu Diagnostic Guide

## What Changed

Context menus now render **INSIDE the sidebar overlay WebContentsView** instead of in main renderer HTML.

## How to Test

### Step 1: Get into Browser Mode with Floating Sidebar
1. Click "Browser" tab at top
2. Click the pin icon to unpin (floating mode)
3. Sidebar should collapse
4. Hover left edge → sidebar overlay should appear

### Step 2: Right-Click on an Item
1. Right-click on any folder or link in the sidebar
2. **Watch the console for these logs**

### Step 3: Expected Console Logs

```
[SidebarOverlay] Item context menu requested: [item name]
```

If you see this, the overlay is handling the right-click ✅

If you DON'T see this, check:
- Is the sidebar actually in overlay mode? (check for useOverlayMode: true in earlier logs)
- Is the right-click event being captured?

### Step 4: Context Menu Should Appear

**Visual Check:**
- [ ] Context menu appears at cursor position
- [ ] Context menu is above browser content (not below)
- [ ] Browser content is still visible (not blank)

If context menu doesn't appear:
- Check browser console for React errors
- Check if ContextMenu component is imported correctly in sidebar.tsx

### Step 5: Click a Menu Action (e.g., "Delete")

**Expected logs:**
```
[SidebarOverlay] Context menu action: delete [item name]
[App] CONTEXT_MENU_ACTION received: {actionId: 'delete', itemId: '...', spaceId: '...'}
[App] Executing context menu action: delete on [item name]
Item deleted: [item name]
```

If action doesn't execute:
- Check if action is being forwarded from overlay to main
- Check for errors in CONTEXT_MENU_ACTION handler

## Common Issues

### Issue: "Context menu doesn't appear at all"

**Check:**
1. Is `contextMenu` state being set in overlay?
   - Look for log: `[SidebarOverlay] Item context menu requested`
2. Is ContextMenu component rendering?
   - Add console.log in ContextMenu component's render
3. Is there a CSS issue hiding it?
   - Check z-index, opacity, display properties

### Issue: "Context menu appears but actions don't work"

**Check:**
1. Is action being sent to main renderer?
   - Look for log: `[SidebarOverlay] Context menu action: [actionId]`
2. Is main renderer receiving it?
   - Look for log: `[App] CONTEXT_MENU_ACTION received`
3. Is action being executed?
   - Look for log: `[App] Executing context menu action`
4. Are there errors in the action switch statement?

### Issue: "Context menu in wrong position"

**Check:**
1. Are coordinates correct?
   - Log the position in handleItemContextMenu
2. Is viewport overflow adjustment working?
   - ContextMenu component should auto-adjust near edges

### Issue: "Browser still goes blank"

**Check:**
1. Is browser visibility logic updated?
   ```typescript
   const shouldShowBrowser = activeTab === 'browser' &&
       (useOverlayMode || (!contextMenu && !rootContextMenu));
   ```
2. Is useOverlayMode true?
   - Check console logs

## Files to Check

If something isn't working:

1. **sidebar.tsx:445-475** - Context menu rendering
2. **sidebar.tsx:323-338** - Action handler
3. **sidebar.tsx:185-199** - Event handlers
4. **App.tsx:1510-1635** - Action execution
5. **App.tsx:279-283** - Browser visibility

## Quick Verification Script

```javascript
// Paste this in browser console to check state:
console.log('Overlay Mode:', window.location.href.includes('sidebar.html'));
console.log('Context Menu State:', /* check component state */);
```

## Next Steps

Please share:
1. **Console logs** when you right-click
2. **What specifically doesn't work**:
   - Context menu doesn't appear?
   - Appears but actions don't execute?
   - Appears in wrong position?
   - Browser goes blank?
3. **Any error messages** in red in console

This will help pinpoint the exact issue!
