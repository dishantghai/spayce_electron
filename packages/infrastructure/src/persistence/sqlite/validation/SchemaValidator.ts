import type Database from 'better-sqlite3';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

interface ColumnSpec {
    name: string;
    type: string;
    notNull: boolean;
}

interface ColumnInfo {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
}

export class SchemaValidator {
    constructor(private readonly db: Database.Database) { }

    validateSchema(): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        const requiredTables = ['spaces', 'space_items', 'migrations'];
        for (const table of requiredTables) {
            if (!this.tableExists(table)) {
                result.errors.push(`Required table '${table}' not found`);
                result.isValid = false;
            }
        }

        if (!result.isValid) return result;

        this.validateSpacesTable(result);
        this.validateSpaceItemsTable(result);

        return result;
    }

    private tableExists(tableName: string): boolean {
        const row = this.db
            .prepare(
                `
            SELECT name FROM sqlite_master
            WHERE type='table' AND name=?
        `
            )
            .get(tableName);

        return row !== undefined;
    }

    private validateSpacesTable(result: ValidationResult): void {
        const requiredColumns: ColumnSpec[] = [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'profile_id', type: 'TEXT', notNull: true },
            { name: 'user_id', type: 'TEXT', notNull: true },
            { name: 'name', type: 'TEXT', notNull: true },
            { name: 'accent_color', type: 'TEXT', notNull: true },
            { name: 'icon_name', type: 'TEXT', notNull: true },
            { name: 'sort_order', type: 'INTEGER', notNull: true },
            { name: 'is_expanded', type: 'INTEGER', notNull: true },
            { name: 'created_at', type: 'INTEGER', notNull: true },
        ];

        this.validateTableColumns('spaces', requiredColumns, result);
    }

    private validateSpaceItemsTable(result: ValidationResult): void {
        const requiredColumns: ColumnSpec[] = [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'space_id', type: 'TEXT', notNull: true },
            { name: 'parent_id', type: 'TEXT', notNull: false },
            { name: 'name', type: 'TEXT', notNull: true },
            { name: 'path', type: 'TEXT', notNull: true },
            { name: 'type', type: 'TEXT', notNull: true },
            { name: 'is_expanded', type: 'INTEGER', notNull: true },
            { name: 'sort_order', type: 'INTEGER', notNull: true },
            { name: 'created_at', type: 'INTEGER', notNull: true },
            { name: 'is_pinned', type: 'INTEGER', notNull: true },
            { name: 'visit_count', type: 'INTEGER', notNull: true },
            { name: 'local_path', type: 'TEXT', notNull: false },
            { name: 'security_bookmark', type: 'TEXT', notNull: false },
            { name: 'last_synced_at', type: 'INTEGER', notNull: false },
            { name: 'is_watching', type: 'INTEGER', notNull: true },
        ];

        this.validateTableColumns('space_items', requiredColumns, result);
    }

    private validateTableColumns(tableName: string, requiredColumns: ColumnSpec[], result: ValidationResult): void {
        const schema = this.db.prepare(`PRAGMA table_info(${tableName})`).all() as ColumnInfo[];

        for (const required of requiredColumns) {
            const actual = schema.find((col) => col.name === required.name);

            if (!actual) {
                result.errors.push(`Missing column '${required.name}' in table '${tableName}'`);
                result.isValid = false;
                continue;
            }

            if (actual.type !== required.type) {
                result.warnings.push(
                    `Column '${required.name}' in table '${tableName}' has type '${actual.type}', expected '${required.type}'`
                );
            }
        }
    }
}
