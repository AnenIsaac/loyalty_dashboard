-- Add 'pending' status to reward_codes table if it doesn't exist
-- This allows us to mark reward codes as 'pending' during SMS sending process

-- Check if the status column is an enum and add 'pending' if needed
-- If it's a text column, this will have no effect
DO $$
BEGIN
    -- Try to add 'pending' to the enum type if it exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_code_status') THEN
        BEGIN
            ALTER TYPE reward_code_status ADD VALUE IF NOT EXISTS 'pending';
        EXCEPTION
            WHEN duplicate_object THEN
                -- Value already exists, do nothing
                NULL;
        END;
    END IF;
END$$;

-- Alternative: If status is just a text column with CHECK constraint,
-- we might need to modify the constraint (uncomment if needed)
/*
ALTER TABLE reward_codes 
DROP CONSTRAINT IF EXISTS reward_codes_status_check;

ALTER TABLE reward_codes 
ADD CONSTRAINT reward_codes_status_check 
CHECK (status IN ('unused', 'pending', 'bought', 'redeemed'));
*/ 