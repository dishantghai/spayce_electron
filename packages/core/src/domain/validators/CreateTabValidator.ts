/**
 * CreateTab Validator
 *
 * Validates input for creating new tabs.
 *
 * @see Spec 018 - Browser Domain Layer
 */

import { ValidationError } from '../errors';
import type { ValidationResult } from './SchemaValidator';
import type { CreateTabInput } from '../entities/Tab';
import { TabType, CREATE_TAB_DEFAULTS } from '../entities/Tab';

/**
 * Validates CreateTabInput
 */
export class CreateTabValidator {
    static readonly MAX_URL_LENGTH = 2048;
    static readonly MAX_TITLE_LENGTH = 500;
    static readonly URL_PATTERN = /^https?:\/\/.+/;

    validate(input: unknown): ValidationResult<CreateTabInput> {
        const errors: ValidationError[] = [];

        // Handle null, undefined, or non-object input
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            // Return defaults for empty/non-object input (new tab)
            return {
                success: true,
                data: CREATE_TAB_DEFAULTS,
                errors: [],
            };
        }

        const data = input as Record<string, unknown>;

        // Validate URL if provided
        if (data.url !== undefined) {
            if (typeof data.url !== 'string') {
                errors.push(new ValidationError('url', data.url, 'must be a string'));
            } else if (data.url.length > CreateTabValidator.MAX_URL_LENGTH) {
                errors.push(new ValidationError('url', data.url, `must be at most ${CreateTabValidator.MAX_URL_LENGTH} characters`));
            } else if (data.url.trim().length > 0 && !CreateTabValidator.URL_PATTERN.test(data.url)) {
                // Non-empty URL must be valid HTTP/HTTPS
                errors.push(new ValidationError('url', data.url, 'must be a valid HTTP/HTTPS URL'));
            }
        }

        // Validate title if provided
        if (data.title !== undefined) {
            if (typeof data.title !== 'string') {
                errors.push(new ValidationError('title', data.title, 'must be a string'));
            } else if (data.title.length > CreateTabValidator.MAX_TITLE_LENGTH) {
                errors.push(new ValidationError('title', data.title, `must be at most ${CreateTabValidator.MAX_TITLE_LENGTH} characters`));
            }
        }

        // Validate tabType if provided
        if (data.tabType !== undefined) {
            if (!Object.values(TabType).includes(data.tabType as TabType)) {
                errors.push(new ValidationError('tabType', data.tabType, `must be one of: ${Object.values(TabType).join(', ')}`));
            }
        }

        // Validate origin fields (both or neither)
        const hasOriginSpace = data.originSpaceId !== undefined && data.originSpaceId !== null;
        const hasOriginItem = data.originSpaceItemId !== undefined && data.originSpaceItemId !== null;
        if (hasOriginSpace !== hasOriginItem) {
            errors.push(new ValidationError('originSpaceId', data.originSpaceId, 'originSpaceId and originSpaceItemId must both be provided or both be null'));
        }

        if (errors.length > 0) {
            return { success: false, errors };
        }

        // Merge with defaults
        const validated: CreateTabInput = {
            url: (data.url as string | undefined) ?? CREATE_TAB_DEFAULTS.url,
            title: (data.title as string | undefined) ?? CREATE_TAB_DEFAULTS.title,
            tabType: (data.tabType as TabType | undefined) ?? CREATE_TAB_DEFAULTS.tabType,
            faviconUrl: (data.faviconUrl as string | null | undefined) ?? CREATE_TAB_DEFAULTS.faviconUrl,
            originSpaceId: (data.originSpaceId as string | null | undefined) ?? CREATE_TAB_DEFAULTS.originSpaceId,
            originSpaceItemId: (data.originSpaceItemId as string | null | undefined) ?? CREATE_TAB_DEFAULTS.originSpaceItemId,
            activate: (data.activate as boolean | undefined) ?? CREATE_TAB_DEFAULTS.activate,
        };

        return {
            success: true,
            data: validated,
            errors: [],
        };
    }
}
