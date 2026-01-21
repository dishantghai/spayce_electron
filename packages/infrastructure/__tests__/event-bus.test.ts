import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryEventBus } from '../src/services/InMemoryEventBus';
import { ConsoleLogger } from '../src/services/ConsoleLogger';

describe('InMemoryEventBus', () => {
    let eventBus: InMemoryEventBus;

    beforeEach(() => {
        eventBus = new InMemoryEventBus();
    });

    describe('subscribe', () => {
        it('should register a handler for an event type', () => {
            const handler = vi.fn();
            eventBus.subscribe('test.event', handler);
            expect(eventBus.getHandlerCount('test.event')).toBe(1);
        });

        it('should allow multiple handlers for same event type', () => {
            eventBus.subscribe('test.event', vi.fn());
            eventBus.subscribe('test.event', vi.fn());
            expect(eventBus.getHandlerCount('test.event')).toBe(2);
        });
    });

    describe('publish', () => {
        it('should call all registered handlers', async () => {
            const handler1 = vi.fn().mockResolvedValue(undefined);
            const handler2 = vi.fn().mockResolvedValue(undefined);

            eventBus.subscribe('test.event', handler1);
            eventBus.subscribe('test.event', handler2);

            const event = { type: 'test.event', timestamp: new Date(), payload: { data: 'test' } };
            await eventBus.publish(event);

            expect(handler1).toHaveBeenCalledWith(event);
            expect(handler2).toHaveBeenCalledWith(event);
        });

        it('should not fail if no handlers registered', async () => {
            const event = { type: 'unhandled.event', timestamp: new Date(), payload: {} };
            await expect(eventBus.publish(event)).resolves.toBeUndefined();
        });

        it('should continue calling handlers even if one fails', async () => {
            const handler1 = vi.fn().mockRejectedValue(new Error('Handler 1 failed'));
            const handler2 = vi.fn().mockResolvedValue(undefined);

            eventBus.subscribe('test.event', handler1);
            eventBus.subscribe('test.event', handler2);

            const event = { type: 'test.event', timestamp: new Date(), payload: {} };
            await eventBus.publish(event);

            expect(handler1).toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });

        it('should call handlers in parallel', async () => {
            const callOrder: number[] = [];
            const handler1 = vi.fn().mockImplementation(async () => {
                await new Promise(r => setTimeout(r, 50));
                callOrder.push(1);
            });
            const handler2 = vi.fn().mockImplementation(async () => {
                callOrder.push(2);
            });

            eventBus.subscribe('test.event', handler1);
            eventBus.subscribe('test.event', handler2);

            const event = { type: 'test.event', timestamp: new Date(), payload: {} };
            await eventBus.publish(event);

            expect(callOrder).toEqual([2, 1]);
        });
    });

    describe('unsubscribe', () => {
        it('should remove a specific handler', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            eventBus.subscribe('test.event', handler);
            eventBus.unsubscribe('test.event', handler);

            const event = { type: 'test.event', timestamp: new Date(), payload: {} };
            await eventBus.publish(event);

            expect(handler).not.toHaveBeenCalled();
        });

        it('should not fail if handler not found', () => {
            const handler = vi.fn();
            expect(() => eventBus.unsubscribe('test.event', handler)).not.toThrow();
        });

        it('should not affect other handlers', async () => {
            const handler1 = vi.fn().mockResolvedValue(undefined);
            const handler2 = vi.fn().mockResolvedValue(undefined);

            eventBus.subscribe('test.event', handler1);
            eventBus.subscribe('test.event', handler2);
            eventBus.unsubscribe('test.event', handler1);

            const event = { type: 'test.event', timestamp: new Date(), payload: {} };
            await eventBus.publish(event);

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        it('should remove all handlers', () => {
            eventBus.subscribe('event1', vi.fn());
            eventBus.subscribe('event2', vi.fn());

            eventBus.clear();

            expect(eventBus.getHandlerCount()).toBe(0);
        });
    });

    describe('getHandlerCount', () => {
        it('should return count for specific event type', () => {
            eventBus.subscribe('event1', vi.fn());
            eventBus.subscribe('event1', vi.fn());
            eventBus.subscribe('event2', vi.fn());

            expect(eventBus.getHandlerCount('event1')).toBe(2);
            expect(eventBus.getHandlerCount('event2')).toBe(1);
        });

        it('should return total count when no event type specified', () => {
            eventBus.subscribe('event1', vi.fn());
            eventBus.subscribe('event1', vi.fn());
            eventBus.subscribe('event2', vi.fn());

            expect(eventBus.getHandlerCount()).toBe(3);
        });

        it('should return 0 for unregistered event type', () => {
            expect(eventBus.getHandlerCount('nonexistent')).toBe(0);
        });
    });

    describe('with logger', () => {
        it('should log debug messages when logger provided', async () => {
            const logger = new ConsoleLogger();
            const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => { });

            const eventBusWithLogger = new InMemoryEventBus(logger);
            eventBusWithLogger.subscribe('test.event', vi.fn().mockResolvedValue(undefined));

            const event = { type: 'test.event', timestamp: new Date(), payload: {} };
            await eventBusWithLogger.publish(event);

            expect(debugSpy).toHaveBeenCalled();
        });
    });
});

describe('ConsoleLogger', () => {
    let logger: ConsoleLogger;

    beforeEach(() => {
        logger = new ConsoleLogger('[Test]');
    });

    describe('debug', () => {
        it('should call console.debug in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const spy = vi.spyOn(console, 'debug').mockImplementation(() => { });
            logger.debug('test message', { extra: 'data' });

            expect(spy).toHaveBeenCalledWith('[Test] [DEBUG]', 'test message', { extra: 'data' });

            process.env.NODE_ENV = originalEnv;
            spy.mockRestore();
        });

        it('should not call console.debug in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const spy = vi.spyOn(console, 'debug').mockImplementation(() => { });
            logger.debug('test message');

            expect(spy).not.toHaveBeenCalled();

            process.env.NODE_ENV = originalEnv;
            spy.mockRestore();
        });
    });

    describe('info', () => {
        it('should call console.info with prefix', () => {
            const spy = vi.spyOn(console, 'info').mockImplementation(() => { });
            logger.info('test message');

            expect(spy).toHaveBeenCalledWith('[Test] [INFO]', 'test message');
            spy.mockRestore();
        });
    });

    describe('warn', () => {
        it('should call console.warn with prefix', () => {
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            logger.warn('test message');

            expect(spy).toHaveBeenCalledWith('[Test] [WARN]', 'test message');
            spy.mockRestore();
        });
    });

    describe('error', () => {
        it('should call console.error with prefix', () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
            logger.error('test message', new Error('test'));

            expect(spy).toHaveBeenCalledWith('[Test] [ERROR]', 'test message', expect.any(Error));
            spy.mockRestore();
        });
    });

    describe('default prefix', () => {
        it('should use [Spayce] as default prefix', () => {
            const defaultLogger = new ConsoleLogger();
            const spy = vi.spyOn(console, 'info').mockImplementation(() => { });

            defaultLogger.info('test');

            expect(spy).toHaveBeenCalledWith('[Spayce] [INFO]', 'test');
            spy.mockRestore();
        });
    });
});
