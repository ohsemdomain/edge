-- migrations/0001_create_items.sql
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_items_active ON items(is_active);
CREATE INDEX idx_items_created_at ON items(created_at);