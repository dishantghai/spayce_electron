import { useState, useCallback } from 'react';
import type { SpaceItemEntity } from '@spayce/core';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface UseRenameItemResult {
    mutate: (itemId: string, newName: string) => Promise<boolean>;
    loading: boolean;
    error: AppError | null;
}

export function useRenameItem(): UseRenameItemResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (itemId: string, newName: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
            const result = await facade.renameItem(itemId, newName);

            if (result.success) {
                invalidate('space-items');
                return true;
            } else {
                setError(result.error);
                return false;
            }
        } catch (err) {
            setError({
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to rename item'
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    return { mutate, loading, error };
}
