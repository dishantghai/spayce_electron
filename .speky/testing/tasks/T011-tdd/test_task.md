# TDD Test Task: Spec 011 - 011

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

# Spec 011: Migration & Feature Parity

## Overview

Complete the Clean Architecture migration by migrating from the existing `packages/shared/` structure, ensuring Flutter feature parity, implementing comprehensive testing, and updating SPEKY documentation. This spec validates the entire architecture implementation and ensures production readiness.

## Dependencies & Scope Coordination

**Dependencies:**
- **Spec 007** (Core Domain Layer): Must be complete
- **Spec 008** (Infrastructure Layer): Must be complete
- **Spec 009** (Application Layer): Must be complete
- **Spec 010** (React UI Integration): Must be complete
- **Spec 001**: Project foundation (test framework, database setup)
- **Spec 002**: Sidebar navigation (integration target)
- **Spec 003**: Spaces module (integration target)

**Integration Points:**
- Migrates existing code from `packages/shared/` to new structure
- Validates all Flutter features work in Electron
- Updates all imports across codebase
- **Verifies** mock data removal completed in Spec 010
- **Verifies** main process initialization completed in Spec 010
- **Verifies** App.tsx hook integration completed in Spec 010

> [!NOTE]
> Spec 010 now handles main process initialization, App.tsx integration, and mock data removal.
> Spec 011 focuses on verification, migration completion, and Flutter feature parity.

**This Spec Covers:**
- Migration from `packages/shared/` structure
- Flutter feature parity verification
- **E2E integration verification** (Spec 010 deliverables)
- Database seeding and validation
- Rollback strategy implementation
- Comprehensive test suite
- SPEKY documentation updates
- Performance validation

## User Stories

### US-011-001: Seamless Migration
- **As a developer**, I want the migration to preserve all existing functionality
- **Acceptance Criteria:**
  - Given I have existing code using `packages/shared/`
  - When I complete the migration
  - Then all imports work with new package paths
  - And all tests pass
  - And the app functions identically

### US-011-002: Flutter Data Access
- **As a user**, I want my Flutter app data available in Electron
- **Acceptance Criteria:**
  - Given I have spaces and items in Flutter
  - When I open the Electron app
  - Then all my data is visible
  - And I can modify it without issues

### US-011-003: Complete Feature Parity
- **As a user**, I want all Flutter features working in Electron
- **Acceptance Criteria:**
  - Given the Flutter app has 40+ space features
  - When I use the Electron app
  - Then all features work identically
  - And no mock data remains

### US-011-004: Rollback Capability
- **As a developer**, I want to rollback if issues arise
- **Acceptance Criteria:**
  - Given the migration causes problems
  - When I execute rollback procedure
  - Then the app returns to pre-migration state
  - And no data is lost

## MVP Scope

### Included:
- Complete migration from `packages/shared/`
- All 40+ Flutter Space features implemented
- Database copy and validation
- Removal of all mock data
- Comprehensive test suite (80%+ coverage)
- SPEKY documentation updates
- Rollback procedure documentation

### Excluded:
- Alternative database backends
- Cloud sync features
- Performance optimizations beyond baseline

## Tech Decisions Update Required

After completing this spec, update `.speky/context/tech_decisions.md` to finalize:

```markdown
## Clean Architecture - Final Structure

| Package | Purpose | Dependencies |
|---------|---------|--------------|
| `@spayce/core` | Domain + Application layers | None |
| `@spayce/infrastructure` | Database, services | @spayce/core |
| `@spayce/react-ui` | React hooks, components | @spayce/core, @spayce/infrastructure |
| `packages/desktop` | Electron app | All packages |

## Migration Complete Markers
- [ ] packages/shared/ removed
- [ ] All imports updated
- [ ] Mock data removed
- [ ] Flutter DB integrated
```

---

## Requirements

### R1: Database Setup and Seeding

#### 1.1 Flutter Database Copy

```bash
#!/bin/bash
# scripts/copy-flutter-db.sh

# Determine Flutter DB location
FLUTTER_DB_PATH=""
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS: Check both locations
  if [[ -f ~/Documents/spaces.sqlite ]]; then
    FLUTTER_DB_PATH=~/Documents/spaces.sqlite
  elif [[ -f ~/Library/Containers/com.spayce.frontend/Data/Documents/spaces.sqlite ]]; then
    FLUTTER_DB_PATH=~/Library/Containers/com.spayce.frontend/Data/Documents/spaces.sqlite
  fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
  FLUTTER_DB_PATH="$APPDATA/com.spayce.frontend/spaces.sqlite"
else
  FLUTTER_DB_PATH=~/.local/share/com.spayce.frontend/spaces.sqlite
fi

if [[ -z "$FLUTTER_DB_PATH" ]] || [[ ! -f "$FLUTTER_DB_PATH" ]]; then
  echo "Flutter database not found at expected locations"
  echo "Creating new empty database..."
  mkdir -p resources/db
  touch resources/db/spaces.sqlite
  exit 0
fi

# Copy database
echo "Found Flutter database at: $FLUTTER_DB_PATH"
mkdir -p resources/db
cp "$FLUTTER_DB_PATH" resources/db/spaces.sqlite
echo "Database copied to resources/db/spaces.sqlite"
```

