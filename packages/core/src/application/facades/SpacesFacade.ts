import type { SpaceEntity } from '../../domain/entities/Space';
import { ValidationError } from '../../domain/errors/ValidationError';
import { BusinessRuleError } from '../../domain/errors/BusinessRuleError';
import { EntityNotFoundError } from '../../domain/errors/EntityNotFoundError';
import type { Result, AppError } from '../common/Result';
import { ok, err } from '../common/Result';
import {
    CreateSpaceUseCase,
    DeleteSpaceUseCase,
    RenameSpaceUseCase,
    UpdateSpaceUseCase,
    ReorderSpacesUseCase,
} from '../use-cases/spaces';
import { GetSpacesQuery } from '../queries';

export class SpacesFacade {
    constructor(
        private readonly createSpaceUseCase: CreateSpaceUseCase,
        private readonly deleteSpaceUseCase: DeleteSpaceUseCase,
        private readonly renameSpaceUseCase: RenameSpaceUseCase,
        private readonly updateSpaceUseCase: UpdateSpaceUseCase,
        private readonly reorderSpacesUseCase: ReorderSpacesUseCase,
        private readonly getSpacesQuery: GetSpacesQuery
    ) { }

    async getSpaces(profileId: string): Promise<Result<SpaceEntity[], AppError>> {
        try {
            const spaces = await this.getSpacesQuery.execute({ profileId });
            return ok(spaces);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async createSpace(input: {
        profileId: string;
        userId: string;
        name: string;
        iconName?: string;
        accentColor?: string;
    }): Promise<Result<SpaceEntity, AppError>> {
        try {
            const result = await this.createSpaceUseCase.execute(input);
            return ok(result.space);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async deleteSpace(spaceId: string, profileId: string): Promise<Result<void, AppError>> {
        try {
            await this.deleteSpaceUseCase.execute({ spaceId, profileId });
            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async renameSpace(spaceId: string, newName: string): Promise<Result<void, AppError>> {
        try {
            await this.renameSpaceUseCase.execute({ spaceId, newName });
            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async updateSpace(input: {
        spaceId: string;
        name?: string;
        iconName?: string;
        accentColor?: string;
        isExpanded?: boolean;
    }): Promise<Result<SpaceEntity, AppError>> {
        try {
            const space = await this.updateSpaceUseCase.execute(input);
            return ok(space);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async reorderSpaces(
        profileId: string,
        orderedSpaceIds: string[]
    ): Promise<Result<void, AppError>> {
        try {
            await this.reorderSpacesUseCase.execute({ profileId, orderedSpaceIds });
            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    private mapError(error: unknown): AppError {
        if (error instanceof ValidationError) {
            return {
                type: 'validation',
                message: error.message,
                field: error.field,
                code: error.code,
            };
        }

        if (error instanceof BusinessRuleError) {
            return {
                type: 'business_rule',
                message: error.message,
                code: error.code,
            };
        }

        if (error instanceof EntityNotFoundError) {
            return {
                type: 'not_found',
                message: error.message,
                code: error.code,
            };
        }

        return {
            type: 'system',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}
