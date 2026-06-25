# Implementation Plan

## Approach
Create a Zustand store to manage inline input state for both sidebar and space card contexts separately, with support for folder/link creation types and rename operations. The store will be simple and synchronous, providing clear separation between sidebar and card contexts while maintaining type safety.

## Tasks

- [ ] **Create inline input types and interfaces** (estimate: 1h)
  - Define InlineInputType, InlineInputState, and InlineInputStore interfaces
  - Add types to `packages/react-ui/src/types/index.ts`
  - Ensure type safety with proper TypeScript definitions
  - **AC**: Types compile without errors and provide proper intellisense

- [ ] **Implement InlineInputStore with Zustand** (estimate: 2h)
  - Create `packages/react-ui/src/stores/inlineInputStore.ts`
  - Implement all store methods (setSidebarInput, setCardInput, clear methods, rename state)
  - Handle null states properly for "no active input"
  - **AC**: All store methods work correctly and maintain separate state contexts
  - **Dependencies**: Types from previous task

- [ ] **Add auto-clear functionality for space switching** (estimate: 1h)
  - Implement logic to clear both inline input and rename state when switching spaces
  - Ensure state doesn't leak between different spaces
  - **AC**: Switching spaces clears all inline input and rename states
  - **Dependencies**: Core store implementation

- [ ] **Write unit tests for store** (estimate: 2h)
  - Test all store methods with Vitest
  - Verify state isolation between sidebar and card contexts
  - Test auto-clear functionality and edge cases
  - **AC**: 100% test coverage for store methods, all tests pass
  - **Dependencies**: Complete store implementation

## Architecture Decisions Needed
- **Auto-clear trigger mechanism**: How will the store detect space switching to auto-clear state? (via useEffect in components or store subscription to space changes)

## Testing Approach
Unit tests for the Zustand store using Vitest, focusing on state mutations, context separation, and auto-clear behavior. Mock any space switching dependencies to test the clearing logic in isolation.

## Risks & Mitigations
- **State synchronization complexity**: Multiple contexts could lead to race conditions
  - *Mitigation*: Keep state completely separate and avoid cross-context dependencies
- **Auto-clear implementation complexity**: Detecting space changes might require coupling to other stores
  - *Mitigation*: Start with manual clearing and add auto-clear as enhancement if time permits