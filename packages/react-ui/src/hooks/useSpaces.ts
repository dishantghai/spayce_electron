import { useState, useEffect, useCallback } from 'react';
import type { SpaceEntity } from '@spayce/core';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpacesFacade } from '@spayce/core/application';
import { useInvalidation } from './common/InvalidationContext';

export interface UseSpacesResult {
    data: SpaceEntity[] | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    isRefetching: boolean;
}

export function useSpaces(profileId: string): UseSpacesResult {
    const [data, setData] = useState<SpaceEntity[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { subscribe } = useInvalidation();

    const fetchSpaces = useCallback(async (isRefetch = false) => {
        try {
            if (isRefetch) {
                setIsRefetching(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
            const result = await facade.getSpaces(profileId);

            if (result.success) {
                setData(result.data);
            } else {
                setError(new Error(result.error.message));
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch spaces'));
        } finally {
            if (isRefetch) {
                setIsRefetching(false);
            } else {
                setLoading(false);
            }
        }
    }, [profileId]);

    useEffect(() => {
        fetchSpaces();
    }, [fetchSpaces]);

    useEffect(() => {
        const unsubscribe = subscribe('spaces', () => fetchSpaces(true));
        return unsubscribe;
    }, [subscribe, fetchSpaces]);

    const refetch = useCallback(() => fetchSpaces(true), [fetchSpaces]);

    return { data, loading, error, refetch, isRefetching };
}
