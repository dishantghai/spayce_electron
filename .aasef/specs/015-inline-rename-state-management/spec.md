# Spec 015: Inline Rename State Management

## Overview
Implement inline rename state management, integrated with SPEC-012's InlineInputStore for context-separated rename tracking.

## Requirements

### R1: Rename State Integration
- Leverage SPEC-012's InlineInputStore for rename state
- Track active rename item ID for sidebar
- Track active rename item ID for space cards
- Clear rename state on submit/cancel
- Prevent multiple simultaneous renames

### R2: Rename State Interface (from SPEC-012)
```typescript
interface InlineInputStore {
  // ... other properties from SPEC-012
  
  // Rename state
  sidebarRenameItemId: string | null;
  setSidebarRenameItemId: (id: string | null) => void;
  
  cardRenameItemId: string | null;
  setCardRenameItemId: (id: string | null) => void;
}
```

### R3: Context Separation
- Sidebar rename should not affect space card rename
- Each context maintains independent rename state
- Switching spaces should preserve appropriate rename states
- Only one item can be in rename mode per context

### R4: Rename Lifecycle
- setSidebarRenameItemId(itemId) - Activate rename mode
- setSidebarRenameItemId(null) - Cancel/complete rename
- setCardRenameItemId(itemId) - Activate rename in card
- setCardRenameItemId(null) - Cancel/complete rename in card

## Acceptance Criteria
- [ ] Rename state integrated into InlineInputStore (SPEC-012)
- [ ] sidebarRenameItemId state working
- [ ] cardRenameItemId state working
- [ ] setSidebarRenameItemId sets/clears state correctly
- [ ] setCardRenameItemId sets/clears state correctly
- [ ] Only one item can be renamed per context at a time
- [ ] Rename state is context-separated (sidebar vs card)
- [ ] Unit tests for rename state methods
- [ ] Integration with SPEC-012 verified

## Dependencies
- SPEC-012: Inline Input State Management (combined store)

## Estimated Duration
1 hour

## Reference Files

### Flutter Source
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:144-145` - Rename provider (sidebar)
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:38-39` - Rename provider (card)

### Electron Target
- `packages/react-ui/src/stores/inlineInputStore.ts` - Already includes rename state (SPEC-012)

## Implementation Notes
- This spec is a logical separation of rename functionality
- Actual implementation is part of SPEC-012's InlineInputStore
- No new files needed - just validation that SPEC-012 includes rename state
- Tests should verify rename state works independently per context
- Consider auto-clearing rename when switching spaces
