import { useState, useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpacesFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface UseDeleteSpaceResult {
    mutate: (spaceId: string, profileId: string) => Promise<boolean>;
    loading: boolean;
    error: AppError | null;
}

export function useDeleteSpace(): UseDeleteSpaceResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (spaceId: string, profileId: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
            const result = await facade.deleteSpace(spaceId, profileId);

            if (result.success) {
                invalidate('spaces');
                invalidate(`space-items:${spaceId}`);
                return true;
            } else {
                setError(result.error);
                return false;
            }
        } catch (err) {
            setError({
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to delete space'
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    return { mutate, loading, error };
}
