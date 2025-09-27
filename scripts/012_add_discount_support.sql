-- Add Discount Support Migration
-- Adds admin_discount_percent column to service_requests table to support full payment discounts

-- Add admin discount percent column to service_requests table
ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS admin_discount_percent DECIMAL(5,2) DEFAULT 10.00 CHECK (admin_discount_percent >= 0 AND admin_discount_percent <= 100);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_service_requests_discount ON service_requests(admin_discount_percent);

-- Add comment for documentation
COMMENT ON COLUMN service_requests.admin_discount_percent IS 'Discount percentage for full payment option (0-100)';

-- Update existing service requests to have default 10% discount
UPDATE service_requests
SET admin_discount_percent = 10.00
WHERE admin_discount_percent IS NULL;