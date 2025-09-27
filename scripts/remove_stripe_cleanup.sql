-- Remove all Stripe references from database
-- WARNING: This will permanently delete Stripe payment data
-- Run this only after confirming you no longer need Stripe integration

BEGIN;

-- 1. Delete any payments that use Stripe payment method
DELETE FROM payments WHERE payment_method = 'stripe';

-- 2. Clear any Stripe payment intent IDs from remaining payments
UPDATE payments
SET stripe_payment_intent_id = NULL
WHERE stripe_payment_intent_id IS NOT NULL;

-- 3. Update any 'nowpayments' payment methods to 'crypto' for consistency
UPDATE payments
SET payment_method = 'crypto'
WHERE payment_method = 'nowpayments';

-- 4. Remove the 'stripe' value from payment_method enum
-- Note: This requires recreating the enum without 'stripe'

-- First, create a new enum without stripe
CREATE TYPE payment_method_new AS ENUM (
    'paystack',
    'crypto',
    'bank_transfer'
);

-- Update the payments table to use the new enum
ALTER TABLE payments
ALTER COLUMN payment_method TYPE payment_method_new
USING payment_method::text::payment_method_new;

-- Drop the old enum and rename the new one
DROP TYPE payment_method;
ALTER TYPE payment_method_new RENAME TO payment_method;

-- 5. Drop the stripe_payment_intent_id column entirely
ALTER TABLE payments DROP COLUMN IF EXISTS stripe_payment_intent_id;

-- 6. Remove any Stripe-related metadata
UPDATE payments
SET metadata = metadata - 'stripe_payment_intent_id' - 'stripe_data' - 'stripe_customer_id'
WHERE metadata ? 'stripe_payment_intent_id'
   OR metadata ? 'stripe_data'
   OR metadata ? 'stripe_customer_id';

COMMIT;

-- Verify the changes
SELECT 'Stripe removal completed successfully' as status;

-- Show remaining payment methods in use
SELECT
    'Remaining payment methods:' as info,
    payment_method,
    COUNT(*) as count
FROM payments
GROUP BY payment_method
ORDER BY count DESC;