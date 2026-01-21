import type { ISpaceItemsRepository, IEventBus } from '../../../domain';
import { SpaceItemPinnedEvent } from '../../../domain/events/SpaceItemEvents';
import { EntityNotFoundError } from '../../../domain/errors/EntityNotFoundError';

export interface PinItemInput {
    itemId: string;
}

export class PinItemUseCase {
    constructor(
        private readonly spaceItemsRepository: ISpaceItemsRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(input: PinItemInput): Promise<void> {
        const item = await this.spaceItemsRepository.getItemById(input.itemId);
        if (!item) {
            throw new EntityNotFoundError('SpaceItem', input.itemId);
        }

        const pinnedItems = await this.spaceItemsRepository.getPinnedItems(item.spaceId);
        const nextPosition = pinnedItems.length;

        await this.spaceItemsRepository.pinItem(input.itemId, nextPosition);

        await this.eventBus.publish(
            new SpaceItemPinnedEvent({
                itemId: input.itemId,
                spaceId: item.spaceId,
                position: nextPosition,
            })
        );
    }
}
