-- ==============================================================================
-- COMPLETE DATABASE OPTIMIZATIONS
-- Add all missing indexes, constraints, and optimizations
-- Safe to run multiple times (idempotent)
-- ==============================================================================

-- ==============================================================================
-- CONTACTS TABLE OPTIMIZATIONS
-- ==============================================================================

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_contact'
    ) THEN
        ALTER TABLE contacts 
        ADD CONSTRAINT unique_contact UNIQUE (user_id, contact_user_id);
    END IF;
END $$;

-- Add check constraint to prevent self-contacts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'no_self_contact'
    ) THEN
        ALTER TABLE contacts 
        ADD CONSTRAINT no_self_contact CHECK (user_id != contact_user_id);
    END IF;
END $$;

-- Add ON DELETE CASCADE to foreign keys
DO $$ 
BEGIN
    -- Update user_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'contacts_user_id_fkey'
    ) THEN
        ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Update contact_user_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'contacts_contact_user_id_fkey'
    ) THEN
        ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_contact_user_id_fkey;
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_contact_user_id_fkey 
        FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON contacts(contact_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_nickname ON contacts(nickname) WHERE nickname IS NOT NULL;

-- Add updated_at trigger for contacts
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contacts_updated_at ON contacts;
CREATE TRIGGER trigger_update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- ==============================================================================
-- PAYMENT_REQUESTS TABLE OPTIMIZATIONS
-- ==============================================================================

-- Add ON DELETE CASCADE to foreign keys if they don't have it
DO $$ 
BEGIN
    -- Update requester_user_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payment_requests_requester_user_id_fkey'
    ) THEN
        ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS payment_requests_requester_user_id_fkey;
        ALTER TABLE payment_requests 
        ADD CONSTRAINT payment_requests_requester_user_id_fkey 
        FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Update recipient_user_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payment_requests_recipient_user_id_fkey'
    ) THEN
        ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS payment_requests_recipient_user_id_fkey;
        ALTER TABLE payment_requests 
        ADD CONSTRAINT payment_requests_recipient_user_id_fkey 
        FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for payment_requests
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester_user_id ON payment_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_recipient_user_id ON payment_requests(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester_address ON payment_requests(requester_address);

-- ==============================================================================
-- PAYMENT_SENDS TABLE OPTIMIZATIONS
-- ==============================================================================

-- Add ON DELETE CASCADE to foreign keys if they don't have it
DO $$ 
BEGIN
    -- Update sender_user_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payment_sends_sender_user_id_fkey'
    ) THEN
        ALTER TABLE payment_sends DROP CONSTRAINT IF EXISTS payment_sends_sender_user_id_fkey;
        ALTER TABLE payment_sends 
        ADD CONSTRAINT payment_sends_sender_user_id_fkey 
        FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Update recipient_user_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payment_sends_recipient_user_id_fkey'
    ) THEN
        ALTER TABLE payment_sends DROP CONSTRAINT IF EXISTS payment_sends_recipient_user_id_fkey;
        ALTER TABLE payment_sends 
        ADD CONSTRAINT payment_sends_recipient_user_id_fkey 
        FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for payment_sends
CREATE INDEX IF NOT EXISTS idx_payment_sends_sender_user_id ON payment_sends(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sends_recipient_user_id ON payment_sends(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sends_status ON payment_sends(status);
CREATE INDEX IF NOT EXISTS idx_payment_sends_created_at ON payment_sends(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_sends_sender_address ON payment_sends(sender_address);
CREATE INDEX IF NOT EXISTS idx_payment_sends_recipient_address ON payment_sends(recipient_address);

-- ==============================================================================
-- PREFERRED_WALLETS TABLE OPTIMIZATIONS
-- ==============================================================================

-- Add ON DELETE CASCADE to foreign key if it doesn't have it
DO $$ 
BEGIN
    -- Update user_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'preferred_wallets_user_id_fkey'
    ) THEN
        ALTER TABLE preferred_wallets DROP CONSTRAINT IF EXISTS preferred_wallets_user_id_fkey;
        ALTER TABLE preferred_wallets 
        ADD CONSTRAINT preferred_wallets_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for preferred_wallets (for faster lookups)
CREATE INDEX IF NOT EXISTS idx_preferred_wallets_user ON preferred_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_preferred_wallets_chain ON preferred_wallets(chain_id);
CREATE INDEX IF NOT EXISTS idx_preferred_wallets_user_chain ON preferred_wallets(user_id, chain_id);

-- Add updated_at trigger for preferred_wallets
CREATE OR REPLACE FUNCTION update_preferred_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_preferred_wallets_updated_at ON preferred_wallets;
CREATE TRIGGER trigger_update_preferred_wallets_updated_at
    BEFORE UPDATE ON preferred_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_preferred_wallets_updated_at();

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Database optimizations completed successfully!';
    RAISE NOTICE 'Contacts unique constraint: %', EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_contact');
    RAISE NOTICE 'Contacts check constraint: %', EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_self_contact');
END $$;

