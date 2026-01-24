# Validation Notes

Generated: 2026-01-24T15:21:18.281882

## Action Items

- [x] Resolve: **Potential overlap with SPEC-016**: Multi-selection clipboard operations will need to integrate with the multi-selection state management being implemented in SPEC-016
  - 💡 AI: **What needs to be added/changed:**
Add a dependency section referencing SPEC-016 and specify the shared state management interface for multi-selection operations.

**Where in the spec:**
Add to the beginning under "Dependencies" and update the technical implementation section to define how clipboard operations will consume SPEC-016's selection state.

**Example template:**
```
Dependencies: SPEC-016 (Multi-selection State Management)
Interface: Clipboard operations must use SPEC-016's getSelectedItems() and onSelectionChange() methods rather than maintaining separate selection tracking.
```
  - 💭 Note:  (auto-applied)

- [x] Resolve: **Dependency timing**: This spec depends on SPEC-007 (SpaceItem entity) but doesn't verify the entity structure matches the clipboard requirements
  - 💡 AI: **Fix: Add dependency validation section**

1. **What to add**: Create a "Dependencies & Validation" section that explicitly maps SpaceItem entity fields to clipboard data requirements and includes validation criteria.

2. **Where**: Add this section immediately after the current dependencies list but before the main feature description.

3. **Template**:
```
## Dependencies & Validation
- SPEC-007 SpaceItem entity MUST include: `id`, `title`, `content`, `metadata.lastModified`
- Validation: Verify SpaceItem.serialize() output matches clipboard.data schema before implementation
```
  - 💭 Note:  (auto-applied)

- [ ] Fix: Add missing section: MVP Scope section

- [ ] Fix: Add missing section: User Stories section

- [x] Fix: Add missing section: Out of Scope section
  - 💡 AI: **What to add:** Create an "Out of Scope" section that explicitly lists features, functionalities, or requirements that will NOT be included in this release/version.

**Where to place:** Immediately after the "Scope" or "Requirements" section, before "Technical Specifications."

**Template:**
```
## Out of Scope
- Feature X (planned for v2.0)
- Integration with System Y
- Mobile responsive design
- Advanced analytics dashboard
```

This prevents scope creep and sets clear expectations with stakeholders about what's excluded.
  - 💭 Note:  (auto-applied)

- [x] Fixed: **URL validation logic unclear**: The regex pattern is provided but where/how URL validation occurs in the flow isn't specified
  - 💡 AI: ## Fix for URL Validation Logic Gap

### What needs to be added/changed:
Add a clear **Validation Flow** section that specifies:
1. **When** URL validation occurs (on input blur, form submit, or real-time)
2. **Where** validation is handled (component level vs store level)
3. **Error handling** and user feedback mechanism

### Where in the spec:
Add after the current regex pattern definition:

```markdown
## Validation Flow
- **Trigger**: Validate on input blur and form submission
- **Location**: Handle validation in the InlineInputStore (from SPEC-013)
- **Process**:
  1. Apply regex pattern validation
  2. Update validation state in store
  3. Display inline error message if invalid
  4. Prevent submission until valid

## Error States
- Invalid URL: Show "Please enter a valid URL" below input
- Empty required field: Show "URL is required"
- Validation styling: Red border + error text
```

### Overlap handling:
This should **reference SPEC-013** since URL validation is part of inline input functionality:
- Add dependency: `Depends on: SPEC-013 (InlineInputStore for validation state)`
- Use consistent validation patterns with other inline inputs

### Integration point:
The URL validation should integrate with SPEC-013's `InlineInputStore` validation system rather than creating separate validation logic.

This ensures consistent validation behavior across all inline input types (folders, links, renames).
  - 💭 Note: Applied automatically

- [x] Fixed: **Paste operation missing**: The spec focuses on copy/cut but doesn't define the paste operation that would consume the clipboard state
  - 💡 AI: ## Gap Fix: Add Paste Operation Definition

### What needs to be added:
The spec needs a complete paste operation definition that consumes clipboard state and integrates with the existing copy/cut operations.

### Where to add it:
Add a new section **"Paste Operations"** after the copy/cut operations section, and update the interface definitions.

### Specific additions needed:

1. **Paste Operation Method:**
```typescript
interface ClipboardStore {
  // ... existing methods
  pasteItems: (targetId: string, position?: 'before' | 'after' | 'inside') => Promise<void>
  canPaste: (targetId: string) => boolean
}
```

2. **Paste Logic Definition:**
- Validate paste target compatibility with clipboard content type
- Handle different paste contexts (folder-to-folder, link operations, etc.)
- Clear clipboard state after successful paste
- Provide user feedback for invalid paste attempts

3. **Integration Points:**
- Keyboard shortcut handling (Ctrl+V)
- Context menu paste option
- Visual paste indicators when items are available

### Dependencies to add:
- **SPEC-016** (Multi-selection): Paste should work with multi-selected clipboard content
- **SPEC-014** (Drag-drop): Share drop validation logic for paste target validation

### Example paste operation:
```typescript
pasteItems: async (targetId: string, position = 'inside') => {
  const { items, operation } = get().clipboardState
  if (!items.length || !canPaste(targetId)) return
  
  // Execute paste based on operation type
  if (operation === 'cut') {
    await moveItems(items, targetId, position)
  } else {
    await duplicateItems(items, targetId, position)
  }
  
  set({ clipboardState: { items: [], operation: null } })
}
```

