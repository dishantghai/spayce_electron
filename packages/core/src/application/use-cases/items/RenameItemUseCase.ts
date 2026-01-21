import {
    ISpaceItemsRepository,
    IEventBus,
    SpaceItemRenamedEvent,
    EntityNotFoundError,
    ValidationError
} from '../../../domain';
import { DataSanitizer } from '../../../domain/validators/DataSanitizer';

export interface RenameItemInput {
    itemId: string;
    newName: string;
}

export class RenameItemUseCase {
    constructor(
        private readonly spaceItemsRepository: ISpaceItemsRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(input: RenameItemInput): Promise<void> {
        // 1. Validate and sanitize name
        const sanitizedName = DataSanitizer.sanitizeString(input.newName);
        if (!sanitizedName) {
            throw new ValidationError('name', input.newName, 'cannot be empty');
        }

        // 2. Get existing item
        const item = await this.spaceItemsRepository.getItemById(input.itemId);
        if (!item) {
            throw new EntityNotFoundError('SpaceItem', input.itemId);
        }

        const oldName = item.name;

        // 3. Update item
        await this.spaceItemsRepository.updateItem({
            ...item,
            name: sanitizedName
        });

        // 4. Emit event
        await this.eventBus.publish(new SpaceItemRenamedEvent({
            itemId: input.itemId,
            spaceId: item.spaceId,
            oldName,
            newName: sanitizedName
        }));
    }
}
