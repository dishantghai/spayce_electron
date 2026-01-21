import Database from 'better-sqlite3';
import { serviceRegistry, SERVICE_KEYS } from '../di/ServiceRegistry';
import { SqliteSpacesRepository } from '../persistence/sqlite/SqliteSpacesRepository';
import { SqliteSpaceItemsRepository } from '../persistence/sqlite/SqliteSpaceItemsRepository';
import { DatabaseInitializer } from '../persistence/sqlite/DatabaseInitializer';
import { InMemoryEventBus } from '../services/InMemoryEventBus';
import { ConsoleLogger } from '../services/ConsoleLogger';
import type { ILogger, IEventBus, ISpacesRepository, ISpaceItemsRepository } from '@spayce/core';

// Import facades
import { SpacesFacade, SpaceItemsFacade, SearchFacade } from '@spayce/core/application';

// Import use cases
import {
    CreateSpaceUseCase,
    DeleteSpaceUseCase,
    RenameSpaceUseCase,
    UpdateSpaceUseCase,
    ReorderSpacesUseCase,
    CreateItemUseCase,
    DeleteItemUseCase,
    MoveItemUseCase,
    RenameItemUseCase,
    ReorderItemsUseCase,
    IncrementVisitCountUseCase,
    UpdateItemMetadataUseCase,
} from '@spayce/core/application';

// Import queries
import {
    GetSpacesQuery,
    GetSpaceItemsQuery,
    SearchItemsQuery,
    GetRecentItemsQuery,
    GetMostVisitedItemsQuery
} from '@spayce/core/application';

// Import validators
import { CreateSpaceValidator } from '@spayce/core/domain';

export interface BootstrapConfig {
    databasePath: string;
    logPrefix?: string;
}

export class ServiceBootstrap {
    static initialize(config: BootstrapConfig): void {
        serviceRegistry.register(SERVICE_KEYS.LOGGER, () => {
            return new ConsoleLogger(config.logPrefix);
        });

        serviceRegistry.register(SERVICE_KEYS.DATABASE, () => {
            const db = new Database(config.databasePath);
            const initializer = new DatabaseInitializer(db);
            initializer.initialize();
            return db;
        });

        serviceRegistry.register(SERVICE_KEYS.EVENT_BUS, () => {
            const logger = serviceRegistry.get<ILogger>(SERVICE_KEYS.LOGGER);
            return new InMemoryEventBus(logger);
        });

        serviceRegistry.register(SERVICE_KEYS.SPACES_REPOSITORY, () => {
            const db = serviceRegistry.get<Database.Database>(SERVICE_KEYS.DATABASE);
            return new SqliteSpacesRepository(db);
        });

        serviceRegistry.register(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY, () => {
            const db = serviceRegistry.get<Database.Database>(SERVICE_KEYS.DATABASE);
            return new SqliteSpaceItemsRepository(db);
        });

        // Register facades
        serviceRegistry.register(SERVICE_KEYS.SPACES_FACADE, () => {
            const spacesRepo = serviceRegistry.get<ISpacesRepository>(SERVICE_KEYS.SPACES_REPOSITORY);
            const eventBus = serviceRegistry.get<IEventBus>(SERVICE_KEYS.EVENT_BUS);
            const validator = new CreateSpaceValidator();

            return new SpacesFacade(
                new CreateSpaceUseCase(spacesRepo, eventBus, validator),
                new DeleteSpaceUseCase(spacesRepo, eventBus),
                new RenameSpaceUseCase(spacesRepo, eventBus),
                new UpdateSpaceUseCase(spacesRepo),
                new ReorderSpacesUseCase(spacesRepo),
                new GetSpacesQuery(spacesRepo)
            );
        });

        serviceRegistry.register(SERVICE_KEYS.SPACE_ITEMS_FACADE, () => {
            const itemsRepo = serviceRegistry.get<ISpaceItemsRepository>(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY);
            const spacesRepo = serviceRegistry.get<ISpacesRepository>(SERVICE_KEYS.SPACES_REPOSITORY);
            const eventBus = serviceRegistry.get<IEventBus>(SERVICE_KEYS.EVENT_BUS);

            return new SpaceItemsFacade(
                new CreateItemUseCase(itemsRepo, spacesRepo, eventBus),
                new DeleteItemUseCase(itemsRepo),
                new MoveItemUseCase(itemsRepo, spacesRepo, eventBus),
                new RenameItemUseCase(itemsRepo, eventBus),
                new ReorderItemsUseCase(itemsRepo),
                new IncrementVisitCountUseCase(itemsRepo),
                new UpdateItemMetadataUseCase(itemsRepo),
                new GetSpaceItemsQuery(itemsRepo)
            );
        });

        serviceRegistry.register(SERVICE_KEYS.SEARCH_FACADE, () => {
            const itemsRepo = serviceRegistry.get<ISpaceItemsRepository>(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY);

            return new SearchFacade(
                new SearchItemsQuery(itemsRepo),
                new GetRecentItemsQuery(itemsRepo),
                new GetMostVisitedItemsQuery(itemsRepo)
            );
        });
    }

    static shutdown(): void {
        if (serviceRegistry.has(SERVICE_KEYS.DATABASE)) {
            const db = serviceRegistry.get<Database.Database>(SERVICE_KEYS.DATABASE);
            db?.close();
        }
        serviceRegistry.clear();
    }
}
