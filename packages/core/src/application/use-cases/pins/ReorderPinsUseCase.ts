import type { ISpaceItemsRepository, ISpacesRepository } from '../../../domain';
import { EntityNotFoundError } from '../../../domain/errors/EntityNotFoundError';

export interface ReorderPinsInput {
    spaceId: string;
    orderedItemIds: string[];
}

export class ReorderPinsUseCase {
    constructor(
        private readonly spaceItemsRepository: ISpaceItemsRepository,
        private readonly spacesRepository: ISpacesRepository
    ) { }

    async execute(input: ReorderPinsInput): Promise<void> {
        const space = await this.spacesRepository.getSpaceById(input.spaceId);
        if (!space) {
            throw new EntityNotFoundError('Space', input.spaceId);
        }

        await this.spaceItemsRepository.reorderPins(input.spaceId, input.orderedItemIds);
    }
}
