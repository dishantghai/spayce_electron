# Spayce - Technical Architecture

> **Document Purpose**: Complete technical architecture specification for rebuilding the entire application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Data Flow](#data-flow)
6. [State Management](#state-management)
7. [Storage Strategy](#storage-strategy)
8. [Authentication](#authentication)
9. [Project Structure](#project-structure)

---

## Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            CLIENT APPS                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │
│  │   macOS   │ │    iOS    │ │  Android  │ │  Windows  │           │
│  │           │ │           │ │           │ │           │           │
│  │  Flutter  │ │  Flutter  │ │  Flutter  │ │  Flutter  │           │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘           │
│        │             │             │             │                  │
│        └─────────────┴─────────────┴─────────────┘                  │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │    Firebase Auth    │
                    │  (Authentication)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │     FastAPI         │
                    │  (Backend Server)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │  Neon PostgreSQL    │
                    │  (Cloud Database)   │
                    └─────────────────────┘
```

### Design Principles

1. **Offline-First**: Local data persistence, sync when online
2. **Cross-Platform**: Single Flutter codebase for all platforms
3. **Modular**: Feature-based architecture
4. **Secure**: Platform-specific secure storage
5. **Scalable**: Clean separation of concerns

---

## Technology Stack

### Authoritative Stack Decisions

> **Source of Truth**: `.aasef/context/tech_decisions.md`

#### Frontend

| Category | Technology | Package |
|----------|------------|---------|
| Framework | Flutter 3.x | - |
| State Management | Riverpod 2.x | `flutter_riverpod`, `riverpod_annotation` |
| Code Generation | `build_runner` | For Riverpod generators |
| Local Database | Drift | `drift`, `drift_dev` |
| WebView | flutter_inappwebview | `flutter_inappwebview` |
| Secure Storage | flutter_secure_storage | For credentials |
| Google Fonts | google_fonts | For Inter font |
| Icons | lucide_icons | Lucide icon set |
| UUID | uuid | UUID generation |

#### Backend

| Category | Technology |
|----------|------------|
| Framework | Python + FastAPI |
| Database | Neon PostgreSQL |
| ORM | SQLAlchemy |
| Auth Validation | Firebase Admin SDK |

#### Authentication

| Service | Usage |
|---------|-------|
| Firebase Auth | Token management |
| Google OAuth | Primary sign-in method |
| Multi-provider | Planned: Apple, GitHub |

#### NOT Used (Common Misconceptions)

| ❌ Deprecated | ✓ Correct |
|--------------|-----------|
| Provider | Riverpod |
| sqflite | Drift |
| Supabase | Neon PostgreSQL |
| webview_flutter | flutter_inappwebview |

---

## Frontend Architecture

### Feature-Based Structure

```
frontend/lib/
├── core/                    # Shared infrastructure
│   ├── auth/               # Authentication service
│   ├── constants/          # App constants
│   ├── services/           # Shared services
│   └── theme/              # Design system
│       ├── spayce_colors.dart
│       ├── spayce_typography.dart
│       ├── spayce_spacing.dart
│       ├── spayce_radius.dart
│       ├── spayce_shadows.dart
│       └── spayce_animations.dart
│
├── features/               # Feature modules
│   ├── browser/           # Browser feature
│   │   ├── data/         # Data layer
│   │   ├── domain/       # Business logic
│   │   └── presentation/ # UI layer
│   │
│   ├── spaces/           # Spaces feature
│   │   ├── data/         # Drift database, repositories
│   │   ├── models/       # SpaceItem, Space models
│   │   ├── presentation/ # Widgets, screens
│   │   └── services/     # SpacesService
│   │
│   ├── navigation/       # App navigation
│   │   └── presentation/
│   │       └── widgets/  # Nav components
│   │
│   └── workspace/        # File browser
│       ├── data/
│       └── presentation/
│
├── app.dart               # App widget
└── main.dart             # Entry point
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Presentation** | Widgets, screens, providers for UI state |
| **Domain** | Business logic, models, domain services |
| **Data** | Repositories, data sources, storage |

### Widget Architecture

```
                    ┌─────────────────┐
                    │    StatelessW   │
                    │   (Compose UI)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────────┐    │    ┌────────▼────────┐
     │  ConsumerWidget │    │    │  StatefulWidget │
     │ (Read Providers)│    │    │ (Local State)   │
     └─────────────────┘    │    └─────────────────┘
                            │
                   ┌────────▼────────┐
                   │ ConsumerStateful│
                   │(Provider+Local) │
                   └─────────────────┘
```

---

## Backend Architecture

### FastAPI Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py        # Auth endpoints
│   │       ├── users.py       # User endpoints
│   │       └── spaces.py      # Spaces endpoints (planned)
│   │
│   ├── core/
│   │   ├── config.py          # Settings
│   │   ├── security.py        # Firebase validation
│   │   └── database.py        # DB connection
│   │
│   ├── models/
│   │   └── user.py           # SQLAlchemy models
│   │
│   ├── schemas/
│   │   └── user.py           # Pydantic schemas
│   │
│   └── main.py               # FastAPI app
│
├── requirements.txt
└── alembic/                  # Migrations
```

### API Design

```
/api/v1/
├── /auth
│   ├── POST /verify          # Verify Firebase token
│   └── POST /refresh         # Refresh tokens
│
├── /users
│   ├── GET /me              # Current user
│   ├── PATCH /me            # Update profile
│   └── DELETE /me           # Delete account
│
└── /spaces (planned)
    ├── GET /                # List spaces
    ├── POST /               # Create space
    ├── GET /{id}            # Get space
    ├── PATCH /{id}          # Update space
    └── DELETE /{id}         # Delete space
```

---

## Data Flow

### Read Flow (Spaces Example)

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────┐
│    Widget   │────▶│   Provider   │────▶│ Repository │────▶│ Database │
│ (UI Layer)  │     │ (State Mgmt) │     │(Data Layer)│     │ (Drift)  │
└─────────────┘     └──────────────┘     └────────────┘     └──────────┘
       ▲                   │
       │                   │
       └───────────────────┘
         (Rebuild on change)
```

### Write Flow

```
1. User Action (tap, type, etc.)
         │
         ▼
2. Widget calls Provider method
         │
         ▼
3. Provider calls Repository
         │
         ▼
4. Repository writes to Drift DB
         │
         ▼
5. Provider updates state
         │
         ▼
6. Widgets rebuild automatically
```

### Sync Flow (Future)

```
┌──────────┐      ┌──────────────┐      ┌──────────┐
│  Local   │◀────▶│  Sync Engine │◀────▶│  Cloud   │
│  Drift   │      │              │      │ Postgres │
└──────────┘      └──────────────┘      └──────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  Conflict    │
                  │  Resolution  │
                  └──────────────┘
```

---

## State Management

### Riverpod Provider Types

```dart
// Auto-disposed state provider
@riverpod
class Counter extends _$Counter {
  @override
  int build() => 0;
  void increment() => state++;
}

// Async data provider
@riverpod
Future<List<Space>> spaces(SpacesRef ref) async {
  final repository = ref.watch(spacesRepositoryProvider);
  return repository.getAllSpaces();
}

// Family provider (for parameters)
@riverpod
Future<Space?> spaceById(SpaceByIdRef ref, String id) async {
  final repository = ref.watch(spacesRepositoryProvider);
  return repository.getSpaceById(id);
}
```

### Provider Hierarchy

```
┌───────────────────────────────────────────────────────────────┐
│                    ProviderScope (root)                       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Service Providers                       │ │
│  │  (SpacesRepository, AuthService, BrowserController)      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                   │
│                           ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   State Providers                        │ │
│  │  (SpacesList, ActiveSpace, BrowserState)                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                   │
│                           ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Widgets                               │ │
│  │  (Consumer reads providers, triggers rebuilds)           │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Key Providers

| Provider | Type | Purpose |
|----------|------|---------|
| `spacesListProvider` | StateNotifier | List of all spaces |
| `activeSpaceProvider` | StateProvider | Currently selected space index |
| `expandedFoldersProvider` | StateProvider | Set of expanded folder IDs |
| `browserStateProvider` | StateNotifier | Browser WebView state |
| `authStateProvider` | StreamProvider | Authentication state |

---

## Storage Strategy

### Local Storage

| Platform | Technology | Location |
|----------|------------|----------|
| macOS | Drift (SQLite) | `~/Library/Application Support/spayce/` |
| iOS | Drift (SQLite) | App sandbox `Documents/` |
| Android | Drift (SQLite) | App internal storage |
| Windows | Drift (SQLite) | `%APPDATA%/spayce/` |
| Linux | Drift (SQLite) | `~/.local/share/spayce/` |
| Web | localStorage | Browser storage |

### Drift Database Schema

```dart
// tables.dart
class Spaces extends Table {
  TextColumn get id => text()();
  TextColumn get profileId => text().withDefault(const Constant('default'))();
  TextColumn get userId => text()();
  TextColumn get name => text()();
  BoolColumn get isExpanded => boolean().withDefault(const Constant(true))();
  TextColumn get accentColor => text().nullable()();
  TextColumn get iconName => text().withDefault(const Constant('folder'))();
  IntColumn get displayOrder => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class SpaceItems extends Table {
  TextColumn get id => text()();
  TextColumn get spaceId => text().references(Spaces, #id)();
  TextColumn get parentId => text().nullable().references(SpaceItems, #id)();
  TextColumn get name => text()();
  TextColumn get path => text()();
  TextColumn get type => text()(); // link, folder, file, localFolder, localFile
  BoolColumn get isExpanded => boolean().withDefault(const Constant(false))();
  TextColumn get faviconUrl => text().nullable()();
  TextColumn get description => text().nullable()();
  IntColumn get visitCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get lastVisited => dateTime().nullable()();
  BoolColumn get isPinned => boolean().withDefault(const Constant(false))();
  IntColumn get pinPosition => integer().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}
```

### Cloud Storage (Planned)

```
Neon PostgreSQL
├── users                # User accounts
├── profiles             # Browser profiles
├── spaces               # Space metadata
├── space_items          # Space content
└── sync_state           # Sync tracking
```

---

## Authentication

### Firebase Auth Flow

```
┌─────────────┐     ┌─────────────────┐     ┌────────────────┐
│   Flutter   │────▶│  Google OAuth   │────▶│  Firebase Auth │
│     App     │     │    (Sign In)    │     │   (Token)      │
└─────────────┘     └─────────────────┘     └───────┬────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────┐
                                          │   Spayce API    │
                                          │ (Verify Token)  │
                                          └─────────────────┘
```

### Token Management

```dart
class AuthService {
  // Get current user
  User? get currentUser => FirebaseAuth.instance.currentUser;
  
  // Listen to auth changes
  Stream<User?> get authStateChanges => 
    FirebaseAuth.instance.authStateChanges();
  
  // Sign in with Google
  Future<UserCredential> signInWithGoogle() async {
    final googleUser = await GoogleSignIn().signIn();
    final googleAuth = await googleUser!.authentication;
    
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );
    
    return FirebaseAuth.instance.signInWithCredential(credential);
  }
  
  // Get ID token for API calls
  Future<String?> getIdToken() async {
    return currentUser?.getIdToken();
  }
  
  // Sign out
  Future<void> signOut() async {
    await GoogleSignIn().signOut();
    await FirebaseAuth.instance.signOut();
  }
}
```

### Secure Storage

```dart
// Store credentials securely
final storage = FlutterSecureStorage();

// Save
await storage.write(key: 'refreshToken', value: token);

// Read
final token = await storage.read(key: 'refreshToken');

// Delete
await storage.delete(key: 'refreshToken');
```

---

## Project Structure

### Full Directory Tree

```
spayce/
├── frontend/                    # Flutter application
│   ├── lib/
│   │   ├── core/               # Shared code
│   │   ├── features/           # Feature modules
│   │   ├── app.dart            # Root widget
│   │   └── main.dart           # Entry point
│   ├── test/                   # Unit/widget tests
│   ├── integration_test/       # Integration tests
│   └── pubspec.yaml            # Dependencies
│
├── backend/                     # FastAPI server
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── core/              # Config, security
│   │   ├── models/            # SQLAlchemy models
│   │   └── main.py            # FastAPI app
│   └── requirements.txt
│
├── .aasef/                      # AASEF framework
│   ├── context/               # Project context
│   ├── specs/                 # Feature specifications
│   ├── stories/               # User stories
│   └── design/                # Design system
│
├── docs/                        # Documentation
│   └── PROJECT_STRUCTURE.md
│
├── project_ops/                 # Project operations
│   ├── UI/Images/             # UI screenshots
│   └── product_management_drafts/
│
└── README.md
```

### Entry Points

| Platform | Entry File |
|----------|------------|
| Flutter | `frontend/lib/main.dart` |
| Backend | `backend/app/main.py` |

### Configuration Files

| File | Purpose |
|------|---------|
| `pubspec.yaml` | Flutter dependencies |
| `requirements.txt` | Python dependencies |
| `firebase.json` | Firebase config |
| `.env` | Environment variables |

---

## Dependencies

### Frontend (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.0
  riverpod_annotation: ^2.1.0
  
  # Database
  drift: ^2.11.0
  sqlite3_flutter_libs: ^0.5.0
  path_provider: ^2.1.0
  path: ^1.8.0
  
  # WebView
  flutter_inappwebview: ^6.0.0
  
  # Auth
  firebase_core: ^2.15.0
  firebase_auth: ^4.7.0
  google_sign_in: ^6.1.0
  
  # Storage
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.0
  
  # UI
  google_fonts: ^6.1.0
  lucide_icons: ^0.0.1
  
  # Utils
  uuid: ^4.1.0
  url_launcher: ^6.1.0
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Code generation
  build_runner: ^2.4.0
  riverpod_generator: ^2.3.0
  drift_dev: ^2.11.0
```

### Backend (requirements.txt)

```
fastapi>=0.100.0
uvicorn[standard]>=0.22.0
sqlalchemy>=2.0.0
asyncpg>=0.28.0
python-jose[cryptography]>=3.3.0
firebase-admin>=6.2.0
pydantic>=2.0.0
alembic>=1.11.0
python-dotenv>=1.0.0
```

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
