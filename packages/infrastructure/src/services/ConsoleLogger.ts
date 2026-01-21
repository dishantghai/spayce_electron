import type { ILogger } from '@spayce/core';

export class ConsoleLogger implements ILogger {
    private readonly prefix: string;

    constructor(prefix = '[Spayce]') {
        this.prefix = prefix;
    }

    debug(message: string, ...args: unknown[]): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`${this.prefix} [DEBUG]`, message, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        console.info(`${this.prefix} [INFO]`, message, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        console.warn(`${this.prefix} [WARN]`, message, ...args);
    }

    error(message: string, ...args: unknown[]): void {
        console.error(`${this.prefix} [ERROR]`, message, ...args);
    }
}
