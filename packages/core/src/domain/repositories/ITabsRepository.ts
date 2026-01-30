/**
 * Tab Repository Interface
 *
 * Defines the contract for tab persistence operations.
 * All methods are async (Promise-based).
 *
 * @see Spec 018 - Browser Domain Layer
 */

import type { TabEntity, CreateTabInput, UpdateTabInput } from '../entities/Tab';

/**
 * Tab repository interface
 *
 * Design Decisions:
 * - All methods async (Promise-based)
 * - Query methods return null for not found (not throw)
 * - Command methods throw on failure
 * - Matches patterns from ISpacesRepository (Spec 007)
 */
export interface ITabsRepository {
    // ============ Query Operations ============

    /**
     * Get all tabs ordered by position
     */
    getAll(): Promise<TabEntity[]>;

    /**
     * Get a tab by ID
     * @returns Tab or null if not found
     */
    getById(id: string): Promise<TabEntity | null>;

    /**
     * Get the currently active tab
     * @returns Active tab or null if none
     */
    getActive(): Promise<TabEntity | null>;

    /**
     * Get tab by Space item ID (primary duplicate detection)
     * @returns Tab or null if not found
     */
    getBySpaceItemId(spaceItemId: string): Promise<TabEntity | null>;

    /**
     * Get tab by normalized URL (secondary duplicate detection)
     * @param url - URL to search (will be normalized)
     * @returns Tab or null if not found
     */
    getByUrl(url: string): Promise<TabEntity | null>;

    /**
     * Get tabs by Space ID (all tabs from a Space)
     * @returns Array of tabs, may be empty
     */
    getBySpaceId(spaceId: string): Promise<TabEntity[]>;

    /**
     * Get current tab count
     */
    count(): Promise<number>;

    /**
     * Get count of tabs by type
     */
    countByType(tabType: string): Promise<number>;

    // ============ Command Operations ============

    /**
     * Create a new tab
     * @returns The created tab with generated ID and timestamps
     */
    create(input: CreateTabInput): Promise<TabEntity>;

    /**
     * Update an existing tab
     * @returns The updated tab
     * @throws EntityNotFoundError if tab doesn't exist
     */
    update(input: UpdateTabInput): Promise<TabEntity>;

    /**
     * Delete a tab by ID
     * @throws EntityNotFoundError if tab doesn't exist
     */
    delete(id: string): Promise<void>;

    /**
     * Set a tab as active (deactivates all others)
     * @throws EntityNotFoundError if tab doesn't exist
     */
    setActive(id: string): Promise<void>;

    /**
     * Reorder tabs by providing ordered IDs
     * @param orderedIds - Tab IDs in desired order
     */
    reorder(orderedIds: string[]): Promise<void>;

    /**
     * Delete the oldest inactive tab (for tab limit management)
     * Does nothing if no inactive tabs exist
     */
    deleteOldestInactive(): Promise<void>;

    /**
     * Delete all tabs by Space ID (cleanup when Space deleted)
     */
    deleteBySpaceId(spaceId: string): Promise<void>;

    /**
     * Update tracking status for all tabs from a Space item
     * Called when user navigates away from origin URL
     */
    updateTrackingByUrl(spaceItemId: string, newUrl: string, originUrl: string): Promise<void>;
}
