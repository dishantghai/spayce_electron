# Decision log

Append-only. A later entry supersedes an earlier one on the same point; never edit or reorder lines.

- 2026-10-14 [decision] D1: Timestamps are stored as INTEGER epoch milliseconds (Date.getTime()) in SQLite, not ISO strings as spec 008 specified; kept as-is because the schema, repositories and tests all use it consistently (ref: 008)
- 2026-10-14 [event] D2: Migrated to SPEKY v3: 12 capability specs seeded under .speky/capabilities/, 12 suspect completions checked, 8 gap stories filed (B026-B031, T001-T002)
