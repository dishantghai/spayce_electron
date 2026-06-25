# Spec 007: Modular Clean Architecture

## Overview

Implement a modular, Clean Architecture-based project structure that enables:
- **Framework Agnosticism**: Swap UI frameworks (React/Tauri/Electron) without rewriting business logic
- **Database Flexibility**: Switch between SQLite/SurrealDB/other databases with minimal changes
- **Maximum Code Sharing**: Share 80%+ of code between different frontends and platforms
- **AI-Friendly Development**: Clear contracts and patterns that enable AI coding agents to write, test, debug, and fix code consistently
- **Future-Proof Design**: Separation of concerns enabling new features without impacting existing ones

## Dependencies & Scope Coordination

**Dependencies & Integration Points:**
- **Database Schema & Setup**: Defers to Spec 001 (Project Foundation) for initial database connection, schema creation, and migration framework
- **Testing Framework**: Defers to Spec 001 (Project Foundation) for Vitest setup and configuration
- **Error Handling UI**: Defers to Spec 001 (Project Foundation) for design system tokens, shared component patterns, and logging infrastructure
- **This Spec Covers**: Clean Architecture implementation, business logic layer separation, repository patterns, use cases, and domain modeling
- **Integration Points**: 
  - Uses database connection established in Spec 001
  - Uses Vitest testing framework configured in Spec 001
  - Uses design system and shared patterns from Spec 001 for error boundary UI components
  - Extends schema defined in Spec 001 with domain-specific tables
  - Implements repository interfaces using Spec 001's database infrastructure
  - Coordinates with Spec 002 (Sidebar) and Spec 003 (Spaces Module) for UI integration

## Shared Package Migration Checklist

### UI Components (packages/shared/components/ → apps/desktop/src/shared/components/)
- [ ] Button.tsx
- [ ] Input.tsx
- [ ] Modal.tsx
- [ ] Card.tsx
- [ ] Icon.tsx

### Utilities (packages/shared/utils/ → apps/desktop/src/shared/utils/)
- [ ] formatting.ts
- [ ] validation.ts
- [ ] constants.ts
- [ ] types.ts

### Hooks (packages/shared/hooks/ → apps/desktop/src/shared/hooks/)
- [ ] useLocalStorage.ts
- [ ] useDebounce.ts
- [ ] useKeyboard.ts

### Design Tokens (packages/shared/tokens/ → apps/desktop/src/shared/tokens/)
- [ ] colors.ts
- [ ] typography.ts
- [ ] spacing.ts

### Dependencies to Update
- [ ] Update import paths in Spec 003 (Spaces module)
- [ ] Update import paths in Spec 006 (Keyboard navigation)
- [ ] Verify design system tokens remain accessible per Spec 001

### Migration Validation
- [ ] All imports resolve correctly
- [ ] No circular dependencies introduced
- [ ] Build passes for desktop app
- [ ] Shared components render correctly

## User Stories

### Primary User Stories

**US-001: Create and Manage Spaces**
- **As a Spayce user**, I want to create and manage spaces so that I can organize my digital content efficiently
- **Acceptance Criteria:**
  - Given I am logged into Spayce
  - When I create a new space with a name and icon
  - Then the space appears in my sidebar and persists across app restarts
  - And I can edit the space name, icon, and accent color
  - And I can delete the space and all its contents
  - And I can reorder spaces by dragging them in the sidebar

**US-002: Add Items to Spaces**
- **As a Spayce user**, I want to add items (links, files, folders) to my spaces so that I can centralize access to my resources
- **Acceptance Criteria:**
  - Given I have a space selected
  - When I add a link, file, or folder to the space
  - Then the item appears in the space with correct metadata and can be opened
  - And I can rename, delete, or move the item
  - And I can organize items hierarchically within folders
  - And I can drag and drop items to reorder them

**US-003: Pin Important Items**
- **As a Spayce user**, I want to pin important items so that I can quickly access my most-used content
- **Acceptance Criteria:**
  - Given I have items in my spaces
  - When I pin an item
  - Then it appears in the pinned items grid and maintains its position
  - And I can unpin items to remove them from the grid
  - And I can reorder pinned items by dragging them
  - And the pinned items grid shows up to 5 columns of items

**US-004: Search and Discover Content**
- **As a Spayce user**, I want to search through my spaces and items so that I can find content quickly
- **Acceptance Criteria:**
  - Given I have content in my spaces
  - When I search for items by name or URL
  - Then relevant results appear instantly
  - And I can view recent items I've accessed
  - And I can see my most visited items
  - And search results highlight matching text

**US-005: Drag and Drop Organization**
- **As a Spayce user**, I want to drag and drop items between spaces so that I can reorganize my content intuitively
- **Acceptance Criteria:**
  - Given I have items in multiple spaces
  - When I drag an item from one space to another
  - Then the item moves and the change persists
  - And I can drag items into folders to organize them hierarchically
  - And I can drag items out of folders to the root level
  - And visual indicators show where items can be dropped

**US-006: Import Local Files and Folders**
- **As a Spayce user**, I want to import local folders and files so that I can include my file system resources in my spaces
- **Acceptance Criteria:**
  - Given I want to include local files in my spaces
  - When I import a local folder or file
  - Then it appears as a space item and maintains its file system connection
  - And I can browse folder contents dynamically
  - And changes to local files are reflected in the space
  - And I can open local files with their default applications

**US-007: Framework Flexibility (Developer)**
- **As a developer**, I want to switch between different UI frameworks (React/Tauri) without losing data or functionality
- **Acceptance Criteria:**
  - Given I have a working Electron + React implementation
  - When I switch to a Tauri + React implementation
  - Then all my data remains accessible and functional
  - And all business logic continues to work without changes
  - And only the infrastructure layer needs modification

**US-008: Database Flexibility (Developer)**
- **As a developer**, I want to change database backends (SQLite/SurrealDB) without rewriting business logic
- **Acceptance Criteria:**
  - Given I have a working SQLite implementation
  - When I switch to SurrealDB
  - Then all data operations continue to work
  - And only repository implementations need to change
  - And the domain and application layers remain untouched

### Edge Cases & Error Scenarios

**US-009: Validation and Error Handling**
- **As a user**, when I try to create a space with an empty name, I should see a validation error with clear guidance
- **As a user**, when I try to add an invalid URL, I should see an error message and suggestions for correction
- **As a user**, when a local file is moved or deleted, I should see a clear indication that the link is broken with options to fix or remove it
- **As a user**, when the database is corrupted or inaccessible, I should see an error message with recovery options and data backup information

## Migration from Existing Codebase

### Pre-Migration Audit

Before implementing the new Clean Architecture, we must systematically audit and categorize the existing `packages/shared/` structure to ensure smooth transition and zero functionality loss.

#### Audit Categories

**1. Domain Entities & Types**
```bash
# Catalog all type definitions that represent business entities
find packages/shared/src/types/ -name "*.ts" | grep -E "(Space|Item|Profile|User)"
```
- `Space.ts` → `packages/core/src/domain/entities/Space.ts`
- `SpaceItem.ts` → `packages/core/src/domain/entities/SpaceItem.ts`
- `Profile.ts` → `packages/core/src/domain/entities/Profile.ts`

**2. Business Logic & Utilities**
```bash
# Identify utilities that contain business rules
find packages/shared/src/utils/ -name "*.ts" | xargs grep -l "business\|validation\|rule"
```
- Validation functions → `packages/core/src/domain/validators/`
- Business calculations → `packages/core/src/domain/services/`
- Pure utilities → `packages/core/src/shared/utils/`

**3. Infrastructure Configuration**
```bash
# Find configuration files for external services
find packages/shared/src/ -name "*.ts" | grep -E "(config|database|api|service)"
```
- Database configs → `packages/infrastructure/src/config/`
- API configurations → `packages/infrastructure/src/api/`
- Service configurations → `packages/infrastructure/src/services/`

**4. UI Components & Hooks**
```bash
# Catalog React-specific code
find packages/shared/src/ -name "*.ts" -o -name "*.tsx" | grep -E "(component|hook|store)"
```
- React components → `packages/react-ui/src/components/`
- React hooks → `packages/react-ui/src/hooks/`
- Zustand stores → `packages/react-ui/src/stores/`

**5. Constants & Enums**
```bash
# Find constant definitions
find packages/shared/src/ -name "*.ts" | xargs grep -l "const\|enum"
```
- Domain constants → `packages/core/src/domain/constants/`
- UI constants → `packages/react-ui/src/constants/`
- Infrastructure constants → `packages/infrastructure/src/constants/`

### Migration Strategy

#### Phase 1: Compatibility Layer Setup (Week 1)
Create a compatibility layer that maintains backward compatibility while introducing the new structure:

```typescript
// packages/shared/src/index.ts - Compatibility layer during migration
export * from '@spayce/core/domain/entities';
export * from '@spayce/core/application/facades';

// Add deprecation warnings for tracking
if (process.env.NODE_ENV === 'development') {
  console.warn('[DEPRECATED] Importing from packages/shared is deprecated. Use @spayce/core instead.');
}
```

#### Phase 2: Content Migration (Weeks 1-2)

**Step 1: Domain Content Migration**
- Audit all files in `packages/shared/types/`
- Create corresponding entities in `packages/core/src/domain/entities/`
- Migrate validation logic to `packages/core/src/domain/validators/`
- Move domain constants to `packages/core/src/domain/constants/`

**Step 2: Infrastructure Content Migration**
- Move database configurations to `packages/infrastructure/src/config/`
- Migrate service implementations to `packages/infrastructure/src/services/`
- Transfer API clients to `packages/infrastructure/src/api/`

**Step 3: UI Content Migration**
- Move React components to `packages/react-ui/src/components/`
- Transfer React hooks to `packages/react-ui/src/hooks/`
- Migrate Zustand stores to `packages/react-ui/src/stores/`

#### Phase 3: Import Path Updates (Weeks 2-3)

**Automated Migration Script:**
```bash
#!/bin/bash
# migration-script.sh - Update import paths across codebase

# Update domain entity imports
find packages/ apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|@spayce/shared/types|@spayce/core/domain/entities|g'

# Update hook imports
find packages/ apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|@spayce/shared/hooks|@spayce/react-ui/hooks|g'

# Update component imports
find packages/ apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|@spayce/shared/components|@spayce/react-ui/components|g'

# Update utility imports
find packages/ apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|@spayce/shared/utils|@spayce/core/shared/utils|g'

echo "Import paths updated. Run tests to verify functionality."
```

**Manual Import Review:**
```typescript
// Before migration
import { SpaceEntity } from '@spayce/shared/types';
import { useSpaces } from '@spayce/shared/hooks';
import { SpaceCard } from '@spayce/shared/components';

// After migration
import { SpaceEntity } from '@spayce/core/domain/entities';
import { useSpaces } from '@spayce/react-ui/hooks';
import { SpaceCard } from '@spayce/react-ui/components';
```

#### Phase 4: Validation & Testing (Week 3)

**Comprehensive Testing Strategy:**
```bash
# 1. Verify all imports resolve correctly
pnpm run type-check

# 2. Run full test suite
pnpm run test

# 3. Build all packages
pnpm run build

# 4. Verify development server
pnpm run dev

# 5. Test production build
pnpm run build:prod && pnpm run preview
```

**Functionality Verification:**
- [ ] All existing features work identically
- [ ] No broken imports or missing dependencies
- [ ] Hot module replacement functions correctly
- [ ] Build process completes successfully
- [ ] Test coverage maintains previous levels

#### Phase 5: Cleanup & Finalization (Week 4)

**Cleanup Checklist:**
- [ ] Remove `packages/shared/` package entirely
- [ ] Update `pnpm-workspace.yaml` to exclude shared package
- [ ] Remove compatibility layer and deprecation warnings
- [ ] Update all documentation to reference new structure
- [ ] Update CI/CD pipelines for new package structure
- [ ] Archive old package structure in Git for reference

