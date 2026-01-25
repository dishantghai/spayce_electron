---
id: F002
title: Create Link via Inline Input
type: feature
priority: P0
status: pending
related_specs: []
dependencies: [F001]
affected_files:
  - packages/react-ui/src/components/InlineInput.tsx
  - packages/react-ui/src/utils/url.ts
  - packages/desktop/src/main/ipc/handlers.ts
  - packages/desktop/src/preload/index.ts
estimated_hours: 4
---

# F002: Create Link via Inline Input

## User Story

> As a user, I want to add a new link by clicking a button and pasting a URL inline, so I can save links without switching context.

## Context

This feature extends the InlineInput component to support link creation. Links auto-paste from clipboard if a URL is detected, automatically normalize URLs (add https://), extract domain as default name, and fetch favicon URLs.

## Screenshots Reference

Based on Flutter app screenshots:
- Image 2: Shows inline link input with "Paste link" placeholder, link icon, "Add Link" tooltip
- Image 4: Shows link with favicon (www.perplexity.ai) in tree after creation
- Image 7: Shows link item with favicon in collapsed view

## Acceptance Criteria

- [ ] Click link icon in SpaceHeader → shows inline input at tree root
- [ ] Click link icon on folder hover → shows inline input inside that folder
- [ ] Input auto-pastes URL from system clipboard if detected
- [ ] Press Enter → creates link with favicon, clears input
- [ ] Automatically adds https:// if missing
- [ ] Extracts domain name as default link name
- [ ] Favicon URL generated and stored with link
- [ ] Works in both Sidebar and SpaceCard contexts
- [ ] Context menu "Add Link" triggers inline input

## Technical Implementation

### Files to Create

1. **packages/react-ui/src/utils/url.ts** - URL utility functions
   ```typescript
   export function normalizeUrl(input: string): string;
   export function extractDomain(url: string): string;
   export function isLikelyUrl(text: string): boolean;
   export function getFaviconUrl(url: string): string;
   ```

### Files to Update

1. **InlineInput.tsx**
   - Add link mode with clipboard auto-paste
   - On mount for link type, read clipboard via IPC
   - If clipboard contains URL-like text, pre-fill and select all
   - On submit, normalize URL and extract domain for name

2. **packages/desktop/src/main/ipc/handlers.ts**
   - Add clipboard read handler:
   ```typescript
   ipcMain.handle('clipboard:readText', () => clipboard.readText());
   ```

3. **packages/desktop/src/preload/index.ts**
   - Expose clipboard API:
   ```typescript
   clipboard: {
     readText: () => ipcRenderer.invoke('clipboard:readText'),
   }
   ```

4. **TreeItem.tsx**
   - Wire up Link hover button to trigger inline input

5. **SpaceHeader.tsx**
   - Wire up onAddLink to trigger inline input

### URL Utility Functions

```typescript
// utils/url.ts
export function normalizeUrl(input: string): string {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  return `https://${input}`;
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function isLikelyUrl(text: string): boolean {
  return /^https?:\/\//.test(text) || 
         (/\.[a-z]{2,}/i.test(text) && !/\s/.test(text));
}

export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch {
    return '';
  }
}
```

### Clipboard Auto-Paste Logic

```typescript
// In InlineInput, on mount for link type:
useEffect(() => {
  if (type !== 'link') return;
  
  const loadClipboard = async () => {
    try {
      const text = await window.electron.clipboard.readText();
      if (text && isLikelyUrl(text)) {
        setInputValue(text);
        // Select all so user can see domain
        inputRef.current?.select();
      }
    } catch (e) {
      // Ignore clipboard errors
    }
  };
  
  loadClipboard();
}, [type]);
```

### Link Creation Flow

```typescript
const handleSubmit = async () => {
  if (type === 'link') {
    const url = normalizeUrl(inputValue);
    const name = extractDomain(url);
    const faviconUrl = getFaviconUrl(url);
    
    await createItem({
      spaceId,
      parentId,
      name,
      path: url,
      type: SpaceItemType.Link,
      faviconUrl,
    });
  }
  // ... folder handling
};
```

## Flutter Reference

```dart
// Clipboard auto-paste (main_layout_final.dart:3452-3479)
Future<void> _loadClipboard() async {
  final clipboardData = await Clipboard.getData(Clipboard.kTextPlain);
  if (clipboardData?.text != null) {
    final text = clipboardData!.text!;
    if (text.startsWith('http://') ||
        text.startsWith('https://') ||
        text.contains('.') && !text.contains(' ')) {
      _controller.text = text;
      _controller.selection = TextSelection(baseOffset: 0, extentOffset: text.length);
    }
  }
}

// Link submit (main_layout_final.dart:3511-3526)
final url = value.startsWith('http://') || value.startsWith('https://')
    ? value : 'https://$value';
final name = Uri.tryParse(url)?.host ?? value;
final link = SpaceItem(
  name: name,
  path: url,
  type: SpaceItemType.link,
  faviconUrl: FaviconService.getFaviconUrl(url),
);
```

## Testing Checklist

### Unit Tests
- [ ] normalizeUrl adds https:// when missing
- [ ] normalizeUrl preserves existing http:// or https://
- [ ] extractDomain extracts hostname correctly
- [ ] isLikelyUrl returns true for valid URLs
- [ ] isLikelyUrl returns false for non-URLs
- [ ] getFaviconUrl generates correct favicon path

### Integration Tests
- [ ] Clipboard read IPC works correctly
- [ ] Link creation with favicon persists to database
- [ ] Link appears in tree with favicon icon

### Manual Testing
- [ ] Copy URL in browser, click link+ → URL pre-filled
- [ ] Type URL, press Enter → link created
- [ ] Partial URL (google.com) → https:// added
- [ ] Domain extracted as link name
- [ ] Favicon URL generated
- [ ] Link appears in correct tree position
- [ ] Non-URL text not auto-pasted
