import { describe, it, expect } from 'vitest';
import { Result, ok, err, AppError } from '../../../src/application/common/Result';

describe('Result Pattern', () => {
    describe('ok()', () => {
        it('should create successful result with value', () => {
            const result = ok('test value');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('test value');
            }
        });

        it('should create successful result with object', () => {
            const data = { id: '123', name: 'Test' };
            const result = ok(data);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(data);
            }
        });

        it('should create successful result with null', () => {
            const result = ok(null);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeNull();
            }
        });

        it('should create successful result with undefined', () => {
            const result = ok(undefined);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeUndefined();
            }
        });
    });

    describe('err()', () => {
        it('should create failure result with error', () => {
            const error: AppError = {
                type: 'validation',
                message: 'Something went wrong',
            };
            const result = err(error);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toEqual(error);
            }
        });

        it('should create failure result with business rule error', () => {
            const error: AppError = {
                type: 'business_rule',
                message: 'Cannot delete non-empty folder',
            };
            const result = err(error);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.type).toBe('business_rule');
            }
        });

        it('should preserve error details', () => {
            const error: AppError = {
                type: 'validation',
                message: 'Name is required',
                field: 'name',
                code: 'REQUIRED_FIELD',
            };
            const result = err(error);

            if (!result.success) {
                expect(result.error).toEqual(error);
            }
        });
    });

    describe('Type guards', () => {
        it('should correctly identify success results', () => {
            const result = ok(42);

            if (result.success) {
                expect(result.data).toBe(42);
            } else {
                throw new Error('Should be success');
            }
        });

        it('should correctly identify failure results', () => {
            const error: AppError = { type: 'system', message: 'error' };
            const result = err(error);

            if (!result.success) {
                expect(result.error.message).toBe('error');
            } else {
                throw new Error('Should be failure');
            }
        });
    });

    describe('Result usage patterns', () => {
        function divide(a: number, b: number): Result<number, AppError> {
            if (b === 0) {
                return err({ type: 'business_rule', message: 'Division by zero' });
            }
            return ok(a / b);
        }

        it('should handle success case', () => {
            const result = divide(10, 2);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(5);
            }
        });

        it('should handle failure case', () => {
            const result = divide(10, 0);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.message).toBe('Division by zero');
            }
        });

        it('should chain operations on success', () => {
            const result1 = divide(10, 2);

            if (result1.success) {
                const result2 = divide(result1.data, 5);
                expect(result2.success).toBe(true);
                if (result2.success) {
                    expect(result2.data).toBe(1);
                }
            }
        });

        it('should short-circuit on failure', () => {
            const result1 = divide(10, 0);

            if (!result1.success) {
                expect(result1.error.message).toBe('Division by zero');
            }
        });
    });

    describe('Generic types', () => {
        it('should work with string type', () => {
            const result: Result<string> = ok('hello');
            if (result.success) {
                expect(result.data).toBe('hello');
            }
        });

        it('should work with number type', () => {
            const result: Result<number> = ok(123);
            if (result.success) {
                expect(result.data).toBe(123);
            }
        });

        it('should work with boolean type', () => {
            const result: Result<boolean> = ok(true);
            if (result.success) {
                expect(result.data).toBe(true);
            }
        });

        it('should work with array type', () => {
            const result: Result<number[]> = ok([1, 2, 3]);
            if (result.success) {
                expect(result.data).toEqual([1, 2, 3]);
            }
        });

        it('should work with complex object type', () => {
            interface User {
                id: string;
                name: string;
                age: number;
            }

            const user: User = { id: '1', name: 'John', age: 30 };
            const result: Result<User> = ok(user);

            if (result.success) {
                expect(result.data).toEqual(user);
            }
        });
    });

    describe('Error types', () => {
        it('should support validation errors', () => {
            const error: AppError = {
                type: 'validation',
                message: 'Invalid input',
                field: 'email',
            };
            const result = err(error);

            if (!result.success) {
                expect(result.error.type).toBe('validation');
                expect(result.error.field).toBe('email');
            }
        });

        it('should support not_found errors', () => {
            const error: AppError = {
                type: 'not_found',
                message: 'Item not found',
                code: 'ITEM_NOT_FOUND',
            };
            const result = err(error);

            if (!result.success) {
                expect(result.error.type).toBe('not_found');
                expect(result.error.code).toBe('ITEM_NOT_FOUND');
            }
        });

        it('should support system errors', () => {
            const error: AppError = {
                type: 'system',
                message: 'Database connection failed',
            };
            const result = err(error);

            if (!result.success) {
                expect(result.error.type).toBe('system');
            }
        });
    });
});
