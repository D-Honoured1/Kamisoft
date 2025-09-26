-- Add nowpayments to payment_method enum
-- This fixes the error: invalid input value for enum payment_method: "nowpayments"

-- Add 'nowpayments' to the existing payment_method enum
ALTER TYPE payment_method ADD VALUE 'nowpayments';