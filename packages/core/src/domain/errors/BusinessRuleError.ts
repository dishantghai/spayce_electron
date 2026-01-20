import { DomainError } from './DomainError';

export class BusinessRuleError extends DomainError {
    constructor(rule: string, context?: Record<string, unknown>) {
        super(`Business rule violation: ${rule}`, 'BUSINESS_RULE_ERROR', context);
    }
}
