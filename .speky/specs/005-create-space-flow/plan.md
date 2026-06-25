# Implementation Plan: 005-create-space-flow

## Step 1: Component Structure
1. Create `CreateSpaceView.tsx`
2. Create `CreateSpaceView.module.css`
3. Define icon set constant (24 icons)
4. Import SpaceThemes for color palette

## Step 2: Header Section
1. Add back button with ChevronLeft icon
2. Add title ("New Space" or "Edit Space")
3. Style with proper spacing

## Step 3: Name Input
1. Add text input for space name
2. Add validation (non-empty)
3. Style with design tokens

## Step 4: Icon Picker
1. Create icon grid layout (6 columns)
2. Map icon names to Lucide components
3. Add selection state with visual feedback
4. Handle icon selection click

## Step 5: Color Picker
1. Create color grid layout (6 columns)
2. Map SpaceThemes to color swatches
3. Add selection state with border/check
4. Handle color selection click

## Step 6: Form Actions
1. Add Create/Save button
2. Implement form submission
3. Call onCreateSpace/onUpdateSpace callback
4. Handle cancel/back action

## Step 7: Modal Variant
1. Create `CreateSpaceModal.tsx` for overlay usage
2. Add backdrop and centered modal
3. Same form content as inline view

## Completed
All steps completed. CreateSpaceView works in both inline sidebar and modal modes.
