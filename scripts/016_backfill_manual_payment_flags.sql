-- Migration 016: Backfill Manual Payment Tracking Flags
-- This script updates existing manual payment records that were created before
-- the manual_entry, payment_source, and admin_verified columns were added

-- Update payments that have manualEntry=true in metadata but don't have the columns set
UPDATE payments
SET
    manual_entry = TRUE,
    admin_verified = TRUE,
    payment_source = 'manual',
    verification_date = CASE
        WHEN payment_status IN ('completed', 'confirmed') THEN confirmed_at
        ELSE NULL
    END,
    updated_at = NOW()
WHERE
    -- Find payments with manualEntry in metadata
    (metadata::jsonb->>'manualEntry' = 'true' OR metadata::text LIKE '%"manualEntry":true%')
    -- But don't have manual_entry flag set
    AND (manual_entry IS NULL OR manual_entry = FALSE);

-- Report on the update
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % manual payment records with proper flags', updated_count;
END $$;

-- Update any payments that were marked as manual in payment_method but aren't flagged
UPDATE payments
SET
    manual_entry = TRUE,
    payment_source = 'manual',
    admin_verified = CASE
        WHEN payment_status IN ('completed', 'confirmed') THEN TRUE
        ELSE FALSE
    END,
    verification_date = CASE
        WHEN payment_status IN ('completed', 'confirmed') THEN confirmed_at
        ELSE NULL
    END,
    updated_at = NOW()
WHERE
    payment_method IN ('bank_transfer', 'cash', 'cheque')
    AND (manual_entry IS NULL OR manual_entry = FALSE)
    AND (metadata::text LIKE '%manualEntry%' OR admin_notes IS NOT NULL);

-- Verify the changes
SELECT
    COUNT(*) as total_manual_payments,
    COUNT(*) FILTER (WHERE admin_verified = TRUE) as verified_count,
    COUNT(*) FILTER (WHERE payment_source = 'manual') as manual_source_count,
    COUNT(*) FILTER (WHERE payment_status = 'completed') as completed_count
FROM payments
WHERE manual_entry = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN payments.manual_entry IS 'Whether this payment was manually entered by an admin (backfilled by migration 016)';
COMMENT ON COLUMN payments.payment_source IS 'Source of the payment entry: online, manual, or bulk_import (backfilled by migration 016)';