-- Fix final_cost column reference in payment tracking trigger
-- This addresses the error: column "final_cost" does not exist

-- Drop and recreate the trigger function with corrected column reference
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
                AND payment_status = 'completed'
            ), 0),
            balance_due = GREATEST(0, COALESCE(estimated_cost, 0) - COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE request_id = NEW.request_id
                AND payment_status = 'completed'
            ), 0)),
            partial_payment_status = CASE
                WHEN payment_plan = 'split' THEN
                    CASE
                        WHEN (SELECT COUNT(*) FROM payments WHERE request_id = NEW.request_id AND payment_status = 'completed') = 0 THEN 'none'
                        WHEN (SELECT COUNT(*) FROM payments WHERE request_id = NEW.request_id AND payment_status = 'completed') = 1 THEN 'first_paid'
                        WHEN (SELECT COUNT(*) FROM payments WHERE request_id = NEW.request_id AND payment_status = 'completed') >= 2 THEN 'completed'
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

-- The trigger itself doesn't need to be recreated as it points to the function
-- But recreate it to be safe
DROP TRIGGER IF EXISTS trigger_update_payment_totals ON payments;
CREATE TRIGGER trigger_update_payment_totals
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_service_request_payment_totals();