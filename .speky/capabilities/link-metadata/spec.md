# link-metadata

Seeded from completed items F031, B004 during the SPEKY v3 migration (2026-10-14). Describes the code
as it is today.

## Purpose

Links get a readable title and a favicon after they are created, without blocking creation.

<!-- speky:next-id 5 -->
## Requirements

### link-metadata-R1: Non-blocking enrichment
A link is created immediately with its URL as its name. The renderer then calls `metadata:extract` in
the background. If a title comes back that differs from the name, the link is renamed. If favicon data
comes back, it is stored as the link's `faviconUrl`. The tree is re-fetched only if something changed.
Failures are ignored and the link keeps its URL as its name.

#### Scenario: title found
- WHEN the user adds `https://example.com` and the page title is "Example Domain"
- THEN the link first shows the URL, then shows "Example Domain"

#### Scenario: fetch fails
- WHEN the metadata request fails
- THEN the link stays named after its URL and no error is shown

### link-metadata-R2: Extraction in the main process
`MetadataExtractionService` fetches the page (10 s timeout), takes the `<title>`, and finds a favicon
from the page's `<link rel=icon>` tags, falling back to `<origin>/favicon.ico`. It returns the favicon
as a base64 data URL so the renderer avoids CORS.

#### Scenario: no icon tag
- WHEN the page has no icon link tags
- THEN `/favicon.ico` on the same origin is tried

### link-metadata-R3: Favicon cache
The renderer caches favicon URLs per domain in memory (500 entries, least-recently-used eviction).

#### Scenario: same domain
- WHEN two links on the same domain are rendered
- THEN the favicon is looked up once and reused

### link-metadata-R4: Keyboard-pasted links
Links created by Cmd/Ctrl+V from a bare OS-clipboard URL get a Google S2 favicon URL and the hostname
as their name, and skip metadata extraction.

#### Scenario: Cmd+V URL
- WHEN the user pastes `https://example.com/page` with Cmd+V
- THEN the link is named `example.com` and uses the S2 favicon
