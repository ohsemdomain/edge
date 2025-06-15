#!/bin/bash

echo "Resetting database and applying migrations..."

# Drop existing tables
echo "Dropping existing tables..."
wrangler d1 execute edge_d1 --file=./reset-database.sql

# Apply migrations
echo "Applying migration 0001_create_items.sql..."
wrangler d1 execute edge_d1 --file=./migrations/0001_create_items.sql

echo "Applying migration 0002_create_contacts.sql..."
wrangler d1 execute edge_d1 --file=./migrations/0002_create_contacts.sql

echo "Database reset and migrations complete!"