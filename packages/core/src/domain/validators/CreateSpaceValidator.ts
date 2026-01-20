import { ValidationError } from '../errors/ValidationError';
import type { ValidationResult, ValidationSchema } from './SchemaValidator';

export interface CreateSpaceInput {
    profileId: string;
    userId: string;
    name: string;
    iconName?: string;
    accentColor?: string;
}

export class CreateSpaceValidator implements ValidationSchema<CreateSpaceInput> {
    validate(input: unknown): ValidationResult<CreateSpaceInput> {
        const errors: ValidationError[] = [];

        if (!input || typeof input !== 'object') {
            errors.push(new ValidationError('input', input, 'must be an object'));
            return { success: false, errors };
        }

        const data = input as Record<string, unknown>;

        if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
            errors.push(new ValidationError('name', data.name, 'must be a non-empty string'));
        }

        if (!data.profileId || typeof data.profileId !== 'string') {
            errors.push(new ValidationError('profileId', data.profileId, 'must be a valid string'));
        }

        if (!data.userId || typeof data.userId !== 'string') {
            errors.push(new ValidationError('userId', data.userId, 'must be a valid string'));
        }

        if (data.accentColor && typeof data.accentColor === 'string') {
            if (!/^#[0-9A-Fa-f]{6}$/.test(data.accentColor)) {
                errors.push(new ValidationError('accentColor', data.accentColor, 'must be a valid hex color'));
            }
        }

        if (errors.length > 0) {
            return { success: false, errors };
        }

        return {
            success: true,
            data: {
                profileId: data.profileId as string,
                userId: data.userId as string,
                name: (data.name as string).trim(),
                iconName: (data.iconName as string | undefined) || 'folder',
                accentColor: (data.accentColor as string | undefined) || '#6D5AE6',
            },
            errors: [],
        };
    }

    validatePartial(input: unknown): ValidationResult<Partial<CreateSpaceInput>> {
        return { success: true, data: input as Partial<CreateSpaceInput>, errors: [] };
    }
}
