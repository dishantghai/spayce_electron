import type { ISpaceItemsRepository } from '../../domain';
import type { SpaceItemEntity } from '../../domain/entities/SpaceItem';

export interface GetSpaceItemsInput {
    spaceId: string;
}

export interface SpaceItemWithChildren extends SpaceItemEntity {
    children: SpaceItemWithChildren[];
}

export class GetSpaceItemsQuery {
    constructor(private readonly spaceItemsRepository: ISpaceItemsRepository) { }

    async execute(input: GetSpaceItemsInput): Promise<SpaceItemWithChildren[]> {
        const items = await this.spaceItemsRepository.getItemsBySpaceId(input.spaceId);
        return this.buildTree(items);
    }

    private buildTree(items: SpaceItemEntity[]): SpaceItemWithChildren[] {
        const itemMap = new Map<string, SpaceItemWithChildren>();
        const roots: SpaceItemWithChildren[] = [];

        for (const item of items) {
            itemMap.set(item.id, { ...item, children: [] });
        }

        for (const item of items) {
            const node = itemMap.get(item.id)!;
            if (item.parentId && itemMap.has(item.parentId)) {
                itemMap.get(item.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        }

        const sortChildren = (nodes: SpaceItemWithChildren[]) => {
            nodes.sort((a, b) => a.sortOrder - b.sortOrder);
            for (const node of nodes) {
                sortChildren(node.children);
            }
        };

        sortChildren(roots);
        return roots;
    }
}
