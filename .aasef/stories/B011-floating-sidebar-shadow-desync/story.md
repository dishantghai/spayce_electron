# B011: Floating Sidebar Shadow Desyncs from Slide-In Animation

## Description

When the floating sidebar slides open on Spaces or Workspace tabs, the right-edge shadow
appears **instantly** before the sidebar content finishes its 250ms slide-in transform.
This makes the shadow look like a separate visual element that "jumps ahead" of the sidebar.

The user expects the shadow and the sidebar to move as **one cohesive unit** during the
slide-in animation.

## Root Cause Analysis

### Evidence 1: Dual Shadow Layers at Different Hierarchy Levels

**Layer A — Wrapper `<div>` in App.tsx (line ~2346):**
```jsx
boxShadow: (useOverlayMode || !reactSidebarVisible)
    ? 'none'
    : '10px 0 30px -5px rgba(0, 0, 0, 0.5)',
```
- This shadow is on the **wrapper container** (the `<div>` that wraps `<Sidebar>`).
- It toggles between `'none'` and the shadow value based on `reactSidebarVisible` state.
- It has **no CSS transition** — it appears/disappears **instantly** on state change.
- The wrapper itself is `position: absolute; left: 0; top: 0` and does NOT move.

**Layer B — Sidebar element in `Sidebar.module.css` (lines 11-18):**
```css
.sidebar.floating {
    box-shadow:
        4px 0 30px 5px rgba(0, 0, 0, 0.5),
        0 0 40px rgba(109, 90, 230, 0.1);
    transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar.floating.collapsed {
    transform: translateX(-320px);
}
```
- This shadow is on the `.sidebar` element **inside** the wrapper.
- The sidebar slides via `transform: translateX(-320px)` → `translateX(0)`.
- The `box-shadow` on this element **does** move with the transform since it's on
  the same element — but it compounds with the wrapper shadow.

### Evidence 2: Animation Timing Mismatch

When `reactSidebarVisible` changes from `false` → `true`:

```
0ms:    reactSidebarVisible = true
        → Wrapper boxShadow: 'none' → '10px 0 30px ...'  (INSTANT)
        → Sidebar class removes 'collapsed'
        → Sidebar transform: translateX(-320px) → 0  (250ms transition starts)

0-250ms: Wrapper shadow FULLY VISIBLE at right edge (stationary, on wrapper div)
         Sidebar is STILL sliding in from the left
         → User sees: shadow in final position, sidebar still animating

250ms:   Sidebar reaches translateX(0)
         → Both visually "settled"
```

The wrapper shadow reaches its final visual position at 0ms.
The sidebar content reaches its final visual position at 250ms.
**This 250ms gap is the desync the user sees.**

### Evidence 3: The Wrapper Shadow is Redundant

The sidebar's own `.floating` class already has a `box-shadow`. The wrapper shadow
at the `<div>` level was likely added for cases when the sidebar is fully visible
(no transform offset), but it creates a visual conflict during the animation.

## Acceptance Criteria

- [ ] The right-edge shadow moves together with the sidebar as one unit during slide-in
- [ ] The right-edge shadow moves together with the sidebar as one unit during slide-out (collapse)
- [ ] No visual "shadow flash" or "shadow precedes content" effect
- [ ] Fixed sidebar mode is unaffected (no shadow in fixed mode)
- [ ] Overlay mode (browser tab) is unaffected
- [ ] Mode switch transitions (pin/unpin) still work without flicker
- [ ] All existing tests pass (3193 tests)

## Context

- **Related Spec**: 020 (sidebar overlay and floating mode)
- **Related Bugs**: B009 (sidebar collapse animation on tab switch), B010 (sidebar overlay slide-in)
- **Affected Files**:
  - `packages/desktop/src/renderer/App.tsx` (wrapper inline styles)
  - `packages/react-ui/src/components/Sidebar.module.css` (sidebar shadow and transition)

## Tasks

1. Remove the `boxShadow` from the wrapper `<div>` in App.tsx — the sidebar's own
   `box-shadow` in CSS is sufficient and moves with the transform
2. Verify the sidebar's `.floating` box-shadow provides adequate visual depth on its own
3. Write regression tests verifying the shadow is only on the sidebar element, not the wrapper
4. Ensure all 3193 existing tests still pass

## Notes

- The fix is to remove the **wrapper** shadow and rely solely on the sidebar's own
  `box-shadow` which naturally moves with `transform: translateX()`.
- The sidebar's existing shadow (`4px 0 30px 5px rgba(0, 0, 0, 0.5)`) is already
  more prominent than the wrapper shadow (`10px 0 30px -5px rgba(0, 0, 0, 0.5)`)
  due to the positive spread value.
- The `no-transitions` class and `isModeSwitch` flag are unrelated to this bug —
  they handle pin/unpin transitions which are a different code path.
