import { describe, it, expect } from 'vitest';
import {
    CreateSpaceValidator,
    FormatValidators,
    DataSanitizer,
} from '../src/domain/validators';
import { ValidationError } from '../src/domain/errors';

describe('Validators', () => {
    describe('CreateSpaceValidator', () => {
        const validator = new CreateSpaceValidator();

        describe('validate', () => {
            it('should validate valid input', () => {
                const result = validator.validate({
                    profileId: 'profile-1',
                    userId: 'user-1',
                    name: 'My Space',
                });

                expect(result.success).toBe(true);
                expect(result.errors).toHaveLength(0);
                expect(result.data?.name).toBe('My Space');
                expect(result.data?.profileId).toBe('profile-1');
                expect(result.data?.userId).toBe('user-1');
            });

            it('should provide default iconName and accentColor', () => {
                const result = validator.validate({
                    profileId: 'profile-1',
                    userId: 'user-1',
                    name: 'My Space',
                });

                expect(result.data?.iconName).toBe('folder');
                expect(result.data?.accentColor).toBe('#6D5AE6');
            });

            it('should accept custom iconName and accentColor', () => {
                const result = validator.validate({
                    profileId: 'profile-1',
                    userId: 'user-1',
                    name: 'My Space',
                    iconName: 'rocket',
                    accentColor: '#FF0000',
                });

                expect(result.data?.iconName).toBe('rocket');
                expect(result.data?.accentColor).toBe('#FF0000');
            });

            it('should trim name', () => {
                const result = validator.validate({
                    profileId: 'profile-1',
                    userId: 'user-1',
                    name: '  My Space  ',
                });

                expect(result.data?.name).toBe('My Space');
            });

            it('should fail for missing name', () => {
                const result = validator.validate({
                    profileId: 'profile-1',
                    userId: 'user-1',
                });

                expect(result.success).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
                expect(result.errors[0]).toBeInstanceOf(ValidationError);
            });

            it('should fail for empty name', () => {
                const result = validator.validate({
                    profileId: 'profile-1',
                    userId: 'user-1',
                    name: '   ',
                });

                expect(result.success).toBe(false);
            });

            it('should fail for missing profileId', () => {
                const result = validator.validate({
                    userId: 'user-1',
                    name: 'My Space',
                });

                expect(result.success).toBe(false);
            });

            it('should fail for missing userId', () => {
                const result = validator.validate({
                    profileId: 'profile-1',
                    name: 'My Space',
                });

                expect(result.success).toBe(false);
            });

            it('should fail for invalid accentColor', () => {
                const result = validator.validate({
                    profileId: 'profile-1',
                    userId: 'user-1',
                    name: 'My Space',
                    accentColor: 'invalid',
                });

                expect(result.success).toBe(false);
            });

            it('should fail for non-object input', () => {
                const result = validator.validate(null);
                expect(result.success).toBe(false);

                const result2 = validator.validate('string');
                expect(result2.success).toBe(false);
            });
        });

        describe('validatePartial', () => {
            it('should validate partial input', () => {
                const result = validator.validatePartial({ name: 'Updated' });
                expect(result.success).toBe(true);
            });
        });
    });

    describe('FormatValidators', () => {
        describe('validateUrl', () => {
            it('should validate valid HTTP URL', () => {
                const result = FormatValidators.validateUrl('http://example.com');
                expect(result.success).toBe(true);
                expect(result.data).toBe('http://example.com');
            });

            it('should validate valid HTTPS URL', () => {
                const result = FormatValidators.validateUrl('https://example.com/path?query=1');
                expect(result.success).toBe(true);
            });

            it('should trim URL', () => {
                const result = FormatValidators.validateUrl('  https://example.com  ');
                expect(result.data).toBe('https://example.com');
            });

            it('should fail for invalid URL', () => {
                const result = FormatValidators.validateUrl('not-a-url');
                expect(result.success).toBe(false);
                expect(result.errors[0]).toBeInstanceOf(ValidationError);
            });

            it('should fail for empty string', () => {
                const result = FormatValidators.validateUrl('');
                expect(result.success).toBe(false);
            });

            it('should fail for non-string', () => {
                const result = FormatValidators.validateUrl(null as unknown as string);
                expect(result.success).toBe(false);
            });
        });

        describe('validateHexColor', () => {
            it('should validate valid hex color', () => {
                const result = FormatValidators.validateHexColor('#6D5AE6');
                expect(result.success).toBe(true);
                expect(result.data).toBe('#6D5AE6');
            });

            it('should normalize to uppercase', () => {
                const result = FormatValidators.validateHexColor('#abcdef');
                expect(result.data).toBe('#ABCDEF');
            });

            it('should fail for invalid hex (no hash)', () => {
                const result = FormatValidators.validateHexColor('6D5AE6');
                expect(result.success).toBe(false);
            });

            it('should fail for invalid hex (wrong length)', () => {
                const result = FormatValidators.validateHexColor('#FFF');
                expect(result.success).toBe(false);
            });

            it('should fail for empty string', () => {
                const result = FormatValidators.validateHexColor('');
                expect(result.success).toBe(false);
            });
        });

        describe('validateFilePath', () => {
            it('should validate valid file path', () => {
                const result = FormatValidators.validateFilePath('/Users/test/Documents');
                expect(result.success).toBe(true);
            });

            it('should trim path', () => {
                const result = FormatValidators.validateFilePath('  /path/to/file  ');
                expect(result.data).toBe('/path/to/file');
            });

            it('should fail for path with invalid characters', () => {
                const result = FormatValidators.validateFilePath('/path/<invalid>');
                expect(result.success).toBe(false);
            });

            it('should fail for empty string', () => {
                const result = FormatValidators.validateFilePath('');
                expect(result.success).toBe(false);
            });
        });
    });

    describe('DataSanitizer', () => {
        describe('sanitizeString', () => {
            it('should trim whitespace', () => {
                expect(DataSanitizer.sanitizeString('  hello  ')).toBe('hello');
            });

            it('should remove < and > characters', () => {
                expect(DataSanitizer.sanitizeString('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
            });

            it('should remove javascript: protocol', () => {
                expect(DataSanitizer.sanitizeString('javascript:alert(1)')).toBe('alert(1)');
            });

            it('should remove data: protocol', () => {
                expect(DataSanitizer.sanitizeString('data:text/html,<h1>Hi</h1>')).toBe('text/html,h1Hi/h1');
            });

            it('should truncate to maxLength', () => {
                const result = DataSanitizer.sanitizeString('hello world', 5);
                expect(result).toBe('hello');
            });

            it('should return empty string for null/undefined', () => {
                expect(DataSanitizer.sanitizeString(null as unknown as string)).toBe('');
                expect(DataSanitizer.sanitizeString(undefined as unknown as string)).toBe('');
            });
        });

        describe('sanitizeUrl', () => {
            it('should preserve valid https URL', () => {
                expect(DataSanitizer.sanitizeUrl('https://example.com')).toBe('https://example.com');
            });

            it('should preserve valid http URL', () => {
                expect(DataSanitizer.sanitizeUrl('http://example.com')).toBe('http://example.com');
            });

            it('should add https:// prefix if missing', () => {
                expect(DataSanitizer.sanitizeUrl('example.com')).toBe('https://example.com');
            });

            it('should trim whitespace', () => {
                expect(DataSanitizer.sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
            });

            it('should truncate long URLs', () => {
                const longUrl = 'https://example.com/' + 'a'.repeat(3000);
                const result = DataSanitizer.sanitizeUrl(longUrl);
                expect(result.length).toBeLessThanOrEqual(2048);
            });

            it('should return empty string for null/undefined', () => {
                expect(DataSanitizer.sanitizeUrl(null as unknown as string)).toBe('');
            });
        });

        describe('sanitizeFileName', () => {
            it('should preserve valid filename', () => {
                expect(DataSanitizer.sanitizeFileName('document.pdf')).toBe('document.pdf');
            });

            it('should remove invalid characters', () => {
                expect(DataSanitizer.sanitizeFileName('file<name>:test')).toBe('filenametest');
            });

            it('should remove path traversal sequences', () => {
                const result = DataSanitizer.sanitizeFileName('../../../etc/passwd');
                expect(result).not.toContain('..');
            });

            it('should trim whitespace', () => {
                expect(DataSanitizer.sanitizeFileName('  file.txt  ')).toBe('file.txt');
            });

            it('should truncate to 255 characters', () => {
                const longName = 'a'.repeat(300) + '.txt';
                const result = DataSanitizer.sanitizeFileName(longName);
                expect(result.length).toBeLessThanOrEqual(255);
            });

            it('should return empty string for null/undefined', () => {
                expect(DataSanitizer.sanitizeFileName(null as unknown as string)).toBe('');
            });
        });
    });
});
