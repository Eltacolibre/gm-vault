import Database from 'better-sqlite3';

export type DB = InstanceType<typeof Database>;

export const RECORD_TYPES = ['npc', 'location', 'faction', 'item', 'encounter'] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

const SCHEMA = `
CREATE TABLE IF NOT EXISTS campaigns (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  setting     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS records (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('npc','location','faction','item','encounter')),
  name        TEXT NOT NULL,
  subtitle    TEXT NOT NULL DEFAULT '',
  tags        TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  data        TEXT NOT NULL DEFAULT '{}',
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_records_campaign ON records(campaign_id, type);
CREATE INDEX IF NOT EXISTS idx_records_name ON records(name);

CREATE TABLE IF NOT EXISTS notes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id  INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  session_date TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notes_campaign ON notes(campaign_id);

CREATE TABLE IF NOT EXISTS formulas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  formula     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_formulas_campaign ON formulas(campaign_id);
`;

export function openDb(path = ':memory:'): DB {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}