### Migration Rollback Strategy

#### Rollback Triggers
- Critical functionality breaks (app won't start, data corruption)
- Performance degradation >50% from baseline
- Integration failures with SQLite or Electron APIs
- User-blocking issues in Spaces navigation or keyboard controls

#### Pre-Migration Safeguards
- Full git branch backup before starting migration
- Database schema snapshot using SQLite export
- Automated test suite baseline (reference Spec 001 for foundation tests)
- Performance benchmarks for Spaces module rendering (reference Spec 003)

#### Rollback Process
1. **Immediate**: Revert to pre-migration git commit
2. **Database**: Restore SQLite from snapshot if schema changed
3. **Dependencies**: Reset package.json to original state
4. **Validation**: Run full test suite against Specs 001, 003, 002
5. **Communication**: Document rollback reason and lessons learned

#### Recovery Timeline
- Emergency rollback: <2 hours
- Full system validation: <4 hours
- Post-rollback analysis: 1 business day

#### Detailed Rollback Procedure

If critical issues arise during migration:

**Immediate Rollback:**
```bash
# 1. Revert to previous Git commit
git revert HEAD~n  # where n is number of migration commits

# 2. Restore packages/shared/ package
git checkout HEAD~n -- packages/shared/

# 3. Restore original import paths
git checkout HEAD~n -- packages/ apps/

# 4. Verify functionality
pnpm run test && pnpm run build
```

**Partial Rollback:**
- Keep new packages but re-enable `packages/shared/` temporarily
- Use compatibility layer to maintain both import styles
- Investigate and fix issues before re-attempting migration
- Document lessons learned for next migration attempt

### Migration Validation Criteria

**Pre-Migration Requirements:**
- [ ] Complete audit of `packages/shared/` contents documented
- [ ] New package structure created and validated
- [ ] Compatibility layer implemented and tested
- [ ] Migration scripts prepared and dry-run tested
- [ ] Rollback procedure documented and validated

**Post-Migration Success Criteria:**
- [ ] All existing functionality works identically
- [ ] Zero broken imports across entire codebase
- [ ] All tests pass with same or better coverage
- [ ] Build process completes without errors
- [ ] Development experience (HMR, etc.) unchanged
- [ ] Production builds work correctly
- [ ] Documentation updated to reflect new structure

## Migration Plan

### Phase 1: Compatibility Layer (Weeks 1-2)
To ensure seamless transition from the existing `packages/shared/` structure to the new Clean Architecture, we will implement a compatibility layer that maintains backward compatibility while introducing the new structure.

**Compatibility Strategy:**
- Keep existing `packages/shared/` package operational during migration
- Create re-export modules that map old import paths to new locations
- Use TypeScript path mapping to redirect imports during development
- Maintain all existing APIs and interfaces during transition period
- Implement deprecation warnings for old import paths

**Migration Timeline:**
```typescript
// packages/shared/src/index.ts - Compatibility layer
export * from '@spayce/core/domain/entities';
export * from '@spayce/core/application/facades';
// Add deprecation warnings
console.warn('[DEPRECATED] Importing from packages/shared is deprecated. Use @spayce/core instead.');
```

### Phase 2: Content Migration (Weeks 2-4)
Systematically move content from `packages/shared/` to appropriate new packages:

**Domain Content Migration:**
- `packages/shared/types/Space.ts` → `packages/core/src/domain/entities/Space.ts`
- `packages/shared/types/SpaceItem.ts` → `packages/core/src/domain/entities/SpaceItem.ts`
- `packages/shared/constants/` → `packages/core/src/domain/constants/`
- `packages/shared/utils/validation.ts` → `packages/core/src/domain/validators/`

**Infrastructure Content Migration:**
- `packages/shared/config/database.ts` → `packages/infrastructure/src/config/database.ts`
- `packages/shared/services/` → `packages/infrastructure/src/services/`

**UI Content Migration:**
- `packages/shared/components/` → `packages/react-ui/src/components/`
- `packages/shared/hooks/` → `packages/react-ui/src/hooks/`
- `packages/shared/stores/` → `packages/react-ui/src/stores/`

### Phase 3: Import Path Updates (Weeks 4-5)
Gradually update import statements across the codebase:

**Automated Migration Script:**
```bash
# Create migration script to update imports
find packages/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|@spayce/shared/types|@spayce/core/domain/entities|g'
find packages/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|@spayce/shared/hooks|@spayce/react-ui/hooks|g'
```

### Phase 4: Validation and Testing (Week 5)
Ensure all functionality works correctly with new structure:

**Validation Steps:**
- Run comprehensive test suite to verify no regressions
- Test all import paths resolve correctly
- Validate build process works with new package structure
- Ensure development and production builds are successful
- Verify hot module replacement still functions correctly

### Phase 5: Cleanup (Week 6)
Remove deprecated content and finalize migration:

**Cleanup Tasks:**
- Remove `packages/shared/` package entirely
- Update all documentation to reference new structure
- Remove compatibility layer and deprecation warnings
- Update CI/CD pipelines to reflect new package structure
- Archive old package structure for reference

## MVP Scope

### Included in MVP:
- **Core Space Management**: Create, read, update, delete spaces with real SQLite persistence
- **Space Item CRUD**: Full item management (links, folders, local files) with hierarchical organization
- **Pin System**: Pin/unpin items with persistent ordering and dedicated pinned items grid
- **Database Integration**: Import and extend existing Flutter SQLite database with zero data loss
- **Clean Architecture Implementation**: Complete domain, application, infrastructure, and presentation layers
- **React UI Integration**: Replace all mock data with real database operations via facades and hooks
- **Local File System Support**: Import local folders/files with security bookmarks (macOS)
- **Search & Discovery**: Search items, recent items, most visited items with real data
- **Drag & Drop Operations**: Full drag/drop with persistence including cross-space moves

### Excluded from MVP:
- **Multi-Platform UI**: Only React implementation (Tauri/other frameworks in future iterations)
- **Alternative Databases**: Only SQLite implementation (SurrealDB support in future)
- **Advanced Sync**: Real-time collaboration and cloud sync features
- **Performance Optimizations**: Advanced caching, virtualization, lazy loading
- **Advanced Metadata**: Rich link previews, automatic categorization, AI-powered organization
- **User Management**: Multi-user support, permissions, sharing features
- **Advanced Search**: Full-text search, filters, saved searches, smart collections
- **Theming System**: Advanced customization beyond basic accent colors and icons

### Success Criteria:
- **Data Integrity**: All existing Flutter data accessible and modifiable without corruption
- **Feature Parity**: All current Flutter features replicated with identical behavior
- **Zero Mock Data**: Complete removal of mock/dummy data from entire codebase
- **Test Coverage**: >80% unit test coverage for domain and application layers
- **Performance**: Sub-100ms response times for all CRUD operations
- **Architecture Compliance**: Strict adherence to Clean Architecture dependency rules
- **AI Development Ready**: Complete SPEKY documentation enabling autonomous AI development

### Dependencies:
- **Spec 001**: Project foundation (Electron + React setup) must be complete
- **Spec 002**: Sidebar navigation component must exist
- **Spec 003**: Spaces module with SpacesScreen component must exist
- **Spec 005**: Create space flow UI components must exist

## Out of Scope

The following items are explicitly excluded from this feature:

- **Alternative UI Framework Implementations**: Tauri, Vue, Svelte, or native desktop implementations (future iterations will handle framework swapping)
- **SurrealDB Implementation**: While interfaces will support it, only SQLite repository implementations are included in this iteration
- **Cloud Synchronization**: Real-time sync, conflict resolution, and cloud storage integration
- **Advanced Authentication**: Multi-user support, OAuth providers, user management systems
- **Performance Optimizations**: Virtual scrolling, lazy loading, advanced caching strategies
- **Rich Media Handling**: Video thumbnails, PDF previews, image optimization
- **Advanced Metadata Extraction**: AI-powered categorization, automatic tagging, content analysis
- **Collaborative Features**: Sharing spaces, real-time collaboration, permissions management
- **Import/Export Systems**: Bulk data migration, backup/restore, external app integrations
- **Advanced Search Features**: Full-text search, filters, faceted search, saved searches
- **Theming and Customization**: Advanced theme system, custom CSS, layout customization
- **Mobile Responsiveness**: Touch interactions, mobile-specific UI patterns
- **Accessibility Enhancements**: Screen reader support, keyboard navigation, high contrast modes
- **Analytics and Telemetry**: Usage tracking, performance monitoring, crash reporting
- **Plugin System**: Third-party extensions, custom integrations, API for external developers

## Problem Statement

Current architecture tightly couples:
1. **UI Components** directly to data fetching logic
2. **State Management** to React-specific patterns (Zustand in React components)
3. **Mock Data** throughout the codebase instead of real database integration
4. **Platform-specific code** scattered across packages

This makes it difficult to:
- Switch from Electron + React to Tauri + React (or other combinations)
- Replace the database layer (SQLite today, SurrealDB tomorrow)
- Test business logic in isolation
- Enable AI to understand boundaries and write consistent code

## Flutter Database Integration Strategy

> [!IMPORTANT]
> The Flutter Spayce app has a fully functional SQLite database with real user data. We will **copy** this database into the Electron project and build upon it.

### Database Location

| Platform | Path |
|----------|------|
| **macOS** | `~/Library/Containers/com.spayce.frontend/Data/Documents/spaces.sqlite` |
| **Windows** | `%APPDATA%/com.spayce.frontend/spaces.sqlite` |
| **Linux** | `~/.local/share/com.spayce.frontend/spaces.sqlite` |

### Database Storage Configuration

**Standardized Database Storage**: SQLite database stored at `{userData}/spaces.sqlite`
- **Production (macOS)**: `~/Library/Application Support/Spayce/spaces.sqlite`
- **Production (Windows)**: `%APPDATA%/Spayce/spaces.sqlite`
- **Production (Linux)**: `~/.local/share/Spayce/spaces.sqlite`
- **Development**: `./data/spaces.sqlite` (relative to app root)

This standardization ensures consistent database location across all platforms and aligns with the existing Flutter implementation filename.

### Copy Command (Run in Terminal)

```bash
# macOS - Copy Flutter DB to Electron project
# NOTE: The actual path may vary. Common locations:
#   ~/Documents/spaces.sqlite (debug mode)
#   ~/Library/Containers/com.spayce.frontend/Data/Documents/spaces.sqlite (sandboxed)

mkdir -p /Users/Shared/ALL\ WORKSPACE/projects/spayce_electron/resources/db
cp ~/Documents/spaces.sqlite \
   /Users/Shared/ALL\ WORKSPACE/projects/spayce_electron/resources/db/spaces.sqlite
```

### Database Migration (Add Missing Columns)

The Flutter database may be missing the local file system columns if it's from an older version. Run this migration:

```bash
# Add local file system columns to space_items table
sqlite3 "/Users/Shared/ALL WORKSPACE/projects/spayce_electron/resources/db/spaces.sqlite" << 'EOF'
ALTER TABLE space_items ADD COLUMN local_path TEXT NULL;
ALTER TABLE space_items ADD COLUMN security_bookmark TEXT NULL;
ALTER TABLE space_items ADD COLUMN last_synced_at INTEGER NULL;
ALTER TABLE space_items ADD COLUMN is_watching INTEGER NOT NULL DEFAULT 0 CHECK (is_watching IN (0, 1));
.schema space_items
EOF
```

This will add the missing columns and display the updated schema for verification.

### Schema (Drift-Generated)

The database contains the following tables:

| Table | Purpose |
|-------|--------|
| `spaces` | Space entities with id, name, profileId, userId, accentColor, iconName, sortOrder |
| `space_items` | Items within spaces - links, folders, local files, with hierarchical parentId |
| `migrations` | Schema migration tracking |

## Input Validation Strategy

### Validation Layers

The system implements multi-layered input validation to ensure data integrity and security across all layers of the Clean Architecture:

#### 1. Schema Validation
TypeScript interfaces provide compile-time validation, supplemented by runtime validation for external data sources:

```typescript
// packages/core/src/domain/validators/SchemaValidator.ts
export interface ValidationSchema<T> {
  validate(input: unknown): ValidationResult<T>;
  validatePartial(input: unknown): ValidationResult<Partial<T>>;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
}

export class CreateSpaceValidator implements ValidationSchema<CreateSpaceInput> {
  validate(input: unknown): ValidationResult<CreateSpaceInput> {
    const errors: ValidationError[] = [];
    
    if (!input || typeof input !== 'object') {
      errors.push(new ValidationError('input', input, 'must be an object'));
      return { success: false, errors };
    }
    
    const data = input as Record<string, unknown>;
    
    // Validate required fields
    if (!data.name || typeof data.name !== 'string') {
      errors.push(new ValidationError('name', data.name, 'must be a non-empty string'));
    }
    
    if (!data.profileId || typeof data.profileId !== 'string') {
      errors.push(new ValidationError('profileId', data.profileId, 'must be a valid string'));
    }
    
    if (!data.userId || typeof data.userId !== 'string') {
      errors.push(new ValidationError('userId', data.userId, 'must be a valid string'));
    }
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    return {
      success: true,
      data: data as CreateSpaceInput
    };
  }
  
  validatePartial(input: unknown): ValidationResult<Partial<CreateSpaceInput>> {
    // Implementation for partial validation (e.g., form field updates)
    // Similar logic but allows missing fields
    return { success: true, data: input as Partial<CreateSpaceInput>, errors: [] };
  }
}
```

#### 2. Format Validation
Regex patterns and custom validators for specific data formats:

```typescript
// packages/core/src/domain/validators/FormatValidators.ts
export class FormatValidators {
  static readonly URL_PATTERN = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  static readonly HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
  static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  static readonly FILE_PATH_PATTERN = /^[^<>:"|?*]+$/;
  
  static validateUrl(url: string): ValidationResult<string> {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        errors: [new ValidationError('url', url, 'must be a string')]
      };
    }
    
    const trimmed = url.trim();
    if (!this.URL_PATTERN.test(trimmed)) {
      return {
        success: false,
        errors: [new ValidationError('url', url, 'must be a valid HTTP/HTTPS URL')]
      };
    }
    
    return { success: true, data: trimmed, errors: [] };
  }
  
  static validateHexColor(color: string): ValidationResult<string> {
    if (!color || typeof color !== 'string') {
      return {
        success: false,
        errors: [new ValidationError('color', color, 'must be a string')]
      };
    }
    
    if (!this.HEX_COLOR_PATTERN.test(color)) {
      return {
        success: false,
        errors: [new ValidationError('color', color, 'must be a valid hex color (e.g., #FF0000)')]
      };
    }
    
    return { success: true, data: color.toUpperCase(), errors: [] };
  }
  
  static validateFilePath(path: string): ValidationResult<string> {
    if (!path || typeof path !== 'string') {
      return {
        success: false,
        errors: [new ValidationError('path', path, 'must be a string')]
      };
    }
    
    if (!this.FILE_PATH_PATTERN.test(path)) {
      return {
        success: false,
        errors: [new ValidationError('path', path, 'contains invalid characters')]
      };
    }
    
    return { success: true, data: path.trim(), errors: [] };
  }
}
```

#### 3. Business Rules Validation
Custom validators for domain-specific logic:

```typescript
// packages/core/src/domain/validators/BusinessRuleValidators.ts
export class BusinessRuleValidators {
  constructor(
    private readonly spacesRepository: ISpacesRepository,
    private readonly spaceItemsRepository: ISpaceItemsRepository
  ) {}
  
  async validateUniqueSpaceName(profileId: string, name: string, excludeId?: string): Promise<ValidationResult<string>> {
    const existingSpaces = await this.spacesRepository.getAllSpaces(profileId);
    const duplicate = existingSpaces.find(space => 
      space.name.toLowerCase() === name.toLowerCase() && 
      space.id !== excludeId
    );
    
    if (duplicate) {
      return {
        success: false,
        errors: [new ValidationError('name', name, 'space name must be unique within profile')]
      };
    }
    
    return { success: true, data: name, errors: [] };
  }
  
  async validateParentItemExists(parentId: string | null, spaceId: string): Promise<ValidationResult<string | null>> {
    if (!parentId) {
      return { success: true, data: null, errors: [] };
    }
    
    const parentItem = await this.spaceItemsRepository.getItemById(parentId);
    if (!parentItem) {
      return {
        success: false,
        errors: [new ValidationError('parentId', parentId, 'parent item does not exist')]
      };
    }
    
    if (parentItem.spaceId !== spaceId) {
      return {
        success: false,
        errors: [new ValidationError('parentId', parentId, 'parent item must be in the same space')]
      };
    }
    
    if (parentItem.type !== SpaceItemType.Folder && parentItem.type !== SpaceItemType.LocalFolder) {
      return {
        success: false,
        errors: [new ValidationError('parentId', parentId, 'parent item must be a folder')]
      };
    }
    
    return { success: true, data: parentId, errors: [] };
  }
  
  validateCircularReference(itemId: string, parentId: string | null, allItems: SpaceItemEntity[]): ValidationResult<string | null> {
    if (!parentId) {
      return { success: true, data: null, errors: [] };
    }
    
    // Check for circular reference by traversing parent chain
    const visited = new Set<string>();
    let currentParentId = parentId;
    
    while (currentParentId) {
      if (currentParentId === itemId) {
        return {
          success: false,
          errors: [new ValidationError('parentId', parentId, 'circular reference detected')]
        };
      }
      
      if (visited.has(currentParentId)) {
        // Infinite loop in parent chain - data corruption
        return {
          success: false,
          errors: [new ValidationError('parentId', parentId, 'invalid parent chain detected')]
        };
      }
      
      visited.add(currentParentId);
      const parentItem = allItems.find(item => item.id === currentParentId);
      currentParentId = parentItem?.parentId || null;
    }
    
    return { success: true, data: parentId, errors: [] };
  }
}
```

#### 4. Sanitization
XSS prevention and data cleaning:

```typescript
// packages/core/src/domain/validators/DataSanitizer.ts
export class DataSanitizer {
  static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .slice(0, 1000); // Limit length
  }
  
  static sanitizeUrl(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    const trimmed = input.trim();
    
    // Only allow http/https protocols
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    
    return trimmed.slice(0, 2048); // Limit URL length
  }
  
  static sanitizeFileName(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>:"|?*]/g, '') // Remove invalid file name characters
      .replace(/\.\./g, '') // Remove directory traversal attempts
      .slice(0, 255); // Limit file name length
  }
}
```

### Implementation Approach

#### Client-side Validation for Immediate Feedback
```typescript
// packages/react-ui/src/hooks/useFormValidation.ts
import { useState, useCallback, useMemo } from 'react';

export function useFormValidation<T>(
  validator: ValidationSchema<T>,
  initialValues: Partial<T> = {}
) {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const validateField = useCallback((field: keyof T, value: unknown) => {
    const result = validator.validatePartial({ [field]: value });
    const fieldErrors = result.errors.filter(error => error.field === field);
    
    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors.length > 0 ? fieldErrors[0].message : ''
    }));
    
    return fieldErrors.length === 0;
  }, [validator]);
  
  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Validate on change if field has been touched
    if (touched[field as string]) {
      validateField(field, value);
    }
  }, [validateField, touched]);
  
  const setTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field as string]: true }));
    validateField(field, values[field]);
  }, [validateField, values]);
  
  const validateAll = useCallback(() => {
    const result = validator.validate(values);
    
    if (!result.success) {
      const errorMap: Record<string, string> = {};
      result.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return false;
    }
    
    setErrors({});
    return true;
  }, [validator, values]);
  
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && Object.keys(values).length > 0;
  }, [errors, values]);
  
  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched,
    validateAll,
    reset: () => {
      setValues(initialValues);
      setErrors({});
      setTouched({});
    }
  };
}
```

#### Server-side Validation for Security
All use cases perform comprehensive validation before executing business logic:

```typescript
// packages/core/src/application/use-cases/spaces/CreateSpaceUseCase.ts
export class CreateSpaceUseCase {
  constructor(
    private readonly spacesRepository: ISpacesRepository,
    private readonly eventBus: IEventBus,
    private readonly validator: CreateSpaceValidator,
    private readonly businessRules: BusinessRuleValidators
  ) {}
  
  async execute(input: CreateSpaceInput): Promise<CreateSpaceOutput> {
    // 1. Schema validation
    const schemaResult = this.validator.validate(input);
    if (!schemaResult.success) {
      throw new ValidationError('input', input, schemaResult.errors.map(e => e.message).join(', '));
    }
    
    const validatedInput = schemaResult.data!;
    
    // 2. Sanitize input
    const sanitizedName = DataSanitizer.sanitizeString(validatedInput.name);
    if (!sanitizedName) {
      throw new ValidationError('name', validatedInput.name, 'space name cannot be empty after sanitization');
    }
    
    // 3. Business rule validation
    const uniqueNameResult = await this.businessRules.validateUniqueSpaceName(
      validatedInput.profileId, 
      sanitizedName
    );
    if (!uniqueNameResult.success) {
      throw new BusinessRuleError('duplicate space name', { name: sanitizedName });
    }
    
    // 4. Format validation
    const colorResult = FormatValidators.validateHexColor(validatedInput.accentColor || '#6D5AE6');
    if (!colorResult.success) {
      throw new ValidationError('accentColor', validatedInput.accentColor, colorResult.errors[0].message);
    }
    
    // 5. Execute business logic
    const existingSpaces = await this.spacesRepository.getAllSpaces(validatedInput.profileId);
    const nextOrder = existingSpaces.length;
    
    const space = await this.spacesRepository.createSpace({
      id: generateId(),
      profileId: validatedInput.profileId,
      userId: validatedInput.userId,
      name: sanitizedName,
      iconName: validatedInput.iconName || 'folder',
      accentColor: colorResult.data!,
      order: nextOrder,
      isExpanded: true,
    });
    
    // 6. Emit event
    await this.eventBus.publish(new SpaceCreatedEvent({ 
      spaceId: space.id, 
      profileId: validatedInput.profileId 
    }));
    
    return { space };
  }
}
```

### Validation Triggers

#### 1. On Input Change (Debounced)
```typescript
// packages/react-ui/src/components/forms/CreateSpaceForm.tsx
export function CreateSpaceForm({ onSubmit, onCancel }: Props) {
  const validator = useMemo(() => new CreateSpaceValidator(), []);
  const { values, errors, setValue, setTouched, validateAll } = useFormValidation(validator);
  
  // Debounced validation on input change
  const debouncedValidation = useMemo(
    () => debounce((field: string, value: unknown) => {
      if (touched[field]) {
        validateField(field, value);
      }
    }, 300),
    [touched, validateField]
  );
  
  const handleInputChange = useCallback((field: keyof CreateSpaceInput, value: unknown) => {
    setValue(field, value);
    debouncedValidation(field, value);
  }, [setValue, debouncedValidation]);
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={values.name || ''}
        onChange={(e) => handleInputChange('name', e.target.value)}
        onBlur={() => setTouched('name')}
        error={errors.name}
        placeholder="Enter space name"
      />
      {/* Other fields... */}
    </form>
  );
}
```

#### 2. On Field Blur
Field validation triggers when user leaves a field to provide immediate feedback.

#### 3. On Form Submission
Comprehensive validation before submitting data to use cases.

#### 4. On Data Persistence
Final validation layer in use cases before database operations.

### Validation State Management

```typescript
// packages/react-ui/src/stores/validationStore.ts
interface ValidationState {
  fieldErrors: Record<string, Record<string, string>>; // formId -> field -> error
  formValid: Record<string, boolean>; // formId -> isValid
  
  setFieldError: (formId: string, field: string, error: string) => void;
  clearFieldError: (formId: string, field: string) => void;
  setFormValid: (formId: string, isValid: boolean) => void;
  clearForm: (formId: string) => void;
}

export const useValidationStore = create<ValidationState>((set) => ({
  fieldErrors: {},
  formValid: {},
  
  setFieldError: (formId, field, error) =>
    set((state) => ({
      fieldErrors: {
        ...state.fieldErrors,
        [formId]: {
          ...state.fieldErrors[formId],
          [field]: error
        }
      }
    })),
    
  clearFieldError: (formId, field) =>
    set((state) => ({
      fieldErrors: {
        ...state.fieldErrors,
        [formId]: {
          ...state.fieldErrors[formId],
          [field]: ''
        }
      }
    })),
    
  setFormValid: (formId, isValid) =>
    set((state) => ({
      formValid: {
        ...state.formValid,
        [formId]: isValid
      }
    })),
    
  clearForm: (formId) =>
    set((state) => ({
      fieldErrors: {
        ...state.fieldErrors,
        [formId]: {}
      },
      formValid: {
        ...state.formValid,
        [formId]: false
      }
    }))
}));
```

## Database Migration & Validation

**Dependencies:** Spec 001 (Project foundation setup)

### Schema Validation

Before executing any migration, the system must validate database schema compatibility:

#### Pre-Migration Checks
```typescript
// packages/infrastructure/src/persistence/sqlite/validation/SchemaValidator.ts
export class SchemaValidator {
  constructor(private readonly db: Database.Database) {}
  
  async validateSchema(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // Check required tables exist
    const requiredTables = ['spaces', 'space_items', 'migrations'];
    for (const table of requiredTables) {
      if (!await this.tableExists(table)) {
        result.errors.push(`Required table '${table}' not found`);
        result.isValid = false;
      }
    }
    
    // Validate column types and constraints
    await this.validateSpacesTable(result);
    await this.validateSpaceItemsTable(result);
    
    return result;
  }
  
  private async tableExists(tableName: string): Promise<boolean> {
    const row = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(tableName);
    
    return row !== undefined;
  }
  
  private async validateSpacesTable(result: ValidationResult): Promise<void> {
    const schema = this.db.prepare("PRAGMA table_info(spaces)").all();
    
    const requiredColumns = [
      { name: 'id', type: 'TEXT', notNull: true },
      { name: 'profile_id', type: 'TEXT', notNull: true },
      { name: 'user_id', type: 'TEXT', notNull: true },
      { name: 'name', type: 'TEXT', notNull: true },
      { name: 'accent_color', type: 'TEXT', notNull: true },
      { name: 'icon_name', type: 'TEXT', notNull: true },
      { name: 'sort_order', type: 'INTEGER', notNull: true },
      { name: 'is_expanded', type: 'INTEGER', notNull: true },
      { name: 'created_at', type: 'TEXT', notNull: true }
    ];
    
    this.validateTableColumns('spaces', schema, requiredColumns, result);
  }
  
  private validateTableColumns(
    tableName: string,
    actualSchema: any[],
    requiredColumns: ColumnSpec[],
    result: ValidationResult
  ): void {
    for (const required of requiredColumns) {
      const actual = actualSchema.find(col => col.name === required.name);
      
      if (!actual) {
        result.errors.push(`Missing column '${required.name}' in table '${tableName}'`);
        result.isValid = false;
        continue;
      }
      
      if (actual.type !== required.type) {
        result.warnings.push(
          `Column '${required.name}' in table '${tableName}' has type '${actual.type}', expected '${required.type}'`
        );
      }
      
      if (required.notNull && !actual.notnull) {
        result.warnings.push(
          `Column '${required.name}' in table '${tableName}' allows NULL values`
        );
      }
    }
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ColumnSpec {
  name: string;
  type: string;
  notNull: boolean;
}
```

#### Version Compatibility Matrix
```typescript
// packages/infrastructure/src/persistence/sqlite/migration/VersionCompatibility.ts
export class VersionCompatibility {
  private static readonly SUPPORTED_VERSIONS = [
    { version: '1.0.0', schemaVersion: 1 },
    { version: '1.1.0', schemaVersion: 2 },
    { version: '1.2.0', schemaVersion: 3 },
  ];
  
  static async getCurrentVersion(db: Database.Database): Promise<number> {
    try {
      const row = db.prepare(`
        SELECT schema_version FROM migrations 
        ORDER BY applied_at DESC LIMIT 1
      `).get();
      
      return row?.schema_version || 0;
    } catch (error) {
      // If migrations table doesn't exist, assume version 0
      return 0;
    }
  }
  
  static isVersionSupported(version: number): boolean {
    return this.SUPPORTED_VERSIONS.some(v => v.schemaVersion === version);
  }
  
  static getRequiredMigrations(currentVersion: number, targetVersion: number): Migration[] {
    return MIGRATIONS.filter(m => 
      m.fromVersion >= currentVersion && m.toVersion <= targetVersion
    );
  }
}
```

### Data Integrity Verification

Comprehensive data integrity checks must be performed before and after migration:

#### Pre-Migration Integrity Checks
```typescript
// packages/infrastructure/src/persistence/sqlite/validation/IntegrityChecker.ts
export class IntegrityChecker {
  constructor(private readonly db: Database.Database) {}
  
  async performIntegrityCheck(): Promise<IntegrityResult> {
    const result: IntegrityResult = {
      isValid: true,
      issues: []
    };
    
    // Check foreign key relationships
    await this.checkForeignKeyIntegrity(result);
    
    // Validate data types and formats
    await this.validateDataFormats(result);
    
    // Check for duplicate primary keys
    await this.checkDuplicateKeys(result);
    
    // Validate required fields
    await this.validateRequiredFields(result);
    
    return result;
  }
  
  private async checkForeignKeyIntegrity(result: IntegrityResult): Promise<void> {
    // Check space_items.space_id references spaces.id
    const orphanedItems = this.db.prepare(`
      SELECT si.id, si.space_id 
      FROM space_items si 
      LEFT JOIN spaces s ON si.space_id = s.id 
      WHERE s.id IS NULL
    `).all();
    
    if (orphanedItems.length > 0) {
      result.issues.push({
        type: 'foreign_key_violation',
        table: 'space_items',
        message: `${orphanedItems.length} items reference non-existent spaces`,
        data: orphanedItems
      });
      result.isValid = false;
    }
    
    // Check space_items.parent_id references space_items.id
    const orphanedChildren = this.db.prepare(`
      SELECT si1.id, si1.parent_id 
      FROM space_items si1 
      LEFT JOIN space_items si2 ON si1.parent_id = si2.id 
      WHERE si1.parent_id IS NOT NULL AND si2.id IS NULL
    `).all();
    
    if (orphanedChildren.length > 0) {
      result.issues.push({
        type: 'foreign_key_violation',
        table: 'space_items',
        message: `${orphanedChildren.length} items reference non-existent parent items`,
        data: orphanedChildren
      });
      result.isValid = false;
    }
  }
  
  private async validateDataFormats(result: IntegrityResult): Promise<void> {
    // Validate hex colors
    const invalidColors = this.db.prepare(`
      SELECT id, accent_color 
      FROM spaces 
      WHERE accent_color NOT GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'
    `).all();
    
    if (invalidColors.length > 0) {
      result.issues.push({
        type: 'invalid_format',
        table: 'spaces',
        message: `${invalidColors.length} spaces have invalid accent_color format`,
        data: invalidColors
      });
    }
    
    // Validate URLs
    const invalidUrls = this.db.prepare(`
      SELECT id, path 
      FROM space_items 
      WHERE type = 'link' AND (path IS NULL OR path = '')
    `).all();
    
    if (invalidUrls.length > 0) {
      result.issues.push({
        type: 'invalid_format',
        table: 'space_items',
        message: `${invalidUrls.length} link items have invalid or empty URLs`,
        data: invalidUrls
      });
    }
  }
  
  private async checkDuplicateKeys(result: IntegrityResult): Promise<void> {
    const tables = ['spaces', 'space_items'];
    
    for (const table of tables) {
      const duplicates = this.db.prepare(`
        SELECT id, COUNT(*) as count 
        FROM ${table} 
        GROUP BY id 
        HAVING COUNT(*) > 1
      `).all();
      
      if (duplicates.length > 0) {
        result.issues.push({
          type: 'duplicate_key',
          table,
          message: `${duplicates.length} duplicate primary keys found`,
          data: duplicates
        });
        result.isValid = false;
      }
    }
  }
}

interface IntegrityResult {
  isValid: boolean;
  issues: IntegrityIssue[];
}

interface IntegrityIssue {
  type: 'foreign_key_violation' | 'invalid_format' | 'duplicate_key' | 'missing_required';
  table: string;
  message: string;
  data: any[];
}
```

### Migration Process

A robust, step-by-step migration process with progress monitoring and rollback capabilities:

#### Migration Executor
```typescript
// packages/infrastructure/src/persistence/sqlite/migration/MigrationExecutor.ts
export class MigrationExecutor {
  constructor(
    private readonly db: Database.Database,
    private readonly logger: ILogger
  ) {}
  
  async executeMigration(migration: Migration): Promise<MigrationResult> {
    const backupPath = await this.createBackup();
    
    try {
      this.logger.info(`Starting migration: ${migration.name}`);
      
      // Begin transaction
      this.db.exec('BEGIN TRANSACTION');
      
      // Execute migration steps
      const result = await this.executeSteps(migration);
      
      // Verify migration success
      await this.verifyMigration(migration);
      
      // Commit transaction
      this.db.exec('COMMIT');
      
      // Record migration
      await this.recordMigration(migration);
      
      this.logger.info(`Migration completed successfully: ${migration.name}`);
      
      return {
        success: true,
        backupPath,
        executedSteps: result.executedSteps
      };
      
    } catch (error) {
      // Rollback transaction
      this.db.exec('ROLLBACK');
      
      this.logger.error(`Migration failed: ${migration.name}`, error);
      
      // Attempt to restore from backup
      await this.restoreFromBackup(backupPath);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        backupPath
      };
    }
  }
  
  private async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.getDatabasePath()}.backup.${timestamp}`;
    
    await this.copyFile(this.getDatabasePath(), backupPath);
    
    this.logger.info(`Database backup created: ${backupPath}`);
    
    return backupPath;
  }
  
  private async executeSteps(migration: Migration): Promise<{ executedSteps: string[] }> {
    const executedSteps: string[] = [];
    
    for (const step of migration.steps) {
      this.logger.debug(`Executing step: ${step.description}`);
      
      try {
        if (step.sql) {
          this.db.exec(step.sql);
        }
        
        if (step.customFunction) {
          await step.customFunction(this.db);
        }
        
        executedSteps.push(step.description);
        
      } catch (error) {
        throw new Error(`Migration step failed: ${step.description}. Error: ${error}`);
      }
    }
    
    return { executedSteps };
  }
  
  private async verifyMigration(migration: Migration): Promise<void> {
    if (migration.verification) {
      const isValid = await migration.verification(this.db);
      if (!isValid) {
        throw new Error(`Migration verification failed: ${migration.name}`);
      }
    }
  }
  
  private async recordMigration(migration: Migration): Promise<void> {
    this.db.prepare(`
      INSERT INTO migrations (id, name, applied_at, schema_version)
      VALUES (?, ?, ?, ?)
    `).run(
      migration.id,
      migration.name,
      new Date().toISOString(),
      migration.toVersion
    );
  }
}

