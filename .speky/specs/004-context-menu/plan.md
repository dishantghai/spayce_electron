# Implementation Plan: 004-context-menu

## Step 1: Component Structure
1. Create `ContextMenu.tsx` with position props
2. Create `ContextMenu.module.css` for styling
3. Define ContextMenuItem interface

## Step 2: Menu Rendering
1. Render menu at absolute position (x, y)
2. Map items to menu rows
3. Render icons with Lucide components
4. Handle divider items

## Step 3: Styling
1. Apply design tokens (colors, radius, shadow)
2. Add hover state styling
3. Add destructive action styling (error color)
4. Add disabled state styling

## Step 4: Interaction
1. Add click handler for menu items
2. Add outside click detection to close
3. Add Escape key handler to close
4. Call onItemClick with item id

## Step 5: Integration
1. Export from @spayce/shared
2. Integrate with TreeItem context menu
3. Integrate with SpaceCard context menu
4. Generate menu items based on item type

## Completed
All steps completed. ContextMenu works with TreeView and SpaceCard components.
