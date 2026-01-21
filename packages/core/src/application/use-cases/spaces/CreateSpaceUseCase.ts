import type { ISpacesRepository, IEventBus } from '../../domain';
import { SpaceCreatedEvent } from '../../domain/events/SpaceEvents';
import { CreateSpaceValidator, DataSanitizer } from '../../domain/validators';
import { generateId } from '../common/idGenerator';
import type { SpaceEntity } from '../../domain/entities/Space';

export interface CreateSpaceInput {
    profileId: string;
    userId: string;
    name: string;
    iconName?: string;
    accentColor?: string;
}

export interface CreateSpaceOutput {
    space: SpaceEntity;
}

export class CreateSpaceUseCase {
    constructor(
        private readonly spacesRepository: ISpacesRepository,
        private readonly eventBus: IEventBus,
        private readonly validator: CreateSpaceValidator
    ) { }

    async execute(input: CreateSpaceInput): Promise<CreateSpaceOutput> {
        const validationResult = this.validator.validate(input);
        if (!validationResult.success) {
            throw validationResult.errors[0];
        }

        const sanitizedName = DataSanitizer.sanitizeString(input.name);
        if (!sanitizedName) {
            throw validationResult.errors[0];
        }

        const existingSpaces = await this.spacesRepository.getAllSpaces(input.profileId);
        const nextOrder = existingSpaces.length;

        const space = await this.spacesRepository.createSpace({
            id: generateId(),
            profileId: input.profileId,
            userId: input.userId,
            name: sanitizedName,
            iconName: input.iconName || 'folder',
            accentColor: input.accentColor || '#6D5AE6',
            order: nextOrder,
            isExpanded: true,
        });

        await this.eventBus.publish(
            new SpaceCreatedEvent({
                spaceId: space.id,
                profileId: input.profileId,
            })
        );

        return { space };
    }
}
