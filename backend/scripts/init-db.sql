-- Initialize MDReader Database
-- This script runs automatically when PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE mdreader_dev TO mdreader;

-- Create schema version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Log initialization
INSERT INTO schema_migrations (version, description) 
VALUES ('init', 'Database initialized')
ON CONFLICT (version) DO NOTHING;

