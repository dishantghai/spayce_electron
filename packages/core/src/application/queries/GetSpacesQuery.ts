import type { ISpacesRepository } from '../../domain';
import type { SpaceEntity } from '../../domain/entities/Space';

export interface GetSpacesInput {
    profileId: string;
}

export class GetSpacesQuery {
    constructor(private readonly spacesRepository: ISpacesRepository) { }

    async execute(input: GetSpacesInput): Promise<SpaceEntity[]> {
        return this.spacesRepository.getAllSpaces(input.profileId);
    }
}
