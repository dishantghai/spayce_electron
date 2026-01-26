---
id: F009
title: Paste from System Clipboard
type: feature
priority: P0
status: pending
related_specs: ["016"]
affected_files:
  - packages/desktop/src/renderer/App.tsx
  - packages/react-ui/src/utils/url.ts
  - packages/desktop/src/main/electron-api.ts
estimated_hours: 3
---

# F009: Paste from System Clipboard

## User Story

> As a user, I want to paste a URL from my system clipboard directly into a space, so I can quickly save links from other applications.

## Context

This feature extends the paste functionality to support external URLs from the system clipboard. When the internal clipboard is empty, the paste operation checks the system clipboard for URL-like text. It supports single URLs, partial URLs (e.g., "google.com"), and multiple URLs (newline separated).

## Dependencies

- **F008**: Paste Items (must be completed first to have paste infrastructure)

## Screenshots Reference

Based on Flutter app implementation:
- Copy URL from browser → Paste in Spayce → Link created automatically
- Partial URLs (google.com) → Automatically prefixed with https://
- Multiple URLs pasted as separate link items
- Domain name extracted as link name

## Acceptance Criteria

- [ ] If internal clipboard empty, check system clipboard
- [ ] Detect URL pattern in system clipboard text
- [ ] Create link from detected URL
- [ ] Extract domain as link name (e.g., "google.com" from "https://google.com/search")
- [ ] Generate favicon URL for link
- [ ] Support multiple URLs (newline separated) → create multiple links
- [ ] Partial URLs automatically prefixed with "https://"
- [ ] Non-URL text ignored (no link created)
- [ ] Paste works when internal clipboard is empty

## Technical Implementation

### Components to Create

