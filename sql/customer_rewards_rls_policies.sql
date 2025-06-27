-- RLS Policies for customer_rewards table
-- This allows both dashboard and customer app to work properly

-- First, drop any existing policies
DROP POLICY IF EXISTS "Allow users to claim rewards for themselves" ON "public"."customer_rewards";
DROP POLICY IF EXISTS "Allow users to select their rows" ON "public"."customer_rewards";
DROP POLICY IF EXISTS "Customers can mark their own reward as redeemed" ON "public"."customer_rewards";

-- Enable RLS on the table (if not already enabled)
ALTER TABLE "public"."customer_rewards" ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy: Allow customers to see their own rewards, dashboard users to see rewards for their business
CREATE POLICY "customer_rewards_select_policy" ON "public"."customer_rewards"
FOR SELECT
TO authenticated
USING (
  -- Customer app: customers can see their own rewards
  customer_id = auth.uid()
  OR
  -- Dashboard: business owners can see rewards for their business
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- 2. INSERT Policy: Allow dashboard users to create rewards for customers, customers to claim rewards
CREATE POLICY "customer_rewards_insert_policy" ON "public"."customer_rewards"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Customer app: customers can claim rewards for themselves
  customer_id = auth.uid()
  OR
  -- Dashboard: business owners can create rewards for customers in their business
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- 3. UPDATE Policy: Allow customers to update their own rewards, dashboard users to update rewards for their business
CREATE POLICY "customer_rewards_update_policy" ON "public"."customer_rewards"
FOR UPDATE
TO authenticated
USING (
  -- Customer app: customers can update their own rewards
  customer_id = auth.uid()
  OR
  -- Dashboard: business owners can update rewards for their business
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  -- Same conditions for the updated data
  customer_id = auth.uid()
  OR
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- 4. DELETE Policy: Allow customers to delete their own rewards, dashboard users to delete rewards for their business
CREATE POLICY "customer_rewards_delete_policy" ON "public"."customer_rewards"
FOR DELETE
TO authenticated
USING (
  -- Customer app: customers can delete their own rewards
  customer_id = auth.uid()
  OR
  -- Dashboard: business owners can delete rewards for their business
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
); 