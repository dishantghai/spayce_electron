---
id: F031
title: Favicon Caching and Lazy Loading
type: feature
priority: P2
status: pending
related_specs: ["016"]
affected_files:
  - packages/react-ui/src/services/FaviconCache.ts
  - packages/react-ui/src/hooks/useFavicon.ts
  - packages/react-ui/src/components/TreeItemIcon.tsx
  - packages/desktop/src/renderer/App.tsx
estimated_hours: 4
---

# F031: Favicon Caching and Lazy Loading

## User Story

> As a user, I want favicons to load instantly when I view links, so the UI feels fast and responsive even with many links.

## Context

Currently, favicons are fetched during paste and stored in the database. This works but has limitations:
- Paste operation waits for metadata extraction
- No caching of favicons across sessions for same domains
- Each link fetches its own favicon even if same domain

This feature implements a lazy-loading favicon strategy with in-memory caching:
1. Display placeholder immediately
2. Check memory cache for domain
3. If cache miss, check DB (item.faviconUrl)
4. If still no favicon, fetch from Google/DuckDuckGo and update DB async

## Dependencies

- **F009**: Paste from System Clipboard (completed)

## Acceptance Criteria

- [ ] Favicons load lazily on display, not on paste
- [ ] In-memory cache stores favicons by domain
- [ ] Cache hit returns favicon instantly (no network)
- [ ] Cache miss triggers async fetch and DB update
- [ ] Placeholder/fallback icon shown during fetch
- [ ] Error handling with graceful fallback to Link icon
- [ ] Cache has reasonable size limit (LRU eviction)
- [ ] Paste operation no longer waits for metadata fetch

## Technical Implementation

### Components to Create

1. **FaviconCache.ts** - In-memory cache service
   ```typescript
   // packages/react-ui/src/services/FaviconCache.ts
   
   interface CacheEntry {
     url: string;
     timestamp: number;
   }
   
   const MAX_CACHE_SIZE = 500;
   const cache = new Map<string, CacheEntry>();
   
   export function getCachedFavicon(domain: string): string | null {
     const entry = cache.get(domain);
     return entry?.url ?? null;
   }
   
   export function setCachedFavicon(domain: string, url: string): void {
     // LRU eviction if at capacity
     if (cache.size >= MAX_CACHE_SIZE) {
       const oldest = [...cache.entries()]
         .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
       if (oldest) cache.delete(oldest[0]);
     }
     cache.set(domain, { url, timestamp: Date.now() });
   }
   
   export function extractDomain(url: string): string {
     try {
       return new URL(url).hostname;
     } catch {
       return '';
     }
   }
   
   export function getGoogleFaviconUrl(domain: string): string {
     return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
   }
   
   export function getDuckDuckGoFaviconUrl(domain: string): string {
     return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
   }
   ```

2. **useFavicon.ts** - React hook for favicon loading
   ```typescript
   // packages/react-ui/src/hooks/useFavicon.ts
   
   import { useState, useEffect } from 'react';
   import { 
     getCachedFavicon, 
     setCachedFavicon, 
     extractDomain,
     getGoogleFaviconUrl 
   } from '../services/FaviconCache';
   
   interface UseFaviconResult {
     faviconUrl: string | null;
     isLoading: boolean;
   }
   
   export function useFavicon(
     itemUrl: string,
     storedFaviconUrl: string | null,
     onFaviconResolved?: (url: string) => void
   ): UseFaviconResult {
     const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
     const [isLoading, setIsLoading] = useState(true);
     
     useEffect(() => {
       const domain = extractDomain(itemUrl);
       if (!domain) {
         setIsLoading(false);
         return;
       }
       
       // 1. Check memory cache
       const cached = getCachedFavicon(domain);
       if (cached) {
         setFaviconUrl(cached);
         setIsLoading(false);
         return;
       }
       
       // 2. Use stored favicon from DB
       if (storedFaviconUrl) {
         setCachedFavicon(domain, storedFaviconUrl);
         setFaviconUrl(storedFaviconUrl);
         setIsLoading(false);
         return;
       }
       
       // 3. Fetch from Google favicon service
       const googleUrl = getGoogleFaviconUrl(domain);
       setCachedFavicon(domain, googleUrl);
       setFaviconUrl(googleUrl);
       setIsLoading(false);
       
       // 4. Notify parent to update DB async
       onFaviconResolved?.(googleUrl);
     }, [itemUrl, storedFaviconUrl, onFaviconResolved]);
     
     return { faviconUrl, isLoading };
   }
   ```

### Components to Update

1. **TreeItemIcon.tsx** - Use useFavicon hook
   ```typescript
   function LinkIconWithFavicon({ 
     faviconUrl: storedFaviconUrl, 
     itemUrl,
     size,
     onFaviconResolved
   }: LinkIconProps) {
     const { faviconUrl, isLoading } = useFavicon(
       itemUrl, 
       storedFaviconUrl,
       onFaviconResolved
     );
     
     if (isLoading || !faviconUrl) {
       return <Link size={size} strokeWidth={2} color={ICON_COLORS.link} />;
     }
     
     return (
       <img
         src={faviconUrl}
         alt=""
         style={{ width: size, height: size, objectFit: 'contain' }}
         onError={() => /* fallback to Link icon */}
       />
     );
   }
   ```

2. **App.tsx** - Simplify paste handler
   ```typescript
   // Remove metadata fetch on paste
   // Just create link with URL as name
   // Favicon will be resolved lazily on display
   const result = await itemsApi.create({
     spaceId,
     parentId: item.id,
     name: url,  // Full URL as name initially
     path: url,
     type: SpaceItemType.link,
     // No faviconUrl - will be resolved on display
   });
   ```

## Testing Checklist

### Unit Tests (TDD)

- [ ] `getCachedFavicon` returns null for unknown domain
- [ ] `setCachedFavicon` stores and retrieves favicon
- [ ] `setCachedFavicon` evicts oldest when at capacity
- [ ] `extractDomain` extracts "google.com" from "https://google.com/search"
- [ ] `extractDomain` returns empty string for invalid URL
- [ ] `getGoogleFaviconUrl` returns correct URL format
- [ ] `getDuckDuckGoFaviconUrl` returns correct URL format
- [ ] `useFavicon` returns cached favicon immediately
- [ ] `useFavicon` uses stored favicon if no cache
- [ ] `useFavicon` fetches from Google if no stored favicon
- [ ] `useFavicon` calls onFaviconResolved callback

### Integration Tests

- [ ] Link displays with cached favicon (instant)
- [ ] Link displays with DB favicon (from storedFaviconUrl)
- [ ] Link displays with Google fallback (no stored favicon)
- [ ] Multiple links with same domain share cached favicon
- [ ] Favicon persists after app restart (from DB)
- [ ] Error loading favicon shows Link icon fallback

### Manual Testing

- [ ] Paste URL → link appears immediately (no delay)
- [ ] Favicon loads shortly after link appears
- [ ] Same domain links share favicon (only one fetch)
- [ ] Restart app → favicons still display
- [ ] Invalid favicon URL → shows Link icon
- [ ] Many links → no performance issues
