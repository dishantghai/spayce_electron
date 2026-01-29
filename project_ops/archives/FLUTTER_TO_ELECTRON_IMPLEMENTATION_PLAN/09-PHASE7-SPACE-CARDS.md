# Phase 7: Space Cards Features

**Priority:** P1 - High  
**Dependencies:** Phase 1-6  
**Total Estimated Effort:** 30 hours

This phase implements all features for Space Cards in the Spaces Screen, including bidirectional drag/drop, keyboard shortcuts, context menus, and space reordering.

---

## F026: Inline Creation in Space Cards

**Priority:** P1 - High  
**Dependencies:** F001, F002  
**Estimated Effort:** 4 hours  
**User Value:** Users can create items directly in space cards

### User Story

> As a user, I want to create folders and links inline within space cards on the Spaces screen, just like in the sidebar.

### Acceptance Criteria

- [ ] Space card header has "+" buttons for folder and link
- [ ] Click triggers inline input at card's tree root
- [ ] Folder hover shows add subfolder/link buttons
- [ ] Same keyboard handling (Enter, Escape) as sidebar
- [ ] Uses separate state from sidebar (cardInlineInput)

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Card Header Actions | `space_card_hifi_v2.dart` | 150-180 |
| CardInlineInputState | `space_card_hifi_v2.dart` | 42-58 |
| Card Inline Input Row | `space_card_hifi_v2.dart` | 620-720 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart`

### Flutter Code Reference

```dart
// CardInlineInputState (space_card_hifi_v2.dart:42-58)
class CardInlineInputState {
  final String spaceId;
  final String? parentId;
  final InlineInputType type;

  const CardInlineInputState({
    required this.spaceId,
    required this.type,
    this.parentId,
  });
}

final cardInlineInputProvider = StateProvider<CardInlineInputState?>((ref) => null);

