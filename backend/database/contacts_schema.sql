-- ==============================================================================
-- CONTACTS TABLE
-- Stores user contacts (one-way, private address book)
-- Allows users to add other Xelli users as contacts with optional nicknames
-- ==============================================================================

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(100), -- Optional nickname (e.g., "Rahul – rent", "Mom")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate contacts
    CONSTRAINT unique_contact UNIQUE (user_id, contact_user_id),
    
    -- Prevent users from adding themselves as contacts
    CONSTRAINT no_self_contact CHECK (user_id != contact_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON contacts(contact_user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();




