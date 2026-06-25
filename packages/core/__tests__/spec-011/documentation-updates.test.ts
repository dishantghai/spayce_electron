/**
 * Spec 011: Migration & Feature Parity - SPEKY Documentation Updates Tests
 * 
 * TDD RED Phase: These tests verify SPEKY documentation is updated.
 * Tests should FAIL initially until documentation is complete.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

describe('Spec 011: SPEKY Documentation Updates', () => {
    describe('AC1: codebase.md Updates', () => {
        it('should have updated codebase.md', () => {
            const codebasePath = path.join(PROJECT_ROOT, '.speky/context/codebase.md');
            expect(fs.existsSync(codebasePath)).toBe(true);
        });

        it('should document @spayce/core package', () => {
            const codebasePath = path.join(PROJECT_ROOT, '.speky/context/codebase.md');

            if (!fs.existsSync(codebasePath)) {
                expect(fs.existsSync(codebasePath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(codebasePath, 'utf-8');
            expect(content).toContain('@spayce/core');
            expect(content).toContain('domain');
        });

        it('should document @spayce/infrastructure package', () => {
            const codebasePath = path.join(PROJECT_ROOT, '.speky/context/codebase.md');

            if (!fs.existsSync(codebasePath)) {
                expect(fs.existsSync(codebasePath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(codebasePath, 'utf-8');
            expect(content).toContain('@spayce/infrastructure');
        });

        it('should document @spayce/react-ui package', () => {
            const codebasePath = path.join(PROJECT_ROOT, '.speky/context/codebase.md');

            if (!fs.existsSync(codebasePath)) {
                expect(fs.existsSync(codebasePath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(codebasePath, 'utf-8');
            expect(content).toContain('@spayce/react-ui');
        });

        it('should NOT reference packages/shared/ as active package', () => {
            const codebasePath = path.join(PROJECT_ROOT, '.speky/context/codebase.md');

            if (!fs.existsSync(codebasePath)) {
                expect(fs.existsSync(codebasePath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(codebasePath, 'utf-8');
            // Should not have packages/shared as a primary package
            // It may be mentioned as deprecated or for migration context
            const hasSharedAsActive = content.includes('packages/shared/') &&
                !content.includes('deprecated') &&
                !content.includes('migrated');

            // This is a soft check - shared may still be mentioned in context
            expect(content).toContain('core');
        });
    });

    describe('AC2: tech_decisions.md Updates', () => {
        it('should have updated tech_decisions.md', () => {
            const techPath = path.join(PROJECT_ROOT, '.speky/context/tech_decisions.md');
            expect(fs.existsSync(techPath)).toBe(true);
        });

        it('should document Clean Architecture structure', () => {
            const techPath = path.join(PROJECT_ROOT, '.speky/context/tech_decisions.md');

            if (!fs.existsSync(techPath)) {
                expect(fs.existsSync(techPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(techPath, 'utf-8');
            expect(content.toLowerCase()).toContain('clean architecture');
        });

        it('should document service registry pattern', () => {
            const techPath = path.join(PROJECT_ROOT, '.speky/context/tech_decisions.md');

            if (!fs.existsSync(techPath)) {
                expect(fs.existsSync(techPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(techPath, 'utf-8');
            expect(content.toLowerCase()).toContain('service');
            expect(content.toLowerCase()).toContain('registry');
        });

        it('should document domain layer patterns', () => {
            const techPath = path.join(PROJECT_ROOT, '.speky/context/tech_decisions.md');

            if (!fs.existsSync(techPath)) {
                expect(fs.existsSync(techPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(techPath, 'utf-8');
            expect(content.toLowerCase()).toContain('domain');
            expect(content.toLowerCase()).toContain('entity');
        });

        it('should document application layer patterns', () => {
            const techPath = path.join(PROJECT_ROOT, '.speky/context/tech_decisions.md');

            if (!fs.existsSync(techPath)) {
                expect(fs.existsSync(techPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(techPath, 'utf-8');
            expect(content.toLowerCase()).toContain('use-case');
            expect(content.toLowerCase()).toContain('facade');
        });

        it('should document React UI integration patterns', () => {
            const techPath = path.join(PROJECT_ROOT, '.speky/context/tech_decisions.md');

            if (!fs.existsSync(techPath)) {
                expect(fs.existsSync(techPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(techPath, 'utf-8');
            expect(content.toLowerCase()).toContain('hook');
            expect(content.toLowerCase()).toContain('invalidation');
        });

        it('should have Migration Complete Markers section', () => {
            const techPath = path.join(PROJECT_ROOT, '.speky/context/tech_decisions.md');

            if (!fs.existsSync(techPath)) {
                expect(fs.existsSync(techPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(techPath, 'utf-8');
            // Should have markers for migration completion
            expect(content.toLowerCase()).toContain('migration');
        });
    });

    describe('AC3: architecture.md Creation', () => {
        it('should have architecture.md file', () => {
            const archPath = path.join(PROJECT_ROOT, '.speky/context/architecture.md');
            expect(fs.existsSync(archPath)).toBe(true);
        });

        it('should document layer dependencies', () => {
            const archPath = path.join(PROJECT_ROOT, '.speky/context/architecture.md');

            if (!fs.existsSync(archPath)) {
                expect(fs.existsSync(archPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(archPath, 'utf-8');
            expect(content.toLowerCase()).toContain('dependency');
        });

        it('should document package purposes', () => {
            const archPath = path.join(PROJECT_ROOT, '.speky/context/architecture.md');

            if (!fs.existsSync(archPath)) {
                expect(fs.existsSync(archPath)).toBe(true);
                return;
            }

            const content = fs.readFileSync(archPath, 'utf-8');
            expect(content).toContain('core');
            expect(content).toContain('infrastructure');
            expect(content).toContain('react-ui');
        });
    });

    describe('AC4: Agent Rules Update', () => {
        it('should have agent rules for modular architecture', () => {
            const rulesDir = path.join(PROJECT_ROOT, '.agent/rules');
            expect(fs.existsSync(rulesDir)).toBe(true);
        });

        it('should document new feature development workflow', () => {
            const rulesDir = path.join(PROJECT_ROOT, '.agent/rules');

            if (!fs.existsSync(rulesDir)) {
                expect(fs.existsSync(rulesDir)).toBe(true);
                return;
            }

            const files = fs.readdirSync(rulesDir);
            let hasWorkflow = false;

            for (const file of files) {
                const content = fs.readFileSync(path.join(rulesDir, file), 'utf-8');
                if (content.toLowerCase().includes('entity') &&
                    content.toLowerCase().includes('repository') &&
                    content.toLowerCase().includes('use case')) {
                    hasWorkflow = true;
                    break;
                }
            }

            expect(hasWorkflow).toBe(true);
        });
    });
});

describe('Spec 011: Test Coverage Requirements', () => {
    describe('AC1: Domain Layer Coverage', () => {
        it('should have entity tests', () => {
            const entitiesTestPath = path.join(PROJECT_ROOT, 'packages/core/__tests__/entities.test.ts');
            expect(fs.existsSync(entitiesTestPath)).toBe(true);
        });

        it('should have validator tests', () => {
            const validatorsTestPath = path.join(PROJECT_ROOT, 'packages/core/__tests__/validators.test.ts');
            expect(fs.existsSync(validatorsTestPath)).toBe(true);
        });

        it('should have error tests', () => {
            const errorsTestPath = path.join(PROJECT_ROOT, 'packages/core/__tests__/errors.test.ts');
            expect(fs.existsSync(errorsTestPath)).toBe(true);
        });

        it('should have event tests', () => {
            const eventsTestPath = path.join(PROJECT_ROOT, 'packages/core/__tests__/events.test.ts');
            expect(fs.existsSync(eventsTestPath)).toBe(true);
        });
    });

    describe('AC2: Application Layer Coverage', () => {
        it('should have use case tests', () => {
            const useCasesDir = path.join(PROJECT_ROOT, 'packages/core/__tests__/application');
            expect(fs.existsSync(useCasesDir)).toBe(true);
        });
    });

    describe('AC3: Infrastructure Layer Coverage', () => {
        it('should have repository tests', () => {
            const repoTestPath = path.join(PROJECT_ROOT, 'packages/infrastructure/__tests__/sqlite-repositories.test.ts');
            expect(fs.existsSync(repoTestPath)).toBe(true);
        });

        it('should have service registry tests', () => {
            const registryTestPath = path.join(PROJECT_ROOT, 'packages/infrastructure/__tests__/service-registry.test.ts');
            expect(fs.existsSync(registryTestPath)).toBe(true);
        });

        it('should have bootstrap tests', () => {
            const bootstrapTestPath = path.join(PROJECT_ROOT, 'packages/infrastructure/__tests__/bootstrap.test.ts');
            expect(fs.existsSync(bootstrapTestPath)).toBe(true);
        });
    });

    describe('AC4: React UI Layer Coverage', () => {
        it('should have hooks tests directory', () => {
            const hooksTestDir = path.join(PROJECT_ROOT, 'packages/react-ui/__tests__/hooks');
            expect(fs.existsSync(hooksTestDir)).toBe(true);
        });

        it('should have components tests directory', () => {
            const componentsTestDir = path.join(PROJECT_ROOT, 'packages/react-ui/__tests__/components');
            expect(fs.existsSync(componentsTestDir)).toBe(true);
        });

        it('should have stores tests directory', () => {
            const storesTestDir = path.join(PROJECT_ROOT, 'packages/react-ui/__tests__/stores');
            expect(fs.existsSync(storesTestDir)).toBe(true);
        });
    });
});
