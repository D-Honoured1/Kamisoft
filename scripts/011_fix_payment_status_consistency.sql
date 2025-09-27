-- Fix Payment Status Consistency Migration
-- Updates database triggers and queries to handle both 'completed' and 'confirmed' payment statuses

-- Update the payment totals function to handle both 'completed' and 'confirmed' statuses
CREATE OR REPLACE FUNCTION update_service_request_payment_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the service request totals when a payment status changes
    IF (TG_OP = 'UPDATE' AND OLD.payment_status != NEW.payment_status) OR TG_OP = 'INSERT' THEN
        UPDATE service_requests
        SET
            total_paid = COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE request_id = NEW.request_id
                AND payment_status IN ('completed', 'confirmed')
            ), 0),
            balance_due = GREATEST(0, COALESCE(estimated_cost, 0) - COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE request_id = NEW.request_id
                AND payment_status IN ('completed', 'confirmed')
            ), 0)),
            partial_payment_status = CASE
                WHEN payment_plan = 'split' THEN
                    CASE
                        WHEN (SELECT COUNT(*) FROM payments WHERE request_id = NEW.request_id AND payment_status IN ('completed', 'confirmed')) = 0 THEN 'none'
                        WHEN (SELECT COUNT(*) FROM payments WHERE request_id = NEW.request_id AND payment_status IN ('completed', 'confirmed')) = 1 THEN 'first_paid'
                        WHEN (SELECT COUNT(*) FROM payments WHERE request_id = NEW.request_id AND payment_status IN ('completed', 'confirmed')) >= 2 THEN 'completed'
                        ELSE 'none'
                    END
                ELSE 'none'
            END,
            updated_at = NOW()
        WHERE id = NEW.request_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the status consistency fix
COMMENT ON FUNCTION update_service_request_payment_totals() IS 'Updated to handle both completed and confirmed payment statuses for split payment tracking';

-- Refresh existing service request totals with the new logic
DO $$
DECLARE
    request_record RECORD;
    payment_id UUID;
BEGIN
    FOR request_record IN SELECT id FROM service_requests WHERE payment_plan = 'split' LOOP
        -- Get one payment to update and trigger the function
        SELECT id INTO payment_id
        FROM payments
        WHERE request_id = request_record.id
        AND payment_status IN ('completed', 'confirmed')
        LIMIT 1;

        -- Update if a payment exists
        IF payment_id IS NOT NULL THEN
            UPDATE payments
            SET updated_at = NOW()
            WHERE id = payment_id;
        END IF;
    END LOOP;
END $$;

-- Add index for the new query pattern
CREATE INDEX IF NOT EXISTS idx_payments_status_completed_confirmed
ON payments(request_id, payment_status)
WHERE payment_status IN ('completed', 'confirmed');

-- Add comment documenting the status standardization
COMMENT ON INDEX idx_payments_status_completed_confirmed IS 'Optimizes queries for both completed and confirmed payment statuses in split payment calculations';