#### 1.2 Database Migration Script

```typescript
// scripts/migrate-db.ts
import Database from 'better-sqlite3';
import * as path from 'path';

const DB_PATH = path.join(__dirname, '../resources/db/spaces.sqlite');

async function migrateDatabase() {
  console.log('Opening database:', DB_PATH);
  const db = new Database(DB_PATH);
  
  try {
    // Check for missing columns
    const schema = db.prepare("PRAGMA table_info(space_items)").all();
    const columnNames = schema.map((col: any) => col.name);
    
    const migrations: string[] = [];
    
    if (!columnNames.includes('local_path')) {
      migrations.push('ALTER TABLE space_items ADD COLUMN local_path TEXT NULL');
    }
    if (!columnNames.includes('security_bookmark')) {
      migrations.push('ALTER TABLE space_items ADD COLUMN security_bookmark TEXT NULL');
    }
    if (!columnNames.includes('last_synced_at')) {
      migrations.push('ALTER TABLE space_items ADD COLUMN last_synced_at TEXT NULL');
    }
    if (!columnNames.includes('is_watching')) {
      migrations.push('ALTER TABLE space_items ADD COLUMN is_watching INTEGER NOT NULL DEFAULT 0');
    }
    
    if (migrations.length === 0) {
      console.log('Database schema is up to date');
      return;
    }
    
    console.log(`Running ${migrations.length} migrations...`);
    for (const sql of migrations) {
      console.log('Executing:', sql);
      db.exec(sql);
    }
    
    console.log('Migrations complete');
  } finally {
    db.close();
  }
}

migrateDatabase().catch(console.error);
```

#### 1.3 Seed Data Script (Development)

```typescript
// scripts/seed-db.ts
import Database from 'better-sqlite3';
import * as path from 'path';

const DB_PATH = path.join(__dirname, '../resources/db/spaces.sqlite');

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function seedDatabase() {
  const db = new Database(DB_PATH);
  
  try {
    const now = new Date().toISOString();
    const profileId = 'default-profile';
    const userId = 'default-user';
    
    // Check if data exists
    const existingSpaces = db.prepare('SELECT COUNT(*) as count FROM spaces').get() as any;
    if (existingSpaces.count > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }
    
    console.log('Seeding database...');
    
    // Create sample spaces
    const spaces = [
      { id: generateId(), name: 'Work', iconName: 'briefcase', accentColor: '#3B82F6', order: 0 },
      { id: generateId(), name: 'Personal', iconName: 'user', accentColor: '#10B981', order: 1 },
      { id: generateId(), name: 'Learning', iconName: 'book', accentColor: '#8B5CF6', order: 2 },
    ];
    
    const insertSpace = db.prepare(`
      INSERT INTO spaces (id, profile_id, user_id, name, icon_name, accent_color, sort_order, is_expanded, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    
    for (const space of spaces) {
      insertSpace.run(space.id, profileId, userId, space.name, space.iconName, space.accentColor, space.order, now);
    }
    
    // Create sample items for first space
    const workSpaceId = spaces[0].id;
    const items = [
      { id: generateId(), name: 'GitHub', path: 'https://github.com', type: 'link', faviconUrl: 'https://github.githubassets.com/favicons/favicon.svg' },
      { id: generateId(), name: 'Notion', path: 'https://notion.so', type: 'link', faviconUrl: 'https://www.notion.so/images/favicon.ico' },
      { id: generateId(), name: 'Projects', path: '', type: 'folder' },
    ];
    
    const insertItem = db.prepare(`
      INSERT INTO space_items (id, space_id, parent_id, name, path, type, sort_order, created_at, favicon_url, is_expanded, visit_count, is_pinned)
      VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 0, 0, 0)
    `);
    
    items.forEach((item, index) => {
      insertItem.run(item.id, workSpaceId, item.name, item.path, item.type, index, now, item.faviconUrl || null);
    });
    
    console.log(`Created ${spaces.length} spaces and ${items.length} items`);
    
  } finally {
    db.close();
  }
}

