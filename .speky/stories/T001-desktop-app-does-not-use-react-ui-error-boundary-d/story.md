# Desktop app does not use react-ui error boundary, data hooks and skeletons

## Why
Spec 010 built `GlobalErrorBoundary`, `ErrorFallback`, `InvalidationProvider`, the `useSpaces` /
mutation hooks and `SpaceListSkeleton` in `@spayce/react-ui`, but the desktop renderer
(`renderer/index.tsx`, `App.tsx`) uses none of them. It has its own `useSpacesData` hook and inline
spinner and error views, and no error boundary, so any render error leaves a blank window. Found while
checking spec 010 during the SPEKY v3 migration.

## Capabilities
- A render error in the app shows a recoverable fallback instead of a blank window.
- There is one data-hook path for spaces, not two.

## Non-goals
- No visual redesign of the loading or error states.
- Not splitting the 2,500-line `App.tsx` beyond what adopting the hooks needs.

## Design
<!-- Which design this implements, so nobody guesses during implementation:
     - Screens: IDs from the screen catalogue (screen:<id>) or design files in the repo, per state
       (default, empty, error, loading).
     - Design system: `.speky/design/system.md`
     Look for an existing design first (`speky design status`, the screen catalogue). If there is none,
     write "To be designed" and `speky next` runs the design step. If nothing visual changes, write
     "No new design needed: <why>". -->
No new design needed: uses the `ErrorFallback` and `SpaceListSkeleton` components already built in `@spayce/react-ui` (spec 010), with design-system tokens.

## Requirements

### R1: Global error boundary
The desktop renderer SHALL wrap `App` in `GlobalErrorBoundary`, so an uncaught render error shows
`ErrorFallback` with a way to reload.

#### Scenario: render error
- GIVEN a component throws during render
- WHEN the app renders
- THEN the fallback UI is shown instead of a blank window

### R2: Single spaces data path
The desktop app SHALL either adopt the react-ui spaces hooks (inside `InvalidationProvider`) or remove
the unused duplicates, leaving one documented path for loading and mutating spaces.

#### Scenario: one hook
- GIVEN the codebase after this change
- WHEN a developer looks for how spaces are loaded
- THEN exactly one hook is used by the app and the unused one is gone

## Assumptions
- Whether to adopt or delete the react-ui hooks is a design decision to settle when planning.
