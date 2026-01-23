import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation, type ValidationSchema } from '../../src/hooks/useFormValidation';

interface TestForm {
    name: string;
    email: string;
}

const createMockValidator = (): ValidationSchema<TestForm> => ({
    validate: vi.fn().mockReturnValue({ success: true, errors: [] }),
    validatePartial: vi.fn().mockReturnValue({ success: true, errors: [] }),
});

describe('Feature: 010 - useFormValidation Hook', () => {
    describe('AC1: useFormValidation accepts validator and initial values', () => {
        test('should accept validator and initial values', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation(validator, { name: 'Test' }));
            expect(result.current.values).toEqual({ name: 'Test' });
        });

        test('should return values, errors, touched, isValid, setValue, setFieldTouched, validateField, validateAll, reset', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation(validator));
            expect(result.current).toHaveProperty('values');
            expect(result.current).toHaveProperty('errors');
            expect(result.current).toHaveProperty('touched');
            expect(result.current).toHaveProperty('isValid');
            expect(typeof result.current.setValue).toBe('function');
            expect(typeof result.current.setFieldTouched).toBe('function');
            expect(typeof result.current.validateField).toBe('function');
            expect(typeof result.current.validateAll).toBe('function');
            expect(typeof result.current.reset).toBe('function');
        });
    });

    describe('AC2: setValue updates values and validates if touched', () => {
        test('should update values when setValue is called', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation<TestForm>(validator));
            act(() => {
                result.current.setValue('name', 'New Name');
            });
            expect(result.current.values.name).toBe('New Name');
        });

        test('should validate field if already touched', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation<TestForm>(validator));
            act(() => {
                result.current.setFieldTouched('name');
                result.current.setValue('name', 'New Name');
            });
            expect(validator.validatePartial).toHaveBeenCalled();
        });

        test('should not validate field if not touched', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation<TestForm>(validator));
            act(() => {
                result.current.setValue('name', 'New Name');
            });
            // validatePartial is only called once during setFieldTouched, not during setValue
            expect(validator.validatePartial).not.toHaveBeenCalled();
        });
    });

    describe('AC3: setFieldTouched marks field touched and validates', () => {
        test('should mark field as touched', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation<TestForm>(validator));
            act(() => {
                result.current.setFieldTouched('name');
            });
            expect(result.current.touched.name).toBe(true);
        });

        test('should validate field when touched', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation<TestForm>(validator));
            act(() => {
                result.current.setFieldTouched('name');
            });
            expect(validator.validatePartial).toHaveBeenCalled();
        });
    });

    describe('AC4: validateAll validates entire form', () => {
        test('should validate all fields', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation<TestForm>(validator, { name: 'Test' }));
            act(() => {
                result.current.validateAll();
            });
            expect(validator.validate).toHaveBeenCalled();
        });

        test('should return true when all fields are valid', () => {
            const validator = createMockValidator();
            validator.validate = vi.fn().mockReturnValue({ success: true, errors: [] });
            const { result } = renderHook(() => useFormValidation<TestForm>(validator, { name: 'Test' }));
            let isValid: boolean = false;
            act(() => {
                isValid = result.current.validateAll();
            });
            expect(isValid).toBe(true);
        });

        test('should return false when any field is invalid', () => {
            const validator = createMockValidator();
            validator.validate = vi.fn().mockReturnValue({
                success: false,
                errors: [{ field: 'name', message: 'Required' }]
            });
            const { result } = renderHook(() => useFormValidation<TestForm>(validator));
            let isValid: boolean = true;
            act(() => {
                isValid = result.current.validateAll();
            });
            expect(isValid).toBe(false);
        });

        test('should set errors for invalid fields', () => {
            const validator = createMockValidator();
            validator.validate = vi.fn().mockReturnValue({
                success: false,
                errors: [{ field: 'name', message: 'Required' }]
            });
            const { result } = renderHook(() => useFormValidation<TestForm>(validator));
            act(() => {
                result.current.validateAll();
            });
            expect(result.current.errors.name).toBe('Required');
        });
    });

    describe('AC5: isValid computed correctly from errors and values', () => {
        test('should be false when there are errors', () => {
            const validator = createMockValidator();
            validator.validatePartial = vi.fn().mockReturnValue({
                success: false,
                errors: [{ field: 'name', message: 'Required' }]
            });
            const { result } = renderHook(() => useFormValidation<TestForm>(validator, { name: '' }));
            act(() => {
                result.current.setFieldTouched('name');
            });
            expect(result.current.isValid).toBe(false);
        });

        test('should be false when values are empty', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation<TestForm>(validator));
            expect(result.current.isValid).toBe(false);
        });

        test('should be true when values exist and no errors', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation<TestForm>(validator, { name: 'Test' }));
            expect(result.current.isValid).toBe(true);
        });
    });

    describe('AC6: reset restores initial state', () => {
        test('should reset values to initial values', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation<TestForm>(validator, { name: 'Initial' }));
            act(() => {
                result.current.setValue('name', 'Changed');
                result.current.reset();
            });
            expect(result.current.values.name).toBe('Initial');
        });

        test('should clear errors', () => {
            const validator = createMockValidator();
            validator.validate = vi.fn().mockReturnValue({
                success: false,
                errors: [{ field: 'name', message: 'Required' }]
            });
            const { result } = renderHook(() => useFormValidation<TestForm>(validator));
            act(() => {
                result.current.validateAll();
                result.current.reset();
            });
            expect(result.current.errors).toEqual({});
        });

        test('should clear touched state', () => {
            const validator = createMockValidator();
            const { result } = renderHook(() => useFormValidation<TestForm>(validator));
            act(() => {
                result.current.setFieldTouched('name');
                result.current.reset();
            });
            expect(result.current.touched).toEqual({});
        });
    });
});
