# Spayce - Data Models

> **Document Purpose**: Complete data model specifications for database schemas, domain entities, and JSON serialization formats.

---

## Table of Contents

1. [Model Overview](#model-overview)
2. [Core Domain Models](#core-domain-models)
3. [Enums & Types](#enums--types)
4. [JSON Serialization Formats](#json-serialization-formats)
5. [Database Schemas](#database-schemas)
6. [Relationships](#relationships)
7. [Backend Models](#backend-models)

---

## Model Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SPAYCE DATA LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   SPACES    │    │   BROWSER   │    │    AUTHENTICATION   │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│         │                  │                     │              │
│         ▼                  ▼                     ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │    Space    │    │ BrowserTab  │    │        User         │ │
│  │  SpaceItem  │    │BrowserState │    │      Profile        │ │
│  │ SpaceItemType│    │ BrowserError│    │                     │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        STORAGE LAYER                            │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │  Drift/SQLite │  │  JSON Files   │  │    PostgreSQL     │   │
│  │   (Local)     │  │   (Native)    │  │     (Backend)     │   │
│  └───────────────┘  └───────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Domain Models

### Space

The primary organizational container for content.

```
┌──────────────────────────────────────────────────────────────────┐
│ SPACE                                                            │
├──────────────────────────────────────────────────────────────────┤
│ Field          │ Type       │ Required │ Description             │
├──────────────────────────────────────────────────────────────────┤
│ id             │ String     │ ✓        │ Unique identifier       │
│ profileId      │ String     │ ✓        │ Browser profile ID      │
│ userId         │ String     │ ✓        │ User ownership          │
│ name           │ String     │ ✓        │ Display name            │
│ rootItems      │ [SpaceItem]│ ✓        │ Top-level items         │
│ createdAt      │ DateTime   │ ✓        │ Creation timestamp      │
│ isExpanded     │ Boolean    │          │ UI expansion state      │
│ accentColor    │ Color      │          │ Space theme color       │
│ icon           │ IconData   │          │ Display icon            │
│ iconName       │ String     │          │ Icon name for storage   │
│ order          │ Integer    │          │ Display order           │
└──────────────────────────────────────────────────────────────────┘
```

#### Space Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `String` | Generated | Unique ID (timestamp-based or UUID) |
| `profileId` | `String` | `"default"` | Browser profile for isolation |
| `userId` | `String` | `""` | Firebase UID of owner |
| `name` | `String` | *required* | User-visible name |
| `rootItems` | `List<SpaceItem>` | `[]` | Top-level content items |
| `createdAt` | `DateTime` | `now()` | When space was created |
| `isExpanded` | `bool` | `true` | Whether tree is expanded in UI |
| `accentColor` | `Color` | `space1 (#8B5CF6)` | Theme color for space |
| `icon` | `IconData` | `LucideIcons.folder` | Icon for bottom bar |
| `iconName` | `String` | `"folder"` | Lucide icon name |
| `order` | `int` | `0` | Position in space list (for reordering) |

#### Space Methods

```
addRootItem(SpaceItem item)      → void
removeItem(String itemId)        → void
rename(String newName)           → void
findItem(String itemId)          → SpaceItem?
searchItems(String query)        → List<SpaceItem>
getRecentItems({int limit})      → List<SpaceItem>
getMostVisited({int limit})      → List<SpaceItem>
```

---

### SpaceItem

An item within a Space (link, file, or folder).

```
┌──────────────────────────────────────────────────────────────────┐
│ SPACE ITEM                                                       │
├──────────────────────────────────────────────────────────────────┤
│ Field           │ Type          │ Required │ Description         │
├──────────────────────────────────────────────────────────────────┤
│ id              │ String        │ ✓        │ Unique identifier   │
│ name            │ String        │ ✓        │ Display name        │
│ path            │ String        │ ✓        │ URL or file path    │
│ type            │ SpaceItemType │ ✓        │ Item type enum      │
│ isExpanded      │ Boolean       │          │ Folder UI state     │
│ children        │ [SpaceItem]   │          │ Nested items        │
│ faviconUrl      │ String?       │          │ Website favicon     │
│ description     │ String?       │          │ Page description    │
│ visitCount      │ Integer       │          │ Times visited       │
│ lastVisited     │ DateTime?     │          │ Last access time    │
│ createdAt       │ DateTime      │ ✓        │ Creation timestamp  │
│ isPinned        │ Boolean       │          │ Favorite status     │
│ pinPosition     │ Integer?      │          │ Pin order           │
│ localPath       │ String?       │          │ Local file path     │
│ securityBookmark│ String?       │          │ macOS security token│
│ lastSyncedAt    │ DateTime?     │          │ Last sync time      │
│ isWatching      │ Boolean       │          │ File watch status   │
└──────────────────────────────────────────────────────────────────┘
```

#### SpaceItem Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `String` | *required* | Unique identifier |
| `name` | `String` | *required* | Display name |
| `path` | `String` | *required* | URL for links, path for files |
| `type` | `SpaceItemType` | *required* | Type of item |
| `isExpanded` | `bool` | `false` | Whether folder is expanded |
| `children` | `List<SpaceItem>` | `[]` | Child items (folders only) |
| `faviconUrl` | `String?` | `null` | Favicon URL for links |
| `description` | `String?` | `null` | Meta description |
| `visitCount` | `int` | `0` | Number of times opened |
| `lastVisited` | `DateTime?` | `null` | Last access timestamp |
| `createdAt` | `DateTime` | `now()` | Creation timestamp |
| `isPinned` | `bool` | `false` | Whether pinned to favorites |
| `pinPosition` | `int?` | `null` | Order in pinned list |
| `localPath` | `String?` | `null` | For local files/folders |
| `securityBookmark` | `String?` | `null` | macOS security scoped bookmark |
| `lastSyncedAt` | `DateTime?` | `null` | Last sync with file system |
| `isWatching` | `bool` | `false` | Whether watching for changes |

#### SpaceItem Helper Getters

```
isLocalItem       → bool    // type is localFolder or localFile
isLocalFolder     → bool    // type == SpaceItemType.localFolder
isLocalFile       → bool    // type == SpaceItemType.localFile
canOpenInWorkspace→ bool    // folder or localFolder
```

#### SpaceItem Methods

```
addChild(SpaceItem child)        → void
removeChild(String childId)      → void
findChild(String childId)        → SpaceItem?
incrementVisitCount()            → void  // visitCount++, lastVisited = now
```

---

### BrowserTab

Represents a browser tab with WebView state.

```
┌──────────────────────────────────────────────────────────────────┐
│ BROWSER TAB                                                      │
├──────────────────────────────────────────────────────────────────┤
│ Field             │ Type     │ Required │ Description            │
├──────────────────────────────────────────────────────────────────┤
│ id                │ String   │ ✓        │ UUID                   │
│ tabType           │ TabType  │ ✓        │ Content type           │
│ url               │ String   │ ✓        │ Current URL            │
│ title             │ String   │ ✓        │ Page title             │
│ faviconUrl        │ String?  │          │ Favicon URL            │
│ originSpaceId     │ String?  │          │ Source space ID        │
│ originSpaceItemId │ String?  │          │ Source item ID         │
│ isTracked         │ Boolean  │          │ Still at origin URL    │
│ isActive          │ Boolean  │          │ Currently selected     │
│ isLoading         │ Boolean  │          │ Loading in progress    │
│ loadingProgress   │ Double   │          │ 0.0 - 1.0              │
│ canGoBack         │ Boolean  │          │ History available      │
│ canGoForward      │ Boolean  │          │ Forward available      │
│ createdAt         │ DateTime │ ✓        │ Tab creation time      │
│ updatedAt         │ DateTime │ ✓        │ Last update time       │
│ lastAccessedAt    │ DateTime?│          │ Last access time       │
└──────────────────────────────────────────────────────────────────┘
```

#### BrowserTab Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `String` | UUID v4 | Unique tab identifier |
| `tabType` | `TabType` | `TabType.web` | Type of tab content |
| `url` | `String` | `"https://www.google.com"` | Current URL |
| `title` | `String` | `"New Tab"` | Page title |
| `faviconUrl` | `String?` | `null` | Favicon URL |
| `originSpaceId` | `String?` | `null` | Space this tab was opened from |
| `originSpaceItemId` | `String?` | `null` | Space item that opened this tab |
| `isTracked` | `bool` | `true` | Whether URL matches origin |
| `isActive` | `bool` | `false` | Currently selected tab |
| `isLoading` | `bool` | `false` | Page is loading |
| `loadingProgress` | `double` | `0.0` | Load progress 0.0-1.0 |
| `canGoBack` | `bool` | `false` | Has back history |
| `canGoForward` | `bool` | `false` | Has forward history |
| `createdAt` | `DateTime` | `now()` | When tab was created |
| `updatedAt` | `DateTime` | `now()` | Last state update |
| `lastAccessedAt` | `DateTime?` | `null` | When last accessed |

#### BrowserTab Factory Methods

```
BrowserTab.fromSpaceItem(...)    → BrowserTab  // Create from space item
BrowserTab.newTab()              → BrowserTab  // Create new empty tab
```

#### BrowserTab Getters

```
hasOrigin → bool  // originSpaceId != null && originSpaceItemId != null
```

---

### BrowserState

Represents the current state of the browser WebView.

```
┌──────────────────────────────────────────────────────────────────┐
│ BROWSER STATE                                                    │
├──────────────────────────────────────────────────────────────────┤
│ Field           │ Type         │ Required │ Description          │
├──────────────────────────────────────────────────────────────────┤
│ currentUrl      │ String       │ ✓        │ Current page URL     │
│ pageTitle       │ String?      │          │ Current page title   │
│ isLoading       │ Boolean      │          │ Loading in progress  │
│ loadingProgress │ Double       │          │ 0.0 - 1.0            │
│ canGoBack       │ Boolean      │          │ Can navigate back    │
│ canGoForward    │ Boolean      │          │ Can navigate forward │
│ error           │ BrowserError?│          │ Current error state  │
└──────────────────────────────────────────────────────────────────┘
```

---

### BrowserError

Error information for the browser.

```
┌──────────────────────────────────────────────────────────────────┐
│ BROWSER ERROR                                                    │
├──────────────────────────────────────────────────────────────────┤
│ Field      │ Type            │ Required │ Description            │
├──────────────────────────────────────────────────────────────────┤
│ type       │ BrowserErrorType│ ✓        │ Error category         │
│ message    │ String          │ ✓        │ Technical message      │
│ failedUrl  │ String?         │          │ URL that failed        │
│ retryCount │ Integer         │          │ Retry attempts made    │
│ timestamp  │ DateTime        │ ✓        │ When error occurred    │
└──────────────────────────────────────────────────────────────────┘
```

#### BrowserError Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `BrowserErrorType` | *required* | Category of error |
| `message` | `String` | *required* | Technical error message |
| `failedUrl` | `String?` | `null` | URL that caused error |
| `retryCount` | `int` | `0` | Number of retry attempts |
| `timestamp` | `DateTime` | *required* | Error timestamp |

#### BrowserError Constants

```
maxRetries = 3  // Maximum retry attempts before giving up
```

#### BrowserError Getters

```
userMessage   → String  // User-friendly error message
isRecoverable → bool    // Can retry this error
canRetry      → bool    // retryCount < maxRetries && isRecoverable
```

---

## Enums & Types

### SpaceItemType

```
┌─────────────────────────────────────────┐
│ SPACE ITEM TYPE                         │
├─────────────────────────────────────────┤
│ Value       │ Description               │
├─────────────────────────────────────────┤
│ link        │ Web URL (external link)   │
│ file        │ Generic file reference    │
│ folder      │ Container for other items │
│ localFolder │ Local file system folder  │
│ localFile   │ Local file system file    │
└─────────────────────────────────────────┘
```

**Serialized as**: String (e.g., `"link"`, `"folder"`)

---

### TabType

```
┌─────────────────────────────────────────┐
│ TAB TYPE                                │
├─────────────────────────────────────────┤
│ Value     │ Description                 │
├─────────────────────────────────────────┤
│ web       │ WebView-based browser tab   │
│ note      │ Rich text/Markdown (planned)│
│ localFile │ Local file viewer (planned) │
└─────────────────────────────────────────┘
```

**Serialized as**: String (e.g., `"web"`)

---

### BrowserErrorType

```
┌────────────────────────────────────────────────────────────────┐
│ BROWSER ERROR TYPE                                             │
├────────────────────────────────────────────────────────────────┤
│ Value                │ User Message                            │
├────────────────────────────────────────────────────────────────┤
│ networkTimeout       │ "Page is taking too long to load..."   │
│ sslError             │ "Security certificate is not trusted." │
│ pageNotFound         │ "The page doesn't exist."              │
│ authenticationRequired│ "Authentication required."             │
│ resourceLoadFailure  │ "Some resources failed to load."       │
│ memoryError          │ "Browser encountered a memory error."  │
│ crashFailure         │ "Browser encountered an error."        │
│ invalidUrl           │ "Please enter a valid web address."    │
│ unknown              │ "An unexpected error occurred."        │
└────────────────────────────────────────────────────────────────┘
```

**Recoverable errors**: `networkTimeout`, `resourceLoadFailure`, `unknown`

---

## JSON Serialization Formats

### Space JSON

```json
{
  "id": "1703580000000",
  "profileId": "default",
  "userId": "firebase_uid_123",
  "name": "Machine Learning",
  "rootItems": [
    { /* SpaceItem */ }
  ],
  "createdAt": "2024-12-26T10:00:00.000Z",
  "isExpanded": true,
  "accentColor": "#8B5CF6",
  "iconName": "layers",
  "order": 0
}
```

---

### SpaceItem JSON

```json
{
  "id": "1703580001000",
  "name": "Flutter Documentation",
  "path": "https://docs.flutter.dev",
  "type": "link",
  "isExpanded": false,
  "children": [],
  "faviconUrl": "https://docs.flutter.dev/favicon.ico",
  "description": "Build apps for any screen",
  "visitCount": 15,
  "lastVisited": "2024-12-26T14:30:00.000Z",
  "createdAt": "2024-12-20T09:00:00.000Z",
  "isPinned": true,
  "pinPosition": 0,
  "localPath": null,
  "securityBookmark": null,
  "lastSyncedAt": null,
  "isWatching": false
}
```

---

### BrowserTab JSON

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tabType": "web",
  "url": "https://www.google.com",
  "title": "Google",
  "faviconUrl": "https://www.google.com/favicon.ico",
  "originSpaceId": "1703580000000",
  "originSpaceItemId": "1703580001000",
  "isTracked": true,
  "isActive": true,
  "createdAt": "2024-12-26T10:00:00.000Z",
  "updatedAt": "2024-12-26T10:05:00.000Z",
  "lastAccessedAt": "2024-12-26T10:05:00.000Z"
}
```

---

### Local Storage Format (Spaces List)

The complete spaces data is stored as a JSON array:

```json
[
  {
    "id": "1703580000000",
    "profileId": "default",
    "userId": "user123",
    "name": "Machine Learning",
    "accentColor": "#8B5CF6",
    "iconName": "layers",
    "order": 0,
    "isExpanded": true,
    "createdAt": "2024-12-26T10:00:00.000Z",
    "rootItems": [
      {
        "id": "1703580001000",
        "name": "AI Deep Dive Series",
        "path": "AI Deep Dive Series",
        "type": "folder",
        "isExpanded": true,
        "children": [
          {
            "id": "1703580002000",
            "name": "Gemini 3.0 Tutorial",
            "path": "https://youtube.com/watch?v=...",
            "type": "link",
            "faviconUrl": "https://youtube.com/favicon.ico",
            "visitCount": 5,
            "children": []
          }
        ]
      }
    ]
  },
  {
    "id": "1703580100000",
    "name": "Work Projects",
    "accentColor": "#F59E0B",
    "iconName": "briefcase",
    "order": 1,
    "rootItems": []
  }
]
```

---

## Database Schemas

### Drift (SQLite) Tables

#### Spaces Table

```sql
CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL DEFAULT 'default',
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_expanded INTEGER NOT NULL DEFAULT 1,
  accent_color TEXT,
  icon_name TEXT DEFAULT 'folder',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_spaces_profile ON spaces(profile_id);
CREATE INDEX idx_spaces_user ON spaces(user_id);
CREATE INDEX idx_spaces_order ON spaces(display_order);
```

#### Space Items Table

```sql
CREATE TABLE space_items (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  type TEXT NOT NULL,
  is_expanded INTEGER NOT NULL DEFAULT 0,
  favicon_url TEXT,
  description TEXT,
  visit_count INTEGER NOT NULL DEFAULT 0,
  last_visited TEXT,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  pin_position INTEGER,
  local_path TEXT,
  security_bookmark TEXT,
  last_synced_at TEXT,
  is_watching INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES space_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_space_items_space ON space_items(space_id);
CREATE INDEX idx_space_items_parent ON space_items(parent_id);
CREATE INDEX idx_space_items_type ON space_items(type);
CREATE INDEX idx_space_items_pinned ON space_items(is_pinned);
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    User     │───────│    Space     │───────│  SpaceItem  │
│  (Backend)  │ 1   N │              │ 1   N │             │
└─────────────┘       └──────────────┘       └─────────────┘
       │                     │                      │
       │                     │                      │ parent_id
       │                     │                      ↓
       │                     │               ┌─────────────┐
       │                     │               │  SpaceItem  │
       │                     │               │  (children) │
       │                     │               └─────────────┘
       │                     │
       │                     └──────────────────────────────┐
       │                                                    │
       ▼                                                    ▼
┌─────────────┐                                     ┌─────────────┐
│  Profile    │                                     │ BrowserTab  │
│  (Planned)  │                                     │             │
└─────────────┘                                     └─────────────┘
```

### Relationship Rules

1. **User → Spaces**: One-to-Many
   - A user can have multiple spaces
   - Each space belongs to one user

2. **Space → SpaceItems**: One-to-Many
   - A space contains multiple root items
   - Each root item belongs to one space

3. **SpaceItem → SpaceItem**: Self-referential (Parent-Child)
   - A folder can contain multiple children
   - Each child has one parent (or null for root)
   - Maximum nesting depth: 10 levels

4. **SpaceItem → BrowserTab**: One-to-One (Optional)
   - A tab may originate from a space item
   - Origin tracking for visit count updates

---

## Backend Models

### User (PostgreSQL via SQLAlchemy)

```python
class User(Base):
    __tablename__ = "users"
    
    # Primary key (Firebase UID)
    uid = Column(String, primary_key=True, index=True)
    
    # User information
    email = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    email_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
```

### Planned Backend Models

#### Profile (Future)

```python
class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.uid"), nullable=False)
    name = Column(String, nullable=False)
    is_default = Column(Boolean, default=False)
    settings = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

#### Space (Backend)

```python
class Space(Base):
    __tablename__ = "spaces"
    
    id = Column(String, primary_key=True)
    profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.uid"), nullable=False)
    name = Column(String, nullable=False)
    accent_color = Column(String)  # Hex color
    icon_name = Column(String, default="folder")
    display_order = Column(Integer, default=0)
    is_expanded = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

## ID Generation

### Timestamp-based IDs (Spaces)

```dart
String generateId() {
  return DateTime.now().millisecondsSinceEpoch.toString();
}
// Example: "1703580000000"
```

### UUID v4 (Tabs)

```dart
import 'package:uuid/uuid.dart';
String generateId() {
  return const Uuid().v4();
}
// Example: "550e8400-e29b-41d4-a716-446655440000"
```

---

## Validation Rules

### Space

| Field | Rule |
|-------|------|
| `name` | Required, max 100 characters |
| `order` | >= 0, unique within user's spaces |
| `accentColor` | Valid hex color |
| `iconName` | Must be valid Lucide icon name |

### SpaceItem

| Field | Rule |
|-------|------|
| `name` | Required, max 200 characters |
| `path` | Required; valid URL for links, valid path for files |
| `type` | Valid SpaceItemType value |
| `visitCount` | >= 0 |
| `pinPosition` | >= 0 when isPinned = true |

### BrowserTab

| Field | Rule |
|-------|------|
| `url` | Valid HTTP/HTTPS URL |
| `title` | Max 500 characters |
| `loadingProgress` | 0.0 - 1.0 |

---

## Available Space Icons

The following Lucide icon names are valid for `iconName`:

```
Work & Productivity:
  briefcase, building, laptop, calendar, clipboard

Personal & Life:
  home, heart, user, users, smile

Development & Tech:
  code, terminal, database, cpu, git-branch

Creative & Media:
  palette, image, music, video, camera

Organization:
  folder, layers, archive, bookmark, star

Learning & Education:
  book, graduation-cap, lightbulb, brain

Shopping & Finance:
  shopping-cart, dollar-sign, credit-card

Communication:
  mail, message-circle, phone

Travel & Places:
  plane, map, compass

Health & Fitness:
  activity, dumbbell

Misc:
  rocket, trophy, target, zap, flame,
  flask_conical, flower2, gamepad2
```

Default icon: `"folder"` (maps to `LucideIcons.folder`)

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
