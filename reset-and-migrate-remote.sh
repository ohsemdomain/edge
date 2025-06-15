#!/bin/bash

echo "WARNING: This will reset the REMOTE production database!"
echo "Are you sure you want to continue? (yes/no)"
read confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Operation cancelled."
    exit 1
fi

echo "Resetting REMOTE database and applying migrations..."

# Drop existing tables on remote
echo "Dropping existing tables on remote..."
wrangler d1 execute edge_d1 --remote --file=./reset-database.sql

# Apply migrations to remote
echo "Applying migration 0001_create_items.sql to remote..."
wrangler d1 execute edge_d1 --remote --file=./migrations/0001_create_items.sql

echo "Applying migration 0002_create_contacts.sql to remote..."
wrangler d1 execute edge_d1 --remote --file=./migrations/0002_create_contacts.sql

echo "Remote database reset and migrations complete!"