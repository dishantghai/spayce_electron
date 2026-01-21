import { DomainError } from '@spayce/core';

export class DatabaseError extends DomainError {
    constructor(operation: string, originalError: Error) {
        super(`Database operation failed: ${operation}`, 'DATABASE_ERROR', {
            operation,
            originalError: originalError.message,
        });
    }
}
