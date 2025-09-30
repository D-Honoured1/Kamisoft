-- Fix Payment Audit Foreign Key to CASCADE on Delete
-- This allows payments to be deleted and automatically removes their audit logs

-- Drop the existing foreign key constraint
ALTER TABLE payment_audit_log
DROP CONSTRAINT IF EXISTS payment_audit_log_payment_id_fkey;

-- Recreate the constraint with ON DELETE CASCADE
ALTER TABLE payment_audit_log
ADD CONSTRAINT payment_audit_log_payment_id_fkey
FOREIGN KEY (payment_id)
REFERENCES payments(id)
ON DELETE CASCADE;

-- Verify the constraint
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    confdeltype AS on_delete_action,
    CASE confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
    END AS on_delete_action_name
FROM pg_constraint
WHERE conname = 'payment_audit_log_payment_id_fkey';

-- Add helpful comment
COMMENT ON CONSTRAINT payment_audit_log_payment_id_fkey ON payment_audit_log IS
'Foreign key with CASCADE delete - audit logs are automatically removed when payment is deleted';
