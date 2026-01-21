import { useState, useEffect, useCallback } from 'react';
import type { SpaceItemEntity } from '@spayce/core';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SearchFacade } from '@spayce/core/application';
import { useInvalidation } from './common/InvalidationContext';

export interface UseRecentItemsResult {
    data: SpaceItemEntity[] | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useRecentItems(profileId: string, limit?: number): UseRecentItemsResult {
    const [data, setData] = useState<SpaceItemEntity[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { subscribe } = useInvalidation();

    const fetchRecentItems = useCallback(async () => {
        try {
            setLoading(true);
            const facade = serviceRegistry.get<SearchFacade>(SERVICE_KEYS.SEARCH_FACADE);
            const result = await facade.getRecent(profileId, limit);

            if (result.success) {
                setData(result.data);
                setError(null);
            } else {
                setError(new Error(result.error.message));
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch recent items'));
        } finally {
            setLoading(false);
        }
    }, [profileId, limit]);

    useEffect(() => {
        fetchRecentItems();
    }, [fetchRecentItems]);

    useEffect(() => {
        return subscribe('recent-items', fetchRecentItems);
    }, [subscribe, fetchRecentItems]);

    return { data, loading, error, refetch: fetchRecentItems };
}
