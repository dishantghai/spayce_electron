import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabsFacade } from '../../../src/application/facades/TabsFacade';
import type { ITabsRepository } from '../../../src/domain/repositories/ITabsRepository';
import type { IEventBus } from '../../../src/domain/services/IEventBus';
import type { TabEntity } from '../../../src/domain/entities/Tab';
import { TabType } from '../../../src/domain/entities/Tab';

describe('TabsFacade', () => {
    let facade: TabsFacade;
    let mockRepository: { [K in keyof ITabsRepository]: ReturnType<typeof vi.fn> };
    let mockEventBus: { publish: ReturnType<typeof vi.fn> };

    const createMockTab = (overrides: Partial<TabEntity> = {}): TabEntity => ({
        id: 'tab-1',
        tabType: TabType.Web,
        url: 'https://example.com',
        title: 'Example',
        faviconUrl: null,
        originSpaceId: null,
        originSpaceItemId: null,
        isTracked: false,
        originUrl: null,
        isActive: false,
        isLoading: false,
        loadingProgress: 0,
        canGoBack: false,
        canGoForward: false,
        isSecure: true,
        errorCode: null,
        errorDescription: null,
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: null,
        ...overrides,
    });

    beforeEach(() => {
        mockRepository = {
            getAll: vi.fn(),
            getById: vi.fn(),
            getActive: vi.fn(),
            getBySpaceItemId: vi.fn(),
            getByUrl: vi.fn(),
            getBySpaceId: vi.fn(),
            count: vi.fn(),
            countByType: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            setActive: vi.fn(),
            reorder: vi.fn(),
            deleteOldestInactive: vi.fn(),
            deleteBySpaceId: vi.fn(),
            updateTrackingByUrl: vi.fn(),
        };

        mockEventBus = {
            publish: vi.fn(),
        };

        facade = new TabsFacade(
            mockRepository as unknown as ITabsRepository,
            mockEventBus as unknown as IEventBus
        );
    });

    describe('getTabs', () => {
        it('should return Result with tabs array on success', async () => {
            const tabs = [createMockTab({ id: 'tab-1' }), createMockTab({ id: 'tab-2' })];
            vi.mocked(mockRepository.getAll).mockResolvedValue(tabs);

            const result = await facade.getTabs();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(2);
            }
        });

        it('should return Result with empty array when no tabs', async () => {
            vi.mocked(mockRepository.getAll).mockResolvedValue([]);

            const result = await facade.getTabs();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(0);
            }
        });

        it('should return error Result on repository failure', async () => {
            vi.mocked(mockRepository.getAll).mockRejectedValue(new Error('Database error'));

            const result = await facade.getTabs();

            expect(result.success).toBe(false);
        });
    });

    describe('getTab', () => {
        it('should return Result with tab when found', async () => {
            const tab = createMockTab({ id: 'tab-123' });
            vi.mocked(mockRepository.getById).mockResolvedValue(tab);

            const result = await facade.getTab('tab-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data?.id).toBe('tab-123');
            }
        });

        it('should return Result with null when not found', async () => {
            vi.mocked(mockRepository.getById).mockResolvedValue(null);

            const result = await facade.getTab('non-existent');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeNull();
            }
        });

        it('should return error Result on repository failure', async () => {
            vi.mocked(mockRepository.getById).mockRejectedValue(new Error('Database error'));

            const result = await facade.getTab('tab-123');

            expect(result.success).toBe(false);
        });
    });

    describe('getActiveTab', () => {
        it('should return Result with active tab', async () => {
            const activeTab = createMockTab({ id: 'active-tab', isActive: true });
            vi.mocked(mockRepository.getActive).mockResolvedValue(activeTab);

            const result = await facade.getActiveTab();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data?.isActive).toBe(true);
            }
        });

        it('should return Result with null when no active tab', async () => {
            vi.mocked(mockRepository.getActive).mockResolvedValue(null);

            const result = await facade.getActiveTab();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeNull();
            }
        });
    });

    describe('getTabCount', () => {
        it('should return Result with count', async () => {
            vi.mocked(mockRepository.count).mockResolvedValue(5);

            const result = await facade.getTabCount();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(5);
            }
        });

        it('should return 0 when no tabs', async () => {
            vi.mocked(mockRepository.count).mockResolvedValue(0);

            const result = await facade.getTabCount();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(0);
            }
        });
    });

    describe('findTabBySpaceItem', () => {
        it('should return Result with tab when found', async () => {
            const tab = createMockTab({ originSpaceItemId: 'item-123' });
            vi.mocked(mockRepository.getBySpaceItemId).mockResolvedValue(tab);

            const result = await facade.findTabBySpaceItem('item-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data?.originSpaceItemId).toBe('item-123');
            }
        });

        it('should return Result with null when not found', async () => {
            vi.mocked(mockRepository.getBySpaceItemId).mockResolvedValue(null);

            const result = await facade.findTabBySpaceItem('non-existent');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeNull();
            }
        });
    });

    describe('createTab', () => {
        it('should create new tab when no duplicates exist', async () => {
            vi.mocked(mockRepository.count).mockResolvedValue(5);
            vi.mocked(mockRepository.getBySpaceItemId).mockResolvedValue(null);
            vi.mocked(mockRepository.getByUrl).mockResolvedValue(null);

            const newTab = createMockTab({ id: 'new-tab' });
            vi.mocked(mockRepository.create).mockResolvedValue(newTab);

            const result = await facade.createTab({ url: 'https://new.com' });

            expect(result.success).toBe(true);
            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockEventBus.publish).toHaveBeenCalled();
        });

        it('should activate existing tab when duplicate by SpaceItemId (primary)', async () => {
            vi.mocked(mockRepository.count).mockResolvedValue(5);

            const existingTab = createMockTab({ id: 'existing' });
            vi.mocked(mockRepository.getBySpaceItemId).mockResolvedValue(existingTab);

            const result = await facade.createTab({
                url: 'https://example.com',
                originSpaceItemId: 'item-123',
                originSpaceId: 'space-123',
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(existingTab);
            }
            expect(mockRepository.create).not.toHaveBeenCalled();
            expect(mockRepository.setActive).toHaveBeenCalledWith('existing');
        });

        it('should activate existing tab when duplicate by URL (secondary)', async () => {
            vi.mocked(mockRepository.count).mockResolvedValue(5);
            vi.mocked(mockRepository.getBySpaceItemId).mockResolvedValue(null);

            const existingTab = createMockTab({ id: 'existing-by-url' });
            vi.mocked(mockRepository.getByUrl).mockResolvedValue(existingTab);

            const result = await facade.createTab({ url: 'https://example.com' });

            expect(result.success).toBe(true);
            expect(mockRepository.create).not.toHaveBeenCalled();
            expect(mockRepository.setActive).toHaveBeenCalledWith('existing-by-url');
        });

        it('should prioritize SpaceItemId over URL for duplicate detection', async () => {
            vi.mocked(mockRepository.count).mockResolvedValue(5);

            const tabBySpaceItem = createMockTab({ id: 'by-space-item' });
            const tabByUrl = createMockTab({ id: 'by-url' });

            vi.mocked(mockRepository.getBySpaceItemId).mockResolvedValue(tabBySpaceItem);
            vi.mocked(mockRepository.getByUrl).mockResolvedValue(tabByUrl);

            const result = await facade.createTab({
                url: 'https://example.com',
                originSpaceItemId: 'item-123',
                originSpaceId: 'space-123',
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data?.id).toBe('by-space-item');
            }
            // URL lookup should not have been called since SpaceItemId matched
            expect(mockRepository.getByUrl).not.toHaveBeenCalled();
        });

        it('should delete oldest inactive when at tab limit (MAX_TABS = 20)', async () => {
            vi.mocked(mockRepository.count).mockResolvedValue(20); // At limit
            vi.mocked(mockRepository.getBySpaceItemId).mockResolvedValue(null);
            vi.mocked(mockRepository.getByUrl).mockResolvedValue(null);
            vi.mocked(mockRepository.create).mockResolvedValue(createMockTab());

            await facade.createTab({ url: 'https://new.com' });

            expect(mockRepository.deleteOldestInactive).toHaveBeenCalled();
        });

        it('should not delete when under tab limit', async () => {
            vi.mocked(mockRepository.count).mockResolvedValue(10); // Under limit
            vi.mocked(mockRepository.getBySpaceItemId).mockResolvedValue(null);
            vi.mocked(mockRepository.getByUrl).mockResolvedValue(null);
            vi.mocked(mockRepository.create).mockResolvedValue(createMockTab());

            await facade.createTab({ url: 'https://new.com' });

            expect(mockRepository.deleteOldestInactive).not.toHaveBeenCalled();
        });

        it('should return error for invalid input', async () => {
            const result = await facade.createTab({ url: 123 as unknown as string });

            expect(result.success).toBe(false);
        });

        it('should emit TabCreatedEvent on successful creation', async () => {
            vi.mocked(mockRepository.count).mockResolvedValue(0);
            vi.mocked(mockRepository.getBySpaceItemId).mockResolvedValue(null);
            vi.mocked(mockRepository.getByUrl).mockResolvedValue(null);

            const newTab = createMockTab({ id: 'new-tab' });
            vi.mocked(mockRepository.create).mockResolvedValue(newTab);

            await facade.createTab({ url: 'https://example.com' });

            expect(mockEventBus.publish).toHaveBeenCalled();
        });
    });

    describe('createTabFromSpace', () => {
        it('should create tab with origin tracking', async () => {
            vi.mocked(mockRepository.count).mockResolvedValue(5);
            vi.mocked(mockRepository.getBySpaceItemId).mockResolvedValue(null);
            vi.mocked(mockRepository.getByUrl).mockResolvedValue(null);

            const newTab = createMockTab({
                id: 'new-tab',
                originSpaceId: 'space-123',
                originSpaceItemId: 'item-456',
            });
            vi.mocked(mockRepository.create).mockResolvedValue(newTab);

            const result = await facade.createTabFromSpace({
                url: 'https://example.com',
                title: 'Example',
                spaceId: 'space-123',
                spaceItemId: 'item-456',
            });

            expect(result.success).toBe(true);
            expect(mockRepository.create).toHaveBeenCalled();
        });
    });

    describe('updateTab', () => {
        it('should update tab and return Result', async () => {
            const updatedTab = createMockTab({ id: 'tab-1', title: 'New Title' });
            vi.mocked(mockRepository.update).mockResolvedValue(updatedTab);

            const result = await facade.updateTab({ id: 'tab-1', title: 'New Title' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data?.title).toBe('New Title');
            }
        });

        it('should return error for invalid input', async () => {
            const result = await facade.updateTab({ id: '' });

            expect(result.success).toBe(false);
        });
    });

    describe('updateTabUrl', () => {
        it('should update URL and maintain tracking when URL matches origin', async () => {
            const tab = createMockTab({
                id: 'tab-1',
                url: 'https://example.com',
                originUrl: 'https://example.com',
                isTracked: true,
            });
            vi.mocked(mockRepository.getById).mockResolvedValue(tab);
            vi.mocked(mockRepository.update).mockResolvedValue({
                ...tab,
                url: 'https://example.com/',
            });

            const result = await facade.updateTabUrl('tab-1', 'https://example.com/');

            expect(result.success).toBe(true);
        });

        it('should update tracking status when navigating away from origin', async () => {
            const tab = createMockTab({
                id: 'tab-1',
                url: 'https://example.com',
                originUrl: 'https://example.com',
                originSpaceItemId: 'item-123',
                isTracked: true,
            });
            vi.mocked(mockRepository.getById).mockResolvedValue(tab);
            vi.mocked(mockRepository.update).mockResolvedValue({
                ...tab,
                url: 'https://different.com',
                isTracked: false,
            });

            const result = await facade.updateTabUrl('tab-1', 'https://different.com');

            expect(result.success).toBe(true);
            // Should emit TabTrackingChangedEvent and TabNavigatedEvent
            expect(mockEventBus.publish).toHaveBeenCalled();
        });

        it('should return error when tab not found', async () => {
            vi.mocked(mockRepository.getById).mockResolvedValue(null);

            const result = await facade.updateTabUrl('non-existent', 'https://example.com');

            expect(result.success).toBe(false);
        });

        it('should emit TabNavigatedEvent', async () => {
            const tab = createMockTab({ id: 'tab-1', url: 'https://old.com' });
            vi.mocked(mockRepository.getById).mockResolvedValue(tab);
            vi.mocked(mockRepository.update).mockResolvedValue({ ...tab, url: 'https://new.com' });

            await facade.updateTabUrl('tab-1', 'https://new.com');

            expect(mockEventBus.publish).toHaveBeenCalled();
        });
    });

    describe('switchTab', () => {
        it('should activate tab and emit event', async () => {
            const currentActive = createMockTab({ id: 'old-active', isActive: true });
            vi.mocked(mockRepository.getActive).mockResolvedValue(currentActive);
            vi.mocked(mockRepository.setActive).mockResolvedValue(undefined);

            const result = await facade.switchTab('new-active');

            expect(result.success).toBe(true);
            expect(mockRepository.setActive).toHaveBeenCalledWith('new-active');
            expect(mockEventBus.publish).toHaveBeenCalled();
        });

        it('should handle switch when no previous active tab', async () => {
            vi.mocked(mockRepository.getActive).mockResolvedValue(null);
            vi.mocked(mockRepository.setActive).mockResolvedValue(undefined);

            const result = await facade.switchTab('new-active');

            expect(result.success).toBe(true);
            expect(mockRepository.setActive).toHaveBeenCalledWith('new-active');
        });

        it('should emit TabActivatedEvent with previousTabId', async () => {
            const currentActive = createMockTab({ id: 'previous', isActive: true });
            vi.mocked(mockRepository.getActive).mockResolvedValue(currentActive);
            vi.mocked(mockRepository.setActive).mockResolvedValue(undefined);

            await facade.switchTab('new-active');

            expect(mockEventBus.publish).toHaveBeenCalled();
        });
    });

    describe('closeTab', () => {
        it('should delete tab and emit event', async () => {
            const tab = createMockTab({ id: 'tab-to-close', isActive: false });
            vi.mocked(mockRepository.getById).mockResolvedValue(tab);
            vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

            const result = await facade.closeTab('tab-to-close');

            expect(result.success).toBe(true);
            expect(mockRepository.delete).toHaveBeenCalledWith('tab-to-close');
            expect(mockEventBus.publish).toHaveBeenCalled();
        });

        it('should return error when tab not found', async () => {
            vi.mocked(mockRepository.getById).mockResolvedValue(null);

            const result = await facade.closeTab('non-existent');

            expect(result.success).toBe(false);
        });

        it('should emit TabClosedEvent with wasActive flag', async () => {
            const activeTab = createMockTab({ id: 'active-tab', isActive: true });
            vi.mocked(mockRepository.getById).mockResolvedValue(activeTab);
            vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

            await facade.closeTab('active-tab');

            expect(mockEventBus.publish).toHaveBeenCalled();
        });
    });

    describe('reorderTabs', () => {
        it('should reorder tabs', async () => {
            vi.mocked(mockRepository.reorder).mockResolvedValue(undefined);

            const result = await facade.reorderTabs(['tab-3', 'tab-1', 'tab-2']);

            expect(result.success).toBe(true);
            expect(mockRepository.reorder).toHaveBeenCalledWith(['tab-3', 'tab-1', 'tab-2']);
        });

        it('should handle empty order array', async () => {
            vi.mocked(mockRepository.reorder).mockResolvedValue(undefined);

            const result = await facade.reorderTabs([]);

            expect(result.success).toBe(true);
        });
    });

    describe('shouldHighlightSpaceItem', () => {
        it('should return true when active tab tracks the item', async () => {
            const activeTab = createMockTab({
                originSpaceItemId: 'item-123',
                isTracked: true,
                isActive: true,
            });
            vi.mocked(mockRepository.getActive).mockResolvedValue(activeTab);

            const result = await facade.shouldHighlightSpaceItem('item-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(true);
            }
        });

        it('should return false when active tab has different origin item', async () => {
            const activeTab = createMockTab({
                originSpaceItemId: 'item-different',
                isTracked: true,
                isActive: true,
            });
            vi.mocked(mockRepository.getActive).mockResolvedValue(activeTab);

            const result = await facade.shouldHighlightSpaceItem('item-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(false);
            }
        });

        it('should return false when active tab is not tracking', async () => {
            const activeTab = createMockTab({
                originSpaceItemId: 'item-123',
                isTracked: false,
                isActive: true,
            });
            vi.mocked(mockRepository.getActive).mockResolvedValue(activeTab);

            const result = await facade.shouldHighlightSpaceItem('item-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(false);
            }
        });

        it('should return false when no active tab', async () => {
            vi.mocked(mockRepository.getActive).mockResolvedValue(null);

            const result = await facade.shouldHighlightSpaceItem('item-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(false);
            }
        });

        it('should return false when active tab has no origin', async () => {
            const activeTab = createMockTab({
                originSpaceItemId: null,
                isTracked: false,
                isActive: true,
            });
            vi.mocked(mockRepository.getActive).mockResolvedValue(activeTab);

            const result = await facade.shouldHighlightSpaceItem('item-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(false);
            }
        });
    });

    describe('error handling', () => {
        it('should catch and return repository errors', async () => {
            vi.mocked(mockRepository.getAll).mockRejectedValue(new Error('Network error'));

            const result = await facade.getTabs();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.type).toBe('system');
                expect(result.error.message).toBe('Network error');
            }
        });

        it('should work without event bus (optional dependency)', async () => {
            const facadeWithoutEventBus = new TabsFacade(
                mockRepository as unknown as ITabsRepository
            );

            vi.mocked(mockRepository.count).mockResolvedValue(0);
            vi.mocked(mockRepository.getBySpaceItemId).mockResolvedValue(null);
            vi.mocked(mockRepository.getByUrl).mockResolvedValue(null);
            vi.mocked(mockRepository.create).mockResolvedValue(createMockTab());

            const result = await facadeWithoutEventBus.createTab({ url: 'https://example.com' });

            expect(result.success).toBe(true);
        });
    });
});
