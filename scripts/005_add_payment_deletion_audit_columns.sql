-- Add Payment Deletion Audit Columns Migration
-- Adds audit trail columns for payment deletion functionality

-- First, update the payment_status enum to include 'deleted' status
DO $$ BEGIN
    -- Add 'deleted' to payment_status enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'payment_status' AND e.enumlabel = 'deleted'
    ) THEN
        ALTER TYPE payment_status ADD VALUE 'deleted';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add audit columns to payments table for deletion tracking
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create indexes for better performance on new audit columns
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON payments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_payments_deleted_by ON payments(deleted_by);

-- Add comments for documentation
COMMENT ON COLUMN payments.deleted_at IS 'Timestamp when payment was soft-deleted by an admin';
COMMENT ON COLUMN payments.deleted_by IS 'Email/identifier of admin who deleted the payment';
COMMENT ON COLUMN payments.admin_notes IS 'Admin notes and audit trail for payment operations';

-- Update the trigger to handle the new columns
-- Note: The existing update_updated_at_column trigger will still work for updated_at