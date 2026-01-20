import { DomainError } from './DomainError';

export class EntityNotFoundError extends DomainError {
    constructor(entityType: string, id: string) {
        super(`${entityType} with id '${id}' not found`, 'ENTITY_NOT_FOUND', {
            entityType,
            id,
        });
    }
}
