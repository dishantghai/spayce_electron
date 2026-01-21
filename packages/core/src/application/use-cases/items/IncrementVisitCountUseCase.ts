import {
    ISpaceItemsRepository,
    EntityNotFoundError
} from '../../../domain';

export interface IncrementVisitCountInput {
    itemId: string;
}

export class IncrementVisitCountUseCase {
    constructor(
        private readonly spaceItemsRepository: ISpaceItemsRepository
    ) { }

    async execute(input: IncrementVisitCountInput): Promise<void> {
        // 1. Verify item exists
        const item = await this.spaceItemsRepository.getItemById(input.itemId);
        if (!item) {
            throw new EntityNotFoundError('SpaceItem', input.itemId);
        }

        // 2. Increment visit count (repository handles lastVisited update)
        await this.spaceItemsRepository.incrementVisitCount(input.itemId);
    }
}