1. **url.ts utilities** - URL detection and processing
   ```typescript
   export function isLikelyUrl(text: string): boolean {
     const trimmed = text.trim();
     return /^https?:\/\//.test(trimmed) || 
            (/\.[a-z]{2,}/i.test(trimmed) && !/\s/.test(trimmed) && trimmed.length > 3);
   }
   
   export function normalizeUrl(text: string): string {
     const trimmed = text.trim();
     if (/^https?:\/\//.test(trimmed)) {
       return trimmed;
     }
     return `https://${trimmed}`;
   }
   
   export function extractDomain(url: string): string {
     try {
       return new URL(url).hostname;
     } catch {
       return url;
     }
   }
   
   export function getFaviconUrl(url: string): string {
     try {
       const origin = new URL(url).origin;
       return `${origin}/favicon.ico`;
     } catch {
       return '';
     }
   }
   
   export function extractUrlsFromText(text: string): string[] {
     return text
       .split('\n')
       .map(line => line.trim())
       .filter(line => line && isLikelyUrl(line))
       .map(normalizeUrl);
   }
   ```

### Components to Update

1. **App.tsx** - System clipboard paste handler
   ```typescript
   const handleSystemClipboardPaste = async (targetParentId?: string) => {
     const text = await window.electronApi.clipboard.readText();
     if (!text) return;
     
     const urls = extractUrlsFromText(text);
     if (urls.length === 0) return;
     
     // Expand target folder if specified
     if (targetParentId) {
       expandFolder(targetParentId);
     }
     
     // Create a link for each URL
     for (const url of urls) {
       await window.itemsApi.create({
         spaceId: activeSpaceId,
         parentId: targetParentId || null,
         name: extractDomain(url),
         path: url,
         type: 'link',
         faviconUrl: getFaviconUrl(url),
       });
     }
     
     queryClient.invalidateQueries({ queryKey: ['space-items', activeSpaceId] });
   };
   
   // Update handlePaste from F008 to fallback to system clipboard
   const handlePaste = async (targetParentId?: string) => {
     const clipboard = clipboardStore.getState();
     
     if (clipboard && clipboard.items.length > 0) {
       // Use internal clipboard (F008)
       for (const item of clipboard.items) {
         await pasteItemRecursively(activeSpaceId, targetParentId || null, item);
       }
     } else {
       // Fallback to system clipboard
       await handleSystemClipboardPaste(targetParentId);
     }
     
     queryClient.invalidateQueries({ queryKey: ['space-items', activeSpaceId] });
   };
   ```

2. **electron-api.ts** - Ensure clipboard.readText exists
   ```typescript
   clipboard: {
     writeText: (text: string) => clipboard.writeText(text),
     readText: () => clipboard.readText()
   }
   ```

### URL Detection Logic

URL patterns detected:
- `http://example.com` → Valid URL
- `https://example.com` → Valid URL
- `example.com` → Valid (add https://)
- `google.com/search` → Valid (add https://)
- `some text here` → Invalid (has spaces)
- `ab.c` → Invalid (too short)

Multiple URLs:
```
https://google.com
github.com
https://stackoverflow.com/questions
```
→ Creates 3 separate links

## Flutter Reference

```dart
// System clipboard paste (main_layout_final.dart:940-969)
// Fallback to system clipboard URLs
final clipboardData = await Clipboard.getData(Clipboard.kTextPlain);
if (clipboardData?.text != null) {
  final text = clipboardData!.text!.trim();
  
  // Check if it looks like a URL (or multiple URLs)
  final lines = text.split('\n').where((l) => l.trim().isNotEmpty);
  
  for (final line in lines) {
    final trimmedLine = line.trim();
    if (trimmedLine.startsWith('http://') ||
        trimmedLine.startsWith('https://') ||
        (trimmedLine.contains('.') && !trimmedLine.contains(' ') && trimmedLine.length > 3)) {
      
      final url = trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')
          ? trimmedLine
          : 'https://$trimmedLine';
      final name = Uri.tryParse(url)?.host ?? trimmedLine;
      
      final link = SpaceItem(
        id: ref.read(spacesListProvider.notifier).generateId(),
        name: name,
        path: url,
        type: SpaceItemType.link,
        faviconUrl: FaviconService.getFaviconUrl(url),
      );
      
      await ref
          .read(spacesListProvider.notifier)
          .addItemToSpace(widget.space.id, link, parentId: targetParentId);
    }
  }
}
```

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:940-969`

## Testing Checklist

### Unit Tests
- [ ] `isLikelyUrl` detects "https://example.com" as URL
- [ ] `isLikelyUrl` detects "example.com" as URL
- [ ] `isLikelyUrl` rejects "some text here" (has spaces)
- [ ] `isLikelyUrl` rejects "ab.c" (too short)
- [ ] `normalizeUrl` adds "https://" to "example.com"
- [ ] `normalizeUrl` preserves "http://example.com"
- [ ] `extractDomain` returns "google.com" from "https://google.com/search"
- [ ] `extractDomain` handles invalid URLs gracefully
- [ ] `getFaviconUrl` returns "https://example.com/favicon.ico"
- [ ] `extractUrlsFromText` parses newline-separated URLs
- [ ] `extractUrlsFromText` filters out non-URL lines

### Integration Tests
- [ ] System clipboard with URL → Paste → link created
- [ ] System clipboard with partial URL → Paste → https:// added
- [ ] System clipboard with 3 URLs → Paste → 3 links created
- [ ] System clipboard with non-URL text → Paste → no link created
- [ ] Internal clipboard has items → Paste → uses internal (not system)
- [ ] Internal clipboard empty → Paste → uses system clipboard
- [ ] Domain correctly extracted as link name
- [ ] Favicon URL correctly generated

### Manual Testing
- [ ] Copy "https://google.com" in browser → Paste in Spayce → link created with name "google.com"
- [ ] Copy "github.com" → Paste → link created as "https://github.com"
- [ ] Copy multiple URLs (3 lines) → Paste → 3 separate links created
- [ ] Copy "hello world" → Paste → nothing happens (not a URL)
- [ ] Copy URL from browser → Paste into folder → link appears inside folder
- [ ] Favicon loads correctly for created links
- [ ] Works when internal clipboard is empty
- [ ] After using F007 copy → Paste uses internal clipboard (not system)
