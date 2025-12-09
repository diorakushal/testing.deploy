-- ==============================================================================
-- CONTACTS TABLE MIGRATION
-- Add missing constraints, indexes, and triggers to existing contacts table
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

-- Add ON DELETE CASCADE to foreign keys if they don't have it
DO $$ 
BEGIN
    -- Check and update user_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'contacts_user_id_fkey'
    ) THEN
        -- Drop and recreate with CASCADE
        ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Check and update contact_user_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'contacts_contact_user_id_fkey'
    ) THEN
        -- Drop and recreate with CASCADE
        ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_contact_user_id_fkey;
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_contact_user_id_fkey 
        FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE CASCADE;
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