// Card header buttons (space_card_hifi_v2.dart:150-180)
Row(
  children: [
    IconButton(
      icon: Icon(LucideIcons.folderPlus),
      onPressed: () {
        ref.read(cardInlineInputProvider.notifier).state = CardInlineInputState(
          spaceId: widget.space.id,
          type: InlineInputType.folder,
          parentId: null,
        );
      },
    ),
    IconButton(
      icon: Icon(LucideIcons.link),
      onPressed: () {
        ref.read(cardInlineInputProvider.notifier).state = CardInlineInputState(
          spaceId: widget.space.id,
          type: InlineInputType.link,
          parentId: null,
        );
      },
    ),
  ],
)
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/spaces/SpaceCard.tsx
packages/react-ui/src/stores/inlineInputStore.ts
```

### Implementation Steps

1. **Verify inlineInputStore Has Card State** (from SPEC-012)
   - `cardInput: InlineInputState | null`
   - `setCardInput`, `clearCardInput`

2. **Update SpaceCard Header**
   ```typescript
   // In SpaceCard
   const { setCardInput } = useInlineInputStore();
   
   const handleAddFolder = () => {
     setCardInput({
       spaceId: space.id,
       parentId: null,
       type: 'folder',
     });
   };
   
   const handleAddLink = () => {
     setCardInput({
       spaceId: space.id,
       parentId: null,
       type: 'link',
     });
   };
   
   // In header
   <button onClick={handleAddFolder}>
     <FolderPlus size={16} />
   </button>
   <button onClick={handleAddLink}>
     <Link size={16} />
   </button>
   ```

3. **Render Inline Input in Card's Tree**
   ```typescript
   const { cardInput, clearCardInput } = useInlineInputStore();
   
   // In card tree
   {cardInput?.spaceId === space.id && cardInput?.parentId === null && (
     <InlineInput
       type={cardInput.type}
       spaceId={space.id}
       parentId={null}
       onSubmit={handleInlineSubmit}
       onCancel={clearCardInput}
     />
   )}
   ```

4. **Add Folder Hover Actions in Card Tree Items**
   
   **Flutter Reference:**
   
   | Feature | Flutter File | Lines |
   |---------|--------------|-------|
   | Card Folder Hover Actions | `space_card_hifi_v2.dart` | 340-370 |
   
   **Flutter Code:**
   ```dart
   // Card folder hover actions (space_card_hifi_v2.dart:340-370)
   // Similar to sidebar but uses cardInlineInputProvider
   if (_isHovered && !isRenaming && isFolder)
     Row(
       children: [
         IconButton(
           icon: Icon(LucideIcons.folderPlus, size: 14),
           onPressed: () {
             ref.read(cardInlineInputProvider.notifier).state = 
               CardInlineInputState(
                 spaceId: widget.spaceId,
                 parentId: widget.item.id,
                 type: InlineInputType.folder,
               );
           },
         ),
         IconButton(
           icon: Icon(LucideIcons.link, size: 14),
           onPressed: () {
             ref.read(cardInlineInputProvider.notifier).state = 
               CardInlineInputState(
                 spaceId: widget.spaceId,
                 parentId: widget.item.id,
                 type: InlineInputType.link,
               );
           },
         ),
       ],
     )
   ```
   
   **Electron Implementation:**
   
   Update `SpaceCard.tsx` to include hover actions for folder items:
   
   ```typescript
   // In SpaceCardTreeItem component
   const [isHovered, setIsHovered] = useState(false);
   const { cardRenameItemId, setCardInput } = useInlineInputStore();
   
   const isFolder = item.type === 'folder' || item.type === 'localFolder';
   const isRenaming = cardRenameItemId === item.id;
   
   const handleAddSubfolder = (e: React.MouseEvent) => {
     e.stopPropagation();
     setCardInput({
       spaceId: spaceId,
       parentId: item.id,
       type: 'folder',
     });
   };
   
   const handleAddLink = (e: React.MouseEvent) => {
     e.stopPropagation();
     setCardInput({
       spaceId: spaceId,
       parentId: item.id,
       type: 'link',
     });
   };
   
   return (
     <div 
       className={styles.treeItem}
       onMouseEnter={() => setIsHovered(true)}
       onMouseLeave={() => setIsHovered(false)}
     >
       {/* Item content */}
       <div className={styles.itemContent}>
         {/* Icon, name, etc. */}
       </div>
       
       {/* Hover actions - only for folders, not during rename */}
       {isHovered && !isRenaming && isFolder && (
         <div className={styles.hoverActions}>
           <button
             className={styles.actionButton}
             onClick={handleAddSubfolder}
             title="Add subfolder"
           >
             <FolderPlus size={14} />
           </button>
           <button
             className={styles.actionButton}
             onClick={handleAddLink}
             title="Add link"
           >
             <Link size={14} />
           </button>
           <button
             className={styles.actionButton}
             onClick={(e) => {
               e.stopPropagation();
               onContextMenu(item, e);
             }}
             title="More options"
           >
             <MoreVertical size={14} />
           </button>
         </div>
       )}
     </div>
   );
   ```
   
   **CSS (in SpaceCard.module.css):**
   ```css
   .hoverActions {
     display: flex;
     gap: 2px;
     opacity: 0;
     transition: opacity 150ms ease;
   }
   
   .treeItem:hover .hoverActions {
     opacity: 1;
   }
   
   .actionButton {
     padding: 4px;
     background: transparent;
     border: none;
     border-radius: 4px;
     color: var(--text-secondary);
     cursor: pointer;
     display: flex;
     align-items: center;
     justify-content: center;
   }
   
   .actionButton:hover {
     background: var(--hover-bg);
     color: var(--text-primary);
   }
   ```

### Manual Testing Checklist

- [ ] Click folder+ in card header → inline input appears
- [ ] Click link+ in card header → inline input with auto-paste
- [ ] Create folder in card → appears in card tree
- [ ] Hover folder in card → shows 3 action buttons (folder+, link, more)
- [ ] Hover link in card → shows 1 action button (more)
- [ ] Click folder+ hover icon → inline folder input inside that folder
- [ ] Click link hover icon → inline link input inside that folder
- [ ] Click more icon → context menu opens
- [ ] Hover actions fade in/out smoothly (150ms)
- [ ] No hover icons during rename mode
- [ ] Subfolder creation works in cards

---

## F027: Inline Rename in Space Cards

**Priority:** P1 - High  
**Dependencies:** F003  
**Estimated Effort:** 2 hours  
**User Value:** Users can rename items in space cards

### User Story

> As a user, I want to rename items in space cards inline, just like in the sidebar.

### Acceptance Criteria

- [ ] Context menu "Rename" in card → inline rename input
- [ ] Uses separate state from sidebar (cardRenameItemId)
- [ ] Same behavior as sidebar rename

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Card Rename Provider | `space_card_hifi_v2.dart` | 38-39 |
| Card Rename Trigger | `space_card_hifi_v2.dart` | 280-285 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart`

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/spaces/SpaceCard.tsx
packages/react-ui/src/stores/inlineInputStore.ts
```

### Implementation Steps

1. **Use Card Rename State**
   ```typescript
   const { cardRenameItemId, setCardRenameItemId } = useInlineInputStore();
   
   // In context menu handler
   case 'rename':
     setCardRenameItemId(item.id);
     break;
   
   // In card tree item
   const isRenaming = cardRenameItemId === item.id;
   
   if (isRenaming) {
     return (
       <InlineRenameInput
         item={item}
         spaceId={spaceId}
         onComplete={() => setCardRenameItemId(null)}
       />
     );
   }
   ```

### Manual Testing Checklist

- [ ] Right-click item in card → Rename → inline input
- [ ] Enter saves, Escape cancels
- [ ] Rename persists

---

## F028: Context Menus in Space Cards

**Priority:** P1 - High  
**Dependencies:** F005, F006  
**Estimated Effort:** 3 hours  
**User Value:** Full context menu support in space cards

### User Story

> As a user, I want the same context menu options in space cards as in the sidebar.

### Acceptance Criteria

- [ ] Right-click item in card → full context menu
- [ ] All actions work (create, rename, copy, paste, delete)
- [ ] Paste uses card's clipboard check

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Card Context Menu | `space_card_hifi_v2.dart` | 240-342 |
| Card Paste Handler | `space_card_hifi_v2.dart` | 470-565 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart`

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/spaces/SpaceCard.tsx
```

### Implementation Steps

1. **Reuse Context Menu Logic from Sidebar**
   - Same `getContextMenuItems` function
   - Same action handlers
   - Different inline input state (card vs sidebar)

2. **Wire Up Context Menu in Card**
   ```typescript
   const handleItemContextMenu = (item: SpaceItem, e: React.MouseEvent) => {
     e.preventDefault();
     setContextMenu({
       items: getContextMenuItems(item),
       position: { x: e.clientX, y: e.clientY },
       onAction: (actionId) => handleCardContextAction(actionId, item),
     });
   };
   
   const handleCardContextAction = (actionId: string, item: SpaceItem) => {
     switch (actionId) {
       case 'new_folder':
         setCardInput({ spaceId: space.id, parentId: item.id, type: 'folder' });
         break;
       case 'rename':
         setCardRenameItemId(item.id);
         break;
       // ... same as sidebar but using card state
     }
   };
   ```

### Manual Testing Checklist

- [ ] Right-click in card → menu appears
- [ ] All menu items work
- [ ] Actions use card state (not sidebar)

---

## F029: Drag Within Space Card

**Priority:** P1 - High  
**Dependencies:** F011, F013  
**Estimated Effort:** 3 hours  
**User Value:** Users can reorder items within a space card

### User Story

> As a user, I want to drag and drop items within a space card to reorder them.

### Acceptance Criteria

- [ ] Items in card tree are draggable
- [ ] Drop indicators show in card
- [ ] Same hit zone logic as sidebar (20%/60%/20% for folders)
- [ ] Reorder persists

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Card Tree with Drag | `space_card_hifi_v2.dart` | 400-450 |
| Uses Same DraggableTreeItem | `draggable_tree_item.dart` | Full file |

**Full Flutter Paths:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart`
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart`

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/spaces/SpaceCard.tsx
```

