export type Result<T, E = AppError> =
    | { success: true; data: T }
    | { success: false; error: E };

export interface AppError {
    type: 'validation' | 'business_rule' | 'not_found' | 'system';
    message: string;
    field?: string;
    code?: string;
}

export function ok<T>(data: T): Result<T, never> {
    return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
    return { success: false, error };
}
