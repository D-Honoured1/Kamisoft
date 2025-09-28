-- Add Remaining Balance Link Fields Migration
-- Adds fields to track remaining balance payment links

-- Add remaining balance link tracking columns to service_requests table
ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS payment_link_expiry TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS remaining_balance_link_active BOOLEAN DEFAULT FALSE;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_service_requests_payment_link_expiry ON service_requests(payment_link_expiry);
CREATE INDEX IF NOT EXISTS idx_service_requests_remaining_balance_link_active ON service_requests(remaining_balance_link_active);

-- Add comments for documentation
COMMENT ON COLUMN service_requests.payment_link_expiry IS 'Expiry timestamp for payment links (both initial and remaining balance)';
COMMENT ON COLUMN service_requests.remaining_balance_link_active IS 'Whether a remaining balance payment link is currently active';

-- Function to clean up expired payment links (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_payment_links()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE service_requests
    SET
        payment_link_expiry = NULL,
        remaining_balance_link_active = FALSE
    WHERE payment_link_expiry IS NOT NULL
    AND payment_link_expiry < NOW();

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the cleanup function
COMMENT ON FUNCTION cleanup_expired_payment_links() IS 'Cleans up expired payment links and resets their active status';