import type { ISpacesRepository } from '../../domain';
import type { SpaceEntity } from '../../domain/entities/Space';
import { EntityNotFoundError } from '../../domain/errors/EntityNotFoundError';
import { ValidationError } from '../../domain/errors/ValidationError';
import { FormatValidators, DataSanitizer } from '../../domain/validators';

export interface UpdateSpaceInput {
    spaceId: string;
    name?: string;
    iconName?: string;
    accentColor?: string;
    isExpanded?: boolean;
}

export class UpdateSpaceUseCase {
    constructor(private readonly spacesRepository: ISpacesRepository) { }

    async execute(input: UpdateSpaceInput): Promise<SpaceEntity> {
        const space = await this.spacesRepository.getSpaceById(input.spaceId);
        if (!space) {
            throw new EntityNotFoundError('Space', input.spaceId);
        }

        let name = space.name;
        if (input.name !== undefined) {
            name = DataSanitizer.sanitizeString(input.name);
            if (!name) {
                throw new ValidationError('name', input.name, 'cannot be empty');
            }
        }

        let accentColor = space.accentColor;
        if (input.accentColor !== undefined) {
            const colorResult = FormatValidators.validateHexColor(input.accentColor);
            if (!colorResult.success) {
                throw colorResult.errors[0];
            }
            accentColor = colorResult.data!;
        }

        const updatedSpace: SpaceEntity = {
            ...space,
            name,
            iconName: input.iconName ?? space.iconName,
            accentColor,
            isExpanded: input.isExpanded ?? space.isExpanded,
        };

        await this.spacesRepository.updateSpace(updatedSpace);

        return updatedSpace;
    }
}
