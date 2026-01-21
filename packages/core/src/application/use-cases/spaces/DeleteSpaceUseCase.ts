import type { ISpacesRepository, IEventBus } from '../../domain';
import { SpaceDeletedEvent } from '../../domain/events/SpaceEvents';
import { EntityNotFoundError } from '../../domain/errors/EntityNotFoundError';

export interface DeleteSpaceInput {
    spaceId: string;
    profileId: string;
}

export class DeleteSpaceUseCase {
    constructor(
        private readonly spacesRepository: ISpacesRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(input: DeleteSpaceInput): Promise<void> {
        const space = await this.spacesRepository.getSpaceById(input.spaceId);
        if (!space) {
            throw new EntityNotFoundError('Space', input.spaceId);
        }

        await this.spacesRepository.deleteSpace(input.spaceId);

        await this.eventBus.publish(
            new SpaceDeletedEvent({
                spaceId: input.spaceId,
                profileId: input.profileId,
            })
        );
    }
}