### Implementation Steps

1. **Reuse Drag Components in Card**
   ```typescript
   // SpaceCard tree uses same components
   <DraggableTreeItem
     item={item}
     spaceId={space.id}
     parentId={parentId}
     index={index}
     accentColor={space.accentColor}
     source="spaceCard"  // Different source
   >
     <DroppableTreeItem
       item={item}
       spaceId={space.id}
       onDrop={handleDrop}
     >
       {/* Card tree item content */}
     </DroppableTreeItem>
   </DraggableTreeItem>
   ```

2. **Update DragData Source**
   - Set `source: 'spaceCard'` in card drag operations
   - Helps distinguish origin for cross-card drops

### Manual Testing Checklist

- [ ] Drag item in card → preview appears
- [ ] Drop indicators show
- [ ] Reorder works
- [ ] Same hit zones as sidebar

---

## F030: Drag Across Space Cards

**Priority:** P1 - High  
**Dependencies:** F029  
**Estimated Effort:** 3 hours  
**User Value:** Users can move items between spaces via cards

### User Story

> As a user, I want to drag items from one space card to another to move them between spaces.

### Acceptance Criteria

- [ ] Drag from card A → drop in card B works
- [ ] Item moves to target space
- [ ] Can drop at specific position in target card
- [ ] Source card updates to show item removed

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| DroppableSpaceCard | `droppable_space_card.dart` | 1-74 |
| Cross-card Move | `space_card_hifi_v2.dart` | 380-395 |

**Full Flutter Paths:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/droppable_space_card.dart`
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart`

### Flutter Code Reference

