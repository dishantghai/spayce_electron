# Security Review: Spec 017 - Browser Foundation

## Executive Summary

This document provides a comprehensive security review of Spec 017, identifying potential vulnerabilities and required mitigations for the WebContentsView Service.

---

## Security Threat Model

### Attack Surface Analysis

| Surface | Risk Level | Threats |
|---------|------------|---------|
| WebContentsView | **HIGH** | XSS, code injection, privilege escalation |
| URL Loading | **HIGH** | Protocol smuggling, SSRF, redirect attacks |
| IPC Handlers | **MEDIUM** | Input injection, DoS, privilege escalation |
| Event Forwarding | **LOW** | Information disclosure, spoofing |

---

## Critical Security Requirements

### CSR-1: WebContentsView Isolation (MANDATORY)

**Threat**: Malicious web content could access Node.js APIs or escape sandbox.

**Required Mitigations**:
```typescript
webPreferences: {
  // CRITICAL: These MUST remain false/true
  nodeIntegration: false,
  nodeIntegrationInWorker: false,
  nodeIntegrationInSubFrames: false,
  contextIsolation: true,
  sandbox: true,
  
  // CRITICAL: No preload script for browser views
  preload: undefined,
  
  // CRITICAL: Web security must be enabled
  webSecurity: true,
  allowRunningInsecureContent: false,
  
  // Disable dangerous features
  webviewTag: false,
  enableRemoteModule: false,
}
```

**Verification**: Unit test that verifies these settings cannot be overridden.

### CSR-2: URL Scheme Allowlist (MANDATORY)

**Threat**: Malicious schemes (javascript:, data:, vbscript:) can execute code.

**Required Implementation**:
```typescript
const ALLOWED_SCHEMES = new Set(['http:', 'https:']);
const BLOCKED_SCHEMES = new Set(['javascript:', 'vbscript:', 'data:', 'file:']);

function isUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Block dangerous schemes
    if (BLOCKED_SCHEMES.has(parsed.protocol)) {
      console.warn(`[SECURITY] Blocked dangerous scheme: ${parsed.protocol}`);
      return false;
    }
    
    // Only allow HTTP/HTTPS
    if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
      console.warn(`[SECURITY] Blocked unknown scheme: ${parsed.protocol}`);
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
```

### CSR-3: Content Security Policy (RECOMMENDED)

**Threat**: XSS attacks from loaded web content.

**Note**: We cannot set CSP for third-party websites, but we should:
1. Log CSP violations from pages
2. Consider CSP for any local pages we serve

### CSR-4: IPC Input Validation (MANDATORY)

**Threat**: Malicious renderer could send crafted IPC messages.

**Required Implementation**:
```typescript
// All IPC handlers MUST validate input
ipcMain.handle('browser:loadURL', async (_, id: string, url: string) => {
  // Validate ID format
  if (typeof id !== 'string' || id.length === 0 || id.length > 100) {
    return { success: false, error: 'Invalid view ID' };
  }
  
  // Validate URL
  if (typeof url !== 'string' || url.length === 0 || url.length > 2048) {
    return { success: false, error: 'Invalid URL' };
  }
  
  // Additional URL validation
  if (!isUrlAllowed(url)) {
    return { success: false, error: 'URL scheme not allowed' };
  }
  
  // Proceed with validated input
  // ...
});
```

### CSR-5: Certificate Validation (MANDATORY)

**Threat**: MITM attacks via invalid certificates.

**Required Implementation**:
```typescript
// Log certificate errors but don't auto-proceed in production
webContents.on('certificate-error', (event, url, error, certificate, callback) => {
  console.error(`[SECURITY] Certificate error for ${url}: ${error}`);
  
  // In production: reject invalid certificates
  // In development: could allow self-signed (with warning)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isSelfSigned = error === 'net::ERR_CERT_AUTHORITY_INVALID';
  
  if (isDevelopment && isSelfSigned) {
    console.warn('[SECURITY] Allowing self-signed certificate in development');
    callback(true);
  } else {
    callback(false);
  }
});
```

### CSR-6: Navigation Restrictions (MANDATORY)

**Threat**: Unauthorized navigation to dangerous content.

**Required Implementation**:
```typescript
webContents.on('will-navigate', (event, url) => {
  if (!isUrlAllowed(url)) {
    console.warn(`[SECURITY] Blocked navigation to: ${url}`);
    event.preventDefault();
  }
});

webContents.on('will-redirect', (event, url) => {
  if (!isUrlAllowed(url)) {
    console.warn(`[SECURITY] Blocked redirect to: ${url}`);
    event.preventDefault();
  }
});

webContents.setWindowOpenHandler(({ url }) => {
  if (!isUrlAllowed(url)) {
    console.warn(`[SECURITY] Blocked popup to: ${url}`);
    return { action: 'deny' };
  }
  // Load in current view instead of new window
  return { action: 'deny' };
});
```

---

## Permission Security Model

### Default Permission Policy

| Permission | Default | Rationale |
|------------|---------|-----------|
| fullscreen | Allow | Required for video playback |
| pointerLock | Allow | Required for games |
| clipboard-read | Allow | Copy/paste functionality |
| clipboard-sanitized-write | Allow | Safe clipboard write |
| camera | **Deny** | Privacy sensitive - future: prompt |
| microphone | **Deny** | Privacy sensitive - future: prompt |
| geolocation | **Deny** | Privacy sensitive - future: prompt |
| notifications | **Deny** | Can be abused - future: prompt |
| midi | Deny | Rarely needed |
| midiSysex | Deny | Security risk |
| openExternal | Deny | Could launch malware |

### Future Permission Prompt System

```typescript
// Future implementation (post-MVP)
interface PermissionRequest {
  permission: string;
  origin: string;
  timestamp: Date;
}

interface PermissionDecision {
  granted: boolean;
  remember: boolean;
}

// Store permission decisions per-origin
const permissionStore = new Map<string, Map<string, boolean>>();
```

---

## Rate Limiting

### IPC Rate Limits

To prevent DoS attacks via IPC spam:

```typescript
const rateLimiter = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per second
const RATE_WINDOW = 1000; // 1 second

function checkRateLimit(channel: string): boolean {
  const now = Date.now();
  const key = channel;
  
  const current = rateLimiter.get(key);
  if (!current || now > current.resetTime) {
    rateLimiter.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (current.count >= RATE_LIMIT) {
    console.warn(`[SECURITY] Rate limit exceeded for ${channel}`);
    return false;
  }
  
  current.count++;
  return true;
}
```

---

## Audit Logging

### Security Event Logging

```typescript
interface SecurityEvent {
  type: 'blocked_url' | 'cert_error' | 'permission_denied' | 'rate_limited';
  timestamp: Date;
  details: Record<string, unknown>;
}

function logSecurityEvent(event: SecurityEvent): void {
  console.warn('[SECURITY]', JSON.stringify(event));
  // Future: Send to security monitoring service
}
```

---

## Compliance Checklist

- [ ] nodeIntegration: false (verified in tests)
- [ ] contextIsolation: true (verified in tests)
- [ ] sandbox: true (verified in tests)
- [ ] webSecurity: true (verified in tests)
- [ ] No preload in browser views
- [ ] URL scheme allowlist implemented
- [ ] Certificate errors logged and handled
- [ ] IPC inputs validated
- [ ] Permission allowlist implemented
- [ ] Rate limiting implemented
- [ ] Security events logged