seedDatabase().catch(console.error);
```

---

### R2: Migration from packages/shared/

#### 2.1 Migration Checklist

```markdown
## packages/shared/ Migration Checklist

### Phase 1: Audit Current Structure
- [ ] List all files in packages/shared/src/types/
- [ ] List all files in packages/shared/src/components/
- [ ] List all files in packages/shared/src/stores/
- [ ] List all files in packages/shared/src/hooks/
- [ ] List all files in packages/shared/src/theme/
- [ ] Document all export entry points

### Phase 2: Create Compatibility Layer
- [ ] Create re-export index.ts in packages/shared
- [ ] Add deprecation warnings for old imports
- [ ] Update tsconfig paths for gradual migration

### Phase 3: Move Content

#### Types → Domain Entities
- [ ] packages/shared/src/types/index.ts → @spayce/core/domain/entities
- [ ] Space interface → SpaceEntity
- [ ] SpaceItem interface → SpaceItemEntity
- [ ] SpaceItemType enum → SpaceItemType

#### Components → React UI
- [ ] TreeView.tsx → @spayce/react-ui/components
- [ ] TreeItem.tsx → @spayce/react-ui/components
- [ ] Sidebar.tsx → @spayce/react-ui/components
- [ ] SpaceCard.tsx → @spayce/react-ui/components
- [ ] SpacesScreen.tsx → @spayce/react-ui/components

#### Stores → Keep in UI
- [ ] navigation.ts → @spayce/react-ui/stores
- [ ] spaces.ts → Remove (replaced by hooks)

#### Theme → Keep in UI
- [ ] colors.ts → @spayce/react-ui/theme
- [ ] spacing.ts → @spayce/react-ui/theme
- [ ] typography.ts → @spayce/react-ui/theme
- [ ] animations.ts → @spayce/react-ui/theme
- [ ] shadows.ts → @spayce/react-ui/theme
- [ ] radius.ts → @spayce/react-ui/theme

### Phase 4: Update Imports
- [ ] Run import migration script
- [ ] Verify all imports resolve
- [ ] Run TypeScript build
- [ ] Run all tests

### Phase 5: Remove Old Package
- [ ] Archive packages/shared/ to git branch
- [ ] Remove packages/shared/ directory
- [ ] Update pnpm-workspace.yaml
- [ ] Remove from package.json dependencies
```

#### 2.2 Import Migration Script

```bash
#!/bin/bash
# scripts/migrate-imports.sh

echo "Migrating import paths..."

# Types to entities
find packages/ apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  's|@spayce/shared/types|@spayce/core/domain/entities|g'

# Hooks
find packages/ apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  's|@spayce/shared/hooks|@spayce/react-ui/hooks|g'

# Components
find packages/ apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  's|@spayce/shared/components|@spayce/react-ui/components|g'

# Stores
find packages/ apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  's|@spayce/shared/stores|@spayce/react-ui/stores|g'

# Theme
find packages/ apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  's|@spayce/shared/theme|@spayce/react-ui/theme|g'

echo "Import migration complete. Run 'pnpm build' to verify."
```

---

### R3: Flutter Feature Parity Verification

#### 3.1 Feature Checklist

```markdown
## Flutter Feature Parity Checklist

### Space Management Features
- [ ] Create Space - `createSpace(name, icon, color)`
- [ ] Delete Space - `deleteSpace(spaceId)` with cascade delete
- [ ] Rename Space - `renameSpace(spaceId, newName)`
- [ ] Update Space - `updateSpace(spaceId, {icon, color, isExpanded})`
- [ ] Reorder Spaces - Drag & drop reordering
- [ ] Space Theme Picker - Icon and color selection

### Space Item Management Features
- [ ] Add Link to Space - URL with metadata extraction
- [ ] Add Folder - Create folder for organization
- [ ] Delete Item - With recursive child deletion
- [ ] Rename Item - `renameItem(itemId, newName)`
- [ ] Move Item - Drag between spaces and folders
- [ ] Reorder Items - Drag & drop within parent
- [ ] Increment Visit Count - Track link visits

### Pin System Features
- [ ] Pin Item - Add to pinned grid
- [ ] Unpin Item - Remove from grid
- [ ] Reorder Pins - Drag within grid
- [ ] Pinned Links Grid - 5-column display

### Local File System Features
- [ ] Import Local Folder - Via Electron dialog
- [ ] Import Local File - Via Electron dialog
- [ ] Load Folder Children - Dynamic file system reading
- [ ] Security Bookmark (macOS) - Persist folder access

