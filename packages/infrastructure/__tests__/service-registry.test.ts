import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceRegistry, SERVICE_KEYS } from '../src/di/ServiceRegistry';

describe('ServiceRegistry', () => {
    let registry: ServiceRegistry;

    beforeEach(() => {
        registry = new ServiceRegistry();
    });

    describe('register', () => {
        it('should register a service factory', () => {
            registry.register('test', () => ({ value: 42 }));
            expect(registry.has('test')).toBe(true);
        });

        it('should allow overwriting existing registration', () => {
            registry.register('test', () => ({ value: 1 }));
            registry.register('test', () => ({ value: 2 }));
            expect(registry.get<{ value: number }>('test').value).toBe(2);
        });
    });

    describe('get', () => {
        it('should return singleton instance by default', () => {
            let callCount = 0;
            registry.register('counter', () => {
                callCount++;
                return { count: callCount };
            });

            const first = registry.get<{ count: number }>('counter');
            const second = registry.get<{ count: number }>('counter');

            expect(first).toBe(second);
            expect(callCount).toBe(1);
        });

        it('should return new instance when singleton is false', () => {
            let callCount = 0;
            registry.register('counter', () => {
                callCount++;
                return { count: callCount };
            }, false);

            const first = registry.get<{ count: number }>('counter');
            const second = registry.get<{ count: number }>('counter');

            expect(first).not.toBe(second);
            expect(first.count).toBe(1);
            expect(second.count).toBe(2);
        });

        it('should throw error for unregistered service', () => {
            expect(() => registry.get('nonexistent')).toThrow('Service not registered: nonexistent');
        });
    });

    describe('has', () => {
        it('should return true for registered service', () => {
            registry.register('test', () => ({}));
            expect(registry.has('test')).toBe(true);
        });

        it('should return false for unregistered service', () => {
            expect(registry.has('nonexistent')).toBe(false);
        });
    });

    describe('clear', () => {
        it('should remove all registrations', () => {
            registry.register('a', () => ({}));
            registry.register('b', () => ({}));

            registry.clear();

            expect(registry.has('a')).toBe(false);
            expect(registry.has('b')).toBe(false);
        });

        it('should reset singleton instances', () => {
            let callCount = 0;
            registry.register('counter', () => ({ count: ++callCount }));

            registry.get('counter');
            registry.clear();
            registry.register('counter', () => ({ count: ++callCount }));

            const result = registry.get<{ count: number }>('counter');
            expect(result.count).toBe(2);
        });
    });

    describe('SERVICE_KEYS', () => {
        it('should have all required service keys', () => {
            expect(SERVICE_KEYS.DATABASE).toBe('database');
            expect(SERVICE_KEYS.SPACES_REPOSITORY).toBe('spacesRepository');
            expect(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY).toBe('spaceItemsRepository');
            expect(SERVICE_KEYS.EVENT_BUS).toBe('eventBus');
            expect(SERVICE_KEYS.LOGGER).toBe('logger');
        });
    });
});
