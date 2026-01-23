import { useCallback } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade } from '@spayce/core/application';

export function useIncrementVisitCount(): (itemId: string) => Promise<void> {
    const mutate = useCallback(async (itemId: string): Promise<void> => {
        try {
            const facade = serviceRegistry.get<SpaceItemsFacade>(SERVICE_KEYS.SPACE_ITEMS_FACADE);
            await facade.incrementVisitCount(itemId);
        } catch (err) {
            console.warn('Failed to increment visit count:', err);
        }
    }, []);

    return mutate;
}
