import { useState, useEffect, useCallback } from 'react';
import { spacesApi, itemsApi } from '../ipc/spacesApi';
import type { Space, SpaceItem } from '@spayce/react-ui';

interface UseSpacesDataResult {
    spaces: Space[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    createSpace: (input: {
        name: string;
        iconName: string;
        accentColor: string;
    }) => Promise<Space | null>;
    updateSpace: (spaceId: string, updates: {
        name?: string;
        iconName?: string;
        accentColor?: string;
    }) => Promise<boolean>;
    deleteSpace: (spaceId: string) => Promise<boolean>;
    reorderSpaces: (spaceIds: string[]) => Promise<boolean>;
}

const PROFILE_ID = 'default-profile';
const USER_ID = 'default-user';

export function useSpacesData(): UseSpacesDataResult {
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSpaces = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await spacesApi.getAll(PROFILE_ID);

            if (result.success) {
                // Transform domain entities to UI Space type
                const uiSpaces: Space[] = await Promise.all(
                    result.data.map(async (space: any) => {
                        // Fetch items for each space
                        const itemsResult = await itemsApi.getBySpace(space.id);
                        const rootItems: SpaceItem[] = itemsResult.success
                            ? transformItems(itemsResult.data)
                            : [];

                        return {
                            id: space.id,
                            profileId: space.profileId,
                            userId: space.userId,
                            name: space.name,
                            accentColor: space.accentColor,
                            iconName: space.iconName,
                            order: space.order,
                            isExpanded: space.isExpanded ?? true,
                            createdAt: new Date(space.createdAt),
                            rootItems,
                        };
                    })
                );
                setSpaces(uiSpaces);
            } else {
                setError(new Error(result.error?.message || 'Failed to fetch spaces'));
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSpaces();
    }, [fetchSpaces]);

    const createSpace = useCallback(async (input: {
        name: string;
        iconName: string;
        accentColor: string;
    }): Promise<Space | null> => {
        try {
            const result = await spacesApi.create({
                profileId: PROFILE_ID,
                userId: USER_ID,
                name: input.name,
                iconName: input.iconName,
                accentColor: input.accentColor,
            });

            if (result.success) {
                await fetchSpaces(); // Refetch to get updated list
                return {
                    id: result.data.id,
                    profileId: result.data.profileId,
                    userId: result.data.userId,
                    name: result.data.name,
                    accentColor: result.data.accentColor,
                    iconName: result.data.iconName,
                    order: result.data.order,
                    isExpanded: true,
                    createdAt: new Date(result.data.createdAt),
                    rootItems: [],
                };
            }
            return null;
        } catch {
            return null;
        }
    }, [fetchSpaces]);

    const updateSpace = useCallback(async (spaceId: string, updates: {
        name?: string;
        iconName?: string;
        accentColor?: string;
    }): Promise<boolean> => {
        try {
            const result = await spacesApi.update(spaceId, updates);
            if (result.success) {
                await fetchSpaces();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [fetchSpaces]);

    const deleteSpace = useCallback(async (spaceId: string): Promise<boolean> => {
        try {
            const result = await spacesApi.delete(spaceId, PROFILE_ID);
            if (result.success) {
                await fetchSpaces();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [fetchSpaces]);

    const reorderSpaces = useCallback(async (spaceIds: string[]): Promise<boolean> => {
        try {
            const result = await spacesApi.reorder(PROFILE_ID, spaceIds);
            if (result.success) {
                await fetchSpaces();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [fetchSpaces]);

    return {
        spaces,
        loading,
        error,
        refetch: fetchSpaces,
        createSpace,
        updateSpace,
        deleteSpace,
        reorderSpaces,
    };
}

// Transform domain items to UI SpaceItem type
function transformItems(items: any[]): SpaceItem[] {
    return items.map((item: any) => ({
        id: item.id,
        name: item.name,
        path: item.path,
        type: item.type,
        isExpanded: item.isExpanded ?? false,
        children: item.children ? transformItems(item.children) : [],
        faviconUrl: item.faviconUrl ?? null,
        description: item.description ?? null,
        visitCount: item.visitCount ?? 0,
        lastVisited: item.lastVisited ? new Date(item.lastVisited) : null,
        createdAt: new Date(item.createdAt),
        isPinned: item.isPinned ?? false,
        pinPosition: item.pinPosition ?? null,
        localPath: item.localPath ?? null,
        securityBookmark: item.securityBookmark ?? null,
        lastSyncedAt: item.lastSyncedAt ? new Date(item.lastSyncedAt) : null,
        isWatching: item.isWatching ?? false,
    }));
}
