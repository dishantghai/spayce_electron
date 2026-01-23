import { useState, useCallback } from 'react';
import type { SpaceItemEntity } from '@spayce/core';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface UpdateItemMetadataInput {
    name?: string;
    description?: string | null;
    faviconUrl?: string | null;
    isExpanded?: boolean;
}

export interface UseUpdateItemMetadataResult {
    mutate: (itemId: string, metadata: UpdateItemMetadataInput) => Promise<SpaceItemEntity | null>;
    loading: boolean;
    error: AppError | null;
}

export function useUpdateItemMetadata(): UseUpdateItemMetadataResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (
        itemId: string,
        metadata: UpdateItemMetadataInput
    ): Promise<SpaceItemEntity | null> => {
        try {
            setLoading(true);
            setError(null);

            const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
            const result = await facade.updateItemMetadata({ itemId, ...metadata });

            if (result.success) {
                invalidate('space-items');
                return result.data;
            } else {
                setError(result.error);
                return null;
            }
        } catch (err) {
            setError({
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to update item metadata'
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    return { mutate, loading, error };
}
