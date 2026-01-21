import type { ISpaceItemsRepository } from '../../domain';
import type { SpaceItemEntity } from '../../domain/entities/SpaceItem';

export interface GetRecentItemsInput {
    profileId: string;
    limit?: number;
}

export class GetRecentItemsQuery {
    constructor(private readonly spaceItemsRepository: ISpaceItemsRepository) { }

    async execute(input: GetRecentItemsInput): Promise<SpaceItemEntity[]> {
        return this.spaceItemsRepository.getRecentItems(input.profileId, input.limit || 10);
    }
}