### Drag & Drop Features
- [ ] Drag State Machine - Track active drag
- [ ] Drop Indicators - Visual feedback for drop targets
- [ ] Folder Auto-Expand - Open folders during drag
- [ ] Flash Animation - Highlight dropped item
- [ ] Cross-Space Drag - Move items between spaces

### Search & Discovery Features
- [ ] Search Items - By name and URL
- [ ] Recent Items - Last 10 visited
- [ ] Most Visited Items - Top 10 by count
- [ ] Duplicate URL Check - Prevent duplicates

### Navigation Features
- [ ] Active Space Persistence - Save to localStorage
- [ ] Current Profile ID - User context
- [ ] Keyboard Focus Context - Separate sidebar/spaces focus

### Metadata Extraction Features
- [ ] Page Metadata Extraction - Title, description
- [ ] Favicon URL Extraction - From page or domain
- [ ] URL Validation - HTTP/HTTPS check
- [ ] Item Type Detection - link/file/folder from path
```

#### 3.2 Feature Verification Script

```typescript
// scripts/verify-features.ts
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import { SpacesFacade, SpaceItemsFacade } from '@spayce/core/application';

interface FeatureTest {
  name: string;
  test: () => Promise<boolean>;
}

const features: FeatureTest[] = [
  {
    name: 'Create Space',
    test: async () => {
      const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
      const result = await facade.createSpace({
        profileId: 'test',
        userId: 'test',
        name: 'Test Space'
      });
      return result.success;
    }
  },
  {
    name: 'Get Spaces',
    test: async () => {
      const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
      const result = await facade.getSpaces('test');
      return result.success && result.data.length > 0;
    }
  },
  // Add more feature tests...
];

