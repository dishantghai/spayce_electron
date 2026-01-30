/**
 * UpdateTab Validator
 *
 * Validates input for updating tabs.
 *
 * @see Spec 018 - Browser Domain Layer
 */

import { ValidationError } from '../errors';
import type { ValidationResult } from './SchemaValidator';
import type { UpdateTabInput } from '../entities/Tab';

/**
 * Validates UpdateTabInput
 */
export class UpdateTabValidator {
    static readonly MAX_URL_LENGTH = 2048;
    static readonly MAX_TITLE_LENGTH = 500;

    validate(input: unknown): ValidationResult<UpdateTabInput> {
        const errors: ValidationError[] = [];

        // Require object input
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            errors.push(new ValidationError('input', input, 'must be an object'));
            return { success: false, errors };
        }

        const data = input as Record<string, unknown>;

        // ID is required
        if (!data.id || typeof data.id !== 'string' || data.id.trim().length === 0) {
            errors.push(new ValidationError('id', data.id, 'must be a non-empty string'));
        }

        // Validate URL if provided (and not null)
        if (data.url !== undefined && data.url !== null) {
            if (typeof data.url !== 'string') {
                errors.push(new ValidationError('url', data.url, 'must be a string'));
            } else if (data.url.length > UpdateTabValidator.MAX_URL_LENGTH) {
                errors.push(new ValidationError('url', data.url, `must be at most ${UpdateTabValidator.MAX_URL_LENGTH} characters`));
            }
        }

        // Validate title if provided (and not null)
        if (data.title !== undefined && data.title !== null) {
            if (typeof data.title !== 'string') {
                errors.push(new ValidationError('title', data.title, 'must be a string'));
            } else if (data.title.length > UpdateTabValidator.MAX_TITLE_LENGTH) {
                errors.push(new ValidationError('title', data.title, `must be at most ${UpdateTabValidator.MAX_TITLE_LENGTH} characters`));
            }
        }

        // Validate loadingProgress if provided
        if (data.loadingProgress !== undefined) {
            if (typeof data.loadingProgress !== 'number') {
                errors.push(new ValidationError('loadingProgress', data.loadingProgress, 'must be a number'));
            } else if (data.loadingProgress < 0 || data.loadingProgress > 1) {
                errors.push(new ValidationError('loadingProgress', data.loadingProgress, 'must be between 0 and 1'));
            }
        }

        // Validate position if provided
        if (data.position !== undefined) {
            if (typeof data.position !== 'number' || !Number.isInteger(data.position)) {
                errors.push(new ValidationError('position', data.position, 'must be an integer'));
            } else if (data.position < 0) {
                errors.push(new ValidationError('position', data.position, 'must be non-negative'));
            }
        }

        if (errors.length > 0) {
            return { success: false, errors };
        }

        return {
            success: true,
            data: data as UpdateTabInput,
            errors: [],
        };
    }
}
