/**
 * Tabs Facade
 *
 * Application facade for tab operations. Provides a clean API for UI consumption.
 *
 * @see Spec 018 - Browser Domain Layer
 */

import type { TabEntity, CreateTabInput, UpdateTabInput } from '../../domain/entities/Tab';
import type { ITabsRepository } from '../../domain/repositories/ITabsRepository';
import type { IEventBus } from '../../domain/services/IEventBus';
import type { Result, AppError } from '../common/Result';
import { ok, err } from '../common/Result';
import { CreateTabValidator } from '../../domain/validators/CreateTabValidator';
import { UpdateTabValidator } from '../../domain/validators/UpdateTabValidator';
import { normalizeUrl, urlsMatch } from '../../domain/validators/UrlNormalizer';
import {
    TabCreatedEvent,
    TabClosedEvent,
    TabActivatedEvent,
    TabNavigatedEvent,
    TabTrackingChangedEvent,
} from '../../domain/events/TabEvents';
import { ValidationError } from '../../domain/errors/ValidationError';
import { EntityNotFoundError } from '../../domain/errors/EntityNotFoundError';
import { BusinessRuleError } from '../../domain/errors/BusinessRuleError';

/**
 * Application facade for tab operations
 *
 * Design Decisions:
 * - Returns Result<T, AppError> for all operations
 * - Emits domain events for cross-cutting concerns
 * - Handles duplicate detection (by SpaceItemId, then by URL)
 * - Manages tab limit (MAX_TABS = 20)
 * - Follows same patterns as SpacesFacade (Spec 009)
 */
export class TabsFacade {
    private readonly MAX_TABS = 20;
    private readonly createValidator = new CreateTabValidator();
    private readonly updateValidator = new UpdateTabValidator();

    constructor(
        private readonly tabsRepository: ITabsRepository,
        private readonly eventBus?: IEventBus
    ) {}

    // ============ Query Operations ============

