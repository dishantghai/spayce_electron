import type { ISpaceItemsRepository } from '../../domain';
import type { SpaceItemEntity } from '../../domain/entities/SpaceItem';

export interface SearchItemsInput {
    profileId: string;
    query: string;
    limit?: number;
}

export interface SearchResult {
    items: SpaceItemEntity[];
    totalCount: number;
}

export class SearchItemsQuery {
    constructor(private readonly spaceItemsRepository: ISpaceItemsRepository) { }

    async execute(input: SearchItemsInput): Promise<SearchResult> {
        const items = await this.spaceItemsRepository.searchItems(input.profileId, input.query);

        return {
            items: items.slice(0, input.limit || 50),
            totalCount: items.length,
        };
    }
}
