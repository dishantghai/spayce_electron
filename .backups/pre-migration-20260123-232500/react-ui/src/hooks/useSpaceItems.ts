import { useState, useEffect, useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade } from '@spayce/core/application';
import type { SpaceItemWithChildren } from '@spayce/core/application';
import { useInvalidation } from './common/InvalidationContext';

export interface UseSpaceItemsResult {
    data: SpaceItemWithChildren[] | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useSpaceItems(spaceId: string): UseSpaceItemsResult {
    const [data, setData] = useState<SpaceItemWithChildren[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { subscribe } = useInvalidation();

    const fetchItems = useCallback(async () => {
        if (!spaceId) {
            setData([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
            const result = await facade.getItems(spaceId);

            if (result.success) {
                setData(result.data);
            } else {
                setError(new Error(result.error.message));
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch items'));
        } finally {
            setLoading(false);
        }
    }, [spaceId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useEffect(() => {
        const unsubscribeSpace = subscribe(`space-items:${spaceId}`, fetchItems);
        const unsubscribeGlobal = subscribe('space-items', fetchItems);
        return () => {
            unsubscribeSpace();
            unsubscribeGlobal();
        };
    }, [subscribe, fetchItems, spaceId]);

    return { data, loading, error, refetch: fetchItems };
}
