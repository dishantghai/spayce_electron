import { useState, useCallback, useMemo } from 'react';

export interface ValidationError {
    field?: string;
    message: string;
}

export interface ValidationResult {
    success: boolean;
    errors: ValidationError[];
}

export interface ValidationSchema<T> {
    validate: (values: Partial<T>) => ValidationResult;
    validatePartial: (values: Partial<T>) => ValidationResult;
}

export interface FormValidationResult<T> {
    values: Partial<T>;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    isValid: boolean;
    setValue: (field: keyof T, value: unknown) => void;
    setFieldTouched: (field: keyof T) => void;
    validateField: (field: keyof T, value: unknown) => boolean;
    validateAll: () => boolean;
    reset: () => void;
}

export function useFormValidation<T>(
    validator: ValidationSchema<T>,
    initialValues: Partial<T> = {}
): FormValidationResult<T> {
    const [values, setValues] = useState<Partial<T>>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = useCallback((field: keyof T, value: unknown): boolean => {
        const partialResult = validator.validatePartial({ [field]: value } as Partial<T>);
        const fieldErrors = partialResult.errors.filter(e => e.field === field);

        setErrors(prev => ({
            ...prev,
            [field as string]: fieldErrors.length > 0 ? fieldErrors[0].message : ''
        }));

        return fieldErrors.length === 0;
    }, [validator]);

    const setValue = useCallback((field: keyof T, value: unknown) => {
        setValues(prev => ({ ...prev, [field]: value }));

        if (touched[field as string]) {
            validateField(field, value);
        }
    }, [validateField, touched]);

    const setFieldTouched = useCallback((field: keyof T) => {
        setTouched(prev => ({ ...prev, [field as string]: true }));
        validateField(field, values[field]);
    }, [validateField, values]);

    const validateAll = useCallback((): boolean => {
        const result = validator.validate(values);

        if (!result.success) {
            const errorMap: Record<string, string> = {};
            result.errors.forEach(error => {
                if (error.field) {
                    errorMap[error.field] = error.message;
                }
            });
            setErrors(errorMap);
            return false;
        }

        setErrors({});
        return true;
    }, [validator, values]);

    const isValid = useMemo(() => {
        const hasErrors = Object.values(errors).some(e => e !== '');
        const hasValues = Object.keys(values).length > 0;
        return hasValues && !hasErrors;
    }, [errors, values]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    return {
        values,
        errors,
        touched,
        isValid,
        setValue,
        setFieldTouched,
        validateField,
        validateAll,
        reset
    };
}
