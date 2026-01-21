import type Database from 'better-sqlite3';

export interface IntegrityResult {
    isValid: boolean;
    issues: IntegrityIssue[];
}

export interface IntegrityIssue {
    type: 'foreign_key_violation' | 'invalid_format' | 'duplicate_key' | 'missing_required';
    table: string;
    message: string;
    affectedRows: number;
}

export class IntegrityChecker {
    constructor(private readonly db: Database.Database) { }

    performIntegrityCheck(): IntegrityResult {
        const result: IntegrityResult = {
            isValid: true,
            issues: [],
        };

        this.checkForeignKeyIntegrity(result);
        this.validateDataFormats(result);
        this.checkDuplicateKeys(result);

        return result;
    }

    private checkForeignKeyIntegrity(result: IntegrityResult): void {
        const orphanedItems = this.db
            .prepare(
                `
            SELECT COUNT(*) as count FROM space_items si
            LEFT JOIN spaces s ON si.space_id = s.id
            WHERE s.id IS NULL
        `
            )
            .get() as { count: number };

        if (orphanedItems.count > 0) {
            result.issues.push({
                type: 'foreign_key_violation',
                table: 'space_items',
                message: `${orphanedItems.count} items reference non-existent spaces`,
                affectedRows: orphanedItems.count,
            });
            result.isValid = false;
        }

        const orphanedChildren = this.db
            .prepare(
                `
            SELECT COUNT(*) as count FROM space_items si1
            LEFT JOIN space_items si2 ON si1.parent_id = si2.id
            WHERE si1.parent_id IS NOT NULL AND si2.id IS NULL
        `
            )
            .get() as { count: number };

        if (orphanedChildren.count > 0) {
            result.issues.push({
                type: 'foreign_key_violation',
                table: 'space_items',
                message: `${orphanedChildren.count} items reference non-existent parent items`,
                affectedRows: orphanedChildren.count,
            });
            result.isValid = false;
        }
    }

    private validateDataFormats(result: IntegrityResult): void {
        const invalidColors = this.db
            .prepare(
                `
            SELECT COUNT(*) as count FROM spaces
            WHERE accent_color NOT GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'
        `
            )
            .get() as { count: number };

        if (invalidColors.count > 0) {
            result.issues.push({
                type: 'invalid_format',
                table: 'spaces',
                message: `${invalidColors.count} spaces have invalid accent_color format`,
                affectedRows: invalidColors.count,
            });
        }
    }

    private checkDuplicateKeys(result: IntegrityResult): void {
        const tables = ['spaces', 'space_items'];

        for (const table of tables) {
            const duplicates = this.db
                .prepare(
                    `
                SELECT COUNT(*) as count FROM (
                    SELECT id, COUNT(*) as c FROM ${table} GROUP BY id HAVING COUNT(*) > 1
                )
            `
                )
                .get() as { count: number };

            if (duplicates.count > 0) {
                result.issues.push({
                    type: 'duplicate_key',
                    table,
                    message: `${duplicates.count} duplicate primary keys found`,
                    affectedRows: duplicates.count,
                });
                result.isValid = false;
            }
        }
    }
}
