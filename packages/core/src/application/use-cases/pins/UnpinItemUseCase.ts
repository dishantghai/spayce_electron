import type { ISpaceItemsRepository } from '../../../domain';
import { EntityNotFoundError } from '../../../domain/errors/EntityNotFoundError';

export interface UnpinItemInput {
    itemId: string;
}

export class UnpinItemUseCase {
    constructor(private readonly spaceItemsRepository: ISpaceItemsRepository) { }

    async execute(input: UnpinItemInput): Promise<void> {
        const item = await this.spaceItemsRepository.getItemById(input.itemId);
        if (!item) {
            throw new EntityNotFoundError('SpaceItem', input.itemId);
        }

        await this.spaceItemsRepository.unpinItem(input.itemId);
    }
}
