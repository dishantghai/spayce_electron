import { describe, it, expect } from 'vitest';
import { Color } from '../../../src/domain/value-objects/Color';

describe('Color Value Object', () => {
    describe('fromHex()', () => {
        it('should create Color from valid hex', () => {
            const color = Color.fromHex('#6D5AE6');
            expect(color).not.toBeNull();
            expect(color?.hex).toBe('#6D5AE6');
        });

        it('should accept uppercase hex', () => {
            const color = Color.fromHex('#FF00FF');
            expect(color).not.toBeNull();
            expect(color?.hex).toBe('#FF00FF');
        });

        it('should accept lowercase hex', () => {
            const color = Color.fromHex('#ff00ff');
            expect(color).not.toBeNull();
            expect(color?.hex).toBe('#FF00FF'); // Normalized to uppercase
        });

        it('should accept mixed case hex', () => {
            const color = Color.fromHex('#Ff00Ff');
            expect(color).not.toBeNull();
            expect(color?.hex).toBe('#FF00FF'); // Normalized to uppercase
        });

        it('should return null for invalid hex (no #)', () => {
            const color = Color.fromHex('6D5AE6');
            expect(color).toBeNull();
        });

        it('should return null for invalid hex (wrong length)', () => {
            expect(Color.fromHex('#123')).toBeNull();
            expect(Color.fromHex('#1234567')).toBeNull();
        });

        it('should return null for invalid hex (non-hex characters)', () => {
            expect(Color.fromHex('#GGGGGG')).toBeNull();
            expect(Color.fromHex('#12345Z')).toBeNull();
        });

        it('should return null for empty string', () => {
            expect(Color.fromHex('')).toBeNull();
        });

        it('should handle common colors', () => {
            expect(Color.fromHex('#000000')).not.toBeNull();
            expect(Color.fromHex('#FFFFFF')).not.toBeNull();
            expect(Color.fromHex('#FF0000')).not.toBeNull();
            expect(Color.fromHex('#00FF00')).not.toBeNull();
            expect(Color.fromHex('#0000FF')).not.toBeNull();
        });
    });

    describe('hex property', () => {
        it('should expose hex value', () => {
            const color = Color.fromHex('#6D5AE6');
            expect(color?.hex).toBe('#6D5AE6');
        });

        it('should normalize to uppercase', () => {
            const color1 = Color.fromHex('#AABBCC');
            const color2 = Color.fromHex('#aabbcc');
            expect(color1?.hex).toBe('#AABBCC');
            expect(color2?.hex).toBe('#AABBCC'); // Implementation normalizes to uppercase
        });
    });
});
