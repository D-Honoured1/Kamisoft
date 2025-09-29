-- Add soft delete functionality to clients table
-- This allows "deleting" clients while preserving data integrity and audit trails

-- Add soft delete columns to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Create index for better performance when filtering archived clients
CREATE INDEX IF NOT EXISTS idx_clients_archived_at ON clients(archived_at);

-- Create a view for active (non-archived) clients
CREATE OR REPLACE VIEW active_clients AS
SELECT *
FROM clients
WHERE archived_at IS NULL;

-- Create a view for archived clients
CREATE OR REPLACE VIEW archived_clients AS
SELECT *
FROM clients
WHERE archived_at IS NOT NULL;

-- Function to soft delete (archive) a client
CREATE OR REPLACE FUNCTION archive_client(
    client_id UUID,
    admin_id UUID,
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

    -- Archive the client
    UPDATE clients
    SET
        archived_at = NOW(),
        archived_by = admin_id,
        archive_reason = reason,
        updated_at = NOW()
    WHERE id = client_id AND archived_at IS NULL;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore (unarchive) a client
CREATE OR REPLACE FUNCTION restore_client(
    client_id UUID,
    admin_id UUID
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

-- Update RLS policies to handle archived clients
-- Drop existing client policy and recreate with archive support
DROP POLICY IF EXISTS "clients_admin_all" ON clients;

-- Admin can see all clients (including archived)
CREATE POLICY "clients_admin_all" ON clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Create separate policies for the views
-- Grant access to active_clients view
GRANT SELECT ON active_clients TO authenticated;
GRANT SELECT ON archived_clients TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN clients.archived_at IS 'Timestamp when client was archived (soft deleted)';
COMMENT ON COLUMN clients.archived_by IS 'Admin user who archived this client';
COMMENT ON COLUMN clients.archive_reason IS 'Reason for archiving this client';
COMMENT ON FUNCTION archive_client IS 'Soft delete a client by archiving them';
COMMENT ON FUNCTION restore_client IS 'Restore an archived client';