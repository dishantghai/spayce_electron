# B015: Browser Overlay Floating Sidebar Missing Embossed Shadow

## Description

The floating sidebar on Spaces/Workspace tabs has a visible embossed shadow effect on its
right edge (`4px 0 30px 5px rgba(0, 0, 0, 0.5)` + purple glow), but the Browser floating
sidebar overlay does NOT show this shadow.

## Root Cause Analysis

### Evidence

Both sidebars use the exact same CSS from `Sidebar.module.css`:

```css
.sidebar.floating {
    border-top-right-radius: 12px;
    border-bottom-right-radius: 12px;
    border: 1.5px solid rgba(109, 90, 230, 0.3);
    box-shadow:
        4px 0 30px 5px rgba(0, 0, 0, 0.5),
        0 0 40px rgba(109, 90, 230, 0.1);
}
```

The CSS is identical but the rendering contexts differ:

**Spaces/Workspace sidebar** (React sidebar in App.tsx):
- Renders inside the main renderer DOM
- The wrapper div has no constrained width — the shadow can extend freely to the right
- Shadow is visible because the parent container is wide enough

**Browser overlay sidebar** (WebContentsView in SidebarOverlayService):
- Renders inside a separate `WebContentsView`
- The WebContentsView bounds are set to exactly `width: 320px` (SidebarOverlayService.ts:14)
- The `.sidebar` CSS also sets `width: 320px`
- The `box-shadow` extends 4px + 30px blur + 5px spread = ~39px beyond the right edge
- **The WebContentsView clips rendering at its bounds**, so the shadow is invisible

### The Clipping Problem

```
┌─── WebContentsView (320px) ───┐
│  ┌─── .sidebar (320px) ──┐    │
│  │                        │    │
│  │     Sidebar Content    │░░░░│ ← Shadow extends here but is CLIPPED
│  │                        │    │   by the 320px WebContentsView boundary
│  └────────────────────────┘    │
└────────────────────────────────┘
                                 ↑ Shadow would appear here if the view were wider
```

### Fix

Widen the WebContentsView by a shadow margin (e.g., 40px) so the box-shadow has space to
render without being clipped. The sidebar CSS element stays at 320px, but the view container
is 360px, giving 40px of transparent space on the right for the shadow to render into.

**File: `packages/desktop/src/main/services/SidebarOverlayService.ts`**
- Add a `shadowMargin` constant (40px) to the config
- Increase the WebContentsView width from `config.width` (320px) to `config.width + shadowMargin` (360px)
- This affects `setBounds()` calls in: initialization, show/hide animation, handleRendererReload, handleSystemResume

The sidebar HTML/CSS content renders at 320px within the 360px view — the extra 40px is
transparent and allows the shadow to paint beyond the sidebar's right edge.

## Acceptance Criteria

- [ ] Browser overlay floating sidebar shows the same embossed shadow as Spaces/Workspace sidebar
- [ ] Shadow extends visually to the right of the sidebar
- [ ] WebContentsView width includes shadow margin
- [ ] Sidebar content remains 320px wide (only the view container is wider)
- [ ] Show/hide animations still work correctly with wider bounds
- [ ] No visual overlap issues with browser content to the right
- [ ] No regressions in existing tests

## Affected Files

- `packages/desktop/src/main/services/SidebarOverlayService.ts`

## Notes

- The B011 fix already removed the duplicate wrapper boxShadow from App.tsx. This fix
  addresses the separate problem of WebContentsView clipping the overlay's CSS shadow.
- The shadow margin only needs to accommodate the largest shadow offset+blur+spread:
  `4px offset + 30px blur + 5px spread = 39px`. Using 40px provides a 1px safety margin.
- The `x` coordinate for the hidden/off-screen state should be `-(config.width + shadowMargin)`
  to fully hide the shadow when collapsed.
