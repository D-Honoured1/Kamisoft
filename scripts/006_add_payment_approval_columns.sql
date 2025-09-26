-- Add Payment Approval Columns Migration
-- Adds columns needed for payment approval functionality

-- Add payment approval columns to payments table
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS confirmed_by VARCHAR(255);

-- Add service request payment tracking
ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Update payment_status enum to include 'confirmed' and 'success'
DO $$ BEGIN
    -- Add 'confirmed' status
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'payment_status' AND e.enumlabel = 'confirmed'
    ) THEN
        ALTER TYPE payment_status ADD VALUE 'confirmed';
    END IF;

    -- Add 'success' status
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'payment_status' AND e.enumlabel = 'success'
    ) THEN
        ALTER TYPE payment_status ADD VALUE 'success';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update request_status enum to include payment statuses
DO $$ BEGIN
    -- Add 'paid' status
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'request_status' AND e.enumlabel = 'paid'
    ) THEN
        ALTER TYPE request_status ADD VALUE 'paid';
    END IF;

    -- Add 'partially_paid' status
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'request_status' AND e.enumlabel = 'partially_paid'
    ) THEN
        ALTER TYPE request_status ADD VALUE 'partially_paid';
    END IF;

    -- Add 'approved' status
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'request_status' AND e.enumlabel = 'approved'
    ) THEN
        ALTER TYPE request_status ADD VALUE 'approved';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_confirmed_at ON payments(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_payments_confirmed_by ON payments(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_service_requests_payment_confirmed_at ON service_requests(payment_confirmed_at);

-- Add comments for documentation
COMMENT ON COLUMN payments.confirmed_at IS 'Timestamp when payment was confirmed by an admin';
COMMENT ON COLUMN payments.confirmed_by IS 'Email/identifier of admin who confirmed the payment';
COMMENT ON COLUMN service_requests.payment_confirmed_at IS 'Timestamp when payment was confirmed for this request';