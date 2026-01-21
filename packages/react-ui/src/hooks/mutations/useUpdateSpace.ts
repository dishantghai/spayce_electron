import { useState, useCallback } from 'react';
import type { SpaceEntity } from '@spayce/core';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpacesFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface UpdateSpaceInput {
    spaceId: string;
    name?: string;
    iconName?: string;
    accentColor?: string;
    isExpanded?: boolean;
}

export interface UseUpdateSpaceResult {
    mutate: (input: UpdateSpaceInput) => Promise<SpaceEntity | null>;
    loading: boolean;
    error: AppError | null;
}

export function useUpdateSpace(): UseUpdateSpaceResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (input: UpdateSpaceInput): Promise<SpaceEntity | null> => {
        try {
            setLoading(true);
            setError(null);

            const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
            const result = await facade.updateSpace(input);

            if (result.success) {
                invalidate('spaces');
                return result.data;
            } else {
                setError(result.error);
                return null;
            }
        } catch (err) {
            setError({
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to update space'
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    return { mutate, loading, error };
}
