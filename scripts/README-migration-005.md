# Migration 005: Add Payment Deletion Audit Columns

## Problem
The payment deletion API is failing with the error:
```
Could not find the 'deleted_at' column of 'payments' in the schema cache
```

This happens because the API tries to update audit columns that don't exist in the payments table.

## Solution
Run the migration script `005_add_payment_deletion_audit_columns.sql` to add the missing columns.

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `005_add_payment_deletion_audit_columns.sql`
4. Click "Run" to execute the migration

### Option 2: Command Line (if Supabase CLI is available)
```bash
# If you have Supabase CLI configured
supabase db push
```

### Option 3: Direct SQL Execution
If you have direct database access, you can run the SQL commands directly:

```sql
-- Update the payment_status enum to include 'deleted' status
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'payment_status' AND e.enumlabel = 'deleted'
    ) THEN
        ALTER TYPE payment_status ADD VALUE 'deleted';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add audit columns to payments table
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON payments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_payments_deleted_by ON payments(deleted_by);
```

## Verification
After running the migration, verify that:
1. The `payments` table has the new columns: `deleted_at`, `deleted_by`, `admin_notes`
2. The `payment_status` enum includes the 'deleted' value
3. The payment deletion API no longer throws column errors

## What This Fixes
- ✅ Payment deletion API will work without column errors
- ✅ Audit trail for deleted payments is maintained
- ✅ Admin can track who deleted payments and when
- ✅ Soft delete preserves payment history