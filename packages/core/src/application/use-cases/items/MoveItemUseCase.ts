import type { ISpaceItemsRepository, ISpacesRepository, IEventBus } from '../../../domain';
import { SpaceItemMovedEvent } from '../../../domain/events/SpaceItemEvents';
import { EntityNotFoundError } from '../../../domain/errors/EntityNotFoundError';
import { BusinessRuleError } from '../../../domain/errors/BusinessRuleError';

export interface MoveItemInput {
    itemId: string;
    toSpaceId: string;
    toParentId: string | null;
    toPosition: number;
}

export class MoveItemUseCase {
    constructor(
        private readonly spaceItemsRepository: ISpaceItemsRepository,
        private readonly spacesRepository: ISpacesRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(input: MoveItemInput): Promise<void> {
        const item = await this.spaceItemsRepository.getItemById(input.itemId);
        if (!item) {
            throw new EntityNotFoundError('SpaceItem', input.itemId);
        }

        const targetSpace = await this.spacesRepository.getSpaceById(input.toSpaceId);
        if (!targetSpace) {
            throw new EntityNotFoundError('Space', input.toSpaceId);
        }

        if (input.toParentId) {
            const parent = await this.spaceItemsRepository.getItemById(input.toParentId);
            if (!parent) {
                throw new EntityNotFoundError('Parent Item', input.toParentId);
            }

            if (input.toParentId === input.itemId) {
                throw new BusinessRuleError('Cannot move item into itself');
            }

            let current = parent;
            while (current.parentId) {
                if (current.parentId === input.itemId) {
                    throw new BusinessRuleError('Cannot move item into its own descendant');
                }
                const nextParent = await this.spaceItemsRepository.getItemById(current.parentId);
                if (!nextParent) break;
                current = nextParent;
            }
        }

        const fromSpaceId = item.spaceId;
        const fromParentId = item.parentId;

        await this.spaceItemsRepository.moveItem(
            input.itemId,
            input.toSpaceId,
            input.toParentId,
            input.toPosition
        );

        await this.eventBus.publish(
            new SpaceItemMovedEvent({
                itemId: input.itemId,
                fromSpaceId,
                toSpaceId: input.toSpaceId,
                fromParentId,
                toParentId: input.toParentId,
            })
        );
    }
}