async function verifyFeatures() {
  console.log('Verifying Flutter Feature Parity...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const feature of features) {
    try {
      const success = await feature.test();
      if (success) {
        console.log(`✅ ${feature.name}`);
        passed++;
      } else {
        console.log(`❌ ${feature.name} - Test returned false`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${feature.name} - ${error}`);
      failed++;
    }
  }
  
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

verifyFeatures();
```

---

### R4: Mock Data Removal Verification

> [!IMPORTANT]
> Mock data removal from App.tsx should have been completed in Spec 010.
> This section verifies that removal and catches any remaining mock data.

#### 4.1 Mock Data Audit

```bash
#!/bin/bash
# scripts/find-mock-data.sh

echo "Searching for mock data..."

# Search for common mock data patterns
grep -rn "mockSpaces\|mockItems\|dummyData\|sampleSpace\|testSpace" \
  --include="*.ts" --include="*.tsx" \
  packages/ apps/ | grep -v "__tests__\|\.test\.\|\.spec\."

echo ""
echo "Searching for hardcoded arrays..."
grep -rn "const spaces = \[\|const items = \[" \
  --include="*.ts" --include="*.tsx" \
  packages/desktop/src packages/react-ui/src | grep -v "__tests__"

echo ""
echo "Done. Review and remove any mock data found."
```

#### 4.2 Replace Mock Data with Real Hooks

```typescript
// BEFORE: Mock data in component
const spaces = [
  { id: '1', name: 'Work', iconName: 'briefcase', accentColor: '#3B82F6' },
  { id: '2', name: 'Personal', iconName: 'user', accentColor: '#10B981' },
];

// AFTER: Real data from hook
import { useSpaces } from '@spayce/react-ui/hooks';

function SpacesList({ profileId }: Props) {
  const { data: spaces, loading, error } = useSpaces(profileId);
  
  if (loading) return <SpaceListSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!spaces) return null;
  
  return (
    <div>
      {spaces.map(space => (
        <SpaceItem key={space.id} space={space} />
      ))}
    </div>
  );
}
```

---

### R5: Rollback Strategy

#### 5.1 Pre-Migration Backup

```bash
#!/bin/bash
# scripts/backup-before-migration.sh

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_BRANCH="backup/pre-migration-$BACKUP_DATE"

echo "Creating pre-migration backup..."

# Create backup branch
git checkout -b "$BACKUP_BRANCH"
git push origin "$BACKUP_BRANCH"

# Backup database
cp resources/db/spaces.sqlite "resources/db/spaces.sqlite.backup.$BACKUP_DATE"

# Create backup manifest
cat > ".migration-backup-$BACKUP_DATE.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "gitBranch": "$BACKUP_BRANCH",
  "gitCommit": "$(git rev-parse HEAD)",
  "dbBackup": "resources/db/spaces.sqlite.backup.$BACKUP_DATE"
}
EOF

echo "Backup complete:"
echo "  Git branch: $BACKUP_BRANCH"
echo "  DB backup: resources/db/spaces.sqlite.backup.$BACKUP_DATE"
```

#### 5.2 Rollback Procedure

```bash
#!/bin/bash
# scripts/rollback-migration.sh

if [ -z "$1" ]; then
  echo "Usage: ./rollback-migration.sh <backup-timestamp>"
  echo "Example: ./rollback-migration.sh 20240120_153045"
  exit 1
fi

BACKUP_DATE=$1
BACKUP_BRANCH="backup/pre-migration-$BACKUP_DATE"
DB_BACKUP="resources/db/spaces.sqlite.backup.$BACKUP_DATE"

echo "Rolling back to backup from $BACKUP_DATE..."

# Check backup exists
if [ ! -f "$DB_BACKUP" ]; then
  echo "Error: Database backup not found at $DB_BACKUP"
  exit 1
fi

# Rollback git
echo "Reverting git to backup branch..."
git checkout main
git reset --hard "$BACKUP_BRANCH"

# Rollback database
echo "Restoring database..."
cp "$DB_BACKUP" resources/db/spaces.sqlite

# Reinstall dependencies
echo "Reinstalling dependencies..."
pnpm install

# Verify
echo "Running tests..."
pnpm test

echo "Rollback complete. Verify application works correctly."
```

---

### R6: Testing Requirements

#### 6.1 Test Coverage Requirements

```yaml
# .speky/specs/011-migration-feature-parity/test-requirements.yaml
coverage_targets:
  domain:
    entities: 95%
    validators: 95%
    value-objects: 95%
    errors: 90%
    
  application:
    use-cases: 90%
    queries: 90%
    facades: 85%
    
  infrastructure:
    repositories: 85%
    services: 85%
    
  react-ui:
    hooks: 80%
    components: 70%

test_types:
  - unit: "Individual class/function tests"
  - integration: "Cross-layer interaction tests"
  - e2e: "Full user flow tests"
```

#### 6.2 Domain Layer Tests

```typescript
// packages/core/src/domain/__tests__/validators/CreateSpaceValidator.test.ts
import { describe, it, expect } from 'vitest';
import { CreateSpaceValidator } from '../../validators/CreateSpaceValidator';

describe('CreateSpaceValidator', () => {
  const validator = new CreateSpaceValidator();
  
  describe('validate', () => {
    it('should pass with valid input', () => {
      const result = validator.validate({
        profileId: 'profile-123',
        userId: 'user-123',
        name: 'My Space',
        iconName: 'folder',
        accentColor: '#6D5AE6'
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('My Space');
    });
    
    it('should fail with empty name', () => {
      const result = validator.validate({
        profileId: 'profile-123',
        userId: 'user-123',
        name: '',
      });
      
      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe('name');
    });
    
    it('should fail with invalid color format', () => {
      const result = validator.validate({
        profileId: 'profile-123',
        userId: 'user-123',
        name: 'Valid Name',
        accentColor: 'invalid'
      });
      
      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe('accentColor');
    });
    
    it('should trim whitespace from name', () => {
      const result = validator.validate({
        profileId: 'profile-123',
        userId: 'user-123',
        name: '  Trimmed  '
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Trimmed');
    });
    
    it('should use default values for optional fields', () => {
      const result = validator.validate({
        profileId: 'profile-123',
        userId: 'user-123',
        name: 'My Space'
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.iconName).toBe('folder');
      expect(result.data?.accentColor).toBe('#6D5AE6');
    });
  });
});
```

#### 6.3 Use Case Tests

```typescript
// packages/core/src/application/__tests__/use-cases/CreateSpaceUseCase.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateSpaceUseCase } from '../../use-cases/spaces/CreateSpaceUseCase';

describe('CreateSpaceUseCase', () => {
  let useCase: CreateSpaceUseCase;
  let mockRepository: any;
  let mockEventBus: any;
  let mockValidator: any;
  
  beforeEach(() => {
    mockRepository = {
      getAllSpaces: vi.fn().mockResolvedValue([]),
      createSpace: vi.fn().mockImplementation((space) => 
        Promise.resolve({ ...space, createdAt: new Date() })
      )
    };
    
    mockEventBus = {
      publish: vi.fn().mockResolvedValue(undefined)
    };
    
    mockValidator = {
      validate: vi.fn().mockReturnValue({
        success: true,
        data: {
          profileId: 'profile-123',
          userId: 'user-123',
          name: 'Test Space',
          iconName: 'folder',
          accentColor: '#6D5AE6'
        },
        errors: []
      })
    };
    
    useCase = new CreateSpaceUseCase(mockRepository, mockEventBus, mockValidator);
  });
  
  it('should create a space with valid input', async () => {
    const input = {
      profileId: 'profile-123',
      userId: 'user-123',
      name: 'Test Space'
    };
    
    const result = await useCase.execute(input);
    
    expect(result.space).toBeDefined();
    expect(result.space.name).toBe('Test Space');
    expect(mockRepository.createSpace).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalled();
  });
  
  it('should assign correct order based on existing spaces', async () => {
    mockRepository.getAllSpaces.mockResolvedValue([
      { id: '1', name: 'Existing', order: 0 },
      { id: '2', name: 'Another', order: 1 }
    ]);
    
    const input = {
      profileId: 'profile-123',
      userId: 'user-123',
      name: 'New Space'
    };
    
    await useCase.execute(input);
    
    expect(mockRepository.createSpace).toHaveBeenCalledWith(
      expect.objectContaining({ order: 2 })
    );
  });
  
  it('should throw validation error for invalid input', async () => {
    mockValidator.validate.mockReturnValue({
      success: false,
      errors: [{ field: 'name', message: 'cannot be empty' }]
    });
    
    await expect(useCase.execute({
      profileId: 'profile-123',
      userId: 'user-123',
      name: ''
    })).rejects.toThrow();
  });
  
  it('should emit SpaceCreatedEvent after creation', async () => {
    const input = {
      profileId: 'profile-123',
      userId: 'user-123',
      name: 'Test Space'
    };
    
    await useCase.execute(input);
    
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'space.created',
        payload: expect.objectContaining({
          profileId: 'profile-123'
        })
      })
    );
  });
});
```

#### 6.4 Repository Integration Tests

```typescript
// packages/infrastructure/src/__tests__/SqliteSpacesRepository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { SqliteSpacesRepository } from '../persistence/sqlite/SqliteSpacesRepository';
import { DatabaseInitializer } from '../persistence/sqlite/DatabaseInitializer';

describe('SqliteSpacesRepository', () => {
  let db: Database.Database;
  let repository: SqliteSpacesRepository;
  
  beforeEach(() => {
    db = new Database(':memory:');
    const initializer = new DatabaseInitializer(db);
    initializer.initialize();
    repository = new SqliteSpacesRepository(db);
  });
  
  afterEach(() => {
    db.close();
  });
  
  it('should create and retrieve a space', async () => {
    const space = await repository.createSpace({
      id: 'test-id',
      profileId: 'profile-123',
      userId: 'user-123',
      name: 'Test Space',
      iconName: 'folder',
      accentColor: '#6D5AE6',
      order: 0,
      isExpanded: true
    });
    
    expect(space.id).toBe('test-id');
    expect(space.createdAt).toBeInstanceOf(Date);
    
    const retrieved = await repository.getSpaceById('test-id');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test Space');
  });
  
  it('should return null for non-existent space', async () => {
    const space = await repository.getSpaceById('non-existent');
    expect(space).toBeNull();
  });
  
  it('should list spaces ordered by sort_order', async () => {
    await repository.createSpace({
      id: 'space-2', profileId: 'p', userId: 'u',
      name: 'Second', iconName: 'folder', accentColor: '#000000',
      order: 1, isExpanded: true
    });
    
    await repository.createSpace({
      id: 'space-1', profileId: 'p', userId: 'u',
      name: 'First', iconName: 'folder', accentColor: '#000000',
      order: 0, isExpanded: true
    });
    
    const spaces = await repository.getAllSpaces('p');
    
    expect(spaces.length).toBe(2);
    expect(spaces[0].name).toBe('First');
    expect(spaces[1].name).toBe('Second');
  });
  
  it('should delete a space', async () => {
    await repository.createSpace({
      id: 'to-delete', profileId: 'p', userId: 'u',
      name: 'Delete Me', iconName: 'folder', accentColor: '#000000',
      order: 0, isExpanded: true
    });
    
    await repository.deleteSpace('to-delete');
    
    const space = await repository.getSpaceById('to-delete');
    expect(space).toBeNull();
  });
  
  it('should reorder spaces', async () => {
    await repository.createSpace({
      id: 'a', profileId: 'p', userId: 'u',
      name: 'A', iconName: 'folder', accentColor: '#000000',
      order: 0, isExpanded: true
    });
    await repository.createSpace({
      id: 'b', profileId: 'p', userId: 'u',
      name: 'B', iconName: 'folder', accentColor: '#000000',
      order: 1, isExpanded: true
    });
    
    await repository.reorderSpaces('p', ['b', 'a']);
    
    const spaces = await repository.getAllSpaces('p');
    expect(spaces[0].id).toBe('b');
    expect(spaces[1].id).toBe('a');
  });
});
```

---

### R7: SPEKY Documentation Updates

#### 7.1 Update Context Files

```markdown
## Updates Required

### .speky/context/codebase.md
- Update package structure section
- Remove packages/shared/ references
- Add packages/core/, packages/infrastructure/, packages/react-ui/
- Document layer dependencies

### .speky/context/tech_decisions.md  
- Add Clean Architecture section
- Document package structure
- Add service registry pattern
- Document error handling strategy

### .speky/context/product.md
- No changes required (domain-level)

### New File: .speky/context/architecture.md
- Create comprehensive architecture documentation
- Include layer diagrams
- Document dependency flow
- List all packages and their purposes
```

#### 7.2 Agent Rules Update

```markdown
## Agent Rules for Modular Architecture

### New Feature Development
1. Create entity in `packages/core/src/domain/entities/`
2. Define repository interface in `packages/core/src/domain/repositories/`
3. Implement use case in `packages/core/src/application/use-cases/`
4. Implement repository in `packages/infrastructure/src/persistence/sqlite/`
5. Create facade method if needed
6. Add React hook in `packages/react-ui/src/hooks/`
7. Wire up in service registry

```

---

### R8: E2E Integration Verification

> [!IMPORTANT]
> This section verifies that all Spec 010 deliverables are working end-to-end.

#### 8.1 Spec 010 Deliverables Verification Checklist

```bash
#!/bin/bash
# scripts/verify-e2e-integration.sh

echo "=== E2E Integration Verification ==="
echo ""

# 1. Check ServiceBootstrap is called
echo "1. Checking main process initialization..."
if grep -q "ServiceBootstrap.initialize" packages/desktop/src/main/index.ts; then
  echo "   ✅ ServiceBootstrap.initialize found in main/index.ts"
else
  echo "   ❌ ServiceBootstrap.initialize NOT found in main/index.ts"
  exit 1
fi

# 2. Check SurrealDB is removed
echo "2. Checking SurrealDB removal..."
if grep -rq "surrealdb" packages/desktop/src/main/; then
  echo "   ❌ SurrealDB references still exist in main/"
  exit 1
else
  echo "   ✅ SurrealDB removed from main/"
fi

# 3. Check mock data removal
echo "3. Checking mock data removal..."
if grep -q "DEMO_SPACES" packages/desktop/src/renderer/App.tsx; then
  echo "   ❌ DEMO_SPACES still exists in App.tsx"
  exit 1
else
  echo "   ✅ DEMO_SPACES removed from App.tsx"
fi

# 4. Check InvalidationProvider
echo "4. Checking InvalidationProvider..."
if grep -q "InvalidationProvider" packages/desktop/src/renderer/App.tsx; then
  echo "   ✅ InvalidationProvider found in App.tsx"
else
  echo "   ❌ InvalidationProvider NOT found in App.tsx"
  exit 1
fi

# 5. Check useSpaces hook
echo "5. Checking useSpaces hook usage..."
if grep -rq "useSpaces" packages/desktop/src/renderer/; then
  echo "   ✅ useSpaces hook in use"
else
  echo "   ❌ useSpaces hook NOT in use"
  exit 1
fi

echo ""
echo "=== All E2E checks passed! ==="
```

#### 8.2 Manual E2E Test Scenarios

Execute these scenarios and verify each works:

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | App Launch | Start app | App shows loading, then displays spaces from database |
| 2 | Create Space | Click "Add Space", fill form, submit | New space appears in sidebar and main view |
| 3 | Delete Space | Right-click space, "Delete" | Space removed, items cascade deleted |
| 4 | Rename Space | Double-click space name, type, Enter | Name updated in UI and database |
| 5 | Reorder Spaces | Drag space card down one position | Order persisted after app restart |
| 6 | Add Link | Click "Add Link", paste URL, submit | Link appears in tree with favicon |
| 7 | Create Folder | Click "New Folder", name it | Folder appears in tree |
| 8 | Pin Item | Right-click item, "Pin" | Item appears in pinned grid |
| 9 | Drag Item | Drag link into folder | Item moved, tree updated |
| 10 | Search | Type in search box | Matching items shown as results |

#### 8.3 Database Persistence Verification

```typescript
// scripts/verify-persistence.ts
import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';

async function verifyPersistence() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'spayce.sqlite');
  
  const db = new Database(dbPath);
  
  // Check tables exist
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
  
  console.log('Tables in database:', tables.map((t: any) => t.name));
  
  // Count records
  const spaceCount = db.prepare('SELECT COUNT(*) as count FROM spaces').get() as any;
  const itemCount = db.prepare('SELECT COUNT(*) as count FROM space_items').get() as any;
  
  console.log(`Spaces: ${spaceCount.count}`);
  console.log(`Items: ${itemCount.count}`);
  
  db.close();
  
  if (spaceCount.count === 0) {
    console.warn('Warning: No spaces in database');
  }
}

verifyPersistence();
```

---

### Database Changes
1. Create migration file
2. Update repository implementation
3. Never modify database directly from UI layer

### Error Handling
1. Domain errors in `packages/core/src/domain/errors/`
2. Infrastructure errors in `packages/infrastructure/src/errors/`
3. UI transforms errors via facades

### Testing
1. Unit test all use cases with mocked repositories
2. Integration test repositories with test database
3. Component test React hooks with mock facades
```

---

## Acceptance Criteria

### Database Setup
- [ ] Flutter database copied to `resources/db/spaces.sqlite`
- [ ] Database schema validated for all required columns
- [ ] Missing columns added via migration script
- [ ] Seed data script available for development
- [ ] Database validates successfully on app start

### Migration
- [ ] All files moved from `packages/shared/` to new locations
- [ ] Import migration script runs without errors
- [ ] TypeScript build passes with no import errors
- [ ] All tests pass after migration
- [ ] `packages/shared/` removed from workspace

### Feature Parity
- [ ] All 40+ Flutter features implemented
- [ ] Feature verification script passes
- [ ] Manual testing confirms feature parity
- [ ] UI behavior matches Flutter app

### Mock Data Removal Verification
- [ ] Verify Spec 010 removed DEMO_SPACES from App.tsx
- [ ] Mock data audit script finds no matches
- [ ] All components use real hooks for data
- [ ] Loading states implemented
- [ ] Error states implemented

### Rollback
- [ ] Pre-migration backup procedure documented
- [ ] Backup script tested
- [ ] Rollback script tested
- [ ] Recovery time < 2 hours validated

### Testing
- [ ] Domain layer: >90% coverage
- [ ] Application layer: >85% coverage
- [ ] Infrastructure layer: >80% coverage
- [ ] React UI layer: >70% coverage
- [ ] All tests pass with `pnpm test`

### Documentation
- [ ] `.speky/context/codebase.md` updated
- [ ] `.speky/context/tech_decisions.md` updated
- [ ] `.speky/context/architecture.md` created
- [ ] Agent rules updated for new architecture

### Integration
- [ ] App starts successfully
- [ ] All CRUD operations work
- [ ] Drag & drop works
- [ ] Search works
- [ ] No console errors
- [ ] Performance acceptable (<100ms for operations)

## Dependencies

- 007-core-domain-layer - REQUIRED COMPLETE
- 008-infrastructure-layer - REQUIRED COMPLETE
- 009-application-layer - REQUIRED COMPLETE
- 010-react-ui-integration - REQUIRED COMPLETE
- 001 (project-foundation)
- 002 (sidebar-navigation)
- 003 (spaces-module)

## Estimated Duration
5-7 days

## Related Specs
- All previous specs (007-010) must be complete
- Updates to Specs 002 and 003 for hook integration


## Acceptance Criteria to Cover

1. [ ] Given I have existing code using `packages/shared/`
2. [ ] When I complete the migration
3. [ ] Then all imports work with new package paths
4. [ ] And all tests pass
5. [ ] And the app functions identically

## Tech Stack

```json
Not specified
```

## Required Test Files

- Create in appropriate test directory

## Test Requirements

### For Each Acceptance Criterion

Create tests that:
1. **Test the happy path** - Normal expected behavior
2. **Test edge cases** - Boundary conditions, empty inputs
3. **Test error handling** - Invalid inputs, network failures
4. **Use appropriate mocking** - Don't hit real APIs/databases

### Test Structure

```
describe('Feature: 011')
  describe('AC1: [Acceptance Criterion 1]')
    test('should [expected behavior]')
    test('should handle [edge case]')
    test('should throw error when [error condition]')
  
  describe('AC2: [Acceptance Criterion 2]')
    ...
```

## Guidelines

1. **Tests MUST FAIL initially** - We haven't implemented yet!
2. Follow existing test patterns in the codebase
3. Use the project's testing frameworks
4. Ensure tests are deterministic (no flaky tests)
5. Add appropriate setup/teardown
6. Use descriptive test names
7. Group related tests logically

## After Creating Tests

1. **Link tests to spec**: `speky test link <test-file> --spec 011`
2. **Run RED phase**: `speky test tdd-red 011`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
