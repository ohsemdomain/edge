-- Drop existing tables and indexes
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS contacts;

-- Drop any existing indexes (they should be dropped with tables, but just in case)
DROP INDEX IF EXISTS idx_items_active;
DROP INDEX IF EXISTS idx_items_created_at;
DROP INDEX IF EXISTS idx_contacts_active;
DROP INDEX IF EXISTS idx_contacts_created_at;
DROP INDEX IF EXISTS idx_contacts_type;