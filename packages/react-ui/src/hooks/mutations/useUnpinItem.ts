import { useState, useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { ISpaceItemsRepository } from '@spayce/core';
import type { AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface UseUnpinItemResult {
    mutate: (itemId: string, spaceId?: string) => Promise<boolean>;
    loading: boolean;
    error: AppError | null;
}

export function useUnpinItem(): UseUnpinItemResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (itemId: string, spaceId?: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            const repo = serviceRegistry.get<ISpaceItemsRepository>(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY);
            await repo.unpinItem(itemId);

            invalidate('pins');
            if (spaceId) {
                invalidate(`space-items:${spaceId}`);
            }
            return true;
        } catch (err) {
            setError({
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to unpin item'
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    return { mutate, loading, error };
}
