# Implementation Plan: 002-navigation-shell

## Step 1: Create Layout Components
1. Create `Sidebar.tsx` - 320px fixed width container
2. Create `BottomTabBar.tsx` - 60px tab bar with nav items
3. Create `MainLayout.tsx` - Compose sidebar + content area

## Step 2: Implement Bottom Tab Bar Items
1. Create `SpaceIcon.tsx` - 32px circular with accent color
2. Create `NavDot.tsx` - 4px dot with hover animation
3. Create `AddButton.tsx` - 40px circular primary button
4. Create `UserProfileSection.tsx` - Avatar + name + email

## Step 3: Tab State Management
1. Create `useNavigationStore.ts` (Zustand) with SidebarTab enum
2. Implement tab switching logic
3. Add 250ms slide transition animation

## Step 4: Keyboard Navigation System
1. Create `useKeyboardFocus.ts` hook
2. Implement KeyboardFocusContext provider
3. Add arrow key handlers for spacesScreen
4. Add Enter/Escape key handlers

## Step 5: Floating Sidebar Mode
1. Create `useFloatingSidebar.ts` hook
2. Implement mouse position detection (< 10px from left)
3. Add drag detection for sidebar trigger
4. Handle context menu and pins grid open state

## TDD Approach
- Test keyboard navigation with simulated key events
- Test sidebar dimensions and visibility states
- Test tab bar hover animations
