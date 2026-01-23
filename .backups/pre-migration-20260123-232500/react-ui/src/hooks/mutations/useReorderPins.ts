import { useState, useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface UseReorderPinsResult {
    mutate: (spaceId: string, orderedItemIds: string[]) => Promise<boolean>;
    loading: boolean;
    error: AppError | null;
}

export function useReorderPins(): UseReorderPinsResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (
        spaceId: string,
        orderedItemIds: string[]
    ): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
            const result = await facade.reorderPins(spaceId, orderedItemIds);

            if (result.success) {
                invalidate(`pinned-items:${spaceId}`);
                invalidate('pinned-items');
                return true;
            } else {
                setError(result.error);
                return false;
            }
        } catch (err) {
            setError({
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to reorder pins'
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    return { mutate, loading, error };
}
