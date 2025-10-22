-- Database schema for Cloudflare Email Worker
-- This file can be used to initialize the D1 database manually

-- Mailing lists table
CREATE TABLE IF NOT EXISTS mailing_lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Mailing list emails table
CREATE TABLE IF NOT EXISTS mailing_list_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    FOREIGN KEY (list_id) REFERENCES mailing_lists(id) ON DELETE CASCADE,
    UNIQUE(list_id, email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mailing_list_emails_list_id ON mailing_list_emails(list_id);
CREATE INDEX IF NOT EXISTS idx_mailing_list_emails_email ON mailing_list_emails(email);
