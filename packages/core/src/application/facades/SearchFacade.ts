import type { SpaceItemEntity } from '../../domain/entities/SpaceItem';
import type { Result, AppError } from '../common/Result';
import { ok, err } from '../common/Result';
import { SearchItemsQuery, GetRecentItemsQuery, GetMostVisitedItemsQuery } from '../queries';

export class SearchFacade {
    constructor(
        private readonly searchItemsQuery: SearchItemsQuery,
        private readonly recentItemsQuery: GetRecentItemsQuery,
        private readonly mostVisitedQuery: GetMostVisitedItemsQuery
    ) { }

    async search(profileId: string, query: string): Promise<Result<SpaceItemEntity[], AppError>> {
        try {
            const result = await this.searchItemsQuery.execute({ profileId, query });
            return ok(result.items);
        } catch (error) {
            return err({ type: 'system', message: 'Search failed' });
        }
    }

    async getRecent(profileId: string, limit?: number): Promise<Result<SpaceItemEntity[], AppError>> {
        try {
            const items = await this.recentItemsQuery.execute({ profileId, limit });
            return ok(items);
        } catch (error) {
            return err({ type: 'system', message: 'Failed to fetch recent items' });
        }
    }

    async getMostVisited(
        profileId: string,
        limit?: number
    ): Promise<Result<SpaceItemEntity[], AppError>> {
        try {
            const items = await this.mostVisitedQuery.execute({ profileId, limit });
            return ok(items);
        } catch (error) {
            return err({ type: 'system', message: 'Failed to fetch most visited items' });
        }
    }
}
