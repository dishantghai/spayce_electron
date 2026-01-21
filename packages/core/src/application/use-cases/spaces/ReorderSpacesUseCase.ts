import type { ISpacesRepository } from '../../domain';
import { ValidationError } from '../../domain/errors/ValidationError';

export interface ReorderSpacesInput {
    profileId: string;
    orderedSpaceIds: string[];
}

export class ReorderSpacesUseCase {
    constructor(private readonly spacesRepository: ISpacesRepository) { }

    async execute(input: ReorderSpacesInput): Promise<void> {
        const existingSpaces = await this.spacesRepository.getAllSpaces(input.profileId);
        const existingIds = new Set(existingSpaces.map((s) => s.id));

        for (const id of input.orderedSpaceIds) {
            if (!existingIds.has(id)) {
                throw new ValidationError('orderedSpaceIds', id, 'space does not exist in profile');
            }
        }

        await this.spacesRepository.reorderSpaces(input.profileId, input.orderedSpaceIds);
    }
}
