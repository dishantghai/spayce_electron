import { useState, useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { ISpaceItemsRepository } from '@spayce/core';
import type { AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface UsePinItemResult {
    mutate: (itemId: string, position: number, spaceId?: string) => Promise<boolean>;
    loading: boolean;
    error: AppError | null;
}

export function usePinItem(): UsePinItemResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (itemId: string, position: number, spaceId?: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            const repo = serviceRegistry.get<ISpaceItemsRepository>(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY);
            await repo.pinItem(itemId, position);

            invalidate('pins');
            invalidate(`space-items:${spaceId}`);
            return true;
        } catch (err) {
            setError({
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to pin item'
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    return { mutate, loading, error };
}
