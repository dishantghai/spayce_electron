import { useState, useEffect, useCallback } from 'react';
import type { SpaceItemEntity } from '@spayce/core';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { ISpaceItemsRepository } from '@spayce/core';
import { useInvalidation } from './common/InvalidationContext';

export interface UsePinnedItemsResult {
    data: SpaceItemEntity[] | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function usePinnedItems(spaceId: string): UsePinnedItemsResult {
    const [data, setData] = useState<SpaceItemEntity[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { subscribe } = useInvalidation();

    const fetchPinnedItems = useCallback(async () => {
        try {
            setLoading(true);
            const repo = serviceRegistry.get<ISpaceItemsRepository>(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY);
            const items = await repo.getPinnedItems(spaceId);
            setData(items);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch pinned items'));
        } finally {
            setLoading(false);
        }
    }, [spaceId]);

    useEffect(() => {
        fetchPinnedItems();
    }, [fetchPinnedItems]);

    useEffect(() => {
        return subscribe('pins', fetchPinnedItems);
    }, [subscribe, fetchPinnedItems]);

    return { data, loading, error, refetch: fetchPinnedItems };
}
