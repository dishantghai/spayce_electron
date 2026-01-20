import { describe, it, expect } from 'vitest';
import { Color } from '../src/domain/value-objects/Color';

describe('Color Value Object', () => {
    describe('fromHex', () => {
        it('should create Color from valid hex string', () => {
            const color = Color.fromHex('#6D5AE6');
            expect(color).not.toBeNull();
            expect(color?.hex).toBe('#6D5AE6');
        });

        it('should normalize hex to uppercase', () => {
            const color = Color.fromHex('#6d5ae6');
            expect(color?.hex).toBe('#6D5AE6');
        });

        it('should return null for invalid hex (no hash)', () => {
            const color = Color.fromHex('6D5AE6');
            expect(color).toBeNull();
        });

        it('should return null for invalid hex (wrong length)', () => {
            const color = Color.fromHex('#6D5');
            expect(color).toBeNull();
        });

        it('should return null for invalid hex (invalid characters)', () => {
            const color = Color.fromHex('#GGGGGG');
            expect(color).toBeNull();
        });

        it('should return null for empty string', () => {
            const color = Color.fromHex('');
            expect(color).toBeNull();
        });

        it('should accept valid hex with lowercase letters', () => {
            const color = Color.fromHex('#abcdef');
            expect(color).not.toBeNull();
            expect(color?.hex).toBe('#ABCDEF');
        });
    });

    describe('fromRGB', () => {
        it('should create Color from RGB values', () => {
            const color = Color.fromRGB(109, 90, 230);
            expect(color.hex).toBe('#6D5AE6');
        });

        it('should clamp values below 0', () => {
            const color = Color.fromRGB(-10, 0, 0);
            expect(color.hex).toBe('#000000');
        });

        it('should clamp values above 255', () => {
            const color = Color.fromRGB(300, 255, 255);
            expect(color.hex).toBe('#FFFFFF');
        });

        it('should round decimal values', () => {
            const color = Color.fromRGB(109.7, 90.2, 230.5);
            expect(color.hex).toBe('#6E5AE7');
        });

        it('should handle black color', () => {
            const color = Color.fromRGB(0, 0, 0);
            expect(color.hex).toBe('#000000');
        });

        it('should handle white color', () => {
            const color = Color.fromRGB(255, 255, 255);
            expect(color.hex).toBe('#FFFFFF');
        });
    });

    describe('toRGB', () => {
        it('should convert hex to RGB values', () => {
            const color = Color.fromHex('#6D5AE6');
            const rgb = color?.toRGB();
            expect(rgb).toEqual({ r: 109, g: 90, b: 230 });
        });

        it('should handle black color', () => {
            const color = Color.fromHex('#000000');
            const rgb = color?.toRGB();
            expect(rgb).toEqual({ r: 0, g: 0, b: 0 });
        });

        it('should handle white color', () => {
            const color = Color.fromHex('#FFFFFF');
            const rgb = color?.toRGB();
            expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
        });

        it('should handle red color', () => {
            const color = Color.fromHex('#FF0000');
            const rgb = color?.toRGB();
            expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
        });
    });

    describe('equals', () => {
        it('should return true for same color', () => {
            const color1 = Color.fromHex('#6D5AE6');
            const color2 = Color.fromHex('#6D5AE6');
            expect(color1?.equals(color2!)).toBe(true);
        });

        it('should return true for same color with different case input', () => {
            const color1 = Color.fromHex('#6D5AE6');
            const color2 = Color.fromHex('#6d5ae6');
            expect(color1?.equals(color2!)).toBe(true);
        });

        it('should return false for different colors', () => {
            const color1 = Color.fromHex('#6D5AE6');
            const color2 = Color.fromHex('#FF0000');
            expect(color1?.equals(color2!)).toBe(false);
        });

        it('should compare normalized hex values', () => {
            const color1 = Color.fromRGB(109, 90, 230);
            const color2 = Color.fromHex('#6D5AE6');
            expect(color1.equals(color2!)).toBe(true);
        });
    });
});
