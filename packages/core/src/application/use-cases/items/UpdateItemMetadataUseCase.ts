import {
    ISpaceItemsRepository,
    SpaceItemEntity,
    EntityNotFoundError,
    ValidationError
} from '../../../domain';
import { FormatValidators } from '../../../domain/validators/FormatValidators';
import { DataSanitizer } from '../../../domain/validators/DataSanitizer';

export interface UpdateItemMetadataInput {
    itemId: string;
    name?: string;
    description?: string | null;
    faviconUrl?: string | null;
    isExpanded?: boolean;
}

export class UpdateItemMetadataUseCase {
    constructor(
        private readonly spaceItemsRepository: ISpaceItemsRepository
    ) { }

    async execute(input: UpdateItemMetadataInput): Promise<SpaceItemEntity> {
        // 1. Get existing item
        const item = await this.spaceItemsRepository.getItemById(input.itemId);
        if (!item) {
            throw new EntityNotFoundError('SpaceItem', input.itemId);
        }

        // 2. Validate and sanitize updates
        let name = item.name;
        if (input.name !== undefined) {
            const sanitized = DataSanitizer.sanitizeString(input.name);
            if (!sanitized) {
                throw new ValidationError('name', input.name, 'cannot be empty');
            }
            name = sanitized;
        }

        let faviconUrl = item.faviconUrl;
        if (input.faviconUrl !== undefined) {
            if (input.faviconUrl !== null) {
                const urlResult = FormatValidators.validateUrl(input.faviconUrl);
                if (!urlResult.success) {
                    throw urlResult.errors[0];
                }
                faviconUrl = urlResult.data!;
            } else {
                faviconUrl = null;
            }
        }

        let description = item.description;
        if (input.description !== undefined) {
            description = input.description
                ? DataSanitizer.sanitizeString(input.description)
                : null;
        }

        // 3. Update item
        const updatedItem: SpaceItemEntity = {
            ...item,
            name,
            description,
            faviconUrl,
            isExpanded: input.isExpanded ?? item.isExpanded
        };

        await this.spaceItemsRepository.updateItem(updatedItem);

        return updatedItem;
    }
}
