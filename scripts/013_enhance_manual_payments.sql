-- Enhance Manual Payments Support Migration
-- Adds better support for manual payment tracking and verification

-- Add manual payment tracking columns to payments table
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS manual_entry BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS verified_by_admin_id UUID,
    ADD COLUMN IF NOT EXISTS payment_source VARCHAR(50) DEFAULT 'online' CHECK (payment_source IN ('online', 'manual', 'bulk_import'));

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_payments_manual_entry ON payments(manual_entry);
CREATE INDEX IF NOT EXISTS idx_payments_admin_verified ON payments(admin_verified);
CREATE INDEX IF NOT EXISTS idx_payments_payment_source ON payments(payment_source);
CREATE INDEX IF NOT EXISTS idx_payments_verification_date ON payments(verification_date);

-- Add comments for documentation
COMMENT ON COLUMN payments.manual_entry IS 'Whether this payment was manually entered by an admin';
COMMENT ON COLUMN payments.admin_verified IS 'Whether this payment has been verified by an administrator';
COMMENT ON COLUMN payments.verification_date IS 'When the payment was verified by an admin';
COMMENT ON COLUMN payments.verified_by_admin_id IS 'ID of the admin who verified this payment';
COMMENT ON COLUMN payments.payment_source IS 'Source of the payment entry: online, manual, or bulk_import';

-- Create audit table for payment changes
CREATE TABLE IF NOT EXISTS payment_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id),
    admin_id UUID, -- Would reference staff profiles if available
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('created', 'updated', 'verified', 'deleted', 'status_changed')),
    old_values JSONB,
    new_values JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for audit table
CREATE INDEX IF NOT EXISTS idx_payment_audit_payment_id ON payment_audit_log(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_admin_id ON payment_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_action_type ON payment_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_payment_audit_created_at ON payment_audit_log(created_at);

-- Function to log payment changes
CREATE OR REPLACE FUNCTION log_payment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO payment_audit_log (payment_id, action_type, new_values, notes)
        VALUES (
            NEW.id,
            'created',
            row_to_json(NEW),
            CASE
                WHEN NEW.manual_entry = TRUE THEN 'Manual payment entry'
                ELSE 'Automated payment creation'
            END
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log significant changes
        IF (OLD.payment_status != NEW.payment_status OR
            OLD.admin_verified != NEW.admin_verified OR
            OLD.amount != NEW.amount) THEN

            INSERT INTO payment_audit_log (payment_id, action_type, old_values, new_values, notes)
            VALUES (
                NEW.id,
                CASE
                    WHEN OLD.payment_status != NEW.payment_status THEN 'status_changed'
                    WHEN OLD.admin_verified != NEW.admin_verified THEN 'verified'
                    ELSE 'updated'
                END,
                row_to_json(OLD),
                row_to_json(NEW),
                'Payment record updated'
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO payment_audit_log (payment_id, action_type, old_values, notes)
        VALUES (
            OLD.id,
            'deleted',
            row_to_json(OLD),
            'Payment record deleted'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment audit logging
DROP TRIGGER IF EXISTS trigger_payment_audit_log ON payments;
CREATE TRIGGER trigger_payment_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_payment_change();

-- Function to get manual payment statistics
CREATE OR REPLACE FUNCTION get_manual_payment_stats(request_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    total_manual_payments INTEGER,
    total_manual_amount DECIMAL(10,2),
    verified_manual_payments INTEGER,
    pending_verification INTEGER,
    most_recent_manual_payment TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_manual_payments,
        COALESCE(SUM(amount), 0)::DECIMAL(10,2) as total_manual_amount,
        COUNT(*) FILTER (WHERE admin_verified = TRUE)::INTEGER as verified_manual_payments,
        COUNT(*) FILTER (WHERE admin_verified = FALSE)::INTEGER as pending_verification,
        MAX(created_at) as most_recent_manual_payment
    FROM payments
    WHERE manual_entry = TRUE
    AND (request_id_param IS NULL OR request_id = request_id_param);
END;
$$ LANGUAGE plpgsql;

-- Function to validate manual payment entries
CREATE OR REPLACE FUNCTION validate_manual_payment(
    request_id_param UUID,
    amount_param DECIMAL(10,2),
    payment_method_param VARCHAR(50)
)
RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT,
    warnings TEXT[]
) AS $$
DECLARE
    service_request RECORD;
    existing_payments DECIMAL(10,2);
    duplicate_count INTEGER;
    warnings_array TEXT[] := '{}';
BEGIN
    -- Get service request details
    SELECT * INTO service_request
    FROM service_requests
    WHERE id = request_id_param;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Service request not found', warnings_array;
        RETURN;
    END IF;

    -- Check if amount is valid
    IF amount_param <= 0 THEN
        RETURN QUERY SELECT FALSE, 'Payment amount must be greater than 0', warnings_array;
        RETURN;
    END IF;

    -- Calculate existing payments
    SELECT COALESCE(SUM(amount), 0) INTO existing_payments
    FROM payments
    WHERE request_id = request_id_param
    AND payment_status IN ('completed', 'confirmed');

    -- Check if payment would exceed total cost
    IF (existing_payments + amount_param) > service_request.estimated_cost THEN
        warnings_array := array_append(warnings_array,
            'Payment amount exceeds remaining balance. Consider if this is intentional.');
    END IF;

    -- Check for potential duplicates (same amount and method within 24 hours)
    SELECT COUNT(*) INTO duplicate_count
    FROM payments
    WHERE request_id = request_id_param
    AND amount = amount_param
    AND payment_method = payment_method_param
    AND created_at > NOW() - INTERVAL '24 hours';

    IF duplicate_count > 0 THEN
        warnings_array := array_append(warnings_array,
            'Similar payment found within last 24 hours. Please verify this is not a duplicate.');
    END IF;

    -- All validations passed
    RETURN QUERY SELECT TRUE, NULL::TEXT, warnings_array;
END;
$$ LANGUAGE plpgsql;

-- Add comments for the new functions
COMMENT ON FUNCTION get_manual_payment_stats(UUID) IS 'Get statistics about manual payments for a specific request or all requests';
COMMENT ON FUNCTION validate_manual_payment(UUID, DECIMAL, VARCHAR) IS 'Validate a manual payment entry before creation';

-- Update existing manual payments to set the new flags
UPDATE payments
SET
    manual_entry = TRUE,
    admin_verified = TRUE,
    payment_source = 'manual'
WHERE metadata::text LIKE '%"manualEntry":true%';

-- Create view for easy manual payment reporting
CREATE OR REPLACE VIEW manual_payments_summary AS
SELECT
    p.id,
    p.request_id,
    p.amount,
    p.payment_method,
    p.payment_status,
    p.admin_verified,
    p.verification_date,
    p.created_at as payment_date,
    sr.title as service_title,
    c.name as client_name,
    c.email as client_email,
    (p.metadata::json->>'reference') as payment_reference,
    (p.metadata::json->>'bankName') as bank_name,
    (p.metadata::json->>'notes') as payment_notes
FROM payments p
JOIN service_requests sr ON p.request_id = sr.id
LEFT JOIN clients c ON sr.client_id = c.id
WHERE p.manual_entry = TRUE
ORDER BY p.created_at DESC;

-- Add comment for the view
COMMENT ON VIEW manual_payments_summary IS 'Summary view of all manual payments with related service request and client information';