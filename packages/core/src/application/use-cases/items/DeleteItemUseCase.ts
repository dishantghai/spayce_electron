import type { ISpaceItemsRepository } from '../../../domain';
import { EntityNotFoundError } from '../../../domain/errors/EntityNotFoundError';

export interface DeleteItemInput {
    itemId: string;
}

export class DeleteItemUseCase {
    constructor(
        private readonly spaceItemsRepository: ISpaceItemsRepository
    ) { }

    async execute(input: DeleteItemInput): Promise<void> {
        const item = await this.spaceItemsRepository.getItemById(input.itemId);
        if (!item) {
            throw new EntityNotFoundError('SpaceItem', input.itemId);
        }

        await this.spaceItemsRepository.deleteItem(input.itemId);
    }
}
