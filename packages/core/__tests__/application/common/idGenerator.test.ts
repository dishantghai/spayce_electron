import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateId } from '../../../src/application/common/idGenerator';

describe('ID Generator', () => {
    describe('generateId()', () => {
        it('should generate a unique ID', () => {
            const id = generateId();
            expect(id).toBeDefined();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('should generate different IDs on subsequent calls', () => {
            const id1 = generateId();
            const id2 = generateId();

            expect(id1).not.toBe(id2);
        });

        it('should generate IDs with UUID v4 format', () => {
            const id = generateId();

            // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        });

        it('should generate IDs with correct length (36 characters)', () => {
            const id = generateId();
            expect(id.length).toBe(36);
        });

        it('should generate many unique IDs', () => {
            const ids = new Set<string>();
            const count = 1000;

            for (let i = 0; i < count; i++) {
                ids.add(generateId());
            }

            // All IDs should be unique
            expect(ids.size).toBe(count);
        });

        it('should generate IDs quickly', () => {
            const start = Date.now();

            for (let i = 0; i < 1000; i++) {
                generateId();
            }

            const duration = Date.now() - start;
            // Should take less than 100ms for 1000 IDs
            expect(duration).toBeLessThan(100);
        });

        it('should include hyphens at correct positions', () => {
            const id = generateId();
            expect(id[8]).toBe('-');
            expect(id[13]).toBe('-');
            expect(id[18]).toBe('-');
            expect(id[23]).toBe('-');
        });

        it('should use hexadecimal characters only', () => {
            const id = generateId();
            const withoutHyphens = id.replace(/-/g, '');

            // Should only contain hex characters
            expect(withoutHyphens).toMatch(/^[0-9a-f]+$/);
        });
    });

    describe('ID Generator edge cases', () => {
        it('should work in different execution contexts', () => {
            const ids: string[] = [];

            // Simulate multiple contexts
            for (let i = 0; i < 10; i++) {
                ids.push(generateId());
            }

            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it('should not generate empty strings', () => {
            for (let i = 0; i < 100; i++) {
                const id = generateId();
                expect(id.length).toBe(36);
            }
        });

        it('should be URL-safe', () => {
            for (let i = 0; i < 100; i++) {
                const id = generateId();
                const encoded = encodeURIComponent(id);

                // Should not need URL encoding (except hyphens are already URL-safe)
                expect(encoded).toBe(id);
            }
        });
    });

    describe('UUID v4 compliance', () => {
        it('should have version 4 indicator in correct position', () => {
            for (let i = 0; i < 100; i++) {
                const id = generateId();
                // Position 14 should be '4' (version 4)
                expect(id[14]).toBe('4');
            }
        });

        it('should have correct variant bits', () => {
            for (let i = 0; i < 100; i++) {
                const id = generateId();
                // Position 19 should be 8, 9, a, or b (variant bits)
                expect(['8', '9', 'a', 'b']).toContain(id[19]);
            }
        });
    });

    describe('Performance characteristics', () => {
        it('should generate IDs in constant time', () => {
            const times: number[] = [];

            for (let i = 0; i < 100; i++) {
                const start = performance.now();
                generateId();
                const duration = performance.now() - start;
                times.push(duration);
            }

            // Average time should be very small
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            expect(avgTime).toBeLessThan(1); // Less than 1ms
        });

        it('should handle rapid sequential calls', () => {
            const ids: string[] = [];

            for (let i = 0; i < 10000; i++) {
                ids.push(generateId());
            }

            // All should be unique
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(10000);
        });
    });
});
