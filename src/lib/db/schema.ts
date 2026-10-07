export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS scholarship_periods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  override TEXT NOT NULL DEFAULT 'auto' CHECK (override IN ('auto', 'open', 'closed')),
  is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS scholarship_periods_one_current
  ON scholarship_periods (is_current)
  WHERE is_current = 1;
`;
