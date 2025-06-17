-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date INTEGER NOT NULL,
  due_date INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Create index for faster queries
CREATE INDEX idx_invoices_contact_id ON invoices(contact_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_is_active ON invoices(is_active);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  item_id TEXT,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Create index for faster queries
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_item_id ON invoice_items(item_id);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  invoice_id TEXT,
  amount REAL NOT NULL,
  payment_date INTEGER NOT NULL,
  payment_method TEXT,
  type TEXT NOT NULL DEFAULT 'payment',
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Create index for faster queries
CREATE INDEX idx_payments_contact_id ON payments(contact_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_type ON payments(type);
CREATE INDEX idx_payments_is_active ON payments(is_active);