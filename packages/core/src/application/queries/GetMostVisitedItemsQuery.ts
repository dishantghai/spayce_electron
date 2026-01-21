import type { ISpaceItemsRepository } from '../../domain';
import type { SpaceItemEntity } from '../../domain/entities/SpaceItem';

export interface GetMostVisitedItemsInput {
    profileId: string;
    limit?: number;
}

export class GetMostVisitedItemsQuery {
    constructor(private readonly spaceItemsRepository: ISpaceItemsRepository) { }

    async execute(input: GetMostVisitedItemsInput): Promise<SpaceItemEntity[]> {
        return this.spaceItemsRepository.getMostVisitedItems(input.profileId, input.limit || 10);
    }
}
