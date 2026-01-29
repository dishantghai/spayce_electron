# Spayce - Feature: Authentication

> **Document Purpose**: Complete specification of the authentication system for pixel-perfect recreation.

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [Google OAuth](#google-oauth)
5. [State Management](#state-management)
6. [Token Management](#token-management)
7. [Secure Storage](#secure-storage)
8. [Platform-Specific Handling](#platform-specific-handling)
9. [Error Handling](#error-handling)
10. [UI Components](#ui-components)

---

## Feature Overview

### What is the Authentication Module?

The authentication module provides:

- **Google OAuth sign-in** via Firebase Authentication
- **Session persistence** across app restarts
- **Token refresh** for API calls
- **Secure credential storage** using platform keychain
- **Platform-specific workarounds** for macOS sandbox limitations

### Technical Stack

| Component | Technology |
|-----------|------------|
| Auth Service | Firebase Authentication |
| OAuth Provider | Google Sign-In |
| State Management | Riverpod with codegen |
| Secure Storage | flutter_secure_storage |
| Token Format | Firebase ID Token / OAuth Access Token |

### Key Files

```
frontend/lib/features/authentication/
├── data/
│   ├── auth_notifier.dart      # Auth state notifier
│   ├── auth_notifier.g.dart    # Generated code
│   └── mock_user.dart          # MockUser for macOS fallback
├── domain/
│   └── auth_state.dart         # AuthState model
└── presentation/
    ├── login_screen.dart       # Login UI
    └── widgets/                # Auth widgets
```

---

## Architecture

### Module Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Auth Module                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │ Presentation  │    │    Domain     │    │     Data      │       │
│  │ (Login UI)    │───▶│  (AuthState)  │◀───│(AuthNotifier) │       │
│  └───────────────┘    └───────────────┘    └───────────────┘       │
│                                                   │                 │
│                                   ┌───────────────┼───────────────┐ │
│                                   ▼               ▼               ▼ │
│                            ┌───────────┐  ┌───────────┐  ┌───────┐ │
│                            │ Firebase  │  │  Google   │  │Secure │ │
│                            │   Auth    │  │  Sign-In  │  │Storage│ │
│                            └───────────┘  └───────────┘  └───────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Authentication States

```dart
class AuthState {
  final User? user;           // Firebase User or MockUser
  final bool isLoading;       // Sign-in in progress
  final String? error;        // Error message if any
  final bool isAuthenticated; // Is user signed in
  
  // Factory constructors
  factory AuthState.initial();
  factory AuthState.loading();
  factory AuthState.authenticated(User user);
  factory AuthState.unauthenticated();
  factory AuthState.error(String message);
}
```

### State Diagram

```
                           ┌────────────┐
                           │  Initial   │
                           └──────┬─────┘
                                  │
                                  ▼
                           ┌────────────┐
              ┌───────────▶│   Loading  │◀───────────┐
              │            └──────┬─────┘            │
              │                   │                  │
              │      ┌────────────┼────────────┐     │
              │      │            │            │     │
              │      ▼            ▼            ▼     │
         ┌─────────────┐  ┌────────────┐  ┌───────────┐
         │Authenticated│  │Unauthentic.│  │   Error   │
         └──────┬──────┘  └─────┬──────┘  └─────┬─────┘
                │               │               │
                │ signOut()     │ signIn()      │ signIn()
                │               │               │
                └───────────────┴───────────────┘
```

---

## Authentication Flow

### Sign-In Sequence

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│     User     │   │    Auth      │   │   Google     │   │  Firebase    │
│              │   │   Notifier   │   │   Sign-In    │   │    Auth      │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │                  │
       │  Tap Sign In     │                  │                  │
       │─────────────────▶│                  │                  │
       │                  │                  │                  │
       │                  │  state = loading │                  │
       │                  │───────────────── │                  │
       │                  │                  │                  │
       │                  │   signIn()       │                  │
       │                  │─────────────────▶│                  │
       │                  │                  │                  │
       │                  │   (OAuth popup)  │                  │
       │◀─────────────────│◀─────────────────│                  │
       │                  │                  │                  │
       │  Select account  │                  │                  │
       │─────────────────▶│─────────────────▶│                  │
       │                  │                  │                  │
       │                  │  GoogleSignIn    │                  │
       │                  │  Account + Auth  │                  │
       │                  │◀─────────────────│                  │
       │                  │                  │                  │
       │                  │  signInWithCredential()             │
       │                  │────────────────────────────────────▶│
       │                  │                  │                  │
       │                  │                  │     UserCredential
       │                  │◀────────────────────────────────────│
       │                  │                  │                  │
       │                  │  saveCredentials()                  │
       │                  │───────────────── │                  │
       │                  │                  │                  │
       │                  │  state = auth    │                  │
       │◀─────────────────│                  │                  │
       │                  │                  │                  │
```

### Session Restoration

On app launch, the auth module attempts to restore the previous session:

```dart
Future<void> _initializeAuthState() async {
  // 1. Check Firebase current user
  final currentUser = _firebaseAuth.currentUser;
  if (currentUser != null) {
    state = AuthState.authenticated(currentUser);
    return;
  }
  
  // 2. Check secure storage for saved credentials
  if (await _secureStorage.hasCredentials()) {
    final restored = await _restoreSession();
    if (restored) return;
  }
  
  // 3. No session found
  state = AuthState.unauthenticated();
}
```

---

## Google OAuth

### Platform Configuration

#### Web

```dart
_googleSignIn = GoogleSignIn(
  clientId: '978525050204-c2ru6kh7pcskqhubl8n685b9fbrt8ple.apps.googleusercontent.com',
  scopes: ['email', 'https://www.googleapis.com/auth/gmail.readonly'],
);
```

#### macOS

```dart
_googleSignIn = GoogleSignIn(
  clientId: '978525050204-s47bgell0u25tsbpri73h5jc0p1k9q2q.apps.googleusercontent.com',
  scopes: ['email'],
);
```

#### iOS / Android

```dart
_googleSignIn = GoogleSignIn(scopes: ['email']);
// Uses GoogleService-Info.plist (iOS) or google-services.json (Android)
```

### OAuth Scopes

| Scope | Purpose |
|-------|---------|
| `email` | Access user's email address |
| `profile` | Access basic profile info (name, photo) |
| `gmail.readonly` | (Web only) Read Gmail for email integration |

### Credential Flow

```dart
Future<bool> signIn() async {
  // 1. Get Google account
  final googleUser = await _googleSignIn.signIn();
  if (googleUser == null) return false;
  
  // 2. Get authentication tokens
  final googleAuth = await googleUser.authentication;
  
  // 3. Create Firebase credential
  final credential = GoogleAuthProvider.credential(
    accessToken: googleAuth.accessToken,
    idToken: googleAuth.idToken,
  );
  
  // 4. Sign in to Firebase
  final userCredential = await _firebaseAuth.signInWithCredential(credential);
  
  // 5. Save credentials and update state
  await _saveCredentials(googleUser, googleAuth);
  state = AuthState.authenticated(userCredential.user!);
  return true;
}
```

---

## State Management

### Riverpod Providers

```dart
// Main auth provider (generated)
@riverpod
class Auth extends _$Auth {
  @override
  AuthState build() {
    // Initialize and return unauthenticated immediately
    Future.microtask(() => _initializeAuthState());
    return AuthState.unauthenticated();
  }
  
  Future<bool> signIn() async { ... }
  Future<void> signOut() async { ... }
  Future<void> checkAuthStatus() async { ... }
}

// Current user provider
@riverpod
User? currentUser(CurrentUserRef ref) {
  final authState = ref.watch(authProvider);
  return authState.user;
}

// Current user ID provider
@riverpod
String? currentUserId(CurrentUserIdRef ref) {
  final user = ref.watch(currentUserProvider);
  return user?.uid;
}
```

### Using Auth State

```dart
class SomeWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    
    if (authState.isLoading) {
      return LoadingScreen();
    }
    
    if (!authState.isAuthenticated) {
      return LoginScreen();
    }
    
    return MainApp(user: authState.user);
  }
}
```

### Sign Out Flow

```dart
Future<void> signOut() async {
  state = AuthState.loading();
  
  await Future.wait([
    _firebaseAuth.signOut(),
    _googleSignIn.signOut(),
    _secureStorage.clearCredentials(),
  ]);
  
  state = AuthState.unauthenticated();
  
  // Invalidate user-specific providers
  ref.invalidate(currentUserIdProvider);
}
```

---

## Token Management

### Token Types

| Token | Source | Purpose | Expiry |
|-------|--------|---------|--------|
| Access Token | Google OAuth | API calls | 1 hour |
| ID Token | Firebase | User identity | 1 hour |
| Refresh Token | Google OAuth | Get new tokens | Long-lived |

### Token Refresh

```dart
Future<String?> getAccessToken() async {
  // Check if token needs refresh (within 5 minutes of expiry)
  final tokenExpiry = await _secureStorage.getTokenExpiry();
  final now = DateTime.now();
  
  if (tokenExpiry != null && 
      now.isAfter(tokenExpiry.subtract(const Duration(minutes: 5)))) {
    await _refreshToken();
  }
  
  return await _secureStorage.getAccessToken();
}

Future<void> _refreshToken() async {
  final googleUser = _googleSignIn.currentUser ?? 
      await _googleSignIn.signInSilently();
  
  if (googleUser == null) return;
  
  final googleAuth = await googleUser.authentication;
  await _saveCredentials(googleUser, googleAuth);
}
```

---

## Secure Storage

### Storage Service

```dart
class SecureStorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  Future<void> saveCredentials({
    required String userId,
    required String email,
    String? name,
    String? photoUrl,
    String? accessToken,
    String? idToken,
    DateTime? tokenExpiry,
  }) async {
    await _storage.write(key: 'userId', value: userId);
    await _storage.write(key: 'email', value: email);
    await _storage.write(key: 'name', value: name);
    await _storage.write(key: 'photoUrl', value: photoUrl);
    await _storage.write(key: 'accessToken', value: accessToken);
    await _storage.write(key: 'idToken', value: idToken);
    await _storage.write(
      key: 'tokenExpiry', 
      value: tokenExpiry?.toIso8601String(),
    );
  }
  
  Future<Map<String, String?>> loadCredentials() async {
    return {
      'userId': await _storage.read(key: 'userId'),
      'email': await _storage.read(key: 'email'),
      'name': await _storage.read(key: 'name'),
      'photoUrl': await _storage.read(key: 'photoUrl'),
    };
  }
  
  Future<void> clearCredentials() async {
    await _storage.deleteAll();
  }
  
  Future<bool> hasCredentials() async {
    return await _storage.read(key: 'userId') != null;
  }
}
```

### Storage Keys

| Key | Value Type | Purpose |
|-----|------------|---------|
| `userId` | String | Google/Firebase user ID |
| `email` | String | User email |
| `name` | String? | Display name |
| `photoUrl` | String? | Profile photo URL |
| `accessToken` | String | OAuth access token |
| `idToken` | String? | Firebase ID token |
| `tokenExpiry` | ISO8601 String | Token expiration time |

---

## Platform-Specific Handling

### macOS Sandbox Limitations

macOS sandbox restrictions can cause keychain errors. The auth module includes workarounds:

#### MockUser Fallback

When Firebase authentication fails due to keychain issues, use MockUser:

```dart
// When Firebase auth fails with keychain error
if (defaultTargetPlatform == TargetPlatform.macOS &&
    (firebaseError.code == 'keychain-error' ||
     firebaseError.message?.contains('keychain') == true)) {
  
  final mockUser = MockUser(
    uid: googleUser.id,
    email: googleUser.email,
    displayName: googleUser.displayName,
    photoURL: googleUser.photoUrl,
  );
  state = AuthState.authenticated(mockUser);
  return true;
}
```

#### MockUser Implementation

```dart
class MockUser implements User {
  @override final String uid;
  @override final String? email;
  @override final String? displayName;
  @override final String? photoURL;
  
  MockUser({
    required this.uid,
    this.email,
    this.displayName,
    this.photoURL,
  });
  
  // Stub implementations for User interface methods
  @override
  Future<String> getIdToken([bool forceRefresh = false]) async => '';
  
  @override
  Future<void> reload() async {}
  
  // ... other stubs
}
```

### Web Platform

On web, ID tokens may be null - handle with access token only:

```dart
if (kIsWeb && googleAuth.idToken == null) {
  final mockUser = MockUser(...);
  state = AuthState.authenticated(mockUser);
  return true;
}
```

---

## Error Handling

### Error Types

| Error | Cause | Recovery |
|-------|-------|----------|
| `popup_blocked_by_browser` | Browser blocked OAuth popup | Show message, retry |
| `popup_closed_by_user` | User closed popup | Stay unauthenticated |
| `sign_in_failed` + keychain | macOS keychain error | Use MockUser |
| `invalid-credential` | Firebase auth failed | Use MockUser on macOS |
| Timeout (60s) | OAuth popup not responding | Try silent sign-in |

### Error State

```dart
factory AuthState.error(String message) => AuthState(
  error: message,
  isLoading: false,
);

void clearError() {
  if (state.error != null) {
    state = state.copyWith(error: null);
  }
}
```

### Error Display

```dart
if (authState.error != null) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(authState.error!),
      backgroundColor: SpayceColors.error,
      action: SnackBarAction(
        label: 'Dismiss',
        onPressed: () => ref.read(authProvider.notifier).clearError(),
      ),
    ),
  );
}
```

---

## UI Components

### Login Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                          [Spayce Logo]                              │
│                                                                     │
│                    Welcome to Spayce                                │
│                                                                     │
│           Your personal learning command center                     │
│                                                                     │
│                                                                     │
│              ┌────────────────────────────┐                         │
│              │   [G] Sign in with Google  │                         │
│              └────────────────────────────┘                         │
│                                                                     │
│                 By signing in, you agree to our                     │
│                 Terms of Service and Privacy Policy                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Google Sign-In Button

| Property | Value |
|----------|-------|
| Height | 48px |
| Width | 280px |
| Background | White |
| Border | 1px `borderSubtle` |
| Border Radius | 8px |
| Icon | Google "G" logo |
| Text | "Sign in with Google" |
| Text Color | `textPrimary` |
| Font Weight | 500 |

### Loading State

During sign-in, show loading indicator:

```dart
if (authState.isLoading) {
  return Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SpayceSpinner(),
        SizedBox(height: 16),
        Text('Signing in...'),
      ],
    ),
  );
}
```

### User Profile Display

```dart
Widget build(BuildContext context, WidgetRef ref) {
  final user = ref.watch(currentUserProvider);
  
  return Row(
    children: [
      CircleAvatar(
        backgroundImage: user?.photoURL != null 
            ? NetworkImage(user!.photoURL!)
            : null,
        child: user?.photoURL == null 
            ? Icon(Icons.person)
            : null,
      ),
      SizedBox(width: 8),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(user?.displayName ?? 'User'),
          Text(user?.email ?? '', style: TextStyle(fontSize: 12)),
        ],
      ),
    ],
  );
}
```

---

## Firebase Configuration

### Required Files

| Platform | File |
|----------|------|
| iOS | `ios/Runner/GoogleService-Info.plist` |
| macOS | `macos/Runner/GoogleService-Info.plist` |
| Android | `android/app/google-services.json` |
| Web | Configured in `index.html` |

### Initialization

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  runApp(ProviderScope(child: SpayceApp()));
}
```

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
