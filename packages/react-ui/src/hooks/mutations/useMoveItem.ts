import { useState, useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface MoveItemInput {
    itemId: string;
    toSpaceId: string;
    toParentId: string | null;
    toPosition: number;
    fromSpaceId?: string;
}

export interface UseMoveItemResult {
    mutate: (input: MoveItemInput) => Promise<boolean>;
    loading: boolean;
    error: AppError | null;
}

export function useMoveItem(): UseMoveItemResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (input: MoveItemInput): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
            const result = await facade.moveItem({
                itemId: input.itemId,
                toSpaceId: input.toSpaceId,
                toParentId: input.toParentId,
                toPosition: input.toPosition,
            });

            if (result.success) {
                invalidate(`space-items:${input.toSpaceId}`);
                if (input.fromSpaceId && input.fromSpaceId !== input.toSpaceId) {
                    invalidate(`space-items:${input.fromSpaceId}`);
                }
                invalidate('space-items');
                return true;
            } else {
                setError(result.error);
                return false;
            }
        } catch (err) {
            setError({
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to move item'
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    return { mutate, loading, error };
}
