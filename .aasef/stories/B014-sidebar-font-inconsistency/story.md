# B014: Sidebar Font Style Inconsistency Across Contexts

## Description

The font rendering for item/folder names in the tree view differs between the Browser
Floating Sidebar (overlay) and the Spaces/Workspace Sidebars + Space Cards. The user
wants the Browser Floating Sidebar's font style applied everywhere.

## Root Cause Analysis

### Evidence

Both the main app and sidebar overlay use the same `<Sidebar>` component from
`@spayce/react-ui`, which renders the same `<TreeView>` component (FeatureFlags.USE_ARBORIST_TREE
is `false`). Both use `TreeView.module.css` for tree item styling. The font inconsistency
comes from **two differences at the HTML level**:

#### 1. Font-Family Fallback Stack Differs

**sidebar.html** (overlay — line 30):
```css
body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
```

**index.html** (main app — line 15):
```css
body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; }
```

The overlay includes `'Segoe UI', Roboto` in the fallback chain while the main app does not.

#### 2. Font Smoothing Differs

**sidebar.html** (overlay — lines 32-33):
```css
body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
```

**index.html** (main app): NO font-smoothing properties.

The `antialiased` rendering produces visually thinner, crisper text on macOS (subpixel
antialiasing is disabled), while the default uses subpixel rendering which appears heavier.

#### 3. SpaceCard Uses Different Font Size/Weight

**SpaceCard.module.css** (`.itemName` — line 146):
```css
.itemName { font-size: 12px; font-weight: 400; }
```

**TreeView.module.css** (`.itemText` — line 58):
```css
.itemText { font-size: 14px; /* no font-weight, defaults to 400 */ }
```

Space Cards use 12px / 400 weight. This is intentional for the card context (smaller space)
and should NOT be changed.

### Font Style Comparison Table

| Property | Overlay (sidebar.html) | Main App (index.html) | SpaceCard (.itemName) |
|----------|----------------------|--------------------|--------------------|
| font-family fallbacks | Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif | Inter, -apple-system, BlinkMacSystemFont, sans-serif | (inherits from index.html) |
| -webkit-font-smoothing | antialiased | (not set — defaults to auto/subpixel) | (inherits from index.html) |
| -moz-osx-font-smoothing | grayscale | (not set) | (inherits from index.html) |
| font-size (.itemText) | 14px | 14px | 12px |
| font-weight (.itemText) | 400 (inherited) | 400 (inherited) | 400 |

## Fix

Apply the overlay's font-family and font-smoothing to the main app's `index.html`.
This makes all sidebars (Spaces/Workspace floating+fixed, Browser overlay) render identically.

**File: `packages/desktop/src/renderer/index.html` (line 15)**
- Before: `font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;`
- After: `font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`
- Add: `-webkit-font-smoothing: antialiased;`
- Add: `-moz-osx-font-smoothing: grayscale;`

No changes to SpaceCard font-size (12px is intentional for compact card layout).
No changes to TreeView.module.css (already consistent at 14px across both contexts).

## Acceptance Criteria

- [ ] index.html body font-family matches sidebar.html body font-family
- [ ] index.html body has -webkit-font-smoothing: antialiased
- [ ] index.html body has -moz-osx-font-smoothing: grayscale
- [ ] SpaceCard font-size remains 12px (intentionally different for card context)
- [ ] No regressions in existing tests

## Affected Files

- `packages/desktop/src/renderer/index.html`

## Notes

- Space Card tree items intentionally use 12px font (compact card layout) — this is NOT
  a bug and should not be changed.
- The fix only touches the HTML-level body styles, not any CSS modules.
