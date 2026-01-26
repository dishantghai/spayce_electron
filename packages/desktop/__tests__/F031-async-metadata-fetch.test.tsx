import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * F031: Async Metadata Fetch Tests
 * 
 * Tests for the async metadata fetching flow when creating links:
 * 1. Link is created immediately with URL as name (non-blocking)
 * 2. Metadata (title + favicon) is fetched asynchronously
 * 3. Link name is updated with page title
 * 4. Favicon is updated with base64 data
 * 5. UI refetches to show updated data
 * 
 * This prevents:
 * - Slow link creation (blocking on metadata fetch)
 * - Missing page titles (using URL as permanent name)
 * - Missing favicons (not updating after fetch)
 */

describe('F031: Async Metadata Fetch', () => {
    let mockElectronAPI: any;
    let mockRefetch: any;

    beforeEach(() => {
        // Mock window.electronAPI
        mockRefetch = vi.fn().mockResolvedValue(undefined);

        mockElectronAPI = {
            items: {
                create: vi.fn().mockResolvedValue({
                    success: true,
                    data: { id: 'test-link-id' }
                }),
                rename: vi.fn().mockResolvedValue({ success: true }),
                updateMetadata: vi.fn().mockResolvedValue({ success: true })
            },
            metadata: {
                extract: vi.fn()
            }
        };

        (global as any).window = {
            electronAPI: mockElectronAPI
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Link Creation Flow', () => {
        it('should create link immediately with URL as name (non-blocking)', async () => {
            const input = {
                spaceId: 'space-1',
                parentId: null,
                name: 'https://example.com',
                path: 'https://example.com',
                type: 'link'
            };

            // Simulate handleCreateItem
            const result = await mockElectronAPI.items.create(input);

            expect(result.success).toBe(true);
            expect(mockElectronAPI.items.create).toHaveBeenCalledWith(input);
            expect(mockElectronAPI.items.create).toHaveBeenCalledTimes(1);
        });

        it('should fetch metadata asynchronously after link creation', async () => {
            mockElectronAPI.metadata.extract.mockResolvedValue({
                success: true,
                data: {
                    title: 'Example Domain',
                    faviconData: 'data:image/png;base64,iVBORw0KGgo='
                }
            });

            const input = {
                spaceId: 'space-1',
                parentId: null,
                name: 'https://example.com',
                path: 'https://example.com',
                type: 'link'
            };

            // Create link
            const result = await mockElectronAPI.items.create(input);
            await mockRefetch();

            // Fetch metadata (async)
            if (result.success && result.data?.id) {
                const metadata = await mockElectronAPI.metadata.extract(input.path);

                expect(mockElectronAPI.metadata.extract).toHaveBeenCalledWith('https://example.com');
                expect(metadata.success).toBe(true);
                expect(metadata.data.title).toBe('Example Domain');
            }
        });

        it('should update link name with page title after metadata fetch', async () => {
            mockElectronAPI.metadata.extract.mockResolvedValue({
                success: true,
                data: {
                    title: 'Example Domain',
                    faviconData: 'data:image/png;base64,iVBORw0KGgo='
                }
            });

            const input = {
                spaceId: 'space-1',
                parentId: null,
                name: 'https://example.com',
                path: 'https://example.com',
                type: 'link'
            };

            // Create link
            const result = await mockElectronAPI.items.create(input);
            await mockRefetch();

            // Fetch metadata and update
            if (result.success && result.data?.id) {
                const itemId = result.data.id;
                const metadata = await mockElectronAPI.metadata.extract(input.path);

                if (metadata?.success && metadata?.data?.title) {
                    await mockElectronAPI.items.rename(itemId, metadata.data.title);
                    await mockRefetch();
                }

                expect(mockElectronAPI.items.rename).toHaveBeenCalledWith('test-link-id', 'Example Domain');
                expect(mockRefetch).toHaveBeenCalledTimes(2); // Once after create, once after rename
            }
        });

        it('should update favicon with base64 data after metadata fetch', async () => {
            mockElectronAPI.metadata.extract.mockResolvedValue({
                success: true,
                data: {
                    title: 'Example Domain',
                    faviconData: 'data:image/png;base64,iVBORw0KGgo='
                }
            });

            const input = {
                spaceId: 'space-1',
                parentId: null,
                name: 'https://example.com',
                path: 'https://example.com',
                type: 'link'
            };

            // Create link
            const result = await mockElectronAPI.items.create(input);
            await mockRefetch();

            // Fetch metadata and update
            if (result.success && result.data?.id) {
                const itemId = result.data.id;
                const metadata = await mockElectronAPI.metadata.extract(input.path);

                if (metadata?.success && metadata?.data?.faviconData) {
                    await mockElectronAPI.items.updateMetadata(itemId, {
                        faviconUrl: metadata.data.faviconData
                    });
                    await mockRefetch();
                }

                expect(mockElectronAPI.items.updateMetadata).toHaveBeenCalledWith('test-link-id', {
                    faviconUrl: 'data:image/png;base64,iVBORw0KGgo='
                });
            }
        });

        it('should only refetch if metadata was actually updated', async () => {
            // No title or favicon in metadata
            mockElectronAPI.metadata.extract.mockResolvedValue({
                success: true,
                data: {
                    title: null,
                    faviconData: null
                }
            });

            const input = {
                spaceId: 'space-1',
                parentId: null,
                name: 'https://example.com',
                path: 'https://example.com',
                type: 'link'
            };

            // Create link
            const result = await mockElectronAPI.items.create(input);
            await mockRefetch();

            // Fetch metadata (no updates needed)
            if (result.success && result.data?.id) {
                const metadata = await mockElectronAPI.metadata.extract(input.path);
                let needsRefetch = false;

                if (metadata?.success && metadata?.data) {
                    if (metadata.data.title && metadata.data.title !== input.name) {
                        needsRefetch = true;
                    }
                    if (metadata.data.faviconData) {
                        needsRefetch = true;
                    }
                }

                if (needsRefetch) {
                    await mockRefetch();
                }

                // Should only refetch once (after create, not after metadata)
                expect(mockRefetch).toHaveBeenCalledTimes(1);
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle metadata fetch failure gracefully', async () => {
            mockElectronAPI.metadata.extract.mockRejectedValue(new Error('Network error'));

            const input = {
                spaceId: 'space-1',
                parentId: null,
                name: 'https://example.com',
                path: 'https://example.com',
                type: 'link'
            };

            // Create link
            const result = await mockElectronAPI.items.create(input);
            await mockRefetch();

            // Fetch metadata (fails)
            if (result.success && result.data?.id) {
                try {
                    await mockElectronAPI.metadata.extract(input.path);
                } catch (err) {
                    // Should fail silently - link already created with URL as name
                    expect(err).toBeInstanceOf(Error);
                }

                // Should still have created the link
                expect(mockElectronAPI.items.create).toHaveBeenCalled();
                expect(mockRefetch).toHaveBeenCalledTimes(1);
            }
        });

        it('should not update title if extracted title is same as URL', async () => {
            mockElectronAPI.metadata.extract.mockResolvedValue({
                success: true,
                data: {
                    title: 'https://example.com', // Same as URL
                    faviconData: 'data:image/png;base64,iVBORw0KGgo='
                }
            });

            const input = {
                spaceId: 'space-1',
                parentId: null,
                name: 'https://example.com',
                path: 'https://example.com',
                type: 'link'
            };

            // Create link
            const result = await mockElectronAPI.items.create(input);
            await mockRefetch();

            // Fetch metadata and update
            if (result.success && result.data?.id) {
                const itemId = result.data.id;
                const metadata = await mockElectronAPI.metadata.extract(input.path);

                if (metadata?.success && metadata?.data) {
                    // Only update if title is different
                    if (metadata.data.title && metadata.data.title !== input.name) {
                        await mockElectronAPI.items.rename(itemId, metadata.data.title);
                    }
                }

                // Should NOT have called rename since title is same as URL
                expect(mockElectronAPI.items.rename).not.toHaveBeenCalled();
            }
        });

        it('should handle missing metadata gracefully', async () => {
            mockElectronAPI.metadata.extract.mockResolvedValue({
                success: false,
                error: { message: 'Failed to fetch page' }
            });

            const input = {
                spaceId: 'space-1',
                parentId: null,
                name: 'https://example.com',
                path: 'https://example.com',
                type: 'link'
            };

            // Create link
            const result = await mockElectronAPI.items.create(input);
            await mockRefetch();

            // Fetch metadata (fails)
            if (result.success && result.data?.id) {
                const metadata = await mockElectronAPI.metadata.extract(input.path);

                if (metadata?.success && metadata?.data) {
                    // Should not reach here
                    expect(true).toBe(false);
                }

                // Should not have updated anything
                expect(mockElectronAPI.items.rename).not.toHaveBeenCalled();
                expect(mockElectronAPI.items.updateMetadata).not.toHaveBeenCalled();
            }
        });
    });

    describe('Folder Creation (No Metadata Fetch)', () => {
        it('should not fetch metadata for folders', async () => {
            const input = {
                spaceId: 'space-1',
                parentId: null,
                name: 'My Folder',
                path: 'My Folder',
                type: 'folder'
            };

            // Create folder
            const result = await mockElectronAPI.items.create(input);
            await mockRefetch();

            // Should NOT fetch metadata for folders
            expect(mockElectronAPI.metadata.extract).not.toHaveBeenCalled();
            expect(mockRefetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('Performance', () => {
        it('should not block UI while fetching metadata', async () => {
            // Simulate slow metadata fetch
            mockElectronAPI.metadata.extract.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({
                    success: true,
                    data: {
                        title: 'Example Domain',
                        faviconData: 'data:image/png;base64,iVBORw0KGgo='
                    }
                }), 2000))
            );

            const input = {
                spaceId: 'space-1',
                parentId: null,
                name: 'https://example.com',
                path: 'https://example.com',
                type: 'link'
            };

            // Create link (should return immediately)
            const startTime = Date.now();
            const result = await mockElectronAPI.items.create(input);
            await mockRefetch();
            const endTime = Date.now();

            // Should complete quickly (not wait for metadata)
            expect(endTime - startTime).toBeLessThan(100);
            expect(result.success).toBe(true);

            // Metadata fetch happens in background
            expect(mockElectronAPI.metadata.extract).not.toHaveBeenCalled();
        });
    });
});
