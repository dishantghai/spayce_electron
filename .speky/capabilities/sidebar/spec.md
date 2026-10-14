# sidebar

Seeded from completed items 002, 020, B005, B008, B009, B010, B011, B012, B014, B015, B017, B025
during the SPEKY v3 migration (2026-10-14). Describes the code as it is today.

## Purpose

The sidebar holds the space switcher, pinned links, the tree and the Spaces / Browser / Workspace /
Settings tabs. It is either fixed (part of the layout) or floating (slides in from the left edge). On
the Browser tab in floating mode it is a separate WebContentsView (`sidebar.html`) layered above the
web page, so native browser content can't cover it.

<!-- speky:next-id 8 -->
## Requirements

### sidebar-R1: Fixed and floating modes
The mode is persisted (default `fixed`). Going from fixed to floating collapses the sidebar; going from
floating to fixed shows it. CSS transitions are suppressed during the switch.

#### Scenario: unpin
- WHEN the user switches a visible fixed sidebar to floating
- THEN the sidebar collapses

### sidebar-R2: Show, hide and auto-show
Cmd/Ctrl+B toggles the sidebar. In floating mode, moving the pointer into the 10 px left-edge zone
shows it, and leaving it hides it. In React mode this uses a hover strip. In overlay mode the main
process polls the cursor every 100 ms.

#### Scenario: edge hover
- WHEN the sidebar is floating and hidden and the pointer reaches the left 10 px
- THEN the sidebar slides in

### sidebar-R3: Overlay mode on the Browser tab
When floating and on the Browser tab, the React sidebar is hidden and a 320 px overlay
WebContentsView (plus a 40 px shadow margin) is shown above the browser view instead. It slides in and
out over 250 ms with ease-out cubic easing. Switching tabs into or out of overlay mode shows or hides
it instantly, without animation. The overlay is re-raised above the browser view after every tab
create, switch or close.

#### Scenario: switch tab into browser
- WHEN the sidebar is floating and visible and the user switches to the Browser tab
- THEN the overlay appears instantly with no slide animation

### sidebar-R4: Overlay state sync
The main renderer is the source of truth. It pushes spaces, active space, selection, expanded IDs,
mode and tab to the overlay (`sidebar-overlay:sync-state`) whenever they change, and again when the
overlay asks for it after loading. The overlay sends user actions back as `sidebar-overlay:action`
messages.

#### Scenario: late-loaded overlay
- WHEN the overlay finishes loading after the first sync was sent
- THEN it requests a sync and shows the current state

### sidebar-R5: Fresh start and wake from sleep
On a cold start (navigation type `navigate`) in floating mode the sidebar starts collapsed, and
auto-show is suppressed for 1.5 s. A reload keeps the persisted visibility. On system resume the
overlay is hidden, bounds are re-validated, and auto-show is suppressed for 2 s.

#### Scenario: wake from sleep
- WHEN the machine wakes while the floating overlay was visible
- THEN the sidebar is collapsed and does not pop open under a resting pointer

### sidebar-R6: Bounds are never degenerate
Overlay heights below 100 px fall back to the window height, or 800 px if that is invalid too, so
after reload or wake the overlay is never drawn as a narrow strip.

#### Scenario: zero height at startup
- WHEN the window reports height 0 while the overlay is created
- THEN the overlay uses an 800 px height

### sidebar-R7: Drag regions don't steal overlay clicks
While the overlay is visible, the browser chrome's window-drag regions are disabled so clicks reach
the overlay.

#### Scenario: click over toolbar area
- WHEN the overlay is visible over the browser toolbar and the user clicks an overlay item
- THEN the overlay receives the click
