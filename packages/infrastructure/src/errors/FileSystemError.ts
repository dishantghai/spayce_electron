import { DomainError } from '@spayce/core';

export class FileSystemError extends DomainError {
    constructor(operation: string, path: string, originalError: Error) {
        super(`File system operation failed: ${operation}`, 'FILE_SYSTEM_ERROR', {
            operation,
            path,
            originalError: originalError.message,
        });
    }
}
