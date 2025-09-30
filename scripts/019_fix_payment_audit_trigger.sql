-- Fix Payment Audit Trigger to Handle Deletions
-- The issue: When deleting a payment, the trigger tries to insert into payment_audit_log
-- but the foreign key constraint fails because the payment is being deleted

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_payment_audit_log ON payments;
DROP FUNCTION IF EXISTS log_payment_change();

-- Recreate the function with proper handling for deletions
CREATE OR REPLACE FUNCTION log_payment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO payment_audit_log (payment_id, action_type, new_values, notes)
        VALUES (
            NEW.id,
            'created',
            row_to_json(NEW),
            'Payment record created'
        );
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log significant changes
        IF (OLD.payment_status != NEW.payment_status OR
            OLD.payment_method != NEW.payment_method OR
            OLD.amount != NEW.amount) THEN

            INSERT INTO payment_audit_log (payment_id, action_type, old_values, new_values, notes)
            VALUES (
                NEW.id,
                CASE
                    WHEN OLD.payment_status != NEW.payment_status THEN 'status_changed'
                    WHEN OLD.payment_method != NEW.payment_method THEN 'method_changed'
                    WHEN OLD.amount != NEW.amount THEN 'amount_changed'
                    ELSE 'updated'
                END,
                row_to_json(OLD),
                row_to_json(NEW),
                format('Status: %s -> %s', OLD.payment_status, NEW.payment_status)
            );
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        -- For deletions, we can't maintain the foreign key reference
        -- So we'll just log to console or skip audit logging for hard deletes
        -- Soft deletes (status = 'deleted') are handled by UPDATE above
        RAISE NOTICE 'Payment % deleted from database', OLD.id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
-- Use AFTER for INSERT and UPDATE, skip DELETE entirely
CREATE TRIGGER trigger_payment_audit_log
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_payment_change();

-- Create a separate BEFORE DELETE trigger for logging
CREATE TRIGGER trigger_payment_audit_delete
    BEFORE DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_payment_change();

-- Alternative: Make payment_audit_log.payment_id nullable to allow orphaned logs
-- Uncomment if you want to keep audit logs even after payment deletion:
-- ALTER TABLE payment_audit_log ALTER COLUMN payment_id DROP NOT NULL;

COMMENT ON FUNCTION log_payment_change() IS
'Audit logging for payment changes. Skips foreign key insertion on hard deletes to avoid constraint violations.';