    /**
     * Get all tabs ordered by position
     */
    async getTabs(): Promise<Result<TabEntity[], AppError>> {
        try {
            const tabs = await this.tabsRepository.getAll();
            return ok(tabs);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    /**
     * Get a single tab by ID
     */
    async getTab(id: string): Promise<Result<TabEntity | null, AppError>> {
        try {
            const tab = await this.tabsRepository.getById(id);
            return ok(tab);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    /**
     * Get the currently active tab
     */
    async getActiveTab(): Promise<Result<TabEntity | null, AppError>> {
        try {
            const tab = await this.tabsRepository.getActive();
            return ok(tab);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    /**
     * Get tab count
     */
    async getTabCount(): Promise<Result<number, AppError>> {
        try {
            const count = await this.tabsRepository.count();
            return ok(count);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    /**
     * Find tab by Space item ID (for sidebar highlighting)
     */
    async findTabBySpaceItem(spaceItemId: string): Promise<Result<TabEntity | null, AppError>> {
        try {
            const tab = await this.tabsRepository.getBySpaceItemId(spaceItemId);
            return ok(tab);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    // ============ Command Operations ============

    /**
     * Create a new tab
     *
     * Handles:
     * - Validation
     * - Duplicate detection (by SpaceItemId, then by URL)
     * - Tab limit enforcement
     * - Event emission
     */
    async createTab(input: CreateTabInput): Promise<Result<TabEntity, AppError>> {
        try {
            // Validate input
            const validation = this.createValidator.validate(input);
            if (!validation.success) {
                return err(this.mapError(validation.errors[0]));
            }
            const validatedInput = validation.data!;

            // Check tab limit
            const count = await this.tabsRepository.count();
            if (count >= this.MAX_TABS) {
                await this.tabsRepository.deleteOldestInactive();
            }

            // PRIMARY: Check for duplicate by Space item ID
            if (validatedInput.originSpaceItemId) {
                const existing = await this.tabsRepository.getBySpaceItemId(validatedInput.originSpaceItemId);
                if (existing) {
                    // Activate existing tab instead of creating duplicate
                    if (validatedInput.activate) {
                        await this.tabsRepository.setActive(existing.id);
                        await this.emitEvent(new TabActivatedEvent({
                            tabId: existing.id,
                            previousTabId: null,
                        }));
                    }
                    return ok(existing);
                }
            }

            // SECONDARY: Check for duplicate by URL
            if (validatedInput.url) {
                const existing = await this.tabsRepository.getByUrl(validatedInput.url);
                if (existing) {
                    // Activate existing tab instead of creating duplicate
                    if (validatedInput.activate) {
                        await this.tabsRepository.setActive(existing.id);
                        await this.emitEvent(new TabActivatedEvent({
                            tabId: existing.id,
                            previousTabId: null,
                        }));
                    }
                    return ok(existing);
                }
            }

            // Create new tab
            const tab = await this.tabsRepository.create(validatedInput);

            // Emit event
            await this.emitEvent(new TabCreatedEvent({
                tabId: tab.id,
                url: tab.url,
                originSpaceId: tab.originSpaceId,
                originSpaceItemId: tab.originSpaceItemId,
            }));

            return ok(tab);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    /**
     * Create a tab from a Space item with origin tracking
     * Convenience method that sets up origin tracking
     */
    async createTabFromSpace(params: {
        url: string;
        title: string;
        spaceId: string;
        spaceItemId: string;
        faviconUrl?: string | null;
    }): Promise<Result<TabEntity, AppError>> {
        return this.createTab({
            url: params.url,
            title: params.title,
            originSpaceId: params.spaceId,
            originSpaceItemId: params.spaceItemId,
            faviconUrl: params.faviconUrl,
            activate: true,
        });
    }

    /**
     * Update a tab
     */
    async updateTab(input: UpdateTabInput): Promise<Result<TabEntity, AppError>> {
        try {
            // Validate input
            const validation = this.updateValidator.validate(input);
            if (!validation.success) {
                return err(this.mapError(validation.errors[0]));
            }

            const tab = await this.tabsRepository.update(input);
            return ok(tab);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    /**
     * Update tab URL and handle tracking status
     */
    async updateTabUrl(tabId: string, newUrl: string): Promise<Result<TabEntity, AppError>> {
        try {
            const existing = await this.tabsRepository.getById(tabId);
            if (!existing) {
                return err(this.mapError(new EntityNotFoundError('Tab', tabId)));
            }

            const previousUrl = existing.url;

            // Determine if still tracking origin
            let isTracked = existing.isTracked;
            if (existing.originUrl && isTracked) {
                isTracked = urlsMatch(newUrl, existing.originUrl);

                // Emit tracking changed event if status changed
                if (isTracked !== existing.isTracked && existing.originSpaceItemId) {
                    await this.emitEvent(new TabTrackingChangedEvent({
                        tabId,
                        originSpaceItemId: existing.originSpaceItemId,
                        isTracked,
                    }));
                }
            }

            const tab = await this.tabsRepository.update({
                id: tabId,
                url: newUrl,
                isTracked,
                isSecure: newUrl.startsWith('https://'),
            });

            // Emit navigation event
            await this.emitEvent(new TabNavigatedEvent({
                tabId,
                url: newUrl,
                previousUrl,
                isTracked,
            }));

            return ok(tab);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    /**
     * Switch to a tab (make it active)
     */
    async switchTab(tabId: string): Promise<Result<void, AppError>> {
        try {
            const currentActive = await this.tabsRepository.getActive();
            await this.tabsRepository.setActive(tabId);

            await this.emitEvent(new TabActivatedEvent({
                tabId,
                previousTabId: currentActive?.id ?? null,
            }));

            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    /**
     * Close a tab
     */
    async closeTab(tabId: string): Promise<Result<void, AppError>> {
        try {
            const tab = await this.tabsRepository.getById(tabId);
            if (!tab) {
                return err(this.mapError(new EntityNotFoundError('Tab', tabId)));
            }

            const wasActive = tab.isActive;
            await this.tabsRepository.delete(tabId);

            await this.emitEvent(new TabClosedEvent({
                tabId,
                wasActive,
            }));

            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    /**
     * Reorder tabs
     */
    async reorderTabs(orderedIds: string[]): Promise<Result<void, AppError>> {
        try {
            await this.tabsRepository.reorder(orderedIds);
            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    /**
     * Check if a Space item should be highlighted (has active tracked tab)
     */
    async shouldHighlightSpaceItem(spaceItemId: string): Promise<Result<boolean, AppError>> {
        try {
            const activeTab = await this.tabsRepository.getActive();
            if (!activeTab) {
                return ok(false);
            }

            const shouldHighlight =
                activeTab.originSpaceItemId === spaceItemId &&
                activeTab.isTracked;

            return ok(shouldHighlight);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    // ============ Private Helpers ============

    private async emitEvent(event: unknown): Promise<void> {
        if (this.eventBus) {
            await this.eventBus.publish(event as any);
        }
    }

    private mapError(error: unknown): AppError {
        if (error instanceof ValidationError) {
            return {
                type: 'validation',
                message: error.message,
                field: error.field,
                code: error.code,
            };
        }

        if (error instanceof BusinessRuleError) {
            return {
                type: 'business_rule',
                message: error.message,
                code: error.code,
            };
        }

        if (error instanceof EntityNotFoundError) {
            return {
                type: 'not_found',
                message: error.message,
                code: error.code,
            };
        }

        return {
            type: 'system',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}