This ensures the clipboard system is complete and follows the established patterns from related specs.
  - 💭 Note: Applied automatically

- [ ] Consider: **Define paste validation rules**: Specify what makes a target compatible (folder can accept any item, space root accepts folders/links, etc.)
  - 💡 AI: ## Gap Analysis: Paste Validation Rules

### What needs to be added:
Define comprehensive paste validation rules that specify target compatibility for different item types and contexts.

### Where to add in spec:
Add a new section **"Paste Validation Rules"** after the current criteria, with these subsections:

#### Target Compatibility Matrix:
```
- **Folders**: Can accept any pasteable item (folders, links, files)
- **Space Root**: Only accepts folders and links (no files at root level)
- **Links**: Cannot accept paste operations (not containers)
- **Pins Grid**: Accepts folders and links only
```

#### Validation Logic:
```
- Check target container type compatibility
- Validate item type against target rules  
- Prevent duplicate names in same container
- Block circular references (folder into its own subtree)
- Respect space-level permissions/constraints
```

### Overlap with related specs:
- **Add dependency**: SPEC-014 (Enhanced Drag Drop) - paste validation should use similar logic to drop validation
- **Reference**: SPEC-016 (Multi-selection) - validation must handle batch paste operations
- **Consistency**: Use same container type terminology as other specs

### Example validation function signature:
```typescript
validatePasteTarget(
  items: PasteableItem[],
  target: ContainerTarget,
  context: 'sidebar' | 'space-card' | 'pins-grid'
): ValidationResult
```

This ensures paste operations respect the same structural rules as drag-drop while handling the unique aspects of clipboard-based transfers.

- [ ] Consider: **Clarify multi-item positioning**: Define behavior when pasting multiple items with position modifiers
  - 💡 AI: ## Gap Analysis: Multi-Item Positioning Behavior

### What needs to be added/changed:

**Add a "Multi-Item Positioning Rules" section** that defines:

1. **Sequential positioning**: When pasting multiple items with position modifiers (e.g., "after item X"), define the stacking order
2. **Conflict resolution**: Behavior when position targets become invalid due to multiple insertions
3. **Batch operation handling**: Whether positions are calculated once at paste-start or dynamically updated

### Where in the spec:

Add this section after the main positioning logic and before any implementation details.

### Overlap handling:

This directly relates to **Spec 016 (multi-selection-state-management)**. Consider:
- **Add dependency**: Reference Spec 016 for multi-selection state
- **Consistent terminology**: Use the same "batch operations" language from Spec 016
- **Avoid duplication**: Focus on positioning-specific behavior, not selection management

### Suggested content template:

```markdown
## Multi-Item Positioning Rules

**Dependencies**: Spec 016 (multi-selection state management)

### Sequential Insertion
- Items paste in selection order with positions calculated at paste-start
- Subsequent items adjust positions relative to previously inserted items
- Example: Pasting 3 items "after ItemA" results in: ItemA → Item1 → Item2 → Item3

### Position Conflict Resolution
- If target position becomes invalid during batch paste, fall back to [default behavior]
- Maintain relative order of pasted items regardless of position conflicts

### State Integration
- Leverage Spec 016's multi-selection state for batch position operations
- Track position targets per selected item before paste execution
```

**Recommendation**: Consider merging this positioning logic into Spec 016 as a "Batch Positioning" subsection to keep related multi-item behaviors centralized.

- [ ] Consider: **Add IPC error handling**: Specify fallback behavior when system clipboard operations fail
  - 💡 AI: ## Fix for IPC Error Handling Gap

### What needs to be added:
Add a comprehensive error handling section that specifies fallback behaviors for clipboard operations when system IPC fails.

### Where to add it:
Create a new section called **"Error Handling & Fallbacks"** after the main functionality sections but before implementation details.

### Content to add:

```markdown
## Error Handling & Fallbacks

### IPC Failure Scenarios
- **System clipboard unavailable**: Fall back to internal app clipboard
- **Permission denied**: Show user notification with manual copy option
- **Timeout errors**: Retry once, then graceful degradation
- **Format conversion failures**: Strip to plain text as fallback

### Fallback Behaviors
1. **Primary**: Use Electron's clipboard API
2. **Secondary**: Internal memory-based clipboard store
3. **Tertiary**: Show copy-to-manual dialog with text selection

### Error States
- Display non-blocking toast notifications for clipboard errors
- Maintain operation history even when system clipboard fails
- Provide manual recovery options in UI

### Integration Points
- **Dependency**: SPEC-001 (Electron foundation) for IPC error handling patterns
- **State Management**: Use existing error state patterns from related specs
```

### Overlap handling:
This doesn't duplicate existing specs but should reference SPEC-001's Electron foundation for consistent error handling patterns across the app.

### Key additions:
- Specific fallback hierarchy
- User experience considerations
- Integration with existing foundation
- Clear error state management

## Pending from previous sessions

- [ ] Fix: Add missing section: MVP Scope section
- [ ] Fix: Add missing section: User Stories section
- [ ] Consider: **Define paste validation rules**: Specify what makes a target compatible (folder can accept any item, space root accepts folders/links, etc.)
- [ ] Consider: **Clarify multi-item positioning**: Define behavior when pasting multiple items with position modifiers
- [ ] Consider: **Add IPC error handling**: Specify fallback behavior when system clipboard operations fail