interface Migration {
  id: string;
  name: string;
  fromVersion: number;
  toVersion: number;
  steps: MigrationStep[];
  verification?: (db: Database.Database) => Promise<boolean>;
}

interface MigrationStep {
  description: string;
  sql?: string;
  customFunction?: (db: Database.Database) => Promise<void>;
}

interface MigrationResult {
  success: boolean;
  error?: string;
  backupPath: string;
  executedSteps?: string[];
}
```

### Testing Requirements

Comprehensive testing strategy for migration processes:

#### Migration Testing Framework
```typescript
// packages/infrastructure/src/persistence/sqlite/migration/__tests__/MigrationTestFramework.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

export class MigrationTestFramework {
  private testDb: Database.Database;
  private originalDbPath: string;
  
  async setupTestEnvironment(): Promise<void> {
    // Create isolated test database
    this.testDb = new Database(':memory:');
    
    // Load test data fixtures
    await this.loadTestFixtures();
  }
  
  async testMigration(migration: Migration): Promise<TestResult> {
    const result: TestResult = {
      passed: false,
      errors: [],
      performance: { duration: 0 }
    };
    
    const startTime = Date.now();
    
    try {
      // Execute migration
      const executor = new MigrationExecutor(this.testDb, new TestLogger());
      const migrationResult = await executor.executeMigration(migration);
      
      if (!migrationResult.success) {
        result.errors.push(`Migration execution failed: ${migrationResult.error}`);
        return result;
      }
      
      // Verify data integrity post-migration
      const integrityChecker = new IntegrityChecker(this.testDb);
      const integrityResult = await integrityChecker.performIntegrityCheck();
      
      if (!integrityResult.isValid) {
        result.errors.push(...integrityResult.issues.map(i => i.message));
        return result;
      }
      
      // Test rollback capability
      await this.testRollback(migration);
      
      result.passed = true;
      
    } catch (error) {
      result.errors.push(`Test execution failed: ${error}`);
    } finally {
      result.performance.duration = Date.now() - startTime;
    }
    
    return result;
  }
  
