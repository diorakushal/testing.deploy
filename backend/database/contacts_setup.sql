-- ==============================================================================
-- CONTACTS TABLE SETUP
-- This script will create the contacts table if it doesn't exist,
-- or add missing constraints/indexes if it does exist.
-- Safe to run multiple times.
-- ==============================================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    contact_user_id UUID NOT NULL,
    nickname VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys if they don't exist
DO $$ 
BEGIN
    -- Add user_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'contacts_user_id_fkey'
        AND table_name = 'contacts'
    ) THEN
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    ELSE
        -- Update existing foreign key to have CASCADE if it doesn't
        ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add contact_user_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'contacts_contact_user_id_fkey'
        AND table_name = 'contacts'
    ) THEN
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_contact_user_id_fkey 
        FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE CASCADE;
    ELSE
        -- Update existing foreign key to have CASCADE if it doesn't
        ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_contact_user_id_fkey;
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_contact_user_id_fkey 
        FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON contacts(contact_user_id);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_contacts_updated_at ON contacts;
CREATE TRIGGER trigger_update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Contacts table setup completed successfully!';
    RAISE NOTICE 'Table exists: %', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts');
    RAISE NOTICE 'Unique constraint exists: %', EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_contact');
    RAISE NOTICE 'Check constraint exists: %', EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_self_contact');
END $$;




