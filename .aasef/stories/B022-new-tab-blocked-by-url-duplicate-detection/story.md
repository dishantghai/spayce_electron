# B022: New Tab Button Blocked by URL Duplicate Detection

## Description
Clicking the "+" button in the browser tab bar does NOT create a new tab when a tab with
the same default URL (`https://www.google.com`) already exists. The user sees no change -
no new tab, no error.

## Root Cause

The tab creation flow chains through multiple layers:
1. "+" click → `handleNewTab()` → `createTab()` with no args
2. IPC `tabs:create(undefined)` → handler calls `tabsFacade.createTab({})`
3. `CreateTabValidator` fills defaults → `{ url: 'https://www.google.com', activate: true }`
4. `TabsFacade.createTab` line 152-166: **URL duplicate detection** calls `getByUrl(url)`,
   finds the existing google.com tab, and returns it instead of creating a new one
5. B021's dedup in `tabStore.createTab()` detects the returned ID already exists in the store
   → activates it in place → **no new tab appears**

The URL duplicate detection in TabsFacade is designed for sidebar-initiated navigation
(preventing duplicate tabs when clicking the same space item link twice). But it fires
for ALL `createTab` calls with a URL - including "New Tab" which uses the default URL.

## Fix

Guard the secondary URL duplicate detection in `TabsFacade.createTab` to only run when
there's origin tracking (i.e., `originSpaceId` or `originSpaceItemId` is set). Plain
"new tab" requests (no origin) should always create a fresh tab.

```typescript
// SECONDARY: Check for duplicate by URL
// Only when there's origin tracking (sidebar/space-initiated navigation).
// Plain "new tab" requests should always create a fresh tab.
if (validatedInput.url && (validatedInput.originSpaceId || validatedInput.originSpaceItemId)) {
```

## Acceptance Criteria
- [ ] Clicking "+" creates a new tab even when a google.com tab already exists
- [ ] Creating tabs from space items still deduplicates by URL (sidebar behavior preserved)
- [ ] Primary duplicate detection by SpaceItemId unchanged
- [ ] All existing tests pass
- [ ] New tests cover both scenarios (new tab vs space-initiated tab)

## Context
- **Related Bugs**: B021 (exposed this issue by correctly deduplicating)
- **Related Specs**: 018, 019
- **Affected Files**:
  - `packages/core/src/application/facades/TabsFacade.ts`