```dart
// DroppableSpaceCard (droppable_space_card.dart:1-74)
class DroppableSpaceCard extends StatefulWidget {
  final Space space;
  final Widget child;
  final void Function(DragData data) onAcceptItem;
}

class _DroppableSpaceCardState extends State<DroppableSpaceCard> {
  bool _isHovering = false;

  Widget build(BuildContext context) {
    return DragTarget<DragData>(
      onWillAcceptWithDetails: (details) {
        // Accept if from different space
        return details.data.spaceId != widget.space.id;
      },
      onAcceptWithDetails: (details) {
        widget.onAcceptItem(details.data);
      },
      builder: (context, candidateData, rejectedData) {
        return AnimatedContainer(
          decoration: BoxDecoration(
            border: Border.all(
              color: _isHovering ? widget.space.accentColor : Colors.transparent,
              width: 2,
            ),
          ),
          child: widget.child,
        );
      },
    );
  }
}
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/components/drag-drop/DroppableSpaceCard.tsx
```

**Files to Update:**
```
packages/react-ui/src/components/spaces/SpaceCard.tsx
packages/react-ui/src/components/spaces/SpacesScreen.tsx
```

### Implementation Steps

1. **Create DroppableSpaceCard Wrapper**
   ```typescript
   interface DroppableSpaceCardProps {
     space: Space;
     onAcceptItem: (data: DragData) => void;
     children: React.ReactNode;
   }
   
   export function DroppableSpaceCard({ space, onAcceptItem, children }: DroppableSpaceCardProps) {
     const { dragData } = useDragDropUiStore();
     const [isHovering, setIsHovering] = useState(false);
     
     const canAccept = dragData && dragData.spaceId !== space.id;
     
     const handleDragOver = (e: React.DragEvent) => {
       if (!canAccept) return;
       e.preventDefault();
       setIsHovering(true);
     };
     
     const handleDragLeave = () => {
       setIsHovering(false);
     };
     
     const handleDrop = (e: React.DragEvent) => {
       e.preventDefault();
       setIsHovering(false);
       
       const data = JSON.parse(e.dataTransfer.getData('application/json')) as DragData;
       onAcceptItem(data);
     };
     
     return (
       <div
         className={cn(styles.spaceCard, isHovering && styles.dropTarget)}
         style={{
           borderColor: isHovering ? space.accentColor : 'transparent',
         }}
         onDragOver={handleDragOver}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}
       >
         {children}
       </div>
     );
   }
   ```

2. **Handle Cross-Card Move**
   ```typescript
   const handleAcceptItem = async (data: DragData) => {
     // Move items to this space's root
     for (const item of data.items) {
       await window.itemsApi.move(item.id, {
         newSpaceId: space.id,
         newParentId: null,
       });
     }
     
     // Invalidate both spaces
     invalidate(`space-items:${data.spaceId}`);
     invalidate(`space-items:${space.id}`);
   };
   ```

3. **Wrap SpaceCard in SpacesScreen**
   ```typescript
   // In SpacesScreen
   {spaces.map(space => (
     <DroppableSpaceCard
       key={space.id}
       space={space}
       onAcceptItem={(data) => handleCrossCardMove(data, space.id)}
     >
       <SpaceCard space={space} />
     </DroppableSpaceCard>
   ))}
   ```

### Manual Testing Checklist

- [ ] Drag from card A → hover card B → border highlights
- [ ] Drop → item moves to card B
- [ ] Card A updates (item removed)
- [ ] Card B updates (item added)
- [ ] Cannot drop to same card (no highlight)

---

## F032: Bidirectional Drag Between Sidebar and Space Cards

**Priority:** P1 - High  
**Dependencies:** F029, F030  
**Estimated Effort:** 4 hours  
**User Value:** Users can move items between sidebar and space cards

### User Story

> As a user, I want to drag items from the sidebar to space cards and from space cards to the sidebar, so I can move items between any visible space.

### Acceptance Criteria

- [ ] Drag item from sidebar → drop in different space card → moves to that space
- [ ] Drag item from space card → drop in sidebar of different space → moves to that space
- [ ] Cannot drop from sidebar to its own space card (same space)
- [ ] Cannot drop from space card to sidebar of same space
- [ ] Drop indicators show in both directions
- [ ] Works with multi-selection

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| DroppableSpaceCard accepts sidebar drag | `droppable_space_card.dart` | 20-35 |
| Sidebar DroppableTreeItem accepts card drag | `draggable_tree_item.dart` | 127-457 |

**Full Flutter Paths:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/droppable_space_card.dart`
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart`

### Flutter Code Reference

```dart
// DroppableSpaceCard accepts any source (droppable_space_card.dart:20-35)
onWillAcceptWithDetails: (details) {
  // Accept if from different space, regardless of source
  return details.data.spaceId != widget.space.id;
}
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/drag-drop/DroppableSpaceCard.tsx
packages/react-ui/src/components/drag-drop/DroppableTreeItem.tsx
packages/react-ui/src/stores/dragDropUiStore.ts
```

### Implementation Steps

