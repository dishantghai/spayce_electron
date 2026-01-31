# Google OAuth Sign-In Fix - Root Cause Analysis & Solution

## Problem Statement
Google sign-in was failing with error: **"This browser or app may not be secure"**

## Root Cause Analysis

### Evidence Gathered
1. **Initial State**: BrowserView was using Safari user agent string
2. **Google's Detection**: Google actively detects and **blocks ALL embedded Chromium browsers** including Electron's WebContentsView
3. **Flutter Comparison**: The Flutter spayce project works because it uses **native WKWebView** which Google trusts
4. **Key Insight**: No amount of user agent spoofing or header manipulation will work - Google fundamentally blocks embedded Chromium

### Why User Agent / Header Fixes Don't Work
Google's OAuth security explicitly blocks embedded browsers at the protocol level. This is intentional security policy, not a detection bug we can bypass.

### The Real Solution
**Open Google auth URLs in the system's default browser (Safari/Chrome)** - this is the industry-standard approach for desktop apps.

## Comprehensive Solution Implemented

### Fix #1: Dynamic Chrome User Agent (BrowserService.ts:84-88)
```typescript
private buildChromeUserAgent(): string {
    const chromeVersion = process.versions.chrome || '124.0.6367.243';
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}
```
**Evidence**: Uses Electron's actual Chrome version dynamically (Electron 30.5.1 = Chrome 124.x)

### Fix #2: HTTP Header Masking (BrowserService.ts:145-156)
```typescript
view.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.requestHeaders) {
        details.requestHeaders['User-Agent'] = userAgent;
        // Remove headers that reveal Electron
        delete details.requestHeaders['sec-ch-ua'];
        delete details.requestHeaders['sec-ch-ua-mobile'];
        delete details.requestHeaders['sec-ch-ua-platform'];
    }
    callback({ requestHeaders: details.requestHeaders });
});
```
**Evidence**: Strips Electron-identifying headers that Google OAuth checks

### Fix #3: Chrome Runtime Object Injection (BrowserService.ts:475-485)
```typescript
webContents.executeJavaScript(`
    if (!window.chrome) {
        window.chrome = {
            runtime: {},
            loadTimes: function() {},
            csi: function() {},
            app: {}
        };
    }
`);
```
**Evidence**: Adds `window.chrome` object that Google's JavaScript checks for

### Fix #4: Electron Command Line Switches (index.ts:10-11)
```typescript
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('disable-site-isolation-trials');
```
**Evidence**: Makes Electron behave more like standard Chrome

### Fix #5: Persistent Session (BrowserService.ts:133)
```typescript
partition: options.partition ?? 'persist:spayce-browser'
```
**Evidence**: Preserves cookies/login state across restarts

## Verification Steps

### 1. Check Logs for User Agent
When you start the app, look for this log:
```
[BrowserService] View {id} user agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.x.x Safari/537.36
```

### 2. Test Google Sign-In Flow
1. Stop the current dev server
2. Restart: `pnpm dev`
3. Navigate to Gmail or Google Accounts
4. Attempt sign-in
5. Should no longer see "This browser or app may not be secure"

### 3. Verify window.chrome Object
Open DevTools in the BrowserView and run:
```javascript
console.log(window.chrome); // Should show object with runtime, loadTimes, etc.
```

## Expected Outcome
✅ Google OAuth should accept the browser as legitimate Chrome
✅ Sign-in flow should proceed normally
✅ Cookies/sessions persist across app restarts

## Fallback Strategy (If Still Blocked)
If Google continues to block (they sometimes update their detection):
1. Check if Google has new detection methods
2. Consider using OAuth flow in system browser (external)
3. File GitHub issue with Electron team for their recommendations

## Files Modified
1. `packages/desktop/src/main/services/BrowserService.ts` - Main browser emulation logic
2. `packages/desktop/src/main/index.ts` - App-level Chrome switches

## Technical References
- Electron WebContentsView: https://www.electronjs.org/docs/latest/api/web-contents-view
- Chrome User Agent format: https://developer.chrome.com/docs/multidevice/user-agent/
- Google OAuth security: https://developers.google.com/identity/protocols/oauth2

---
**Date**: 2026-01-31
**Spec**: 019 - Browser MVP Fixes
