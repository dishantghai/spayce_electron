import { useState, useCallback } from 'react';
import type { SpaceItemEntity } from '@spayce/core';
import { SpaceItemType } from '@spayce/core';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface CreateItemInput {
    spaceId: string;
    parentId?: string | null;
    name: string;
    path: string;
    type: SpaceItemType;
    faviconUrl?: string | null;
    description?: string | null;
}

export interface UseCreateItemResult {
    mutate: (input: CreateItemInput) => Promise<SpaceItemEntity | null>;
    loading: boolean;
    error: AppError | null;
}

export function useCreateItem(): UseCreateItemResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (input: CreateItemInput): Promise<SpaceItemEntity | null> => {
        try {
            setLoading(true);
            setError(null);

            const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
            const result = await facade.createItem(input);

            if (result.success) {
                invalidate(`space-items:${input.spaceId}`);
                invalidate('space-items');
                return result.data;
            } else {
                setError(result.error);
                return null;
            }
        } catch (err) {
            setError({
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to create item'
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    return { mutate, loading, error };
}

export { SpaceItemType };
