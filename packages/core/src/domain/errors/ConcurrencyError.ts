import { DomainError } from './DomainError';

export class ConcurrencyError extends DomainError {
    constructor(entityType: string, id: string) {
        super(
            `Concurrent modification detected for ${entityType} '${id}'`,
            'CONCURRENCY_ERROR',
            { entityType, id }
        );
    }
}
