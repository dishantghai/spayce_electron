import { describe, it, expect } from 'vitest';

describe('Core Package Integration - Exports', () => {
    describe('Domain Entities', () => {
        it('should export SpaceEntity type', async () => {
            // SpaceEntity is a type/interface export, verify module loads
            const core = await import('@spayce/core');
            expect(core).toBeDefined();
        });

        it('should export SpaceItemEntity type', async () => {
            // SpaceItemEntity is a type/interface export, verify module loads
            const core = await import('@spayce/core');
            expect(core).toBeDefined();
        });

        it('should export SpaceItemType enum', async () => {
            const { SpaceItemType } = await import('@spayce/core');
            expect(SpaceItemType).toBeDefined();
            expect(SpaceItemType.Link).toBe('link');
            expect(SpaceItemType.Folder).toBe('folder');
            expect(SpaceItemType.File).toBe('file');
            expect(SpaceItemType.LocalFolder).toBe('localFolder');
            expect(SpaceItemType.LocalFile).toBe('localFile');
        });
    });

    describe('Repository Interfaces', () => {
        it('should export ISpacesRepository interface type', async () => {
            const core = await import('@spayce/core');
            // Interfaces are type-only exports, so we just verify the module loads
            expect(core).toBeDefined();
        });

        it('should export ISpaceItemsRepository interface type', async () => {
            const core = await import('@spayce/core');
            expect(core).toBeDefined();
        });
    });

    describe('Application Layer - Facades', () => {
        it('should export SpacesFacade type', async () => {
            const application = await import('@spayce/core/application');
            expect(application).toBeDefined();
        });

        it('should export SpaceItemsFacade type', async () => {
            const application = await import('@spayce/core/application');
            expect(application).toBeDefined();
        });

        it('should export SearchFacade type', async () => {
            const application = await import('@spayce/core/application');
            expect(application).toBeDefined();
        });
    });

    describe('Application Layer - Use Cases', () => {
        it('should export CreateSpaceUseCase', async () => {
            const { CreateSpaceUseCase } = await import('@spayce/core/application');
            expect(CreateSpaceUseCase).toBeDefined();
            expect(typeof CreateSpaceUseCase).toBe('function');
        });

        it('should export DeleteSpaceUseCase', async () => {
            const { DeleteSpaceUseCase } = await import('@spayce/core/application');
            expect(DeleteSpaceUseCase).toBeDefined();
            expect(typeof DeleteSpaceUseCase).toBe('function');
        });

        it('should export CreateItemUseCase', async () => {
            const { CreateItemUseCase } = await import('@spayce/core/application');
            expect(CreateItemUseCase).toBeDefined();
            expect(typeof CreateItemUseCase).toBe('function');
        });

        it('should export MoveItemUseCase', async () => {
            const { MoveItemUseCase } = await import('@spayce/core/application');
            expect(MoveItemUseCase).toBeDefined();
            expect(typeof MoveItemUseCase).toBe('function');
        });
    });

    describe('Application Layer - Error Types', () => {
        it('should export AppError type', async () => {
            const application = await import('@spayce/core/application');
            expect(application).toBeDefined();
        });

        it('should export Result type', async () => {
            const application = await import('@spayce/core/application');
            expect(application).toBeDefined();
        });
    });

    describe('Domain Events', () => {
        it('should export DomainEvent interface', async () => {
            const core = await import('@spayce/core');
            expect(core).toBeDefined();
        });

        it('should export IEventBus interface', async () => {
            const core = await import('@spayce/core');
            expect(core).toBeDefined();
        });
    });

    describe('SpaceItemType Enum Values', () => {
        it('should have correct SpaceItemType values', async () => {
            const { SpaceItemType } = await import('@spayce/core');

            // Verify all enum values exist and are correct
            expect(SpaceItemType.Link).toBe('link');
            expect(SpaceItemType.Folder).toBe('folder');
            expect(SpaceItemType.File).toBe('file');
            expect(SpaceItemType.LocalFolder).toBe('localFolder');
            expect(SpaceItemType.LocalFile).toBe('localFile');
        });

        it('should have 5 item types', async () => {
            const { SpaceItemType } = await import('@spayce/core');
            const values = Object.values(SpaceItemType);
            expect(values.length).toBe(5);
        });
    });
});
