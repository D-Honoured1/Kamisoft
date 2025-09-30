-- Fix archived_by to allow NULL values
-- This allows archiving even when admin user ID is not available

-- Make archived_by nullable (drop the NOT NULL constraint if it exists)
-- Note: The original migration didn't have NOT NULL, but this ensures it
ALTER TABLE clients
  ALTER COLUMN archived_by DROP NOT NULL;

-- Update the archive_client function to handle NULL admin_id
CREATE OR REPLACE FUNCTION archive_client(
    client_id UUID,
    admin_id UUID DEFAULT NULL,  -- Make it optional with DEFAULT NULL
    reason TEXT DEFAULT 'Archived by admin'
)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Check if client exists and is not already archived
    IF NOT EXISTS (
        SELECT 1 FROM clients
        WHERE id = client_id AND archived_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Client not found or already archived';
    END IF;

    -- Archive the client (archived_by can be NULL)
    UPDATE clients
    SET
        archived_at = NOW(),
        archived_by = admin_id,  -- Can be NULL
        archive_reason = reason,
        updated_at = NOW()
    WHERE id = client_id AND archived_at IS NULL;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the restore_client function to handle NULL admin_id
CREATE OR REPLACE FUNCTION restore_client(
    client_id UUID,
    admin_id UUID DEFAULT NULL  -- Make it optional with DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Check if client exists and is archived
    IF NOT EXISTS (
        SELECT 1 FROM clients
        WHERE id = client_id AND archived_at IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Client not found or not archived';
    END IF;

    -- Restore the client
    UPDATE clients
    SET
        archived_at = NULL,
        archived_by = NULL,
        archive_reason = NULL,
        updated_at = NOW()
    WHERE id = client_id AND archived_at IS NOT NULL;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION archive_client IS 'Soft delete a client by archiving them. admin_id is optional and can be NULL.';
COMMENT ON FUNCTION restore_client IS 'Restore an archived client. admin_id is optional and can be NULL.';