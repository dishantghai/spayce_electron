import { describe, it, expect } from 'vitest';
import {
    DomainError,
    ValidationError,
    BusinessRuleError,
    EntityNotFoundError,
    ConcurrencyError,
} from '../src/domain/errors';

describe('Domain Errors', () => {
    describe('DomainError', () => {
        it('should be an abstract base class with code and details', () => {
            const error = new ValidationError('name', '', 'must be non-empty');
            expect(error).toBeInstanceOf(DomainError);
            expect(error).toBeInstanceOf(Error);
            expect(error.code).toBeDefined();
            expect(error.details).toBeDefined();
        });

        it('should have proper prototype chain', () => {
            const error = new ValidationError('name', '', 'must be non-empty');
            expect(error instanceof Error).toBe(true);
            expect(error instanceof DomainError).toBe(true);
            expect(error instanceof ValidationError).toBe(true);
        });
    });

    describe('ValidationError', () => {
        it('should store field, value, and rule in details', () => {
            const error = new ValidationError('email', 'invalid', 'must be valid email');

            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.details?.field).toBe('email');
            expect(error.details?.value).toBe('invalid');
            expect(error.details?.rule).toBe('must be valid email');
        });

        it('should have user-friendly message', () => {
            const error = new ValidationError('name', '', 'must be non-empty');
            expect(error.message).toContain('name');
            expect(error.message).toContain('must be non-empty');
        });

        it('should provide field getter', () => {
            const error = new ValidationError('username', 'x', 'too short');
            expect(error.field).toBe('username');
        });

        it('should have correct name property', () => {
            const error = new ValidationError('test', 'value', 'rule');
            expect(error.name).toBe('ValidationError');
        });
    });

    describe('BusinessRuleError', () => {
        it('should store rule and context', () => {
            const error = new BusinessRuleError('Maximum pins reached', { maxPins: 15 });

            expect(error.code).toBe('BUSINESS_RULE_ERROR');
            expect(error.message).toContain('Maximum pins reached');
            expect(error.details?.maxPins).toBe(15);
        });

        it('should work without context', () => {
            const error = new BusinessRuleError('Cannot delete default space');
            expect(error.code).toBe('BUSINESS_RULE_ERROR');
            expect(error.message).toContain('Cannot delete default space');
        });

        it('should have correct name property', () => {
            const error = new BusinessRuleError('test rule');
            expect(error.name).toBe('BusinessRuleError');
        });
    });

    describe('EntityNotFoundError', () => {
        it('should store entityType and id', () => {
            const error = new EntityNotFoundError('Space', 'space-123');

            expect(error.code).toBe('ENTITY_NOT_FOUND');
            expect(error.details?.entityType).toBe('Space');
            expect(error.details?.id).toBe('space-123');
        });

        it('should have descriptive message', () => {
            const error = new EntityNotFoundError('SpaceItem', 'item-456');
            expect(error.message).toContain('SpaceItem');
            expect(error.message).toContain('item-456');
            expect(error.message).toContain('not found');
        });

        it('should have correct name property', () => {
            const error = new EntityNotFoundError('Space', 'id');
            expect(error.name).toBe('EntityNotFoundError');
        });
    });

    describe('ConcurrencyError', () => {
        it('should store entityType and id', () => {
            const error = new ConcurrencyError('Space', 'space-123');

            expect(error.code).toBe('CONCURRENCY_ERROR');
            expect(error.details?.entityType).toBe('Space');
            expect(error.details?.id).toBe('space-123');
        });

        it('should have descriptive message', () => {
            const error = new ConcurrencyError('SpaceItem', 'item-456');
            expect(error.message).toContain('Concurrent modification');
            expect(error.message).toContain('SpaceItem');
        });

        it('should have correct name property', () => {
            const error = new ConcurrencyError('Space', 'id');
            expect(error.name).toBe('ConcurrencyError');
        });
    });

    describe('Error inheritance', () => {
        it('all domain errors should extend Error', () => {
            expect(new ValidationError('f', 'v', 'r') instanceof Error).toBe(true);
            expect(new BusinessRuleError('rule') instanceof Error).toBe(true);
            expect(new EntityNotFoundError('Type', 'id') instanceof Error).toBe(true);
            expect(new ConcurrencyError('Type', 'id') instanceof Error).toBe(true);
        });

        it('all domain errors should extend DomainError', () => {
            expect(new ValidationError('f', 'v', 'r') instanceof DomainError).toBe(true);
            expect(new BusinessRuleError('rule') instanceof DomainError).toBe(true);
            expect(new EntityNotFoundError('Type', 'id') instanceof DomainError).toBe(true);
            expect(new ConcurrencyError('Type', 'id') instanceof DomainError).toBe(true);
        });
    });
});
