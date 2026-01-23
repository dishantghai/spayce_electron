import type { SpaceItemEntity } from '../../domain/entities/SpaceItem';
import { SpaceItemType } from '../../domain/entities/SpaceItem';
import { ValidationError } from '../../domain/errors/ValidationError';
import { BusinessRuleError } from '../../domain/errors/BusinessRuleError';
import { EntityNotFoundError } from '../../domain/errors/EntityNotFoundError';
import type { Result, AppError } from '../common/Result';
import { ok, err } from '../common/Result';
import {
    CreateItemUseCase,
    DeleteItemUseCase,
    MoveItemUseCase,
    RenameItemUseCase,
    ReorderItemsUseCase,
    IncrementVisitCountUseCase,
    UpdateItemMetadataUseCase,
} from '../use-cases/items';
import { PinItemUseCase, UnpinItemUseCase, ReorderPinsUseCase } from '../use-cases/pins';
import { GetSpaceItemsQuery, type SpaceItemWithChildren } from '../queries';

export class SpaceItemsFacade {
    constructor(
        private readonly createItemUseCase: CreateItemUseCase,
        private readonly deleteItemUseCase: DeleteItemUseCase,
        private readonly moveItemUseCase: MoveItemUseCase,
        private readonly renameItemUseCase: RenameItemUseCase,
        private readonly reorderItemsUseCase: ReorderItemsUseCase,
        private readonly incrementVisitCountUseCase: IncrementVisitCountUseCase,
        private readonly updateItemMetadataUseCase: UpdateItemMetadataUseCase,
        private readonly pinItemUseCase: PinItemUseCase,
        private readonly unpinItemUseCase: UnpinItemUseCase,
        private readonly reorderPinsUseCase: ReorderPinsUseCase,
        private readonly getSpaceItemsQuery: GetSpaceItemsQuery
    ) { }

    async getItems(spaceId: string): Promise<Result<SpaceItemWithChildren[], AppError>> {
        try {
            const items = await this.getSpaceItemsQuery.execute({ spaceId });
            return ok(items);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async createItem(input: {
        spaceId: string;
        parentId?: string | null;
        name: string;
        path: string;
        type: SpaceItemType;
        faviconUrl?: string | null;
        description?: string | null;
    }): Promise<Result<SpaceItemEntity, AppError>> {
        try {
            const item = await this.createItemUseCase.execute(input);
            return ok(item);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async deleteItem(itemId: string): Promise<Result<void, AppError>> {
        try {
            await this.deleteItemUseCase.execute({ itemId });
            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async moveItem(input: {
        itemId: string;
        toSpaceId: string;
        toParentId: string | null;
        toPosition: number;
    }): Promise<Result<void, AppError>> {
        try {
            await this.moveItemUseCase.execute(input);
            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async renameItem(itemId: string, newName: string): Promise<Result<void, AppError>> {
        try {
            await this.renameItemUseCase.execute({ itemId, newName });
            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async reorderItems(input: {
        spaceId: string;
        parentId: string | null;
        orderedItemIds: string[];
    }): Promise<Result<void, AppError>> {
        try {
            await this.reorderItemsUseCase.execute(input);
            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async incrementVisitCount(itemId: string): Promise<Result<void, AppError>> {
        try {
            await this.incrementVisitCountUseCase.execute({ itemId });
            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async updateItemMetadata(input: {
        itemId: string;
        name?: string;
        description?: string | null;
        faviconUrl?: string | null;
        isExpanded?: boolean;
    }): Promise<Result<SpaceItemEntity, AppError>> {
        try {
            const item = await this.updateItemMetadataUseCase.execute(input);
            return ok(item);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async pinItem(itemId: string): Promise<Result<void, AppError>> {
        try {
            await this.pinItemUseCase.execute({ itemId });
            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async unpinItem(itemId: string): Promise<Result<void, AppError>> {
        try {
            await this.unpinItemUseCase.execute({ itemId });
            return ok(undefined);
        } catch (error) {
            return err(this.mapError(error));
        }
    }

    async reorderPins(spaceId: string, orderedItemIds: string[]): Promise<Result<void, AppError>> {
        try {
            await this.reorderPinsUseCase.execute({ spaceId, orderedItemIds });
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
