# Spayce - Testing Guide

> **Document Purpose**: Testing procedures and verification patterns for Spayce recreation.

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Infrastructure](#test-infrastructure)
3. [Feature Test Suites](#feature-test-suites)
4. [Manual Test Procedures](#manual-test-procedures)
5. [Performance Testing](#performance-testing)
6. [Visual Regression Testing](#visual-regression-testing)

---

## Testing Strategy

### Test Pyramid

```
                    ┌────────────┐
                    │   E2E      │  ← Few, slow, high confidence
                    │  Tests     │
                   ┌┴────────────┴┐
                   │  Integration │  ← Medium count
                   │    Tests     │
                  ┌┴──────────────┴┐
                  │   Widget Tests │  ← Many, fast
                 ┌┴────────────────┴┐
                 │    Unit Tests     │  ← Most, fastest
                 └───────────────────┘
```

### Test Categories

| Category | Purpose | Tools |
|----------|---------|-------|
| Unit | Model logic, services | flutter_test |
| Widget | UI components | flutter_test, golden_toolkit |
| Integration | Feature flows | integration_test |
| E2E | Full app flows | patrol, integration_test |
| Manual | UX verification | Human tester |

---

## Test Infrastructure

### Dependencies

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  golden_toolkit: ^0.15.0
  fake_async: ^1.3.1
  network_image_mock: ^2.1.1
  mockito: ^5.4.4
  build_runner: ^2.4.8
  flutter_lints: ^3.0.1
```

### Directory Structure

```
frontend/
├── test/
│   ├── helpers/
│   │   ├── test_helpers.dart       # Common utilities
│   │   └── widget_test_helpers.dart
│   ├── unit/
│   │   └── models/
│   │       ├── space_models_test.dart
│   │       └── tab_model_test.dart
│   └── widget/
│       └── navigation/
│           └── sidebar_test.dart
├── integration_test/
│   ├── app_test.dart               # App launch
│   └── e2e/
│       ├── authentication_e2e_test.dart
│       ├── browser_e2e_test.dart
│       ├── spaces_e2e_test.dart
│       └── navigation_e2e_test.dart
└── test_driver/
    └── integration_test.dart
```

### Running Tests

```bash
# All tests
flutter test

# Unit tests only
flutter test test/unit/

# Widget tests only
flutter test test/widget/

# Integration tests
flutter test integration_test/

# With coverage
flutter test --coverage

# Watch mode for TDD
flutter test --watch
```

### Test Script (run_tests.sh)

```bash
./run_tests.sh all         # Run all tests
./run_tests.sh unit        # Run unit tests
./run_tests.sh widget      # Run widget tests
./run_tests.sh integration # Run integration tests
./run_tests.sh coverage    # Generate coverage report
./run_tests.sh clean       # Clean test artifacts
```

---

## Feature Test Suites

### Browser Module Tests

#### Unit Tests

| Test | Description | File |
|------|-------------|------|
| Tab creation | Default URL, title | `tab_model_test.dart` |
| Tab from Space | Origin tracking | `tab_model_test.dart` |
| URL update | isTracked flag | `tab_model_test.dart` |
| Tab JSON serialization | toJson/fromJson | `tab_model_test.dart` |

```dart
test('Tab should track origin from Space item', () {
  final tab = BrowserTab.fromSpaceItem(
    url: 'https://example.com',
    title: 'Example',
    spaceId: 'space-1',
    spaceItemId: 'item-1',
  );
  
  expect(tab.hasOrigin, isTrue);
  expect(tab.isTracked, isTrue);
  expect(tab.originSpaceId, equals('space-1'));
});
```

#### Widget Tests

| Test | Description |
|------|-------------|
| Tab bar renders | All tabs visible |
| Active tab highlighted | Correct styling |
| Close button works | Tab removed |
| New tab button works | Tab created |

#### Integration Tests

| Test | Description |
|------|-------------|
| Multi-tab workflow | Create, switch, close tabs |
| Tab persistence | Survive app restart |
| URL navigation | Back, forward, refresh |

---

### Spaces Module Tests

#### Unit Tests

| Test | Description | File |
|------|-------------|------|
| Space creation | ID, name, icon, color | `space_models_test.dart` |
| SpaceItem types | link, folder, file | `space_models_test.dart` |
| Nested items | Children list | `space_models_test.dart` |
| Search items | findItemById | `space_models_test.dart` |

```dart
test('Space should have correct default values', () {
  final space = Space(
    id: '1',
    name: 'Test Space',
    icon: Icons.folder,
    colorIndex: 0,
    items: [],
  );
  
  expect(space.name, equals('Test Space'));
  expect(space.items, isEmpty);
  expect(space.colorIndex, equals(0));
});
```

#### Widget Tests

| Test | Description |
|------|-------------|
| Space card renders | Icon, name, count |
| Space tree renders | Hierarchy correct |
| Context menu opens | Right-click works |
| Inline editing | Double-click rename |

#### Integration Tests

| Test | Description |
|------|-------------|
| CRUD workflow | Create, read, update, delete |
| Drag-and-drop | Move items |
| Add item from browser | Link saved |

---

### Workspace Module Tests

#### Unit Tests

| Test | Description |
|------|-------------|
| Workspace model | Path, name, ID |
| File node model | Name, path, type |
| Content type detection | Extension mapping |

#### Widget Tests

| Test | Description |
|------|-------------|
| File tree renders | Folders expand |
| Editor tabs render | Active tab styled |
| Zero state | No workspace message |

#### Integration Tests

| Test | Description |
|------|-------------|
| Open folder | File tree loads |
| Open file | Content displays |
| Multiple workspaces | Switch between |

---

### Navigation Module Tests

#### Widget Tests

| Test | Description |
|------|-------------|
| Sidebar toggle | Open/close animation |
| Mode switching | Browser ↔ Spaces |
| Bottom bar | Space icons clickable |

#### Integration Tests

| Test | Description |
|------|-------------|
| Full navigation flow | Sidebar, tabs, spaces |
| State preservation | Content maintained |

---

### Authentication Module Tests

#### Unit Tests

| Test | Description |
|------|-------------|
| AuthState creation | All factory constructors |
| State transitions | Loading → authenticated |

#### Integration Tests

| Test | Description |
|------|-------------|
| Sign in flow | UI → OAuth → authenticated |
| Sign out flow | Clear session |
| Session restore | App restart |

---

## Manual Test Procedures

### Browser Feature Checklist

**Tab Management**

- [ ] Create new tab (+ button)
- [ ] Navigate to URL
- [ ] Switch between tabs
- [ ] Close tab (X button)
- [ ] Close active tab (selects adjacent)
- [ ] Reorder tabs (drag-and-drop)
- [ ] 20+ tabs (limit enforced)

**Navigation**

- [ ] Back button works
- [ ] Forward button works
- [ ] Refresh button works
- [ ] Stop button works (during load)
- [ ] URL bar updates on navigation

**Link Handling**

- [ ] Regular click navigates
- [ ] CMD+click opens new tab
- [ ] Cross-domain shows preview

**Persistence**

- [ ] Close app, reopen → tabs restored
- [ ] Tab URLs, titles correct

---

### Spaces Feature Checklist

**Space Operations**

- [ ] Create new Space
- [ ] Rename Space (inline edit)
- [ ] Delete Space
- [ ] Change Space color
- [ ] Change Space icon

**Item Operations**

- [ ] Add link from browser
- [ ] Add folder
- [ ] Rename item (inline edit)
- [ ] Delete item
- [ ] Move item (drag-and-drop)

**Navigation**

- [ ] Click Space in sidebar → items load
- [ ] Click link → opens in browser
- [ ] Expand/collapse folders

---

### Workspace Feature Checklist

**Workspace Operations**

- [ ] Add workspace (file picker)
- [ ] Switch workspaces
- [ ] Remove workspace

**File Tree**

- [ ] Folders expand/collapse
- [ ] Click file → opens in editor
- [ ] Icons correct for file types

**Editor**

- [ ] Multiple file tabs
- [ ] Close file tab
- [ ] Breadcrumb shows path
- [ ] Status bar shows info

---

### Authentication Checklist

- [ ] Sign in with Google
- [ ] User profile displays
- [ ] Sign out clears session
- [ ] App restart → session restored

---

## Performance Testing

### Metrics

| Metric | Target | Tool |
|--------|--------|------|
| App launch | < 2s | Stopwatch |
| Tab switch | < 100ms | Timeline |
| Page load | < 3s | Network |
| Animation FPS | 60fps | DevTools |

### Performance Test Code

```dart
testWidgets('Tab switch should be fast', (tester) async {
  final stopwatch = Stopwatch()..start();
  
  await tester.tap(find.byKey(Key('tab-2')));
  await tester.pumpAndSettle();
  
  stopwatch.stop();
  expect(stopwatch.elapsedMilliseconds, lessThan(100));
});
```

### Memory Testing

| Scenario | Limit |
|----------|-------|
| Per WebView | < 200MB |
| App total | < 500MB |
| 20 tabs | < 800MB |

---

## Visual Regression Testing

### Golden Tests

```dart
testWidgets('Sidebar matches golden', (tester) async {
  await loadAppFonts();
  await tester.pumpWidget(createTestWidget(SpayceOverlaySidebar()));
  
  await expectLater(
    find.byType(SpayceOverlaySidebar),
    matchesGoldenFile('goldens/sidebar.png'),
  );
});
```

### Golden Files

```
test/goldens/
├── sidebar.png
├── browser_tabs.png
├── spaces_cards.png
├── workspace_tree.png
├── bottom_bar.png
└── settings_screen.png
```

### Updating Goldens

```bash
flutter test --update-goldens
```

---

## Test Helpers

### Common Utilities

```dart
// Create widget with providers
Widget createTestWidget(Widget child, {
  List<Override>? overrides,
}) {
  return ProviderScope(
    overrides: overrides ?? [],
    child: MaterialApp(
      theme: spayceTheme,
      home: child,
    ),
  );
}

// Pump and settle
Future<void> pumpTestWidget(
  WidgetTester tester, {
  required Widget child,
}) async {
  await tester.pumpWidget(createTestWidget(child));
  await tester.pumpAndSettle();
}

// Tap and settle
Future<void> tapAndSettle(
  WidgetTester tester,
  Finder finder,
) async {
  await tester.tap(finder);
  await tester.pumpAndSettle();
}
```

### Mock Providers

```dart
// Mock auth state
final mockAuthProvider = authProvider.overrideWith((ref) {
  return AuthState.authenticated(MockUser());
});

// Mock spaces
final mockSpacesProvider = spacesListProvider.overrideWith((ref) {
  return AsyncValue.data([testSpace1, testSpace2]);
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      
      - name: Install dependencies
        run: flutter pub get
        
      - name: Run tests
        run: flutter test --coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hook

```bash
#!/bin/bash
flutter test --coverage
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

---

## Coverage Targets

| Module | Target Coverage |
|--------|-----------------|
| Models | 90% |
| Services | 80% |
| Providers | 70% |
| Widgets | 60% |
| Screens | 50% |
| Overall | 70% |

### Generating Coverage Report

```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
