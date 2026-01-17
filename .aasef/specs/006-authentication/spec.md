# Spec 006: Authentication

## Overview
Implement Firebase Authentication with Google OAuth for the Electron app, reusing the existing spayce-app Firebase project.

## Requirements

### R1: Firebase Configuration
- Reuse existing spayce-app project
- API Key from environment variables
- Web client ID for OAuth
- macOS client ID for desktop flow

### R2: Google OAuth Flow
- Custom OAuth flow for Electron (no popup)
- Open auth URL in system browser
- Handle callback via deep link or localhost server
- Exchange code for credentials

### R3: Auth State Management
- AuthState: user, isLoading, isAuthenticated, error
- Silent sign-in for session restoration
- Secure credential storage (electron-store or keychain)
- Token refresh (5 min buffer before expiry)

### R4: User Profile Display
- Avatar (user photo or initials fallback)
- Display name
- Email address
- Optional "Pro" plan badge

### R5: Data Isolation
- User ID stored with all Spaces
- SurrealDB queries filtered by userId
- Clean data separation between users

## Acceptance Criteria
- [ ] Google OAuth popup works
- [ ] User profile shows in sidebar
- [ ] Session persists across restarts
- [ ] Token refresh works
- [ ] Data isolated per user

## Dependencies
- 001-project-foundation
- 002-navigation-shell

## Reference Files
- Old: `spayce/frontend/lib/features/authentication/`
- Old Tests: `spayce/frontend/test/unit/auth/`
- Firebase Config: `spayce/.env`
- Implementation Plan: AUGMENTED SECTION 7
