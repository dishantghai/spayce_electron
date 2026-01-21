import Database from 'better-sqlite3';
import { serviceRegistry, SERVICE_KEYS } from '../di/ServiceRegistry';
import { SqliteSpacesRepository } from '../persistence/sqlite/SqliteSpacesRepository';
import { SqliteSpaceItemsRepository } from '../persistence/sqlite/SqliteSpaceItemsRepository';
import { DatabaseInitializer } from '../persistence/sqlite/DatabaseInitializer';
import { InMemoryEventBus } from '../services/InMemoryEventBus';
import { ConsoleLogger } from '../services/ConsoleLogger';
import type { ILogger } from '@spayce/core';

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
    }

    static shutdown(): void {
        if (serviceRegistry.has(SERVICE_KEYS.DATABASE)) {
            const db = serviceRegistry.get<Database.Database>(SERVICE_KEYS.DATABASE);
            db?.close();
        }
        serviceRegistry.clear();
    }
}
