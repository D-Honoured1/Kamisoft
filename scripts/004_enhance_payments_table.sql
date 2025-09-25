-- Enhanced Payments Table Migration
-- Adds missing columns for improved payment processing and tracking

-- Add payment_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE payment_type AS ENUM ('split', 'full');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to payments table
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_type payment_type,
    ADD COLUMN IF NOT EXISTS crypto_address VARCHAR(500),
    ADD COLUMN IF NOT EXISTS crypto_network VARCHAR(50),
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS initialized_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_payments_correlation_id ON payments(correlation_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_reference ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_crypto_address ON payments(crypto_address);
CREATE INDEX IF NOT EXISTS idx_payments_processing_started_at ON payments(processing_started_at);
CREATE INDEX IF NOT EXISTS idx_payments_metadata ON payments USING GIN(metadata);

-- Add unique constraint on payment_reference to prevent duplicates
DO $$ BEGIN
    ALTER TABLE payments ADD CONSTRAINT unique_payment_reference UNIQUE (payment_reference);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing records to have default payment_type if needed
UPDATE payments
SET payment_type = 'full'
WHERE payment_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN payments.correlation_id IS 'Unique identifier for tracking payment requests across logs';
COMMENT ON COLUMN payments.payment_reference IS 'Unique payment reference for deduplication and tracking';
COMMENT ON COLUMN payments.payment_type IS 'Type of payment: split (50% upfront) or full (with discount)';
COMMENT ON COLUMN payments.crypto_address IS 'Cryptocurrency payment address when using crypto payment method';
COMMENT ON COLUMN payments.crypto_network IS 'Cryptocurrency network used (e.g., TRC20, ERC20)';
COMMENT ON COLUMN payments.error_message IS 'Detailed error message when payment fails';
COMMENT ON COLUMN payments.metadata IS 'Flexible JSON storage for additional payment-related data';
COMMENT ON COLUMN payments.processing_started_at IS 'Timestamp when payment processing began';
COMMENT ON COLUMN payments.initialized_at IS 'Timestamp when payment was successfully initialized';
COMMENT ON COLUMN payments.failed_at IS 'Timestamp when payment failed';