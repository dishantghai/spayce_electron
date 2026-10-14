# clipboard

Seeded from completed items 016, F007, F008, F009, F010, F033 during the SPEKY v3 migration
(2026-10-14). Describes the code as it is today.

## Purpose

Copy and paste of tree items within and across spaces, plus exchange of URLs with the OS clipboard.
An internal clipboard (`clipboardStore`) holds item snapshots. The OS clipboard is reached through
`clipboard:readText` / `clipboard:writeText` IPC.

<!-- speky:next-id 7 -->
## Requirements

### clipboard-R1: Copy items
Copy Folder, Copy Link (menu) and Cmd/Ctrl+C (sidebar and space cards) put the selected items (the
multi-selection, else the keyboard-focused item, else the clicked item) on the internal clipboard.
When exactly one link is copied, its URL is also written to the OS clipboard.

#### Scenario: copy a link
- WHEN the user focuses link `https://a.com` and presses Cmd+C
- THEN the link is on the internal clipboard and `https://a.com` is on the OS clipboard

### clipboard-R2: Copy All Links
"Copy All Links" on a folder collects every link in its subtree, writes their URLs to the OS clipboard
(one per line) and puts those links on the internal clipboard.

#### Scenario: nested links
- WHEN a folder holds two links and a subfolder with one more link
- THEN three newline-separated URLs are on the OS clipboard

### clipboard-R3: Paste duplicates items
Paste (menu or Cmd/Ctrl+V) re-creates each clipboard item with a new ID: inside the target folder
when the target is a folder, otherwise at the space root. Folders are pasted with their whole subtree.
After a successful paste the internal clipboard is cleared.

#### Scenario: paste a folder
- WHEN the user copies folder "Docs" (with two children) and pastes it into folder "Archive"
- THEN "Archive" has a new "Docs" with two new children, and the clipboard is empty

### clipboard-R4: Paste URLs from the OS clipboard
When the internal clipboard is empty, Cmd/Ctrl+V reads the OS clipboard. If the text looks like a URL
(it starts with `http(s)://`, or has a dot, no spaces and more than 3 characters), one link is created,
named after the hostname, with `https://` added when missing. Menu Paste on a folder instead extracts
every `http(s)://` URL in the text and creates one link per URL, then fetches their metadata.

#### Scenario: bare domain
- WHEN the OS clipboard holds `example.com`, the internal clipboard is empty and the user presses Cmd+V
- THEN a link `https://example.com` named `example.com` is created

### clipboard-R5: Cut is not available
`clipboardStore` has `cutItems` / `cutFromSelection`, but no key binding or menu entry uses them.
Cmd/Ctrl+X does nothing, and paste always duplicates.

#### Scenario: Cmd+X
- WHEN the user selects an item and presses Cmd+X
- THEN nothing happens

### clipboard-R6: Overlay sidebar clipboard
In overlay mode, copy and paste shortcuts and menu actions are forwarded to the main renderer, which
owns the single internal clipboard.

#### Scenario: copy in overlay
- WHEN the user presses Cmd+C on an item in the overlay sidebar
- THEN the item lands on the main renderer's clipboard
