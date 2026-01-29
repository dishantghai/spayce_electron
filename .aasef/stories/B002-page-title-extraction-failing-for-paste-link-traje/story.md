# [BUG] Page Title Extraction Failing for Paste Link Trajectories

## Description
When users paste URLs to create trajectory links, the page title extraction is failing, resulting in trajectories with generic or missing titles instead of the actual page titles. This degrades the user experience as trajectory links become difficult to identify and organize.

## Acceptance Criteria
- [ ] Pasted URLs automatically extract and display the correct page title
- [ ] Title extraction works for common website types (news, blogs, documentation, etc.)
- [ ] Fallback to URL domain when title extraction fails
- [ ] Loading state shows while title is being fetched
- [ ] Error handling for inaccessible URLs or network failures
- [ ] Title extraction respects CORS policies and doesn't cause security issues

## Context
This affects the trajectory creation workflow in the spaces screen. Users expect pasted links to show meaningful titles rather than raw URLs or generic placeholders. The issue likely involves the web scraping/metadata extraction logic in the trajectory creation process.

**Architecture considerations:**
- Title extraction should happen in main process (Node.js context) to avoid CORS issues
- Use IPC bridge pattern for renderer → main → renderer communication
- Follow clean architecture with repository pattern for external data fetching
- Implement proper error boundaries and loading states in React components

## Tasks
- [ ] Investigate current title extraction implementation in trajectory creation
- [ ] Identify failure points (network, parsing, CORS, etc.)
- [ ] Implement robust HTML title tag extraction with fallbacks
- [ ] Add proper error handling and user feedback
- [ ] Create loading states for async title fetching
- [ ] Add tests for various URL types and edge cases
- [ ] Update trajectory creation UI to handle async title updates

## Notes
- Consider using libraries like `cheerio` for HTML parsing in main process
- Implement timeout mechanisms for slow-loading pages
- May need to handle single-page applications differently (wait for JS execution)
- Ensure compliance with robots.txt and rate limiting for scraping