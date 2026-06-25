# Accessibility Review: Spec 019 - Single Tab Browser MVP

## Overview

This document outlines accessibility requirements and implementation guidelines for the browser UI components.

---

## WCAG 2.1 Compliance Targets

| Level | Status | Notes |
|-------|--------|-------|
| Level A | Required | Basic accessibility |
| Level AA | Required | Industry standard |
| Level AAA | Nice to have | Enhanced accessibility |

---

## Component Accessibility Requirements

### BrowserLoadingBar

#### ARIA Attributes
```tsx
<div
  role="progressbar"
  aria-valuenow={Math.round(progress * 100)}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Page loading progress"
  aria-busy={isLoading}
/>
```

#### Requirements
- [ ] `role="progressbar"` applied
- [ ] `aria-valuenow` reflects current progress
- [ ] `aria-valuemin` and `aria-valuemax` defined
- [ ] `aria-label` provides context
- [ ] Indeterminate state uses `aria-busy="true"`
- [ ] Color contrast meets 4.5:1 ratio

### BrowserErrorOverlay

#### ARIA Attributes
```tsx
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  <h2 id="error-title">...</h2>
  <p aria-describedby="error-title">...</p>
  <button aria-label="Retry loading the page">Try again</button>
  <button aria-label="Navigate to Google homepage">Go to Google</button>
</div>
```

#### Requirements
- [ ] `role="alert"` for error announcement
- [ ] `aria-live="assertive"` for immediate announcement
- [ ] Heading hierarchy maintained (h2 for title)
- [ ] Buttons have descriptive labels
- [ ] Focus trapped within overlay
- [ ] Escape key closes overlay (if applicable)
- [ ] Color contrast meets 4.5:1 ratio

### BrowserArea

#### Requirements
- [ ] Semantic HTML structure
- [ ] Focus management when view changes
- [ ] Keyboard navigation support
- [ ] Screen reader announcements for state changes

---

## Keyboard Navigation

### Required Keyboard Shortcuts (Future Specs)

| Action | Shortcut | Notes |
|--------|----------|-------|
| Go back | Cmd+[ | Standard browser |
| Go forward | Cmd+] | Standard browser |
| Reload | Cmd+R | Standard browser |
| Stop | Cmd+. | Standard browser |
| Focus address bar | Cmd+L | Spec 021 |
| New tab | Cmd+T | Spec 020 |
| Close tab | Cmd+W | Spec 020 |

### Focus Management

```typescript
// Announce state changes to screen readers
function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcer = document.getElementById('sr-announcer');
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
  }
}

// Usage
announceToScreenReader('Page loaded: Example Website');
announceToScreenReader('Error: Page failed to load', 'assertive');
```

---

## Color Contrast Requirements

### Design Token Compliance

| Element | Foreground | Background | Ratio | Status |
|---------|------------|------------|-------|--------|
| Primary text | #FFFFFF | #0F0B1A | 15.5:1 | ✅ |
| Secondary text | #9CA3AF | #0F0B1A | 5.8:1 | ✅ |
| Error text | #FFFFFF | #0F0B1A | 15.5:1 | ✅ |
| Loading bar | #6D5AE6 | transparent | N/A | ✅ |
| Button primary | #FFFFFF | #6D5AE6 | 4.7:1 | ✅ |
| Button secondary | #9CA3AF | #1A1425 | 4.5:1 | ✅ |

---

## Screen Reader Testing

### Test Scenarios

1. **Page Load Start**
   - Announces: "Loading [URL]"
   
2. **Page Load Complete**
   - Announces: "Page loaded: [Title]"
   
3. **Page Load Error**
   - Announces: "Error loading page: [Message]"
   
4. **Navigation**
   - Announces: "Navigating to [URL]"

### Testing Tools

- VoiceOver (macOS)
- NVDA (Windows - future)
- axe-core for automated testing

---

## Reduced Motion Support

```css
/* Respect user's reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .progress {
    animation: none;
    transition: none;
  }
  
  .spinner {
    animation: none;
  }
  
  .indeterminate {
    animation: none;
    width: 100% !important;
    opacity: 0.5;
  }
}
```

---

## High Contrast Mode

```css
/* Support Windows High Contrast Mode */
@media (forced-colors: active) {
  .loadingBar {
    border: 1px solid CanvasText;
  }
  
  .progress {
    background-color: Highlight;
  }
  
  .primaryButton {
    border: 2px solid ButtonText;
  }
  
  .secondaryButton {
    border: 2px solid ButtonText;
  }
}
```

---

## Implementation Checklist

### BrowserLoadingBar
- [ ] ARIA progressbar role
- [ ] Progress value announced
- [ ] Reduced motion support
- [ ] High contrast support

### BrowserErrorOverlay
- [ ] ARIA alert role
- [ ] Focus trap implemented
- [ ] Keyboard navigation
- [ ] Screen reader announcements
- [ ] High contrast support

### BrowserArea
- [ ] Screen reader live region
- [ ] Focus management
- [ ] State announcements
- [ ] Keyboard shortcuts (future)

---

## Testing Commands

```bash
# Run accessibility tests
pnpm test:a11y

# Run with specific config
pnpm test -- --config=vitest.a11y.config.ts
```

### axe-core Integration

```typescript
// packages/react-ui/__tests__/a11y/browser-components.a11y.test.tsx

import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { BrowserLoadingBar, BrowserErrorOverlay } from '../../src/components/browser';

expect.extend(toHaveNoViolations);

describe('Browser Components Accessibility', () => {
  it('BrowserLoadingBar has no accessibility violations', async () => {
    const { container } = render(<BrowserLoadingBar progress={0.5} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('BrowserErrorOverlay has no accessibility violations', async () => {
    const { container } = render(
      <BrowserErrorOverlay
        errorCode={-105}
        errorDescription="Server not found"
        url="https://example.com"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```
