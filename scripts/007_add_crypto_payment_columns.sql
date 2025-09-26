-- Add NOWPayments (Crypto) Payment Columns Migration
-- Adds columns needed for NOWPayments cryptocurrency payment functionality

-- Add NOWPayments crypto payment columns to payments table
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS crypto_address VARCHAR(255),
    ADD COLUMN IF NOT EXISTS crypto_network VARCHAR(50),
    ADD COLUMN IF NOT EXISTS crypto_amount DECIMAL(18,8),
    ADD COLUMN IF NOT EXISTS crypto_symbol VARCHAR(10),
    ADD COLUMN IF NOT EXISTS crypto_transaction_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS crypto_confirmations INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS crypto_block_height BIGINT,
    ADD COLUMN IF NOT EXISTS crypto_explorer_url TEXT;

-- Create indexes for better performance on crypto columns
CREATE INDEX IF NOT EXISTS idx_payments_crypto_address ON payments(crypto_address);
CREATE INDEX IF NOT EXISTS idx_payments_crypto_network ON payments(crypto_network);
CREATE INDEX IF NOT EXISTS idx_payments_crypto_transaction_hash ON payments(crypto_transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payments_crypto_symbol ON payments(crypto_symbol);

-- Add unique constraint on crypto transaction hash to prevent duplicates
DO $$ BEGIN
    ALTER TABLE payments ADD CONSTRAINT unique_crypto_transaction_hash UNIQUE (crypto_transaction_hash);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN payments.crypto_address IS 'Cryptocurrency address where payment should be sent';
COMMENT ON COLUMN payments.crypto_network IS 'Cryptocurrency network (e.g., TRC20, ERC20, Bitcoin)';
COMMENT ON COLUMN payments.crypto_amount IS 'Amount in cryptocurrency units (e.g., BTC, USDT)';
COMMENT ON COLUMN payments.crypto_symbol IS 'Cryptocurrency symbol (e.g., BTC, USDT, ETH)';
COMMENT ON COLUMN payments.crypto_transaction_hash IS 'Blockchain transaction hash submitted by customer';
COMMENT ON COLUMN payments.crypto_confirmations IS 'Number of network confirmations received';
COMMENT ON COLUMN payments.crypto_block_height IS 'Block height when transaction was confirmed';
COMMENT ON COLUMN payments.crypto_explorer_url IS 'Direct link to view transaction on blockchain explorer';