1. **Update DragData Interface**
   ```typescript
   interface DragData {
     item: SpaceItem;
     items: SpaceItem[];
     spaceId: string;
     parentId: string | null;
     sourceIndex: number;
     source: 'sidebar' | 'spaceCard';  // Track origin
     ancestorIds: string[];
   }
   ```

2. **Update DroppableSpaceCard to Accept Sidebar Drag**
   ```typescript
   // Already implemented in F030, just verify it accepts any source
   const canAccept = dragData && 
     dragData.spaceId !== space.id; // Accept from sidebar or other cards
   ```

3. **Update Sidebar DroppableTreeItem to Accept Card Drag**
   ```typescript
   // In DroppableTreeItem
   const handleDragOver = (e: React.DragEvent) => {
     e.preventDefault();
     
     if (!dragData) return;
     
     // Accept drops from space cards to sidebar
     const isCrossSpaceDrop = dragData.spaceId !== spaceId;
     const position = calculateDropPosition(e);
     
     if (!isValidDrop(dragData, item, ancestorIds, index, position)) {
       e.dataTransfer.dropEffect = 'none';
       return;
     }
     
     e.dataTransfer.dropEffect = 'move';
     setDropIndicator({ targetId: item.id, position, spaceId });
   };
   ```

4. **Handle Cross-Source Drops**
   ```typescript
   const handleDrop = async (dragData: DragData, position: DropPosition) => {
     // Works same for sidebar→card or card→sidebar
     for (const item of dragData.items) {
       await window.itemsApi.move(item.id, {
         newSpaceId: targetSpaceId,
         newParentId: targetParentId,
         newIndex: targetIndex,
       });
     }
     
     // Invalidate both spaces
     invalidate(`space-items:${dragData.spaceId}`);
     invalidate(`space-items:${targetSpaceId}`);
   };
   ```

### Manual Testing Checklist

- [ ] Drag from sidebar → drop in different space card → item moves
- [ ] Drag from space card → drop in sidebar → item moves
- [ ] Cannot drag from sidebar to its own space card
- [ ] Cannot drag from space card to its own sidebar
- [ ] Drop indicators show correctly in both directions
- [ ] Multi-select drag works in both directions
- [ ] Both source and target update after drop

---

## F033: Keyboard Copy/Paste in Space Cards

**Priority:** P1 - High  
**Dependencies:** F007, F008, F009, F028  
**Estimated Effort:** 3 hours  
**User Value:** Users can use keyboard shortcuts in space cards

### User Story

> As a user, I want to use Cmd+C and Cmd+V keyboard shortcuts in space cards, just like in the sidebar.

### Acceptance Criteria

