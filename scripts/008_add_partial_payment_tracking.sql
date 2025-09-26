-- Add Partial Payment Tracking Migration
-- Adds columns needed to track partial/split payments and balances

-- Add partial payment tracking columns to service_requests table
ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS payment_plan VARCHAR(20) DEFAULT 'full' CHECK (payment_plan IN ('full', 'split')),
    ADD COLUMN IF NOT EXISTS partial_payment_status VARCHAR(20) DEFAULT 'none' CHECK (partial_payment_status IN ('none', 'first_paid', 'completed'));

-- Add payment type and sequence tracking to payments table
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'full' CHECK (payment_type IN ('full', 'split')),
    ADD COLUMN IF NOT EXISTS payment_sequence INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_partial_payment BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS total_amount_due DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_service_requests_payment_plan ON service_requests(payment_plan);
CREATE INDEX IF NOT EXISTS idx_service_requests_partial_payment_status ON service_requests(partial_payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_is_partial ON payments(is_partial_payment);
CREATE INDEX IF NOT EXISTS idx_payments_sequence ON payments(payment_sequence);

-- Add comments for documentation
COMMENT ON COLUMN service_requests.total_paid IS 'Total amount paid so far across all payments';
COMMENT ON COLUMN service_requests.balance_due IS 'Remaining balance to be paid';
COMMENT ON COLUMN service_requests.payment_plan IS 'Payment plan type: full or split (50/50)';
COMMENT ON COLUMN service_requests.partial_payment_status IS 'Track partial payment progress: none, first_paid, completed';
COMMENT ON COLUMN payments.payment_type IS 'Type of payment: full or split payment';
COMMENT ON COLUMN payments.payment_sequence IS 'Sequence number for split payments (1 for first half, 2 for second half)';
COMMENT ON COLUMN payments.is_partial_payment IS 'Whether this is a partial payment (split payment)';
COMMENT ON COLUMN payments.total_amount_due IS 'Total amount due for the service request';
COMMENT ON COLUMN payments.admin_notes IS 'Admin notes about the payment';

-- Function to update service request payment totals
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

-- Create trigger to automatically update totals
DROP TRIGGER IF EXISTS trigger_update_payment_totals ON payments;
CREATE TRIGGER trigger_update_payment_totals
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_service_request_payment_totals();