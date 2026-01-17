# Implementation Plan: 006-authentication

## Step 1: Firebase Setup
1. Install firebase package
2. Create `src/main/auth/firebase.ts` with config
3. Initialize Firebase Auth

## Step 2: OAuth Flow (Main Process)
1. Create `src/main/auth/oauth.ts`
2. Build Google OAuth URL with state
3. Open URL in system browser via shell.openExternal
4. Set up localhost server or deep link handler for callback
5. Exchange authorization code for tokens

## Step 3: Credential Storage
1. Create `src/main/auth/credentialStore.ts`
2. Use electron-store with encryption for tokens
3. Implement save/load/clear methods
4. Handle keychain fallback on macOS

## Step 4: Auth State Management
1. Create `src/stores/authStore.ts` (Zustand)
2. Implement AuthState interface
3. Create `useAuth.ts` hook for renderer
4. Set up IPC for auth state sync

## Step 5: Session Management
1. Implement silent sign-in on app start
2. Set up token refresh timer (5 min buffer)
3. Handle sign-out and credential clearing

## Step 6: User Profile UI
1. Create `UserProfile.tsx` component
2. Create `Avatar.tsx` with photo/initials fallback
3. Add to sidebar bottom section

## Step 7: Data Isolation
1. Add userId field to SurrealDB queries
2. Filter all Space/SpaceItem queries by userId
3. Create userId index for performance

## TDD Approach
- Test auth state transitions
- Test token refresh logic
- Test credential storage (mock)
- Test user data isolation queries
