import { useState, useCallback } from 'react';
import type { SpaceEntity } from '@spayce/core';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpacesFacade, AppError } from '@spayce/core/application';
import { useInvalidation } from '../common/InvalidationContext';

export interface CreateSpaceInput {
    profileId: string;
    userId: string;
    name: string;
    iconName?: string;
    accentColor?: string;
}

export interface UseCreateSpaceResult {
    mutate: (input: CreateSpaceInput) => Promise<SpaceEntity | null>;
    loading: boolean;
    error: AppError | null;
    reset: () => void;
}

export function useCreateSpace(): UseCreateSpaceResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const { invalidate } = useInvalidation();

    const mutate = useCallback(async (input: CreateSpaceInput): Promise<SpaceEntity | null> => {
        try {
            setLoading(true);
            setError(null);

            const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
            const result = await facade.createSpace(input);

            if (result.success) {
                invalidate('spaces');
                return result.data;
            } else {
                setError(result.error);
                return null;
            }
        } catch (err) {
            const systemError: AppError = {
                type: 'system',
                message: err instanceof Error ? err.message : 'Failed to create space'
            };
            setError(systemError);
            return null;
        } finally {
            setLoading(false);
        }
    }, [invalidate]);

    const reset = useCallback(() => {
        setError(null);
        setLoading(false);
    }, []);

    return { mutate, loading, error, reset };
}