- [ ] Cmd+C on selected item in card → copies to clipboard
- [ ] Cmd+V in card tree → pastes from clipboard
- [ ] Works with multi-selection in cards
- [ ] System clipboard integration (URLs for links)
- [ ] Keyboard shortcuts work same as sidebar

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Card Keyboard Listener | `space_card_hifi_v2.dart` | 680-750 |
| Card Copy Handler | `space_card_hifi_v2.dart` | 720-735 |
| Card Paste Handler | `space_card_hifi_v2.dart` | 470-565 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart`

### Flutter Code Reference

```dart
// Card keyboard listener (space_card_hifi_v2.dart:680-750)
Focus(
  onKeyEvent: (node, event) {
    if (event is KeyDownEvent) {
      // Copy
      if (event.logicalKey == LogicalKeyboardKey.keyC && 
          HardwareKeyboard.instance.isMetaPressed) {
        _handleCopy();
        return KeyEventResult.handled;
      }
      
      // Paste
      if (event.logicalKey == LogicalKeyboardKey.keyV && 
          HardwareKeyboard.instance.isMetaPressed) {
        _handlePaste();
        return KeyEventResult.handled;
      }
    }
    return KeyEventResult.ignored;
  },
  child: widget.child,
)
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/spaces/SpaceCard.tsx
packages/desktop/src/renderer/App.tsx
```

### Implementation Steps

1. **Add Keyboard Event Listener to SpaceCard**
   ```typescript
   // In SpaceCard component
   const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
     const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
     const cmdKey = isMac ? e.metaKey : e.ctrlKey;
     
     // Copy: Cmd+C
     if (cmdKey && e.key === 'c') {
       const selectedItems = getSelectedItemsInCard(space.id);
       if (selectedItems.length > 0) {
         e.preventDefault();
         handleCopy(selectedItems, space.id);
       }
     }
     
     // Paste: Cmd+V
     if (cmdKey && e.key === 'v') {
       const focusedItem = getFocusedItemInCard(space.id);
       if (focusedItem) {
         e.preventDefault();
         handlePaste(focusedItem.id, space.id);
       }
     }
   }, [space.id, handleCopy, handlePaste]);
   
   return (
     <div 
       className={styles.spaceCard}
       tabIndex={0}
       onKeyDown={handleKeyDown}
     >
       {/* Card content */}
     </div>
   );
   ```

2. **Reuse Clipboard Functions**
   ```typescript
   // Same copy/paste logic as sidebar but for card context
   const handleCopy = (items: SpaceItem[], sourceSpaceId: string) => {
     clipboardStore.copy(items, sourceSpaceId);
     
     // If all links, copy URLs to system clipboard
     const allLinks = items.every(item => item.type === 'link');
     if (allLinks) {
       const urls = items.map(item => item.path).join('\n');
       navigator.clipboard.writeText(urls);
     }
   };
   
   const handlePaste = async (targetId: string, spaceId: string) => {
     const clipboard = clipboardStore.getClipboard();
     if (!clipboard) return;
     
     // Paste items under target
     for (const item of clipboard.items) {
       await pasteItem(item, targetId, spaceId);
     }
   };
   ```

3. **Track Focus in Space Cards**
   ```typescript
   // Need to track which item is focused in each card
   // for knowing where to paste
   const [focusedCardItems, setFocusedCardItems] = useState<Map<string, string>>();
   
   const handleItemClick = (item: SpaceItem, spaceId: string) => {
     setFocusedCardItems(prev => new Map(prev).set(spaceId, item.id));
   };
   ```

### Manual Testing Checklist

- [ ] Click item in card → Cmd+C → copies
- [ ] Click folder in card → Cmd+V → pastes inside
- [ ] Multi-select in card → Cmd+C → copies all
- [ ] Link copy → URLs in system clipboard
- [ ] Paste works at correct position
- [ ] Keyboard shortcuts don't interfere with sidebar

---

## F034: Root Context Menu in Space Cards

**Priority:** P1 - High  
**Dependencies:** F028  
**Estimated Effort:** 2 hours  
**User Value:** Users can create items from card's empty area

### User Story

> As a user, I want to right-click on the empty area of a space card to create new folders and links at the root level.

### Acceptance Criteria

- [ ] Right-click empty area in card → context menu appears
- [ ] Menu shows: "New Folder", "New Link", "Paste" (if available)
- [ ] Actions create items at root level of that space
- [ ] Same visual style as item context menus

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Card Background Context Menu | `space_card_hifi_v2.dart` | 780-820 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart`

### Flutter Code Reference

```dart
// Card background context menu (space_card_hifi_v2.dart:780-820)
GestureDetector(
  onSecondaryTapDown: (details) {
    showContextMenu(
      context: context,
      position: details.globalPosition,
      items: [
        ContextMenuItem(
          label: 'New Folder',
          icon: LucideIcons.folderPlus,
          onTap: () => _createRootFolder(),
        ),
        ContextMenuItem(
          label: 'New Link',
          icon: LucideIcons.link,
          onTap: () => _createRootLink(),
        ),
        if (_hasClipboard)
          ContextMenuItem(
            label: 'Paste',
            icon: LucideIcons.clipboard,
            onTap: () => _pasteAtRoot(),
          ),
      ],
    );
  },
  child: /* card tree area */,
)
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/spaces/SpaceCard.tsx
```

### Implementation Steps

1. **Add Context Menu Handler to Card Background**
   ```typescript
   const handleCardBackgroundContextMenu = (e: React.MouseEvent) => {
     // Only trigger if clicked on background, not on items
     if (e.target !== e.currentTarget) return;
     
     e.preventDefault();
     
     const hasClipboard = clipboardStore.hasClipboard();
     
     setContextMenu({
       items: [
         {
           id: 'new_folder',
           label: 'New Folder',
           icon: <FolderPlus size={16} />,
         },
         {
           id: 'new_link',
           label: 'New Link',
           icon: <Link size={16} />,
         },
         ...(hasClipboard ? [{
           id: 'paste',
           label: 'Paste',
           icon: <Clipboard size={16} />,
         }] : []),
       ],
       position: { x: e.clientX, y: e.clientY },
       onAction: (actionId) => handleRootContextAction(actionId),
     });
   };
   
   const handleRootContextAction = (actionId: string) => {
     switch (actionId) {
       case 'new_folder':
         setCardInput({ spaceId: space.id, parentId: null, type: 'folder' });
         break;
       case 'new_link':
         setCardInput({ spaceId: space.id, parentId: null, type: 'link' });
         break;
       case 'paste':
         handlePasteAtRoot(space.id);
         break;
     }
   };
   ```

2. **Apply to Card Tree Container**
   ```typescript
   <div 
     className={styles.cardTreeContainer}
     onContextMenu={handleCardBackgroundContextMenu}
   >
     {/* Tree items */}
   </div>
   ```