  private async testRollback(migration: Migration): Promise<void> {
    // Implementation depends on rollback strategy
    // For now, verify backup restoration works
  }
  
  async tearDown(): Promise<void> {
    if (this.testDb) {
      this.testDb.close();
    }
  }
}

interface TestResult {
  passed: boolean;
  errors: string[];
  performance: {
    duration: number;
  };
}
```

#### Performance Impact Assessment
```typescript
// packages/infrastructure/src/persistence/sqlite/migration/PerformanceAssessment.ts
export class PerformanceAssessment {
  constructor(private readonly db: Database.Database) {}
  
  async assessMigrationPerformance(migration: Migration): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      migrationTime: 0,
      beforeStats: await this.getDatabaseStats(),
      afterStats: null,
      queryPerformance: []
    };
    
    const startTime = Date.now();
    
    // Execute migration (in test environment)
    const executor = new MigrationExecutor(this.db, new TestLogger());
    await executor.executeMigration(migration);
    
    report.migrationTime = Date.now() - startTime;
    report.afterStats = await this.getDatabaseStats();
    
    // Test key query performance
    report.queryPerformance = await this.benchmarkQueries();
    
    return report;
  }
  
  private async getDatabaseStats(): Promise<DatabaseStats> {
    const stats = this.db.prepare('PRAGMA database_list').all();
    const pageCount = this.db.prepare('PRAGMA page_count').get();
    const pageSize = this.db.prepare('PRAGMA page_size').get();
    
    return {
      fileSize: pageCount.page_count * pageSize.page_size,
      tableCount: this.db.prepare(`
        SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'
      `).get().count,
      indexCount: this.db.prepare(`
        SELECT COUNT(*) as count FROM sqlite_master WHERE type='index'
      `).get().count
    };
  }
  
  private async benchmarkQueries(): Promise<QueryBenchmark[]> {
    const queries = [
      { name: 'getAllSpaces', sql: 'SELECT * FROM spaces ORDER BY sort_order' },
      { name: 'getSpaceItems', sql: 'SELECT * FROM space_items WHERE space_id = ?' },
      { name: 'searchItems', sql: 'SELECT * FROM space_items WHERE name LIKE ?' }
    ];
    
    const benchmarks: QueryBenchmark[] = [];
    
    for (const query of queries) {
      const startTime = Date.now();
      
      // Execute query multiple times for average
      for (let i = 0; i < 100; i++) {
        this.db.prepare(query.sql).all();
      }
      
      benchmarks.push({
        queryName: query.name,
        averageTime: (Date.now() - startTime) / 100
      });
    }
    
    return benchmarks;
  }
}

