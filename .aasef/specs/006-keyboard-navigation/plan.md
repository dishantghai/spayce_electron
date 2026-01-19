# Implementation Plan: 006-keyboard-navigation

## Step 1: Focus Context State
1. Add focusContext state in App.tsx
2. Define type: 'sidebar' | 'spacesScreen'
3. Initialize to 'sidebar' (Rule 0)

## Step 2: Independent Active Space
1. Add sidebarActiveSpaceIndex state
2. Add spacesScreenActiveSpaceIndex state
3. Pass appropriate index to each component

## Step 3: Focus Change Handlers
1. Add onFocusChange prop to Sidebar
2. Add onFocusChange prop to SpacesScreen
3. Call handlers on click events within components
4. Update focusContext in App.tsx

## Step 4: Sidebar Rules
1. Implement Rule 1: Click in sidebar → sidebar focus
2. Implement Rule 3: Floating sidebar opens → sidebar focus
3. Implement Rule 4: Floating sidebar closes → spaces focus (if spaces tab)

## Step 5: hasFocus Prop
1. Add hasFocus prop to Sidebar
2. Add hasFocus prop to SpacesScreen
3. Pass focusContext === 'sidebar' to Sidebar
4. Pass focusContext === 'spacesScreen' to SpacesScreen

## Step 6: Future - Provider Extraction
1. (Planned) Create KeyboardNavigationProvider context
2. (Planned) Move focus state to context
3. (Planned) Add keyboard event handlers for arrow navigation

## Completed
Core focus context management implemented in App.tsx. KeyboardNavigationProvider created as placeholder for future keyboard event handling.