### Manual Testing Checklist

- [ ] Right-click empty area in card → menu appears
- [ ] "New Folder" → triggers inline input at root
- [ ] "New Link" → triggers inline link input at root
- [ ] "Paste" shows only if clipboard has items
- [ ] Paste creates items at root level
- [ ] Menu doesn't show when right-clicking items

---

## F035: Root Context Menu in Sidebar Spaces

**Priority:** P1 - High  
**Dependencies:** F006  
**Estimated Effort:** 2 hours  
**User Value:** Users can create items from sidebar's empty area

### User Story

> As a user, I want to right-click on the empty area of the sidebar space tree to create new folders and links at the root level.

### Acceptance Criteria

- [ ] Right-click empty area in sidebar → context menu appears
- [ ] Menu shows: "New Folder", "New Link", "Paste" (if available)
- [ ] Actions create items at root level of active space
- [ ] Same as card root context menu

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Sidebar Background Context Menu | `main_layout_final.dart` | 1950-1990 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/Sidebar.tsx
packages/react-ui/src/components/TreeView.tsx
```

### Implementation Steps

1. **Add Context Menu to TreeView Background**
   ```typescript
   // In TreeView component
   const handleBackgroundContextMenu = (e: React.MouseEvent) => {
     if (e.target !== e.currentTarget) return;
     
     e.preventDefault();
     
     const hasClipboard = clipboardStore.hasClipboard();
     
     setContextMenu({
       items: [
         {
           id: 'new_folder',
           label: 'New Folder',
           icon: <FolderPlus size={16} />,
         },
         {
           id: 'new_link',
           label: 'New Link',
           icon: <Link size={16} />,
         },
         ...(hasClipboard ? [{
           id: 'paste',
           label: 'Paste',
           icon: <Clipboard size={16} />,
         }] : []),
       ],
       position: { x: e.clientX, y: e.clientY },
       onAction: handleRootAction,
     });
   };
   
   const handleRootAction = (actionId: string) => {
     switch (actionId) {
       case 'new_folder':
         setInput({ spaceId, parentId: null, type: 'folder' });
         break;
       case 'new_link':
         setInput({ spaceId, parentId: null, type: 'link' });
         break;
       case 'paste':
         handlePasteAtRoot(spaceId);
         break;
     }
   };
   ```

2. **Apply to TreeView Container**
   ```typescript
   <div 
     className={styles.treeViewContainer}
     onContextMenu={handleBackgroundContextMenu}
   >
     {renderTree(items)}
   </div>
   ```

### Manual Testing Checklist

- [ ] Right-click empty sidebar area → menu appears
- [ ] "New Folder" → inline input at root
- [ ] "New Link" → inline link input at root
- [ ] "Paste" works at root level
- [ ] Menu matches card root menu style
- [ ] Doesn't interfere with item context menus

---

## F036: Reorder Spaces by Dragging Sidebar Circles

**Priority:** P1 - High  
**Dependencies:** None  
**Estimated Effort:** 4 hours  
**User Value:** Users can customize space order

### User Story

> As a user, I want to drag space circles in the sidebar to reorder them, so I can organize my spaces in my preferred sequence.

### Acceptance Criteria

- [ ] Space circles in sidebar are draggable
- [ ] Drop indicator shows between circles
- [ ] Reorder persists across app restarts
- [ ] Reorder reflects in Spaces Screen card order
- [ ] Smooth animation during drag

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Draggable Space Circle | `space_circle_widget.dart` | 45-125 |
| Space Reorder Handler | `spaces_provider.dart` | 340-375 |

**Full Flutter Paths:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_circle_widget.dart`
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/spaces_provider.dart`

### Flutter Code Reference

```dart
// Draggable space circle (space_circle_widget.dart:45-125)
Draggable<Space>(
  data: widget.space,
  feedback: Transform.scale(
    scale: 1.2,
    child: SpaceCircle(space: widget.space, size: 32),
  ),
  childWhenDragging: Opacity(
    opacity: 0.4,
    child: widget.child,
  ),
  child: DragTarget<Space>(
    onWillAcceptWithDetails: (details) => details.data.id != widget.space.id,
    onAcceptWithDetails: (details) {
      ref.read(spacesProvider.notifier).reorderSpace(
        details.data.id,
        targetIndex: widget.index,
      );
    },
    builder: (context, candidateData, rejectedData) {
      return widget.child;
    },
  ),
)
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/components/DraggableSpaceCircle.tsx
```

**Files to Update:**
```
packages/react-ui/src/components/Sidebar.tsx
packages/core/src/services/SpacesService.ts
```

### Implementation Steps

1. **Add sortOrder to Space Model**
   ```typescript
   // Ensure Space interface has sortOrder
   interface Space {
     id: string;
     name: string;
     accentColor: string;
     sortOrder: number;  // For custom ordering
     // ... other fields
   }
   ```

2. **Create DraggableSpaceCircle Component**
   ```typescript
   interface DraggableSpaceCircleProps {
     space: Space;
     index: number;
     isActive: boolean;
     onReorder: (spaceId: string, targetIndex: number) => void;
     onClick: () => void;
   }
   
   export function DraggableSpaceCircle({ 
     space, 
     index, 
     isActive,
     onReorder,
     onClick 
   }: DraggableSpaceCircleProps) {
     const [isDragging, setIsDragging] = useState(false);
     const [showIndicator, setShowIndicator] = useState<'before' | 'after' | null>(null);
     
     const handleDragStart = (e: React.DragEvent) => {
       e.dataTransfer.setData('application/json', JSON.stringify({ spaceId: space.id, index }));
       e.dataTransfer.effectAllowed = 'move';
       setIsDragging(true);
     };
     
     const handleDragOver = (e: React.DragEvent) => {
       e.preventDefault();
       e.dataTransfer.dropEffect = 'move';
       
       // Determine if should show before or after indicator
       const rect = e.currentTarget.getBoundingClientRect();
       const midpoint = rect.top + rect.height / 2;
       setShowIndicator(e.clientY < midpoint ? 'before' : 'after');
     };
     
     const handleDrop = (e: React.DragEvent) => {
       e.preventDefault();
       const data = JSON.parse(e.dataTransfer.getData('application/json'));
       
       if (data.spaceId !== space.id) {
         const targetIndex = showIndicator === 'before' ? index : index + 1;
         onReorder(data.spaceId, targetIndex);
       }
       
       setShowIndicator(null);
     };
     
     const handleDragEnd = () => {
       setIsDragging(false);
     };
     
     return (
       <div className={styles.draggableSpaceCircle}>
         {showIndicator === 'before' && (
           <div className={styles.dropIndicator} style={{ backgroundColor: space.accentColor }} />
         )}
         <div
           draggable
           onDragStart={handleDragStart}
           onDragOver={handleDragOver}
           onDrop={handleDrop}
           onDragEnd={handleDragEnd}
           onDragLeave={() => setShowIndicator(null)}
           onClick={onClick}
           className={cn(
             styles.spaceCircle,
             isActive && styles.active,
             isDragging && styles.dragging
           )}
           style={{ backgroundColor: space.accentColor }}
         >
           {space.name[0]}
         </div>
         {showIndicator === 'after' && (
           <div className={styles.dropIndicator} style={{ backgroundColor: space.accentColor }} />
         )}
       </div>
     );
   }
   ```

3. **Add Reorder API Method**
   ```typescript
   // In SpacesService
   async reorderSpace(spaceId: string, newIndex: number): Promise<void> {
     const spaces = await this.getAll();
     const currentIndex = spaces.findIndex(s => s.id === spaceId);
     
     if (currentIndex === -1 || currentIndex === newIndex) return;
     
     // Reorder array
     const [movedSpace] = spaces.splice(currentIndex, 1);
     spaces.splice(newIndex, 0, movedSpace);
     
     // Update sortOrder for all spaces
     for (let i = 0; i < spaces.length; i++) {
       await this.db.spaces.update(spaces[i].id, { sortOrder: i });
     }
   }
   ```

4. **Update Sidebar to Use DraggableSpaceCircle**
   ```typescript
   // In Sidebar
   const handleSpaceReorder = async (spaceId: string, targetIndex: number) => {
     await window.spacesApi.reorderSpace(spaceId, targetIndex);
     invalidate('spaces');
   };
   
   {spaces.map((space, index) => (
     <DraggableSpaceCircle
       key={space.id}
       space={space}
       index={index}
       isActive={space.id === activeSpaceId}
       onReorder={handleSpaceReorder}
       onClick={() => setActiveSpace(space.id)}
     />
   ))}
   ```

5. **CSS for Drop Indicator**
   ```css
   .dropIndicator {
     height: 2px;
     width: 100%;
     border-radius: 1px;
     opacity: 0.8;
     transition: opacity 150ms ease;
   }
   
   .draggableSpaceCircle {
     position: relative;
   }
   
   .spaceCircle.dragging {
     opacity: 0.4;
   }
   ```

### Manual Testing Checklist

- [ ] Drag space circle → preview shows
- [ ] Hover between circles → indicator appears
- [ ] Drop → spaces reorder
- [ ] Reorder persists after restart
- [ ] Spaces Screen reflects new order
- [ ] Active space can be reordered
- [ ] Smooth animations during drag
