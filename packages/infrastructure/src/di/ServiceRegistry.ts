export interface ServiceRegistration<T = unknown> {
    key: string;
    factory: () => T;
    singleton: boolean;
    instance?: T;
}

export class ServiceRegistry {
    private registrations = new Map<string, ServiceRegistration>();

    register<T>(key: string, factory: () => T, singleton = true): void {
        this.registrations.set(key, {
            key,
            factory,
            singleton,
            instance: undefined,
        });
    }

    get<T>(key: string): T {
        const registration = this.registrations.get(key);
        if (!registration) {
            throw new Error(`Service not registered: ${key}`);
        }

        if (registration.singleton) {
            if (!registration.instance) {
                registration.instance = registration.factory();
            }
            return registration.instance as T;
        }

        return registration.factory() as T;
    }

    has(key: string): boolean {
        return this.registrations.has(key);
    }

    clear(): void {
        this.registrations.clear();
    }
}

export const serviceRegistry = new ServiceRegistry();

export const SERVICE_KEYS = {
    DATABASE: 'database',
    SPACES_REPOSITORY: 'spacesRepository',
    SPACE_ITEMS_REPOSITORY: 'spaceItemsRepository',
    EVENT_BUS: 'eventBus',
    LOGGER: 'logger',
    SPACES_FACADE: 'spacesFacade',
    SPACE_ITEMS_FACADE: 'spaceItemsFacade',
    SEARCH_FACADE: 'searchFacade',
} as const;