interface PerformanceReport {
  migrationTime: number;
  beforeStats: DatabaseStats;
  afterStats: DatabaseStats | null;
  queryPerformance: QueryBenchmark[];
}

interface DatabaseStats {
  fileSize: number;
  tableCount: number;
  indexCount: number;
}

interface QueryBenchmark {
  queryName: string;
  averageTime: number;
}
```

---

## Flutter Feature Parity Requirements

> [!IMPORTANT]
> All features implemented in the Flutter project must be replicated in the Electron version.

### Space Management Features

| Feature | Flutter Implementation | Electron Status |
|---------|------------------------|----------------|
| Create Space | `SpacesList.createSpace()` | 🔴 Not Started |
| Delete Space | `SpacesList.deleteSpace()` | 🔴 Not Started |
| Rename Space | `SpacesList.renameSpace()` | 🔴 Not Started |
| Update Space (icon, color) | `SpacesList.updateSpace()` | 🔴 Not Started |
| Reorder Spaces | `SpacesList.reorderSpaces()` | 🔴 Not Started |
| Space Theme Picker | `ThemePickerDialog` | 🔴 Not Started |

### Space Item Management Features

| Feature | Flutter Implementation | Electron Status |
|---------|------------------------|----------------|
| Add Link to Space | `SpacesList.addItemToSpace()` | 🔴 Not Started |
| Add Folder | Create folder item | 🔴 Not Started |
| Delete Item | `SpacesList.deleteItem()` | 🔴 Not Started |
| Rename Item | `SpacesList.renameItem()` | 🔴 Not Started |
| Move Item (drag & drop) | `SpacesList.moveItem()` | 🔴 Not Started |
| Reorder Items | `SpacesList.reorderItem()` | 🔴 Not Started |
| Increment Visit Count | `SpacesList.incrementVisitCount()` | 🔴 Not Started |

### Pin System Features

| Feature | Flutter Implementation | Electron Status |
|---------|------------------------|----------------|
| Pin Item | `SpacesList.pinItem()` | 🔴 Not Started |
| Unpin Item | `SpacesList.unpinItem()` | 🔴 Not Started |
| Reorder Pins | `SpacesList.reorderPins()` | 🔴 Not Started |
| Pinned Links Grid (5 cols) | `PinnedLinksGrid` | 🔴 Not Started |

### Local File System Features

| Feature | Flutter Implementation | Electron Status |
|---------|------------------------|----------------|
| Import Local Folder | `SpacesList.importLocalFolder()` | 🔴 Not Started |
| Import Local File | `SpacesList.importLocalFile()` | 🔴 Not Started |
| Load Folder Children | `localFolderChildrenProvider` | 🔴 Not Started |
| Security Bookmark (macOS) | Native method channel | 🔴 Not Started |

### Drag & Drop Features

| Feature | Flutter Implementation | Electron Status |
|---------|------------------------|----------------|
| Drag State Machine | `DragDropState` | 🔴 Not Started |
| Drop Indicators | `DropIndicator` provider | 🔴 Not Started |
| Folder Auto-Expand | `DragExpandedFolder` | 🔴 Not Started |
| Flash Animation | `FlashItemId` | 🔴 Not Started |
| Cross-Space Drag | Full implementation | 🔴 Not Started |

### Search & Discovery Features

| Feature | Flutter Implementation | Electron Status |
|---------|------------------------|----------------|
| Search Items | `SpacesSearch` provider | 🔴 Not Started |
| Recent Items | `recentItems` provider | 🔴 Not Started |
| Most Visited Items | `mostVisitedItems` provider | 🔴 Not Started |
| Duplicate URL Check | `isDuplicateUrl` provider | 🔴 Not Started |

### Navigation Features

| Feature | Flutter Implementation | Electron Status |
|---------|------------------------|----------------|
| Active Space Persistence | `ActiveSpaceId` provider | 🔴 Not Started |
| Current Profile ID | `CurrentProfileId` provider | 🔴 Not Started |
| Keyboard Focus Context | Separate sidebar/spaces focus | 🔴 Not Started |

### Metadata Extraction Features

| Feature | Flutter Implementation | Electron Status |
|---------|------------------------|----------------|
| Page Metadata Extraction | `MetadataExtractor` | 🔴 Not Started |
| Favicon URL Extraction | JavaScript injection | 🔴 Not Started |
| URL Validation | `isValidUrl()` | 🔴 Not Started |
| Item Type Detection | `detectItemType()` | 🔴 Not Started |

---

## Architectural Principles

### 1. Dependency Rule
> "Source code dependencies must point inward, toward higher-level policies."

```
┌────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ React Components │  │  Zustand Stores  │  │   Hooks/Context │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘  │
│           │                     │                      │           │
│           └─────────────────────┼──────────────────────┘           │
└─────────────────────────────────┼──────────────────────────────────┘
                                  │ depends on
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │    Use Cases     │  │      Facades     │  │    Services     │  │
│  │ (CreateSpace,    │  │ (SpacesFacade,   │  │ (Navigation,    │  │
│  │  DeleteItem...)  │  │  TabsFacade...)  │  │  Sync...)       │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘  │
│           │                     │                      │           │
│           └─────────────────────┼──────────────────────┘           │
└─────────────────────────────────┼──────────────────────────────────┘
                                  │ depends on
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                         DOMAIN LAYER                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │     Entities     │  │   Repository     │  │   Validators    │  │
│  │  (Space, Item,   │  │   Interfaces     │  │   & Rules       │  │
│  │   Profile...)    │  │  (Contracts)     │  │                 │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
│                                                                    │
│              🛡️ PURE TYPESCRIPT - NO EXTERNAL DEPS 🛡️              │
└────────────────────────────────────────────────────────────────────┘
                                  ▲
                                  │ implements
                                  │
┌────────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE LAYER                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  SQLite Repo     │  │  Electron IPC    │  │   File System   │  │
│  │  Implementation  │  │   Services       │  │   Services      │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  SurrealDB Repo  │  │   Tauri IPC      │  │   Remote API    │  │
│  │  (Future)        │  │   (Future)       │  │   (Future)      │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### 2. Contract-First Design
All layer boundaries are defined by TypeScript interfaces (contracts) in the Domain layer. Infrastructure provides implementations.

### 3. Facade Pattern
UI components interact with the Application layer through Facades - thin orchestration layers that coordinate use cases and maintain separation.

## Dependency Management

### Service Factory Pattern
Use a lightweight factory pattern for service instantiation instead of complex dependency injection frameworks:

```typescript
// packages/core/src/application/services/ServiceFactory.ts
export class ServiceFactory {
  private static instances = new Map<string, any>();
  
  static getService<T>(key: string, creator: () => T): T {
    if (!this.instances.has(key)) {
      this.instances.set(key, creator());
    }
    return this.instances.get(key);
  }
  
  static registerService<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }
  
  static clearServices(): void {
    this.instances.clear();
  }
  
  static hasService(key: string): boolean {
    return this.instances.has(key);
  }
}

// Usage example
const dbService = ServiceFactory.getService('database', () => new DatabaseService());
const spacesRepo = ServiceFactory.getService('spacesRepository', () => 
  new SqliteSpacesRepository(dbService)
);
```

### Service Registry
Simple object registry for singleton services without external dependencies:

