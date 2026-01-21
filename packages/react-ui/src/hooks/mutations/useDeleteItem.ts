import { useState, useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface UseDeleteItemResult {
    mutate: (itemId: string, spaceId?: string) => Promise<boolean>;
    loading: boolean;
    error: AppError | null;
}

export function useDeleteItem(): UseDeleteItemResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (itemId: string, spaceId?: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
            const result = await facade.deleteItem(itemId);

            if (result.success) {
                if (spaceId) {
                    invalidate(`space-items:${spaceId}`);
                }
                invalidate('space-items');
                invalidate('pins');
                return true;
            } else {
                setError(result.error);
                return false;
            }
        } catch (err) {
            setError({
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to delete item'
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    return { mutate, loading, error };
}
