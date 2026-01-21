import type { ISpacesRepository, IEventBus } from '../../domain';
import { SpaceRenamedEvent } from '../../domain/events/SpaceEvents';
import { EntityNotFoundError } from '../../domain/errors/EntityNotFoundError';
import { ValidationError } from '../../domain/errors/ValidationError';
import { DataSanitizer } from '../../domain/validators';

export interface RenameSpaceInput {
    spaceId: string;
    newName: string;
}

export class RenameSpaceUseCase {
    constructor(
        private readonly spacesRepository: ISpacesRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(input: RenameSpaceInput): Promise<void> {
        const sanitizedName = DataSanitizer.sanitizeString(input.newName);
        if (!sanitizedName) {
            throw new ValidationError('name', input.newName, 'cannot be empty');
        }

        const space = await this.spacesRepository.getSpaceById(input.spaceId);
        if (!space) {
            throw new EntityNotFoundError('Space', input.spaceId);
        }

        const oldName = space.name;

        await this.spacesRepository.updateSpace({
            ...space,
            name: sanitizedName,
        });

        await this.eventBus.publish(
            new SpaceRenamedEvent({
                spaceId: input.spaceId,
                oldName,
                newName: sanitizedName,
            })
        );
    }
}
