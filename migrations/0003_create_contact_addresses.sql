-- migrations/0003_create_contact_addresses.sql
CREATE TABLE IF NOT EXISTS contact_addresses (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  receiver TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  address_line3 TEXT,
  address_line4 TEXT,
  postcode TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL,
  is_default_billing BOOLEAN DEFAULT FALSE,
  is_default_shipping BOOLEAN DEFAULT FALSE,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX idx_contact_addresses_contact_id ON contact_addresses(contact_id);
CREATE INDEX idx_contact_addresses_defaults ON contact_addresses(contact_id, is_default_billing, is_default_shipping);