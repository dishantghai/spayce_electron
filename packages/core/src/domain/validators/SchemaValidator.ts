import { ValidationError } from '../errors/ValidationError';

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors: ValidationError[];
}

export interface ValidationSchema<T> {
    validate(input: unknown): ValidationResult<T>;
    validatePartial(input: unknown): ValidationResult<Partial<T>>;
}
