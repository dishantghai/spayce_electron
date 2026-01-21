import type { ISpaceItemsRepository, ISpacesRepository, IEventBus } from '../../../domain';
import { SpaceItemCreatedEvent } from '../../../domain/events/SpaceItemEvents';
import type { SpaceItemEntity } from '../../../domain/entities/SpaceItem';
import { SpaceItemType } from '../../../domain/entities/SpaceItem';
import { EntityNotFoundError } from '../../../domain/errors/EntityNotFoundError';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { FormatValidators, DataSanitizer } from '../../../domain/validators';
import { generateId } from '../../common/idGenerator';

export interface CreateItemInput {
    spaceId: string;
    parentId?: string | null;
    name: string;
    path: string;
    type: SpaceItemType;
    faviconUrl?: string | null;
    description?: string | null;
}

export class CreateItemUseCase {
    constructor(
        private readonly spaceItemsRepository: ISpaceItemsRepository,
        private readonly spacesRepository: ISpacesRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(input: CreateItemInput): Promise<SpaceItemEntity> {
        const space = await this.spacesRepository.getSpaceById(input.spaceId);
        if (!space) {
            throw new EntityNotFoundError('Space', input.spaceId);
        }

        if (input.parentId) {
            const parent = await this.spaceItemsRepository.getItemById(input.parentId);
            if (!parent) {
                throw new EntityNotFoundError('Parent Item', input.parentId);
            }
            if (parent.spaceId !== input.spaceId) {
                throw new ValidationError('parentId', input.parentId, 'parent must be in same space');
            }
        }

        const sanitizedName = DataSanitizer.sanitizeString(input.name) || 'Untitled';

        if (input.type === SpaceItemType.Link) {
            const urlResult = FormatValidators.validateUrl(input.path);
            if (!urlResult.success) {
                throw urlResult.errors[0];
            }
        }

        const siblings = input.parentId
            ? await this.spaceItemsRepository.getItemChildren(input.parentId)
            : await this.spaceItemsRepository
                .getItemsBySpaceId(input.spaceId)
                .then((items) => items.filter((i) => !i.parentId));
        const nextOrder = siblings.length;

        const item = await this.spaceItemsRepository.createItem({
            id: generateId(),
            spaceId: input.spaceId,
            parentId: input.parentId || null,
            name: sanitizedName,
            path: input.path,
            type: input.type,
            isExpanded: false,
            sortOrder: nextOrder,
            faviconUrl: input.faviconUrl || null,
            description: input.description || null,
            visitCount: 0,
            lastVisited: null,
            isPinned: false,
            pinPosition: null,
            localPath: null,
            securityBookmark: null,
            lastSyncedAt: null,
            isWatching: false,
        });

        await this.eventBus.publish(
            new SpaceItemCreatedEvent({
                itemId: item.id,
                spaceId: input.spaceId,
            })
        );

        return item;
    }
}
