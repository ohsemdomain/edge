-- migrations/0002_create_contacts.sql
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  legal_name TEXT NOT NULL,
  contact_type TEXT DEFAULT 'client', -- 'client', 'supplier', 'employee'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_contacts_active ON contacts(is_active);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
CREATE INDEX idx_contacts_type ON contacts(contact_type);