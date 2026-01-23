import { useState, useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpacesFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface ReorderSpacesInput {
    profileId: string;
    spaceIds: string[];
}

export interface UseReorderSpacesResult {
    mutate: (input: ReorderSpacesInput) => Promise<boolean>;
    loading: boolean;
    error: AppError | null;
}

export function useReorderSpaces(): UseReorderSpacesResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (input: ReorderSpacesInput): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
            const result = await facade.reorderSpaces(input.profileId, input.spaceIds);

            if (result.success) {
                invalidate('spaces');
                return true;
            } else {
                setError(result.error);
                return false;
            }
        } catch (err) {
            setError({
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to reorder spaces'
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    return { mutate, loading, error };
}