```typescript
// packages/infrastructure/src/di/ServiceRegistry.ts
export interface ServiceRegistration<T = any> {
  key: string;
  factory: () => T;
  singleton: boolean;
  instance?: T;
}

export class ServiceRegistry {
  private registrations = new Map<string, ServiceRegistration>();
  
  register<T>(key: string, factory: () => T, singleton = true): void {
    this.registrations.set(key, {
      key,
      factory,
      singleton,
      instance: undefined
    });
  }
  
  get<T>(key: string): T {
    const registration = this.registrations.get(key);
    if (!registration) {
      throw new Error(`Service not registered: ${key}`);
    }
    
    if (registration.singleton) {
      if (!registration.instance) {
        registration.instance = registration.factory();
      }
      return registration.instance;
    }
    
    return registration.factory();
  }
  
  has(key: string): boolean {
    return this.registrations.has(key);
  }
  
  clear(): void {
    this.registrations.clear();
  }
}

// Global registry instance
export const serviceRegistry = new ServiceRegistry();

// Service keys
export const SERVICE_KEYS = {
  DATABASE: 'database',
  SPACES_REPOSITORY: 'spacesRepository',
  SPACE_ITEMS_REPOSITORY: 'spaceItemsRepository',
  EVENT_BUS: 'eventBus',
  LOGGER: 'logger',
  SPACES_FACADE: 'spacesFacade',
  SPACE_ITEMS_FACADE: 'spaceItemsFacade'
} as const;
```

### Initialization Pattern
Bootstrap services at application startup without framework dependencies:

```typescript
// packages/infrastructure/src/bootstrap/ServiceBootstrap.ts
import Database from 'better-sqlite3';
import { serviceRegistry, SERVICE_KEYS } from '../di/ServiceRegistry';

export class ServiceBootstrap {
  static async initialize(config: { databasePath: string }): Promise<void> {
    // Register database
    serviceRegistry.register(SERVICE_KEYS.DATABASE, () => {
      return new Database(config.databasePath);
    });
    
    // Register repositories
    serviceRegistry.register(SERVICE_KEYS.SPACES_REPOSITORY, () => {
      const db = serviceRegistry.get<Database.Database>(SERVICE_KEYS.DATABASE);
      return new SqliteSpacesRepository(db);
    });
    
    serviceRegistry.register(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY, () => {
      const db = serviceRegistry.get<Database.Database>(SERVICE_KEYS.DATABASE);
      return new SqliteSpaceItemsRepository(db);
    });
    
    // Register services
    serviceRegistry.register(SERVICE_KEYS.EVENT_BUS, () => {
      return new InMemoryEventBus();
    });
    
    serviceRegistry.register(SERVICE_KEYS.LOGGER, () => {
      return new ConsoleLogger();
    });
    
    // Register facades
    serviceRegistry.register(SERVICE_KEYS.SPACES_FACADE, () => {
      const spacesRepo = serviceRegistry.get(SERVICE_KEYS.SPACES_REPOSITORY);
      const eventBus = serviceRegistry.get(SERVICE_KEYS.EVENT_BUS);
      return new SpacesFacade(spacesRepo, eventBus);
    });
  }
  
  static shutdown(): void {
    // Close database connections
    const db = serviceRegistry.get<Database.Database>(SERVICE_KEYS.DATABASE);
    db?.close();
    
    // Clear all services
    serviceRegistry.clear();
  }
}

// App initialization
await ServiceBootstrap.initialize({
  databasePath: './data/spaces.sqlite'
});
```

## Error Handling Strategy

### Error Classification

The system uses a hierarchical error classification to ensure consistent handling across all layers:

#### 1. Domain Errors
Business logic violations that represent invalid operations within the domain:
- **ValidationError**: Input validation failures (empty space name, invalid URL format)
- **BusinessRuleError**: Domain rule violations (duplicate space names, circular folder references)
- **EntityNotFoundError**: Requested entity doesn't exist
- **ConcurrencyError**: Optimistic locking failures during concurrent updates

#### 2. Infrastructure Errors
Technical failures in external systems and resources:
- **DatabaseError**: SQLite connection, query, or constraint failures
- **FileSystemError**: Local file access, permission, or I/O failures
- **NetworkError**: Remote service connectivity or timeout issues
- **SerializationError**: Data format or parsing failures

#### 3. Application Errors
Coordination and workflow failures in the application layer:
- **AuthorizationError**: Insufficient permissions for requested operation
- **ConfigurationError**: Missing or invalid application configuration
- **DependencyError**: Required service or resource unavailable

#### 4. System Errors
Runtime and platform-level failures:
- **UnexpectedError**: Unhandled exceptions and runtime failures
- **ResourceError**: Memory, disk space, or system resource exhaustion

### Error Classes Package Location

```typescript
// packages/core/src/domain/errors/index.ts - Domain error definitions
export abstract class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  constructor(field: string, value: unknown, rule: string) {
    super(`Validation failed for ${field}: ${rule}`, 'VALIDATION_ERROR', {
      field, value, rule
    });
  }
}

export class BusinessRuleError extends DomainError {
  constructor(rule: string, context?: Record<string, unknown>) {
    super(`Business rule violation: ${rule}`, 'BUSINESS_RULE_ERROR', context);
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityType: string, id: string) {
    super(`${entityType} with id '${id}' not found`, 'ENTITY_NOT_FOUND', {
      entityType, id
    });
  }
}

// packages/infrastructure/src/errors/index.ts - Infrastructure error definitions
import { DomainError } from '@spayce/core/domain/errors';

export class DatabaseError extends DomainError {
  constructor(operation: string, originalError: Error) {
    super(`Database operation failed: ${operation}`, 'DATABASE_ERROR', {
      operation,
      originalError: originalError.message
    });
  }
}

export class FileSystemError extends DomainError {
  constructor(operation: string, path: string, originalError: Error) {
    super(`File system operation failed: ${operation}`, 'FILE_SYSTEM_ERROR', {
      operation,
      path,
      originalError: originalError.message
    });
  }
}

export class NetworkError extends DomainError {
  constructor(url: string, originalError: Error) {
    super(`Network request failed: ${url}`, 'NETWORK_ERROR', {
      url,
      originalError: originalError.message
    });
  }
}

// packages/core/src/application/errors/index.ts - Application error definitions
import { DomainError } from '@spayce/core/domain/errors';

export class AuthorizationError extends DomainError {
  constructor(operation: string, resource: string) {
    super(`Insufficient permissions for ${operation} on ${resource}`, 'AUTHORIZATION_ERROR', {
      operation, resource
    });
  }
}

export class ConfigurationError extends DomainError {
  constructor(setting: string, value?: unknown) {
    super(`Invalid configuration: ${setting}`, 'CONFIGURATION_ERROR', {
      setting, value
    });
  }
}

// packages/react-ui/src/errors/index.ts - UI-specific error definitions
import { DomainError } from '@spayce/core/domain/errors';

export class UIError extends DomainError {
  constructor(component: string, operation: string, originalError?: Error) {
    super(`UI error in ${component}: ${operation}`, 'UI_ERROR', {
      component,
      operation,
      originalError: originalError?.message
    });
  }
}

// Error type mapping for consistent imports
export const ErrorTypes = {
  // Core domain errors
  ValidationError: '@spayce/core/domain/errors/ValidationError',
  BusinessRuleError: '@spayce/core/domain/errors/BusinessRuleError',
  EntityNotFoundError: '@spayce/core/domain/errors/EntityNotFoundError',
  
  // Infrastructure errors
  DatabaseError: '@spayce/infrastructure/errors/DatabaseError',
  FileSystemError: '@spayce/infrastructure/errors/FileSystemError',
  NetworkError: '@spayce/infrastructure/errors/NetworkError',
  
  // Application errors
  AuthorizationError: '@spayce/core/application/errors/AuthorizationError',
  ConfigurationError: '@spayce/core/application/errors/ConfigurationError',
  
  // UI errors
  UIError: '@spayce/react-ui/errors/UIError'
} as const;
```

### Error Propagation Pattern

```typescript
// Domain Layer - Define error types
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  constructor(field: string, value: unknown, rule: string) {
    super(`Validation failed for ${field}: ${rule}`, 'VALIDATION_ERROR', {
      field, value, rule
    });
  }
}

// Use Case Layer - Throw domain errors
export class CreateSpaceUseCase {
  async execute(input: CreateSpaceInput): Promise<CreateSpaceOutput> {
    if (!input.name.trim()) {
      throw new ValidationError('name', input.name, 'cannot be empty');
    }
    
    try {
      const space = await this.spacesRepository.createSpace(spaceData);
      return { space };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw new DomainError('Failed to create space', 'PERSISTENCE_ERROR', {
          originalError: error.message
        });
      }
      throw error;
    }
  }
}

// Facade Layer - Transform errors for UI consumption
export class SpacesFacade {
  async createSpace(input: CreateSpaceInput): Promise<Result<SpaceEntity>> {
    try {
      const result = await this.createSpaceUseCase.execute(input);
      return { success: true, data: result.space };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { 
          success: false, 
          error: {
            type: 'validation',
            message: error.message,
            field: error.details?.field as string
          }
        };
      }
      
      return { 
        success: false, 
        error: {
          type: 'system',
          message: 'An unexpected error occurred. Please try again.'
        }
      };
    }
  }
}
```

### React Error Boundaries

React error boundaries provide a safety net for unhandled errors in the component tree, integrating with the design system from Spec 001:

```typescript
// packages/react-ui/src/components/error/DomainErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { ErrorLogger } from '@spayce/core/application/services/ErrorLogger';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorId: string | null;
  onRetry: () => void;
  onReload: () => void;
}

export class DomainErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context
    ErrorLogger.log(error, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

// packages/react-ui/src/components/error/ErrorFallback.tsx
import React from 'react';
import { ErrorFallbackProps } from './DomainErrorBoundary';
import { Button } from '@spayce/react-ui/components/common/Button';
import { Card } from '@spayce/react-ui/components/common/Card';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

export function ErrorFallback({ 
  error, 
  errorId, 
  onRetry, 
  onReload 
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        
        <h2 className="text-lg font-semibold mb-2">
          Something went wrong
        </h2>
        
        <p className="text-muted-foreground mb-6">
          An unexpected error occurred. You can try to recover or reload the application.
        </p>

        {isDevelopment && error && (
          <div className="mb-6 p-3 bg-muted rounded-md text-left">
            <p className="text-xs font-mono text-destructive">
              {error.message}
            </p>
            {errorId && (
              <p className="text-xs text-muted-foreground mt-1">
                Error ID: {errorId}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button
            onClick={onReload}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload App
          </Button>
        </div>
      </Card>
    </div>
  );
}

// packages/react-ui/src/components/error/GlobalErrorBoundary.tsx
import React from 'react';
import { DomainErrorBoundary } from './DomainErrorBoundary';
import { ErrorLogger } from '@spayce/core/application/services/ErrorLogger';

interface Props {
  children: React.ReactNode;
}

export function GlobalErrorBoundary({ children }: Props) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Additional global error handling
    console.error('Global error boundary caught:', error, errorInfo);
    
    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      ErrorLogger.reportToService(error, {
        type: 'react_error_boundary',
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <DomainErrorBoundary onError={handleError}>
      {children}
    </DomainErrorBoundary>
  );
}
```

### UI Error Handling Strategies

#### 1. Form Validation Errors
```typescript
// React Hook - Handle validation errors inline
export function useCreateSpace() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const createSpace = async (input: CreateSpaceInput) => {
    setErrors({});
    const result = await facade.createSpace(input);
    
    if (!result.success && result.error.type === 'validation') {
      setErrors({ [result.error.field]: result.error.message });
      return;
    }
    
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    
    toast.success('Space created successfully');
    return result.data;
  };
  
  return { createSpace, errors };
}
```

#### 2. Action Failure Notifications
```typescript
// Toast notification with retry capability
export function useDeleteSpace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (spaceId: string) => facade.deleteSpace(spaceId),
    onError: (error: any) => {
      toast.error('Failed to delete space', {
        action: {
          label: 'Retry',
          onClick: () => mutate(spaceId)
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['spaces']);
      toast.success('Space deleted successfully');
    }
  });
}
```

#### 3. Network and Connectivity Errors
```typescript
// Global network error handler
export function useNetworkErrorHandler() {
  useEffect(() => {
    const handleOnline = () => toast.success('Connection restored');
    const handleOffline = () => toast.warning('Connection lost. Working offline.');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}
```

