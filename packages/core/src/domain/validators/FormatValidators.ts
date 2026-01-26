import { ValidationError } from '../errors/ValidationError';
import type { ValidationResult } from './SchemaValidator';

export class FormatValidators {
    static readonly URL_PATTERN =
        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=,]*)$/;
    static readonly HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
    static readonly FILE_PATH_PATTERN = /^[^<>:"|?*]+$/;

    static validateUrl(url: string): ValidationResult<string> {
        if (!url || typeof url !== 'string') {
            return {
                success: false,
                errors: [new ValidationError('url', url, 'must be a string')],
            };
        }

        const trimmed = url.trim();
        if (!this.URL_PATTERN.test(trimmed)) {
            return {
                success: false,
                errors: [new ValidationError('url', url, 'must be a valid HTTP/HTTPS URL')],
            };
        }

        return { success: true, data: trimmed, errors: [] };
    }

    static validateHexColor(color: string): ValidationResult<string> {
        if (!color || typeof color !== 'string') {
            return {
                success: false,
                errors: [new ValidationError('color', color, 'must be a string')],
            };
        }

        if (!this.HEX_COLOR_PATTERN.test(color)) {
            return {
                success: false,
                errors: [new ValidationError('color', color, 'must be a valid hex color (e.g., #FF0000)')],
            };
        }

        return { success: true, data: color.toUpperCase(), errors: [] };
    }

    static validateFilePath(path: string): ValidationResult<string> {
        if (!path || typeof path !== 'string') {
            return {
                success: false,
                errors: [new ValidationError('path', path, 'must be a string')],
            };
        }

        if (!this.FILE_PATH_PATTERN.test(path)) {
            return {
                success: false,
                errors: [new ValidationError('path', path, 'contains invalid characters')],
            };
        }

        return { success: true, data: path.trim(), errors: [] };
    }
}
