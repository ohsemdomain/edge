-- migrations/0002_create_contacts.sql
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL UNIQUE,
  person_incharge TEXT NOT NULL,
  primary_phone TEXT NOT NULL,
  email TEXT,
  phone_alt_1 TEXT,
  phone_alt_2 TEXT,
  phone_alt_3 TEXT,
  is_supplier BOOLEAN DEFAULT FALSE, -- FALSE = Client, TRUE = Supplier
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_contacts_active ON contacts(is_active);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
CREATE INDEX idx_contacts_supplier ON contacts(is_supplier);
CREATE UNIQUE INDEX idx_contacts_company_name ON contacts(company_name);