### Error Recovery Mechanisms

#### 1. Automatic Retry with Exponential Backoff
```typescript
export class RetryableOperation {
  static async execute<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries || !isRetryableError(error)) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }
}
```

#### 2. Fallback Data Sources
```typescript
export class SpacesQuery {
  async execute(input: GetSpacesInput): Promise<SpaceEntity[]> {
    try {
      return await this.primaryRepository.getAllSpaces(input.profileId);
    } catch (error) {
      // Fallback to cached data
      const cached = await this.cacheRepository.getAllSpaces(input.profileId);
      if (cached.length > 0) {
        return cached;
      }
      throw error;
    }
  }
}
```

#### 3. Graceful Degradation
```typescript
export function SpacesList({ profileId }: Props) {
  const { data: spaces, error, isLoading } = useSpaces(profileId);
  
  if (isLoading) return <SpacesListSkeleton />;
  
  if (error) {
    return (
      <ErrorState
        title="Unable to load spaces"
        message="Please check your connection and try again"
        actions={[
          { label: 'Retry', onClick: () => refetch() },
          { label: 'Work Offline', onClick: () => setOfflineMode(true) }
        ]}
      />
    );
  }
  
  return <SpacesListContent spaces={spaces} />;
}
```

### Error Logging and Monitoring

```typescript
// Central error logger
export class ErrorLogger {
  static log(error: Error, context: Record<string, unknown> = {}) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', errorReport);
    }
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorReport);
    }
  }
  
  private static async sendToMonitoringService(report: ErrorReport) {
    // Implementation depends on monitoring service
  }
}
```

## Requirements

### R1: Domain Layer - Core Entities & Contracts

> [!IMPORTANT]
> The Domain layer contains ZERO external dependencies. Pure TypeScript only.

#### 1.1 Entity Definitions

Create immutable entity classes for all domain objects:

```typescript
// packages/core/src/domain/entities/Space.ts
export interface SpaceEntity {
  readonly id: string;
  readonly profileId: string;
  readonly userId: string;
  readonly name: string;
  readonly accentColor: string;  // Hex color e.g., '#6D5AE6'
  readonly iconName: string;     // e.g., 'folder', 'code', 'book'
  readonly order: number;
  readonly isExpanded: boolean;
  readonly createdAt: Date;
}

// packages/core/src/domain/entities/SpaceItem.ts
export enum SpaceItemType {
  Link = 'link',
  File = 'file',
  Folder = 'folder',
  LocalFolder = 'localFolder',
  LocalFile = 'localFile',
}

export interface SpaceItemEntity {
  readonly id: string;
  readonly spaceId: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly path: string;
  readonly type: SpaceItemType;
  readonly isExpanded: boolean;
  readonly sortOrder: number;
  readonly createdAt: Date;
  
  // Link metadata
  readonly faviconUrl: string | null;
  readonly description: string | null;
  readonly visitCount: number;
  readonly lastVisited: Date | null;
  
  // Pin fields
  readonly isPinned: boolean;
  readonly pinPosition: number | null;
  
  // Local file system
  readonly localPath: string | null;
  readonly securityBookmark: string | null;
  readonly lastSyncedAt: Date | null;
  readonly isWatching: boolean;
}
```

#### 1.2 Repository Contracts (Interfaces)

```typescript
// packages/core/src/domain/repositories/ISpacesRepository.ts
export interface ISpacesRepository {
  // Query operations
  getAllSpaces(profileId: string): Promise<SpaceEntity[]>;
  getSpaceById(id: string): Promise<SpaceEntity | null>;
  searchSpaces(profileId: string, query: string): Promise<SpaceEntity[]>;
  
  // Command operations
  createSpace(space: Omit<SpaceEntity, 'createdAt'>): Promise<SpaceEntity>;
  updateSpace(space: SpaceEntity): Promise<void>;
  deleteSpace(id: string): Promise<void>;
  reorderSpaces(profileId: string, orderedIds: string[]): Promise<void>;
}

// packages/core/src/domain/repositories/ISpaceItemsRepository.ts
export interface ISpaceItemsRepository {
  // Query operations
  getItemsBySpaceId(spaceId: string): Promise<SpaceItemEntity[]>;
  getItemById(id: string): Promise<SpaceItemEntity | null>;
  getItemChildren(parentId: string): Promise<SpaceItemEntity[]>;
  getPinnedItems(spaceId: string): Promise<SpaceItemEntity[]>;
  searchItems(profileId: string, query: string): Promise<SpaceItemEntity[]>;
  
  // Command operations
  createItem(item: Omit<SpaceItemEntity, 'createdAt'>): Promise<SpaceItemEntity>;
  updateItem(item: SpaceItemEntity): Promise<void>;
  deleteItem(id: string): Promise<void>;
  moveItem(itemId: string, newSpaceId: string, newParentId: string | null, newOrder: number): Promise<void>;
  
  // Pin operations
  pinItem(itemId: string, position: number): Promise<void>;
  unpinItem(itemId: string): Promise<void>;
  
  // Visit tracking
  incrementVisitCount(itemId: string): Promise<void>;
}
```

#### 1.3 Value Objects

```typescript
// packages/core/src/domain/value-objects/Color.ts
export class Color {
  private constructor(public readonly hex: string) {}
  
  static fromHex(hex: string): Color | null {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
    return new Color(hex);
  }
  
  static fromRGB(r: number, g: number, b: number): Color {
    return new Color(`#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`);
  }
  
  toRGB(): { r: number; g: number; b: number } {
    const hex = this.hex.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
}
```

#### 1.4 Domain Events

```typescript
// packages/core/src/domain/events/DomainEvent.ts
export interface DomainEvent {
  readonly type: string;
  readonly timestamp: Date;
  readonly payload: unknown;
}

export class SpaceCreatedEvent implements DomainEvent {
  readonly type = 'space.created';
  readonly timestamp = new Date();
  constructor(readonly payload: { spaceId: string; profileId: string }) {}
}

export class SpaceItemMovedEvent implements DomainEvent {
  readonly type = 'space-item.moved';
  readonly timestamp = new Date();
  constructor(readonly payload: { 
    itemId: string; 
    fromSpaceId: string; 
    toSpaceId: string;
    fromParentId: string | null;
    toParentId: string | null;
  }) {}
}
```

#### 1.5 Event Bus Implementation

```typescript
// packages/core/src/domain/services/IEventBus.ts
export interface IEventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string, 
    handler: (event: T) => Promise<void>
  ): void;
  unsubscribe(eventType: string, handler: (event: any) => Promise<void>): void;
  clear(): void;
}

// packages/infrastructure/src/services/InMemoryEventBus.ts
export class InMemoryEventBus implements IEventBus {
  private handlers = new Map<string, Array<(event: any) => Promise<void>>>();
  private logger?: ILogger;
  
  constructor(logger?: ILogger) {
    this.logger = logger;
  }
  
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    if (handlers.length === 0) {
      this.logger?.debug(`No handlers registered for event: ${event.type}`);
      return;
    }
    
    this.logger?.debug(`Publishing event ${event.type} to ${handlers.length} handlers`);
    
    // Execute all handlers in parallel with error isolation
    const results = await Promise.allSettled(
      handlers.map(handler => this.executeHandler(handler, event))
    );
    
