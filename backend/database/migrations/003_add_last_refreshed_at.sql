-- Add last_refreshed_at column to platform_handles table
-- This tracks when a user last manually refreshed their data
-- Used to enforce 1-hour cooldown between manual refreshes

ALTER TABLE platform_handles 
ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMP;

-- Set default to NULL for existing rows (never refreshed manually)
UPDATE platform_handles 
SET last_refreshed_at = NULL 
WHERE last_refreshed_at IS NULL;
