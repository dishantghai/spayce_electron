import { DomainError } from './DomainError';

export class ValidationError extends DomainError {
    constructor(field: string, value: unknown, rule: string) {
        super(`Validation failed for ${field}: ${rule}`, 'VALIDATION_ERROR', {
            field,
            value,
            rule,
        });
    }

    get field(): string {
        return this.details?.field as string;
    }
}