    // Log any handler failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger?.error(`Event handler ${index} failed for ${event.type}:`, result.reason);
      }
    });
  }
  
  subscribe<T extends DomainEvent>(
    eventType: string, 
    handler: (event: T) => Promise<void>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    this.logger?.debug(`Handler subscribed to event: ${eventType}`);
  }
  
  unsubscribe(eventType: string, handler: (event: any) => Promise<void>): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;
    
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.logger?.debug(`Handler unsubscribed from event: ${eventType}`);
      
      // Clean up empty handler arrays
      if (handlers.length === 0) {
        this.handlers.delete(eventType);
      }
    }
  }
  
  clear(): void {
    this.handlers.clear();
    this.logger?.debug('All event handlers cleared');
  }
  
  private async executeHandler(
    handler: (event: any) => Promise<void>, 
    event: DomainEvent
  ): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      // Re-throw to be caught by Promise.allSettled
      throw new Error(`Event handler failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Diagnostic method for testing and debugging
  getHandlerCount(eventType?: string): number {
    if (eventType) {
      return this.handlers.get(eventType)?.length || 0;
    }
    return Array.from(this.handlers.values()).reduce((total, handlers) => total + handlers.length, 0);
  }
}

// packages/core/src/domain/services/ILogger.ts
export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}
```

---

### R2: Application Layer - Use Cases & Facades

#### 2.1 Use Cases

Each use case encapsulates a single business operation:

```typescript
// packages/core/src/application/use-cases/spaces/CreateSpaceUseCase.ts
export interface CreateSpaceInput {
  profileId: string;
  userId: string;
  name: string;
  iconName: string;
  accentColor: string;
}

export interface CreateSpaceOutput {
  space: SpaceEntity;
}

export class CreateSpaceUseCase {
  constructor(
    private readonly spacesRepository: ISpacesRepository,
    private readonly eventBus: IEventBus
  ) {}
  
  async execute(input: CreateSpaceInput): Promise<CreateSpaceOutput> {
    // Validate
    if (!input.name.trim()) {
      throw new DomainError('Space name cannot be empty');
    }
    
    // Get next order
    const existingSpaces = await this.spacesRepository.getAllSpaces(input.profileId);
    const nextOrder = existingSpaces.length;
    
    // Create
    const space = await this.spacesRepository.createSpace({
      id: generateId(),
      profileId: input.profileId,
      userId: input.userId,
      name: input.name.trim(),
      iconName: input.iconName || 'folder',
      accentColor: input.accentColor || '#6D5AE6',
      order: nextOrder,
      isExpanded: true,
    });
    
    // Emit event
    this.eventBus.emit(new SpaceCreatedEvent({ spaceId: space.id, profileId: input.profileId }));
    
    return { space };
  }
}
```

#### 2.2 Facades (Orchestrators)

Facades provide a simplified interface for the Presentation layer:

```typescript
// packages/core/src/application/facades/SpacesFacade.ts
export class SpacesFacade {
  // Inject all use cases
  constructor(
    private readonly createSpaceUseCase: CreateSpaceUseCase,
    private readonly deleteSpaceUseCase: DeleteSpaceUseCase,
    private readonly renameSpaceUseCase: RenameSpaceUseCase,
    private readonly reorderSpacesUseCase: ReorderSpacesUseCase,
    private readonly getSpacesQuery: GetSpacesQuery,
  ) {}
  
  // Simple methods for UI to call
  async createSpace(input: CreateSpaceInput): Promise<SpaceEntity> {
    const result = await this.createSpaceUseCase.execute(input);
    return result.space;
  }
  
  async getSpaces(profileId: string): Promise<SpaceEntity[]> {
    return this.getSpacesQuery.execute({ profileId });
  }
  
  async deleteSpace(spaceId: string): Promise<void> {
    await this.deleteSpaceUseCase.execute({ spaceId });
  }
  
  async renameSpace(spaceId: string, newName: string): Promise<void> {
    await this.renameSpaceUseCase.execute({ spaceId, newName });
  }
  
  async reorderSpaces(profileId: string, orderedIds: string[]): Promise<void> {
    await this.reorderSpacesUseCase.execute({ profileId, orderedIds });
  }
}
```

---

### R3: Infrastructure Layer - SQLite Implementation

#### 3.1 SQLite Repository Implementation

```typescript
// packages/infrastructure/src/persistence/sqlite/SqliteSpacesRepository.ts
import Database from 'better-sqlite3';

export class SqliteSpacesRepository implements ISpacesRepository {
  constructor(private readonly db: Database.Database) {}
  
  async getAllSpaces(profileId: string): Promise<SpaceEntity[]> {
    const rows = this.db.prepare(`
      SELECT id, profile_id, user_id, name, accent_color, icon_name, 
             sort_order, is_expanded, created_at
      FROM spaces 
      WHERE profile_id = ?
      ORDER BY sort_order ASC, created_at DESC
    `).all(profileId);
    
    return rows.map(this.mapRowToEntity);
  }
  
  async createSpace(space: Omit<SpaceEntity, 'createdAt'>): Promise<SpaceEntity> {
    const now = new Date();
    this.db.prepare(`
      INSERT INTO spaces (id, profile_id, user_id, name, accent_color, icon_name, 
                         sort_order, is_expanded, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      space.id, space.profileId, space.userId, space.name,
      space.accentColor, space.iconName, space.order, space.isExpanded ? 1 : 0,
      now.toISOString()
    );
    
    return { ...space, createdAt: now };
  }
  
  private mapRowToEntity(row: any): SpaceEntity {
    return {
      id: row.id,
      profileId: row.profile_id,
      userId: row.user_id,
      name: row.name,
      accentColor: row.accent_color,
      iconName: row.icon_name,
      order: row.sort_order,
      isExpanded: row.is_expanded === 1,
      createdAt: new Date(row.created_at),
    };
  }
}
```

#### 3.2 SQLite Integration with Flutter Database

> [!IMPORTANT]
> Import the existing Flutter SQLite database from `{Documents}/spaces.sqlite` to enable data sharing and avoid duplicate data entry.

```typescript
// packages/infrastructure/src/persistence/sqlite/FlutterDbMigration.ts
export class FlutterDbMigration {
  /**
   * The Flutter Spayce app stores its database at:
   * macOS: ~/Library/Containers/com.spayce.frontend/Data/Documents/spaces.sqlite
   * Windows: %APPDATA%/com.spayce.frontend/spaces.sqlite
   * Linux: ~/.local/share/com.spayce.frontend/spaces.sqlite
   */
  static getFlutterDbPath(): string {
    const platform = process.platform;
    const home = process.env.HOME || process.env.USERPROFILE || '';
    
    switch (platform) {
      case 'darwin':
        return `${home}/Library/Containers/com.spayce.frontend/Data/Documents/spaces.sqlite`;
      case 'win32':
        return `${process.env.APPDATA}/com.spayce.frontend/spaces.sqlite`;
      case 'linux':
        return `${home}/.local/share/com.spayce.frontend/spaces.sqlite`;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
  
  static async importOrConnect(targetDbPath: string): Promise<void> {
    // Strategy 1: Direct connection to Flutter DB
    // Strategy 2: Copy and migrate to Electron-specific location
    // Strategy 3: Symlink for shared access
  }
}
```

#### 3.3 Database Schema (SQLite)

```sql
-- Matches Flutter's Drift schema for compatibility
CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  accent_color TEXT NOT NULL DEFAULT '#6D5AE6',
  icon_name TEXT NOT NULL DEFAULT 'folder',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_expanded INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS space_items (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  type TEXT NOT NULL,
  is_expanded INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  
  -- Link metadata
  favicon_url TEXT,
  description TEXT,
  visit_count INTEGER NOT NULL DEFAULT 0,
  last_visited TEXT,
  
  -- Pin fields
  is_pinned INTEGER NOT NULL DEFAULT 0,
  pin_position INTEGER,
  
  -- Local file system fields (for localFolder/localFile types)
  local_path TEXT,
  security_bookmark TEXT,
  last_synced_at TEXT,
  is_watching INTEGER NOT NULL DEFAULT 0,
  
  FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spaces_profile ON spaces(profile_id);
CREATE INDEX IF NOT EXISTS idx_items_space ON space_items(space_id);
CREATE INDEX IF NOT EXISTS idx_items_parent ON space_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_items_pinned ON space_items(space_id, is_pinned);
```

> [!NOTE]
> The schema uses INTEGER for booleans (0/1) and TEXT for dates (ISO 8601 strings) to match SQLite conventions and Flutter's Drift ORM.

---

### R4: Presentation Layer - React Integration

#### 4.1 Data Fetching Strategy

Since no external query library is specified, we'll use vanilla React patterns with custom hooks for data management:

```typescript
// packages/react-ui/src/hooks/useSpaces.ts
import { useState, useEffect, useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure/di/ServiceRegistry';

interface UseSpacesResult {
  data: SpaceEntity[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSpaces(profileId: string): UseSpacesResult {
  const [data, setData] = useState<SpaceEntity[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
  
  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const spaces = await facade.getSpaces(profileId);
      setData(spaces);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [profileId, facade]);
  
  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);
  
  return {
    data,
    loading,
    error,
    refetch: fetchSpaces
  };
}

export function useCreateSpace() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
  
  const createSpace = useCallback(async (input: CreateSpaceInput): Promise<SpaceEntity | null> => {
    try {
      setLoading(true);
      setError(null);
      const space = await facade.createSpace(input);
      return space;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create space');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [facade]);
  
  return {
    createSpace,
    loading,
    error
  };
}

export function useDeleteSpace() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
  
  const deleteSpace = useCallback(async (spaceId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await facade.deleteSpace(spaceId);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete space');
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [facade]);
  
  return {
    deleteSpace,
    loading,
    error
  };
}
```

#### 4.2 Data Invalidation Pattern

Since we're not using a query library, we need a simple cache invalidation system:

```typescript
// packages/react-ui/src/hooks/useDataInvalidation.ts
import { useCallback, useRef } from 'react';

type InvalidationCallback = () => void;

class DataInvalidator {
  private callbacks = new Map<string, Set<InvalidationCallback>>();
  
  subscribe(key: string, callback: InvalidationCallback): () => void {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set());
    }
    
    this.callbacks.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.get(key)?.delete(callback);
      if (this.callbacks.get(key)?.size === 0) {
        this.callbacks.delete(key);
      }
    };
  }
  
  invalidate(key: string): void {
    const callbacks = this.callbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }
  
  invalidatePattern(pattern: string): void {
    for (const key of this.callbacks.keys()) {
      if (key.includes(pattern)) {
        this.invalidate(key);
      }
    }
  }
}

const globalInvalidator = new DataInvalidator();

export function useDataInvalidation(key: string, refetchFn: () => void) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    unsubscribeRef.current = globalInvalidator.subscribe(key, refetchFn);
    
    return () => {
      unsubscribeRef.current?.();
    };
  }, [key, refetchFn]);
}

export function invalidateData(key: string) {
  globalInvalidator.invalidate(key);
}

export function invalidatePattern(pattern: string) {
  globalInvalidator.invalidatePattern(pattern);
}

// Updated useSpaces hook with invalidation
export function useSpaces(profileId: string): UseSpacesResult {
  const [data, setData] = useState<SpaceEntity[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
  
  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const spaces = await facade.getSpaces(profileId);
      setData(spaces);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [profileId, facade]);
  
  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);
  
  // Subscribe to invalidation events
  useDataInvalidation(`spaces:${profileId}`, fetchSpaces);
  
  return {
    data,
    loading,
    error,
    refetch: fetchSpaces
  };
}

// Updated useCreateSpace with invalidation
export function useCreateSpace() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
  
  const createSpace = useCallback(async (input: CreateSpaceInput): Promise<SpaceEntity | null> => {
    try {
      setLoading(true);
      setError(null);
      const space = await facade.createSpace(input);
      
      // Invalidate spaces cache
      invalidateData(`spaces:${input.profileId}`);
      
      return space;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create space');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [facade]);
  
  return {
    createSpace,
    loading,
    error
  };
}
```

#### 4.3 Zustand Store (UI State Only)

```typescript
// packages/react-ui/src/stores/spacesUiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// UI-ONLY state - no business data
interface SpacesUiState {
  // Selection
  activeSpaceId: string | null;
  selectedItemIds: Set<string>;
  
  // UI state
  isCreatingSpace: boolean;
  editingSpaceId: string | null;
  
  // Scroll position
  scrollPositions: Record<string, number>;
  
  // Actions
  setActiveSpace: (id: string | null) => void;
  selectItem: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  startCreatingSpace: () => void;
  cancelCreatingSpace: () => void;
}

export const useSpacesUiStore = create<SpacesUiState>()(
  persist(
    (set, get) => ({
      activeSpaceId: null,
      selectedItemIds: new Set(),
      isCreatingSpace: false,
      editingSpaceId: null,
      scrollPositions: {},
      
      setActiveSpace: (id) => set({ activeSpaceId: id }),
      
      selectItem: (id, multi = false) => {
        const current = get().selectedItemIds;
        if (multi) {
          const next = new Set(current);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          set({ selectedItemIds: next });
        } else {
          set({ selectedItemIds: new Set([id]) });
        }
      },
      
      clearSelection: () => set({ selectedItemIds: new Set() }),
      startCreatingSpace: () => set({ isCreatingSpace: true }),
      cancelCreatingSpace: () => set({ isCreatingSpace: false }),
    }),
    {
      name: 'spayce-spaces-ui',
      partialize: (state) => ({
        activeSpaceId: state.activeSpaceId,
        scrollPositions: state.scrollPositions,
      }),
    }
  )
);
```

---

### R5: Package Structure

#### 5.1 Monorepo Layout

```
spayce_electron/
├── packages/
│   │
│   ├── core/                           # 🛡️ DOMAIN + APPLICATION LAYERS
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   │   ├── entities/           # Space, SpaceItem, Profile, etc.
│   │   │   │   ├── repositories/       # ISpacesRepository, etc. (interfaces)
│   │   │   │   ├── services/           # IEventBus, ILogger (interfaces)
│   │   │   │   ├── value-objects/      # Color, Icon, etc.
│   │   │   │   ├── events/             # Domain events
│   │   │   │   └── errors/             # Domain error definitions
│   │   │   ├── application/
│   │   │   │   ├── use-cases/          # CreateSpace, DeleteItem, etc.
│   │   │   │   ├── queries/            # GetSpaces, SearchItems, etc.
│   │   │   │   ├── facades/            # SpacesFacade, etc.
│   │   │   │   └── errors/             # Application error definitions
│   │   │   └── index.ts                # Public API exports
│   │   ├── package.json                # ZERO runtime dependencies
│   │   └── tsconfig.json
│   │
│   ├── infrastructure/                  # 🔌 INFRASTRUCTURE LAYER
│   │   ├── src/
│   │   │   ├── persistence/
│   │   │   │   ├── sqlite/             # SQLite implementations
│   │   │   │   │   ├── SqliteSpacesRepository.ts
│   │   │   │   │   ├── SqliteSpaceItemsRepository.ts
│   │   │   │   │   ├── db.ts           # Database connection
│   │   │   │   │   └── migrations/     # SQL migration scripts
│   │   │   │   └── surrealdb/          # Future: SurrealDB implementations
│   │   │   ├── services/
│   │   │   │   ├── EventBusImpl.ts
│   │   │   │   └── LoggerImpl.ts
│   │   │   ├── di/                     # Service factory/registry
│   │   │   │   └── ServiceRegistry.ts
│   │   │   ├── errors/                 # Infrastructure error definitions
│   │   │   └── platform/
│   │   │       ├── electron/           # Electron-specific code
│   │   │       └── tauri/              # Future: Tauri-specific code
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── react-ui/                        # 🎨 PRESENTATION LAYER (React)
│   │   ├── src/
│   │   │   ├── components/             # React components
│   │   │   │   ├── spaces/
│   │   │   │   ├── sidebar/
│   │   │   │   └── common/
│   │   │   ├── hooks/                  # React hooks (useSpaces, etc.)
│   │   │   ├── stores/                 # Zustand UI stores
│   │   │   ├── theme/                  # CSS variables, design tokens
│   │   │   ├── context/                # React context providers
│   │   │   └── errors/                 # UI-specific error definitions
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── desktop/                         # 🖥️ ELECTRON SHELL
│   │   ├── src/
│   │   │   ├── main/                   # Electron main process
│   │   │   │   ├── index.ts
│   │   │   │   └── ipc/
│   │   │   ├── preload/                # Context