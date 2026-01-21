import {
    ISpaceItemsRepository,
    ValidationError
} from '../../../domain';

export interface ReorderItemsInput {
    spaceId: string;
    parentId: string | null;
    orderedItemIds: string[];
}

export class ReorderItemsUseCase {
    constructor(
        private readonly spaceItemsRepository: ISpaceItemsRepository
    ) { }

    async execute(input: ReorderItemsInput): Promise<void> {
        // 1. Get all items in the parent context
        const items = input.parentId
            ? await this.spaceItemsRepository.getItemChildren(input.parentId)
            : await this.spaceItemsRepository.getItemsBySpaceId(input.spaceId)
                .then(items => items.filter(i => !i.parentId));

        // 2. Validate all IDs exist in this context
        const existingIds = new Set(items.map(i => i.id));
        for (const id of input.orderedItemIds) {
            if (!existingIds.has(id)) {
                throw new ValidationError(
                    'orderedItemIds',
                    id,
                    'item does not exist in this context'
                );
            }
        }

        // 3. Reorder items (repository signature: parentId, orderedIds)
        await this.spaceItemsRepository.reorderItems(
            input.parentId,
            input.orderedItemIds
        );

        // Note: No specific reorder event in domain, operation completes silently
    }
}
